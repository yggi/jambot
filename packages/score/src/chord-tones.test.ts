// A chord as degrees of its key (`chordTones`), as the score writes a harmony: every quality, and every diatonic chord.
import {
  CHORD_QUALITIES,
  DIATONIC_MODE_NAMES,
  diatonicMode,
  heightOf,
  splitChord,
} from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { QUALITY_DEGREES, chordTones } from './section-text.ts';

describe('chordTones', () => {
  it('knows the degrees of every quality the theory names, but the harmonics, which are no chord (#702)', () => {
    const named = Object.keys(CHORD_QUALITIES).filter((q) => q !== 'harmonics');
    expect(named.filter((q) => !(q in QUALITY_DEGREES))).toEqual([]);
    for (const q of named)
      expect(QUALITY_DEGREES[q]!.length, q).toBe(CHORD_QUALITIES[q]!.stack.length);
  });

  it('writes every triad, seventh and ninth of every degree of every mode as degrees that sound its notes (#702)', () => {
    let chords = 0;
    for (const mode of DIATONIC_MODE_NAMES)
      for (const tonic of [0, 7])
        for (const degree of [0, 1, 2, 3, 4, 5, 6])
          for (const size of [3, 4, 5]) {
            const scale = diatonicMode(mode);
            const heights = Array.from(
              { length: size },
              (_, i) => tonic + heightOf(scale, degree + 2 * i),
            );
            const tones = chordTones({ tonic, mode }, splitChord(heights)!);
            expect(
              tones.map((t) => tonic + heightOf(scale, t.degree) + t.accidental),
              `${mode} on ${tonic}, degree ${degree}, ${size} notes`,
            ).toEqual(heights);
            chords++;
          }
    expect(chords).toBe(7 * 2 * 7 * 3);
  });
});
