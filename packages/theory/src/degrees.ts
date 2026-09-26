/**
 * Degrees: counting through a set and on into the next cycles.
 *
 * For a scale this is scale degrees across octaves; for a rhythm it is the
 * d-th onset across bars. The same count serves both.
 */

import { mod } from './even.ts';

/** Where the d-th member of the set lies, counted on through the cycles of n. */
export function degree(set: readonly number[], d: number, n = 12): number {
  const k = set.length;
  return n * Math.floor(d / k) + set[mod(d, k)]!;
}

/** The degree nearest to `position`, ties going to the lower degree. */
export function nearestDegree(set: readonly number[], position: number, n = 12): number {
  const k = set.length;
  const first = k * Math.floor(position / n) - 1;
  let best = first;
  for (let d = first; d <= first + k + 1; d++) {
    if (Math.abs(degree(set, d, n) - position) < Math.abs(degree(set, best, n) - position))
      best = d;
  }
  return best;
}
