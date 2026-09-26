import { describe, expect, it } from 'vitest';
import { even, generator, isEven } from './even.ts';
import { type Helix, complement, positions, shift } from './helix.ts';

const range = (n: number) => [...Array(n).keys()];
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Every (k, n) with 0 ≤ k ≤ n ≤ 16. */
const allSizes = range(17).flatMap((n) => range(n + 1).map((k) => [k, n] as const));

describe('even', () => {
  it('gives the diatonic set, the prototype rim pattern and the #8 example', () => {
    // The last two are the prototype's, for orientation: its rim pattern, and
    // (3,8,2) as its mini-notation plays it. The shift moves onsets later.
    expect(even(7, 12)).toEqual({ cycle: 12, heights: [0, 2, 4, 6, 7, 9, 11] });
    expect(even(5, 16)).toEqual({ cycle: 16, heights: [0, 4, 7, 10, 13] });
    expect(positions(even(3, 8, 2))).toEqual([0, 2, 5]);
  });

  it('places k of n, rising, within one turn from where it is shifted to', () => {
    for (const [k, n] of allSizes) {
      for (const by of range(2 * n + 1).map((r) => r - n)) {
        const { cycle, heights } = even(k, n, by);
        expect(cycle).toBe(n);
        expect(heights).toHaveLength(k);
        for (const i of range(Math.max(k - 1, 0)))
          expect(heights[i + 1]!).toBeGreaterThan(heights[i]!);
        expect(heights.every((x) => x >= by && x < by + n)).toBe(true);
      }
    }
  });

  it('shifts by moving every height: even(k, n, s) is shift(even(k, n), s)', () => {
    for (const [k, n] of allSizes) {
      for (const by of range(2 * n + 1).map((r) => r - n))
        expect(even(k, n, by)).toEqual(shift(even(k, n), by));
    }
    // So degree 0 moves with the shift: the bossa's is at step 6.
    expect(even(5, 16, 6).heights).toEqual([6, 10, 13, 16, 19]);
  });

  it('is even, and so is its complement', () => {
    for (const [k, n] of allSizes) {
      expect(isEven(even(k, n)), `${k} of ${n}`).toBe(true);
      expect(isEven(complement(even(k, n))), `${k} of ${n}`).toBe(true);
    }
  });

  it('has for its complement even(n − k, n), shifted', () => {
    for (const [k, n] of allSizes) {
      const shifts = range(Math.max(n, 1)).filter(
        (by) =>
          positions(shift(even(n - k, n), by)).join() === positions(complement(even(k, n))).join(),
      );
      expect(shifts.length, `${k} of ${n}`).toBeGreaterThan(0);
    }
  });

  it('is the arc stacked from its generator: the circle of fifths for 7 of 12', () => {
    let checked = 0;
    for (const [k, n] of allSizes) {
      if (k === 0 || gcd(k, n) !== 1) continue;
      const g = generator(k, n);
      const arc = range(k)
        .map((p) => (g * p) % n)
        .sort((a, b) => a - b);
      expect(even(k, n).heights).toEqual(arc);
      checked++;
    }
    expect(checked).toBeGreaterThan(70);
    expect(generator(7, 12)).toBe(7);
  });
});

describe('even helices', () => {
  it('are all shifts of even(k, n): every subset of every n ≤ 12, checked', () => {
    let found = 0;
    for (const n of range(13).filter((x) => x > 0)) {
      for (let bits = 0; bits < 2 ** n; bits++) {
        const heights = range(n).filter((x) => (bits >> x) & 1);
        if (!isEven({ cycle: n, heights })) continue;
        found++;
        const shifts = range(n).filter(
          (by) => positions(shift(even(heights.length, n), by)).join() === heights.join(),
        );
        expect(shifts.length, `${heights.join()} in ${n}`).toBeGreaterThan(0);
      }
    }
    expect(found).toBe(474);
  });
});

/** |F_j| of a set of positions in n: the magnitude of its j-th Fourier coefficient. */
function fourierMagnitude(set: readonly number[], n: number, j: number): number {
  let re = 0;
  let im = 0;
  for (const x of set) {
    re += Math.cos((2 * Math.PI * j * x) / n);
    im -= Math.sin((2 * Math.PI * j * x) / n);
  }
  return Math.hypot(re, im);
}

describe('even helices in Fourier space', () => {
  it('have the largest k-th magnitude of any k of n, and only their shifts reach it: every 1 ≤ k < n ≤ 16 (P4)', () => {
    const eps = 1e-9;
    let pairs = 0;
    for (let n = 2; n <= 16; n++) {
      const best = new Map<number, { magnitude: number; sets: string[] }>();
      for (let mask = 1; mask < (1 << n) - 1; mask++) {
        const set = range(n).filter((i) => (mask >> i) & 1);
        const k = set.length;
        const magnitude = fourierMagnitude(set, n, k);
        const b = best.get(k);
        if (!b || magnitude > b.magnitude + eps) best.set(k, { magnitude, sets: [set.join()] });
        else if (Math.abs(magnitude - b.magnitude) <= eps) b.sets.push(set.join());
      }
      for (let k = 1; k < n; k++) {
        const shifts = range(n).map((s) =>
          positions(shift(even(k, n), s))
            .map((x) => x % n)
            .sort((a, b) => a - b)
            .join(),
        );
        expect(best.get(k)!.sets.sort()).toEqual([...new Set(shifts)].sort());
        pairs++;
      }
    }
    expect(pairs).toBe(120);
    // The check can fail: the major triad is 3 of 12 but not even, and falls short.
    expect(fourierMagnitude([0, 4, 7], 12, 3)).toBeLessThan(fourierMagnitude([0, 4, 8], 12, 3));
  });
});

describe('generator', () => {
  it('is the inverse of k modulo n', () => {
    for (const [k, n] of allSizes) {
      if (k === 0 || gcd(k, n) !== 1) continue;
      expect((generator(k, n) * k) % n).toBe(1 % n);
    }
  });

  it('exists only where k and n are coprime', () => {
    expect(() => generator(4, 16)).toThrow(/coprime/);
    expect(() => generator(6, 12)).toThrow(/coprime/);
  });
});

describe('isEven', () => {
  it('rejects helices that are not as even as possible', () => {
    const on = (cycle: number, heights: number[]): Helix => ({ cycle, heights });
    expect(isEven(on(8, [0, 1, 2]))).toBe(false);
    expect(isEven(on(8, [0, 1, 4]))).toBe(false);
    expect(isEven(on(12, [0, 2, 4, 5, 7, 9, 10]))).toBe(true);
    expect(isEven(on(12, [0, 1, 3, 5, 7, 9, 11]))).toBe(false); // two semitone steps side by side
  });

  it('does not depend on where the helix stands or which degree is 0', () => {
    const mixolydian = { cycle: 12, heights: [7, 9, 11, 12, 14, 16, 17] };
    const harmonicMinor = { cycle: 12, heights: [2, 4, 5, 7, 9, 10, 13] };
    expect(isEven(mixolydian)).toBe(true);
    expect(isEven(harmonicMinor)).toBe(false);
  });
});
