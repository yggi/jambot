import { positions } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import type { BarChord } from './chords.ts';
import { HISTORY_DECAY, NO_HISTORY, centre, foldBar, keyWeight } from './history.ts';
import { COMPOSER_MODES, type Key, keyHelix } from './key.ts';

/** A chord on `step` of heights `heights` (its helix alone). */
const chordAt = (step: number, heights: number[]): BarChord => ({
  slot: { step, degree: 0 },
  raised: false,
  chord: { helix: { cycle: 12, heights }, tensions: [] },
});

/** A history holding only `key`'s scale, each pitch class weighing 1. */
const scaleOf = (key: Key) => {
  const weights = [...NO_HISTORY];
  for (const pitchClass of positions(keyHelix(key))) weights[pitchClass] = 1;
  return weights;
};

describe('the harmonic history', () => {
  it('adds each chord’s pitch classes by its length in bars, after decaying the bar before', () => {
    const before = [...NO_HISTORY];
    before[0] = 1;
    // A minor for half the bar, then E major (G♯ outside the key).
    const after = foldBar(before, [chordAt(0, [9, 12, 16]), chordAt(8, [4, 8, 11])]);
    const expected = [...NO_HISTORY];
    expected[0] = HISTORY_DECAY + 0.5;
    expected[9] = 0.5;
    expected[4] = 1;
    expected[8] = 0.5;
    expected[11] = 0.5;
    expect(after).toEqual(expected);
  });

  it('counts a pitch class once per chord, however many octaves hold it', () => {
    expect(foldBar(NO_HISTORY, [chordAt(0, [9, 12, 16, 21])])[9]).toBe(1);
  });

  it('only decays through a bar without chords, and never goes negative', () => {
    const one = foldBar(NO_HISTORY, [chordAt(0, [0, 4, 7])]);
    const silent = foldBar(one, []);
    expect(silent).toEqual(one.map((w) => w * HISTORY_DECAY));
    for (const w of silent) expect(w).toBeGreaterThanOrEqual(0);
  });

  it('weighs a key by its scale’s pitch classes', () => {
    const a = { tonic: 9, mode: 'aeolian' } as const;
    expect(keyWeight(scaleOf(a), a)).toBe(7);
    expect(keyWeight(scaleOf(a), { tonic: 4, mode: 'aeolian' })).toBe(6);
  });

  it('centres a history of one key’s scale on that key, for every mode and tonic, from any key', () => {
    for (const mode of COMPOSER_MODES)
      for (let tonic = 0; tonic < 12; tonic++) {
        const key = { tonic, mode };
        for (let from = 0; from < 12; from++)
          expect(
            centre(scaleOf(key), { tonic: from, mode }),
            `${mode} ${tonic} from ${from}`,
          ).toEqual(key);
      }
  });

  it('centres an empty history, or a tie, on the key it is asked from', () => {
    for (const mode of COMPOSER_MODES)
      for (let tonic = 0; tonic < 12; tonic++)
        expect(centre(NO_HISTORY, { tonic, mode })).toEqual({ tonic, mode });
  });
});
