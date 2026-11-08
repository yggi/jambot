// @vitest-environment node
import {
  DEFAULT_PRESET,
  DEFAULT_PROFILE,
  DRUM_PRESETS,
  KEYS,
  activeSetup,
  addOutput,
  BUILT_IN,
  HEARD,
  applyPreset,
  chooseDevice,
  forwardsOf,
  fromJambot,
  withClock,
  withCrossing,
  withPlays,
  withBuiltIn,
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
  wantsInputs,
  missingOutputs,
  synthParts,
  synthPlays,
  withSynth,
  nameByPorts,
  partPlayed,
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
  it('are the five parts, the drums a kit with its sounds, then the keys; an input plays any part (#564), not the keys', () => {
    expect(BAND_ROWS.map((r) => [r.id, r.kind, r.playable ?? true])).toEqual([
      ['lead', 'voice', true],
      ['bass', 'voice', true],
      ['pad', 'voice', true],
      ['stab', 'voice', true],
      ['drums', 'kit', true],
      ...(
        ['kick', 'rim', 'snare', 'clap', 'closedHat', 'pedalHat', 'openHat', 'ride'] as const
      ).map((sound) => [`drum:${sound}`, 'member', true]),
      [KEYS, 'voice', false],
    ]);
    expect(BAND_ROWS.filter((r) => r.kind === 'member').map((r) => r.note)).toEqual([
      36, 37, 38, 39, 42, 44, 46, 51,
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

describe('where a note played is passed on (webmidi’s forwardsOf)', () => {
  it('passes the keys on to the thru channel of a migrated store, as its thru did', () => {
    const book = fromJambot(stored({ outPortId: 'out-1', thru: true, thruChannel: 16 }), PORTS);
    expect(forwardsOf(book, BAND, KEYS, [0x90, 60, 100])).toEqual([
      { output: 'o1', data: [0x9f, 60, 100] },
    ]);
    expect(forwardsOf(book, BAND, KEYS, [0x80, 60, 0])).toEqual([
      { output: 'o1', data: [0x8f, 60, 0] },
    ]);
  });

  it('passes nothing on without thru', () => {
    const book = fromJambot(stored({ outPortId: 'out-1' }), PORTS);
    expect(forwardsOf(book, BAND, KEYS, [0x90, 60, 100])).toEqual([]);
  });
});

describe('the part an input plays (yggi/webmidi#43)', () => {
  it('a migrated store’s heard input plays the default: by its channel, as before; one not heard, nothing', () => {
    const book = fromJambot(stored({ inPortId: 'in-1' }), PORTS);
    expect([
      partPlayed(book, 'Keys', 0),
      partPlayed(book, 'Keys', 9),
      partPlayed(book, 'Pads', 0),
    ]).toEqual(['lead', 'drums', null]);
    const all = fromJambot(stored({ inPortId: 'all' }), PORTS);
    expect(partPlayed(all, 'Pads', 9)).toBe('drums');
  });

  it('the part chosen, whatever the channel: any of the five (#564)', () => {
    const book = fromJambot(stored({ inPortId: 'in-1' }), PORTS);
    expect(partPlayed(withPlays(book, 'in:Keys', { row: 'drums', role: 'drums' }), 'Keys', 0)).toBe(
      'drums',
    );
    for (const part of ['bass', 'pad', 'stab'] as const)
      expect(partPlayed(withPlays(book, 'in:Keys', { row: part, role: part }), 'Keys', 9)).toBe(
        part,
      );
    expect(partPlayed(withPlays(book, 'in:Keys', 'none'), 'Keys', 0)).toBeNull();
  });

  it('a preset assigns by the parts’ roles: a keyboard plays the lead, pads the drums', () => {
    const keyStep = { id: 'k', name: 'Arturia KeyStep 37' };
    const mpd = { id: 'p', name: 'MPD218' };
    const book = applyPreset(fromJambot(stored(), NONE), DEFAULT_PRESET, [keyStep, mpd], BAND_ROWS);
    expect([partPlayed(book, 'Arturia KeyStep 37', 9), partPlayed(book, 'MPD218', 0)]).toEqual([
      'lead',
      'drums',
    ]);
    expect(BAND_ROWS.filter((r) => r.role).map((r) => [r.id, r.role])).toEqual([
      ['lead', 'lead'],
      ['bass', 'bass'],
      ['pad', 'pad'],
      ['stab', 'stab'],
      ['drums', 'drums'],
    ]);
  });
});

describe('the inputs a load connects again for', () => {
  it('those heard or routed, plugged in or not; none in a store that chose none', () => {
    const book = fromJambot(stored(), NONE);
    expect(wantsInputs(activeSetup(book))).toBe(false);
    expect(wantsInputs(activeSetup(withPlays(book, 'in:Keys', 'default')))).toBe(true);
    expect(wantsInputs(activeSetup(withCrossing(book, BAND, 'in:Pads', 'o1', 2)))).toBe(true);
    expect(wantsInputs(activeSetup(withPlays(book, 'in:Keys', 'none')))).toBe(false);
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

describe('the built-in synth, a column of the setup (yggi/webmidi decision 004)', () => {
  const book = () => fromJambot(stored(), NONE);

  it('plays the parts its column crosses, and none without the column', () => {
    let b = withBuiltIn(book(), true, { [BAND]: ['lead', 'drums'] });
    expect(synthParts(b)).toEqual(['lead', 'drums']);
    expect([synthPlays(b, 'lead'), synthPlays(b, 'bass')]).toEqual([true, false]);
    b = withBuiltIn(b, false);
    expect(synthParts(b)).toEqual([]);
  });

  it('is no output the band sends MIDI to, nor one missing', () => {
    const b = withBuiltIn(chooseDevice(book(), 'o1', { id: 'out-1', name: 'Synth' }), true);
    expect(bandRoutes(b, () => null).map((r) => r.key)).toEqual(['o1']);
    expect(missingOutputs(activeSetup(b), [])).toBe(1);
    expect(missingOutputs(activeSetup(b), [{ id: 'out-1', name: 'Synth' }])).toBe(0);
  });

  it('moves the switch into a setup as it is: on, first, playing every part beside its channels; off, nothing; once', () => {
    const setup = activeSetup(book());
    const on = withSynth(setup, true);
    expect(on.outputs).toEqual([BUILT_IN, ...setup.outputs]);
    expect(on.routes[BAND]!.lead).toEqual({ o1: 1, builtin: HEARD });
    expect(on.routes[BAND]![KEYS]).toBeUndefined();
    expect([withSynth(setup, false), withSynth(on, true)]).toEqual([setup, on]);
  });
});
