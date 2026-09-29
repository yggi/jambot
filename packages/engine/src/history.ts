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
 *
 * It is a fading memory (`fading.ts`) over the pitch classes, the first
 * instance of the loop every level may run (#210, C9).
 */

import { diatonicMode, joinChord, mod, positions } from '@jambot/theory';
import { BAR_STEPS } from './events.ts';
import type { BarChord } from './chords.ts';
import { type Weights, centreOf, fold } from './fading.ts';
import { COMPOSER_MODES, type ComposerMode, type Key } from './key.ts';

/** One weight per pitch class, 0–11, C = 0; never negative. */
export type HarmonicWeights = Weights;

export const NO_HISTORY: HarmonicWeights = new Array(12).fill(0);

/** What a bar's weight keeps into the next: roughly four bars' worth of memory. */
export const HISTORY_DECAY = 0.85;

/**
 * A bar's chords folded into the history: every weight decays a bar, then
 * each chord adds its length, in bars, to each pitch class it holds once.
 */
export function foldBar(history: HarmonicWeights, chords: readonly BarChord[]): HarmonicWeights {
  return fold(history, HISTORY_DECAY, readingsOf(chords));
}

/** A bar's chords as readings: each chord's length, in bars, to each pitch class it holds once. */
function* readingsOf(chords: readonly BarChord[]): Generator<[number, number]> {
  for (const [i, { slot, chord }] of chords.entries()) {
    const length = ((chords[i + 1]?.slot.step ?? BAR_STEPS) - slot.step) / BAR_STEPS;
    for (const pitchClass of new Set(joinChord(chord).map((h) => mod(h, 12))))
      yield [pitchClass, length];
  }
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
  const outward = [...Array(6).keys()].flatMap((n) => [n + 1, -(n + 1)]);
  const candidates = [
    key,
    ...outward.map((apart) => ({ tonic: mod(key.tonic + apart, 12), mode: key.mode })),
  ];
  return centreOf(candidates, (candidate) => keyWeight(history, candidate));
}
