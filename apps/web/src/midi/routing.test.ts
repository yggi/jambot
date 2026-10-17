// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { MidiPort } from '../audio/midi-out.ts';
import { DRUM_CHANNEL, partOf, routeNote } from './routing.ts';

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

describe('partOf', () => {
  it('plays the pads on channel 10, the keyboard on every other', () => {
    expect(DRUM_CHANNEL).toBe(9);
    expect(partOf(9)).toBe('drums');
    for (const channel of [0, 1, 8, 10, 15]) expect(partOf(channel)).toBe('lead');
  });
});
