import { describe, expect, it } from 'vitest';
import { keyboardLayout } from '@yggi/webmidi/core';
import { scaleLayout } from './keyboard.ts';
import { EDGE, NOW_AT, ROLL_AHEAD, ROLL_BEHIND, rollBars, rollNotes, rollY } from './rollView.ts';

const keys = keyboardLayout(60, 76);
const note = (step: number, pitch: number, length = 2) => ({ step, note: pitch, length });

describe('the roll’s time', () => {
  it('puts the step heard on the line, the steps ahead above it and those played below', () => {
    expect(rollY(40, 40)).toBe(NOW_AT);
    expect(rollY(40 + ROLL_AHEAD, 40)).toBeCloseTo(0, 12);
    expect(rollY(40 - ROLL_BEHIND, 40)).toBeCloseTo(1, 12);
    expect(rollY(44, 40)).toBeLessThan(rollY(42, 40));
  });

  it('draws a line where each bar starts, of those on the roll', () => {
    const lines = rollBars([16, 32, 48, 64, 80], 40);
    expect(lines).toHaveLength(2);
    expect(lines).toEqual([rollY(32, 40), rollY(48, 40)]);
  });
});

describe('the roll’s notes', () => {
  it('stand on the key that plays them, as wide as it', () => {
    const [a4] = rollNotes({ keys, playhead: 40, band: [note(44, 69)], players: [] });
    const key = keys.find((k) => k.note === 69)!;
    expect(a4!.left).toBeCloseTo(key.left / 100, 12);
    expect(a4!.width).toBeCloseTo(key.width / 100, 12);
  });

  it('fall: a note ahead is above the line, foreseen, and ends where it starts on the way down', () => {
    const [ahead] = rollNotes({ keys, playhead: 40, band: [note(44, 69, 4)], players: [] });
    expect(ahead!.kind).toBe('foreseen');
    expect(ahead!.top).toBeCloseTo(rollY(48, 40), 12);
    expect(ahead!.top + ahead!.height).toBeCloseTo(rollY(44, 40), 12);
    expect(ahead!.top + ahead!.height).toBeLessThan(NOW_AT);
  });

  it('are played once they start, crossing the line while they sound', () => {
    const [sounding] = rollNotes({ keys, playhead: 40, band: [note(39, 69, 4)], players: [] });
    expect(sounding!.kind).toBe('played');
    expect(sounding!.top).toBeLessThan(NOW_AT);
    expect(sounding!.top + sounding!.height).toBeGreaterThan(NOW_AT);
  });

  it('are clipped to the roll, and left out where they are off it', () => {
    const notes = rollNotes({
      keys,
      playhead: 40,
      band: [note(40 + ROLL_AHEAD + 1, 69), note(40 - ROLL_BEHIND - 4, 69), note(62, 69, 8)],
      players: [],
    });
    expect(notes).toHaveLength(1);
    expect(notes[0]!.top).toBe(0);
  });

  it('mark a note beyond the keys at the edge it is beyond: above at the right, below at the left', () => {
    const [above, below] = rollNotes({
      keys,
      playhead: 40,
      band: [note(44, 84), note(44, 48)],
      players: [],
    });
    expect(above).toMatchObject({ beyond: 'above', width: EDGE });
    expect(above!.left).toBeCloseTo(1 - EDGE, 12);
    expect(below).toMatchObject({ beyond: 'below', left: 0, width: EDGE });
  });

  it('leave out a note between the keys of a scale locked, which is neither above nor below them', () => {
    const locked = scaleLayout(60, 76, [9, 11, 0, 2, 4, 5, 7]);
    expect(rollNotes({ keys: locked, playhead: 40, band: [note(44, 70)], players: [] })).toEqual(
      [],
    );
  });

  it('are the players’ too, their own and another’s apart, in their colour', () => {
    const notes = rollNotes({
      keys,
      playhead: 40,
      band: [],
      players: [
        { notes: [note(36, 72)], colour: 2, local: true },
        { notes: [note(38, 74)], colour: 3, local: false },
      ],
    });
    expect(notes.map((n) => [n.kind, n.colour])).toEqual([
      ['own', 2],
      ['other', 3],
    ]);
  });
});
