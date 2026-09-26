import { describe, expect, it } from 'vitest';
import { even, isEven } from './even.ts';
import {
  type Helix,
  complement,
  compose,
  degreeAbove,
  degreeBelow,
  gaps,
  heightOf,
  lift,
  mirror,
  positions,
  shift,
  snap,
  wrap,
} from './helix.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, modes } from './modes.ts';

const range = (n: number) => [...Array(n).keys()];
const cMajor = diatonicMode('ionian');
const majorPentatonic: Helix = { cycle: 12, heights: [0, 2, 4, 7, 9] };

/** Every (k, n) with 1 ≤ k ≤ n ≤ 16. */
const sizes = range(17).flatMap((n) =>
  range(n + 1)
    .filter((k) => k > 0)
    .map((k) => [k, n] as const),
);

describe('heightOf', () => {
  it('counts through the scale and on into the next octaves, in both directions', () => {
    expect(range(9).map((d) => heightOf(cMajor, d))).toEqual([0, 2, 4, 5, 7, 9, 11, 12, 14]);
    expect([-1, -2, -7, -8].map((d) => heightOf(cMajor, d))).toEqual([-1, -3, -12, -13]);
  });

  it('works on rhythms too: the d-th onset, counted on through the bars', () => {
    const rim = even(5, 16);
    expect(range(7).map((d) => heightOf(rim, d))).toEqual([0, 4, 7, 10, 13, 16, 20]);
  });

  it('carries the tonic: degree 0 of G major is at 7', () => {
    const gMajor = shift(cMajor, 7);
    expect(gMajor.heights).toEqual([7, 9, 11, 12, 14, 16, 18]);
    expect(heightOf(gMajor, 0)).toBe(7);
    expect(heightOf(gMajor, 8)).toBe(21);
  });

  it('rises strictly, one degree at a time, for every mode', () => {
    for (const helix of [...modes(even(7, 12)), ...modes(even(5, 12))]) {
      for (const d of range(40).map((x) => x - 20))
        expect(heightOf(helix, d + 1)).toBeGreaterThan(heightOf(helix, d));
    }
  });
});

describe('degreeBelow and degreeAbove', () => {
  // For every even helix and every height p, the degrees at or below p end at
  // one degree (below) and the degrees at or above p begin at one (above):
  // heightOf(d) ≤ p exactly when d ≤ below, and heightOf(d) ≥ p exactly when
  // d ≥ above. These are the two adjoints of heightOf (a Galois connection).
  it('are the degree just below and the degree just above every height', () => {
    for (const [k, n] of sizes) {
      for (const helix of [even(k, n), even(k, n, 5)]) {
        const below = (p: number) => degreeBelow(helix, p);
        const above = (p: number) => degreeAbove(helix, p);
        const ds = range(8 * k).map((d) => d - 4 * k);
        for (const p of range(4 * n + 1).map((x) => x - 2 * n)) {
          const [lo, hi] = [below(p), above(p)];
          for (const d of ds) {
            const height = heightOf(helix, d);
            if (height <= p !== d <= lo || height >= p !== d >= hi)
              expect([height, d], `${k} of ${n}, p ${p}, below ${lo}, above ${hi}`).toBe(
                'an adjoint',
              );
          }
          const onHelix = positions(helix).includes(wrap(p, n));
          expect(hi - lo, `${k} of ${n}, p ${p}`).toBe(onHelix ? 0 : 1);
        }
      }
    }
  });

  it('follow the line of slope k/n for even(k, n): the degree just below p is ⌊p · k/n⌋', () => {
    // Seen from the side, the even set is the staircase closest to that line.
    for (const [k, n] of sizes) {
      for (const p of range(4 * n + 1).map((x) => x - 2 * n))
        expect(degreeBelow(even(k, n), p), `${k} of ${n}, p ${p}`).toBe(Math.floor((p * k) / n));
    }
    // Only the even set as it starts, lydian for 7 of 12, follows the line.
    // Ionian, one of its modes, reaches F a semitone early: degree 3 at 5, where ⌊5 · 7/12⌋ is 2.
    expect(degreeBelow(diatonicMode('lydian'), 5)).toBe(2);
    expect(degreeBelow(cMajor, 5)).toBe(3);
  });

  it("give play-aeiou's degree_of as degreeAbove", () => {
    // degree_of counts the members below the height's position, plus k per cycle.
    for (const [k, n] of sizes) {
      const helix = even(k, n);
      for (const p of range(4 * n + 1).map((x) => x - 2 * n)) {
        const degreeOf =
          k * Math.floor(p / n) + positions(helix).filter((x) => x < wrap(p, n)).length;
        expect(degreeAbove(helix, p), `${k} of ${n}, p ${p}`).toBe(degreeOf);
      }
    }
  });

  it('place C♯4 between degrees 35 and 36 of C major', () => {
    expect(degreeBelow(cMajor, 61)).toBe(35);
    expect(degreeAbove(cMajor, 61)).toBe(36);
    expect(degreeBelow(cMajor, 60)).toBe(35);
    expect(degreeAbove(cMajor, 60)).toBe(35);
  });
});

describe('snap', () => {
  it('inverts heightOf exactly on the helix', () => {
    for (const helix of [...modes(even(7, 12)), ...modes(even(5, 12))]) {
      for (const d of range(60).map((x) => x - 30)) expect(snap(helix, heightOf(helix, d))).toBe(d);
    }
  });

  it('finds the nearest degree for every MIDI note, ties going down, and is one of the adjoints', () => {
    for (const helix of [...modes(even(7, 12)), ...modes(even(5, 12))]) {
      for (const height of range(128)) {
        const d = snap(helix, height);
        const distance = Math.abs(heightOf(helix, d) - height);
        expect(Math.abs(heightOf(helix, d - 1) - height)).toBeGreaterThan(distance);
        expect(Math.abs(heightOf(helix, d + 1) - height)).toBeGreaterThanOrEqual(distance);
        expect([degreeBelow(helix, height), degreeAbove(helix, height)]).toContain(d);
      }
    }
    expect(snap(cMajor, 61)).toBe(35);
  });

  it('agrees with the prototype on its example: A4 over C major is degree 40', () => {
    // The prototype's toDegK counts octave · 7 + index, as here.
    expect(snap(cMajor, 69)).toBe(40);
  });

  it('wraps to the next octave when that is nearer', () => {
    // The major pentatonic tops out at 9, so 11 is nearer the next octave's 12.
    // The prototype's toDegK does not wrap and would answer 9.
    expect(snap(majorPentatonic, 11)).toBe(5);
  });
});

describe('wrap and lift', () => {
  it('wrap takes a height to its position on the circle', () => {
    expect(wrap(14, 12)).toBe(2);
    expect(wrap(-1, 12)).toBe(11);
    expect(wrap(20, 16)).toBe(4);
  });

  it('lift takes a position to the height nearest another, ties going down', () => {
    for (const cycle of [12, 16]) {
      for (const position of range(cycle)) {
        for (const near of range(128)) {
          const height = lift(position, cycle, near);
          expect(wrap(height, cycle)).toBe(position);
          const distance = Math.abs(height - near);
          expect(distance * 2).toBeLessThanOrEqual(cycle);
          if (distance * 2 === cycle) expect(height).toBeLessThan(near);
        }
      }
    }
    expect(lift(7, 12, 60)).toBe(55); // G3 is nearer C4 than G4 is
    expect(lift(6, 12, 60)).toBe(54); // F♯3 and F♯4 are a tritone away: down
    expect(lift(0, 12, 60)).toBe(60);
  });
});

describe('positions', () => {
  it('are the helix seen from above, sorted: G major stands on the positions of C lydian', () => {
    expect(positions(shift(cMajor, 7))).toEqual([0, 2, 4, 6, 7, 9, 11]);
    expect(positions(shift(cMajor, 7))).toEqual(diatonicMode('lydian').heights);
    expect(positions(even(5, 16, 6))).toEqual([0, 3, 6, 10, 13]);
  });
});

describe('shift', () => {
  it('moves every height and keeps the degrees: a transposition', () => {
    for (const [k, n] of sizes) {
      for (const by of [-n, -1, 0, 5, n + 3]) {
        const moved = shift(even(k, n), by);
        expect(moved.cycle).toBe(n);
        expect(gaps(moved)).toEqual(gaps(even(k, n)));
        for (const d of range(3 * k).map((x) => x - k))
          expect(heightOf(moved, d)).toBe(heightOf(even(k, n), d) + by);
      }
    }
  });
});

describe('gaps', () => {
  it('lists the distances from each degree to the next, wrapping around', () => {
    expect(gaps(cMajor)).toEqual([2, 2, 1, 2, 2, 2, 1]);
    expect(gaps(even(5, 16))).toEqual([4, 3, 3, 3, 3]);
    expect(gaps(even(5, 16, 6))).toEqual([4, 3, 3, 3, 3]);
    expect(gaps({ cycle: 8, heights: [3] })).toEqual([8]);
    expect(gaps({ cycle: 8, heights: [] })).toEqual([]);
  });
});

describe('compose', () => {
  it('reads the inner heights as degrees of the outer helix', () => {
    const triad: Helix = { cycle: 7, heights: [0, 2, 4] };
    expect(compose(triad, cMajor)).toEqual({ cycle: 12, heights: [0, 4, 7] });
    expect(compose(shift(triad, 4), cMajor)).toEqual({ cycle: 12, heights: [7, 11, 14] });
  });

  it('nests meter the same way: the backbeat is 2 of 4 beats, composed with 4 of 16 steps', () => {
    expect(compose(even(2, 4, 1), even(4, 16))).toEqual(even(2, 16, 4));
    expect(compose(even(2, 4, 1), even(4, 16)).heights).toEqual([4, 12]);
  });

  it('does not keep evenness in general: 35 of the 165 compositions of even helices with n ≤ 12 are even', () => {
    let evenCount = 0;
    let total = 0;
    for (let n = 3; n <= 12; n++)
      for (let m = 2; m < n; m++)
        for (let k = 2; k < m; k++) {
          total++;
          if (isEven(compose(even(k, m), even(m, n)))) evenCount++;
        }
    expect([evenCount, total]).toEqual([35, 165]);
    // A triad of the Lydian set, even in 7, is not even in 12.
    expect(compose(even(3, 7), even(7, 12)).heights).toEqual([0, 6, 9]);
  });

  it('needs the inner cycle to be the number of outer degrees', () => {
    expect(() => compose(even(3, 8), cMajor)).toThrow(/cycle 8.*7 degrees/);
  });

  it('is a category: associative over every chain of even helices with n ≤ 12, and the chromatic helix is the identity (F6, #39 Q5)', () => {
    const same = (x: Helix, y: Helix) =>
      x.cycle === y.cycle &&
      x.heights.length === y.heights.length &&
      x.heights.every((h, d) => h === y.heights[d]);
    const failures: string[] = [];
    let chains = 0;
    for (let n = 1; n <= 12; n++)
      for (let m = 1; m <= n; m++)
        for (let k = 1; k <= m; k++)
          for (let j = 1; j <= k; j++)
            for (const ta of range(k))
              for (const tb of range(m))
                for (const tc of range(n)) {
                  const [a, b, c] = [even(j, k, ta), even(k, m, tb), even(m, n, tc)];
                  if (!same(compose(compose(a, b), c), compose(a, compose(b, c))))
                    failures.push(`${j}/${k}+${ta}, ${k}/${m}+${tb}, ${m}/${n}+${tc}`);
                  chains++;
                }
    expect(failures).toEqual([]);
    expect(chains).toBe(659_594);
    for (let n = 1; n <= 12; n++)
      for (let k = 1; k <= n; k++)
        for (const t of range(n)) {
          const h = even(k, n, t);
          if (!same(compose(h, even(n, n)), h) || !same(compose(even(k, k), h), h))
            failures.push(`identity on ${k}/${n}+${t}`);
        }
    expect(failures).toEqual([]);
    // The comparison can fail: a shifted chromatic helix is not the identity.
    expect(same(compose(cMajor, shift(even(12, 12), 1)), cMajor)).toBe(false);
  });
});

describe('mirror', () => {
  it('reflects the heights about degree 0: C major mirrored is C phrygian, and dorian is its own mirror', () => {
    expect(mirror(cMajor)).toEqual(diatonicMode('phrygian'));
    expect(mirror(diatonicMode('dorian'))).toEqual(diatonicMode('dorian'));
  });

  it('turns a major triad into a minor one', () => {
    const major: Helix = { cycle: 12, heights: [0, 4, 7] };
    expect(positions(mirror(major))).toEqual(positions({ cycle: 12, heights: [5, 8, 12] })); // F minor
    expect(gaps(major)).toEqual([4, 3, 5]);
    expect(gaps(mirror(major))).toEqual([5, 3, 4]);
  });

  it('reverses the gaps and undoes itself, for every even helix', () => {
    for (const [k, n] of sizes) {
      for (const helix of [even(k, n), even(k, n, 3)]) {
        expect(gaps(mirror(helix))).toEqual([...gaps(helix)].reverse());
        expect(mirror(mirror(helix))).toEqual(helix);
      }
    }
  });

  it('maps brightness i to 6 − i across all seven modes, keeping the tonic: lydian to locrian, dorian to itself', () => {
    DIATONIC_MODE_NAMES.forEach((name, i) =>
      expect(mirror(diatonicMode(name)), name).toEqual(diatonicMode(DIATONIC_MODE_NAMES[6 - i]!)),
    );
  });

  it("gives quintenzirkel's mirror as a shift of it by a fifth, on the note sets, where a fifth stands over the tonic", () => {
    // quintenzirkel reflects about the tonic and its fifth (x → 2t + 7 − x),
    // which is shift(mirror(h), 7). Its golden test, mode i of brightness to
    // mode 5 − i, holds for the six modes with a perfect fifth; locrian has
    // none, and its image loses the tonic.
    DIATONIC_MODE_NAMES.slice(0, 6).forEach((name, i) =>
      expect(positions(shift(mirror(diatonicMode(name)), 7)), name).toEqual(
        positions(diatonicMode(DIATONIC_MODE_NAMES[5 - i]!)),
      ),
    );
    expect(positions(shift(mirror(diatonicMode('locrian')), 7))).not.toContain(0);
    // As a helix, degree 0 moves to the fifth: C ionian goes to G phrygian.
    expect(shift(mirror(cMajor), 7)).toEqual(shift(diatonicMode('phrygian'), 7));
    const major: Helix = { cycle: 12, heights: [0, 4, 7] };
    expect(positions(shift(mirror(major), 7))).toEqual([0, 3, 7]); // C major to C minor
  });
});

describe('complement', () => {
  it('stands on the positions the helix leaves out: the black keys are F♯ major pentatonic', () => {
    expect(complement(cMajor)).toEqual({ cycle: 12, heights: [1, 3, 6, 8, 10] });
    expect(complement(shift(cMajor, 7)).heights).toEqual([8, 10, 13, 15, 17]); // from G upward
    expect(positions(complement(cMajor))).toEqual(positions(shift(majorPentatonic, 6)));
  });

  it('gives back the positions when taken twice', () => {
    for (const [k, n] of sizes) {
      for (const helix of [even(k, n), even(k, n, 7)])
        expect(positions(complement(complement(helix)))).toEqual(positions(helix));
    }
  });
});
