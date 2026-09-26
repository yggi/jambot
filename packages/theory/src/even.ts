/**
 * The primitive: k of n, placed as evenly as possible.
 *
 * One operator gives both rhythms and scales (Clough and Douthett's maximally
 * even sets):
 * - 5 of 16 is the prototype's rim pattern;
 * - 7 of 12 is the diatonic set, and its modes are the church modes;
 * - 5 of 12 is the pentatonic set.
 *
 * For coprime k and n, the same set is also the arc of k steps of its
 * generator g = k⁻¹ mod n, stacked from 0. For 7 of 12, g = 7, so the
 * diatonic set is a stack of fifths: the circle of fifths and the Euclidean
 * rhythm are one structure.
 */

import { type Helix, heightOf, mod, shift as shiftHelix } from './helix.ts';

/**
 * k of n as evenly as possible: degree 0 at 0, then shifted by `shift`, the
 * degrees kept.
 *
 * Position j is in the unshifted set when j · k mod n < k. This is the form
 * the prototype uses, and play-aeiou and quintenzirkel agree with it.
 * Strudel's Bjorklund form gives the same set up to a rotation, and a
 * different rotation for 46 of the 120 (k, n) pairs with k < n ≤ 16 (#8).
 */
export function even(k: number, n: number, shift = 0): Helix {
  const heights: number[] = [];
  for (let j = 0; j < n; j++) {
    if ((j * k) % n < k) heights.push(j);
  }
  return shiftHelix({ cycle: n, heights }, shift);
}

/**
 * True when the helix is as even as possible: for every d, the spans from
 * each degree to the d-th next degree take at most two sizes, one apart.
 */
export function isEven(helix: Helix): boolean {
  const k = helix.heights.length;
  for (let d = 1; d < k; d++) {
    const spans = helix.heights.map((_, e) => heightOf(helix, e + d) - heightOf(helix, e));
    if (Math.max(...spans) - Math.min(...spans) > 1) return false;
  }
  return true;
}

/**
 * The step whose stack gives `even(k, n)`: g with g · k ≡ 1 (mod n). It
 * exists only for coprime k and n. For 7 of 12 it is 7, the fifth.
 */
export function generator(k: number, n: number): number {
  for (let g = 0; g < n; g++) if (mod(g * k, n) === mod(1, n)) return g;
  throw new Error(`generator: ${k} and ${n} are not coprime, so ${k} of ${n} has no generator`);
}
