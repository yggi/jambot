import { METERS, heightOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import type { LineNote } from './bass-query.ts';
import type { BarChord } from './chords.ts';
import { SONG_CLOCK } from './events.ts';
import { type Key, keyHelix } from './key.ts';
import { LINE_FEWEST, distilledLine, heardBass, lineOf } from './muse-line.ts';

const KEY: Key = { tonic: 9, mode: 'aeolian' };
/** A chord of the key's degrees, at a slot's step. */
const chord = (step: number, degrees: readonly number[]): BarChord => ({
  slot: { step, degree: degrees[0]! } as BarChord['slot'],
  raised: false,
  chord: {
    helix: { cycle: 12, heights: degrees.map((d) => heightOf(keyHelix(KEY), d)) },
    tensions: [],
  },
});
// A minor, then F major on the bar's half; the next bar opens on D minor.
const CHORDS = [chord(0, [0, 2, 4]), chord(8, [5, 7, 9])];
const NEXT = [chord(0, [3, 5, 7])];
const at = (step: number, more: Partial<LineNote> = {}): LineNote => ({
  step,
  chord: 0,
  index: 0,
  alter: 0,
  shift: 0,
  ...more,
});

describe('the Muse hears a bass as a line over the chord in force (#423)', () => {
  it('reads a tone of the chord as its index, the next chord’s root and a semitone off it, and else the root moved', () => {
    // A, C, E over A minor; F (the next chord's root) at 6, E (a semitone under it) at 7 is the fifth: a tone first;
    // over F major, its A at 9, D (the next bar's root) at 14 and C# (a semitone under it) at 15, then B at 11, off both
    const notes = [
      { step: 0, note: 33 },
      { step: 2, note: 36 },
      { step: 4, note: 40 },
      { step: 6, note: 41 },
      { step: 7, note: 40 },
      { step: 9, note: 45 },
      { step: 11, note: 47 },
      { step: 14, note: 38 },
      { step: 15, note: 37 },
    ];
    expect(lineOf(notes, CHORDS, NEXT)).toEqual([
      at(0),
      at(2, { index: 1 }),
      at(4, { index: 2 }),
      at(6, { chord: 1 }),
      at(7, { index: 2 }),
      at(9, { index: 1 }),
      at(11, { shift: 6 - 12 }),
      at(14, { chord: 1 }),
      at(15, { chord: 1, shift: -1 }),
    ]);
  });

  it('keeps the lowest note where two sound on a step', () => {
    expect(
      lineOf(
        [
          { step: 0, note: 45 },
          { step: 0, note: 33 },
          { step: 0, note: 40 },
        ],
        CHORDS,
        NEXT,
      ),
    ).toEqual([at(0)]);
  });

  it('distils a section into the bar its bars play most, the first that plays it, and none of fewer than two notes', () => {
    expect(LINE_FEWEST).toBe(2);
    const a = [at(0), at(8)];
    const b = [at(0), at(8, { index: 2 })];
    expect(distilledLine([b, a, a, b, a])).toBe(a);
    expect(distilledLine([b, a])).toBe(b);
    expect(distilledLine([[at(0)], [at(4)]])).toBeNull();
  });

  it('hears a source whose every note of the bar lies at or below the bass’s top, 57, on the step she rounds it to', () => {
    const heard = [
      { note: 33, velocity: 90, source: 'Ada', position: 16 - 0.2, end: null },
      { note: 40, velocity: 90, source: 'Ada', position: 16 + 8.3, end: null },
      { note: 33, velocity: 90, source: 'Bo', position: 16, end: null },
      { note: 69, velocity: 90, source: 'Bo', position: 16 + 4, end: null },
      { note: 57, velocity: 90, source: 'Cy', position: 16 + 2, end: null },
    ];
    // Ada's E on the half lies a semitone under F major's root, and off D minor's: the root moved down a semitone
    expect(heardBass(heard, 1, METERS['4/4'], SONG_CLOCK, CHORDS, NEXT)).toEqual([
      { source: 'Ada', bar: 1, notes: [at(0), at(8, { shift: -1 })] },
      { source: 'Cy', bar: 1, notes: [at(2)] },
    ]);
  });
});
