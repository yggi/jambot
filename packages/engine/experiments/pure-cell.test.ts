import { describe, expect, it } from 'vitest';
import { even } from '@jambot/theory';
import { chance, isFifthsArc, isProgression, measure } from './pure-cell.ts';

describe('E28: the pure cell', () => {
  it('reads every Euclid rhythm whose k is a unit or a divisor as a progression, over every n to 32', () => {
    for (let n = 4; n <= 32; n++)
      for (let k = 3; k < n; k++) {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        if (gcd(k, n) !== 1 && n % k !== 0) continue;
        for (let shift = 0; shift < n; shift++) {
          const onsets = even(k, n, shift).heights.map((h) => ((h % n) + n) % n);
          expect(isProgression(onsets, n), `even(${k}, ${n}, ${shift})`).toBe(true);
        }
      }
  });

  it('refuses a set that is no progression, and a run of the fifths only as an arc', () => {
    expect(isProgression([0, 1, 3], 16)).toBe(false);
    expect(isProgression([0, 4, 8, 12], 16)).toBe(true);
    expect(isFifthsArc([0, 2, 4, 5, 7, 9, 11])).toBe(true);
    expect(isFifthsArc([0, 3, 5, 8, 10])).toBe(true);
    expect(isFifthsArc([0, 1, 2])).toBe(false);
  });

  it('counts chance over every subset', () => {
    // 12 arcs of 3 fifths over C(12,3) = 220 sets.
    expect(chance(3, 12, isFifthsArc)).toBeCloseTo(12 / 220, 10);
  });

  it('keeps its counts consistent on one seed', () => {
    const r = measure(1);
    expect(r.vary.degree).toBe(r.vary.both + r.vary.degreeOnly);
    expect(r.vary.chroma).toBe(r.vary.both + r.vary.chromaOnly);
    for (const m of r.misread) expect(m.kept).toBeLessThanOrEqual(m.pairs);
    expect(r.identity.cOrbit).toBeLessThanOrEqual(r.identity.cShape);
    expect(r.identity.dOrbit).toBeLessThanOrEqual(r.identity.dShape);
  });
});
