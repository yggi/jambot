// @vitest-environment node
import {
  ANY_INPUT,
  AS_PLAYED,
  DEFAULT_PROFILE,
  DRUM_PRESETS,
  KEYS,
  activeSetup,
  addOutput,
  chooseDevice,
  fromJambot,
  withClock,
  withCrossing,
  withHeard,
  withProfile,
  type MidiPort,
  type SetupBook,
} from '@yggi/webmidi/core';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CHANNELS, DEFAULT_DRUM_NOTES } from '../audio/midi-out.ts';
import { drumNotesOf } from './drums.ts';
import {
  BAND,
  BAND_ROWS,
  bandRoutes,
  channelsTo,
  drumsTo,
  forwardsOf,
  isHeard,
  listenTo,
  missingOutputs,
  nameByPorts,
  rowsOfInput,
  withOutputProfile,
} from './patch.ts';

const PORTS = {
  inputs: [
    { id: 'in-1', name: 'Keys' },
    { id: 'in-2', name: 'Pads' },
  ],
  outputs: [
    { id: 'out-1', name: 'Circuit' },
    { id: 'out-2', name: 'Minilogue' },
  ],
};
const NONE = { inputs: [], outputs: [] };

/** The store before the book, as its load read it: what `fromJambot` takes. */
const stored = (over: Record<string, unknown> = {}) => ({
  internal: true,
  channels: DEFAULT_CHANNELS,
  drumMap: {},
  clock: false,
  thru: false,
  thruChannel: 1,
  outPortId: 'none',
  inPortId: 'none',
  ...over,
});

const port = (): MidiPort => ({ send: () => {} });

describe('the band’s rows', () => {
  it('are the five parts, the drums a kit, then the keys', () => {
    expect(BAND_ROWS.map((r) => [r.id, r.kind])).toEqual([
      ['lead', 'voice'],
      ['bass', 'voice'],
      ['pad', 'voice'],
      ['stab', 'voice'],
      ['drums', 'kit'],
      [KEYS, 'voice'],
    ]);
  });
});

describe('what the band sends to each output', () => {
  it('sends a migrated store’s five parts on their channels, in the order it kept them, to its one output', () => {
    const book = fromJambot(stored({ outPortId: 'out-1', clock: true }), PORTS);
    const p = port();
    const [route, ...rest] = bandRoutes(book, () => p);
    expect(rest).toEqual([]);
    expect(route!.key).toBe('o1');
    expect(route!.port).toBe(p);
    expect(Object.entries(route!.channels)).toEqual(Object.entries(DEFAULT_CHANNELS));
    expect(route!.drumNotes).toEqual(DEFAULT_DRUM_NOTES);
    expect(route!.clock).toBe(true);
    expect(route!.latency).toBe(0);
  });

  it('sends each output its device’s drum notes and latency, kept by its port’s name', () => {
    let book = fromJambot(stored({ outPortId: 'out-1' }), PORTS);
    book = withProfile(book, 'Circuit', { drums: DRUM_PRESETS['Novation Circuit']!, latency: 12 });
    const [route] = bandRoutes(book, port);
    expect(route!.drumNotes).toEqual(drumNotesOf(DRUM_PRESETS['Novation Circuit']!));
    expect(route!.latency).toBe(12);
  });

  it('sends a part to every crossing of its row, and leaves out a part not routed to an output', () => {
    let book = fromJambot(stored({ outPortId: 'out-1' }), PORTS);
    const added = addOutput(book, PORTS.outputs[1]);
    book = withCrossing(added.book, BAND, 'lead', added.key, 5);
    book = withCrossing(book, BAND, 'bass', 'o1', undefined);
    book = withClock(book, added.key, true);
    const [first, second] = bandRoutes(book, port);
    expect(first!.channels).toEqual({ lead: 1, pad: 3, stab: 3, drums: 10 });
    expect(first!.clock).toBe(false);
    expect(second!.channels).toEqual({ lead: 5 });
    expect(second!.clock).toBe(true);
  });

  it('gives an output with no device no port, whatever resolves', () => {
    const book = fromJambot(stored(), NONE);
    expect(bandRoutes(book, port)[0]!.port).toBeNull();
  });
});

describe('where a note played is passed on', () => {
  it('passes the keys on to the thru channel of a migrated store, as its thru did', () => {
    const setup = activeSetup(
      fromJambot(stored({ outPortId: 'out-1', thru: true, thruChannel: 16 }), PORTS),
    );
    expect(forwardsOf(setup, [KEYS], 0)).toEqual([{ key: 'o1', channel: 15 }]);
  });

  it('passes nothing on without thru', () => {
    const setup = activeSetup(fromJambot(stored({ outPortId: 'out-1' }), PORTS));
    expect(forwardsOf(setup, [KEYS], 0)).toEqual([]);
  });

  it('keeps the channel a note came in on where its crossing is as played, and sends once per output', () => {
    let book = fromJambot(stored({ outPortId: 'out-1' }), PORTS);
    book = withCrossing(book, BAND, 'in:Keys', 'o1', AS_PLAYED);
    book = withCrossing(book, BAND, ANY_INPUT, 'o1', 4);
    const setup = activeSetup(book);
    expect(forwardsOf(setup, ['in:Keys', ANY_INPUT], 6)).toEqual([{ key: 'o1', channel: 6 }]);
    expect(forwardsOf(setup, ['in:Pads', ANY_INPUT], 6)).toEqual([{ key: 'o1', channel: 3 }]);
  });

  it('sends an input’s notes from every input’s row only when it is heard', () => {
    const book = withHeard(fromJambot(stored(), NONE), [PORTS.inputs[0]!]);
    const setup = activeSetup(book);
    expect(isHeard(setup, 'Keys')).toBe(true);
    expect(isHeard(setup, 'Pads')).toBe(false);
    expect(rowsOfInput(setup, 'Keys')).toEqual(['in:Keys', ANY_INPUT]);
    expect(rowsOfInput(setup, 'Pads')).toEqual(['in:Pads']);
    expect(isHeard(activeSetup(withHeard(book, 'all')), 'Pads')).toBe(true);
  });
});

describe('which inputs are listened to', () => {
  const book = fromJambot(stored(), NONE);

  it('none, when none is heard or routed', () => {
    expect(listenTo(activeSetup(book), PORTS.inputs)).toBe('none');
  });

  it('one heard alone by its id, so no other port is opened', () => {
    expect(listenTo(activeSetup(withHeard(book, [PORTS.inputs[1]!])), PORTS.inputs)).toBe('in-2');
  });

  it('one routed and not heard, too', () => {
    const routed = withCrossing(book, BAND, 'in:Pads', 'o1', 2);
    expect(listenTo(activeSetup(routed), PORTS.inputs)).toBe('in-2');
  });

  it('all, when all are heard, or more than one is wanted, or the one wanted isn’t plugged in', () => {
    expect(listenTo(activeSetup(withHeard(book, 'all')), PORTS.inputs)).toBe('all');
    const two = withCrossing(withHeard(book, [PORTS.inputs[0]!]), BAND, 'in:Pads', 'o1', 2);
    expect(listenTo(activeSetup(two), PORTS.inputs)).toBe('all');
    expect(listenTo(activeSetup(withHeard(book, [PORTS.inputs[0]!])), [])).toBe('all');
  });
});

describe('naming the ports a store kept by id alone', () => {
  const cases: [string, Record<string, unknown>][] = [
    [
      'an output with a drum map',
      { outPortId: 'out-1', drumMap: DRUM_PRESETS['Novation Circuit'] },
    ],
    [
      'an input heard and thru',
      { outPortId: 'out-1', inPortId: 'in-2', thru: true, thruChannel: 3 },
    ],
    ['all inputs and thru', { outPortId: 'out-2', inPortId: 'all', thru: true }],
    ['the clock, and nothing heard', { outPortId: 'out-1', clock: true }],
    ['nothing chosen', {}],
  ];
  for (const [name, over] of cases)
    it(`makes the book fromJambot makes with the ports known: ${name}`, () => {
      expect(nameByPorts(fromJambot(stored(over), NONE), PORTS)).toEqual(
        fromJambot(stored(over), PORTS),
      );
    });

  it('is the same book when there is nothing to name, so nothing is saved', () => {
    const book = fromJambot(stored({ outPortId: 'out-1' }), PORTS);
    expect(nameByPorts(book, PORTS)).toBe(book);
    const unplugged = fromJambot(stored({ outPortId: 'gone' }), NONE);
    expect(nameByPorts(unplugged, PORTS)).toBe(unplugged);
  });

  it('makes no custom variant: the setup in use stays the named one', () => {
    const book = nameByPorts(fromJambot(stored({ outPortId: 'out-1' }), NONE), PORTS);
    expect(book.setups.map((s) => s.name)).toEqual(['Jambot']);
  });
});

describe('an output’s device profile', () => {
  it('is changed by its port’s name, in every setup', () => {
    const book = fromJambot(stored({ outPortId: 'out-1' }), PORTS);
    const output = activeSetup(book).outputs[0]!;
    const changed = withOutputProfile(book, output, { latency: 7 });
    expect(changed.devices.Circuit!.latency).toBe(7);
    expect(changed.defaults).toEqual(DEFAULT_PROFILE);
  });

  it('is the defaults for an output kept by id alone', () => {
    const book = fromJambot(stored({ outPortId: 'out-1' }), NONE);
    const output = activeSetup(book).outputs[0]!;
    const changed = withOutputProfile(book, output, { latency: 7 });
    expect(changed.defaults.latency).toBe(7);
    expect(changed.devices).toEqual({});
  });
});

describe('what the inspector shows of an output', () => {
  const book: SetupBook = chooseDevice(
    fromJambot(stored({ thru: true, thruChannel: 3 }), NONE),
    'o1',
    PORTS.outputs[0]!,
  );
  const setup = activeSetup(book);

  it('the channels routed to it, the keys’ too', () => {
    expect(channelsTo(setup, 'o1').sort((a, b) => a - b)).toEqual([1, 2, 3, 10]);
    expect(channelsTo(setup, 'o9')).toEqual([]);
  });

  it('whether the drums go there', () => {
    expect(drumsTo(setup, 'o1')).toBe(true);
    expect(drumsTo(activeSetup(withCrossing(book, BAND, 'drums', 'o1', undefined)), 'o1')).toBe(
      false,
    );
  });

  it('how many of the setup’s devices aren’t plugged in', () => {
    expect(missingOutputs(setup, PORTS.outputs)).toBe(0);
    expect(missingOutputs(setup, [])).toBe(1);
  });
});
