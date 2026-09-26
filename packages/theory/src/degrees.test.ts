import { describe, expect, it } from 'vitest';
import { degree, nearestDegree } from './degrees.ts';
import { even, mod } from './even.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, modes } from './modes.ts';

const range = (n: number) => [...Array(n).keys()];

describe('degree', () => {
  it('counts through the scale and on into the next octaves, in both directions', () => {
    const ionian = diatonicMode('ionian');
    expect(range(9).map((d) => degree(ionian, d))).toEqual([0, 2, 4, 5, 7, 9, 11, 12, 14]);
    expect([-1, -2, -7, -8].map((d) => degree(ionian, d))).toEqual([-1, -3, -12, -13]);
  });

  it('works on rhythms too: the d-th onset, counted on through the bars', () => {
    const rim = even(5, 16);
    expect(range(7).map((d) => degree(rim, d, 16))).toEqual([0, 4, 7, 10, 13, 16, 20]);
  });

  it('rises strictly, one scale step at a time, for every mode', () => {
    for (const scale of [...modes(7, 12), ...modes(5, 12)]) {
      for (const d of range(40).map((x) => x - 20))
        expect(degree(scale, d + 1)).toBeGreaterThan(degree(scale, d));
    }
  });
});

describe('degree, read as an order', () => {
  // For every even set and every position p, the degrees at or below p end at
  // one degree (below) and the degrees at or above p begin at one (above):
  // degree(d) ≤ p exactly when d ≤ below, and degree(d) ≥ p exactly when
  // d ≥ above. These are degree's two adjoints (a Galois connection), and
  // nearestDegree always answers one of them.
  const cases = range(17).flatMap((n) =>
    range(n + 1)
      .filter((k) => k > 0)
      .map((k) => [k, n] as const),
  );

  it('has a degree just below and a degree just above every position', () => {
    for (const [k, n] of cases) {
      const set = even(k, n);
      const ds = range(8 * k).map((d) => d - 4 * k);
      for (const p of range(4 * n + 1).map((x) => x - 2 * n)) {
        const below = Math.max(...ds.filter((d) => degree(set, d, n) <= p));
        const above = Math.min(...ds.filter((d) => degree(set, d, n) >= p));
        for (const d of ds) {
          expect(degree(set, d, n) <= p, `${k} of ${n}, p ${p}, d ${d}`).toBe(d <= below);
          expect(degree(set, d, n) >= p, `${k} of ${n}, p ${p}, d ${d}`).toBe(d >= above);
        }
        expect([below, above], `${k} of ${n}, p ${p}`).toContain(nearestDegree(set, p, n));
        expect(above - below, `${k} of ${n}, p ${p}`).toBe(set.includes(mod(p, n)) ? 0 : 1);
      }
    }
  });

  it('follows the line of slope k/n for even(k, n): the degree just below p is ⌊p · k/n⌋', () => {
    // Seen from the side, the even set is the staircase closest to that line.
    const below = (set: readonly number[], n: number, p: number) => {
      const ds = range(8 * set.length).map((d) => d - 4 * set.length);
      return Math.max(...ds.filter((d) => degree(set, d, n) <= p));
    };
    for (const [k, n] of cases) {
      for (const p of range(4 * n + 1).map((x) => x - 2 * n))
        expect(below(even(k, n), n, p), `${k} of ${n}, p ${p}`).toBe(Math.floor((p * k) / n));
    }
    // Only the even set as it starts, lydian for 7 of 12, follows the line.
    // Ionian, one of its modes, reaches F a semitone early: degree 3 at 5, where ⌊5 · 7/12⌋ is 2.
    expect(below(diatonicMode('lydian'), 12, 5)).toBe(2);
    expect(below(diatonicMode('ionian'), 12, 5)).toBe(3);
  });

  it("gives play-aeiou's degree_of as the degree just above", () => {
    // degree_of counts the members below the position's class, plus k per cycle.
    for (const [k, n] of cases) {
      const set = even(k, n);
      for (const p of range(4 * n + 1).map((x) => x - 2 * n)) {
        const degreeOf = k * Math.floor(p / n) + set.filter((x) => x < mod(p, n)).length;
        expect(degree(set, degreeOf, n), `${k} of ${n}, p ${p}`).toBeGreaterThanOrEqual(p);
        expect(degree(set, degreeOf - 1, n), `${k} of ${n}, p ${p}`).toBeLessThan(p);
      }
    }
  });
});

describe('nearestDegree', () => {
  it('inverts degree exactly for every note of the scale', () => {
    for (const scale of [...modes(7, 12), ...modes(5, 12)]) {
      for (const d of range(60).map((x) => x - 30))
        expect(nearestDegree(scale, degree(scale, d))).toBe(d);
    }
  });

  it('finds the nearest degree for every MIDI note, ties going down', () => {
    for (const scale of [...modes(7, 12), ...modes(5, 12)]) {
      for (const semitones of range(128)) {
        const d = nearestDegree(scale, semitones);
        const distance = Math.abs(degree(scale, d) - semitones);
        expect(Math.abs(degree(scale, d - 1) - semitones)).toBeGreaterThan(distance);
        expect(Math.abs(degree(scale, d + 1) - semitones)).toBeGreaterThanOrEqual(distance);
      }
    }
  });

  it('agrees with the prototype on its example: A4 over C major is degree 40', () => {
    // The prototype's toDegK counts octave · 7 + index, as here.
    expect(nearestDegree(diatonicMode('ionian'), 69)).toBe(40);
    expect(DIATONIC_MODE_NAMES).toContain('ionian');
  });

  it('wraps to the next octave when that is nearer', () => {
    // The major pentatonic tops out at 9, so 11 is nearer the next octave's 12.
    // The prototype's toDegK does not wrap and would answer 9.
    expect(nearestDegree([0, 2, 4, 7, 9], 11)).toBe(5);
  });
});
