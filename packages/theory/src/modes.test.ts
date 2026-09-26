import { describe, expect, it } from 'vitest';
import { even, generator } from './even.ts';
import { type Helix, compose, heightOf, positions, shift, wrap } from './helix.ts';
import { DIATONIC_MODE_NAMES, brightness, diatonicMode, mode, modes } from './modes.ts';

const range = (n: number) => [...Array(n).keys()];
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const coprimeSizes = range(17).flatMap((n) =>
  range(n)
    .filter((k) => k >= 2 && gcd(k, n) === 1)
    .map((k) => [k, n] as const),
);
const cMajor = diatonicMode('ionian');

/** Mode d, shifted so that its degree 0 stands at 0: "mode d" as the sister projects mean it. */
const fromZero = (helix: Helix, d: number) => shift(mode(helix, d), -heightOf(helix, d));

/** The notes that differ between two sets of the same size: [only in a, only in b]. */
function difference(a: readonly number[], b: readonly number[]): [number[], number[]] {
  return [a.filter((x) => !b.includes(x)), b.filter((x) => !a.includes(x))];
}

describe('mode', () => {
  it('keeps the heights and renumbers the degrees: mode 1 of C major is D dorian', () => {
    expect(mode(cMajor, 1)).toEqual({ cycle: 12, heights: [2, 4, 5, 7, 9, 11, 12] });
    expect(positions(mode(cMajor, 1))).toEqual(positions(cMajor));
    expect(mode(cMajor, 7)).toEqual(shift(cMajor, 12));
    expect(mode(cMajor, -1)).toEqual({ cycle: 12, heights: [-1, 0, 2, 4, 5, 7, 9] });
  });

  it('measured from 0, gives the modes in scale order, as "mode k" means in the sister projects', () => {
    expect(range(7).map((d) => fromZero(cMajor, d))).toEqual(
      (['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'] as const).map(
        diatonicMode,
      ),
    );
  });
});

describe('modes', () => {
  it('lists the k modes in degree order', () => {
    expect(modes(cMajor).map((m) => heightOf(m, 0))).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(modes(cMajor)[1]).toEqual(mode(cMajor, 1));
  });
});

describe('brightness', () => {
  it('sums the heights above degree 0, so a shift does not change it', () => {
    expect(brightness(diatonicMode('lydian'))).toBe(39);
    expect(brightness(cMajor)).toBe(38);
    expect(brightness(diatonicMode('locrian'))).toBe(33);
    expect(brightness(shift(cMajor, 7))).toBe(38);
  });

  it('orders the modes along the generator, one less each step, for every coprime k of n', () => {
    // The b-th brightest mode of even(k, n) stands on position b · g, and from
    // each to the next one note moves by one position.
    for (const [k, n] of coprimeSizes) {
      const g = generator(k, n);
      const byBrightness = modes(even(k, n))
        .map((m) => shift(m, -heightOf(m, 0)))
        .sort((a, b) => brightness(b) - brightness(a));
      byBrightness.forEach((m, b) => {
        if (b === 0) return;
        const previous = byBrightness[b - 1]!;
        expect(brightness(previous) - brightness(m), `${k} of ${n}`).toBe(1);
        const [out, into] = difference(previous.heights, m.heights);
        expect(out, `${k} of ${n}`).toHaveLength(1);
        expect(Math.abs(out[0]! - into[0]!)).toBe(1);
      });
      const tonics = range(k).map((b) => wrap(b * g, n));
      expect(tonics.map((t) => fromZero(even(k, n), even(k, n).heights.indexOf(t)))).toEqual(
        byBrightness,
      );
    }
  });
});

describe('diatonicMode', () => {
  it('names the seven modes from the brightest to the darkest', () => {
    expect(DIATONIC_MODE_NAMES).toEqual([
      'lydian',
      'ionian',
      'mixolydian',
      'dorian',
      'aeolian',
      'phrygian',
      'locrian',
    ]);
    expect(DIATONIC_MODE_NAMES.map((name) => diatonicMode(name).heights)).toEqual([
      [0, 2, 4, 6, 7, 9, 11],
      [0, 2, 4, 5, 7, 9, 11],
      [0, 2, 4, 5, 7, 9, 10],
      [0, 2, 3, 5, 7, 9, 10],
      [0, 2, 3, 5, 7, 8, 10],
      [0, 1, 3, 5, 7, 8, 10],
      [0, 1, 3, 5, 6, 8, 10],
    ]);
    expect(DIATONIC_MODE_NAMES.map((name) => brightness(diatonicMode(name)))).toEqual([
      39, 38, 37, 36, 35, 34, 33,
    ]);
  });

  it("gives the prototype's four scales", () => {
    // The prototype's SCALES table, for orientation.
    expect(diatonicMode('ionian').heights).toEqual([0, 2, 4, 5, 7, 9, 11]); // major
    expect(diatonicMode('aeolian').heights).toEqual([0, 2, 3, 5, 7, 8, 10]); // minor
    expect(diatonicMode('dorian').heights).toEqual([0, 2, 3, 5, 7, 9, 10]);
    expect(diatonicMode('mixolydian').heights).toEqual([0, 2, 4, 5, 7, 9, 10]);
  });

  it('get darker one lowered note at a time', () => {
    const all = DIATONIC_MODE_NAMES.map((name) => diatonicMode(name).heights);
    for (const b of range(6)) {
      const [out, into] = difference(all[b]!, all[b + 1]!);
      expect(into[0]).toBe(out[0]! - 1);
    }
  });
});

describe('shift and mode', () => {
  // A shift moves the heights and keeps the degrees: a transposition. A mode
  // moves the degrees and keeps the heights: the same positions, another
  // tonic. Each is composition with a translation, the shift on the outside
  // and the mode on the inside.
  it('a shift inside is a mode outside, for every even pair with n ≤ 12', () => {
    // compose(shift(inner, d), outer) = compose(inner, mode(outer, d))
    for (let n = 1; n <= 12; n++)
      for (let m = 1; m <= n; m++)
        for (let k = 1; k <= m; k++) {
          const inner = even(k, m);
          const outer = even(m, n);
          for (const d of range(3 * m).map((x) => x - m))
            expect(compose(shift(inner, d), outer), `${k} of ${m} of ${n}, d ${d}`).toEqual(
              compose(inner, mode(outer, d)),
            );
        }
  });

  it('gives Roman numerals: V7 of C major is four even degrees of 7, shifted to degree 4', () => {
    const seventh = even(4, 7);
    expect(compose(shift(seventh, 4), cMajor).heights).toEqual([7, 11, 14, 17]);
    expect(compose(seventh, mode(cMajor, 4)).heights).toEqual([7, 11, 14, 17]);
    // The law needs the mode to keep its heights: measured from 0, V7 lands on 0.
    expect(compose(seventh, fromZero(cMajor, 4)).heights).toEqual([0, 4, 7, 10]);
  });
});
