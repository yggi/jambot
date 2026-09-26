/**
 * The primitive: k of n, placed as evenly as possible.
 *
 * One operator gives both rhythms and scales (Clough and Douthett's maximally
 * even sets):
 * - 5 of 16 is the prototype's rim pattern;
 * - 7 of 12 is the diatonic set, and its rotations are the modes;
 * - 5 of 12 is the pentatonic set.
 *
 * For coprime k and n, the same set is also the arc of k steps of its
 * generator g = k⁻¹ mod n, stacked from 0. For 7 of 12, g = 7, so the
 * diatonic set is a stack of fifths: the circle of fifths and the Euclidean
 * rhythm are one structure.
 *
 * Sets are sorted arrays of positions in 0..n-1: steps of a bar, or pitch
 * classes.
 */

/**
 * k of n as evenly as possible, starting on 0 and shifted later by
 * `rotation`.
 *
 * Position j is in the set when ((j − rotation) mod n) · k mod n < k. This is
 * the form the prototype uses, and play-aeiou and quintenzirkel agree with
 * it. Strudel's Bjorklund form gives the same set up to a rotation, and a
 * different rotation for 46 of the 120 (k, n) pairs with k < n ≤ 16 (#8).
 */
export function even(k: number, n: number, rotation = 0): number[] {
  const set: number[] = [];
  for (let j = 0; j < n; j++) {
    if ((mod(j - rotation, n) * k) % n < k) set.push(j);
  }
  return set;
}

/** Every position moved `by` steps later, wrapping around n. */
export function shift(set: readonly number[], by: number, n: number): number[] {
  return set.map((x) => mod(x + by, n)).sort((a, b) => a - b);
}

/** Distances from each member to the next, wrapping around n. */
export function gaps(set: readonly number[], n: number): number[] {
  return set.map((x, i) => (i + 1 < set.length ? set[i + 1]! - x : set[0]! + n - x));
}

/**
 * The step whose stack gives `even(k, n)`: g with g · k ≡ 1 (mod n). It
 * exists only for coprime k and n. For 7 of 12 it is 7, the fifth.
 */
export function generator(k: number, n: number): number {
  for (let g = 0; g < n; g++) if (mod(g * k, n) === mod(1, n)) return g;
  throw new Error(`generator: ${k} and ${n} are not coprime, so ${k} of ${n} has no generator`);
}

/**
 * True when the set is as even as possible: for every d, the spans from each
 * member to the d-th next member take at most two sizes, one apart.
 */
export function isMaximallyEven(set: readonly number[], n: number): boolean {
  const k = set.length;
  for (let d = 1; d < k; d++) {
    const spans = set.map((x, i) => mod(set[(i + d) % k]! - x, n));
    if (Math.max(...spans) - Math.min(...spans) > 1) return false;
  }
  return true;
}

export function mod(x: number, n: number): number {
  return ((x % n) + n) % n;
}
