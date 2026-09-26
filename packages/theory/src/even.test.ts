import { describe, expect, it } from 'vitest';
import { even, gaps, generator, isMaximallyEven, shift } from './even.ts';

const range = (n: number) => [...Array(n).keys()];
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Every (k, n) with 0 ≤ k ≤ n ≤ 16. */
const allSizes = range(17).flatMap((n) => range(n + 1).map((k) => [k, n] as const));

describe('even', () => {
  it('gives the diatonic set, the prototype rim pattern and the #8 example', () => {
    // The last two are the prototype's, for orientation: its rim pattern, and
    // (3,8,2) as its mini-notation plays it. Rotation shifts onsets later.
    expect(even(7, 12)).toEqual([0, 2, 4, 6, 7, 9, 11]);
    expect(even(5, 16)).toEqual([0, 4, 7, 10, 13]);
    expect(even(3, 8, 2)).toEqual([0, 2, 5]);
  });

  it('places k of n, sorted, inside 0..n-1', () => {
    for (const [k, n] of allSizes) {
      for (const rotation of range(n)) {
        const set = even(k, n, rotation);
        expect(set).toHaveLength(k);
        expect(set).toEqual([...new Set(set)].sort((a, b) => a - b));
        expect(set.every((x) => x >= 0 && x < n)).toBe(true);
      }
    }
  });

  it('rotates by shifting every position later', () => {
    for (const [k, n] of allSizes) {
      for (const rotation of range(2 * n + 1).map((r) => r - n)) {
        expect(even(k, n, rotation)).toEqual(shift(even(k, n), rotation, n));
      }
    }
  });

  it('is maximally even, and so is its complement', () => {
    for (const [k, n] of allSizes) {
      const set = even(k, n);
      expect(isMaximallyEven(set, n)).toBe(true);
      expect(
        isMaximallyEven(
          range(n).filter((x) => !set.includes(x)),
          n,
        ),
      ).toBe(true);
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
      expect(even(k, n)).toEqual(arc);
      checked++;
    }
    expect(checked).toBeGreaterThan(70);
    expect(generator(7, 12)).toBe(7);
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

describe('gaps', () => {
  it('lists the distances between neighbours, wrapping around', () => {
    expect(gaps([0, 2, 4, 5, 7, 9, 11], 12)).toEqual([2, 2, 1, 2, 2, 2, 1]);
    expect(gaps([0, 4, 7, 10, 13], 16)).toEqual([4, 3, 3, 3, 3]);
    expect(gaps([3], 8)).toEqual([8]);
    expect(gaps([], 8)).toEqual([]);
  });
});

describe('isMaximallyEven', () => {
  it('rejects sets that are not as even as possible', () => {
    expect(isMaximallyEven([0, 1, 2], 8)).toBe(false);
    expect(isMaximallyEven([0, 1, 4], 8)).toBe(false);
    expect(isMaximallyEven([0, 2, 4, 5, 7, 9, 10], 12)).toBe(true);
    expect(isMaximallyEven([0, 1, 3, 5, 7, 9, 11], 12)).toBe(false); // two semitone steps side by side
  });
});
