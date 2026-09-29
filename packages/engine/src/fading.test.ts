import { describe, expect, it } from 'vitest';
import { centreOf, fold, leaning, timeConstant } from './fading.ts';

const DECAYS = [0, 0.5, 0.85, 0.95];

describe('a fading memory', () => {
  it('fades every weight by the decay, then adds each reading, in order', () => {
    expect(
      fold([1, 2, 0], 0.5, [
        [2, 1],
        [0, 0.25],
        [2, 0.5],
      ]),
    ).toEqual([0.75, 1, 1.5]);
  });

  it('leaves the memory it folds into as it was', () => {
    const memory = [1, 2, 3];
    fold(memory, 0.5, [[0, 1]]);
    expect(memory).toEqual([1, 2, 3]);
  });

  it('fades to nothing left alone, never below it, at every decay under 1 (C9)', () => {
    for (const decay of DECAYS) {
      let memory: readonly number[] = [1, 5, 0.25];
      for (let n = 0; n < 400; n++) {
        const next = fold(memory, decay, []);
        for (const [i, w] of next.entries()) {
          expect(w).toBeGreaterThanOrEqual(0);
          expect(w).toBeLessThanOrEqual(memory[i]!);
        }
        memory = next;
      }
      for (const w of memory) expect(w).toBeLessThan(1e-8);
    }
  });

  it('settles on a reading held every fold at the reading times its time constant, from any start (C9, A4)', () => {
    expect(timeConstant(0.85)).toBeCloseTo(20 / 3, 12);
    for (const decay of DECAYS)
      for (const start of [0, 1, 100]) {
        let memory: readonly number[] = [start];
        for (let n = 0; n < 800; n++) memory = fold(memory, decay, [[0, 0.5]]);
        expect(memory[0]).toBeCloseTo(0.5 * timeConstant(decay), 9);
      }
  });
});

describe('leaning on a memory', () => {
  it('centres on the first of the candidates that weigh most (C9)', () => {
    const weighs = [3, 1, 3, 2];
    for (const order of [
      [0, 1, 2, 3],
      [2, 1, 0, 3],
      [1, 3, 2, 0],
    ])
      expect(centreOf(order, (i) => weighs[i]!)).toBe(order.find((i) => weighs[i] === 3));
    expect(centreOf([7], () => 0)).toBe(7);
  });

  it('weighs each against the most, to a power, and all alike where nothing weighs (C9)', () => {
    expect(leaning([4, 2, 0, 1], 2)).toEqual([1, 0.25, 0, 0.0625]);
    expect(leaning([0, 0, 0], 4)).toEqual([1, 1, 1]);
  });

  it('draws toward the centre ever more sharply, and at no sharpness draws evenly (C9)', () => {
    const weights = [2, 5, 3, 5, 1];
    const shareOfCentre = (sharpness: number) => {
      const lean = leaning(weights, sharpness);
      const sum = lean.reduce((a, b) => a + b, 0);
      return lean.filter((_, i) => weights[i] === 5).reduce((a, b) => a + b, 0) / sum;
    };
    expect(leaning(weights, 0)).toEqual([1, 1, 1, 1, 1]);
    const shares = [0, 1, 2, 4, 8, 16, 64].map(shareOfCentre);
    for (const [n, share] of shares.entries())
      if (n > 0) expect(share).toBeGreaterThan(shares[n - 1]!);
    expect(shares.at(-1)).toBeCloseTo(1, 9);
  });
});
