/**
 * E29: the hull of the twelve, and one snap for every sub-grid (#287 step 4)
 *
 * The chromatic cell lives in Z12, a finite space, so a claim about it is
 * tested over every case: the 4,096 subsets of the twelve pitch classes.
 * `snap(subset, n, height)` is the one fit the cell needs, the nearest
 * element of a sub-grid, in any cycle `n` (12 for pitch, 16 for a bar's steps),
 * with the octave (or bar) carried and a tie going to the lower.
 *
 * Counts and claims:
 *
 * - The subsets fall into 352 classes under transposition and 224 under
 *   transposition and inversion.
 * - Z12 is Z3 × Z4 by the remainders of a pitch class: a major third
 *   (4) moves only the remainder mod 3, a minor third (3) only the remainder
 *   mod 4, and a fifth (7 = 4 + 3) moves both, so the circle of fifths is the
 *   diagonal of the 3 × 4 grid and reaches all twelve because 3 and 4 are
 *   coprime.
 * - Its subgroups, one per divisor, are the tritone, the augmented triad, the
 *   diminished seventh, the whole-tone scale: the sets `even(k, 12)` for k
 *   dividing 12.
 * - A window of m fifths is maximally even (`even(m, 12)` in some rotation)
 *   exactly for m of 1, 5, 7, 11 and 12, the m coprime to 12.
 * - A window of 5 fifths lies in a window of 7 in three places.
 * - `snap` gives, over every sub-grid and every height: a member of the
 *   sub-grid, the nearest, the identity on the sub-grid, transposition
 *   equivariant.
 *
 * The same `snap` over Z16 quantizes a bar's steps to any sub-grid of them.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/pitch-hull.ts
 */

import { fileURLToPath } from 'node:url';
import { even } from '@jambot/theory';

const range = (n: number) => [...Array(n).keys()];
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** The nearest member of `grid` (residues mod `n`) to `height`, the lower on a tie; the cycle is carried. */
export function snap(grid: readonly number[], n: number, height: number): number {
  if (grid.length === 0) throw new Error('snap: the grid is empty');
  const turn = Math.floor(height / n) * n;
  let best = Infinity;
  for (const g of grid)
    for (const c of [turn + mod(g, n) - n, turn + mod(g, n), turn + mod(g, n) + n]) {
      const d = Math.abs(c - height);
      const bd = Math.abs(best - height);
      if (best === Infinity || d < bd || (d === bd && c < best)) best = c;
    }
  return best;
}

/** The members of Z_n a bitmask names. */
export const subset = (mask: number, n: number) => range(n).filter((i) => (mask >> i) & 1);

const key = (s: readonly number[], n = 12) =>
  [...new Set(s.map((x) => mod(x, n)))].sort((a, b) => a - b).join();
const rotations = (s: readonly number[], n = 12) =>
  range(n).map((t) =>
    key(
      s.map((x) => x + t),
      n,
    ),
  );
export const necklace = (s: readonly number[], n = 12) => rotations(s, n).sort()[0]!;

/** `count` fifths from `start`: a window of the circle of fifths. */
export const fifths = (start: number, count: number) =>
  range(count).map((i) => mod(start + 7 * i, 12));

export function measure() {
  const classes = new Set<string>();
  const inverted = new Set<string>();
  for (let mask = 0; mask < 4096; mask++) {
    const s = subset(mask, 12);
    const c = necklace(s);
    classes.add(c);
    const i = necklace(s.map((x) => -x));
    inverted.add(c < i ? c : i);
  }
  const maximallyEven = range(12)
    .map((i) => i + 1)
    .filter((m) => {
      const w = necklace(fifths(0, m));
      return w === necklace(even(m, 12).heights);
    });
  const dividing = range(12)
    .map((i) => i + 1)
    .filter((k) => 12 % k === 0)
    .map((k) => ({ k, transpositions: new Set(rotations(even(k, 12).heights)).size }));
  const diatonic = fifths(11, 7); // F to B: C major
  const pentatonicsInDiatonic = range(12).filter((r) =>
    fifths(r, 5).every((p) => diatonic.includes(p)),
  ).length;
  return {
    classes: classes.size,
    inverted: inverted.size,
    maximallyEven,
    dividing,
    pentatonicsInDiatonic,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = measure();
  console.log(`subsets of Z12: 4096 in ${r.classes} classes (${r.inverted} with inversion)`);
  console.log(`windows of m fifths that are maximally even: m = ${r.maximallyEven.join(', ')}`);
  console.log(
    `subgroups: ${r.dividing.map((d) => `even(${d.k},12) in ${d.transpositions} transpositions`).join('; ')}`,
  );
  console.log(`pentatonic windows inside a diatonic window: ${r.pentatonicsInDiatonic}`);
}
