import { describe, expect, it } from 'vitest';
import { even, gaps } from './even.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, modes } from './modes.ts';

const range = (n: number) => [...Array(n).keys()];
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const coprimeSizes = range(17).flatMap((n) =>
  range(n)
    .filter((k) => k >= 2 && gcd(k, n) === 1)
    .map((k) => [k, n] as const),
);

/** The notes that differ between two sets of the same size: [only in a, only in b]. */
function difference(a: readonly number[], b: readonly number[]): [number[], number[]] {
  return [a.filter((x) => !b.includes(x)), b.filter((x) => !a.includes(x))];
}

describe('modes', () => {
  it('gives the seven diatonic modes, from Lydian to Locrian', () => {
    expect(modes(7, 12)).toEqual([
      [0, 2, 4, 6, 7, 9, 11],
      [0, 2, 4, 5, 7, 9, 11],
      [0, 2, 4, 5, 7, 9, 10],
      [0, 2, 3, 5, 7, 9, 10],
      [0, 2, 3, 5, 7, 8, 10],
      [0, 1, 3, 5, 7, 8, 10],
      [0, 1, 3, 5, 6, 8, 10],
    ]);
    expect(gaps(diatonicMode('ionian'), 12)).toEqual([2, 2, 1, 2, 2, 2, 1]);
  });

  it("gives the prototype's four scales", () => {
    // The prototype's SCALES table, for orientation.
    expect(diatonicMode('ionian')).toEqual([0, 2, 4, 5, 7, 9, 11]); // major
    expect(diatonicMode('aeolian')).toEqual([0, 2, 3, 5, 7, 8, 10]); // minor
    expect(diatonicMode('dorian')).toEqual([0, 2, 3, 5, 7, 9, 10]);
    expect(diatonicMode('mixolydian')).toEqual([0, 2, 4, 5, 7, 9, 10]);
  });

  it('are the k rotations of the even set, each starting on 0', () => {
    for (const [k, n] of coprimeSizes) {
      const all = modes(k, n);
      expect(all).toHaveLength(k);
      expect(new Set(all.map((m) => m.join())).size).toBe(k);
      const rotations = range(k).map((r) => {
        const g = gaps(even(k, n), n);
        return [...g.slice(r), ...g.slice(0, r)].join();
      });
      for (const mode of all) {
        expect(mode[0]).toBe(0);
        expect(rotations).toContain(gaps(mode, n).join());
      }
    }
  });

  it('move one note by one step from each mode to the next', () => {
    for (const [k, n] of coprimeSizes) {
      const all = modes(k, n);
      for (const b of range(k - 1)) {
        const [out, into] = difference(all[b]!, all[b + 1]!);
        expect(out).toHaveLength(1);
        expect(into).toHaveLength(1);
        expect(Math.abs(out[0]! - into[0]!)).toBe(1);
      }
    }
  });

  it('get darker one lowered note at a time, for the diatonic modes', () => {
    const all = modes(7, 12);
    for (const b of range(6)) {
      const [out, into] = difference(all[b]!, all[b + 1]!);
      expect(into[0]).toBe(out[0]! - 1);
    }
  });

  it('are defined only where k and n are coprime', () => {
    expect(() => modes(4, 16)).toThrow(/coprime/);
    expect(() => modes(6, 12)).toThrow(/coprime/);
  });
});

describe('diatonicMode', () => {
  it('names the seven modes in the order of modes(7, 12)', () => {
    expect(DIATONIC_MODE_NAMES).toEqual([
      'lydian',
      'ionian',
      'mixolydian',
      'dorian',
      'aeolian',
      'phrygian',
      'locrian',
    ]);
    DIATONIC_MODE_NAMES.forEach((name, b) => expect(diatonicMode(name)).toEqual(modes(7, 12)[b]));
  });
});
