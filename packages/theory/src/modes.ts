/**
 * Modes are rotations of an even set, each moved so that it starts on 0.
 *
 * They are ordered along the generator g = k⁻¹ mod n: each next mode starts
 * one generator step further along the arc. From one mode to the next,
 * exactly one note moves by one step. For 7 of 12 the generator is the fifth,
 * so the order runs from the brightest mode (Lydian) to the darkest
 * (Locrian), lowering one note at a time.
 */

import { even, mod, shift } from './even.ts';

export function modes(k: number, n: number): number[][] {
  const generator = inverse(k, n);
  const set = even(k, n);
  return set.map((_, b) => shift(set, -generator * b, n));
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

/** g with g · k ≡ 1 (mod n). It exists only for coprime k and n. */
function inverse(k: number, n: number): number {
  for (let g = 1; g < n; g++) if (mod(g * k, n) === 1) return g;
  throw new Error(`modes: ${k} and ${n} are not coprime, so ${k} of ${n} has no generator`);
}
