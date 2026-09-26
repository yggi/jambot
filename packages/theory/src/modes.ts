/**
 * Modes are rotations of an even set, each moved so that it starts on 0.
 *
 * They are ordered along the set's generator (see `generator`): each next mode starts
 * one generator step further along the arc. From one mode to the next,
 * exactly one note moves by one step. For 7 of 12 the generator is the fifth,
 * so the order runs from the brightest mode (Lydian) to the darkest
 * (Locrian), lowering one note at a time.
 */

import { even, generator, mod, shift } from './even.ts';

export function modes(k: number, n: number): number[][] {
  const g = generator(k, n);
  const set = even(k, n);
  return set.map((_, b) => shift(set, -g * b, n));
}

/**
 * The set re-rooted on its d-th member: the modes in scale order, as "mode k"
 * means in the sister projects. `rotate(ionian, 1)` is dorian.
 */
export function rotate(set: readonly number[], d: number, n = 12): number[] {
  return shift(set, -set[mod(d, set.length)]!, n);
}

/** The diatonic modes, in the order of `modes(7, 12)`. */
export const DIATONIC_MODE_NAMES = [
  'lydian',
  'ionian',
  'mixolydian',
  'dorian',
  'aeolian',
  'phrygian',
  'locrian',
] as const;

export type DiatonicModeName = (typeof DIATONIC_MODE_NAMES)[number];

export function diatonicMode(name: DiatonicModeName): number[] {
  return modes(7, 12)[DIATONIC_MODE_NAMES.indexOf(name)]!;
}
