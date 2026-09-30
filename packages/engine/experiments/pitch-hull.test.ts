import { describe, expect, it } from 'vitest';
import { even } from '@jambot/theory';
import { fifths, measure, necklace, snap, subset } from './pitch-hull.ts';

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** The brute force: the least distance from `height` to any member, at any octave, and the lowest at it. */
function nearest(grid: readonly number[], n: number, height: number): number {
  let best = Infinity;
  for (let turn = -3; turn <= 3; turn++)
    for (const g of grid) {
      const c = Math.floor(height / n) * n + turn * n + mod(g, n);
      if (
        Math.abs(c - height) < Math.abs(best - height) ||
        (Math.abs(c - height) === Math.abs(best - height) && c < best)
      )
        best = c;
    }
  return best;
}

describe('E29: the hull of the twelve', () => {
  it('counts 352 classes under transposition and 224 with inversion', () => {
    const r = measure();
    expect(r.classes).toBe(352);
    expect(r.inverted).toBe(224);
  });

  it('snaps to a member, the nearest, equivariantly, over all 4,095 sub-grids of Z12 and 36 heights', () => {
    const wrong: string[] = [];
    for (let mask = 1; mask < 4096; mask++) {
      const grid = subset(mask, 12);
      for (let h = -12; h < 24; h++) {
        const s = snap(grid, 12, h);
        if (!grid.includes(mod(s, 12))) wrong.push(`${mask}@${h}: not a member`);
        if (s !== nearest(grid, 12, h)) wrong.push(`${mask}@${h}: not the nearest`);
        if (grid.includes(mod(h, 12)) && s !== h) wrong.push(`${mask}@${h}: moved a member`);
        for (const t of [1, 5, 7])
          if (
            snap(
              grid.map((g) => g + t),
              12,
              h + t,
            ) !==
            s + t
          )
            wrong.push(`${mask}@${h}: not equivariant by ${t}`);
      }
    }
    expect(wrong).toEqual([]);
    expect(() => snap([], 12, 0)).toThrow();
  });

  it('snaps a bar of steps to any sub-grid of Z16, the same function', () => {
    for (const k of [1, 2, 3, 4, 5, 7, 8, 16]) {
      const grid = even(k, 16).heights.map((h) => mod(h, 16));
      for (let step = 0; step < 16; step++) {
        const s = snap(grid, 16, step);
        expect(s).toBe(nearest(grid, 16, step));
        expect(grid).toContain(mod(s, 16));
      }
    }
    // the last step goes on to the next bar's first, where that is the nearest
    expect(snap([0, 8], 16, 15)).toBe(16);
    expect(snap([0, 8], 16, 4)).toBe(0);
  });

  it('breaks a tie down', () => {
    expect(snap([0, 4], 12, 2)).toBe(0);
    expect(snap([0, 4], 12, 6)).toBe(4);
  });

  it('is Z3 × Z4: a major third moves only mod 3, a minor third only mod 4, a fifth both', () => {
    const seen = new Set<string>();
    for (let p = 0; p < 12; p++) {
      seen.add(`${p % 3},${p % 4}`);
      expect((p + 4) % 4).toBe(p % 4);
      expect((p + 3) % 3).toBe(p % 3);
      expect(mod(p + 7, 12)).toBe(mod(p + 4 + 3, 12));
    }
    expect(seen.size).toBe(12);
  });

  it('has a subgroup for each divisor of 12, each as even(k, 12), in 12 / k transpositions', () => {
    const r = measure();
    expect(r.dividing).toEqual([
      { k: 1, transpositions: 12 },
      { k: 2, transpositions: 6 },
      { k: 3, transpositions: 4 },
      { k: 4, transpositions: 3 },
      { k: 6, transpositions: 2 },
      { k: 12, transpositions: 1 },
    ]);
  });

  it('has windows of m fifths maximally even exactly for m of 1, 5, 7, 11 and 12', () => {
    expect(measure().maximallyEven).toEqual([1, 5, 7, 11, 12]);
  });

  it('puts three pentatonic windows inside each diatonic window', () => {
    expect(measure().pentatonicsInDiatonic).toBe(3);
    const pent = necklace(fifths(0, 5));
    expect(pent).toBe(necklace(even(5, 12).heights));
  });
});
