/**
 * The harmonic history: which pitch classes the band's harmony has sounded
 * lately, one weight per pitch class, for the key to follow (#169).
 *
 * Each bar decided folds in its chords: every weight decays by
 * `HISTORY_DECAY`, then each chord adds its length in bars to each of its
 * pitch classes. It reads the chords, not the notes the parts write, because
 * the chords are decided a bar ahead and for a passed bar alike, so the
 * forecast (`lookAhead`) folds exactly what the band then plays.
 *
 * Its centre is the key in a mode whose scale weighs most in it: where the
 * band has been, which is the home the players' key licence is measured
 * from, and what the band's own drift leans toward (`bandWish`, `plan.ts`).
 */

import { diatonicMode, joinChord, mod, positions } from '@jambot/theory';
import { BAR_STEPS } from './events.ts';
import type { BarChord } from './chords.ts';
import { COMPOSER_MODES, type ComposerMode, type Key } from './key.ts';

/** One weight per pitch class, 0–11, C = 0; never negative. */
export type HarmonicWeights = readonly number[];

export const NO_HISTORY: HarmonicWeights = new Array(12).fill(0);

/** What a bar's weight keeps into the next: roughly four bars' worth of memory. */
export const HISTORY_DECAY = 0.85;

/**
 * A bar's chords folded into the history: every weight decays a bar, then
 * each chord adds its length, in bars, to each pitch class it holds once.
 */
export function foldBar(history: HarmonicWeights, chords: readonly BarChord[]): HarmonicWeights {
  const weights = history.map((w) => w * HISTORY_DECAY);
  chords.forEach(({ slot, chord }, i) => {
    const length = ((chords[i + 1]?.slot.step ?? BAR_STEPS) - slot.step) / BAR_STEPS;
    for (const pitchClass of new Set(joinChord(chord).map((h) => mod(h, 12))))
      weights[pitchClass]! += length;
  });
  return weights;
}

/** Each mode's pitch classes on C, read once: a key's are these moved to its tonic. */
const ON_C = new Map<ComposerMode, readonly number[]>(
  COMPOSER_MODES.map((mode) => [mode, positions(diatonicMode(mode))]),
);

/** How much a key's scale weighs in the history: the sum of its pitch classes' weights. */
export function keyWeight(history: HarmonicWeights, key: Key): number {
  let sum = 0;
  for (const pitchClass of ON_C.get(key.mode)!) sum += history[(pitchClass + key.tonic) % 12]!;
  return sum;
}

/**
 * The history's centre in `key`'s mode: the key in that mode whose scale
 * weighs most, `key` itself where it ties for most, as before anything is
 * heard; among other ties, the nearest to `key` round the tonics.
 */
export function centre(history: HarmonicWeights, key: Key): Key {
  let best = key;
  let most = keyWeight(history, key);
  for (let apart = 1; apart <= 6; apart++)
    for (const tonic of [mod(key.tonic + apart, 12), mod(key.tonic - apart, 12)]) {
      const candidate = { tonic, mode: key.mode };
      const weight = keyWeight(history, candidate);
      if (weight > most) [best, most] = [candidate, weight];
    }
  return best;
}
