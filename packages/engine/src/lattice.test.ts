import { describe, expect, it } from 'vitest';
import { LOOSENESS_FLOOR, VALUES, snapToValues, valueOf } from './lattice.ts';

const range = (n: number) => [...Array(n).keys()];

describe('the note value of a phrase', () => {
  it('is the coarsest lattice its onsets sit on, for every value and every place on it', () => {
    for (const value of VALUES) {
      // Onsets on the odd places of the lattice, so no coarser one holds them, and a few on the others.
      const odd = range(32 / value)
        .filter((k) => k % 2 === 1)
        .map((k) => k * value);
      const even = range(32 / value)
        .filter((k) => k % 2 === 0 && k > 0)
        .map((k) => k * value);
      const onsets = [...odd.slice(0, 3), ...even.slice(0, 3)].sort((a, b) => a - b);
      expect(valueOf(onsets, LOOSENESS_FLOOR)).toBe(value);
    }
  });

  it('is the coarsest of those that cost the same', () => {
    expect(valueOf([8, 16, 24], LOOSENESS_FLOOR)).toBe(8);
    expect(valueOf([8], LOOSENESS_FLOOR)).toBe(8);
    expect(valueOf([], LOOSENESS_FLOOR)).toBe(8);
  });

  it('is finer where one onset is off the coarser lattice, however many are on it', () => {
    expect(valueOf([2, 4, 6, 8, 10, 12, 14, 15], 0.15)).toBe(1);
    expect(valueOf([2, 4, 6, 8, 10, 12, 14, 16], 0.15)).toBe(2);
  });

  it('holds two onsets a step apart on two places, not one', () => {
    // A hand this loose on sixteenths could read as eighths, with two notes on a place.
    expect(valueOf([16.6, 17.4, 18.6, 19.4], 0.3)).toBe(1);
  });
});

describe('snapping onsets to a phrase’s note value', () => {
  it('keeps the start where it is put, and puts the rest on the lattice', () => {
    const snapped = snapToValues([15.6, 20.1, 23.8, 28.2], 16, 0.25);
    expect(snapped).toEqual([16, 20, 24, 28]);
  });

  it('reads eighths a half step off either way as eighths, where the nearest step reads odd ones', () => {
    // Meant 2, 4, 6, 8, 10, and struck up to 0.6 of a step off, which a loose hand is.
    const off = [2.6, 3.4, 6.55, 7.45, 10.6];
    expect(off.map(Math.round)).toEqual([3, 3, 7, 7, 11]);
    expect(snapToValues([0, ...off], 0, 0.5)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it('leaves sixteenths as sixteenths', () => {
    const exact = range(8).map((k) => 16 + k);
    expect(snapToValues(exact, 16, LOOSENESS_FLOOR)).toEqual(exact);
    expect(
      snapToValues(
        exact.map((x) => x + 0.2),
        16,
        0.2,
      ).slice(1),
    ).toEqual(exact.slice(1));
  });

  it('snaps nothing from nothing, and a lone start to itself', () => {
    expect(snapToValues([], 16, 0.2)).toEqual([]);
    expect(snapToValues([15.7], 16, 0.2)).toEqual([16]);
  });

  it('never moves an onset further than half its lattice’s value', () => {
    for (const value of VALUES)
      for (const x of range(200).map((k) => k / 10)) {
        const at = value * Math.round(x / value);
        expect(Math.abs(x - at)).toBeLessThanOrEqual(value / 2 + 1e-9);
      }
  });
});
