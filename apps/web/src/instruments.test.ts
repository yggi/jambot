/**
 * The instruments' MIDI in (#564): a note from an input plays along on the
 * part its input plays, any of the band's, and is captured for the Muse on
 * that part; one with no part given plays as its channel says.
 */

import { describe, expect, it } from 'vitest';
import type { Device } from './device.svelte.ts';
import { Instruments } from './instruments.svelte.ts';
import type { AlongPart, Player } from './player.svelte.ts';

function made() {
  const along: [AlongPart, number][] = [];
  const captured: [AlongPart, number, string][] = [];
  const player = {
    playing: true,
    playAlong: async (part: AlongPart, note: number) => void along.push([part, note]),
    humanNoteOn: (part: AlongPart, note: number, _v: number, source: string) =>
      void captured.push([part, note, source]),
    humanNoteOff: () => {},
  } as unknown as Player;
  const device = {
    clockOf: () => ({ offset: { fromDeviceMs: (ms: number) => ms / 1000 } }),
    forwardKeys: () => {},
  } as unknown as Device;
  return { instruments: new Instruments(player, device), along, captured };
}

const note = (n: number, channel = 0) => ({
  note: n,
  velocity: 100,
  on: true,
  channel,
  timeStamp: 0,
});

describe('MIDI in, on the part its input plays (#564)', () => {
  it('plays along and is captured on any of the five parts', () => {
    const { instruments, along, captured } = made();
    for (const part of ['lead', 'bass', 'pad', 'stab', 'drums'] as const)
      instruments.onMidiNote(note(40), 'Keys', part);
    expect(along.map(([p]) => p)).toEqual(['lead', 'bass', 'pad', 'stab', 'drums']);
    expect(captured.map(([p]) => p)).toEqual(['lead', 'bass', 'pad', 'stab', 'drums']);
  });

  it('lights the on-screen keys for the lead alone, the pads for the drums', () => {
    const { instruments } = made();
    instruments.onMidiNote(note(60), 'Keys', 'bass');
    instruments.onMidiNote(note(62), 'Keys', 'lead');
    instruments.onMidiNote(note(36), 'Pads', 'drums');
    expect([[...instruments.heldLead], [...instruments.heldDrums]]).toEqual([[62], [36]]);
  });

  it('with no part given, plays as its channel says: 10 the drums, any other the lead', () => {
    const { instruments, along } = made();
    instruments.onMidiNote(note(36, 9), 'Pads');
    instruments.onMidiNote(note(60, 0), 'Keys');
    expect(along).toEqual([
      ['drums', 36],
      ['lead', 60],
    ]);
  });
});
