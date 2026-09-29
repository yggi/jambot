// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { MidiPort } from '../audio/midi-out.ts';
import type { MidiAccess } from './access.ts';
import { adoptPorts, connectMidi, routeNote } from './routing.ts';

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

function fakePort() {
  const sent: number[][] = [];
  const port: MidiPort = { send: (data) => void sent.push([...data]) };
  return { port, sent };
}

function deps(overrides: Partial<Omit<Parameters<typeof routeNote>[4], 'held'>> = {}) {
  const held = new Set<number>();
  const humanNoteOn = vi.fn();
  const humanNoteOff = vi.fn();
  const playAlong = vi.fn();
  return {
    held,
    humanNoteOn,
    humanNoteOff,
    playing: () => true,
    toOutputSeconds: (ms: number) => ms / 1000,
    thru: () => false,
    thruPort: () => null,
    thruChannel: () => 1,
    playAlong,
    now: () => 5000,
    ...overrides,
  };
}

describe('routeNote', () => {
  it('holds a note on, and releases it off', () => {
    const d = deps();
    routeNote(60, 100, true, 'test', d);
    expect(d.held.has(60)).toBe(true);
    routeNote(60, 0, false, 'test', d);
    expect(d.held.has(60)).toBe(false);
  });

  it('captures a note through the player only while playing, at the mapped time', () => {
    const d = deps({ playing: () => true, now: () => 5000, toOutputSeconds: (ms) => ms / 1000 });
    routeNote(64, 90, true, 'the computer keys', d);
    expect(d.humanNoteOn).toHaveBeenCalledWith(64, 90, 'the computer keys', 5);
  });

  it('reads the clock itself when not given one, as in the browser', () => {
    const humanNoteOn = vi.fn();
    const humanNoteOff = vi.fn();
    const browser = deps({ humanNoteOn, humanNoteOff, toOutputSeconds: (ms) => ms / 1000 });
    delete (browser as Partial<typeof browser>).now;
    const before = performance.now() / 1000;
    routeNote(64, 90, true, 'the computer keys', browser);
    routeNote(64, 0, false, 'the computer keys', browser);
    const on = humanNoteOn.mock.calls[0]![3] as number;
    const off = humanNoteOff.mock.calls[0]![2] as number;
    expect(on).toBeGreaterThanOrEqual(before);
    expect(off).toBeGreaterThanOrEqual(on);
  });

  it('captures a release as a release, at the mapped time, and never as a note', () => {
    const d = deps({ playing: () => true, now: () => 5500, toOutputSeconds: (ms) => ms / 1000 });
    routeNote(60, 0, false, 'the computer keys', d);
    expect(d.humanNoteOff).toHaveBeenCalledWith(60, 'the computer keys', 5.5);
    expect(d.humanNoteOn).not.toHaveBeenCalled();
  });

  it('captures nothing, struck or released, while stopped', () => {
    const stopped = deps({ playing: () => false });
    routeNote(60, 100, true, 'test', stopped);
    routeNote(60, 0, false, 'test', stopped);
    expect(stopped.humanNoteOn).not.toHaveBeenCalled();
    expect(stopped.humanNoteOff).not.toHaveBeenCalled();
  });

  it('sends nothing over thru when thru is off', () => {
    const { port, sent } = fakePort();
    const d = deps({ thru: () => false, thruPort: () => port });
    routeNote(60, 100, true, 'test', d);
    expect(sent).toEqual([]);
  });

  it('sends note on and off over thru, on the chosen channel', () => {
    const { port, sent } = fakePort();
    const d = deps({ thru: () => true, thruPort: () => port, thruChannel: () => 1 });
    routeNote(60, 100, true, 'test', d);
    routeNote(60, 0, false, 'test', d);
    expect(sent).toEqual([
      [NOTE_ON | 0, 60, 100],
      [NOTE_OFF | 0, 60, 0],
    ]);
  });

  it('wraps the thru channel 1–16 to a 0–15 nibble, off by one nowhere', () => {
    const { port, sent } = fakePort();
    const d = deps({ thru: () => true, thruPort: () => port, thruChannel: () => 16 });
    routeNote(60, 100, true, 'test', d);
    expect(sent[0]![0]).toBe(NOTE_ON | 15);
  });

  it('captures and sends thru together, each independent of the other', () => {
    const { port, sent } = fakePort();
    const d = deps({ thru: () => true, thruPort: () => port, playing: () => true });
    routeNote(60, 100, true, 'test', d);
    expect(d.humanNoteOn).toHaveBeenCalledTimes(1);
    expect(sent).toHaveLength(1);
  });

  it('does nothing over thru when there is no port yet, without throwing', () => {
    const d = deps({ thru: () => true, thruPort: () => null });
    expect(() => routeNote(60, 100, true, 'test', d)).not.toThrow();
  });

  it('plays along at once when struck, whether or not the band is playing', () => {
    const playing = deps({ playing: () => true });
    routeNote(60, 90, true, 'test', playing);
    expect(playing.playAlong).toHaveBeenCalledWith(60, 90);

    const stopped = deps({ playing: () => false });
    routeNote(60, 90, true, 'test', stopped);
    expect(stopped.playAlong).toHaveBeenCalledWith(60, 90);
  });

  it('never plays along on a release', () => {
    const d = deps();
    routeNote(60, 100, false, 'test', d);
    expect(d.playAlong).not.toHaveBeenCalled();
  });
});

describe('connectMidi', () => {
  it('passes through the message when the connection fails', async () => {
    const result = await connectMidi(
      async () => 'This browser has no Web MIDI.',
      () => {},
      { outPortId: 'none', inPortId: 'none', outPort: null },
    );
    expect(result).toEqual({ access: null, message: 'This browser has no Web MIDI.' });
  });

  it('adopts the persisted output port and listens to the persisted input', async () => {
    const outPort: MidiPort = { send: () => {} };
    const listen = vi.fn();
    const access = {
      inputs: [{ id: 'in-1', name: 'Keys' }],
      outputs: [{ id: 'out-1', name: 'Synth' }],
      outputPort: vi.fn(() => outPort),
      listen,
    } as unknown as MidiAccess;
    const settings = { outPortId: 'out-1', inPortId: 'in-1', outPort: null as MidiPort | null };

    const result = await connectMidi(
      async () => access,
      () => {},
      settings,
    );

    expect(settings.outPort).toBe(outPort);
    expect(listen).toHaveBeenCalledWith('in-1');
    expect(result.access).toBe(access);
    expect(result.message).toBe('MIDI connected: 1 input, 1 output.');
  });

  it('resolves no output port when none was chosen', async () => {
    const outputPort = vi.fn();
    const access = {
      inputs: [],
      outputs: [],
      outputPort,
      listen: vi.fn(),
    } as unknown as MidiAccess;
    const settings = { outPortId: 'none', inPortId: 'none', outPort: null as MidiPort | null };

    await connectMidi(
      async () => access,
      () => {},
      settings,
    );

    expect(outputPort).not.toHaveBeenCalled();
    expect(settings.outPort).toBeNull();
  });

  it('names several ports in the plural', async () => {
    const access = {
      inputs: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      outputs: [],
      outputPort: vi.fn(),
      listen: vi.fn(),
    } as unknown as MidiAccess;
    const result = await connectMidi(
      async () => access,
      () => {},
      {
        outPortId: 'none',
        inPortId: 'none',
        outPort: null,
      },
    );
    expect(result.message).toBe('MIDI connected: 2 inputs, 0 outputs.');
  });
});

describe('adopting the ports again', () => {
  const port = (id: string) => ({ send: () => {}, id });
  const access = (outputs: Record<string, ReturnType<typeof port>>) => {
    const listened: string[] = [];
    return {
      listened,
      outputPort: (id: string) => outputs[id] ?? null,
      listen: (id: string) => listened.push(id),
    } as unknown as MidiAccess & { listened: string[] };
  };

  it('finds the output chosen before again, and listens to the input chosen before', () => {
    const settings = { outPortId: 'out-1', inPortId: 'in-1', outPort: null as MidiPort | null };
    const live = access({ 'out-1': port('out-1') });
    adoptPorts(live, settings);
    expect(settings.outPort).toBe(live.outputPort('out-1'));
    expect(live.listened).toEqual(['in-1']);
  });

  it('lets go of an output that is gone, and picks up one plugged in again', () => {
    const settings = {
      outPortId: 'out-1',
      inPortId: 'none',
      outPort: port('old') as MidiPort | null,
    };
    adoptPorts(access({}), settings);
    expect(settings.outPort).toBeNull();
    const back = access({ 'out-1': port('out-1') });
    adoptPorts(back, settings);
    expect(settings.outPort).toBe(back.outputPort('out-1'));
  });

  it('has no output where none is chosen', () => {
    const settings = {
      outPortId: 'none',
      inPortId: 'none',
      outPort: port('old') as MidiPort | null,
    };
    adoptPorts(access({ 'out-1': port('out-1') }), settings);
    expect(settings.outPort).toBeNull();
  });
});
