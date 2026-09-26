import { describe, expect, it } from 'vitest';
import { degree } from './degrees.ts';
import { even, gaps, mod } from './even.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, modes, rotate } from './modes.ts';

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

  it('lose exactly one from their sum of positions from each mode to the next, for every coprime k of n', () => {
    // So the order along the generator is the order by the sum, brightest first.
    const sum = (set: readonly number[]) => set.reduce((a, b) => a + b, 0);
    for (const [k, n] of coprimeSizes) {
      const sums = modes(k, n).map(sum);
      for (const b of range(k - 1)) expect(sums[b]! - sums[b + 1]!, `${k} of ${n}`).toBe(1);
    }
    expect(modes(7, 12).map(sum)).toEqual([39, 38, 37, 36, 35, 34, 33]);
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

describe('rotate', () => {
  it('re-roots a set on its d-th member: the modes in scale order', () => {
    const ionian = diatonicMode('ionian');
    expect(range(7).map((d) => rotate(ionian, d))).toEqual(
      ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'].map((name) =>
        diatonicMode(name as (typeof DIATONIC_MODE_NAMES)[number]),
      ),
    );
    expect(rotate(ionian, 7)).toEqual(ionian);
    expect(rotate(ionian, -1)).toEqual(diatonicMode('locrian'));
  });

  it('gives the same sets as modes, in another order, for every coprime k of n', () => {
    for (const [k, n] of coprimeSizes) {
      const byGenerator = modes(k, n).map((m) => m.join());
      const byDegree = range(k).map((d) => rotate(even(k, n), d, n).join());
      expect(new Set(byDegree), `${k} of ${n}`).toEqual(new Set(byGenerator));
    }
  });
});

/**
 * On the helix, a set is one turn of heights: the heights of degrees 0 to
 * k − 1, with degree 0 wherever it stands, read across turns by `degree`. A
 * shift moves the heights and keeps the degrees: a transposition. A mode moves
 * the degrees and keeps the heights: the same positions, another tonic. Each is
 * composition with a translation, the shift on the outside and the mode on the
 * inside. Neither has its own function yet (#31): `shift` sorts positions, and
 * `rotate` moves the mode back to 0.
 */
interface Helix {
  cycle: number;
  heights: readonly number[];
}
const helix = (cycle: number, heights: readonly number[]): Helix => ({ cycle, heights });
const shiftHelix = (t: Helix, by: number) =>
  helix(
    t.cycle,
    t.heights.map((x) => x + by),
  );
const modeOf = (t: Helix, d: number) =>
  helix(
    t.cycle,
    t.heights.map((_, e) => degree(t.heights, e + d, t.cycle)),
  );
/** The inner helix's heights read as degrees of the outer helix. */
const compose = (inner: Helix, outer: Helix) =>
  helix(
    outer.cycle,
    inner.heights.map((e) => degree(outer.heights, e, outer.cycle)),
  );
const positions = (t: Helix) => t.heights.map((x) => mod(x, t.cycle)).sort((a, b) => a - b);

describe('shift and mode, on heights', () => {
  const cMajor = helix(12, diatonicMode('ionian'));

  it('a mode keeps the positions and changes the tonic: mode 1 of C major is D dorian', () => {
    expect(modeOf(cMajor, 1).heights).toEqual([2, 4, 5, 7, 9, 11, 12]);
    expect(positions(modeOf(cMajor, 1))).toEqual(positions(cMajor));
    expect(shiftHelix(cMajor, 7).heights).toEqual([7, 9, 11, 12, 14, 16, 18]); // G major
  });

  it('rotate is a mode, then a shift back to 0, for every coprime k of n', () => {
    for (const [k, n] of coprimeSizes) {
      const set = even(k, n);
      for (const d of range(3 * k).map((x) => x - k)) {
        const moved = shiftHelix(modeOf(helix(n, set), d), -degree(set, d, n));
        expect(moved.heights, `${k} of ${n}, d ${d}`).toEqual(rotate(set, d, n));
      }
    }
  });

  it('a shift inside is a mode outside, for every even pair with n ≤ 12', () => {
    // compose(shift(inner, d), outer) = compose(inner, mode(outer, d))
    for (let n = 1; n <= 12; n++)
      for (let m = 1; m <= n; m++)
        for (let k = 1; k <= m; k++) {
          const inner = helix(m, even(k, m));
          const outer = helix(n, even(m, n));
          for (const d of range(3 * m).map((x) => x - m))
            expect(compose(shiftHelix(inner, d), outer), `${k} of ${m} of ${n}, d ${d}`).toEqual(
              compose(inner, modeOf(outer, d)),
            );
        }
  });

  it('gives Roman numerals: V7 of C major is four even degrees of 7, shifted to degree 4', () => {
    const seventh = helix(7, even(4, 7));
    expect(compose(shiftHelix(seventh, 4), cMajor).heights).toEqual([7, 11, 14, 17]);
    expect(compose(seventh, modeOf(cMajor, 4)).heights).toEqual([7, 11, 14, 17]);
    // The law needs the mode to keep its heights: rotate moves it back to 0.
    expect(compose(seventh, helix(12, rotate(cMajor.heights, 4))).heights).toEqual([0, 4, 7, 10]);
  });
});
