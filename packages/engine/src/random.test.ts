import { describe, expect, it } from 'vitest';
import {
  QUANTUM,
  STREAMS,
  chance,
  draw,
  keyedRandom,
  keyedRng,
  mulberry32,
  pick,
  quantize,
} from './random.ts';

// Known-answer values, recorded from the prototype for orientation.
describe('mulberry32', () => {
  it('produces the prototype sequence', () => {
    const r = mulberry32(1);
    expect([r(), r(), r()]).toEqual([0.6270739405881613, 0.002735721180215478, 0.5274470399599522]);
  });

  it('stays in [0, 1)', () => {
    const r = mulberry32(0xdeadbeef);
    for (let i = 0; i < 10_000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('keyedRng', () => {
  it('matches the prototype for a seed and key path', () => {
    const r = keyedRng(12345, 1, 0);
    expect([r(), r(), r()]).toEqual([0.370359550928697, 0.890166247729212, 0.7654600373934954]);
    expect(keyedRandom(12345, 11, 0, 3, 7)).toBe(0.9658289530780166);
  });

  it('is a pure function of seed and keys', () => {
    expect(keyedRandom(7, 1, 2, 3)).toBe(keyedRandom(7, 1, 2, 3));
    expect(keyedRandom(7, 1, 2, 3)).not.toBe(keyedRandom(7, 1, 2, 4));
    expect(keyedRandom(7, 1, 2, 3)).not.toBe(keyedRandom(8, 1, 2, 3));
  });

  it('truncates keys to 32-bit integers like the prototype', () => {
    expect(keyedRandom(0xffffffff, 13, -1, 2.9)).toBe(0.46915554720908403);
    expect(keyedRandom(0xffffffff, 13, -1, 2.9)).toBe(keyedRandom(0xffffffff, 13, -1, 2));
  });
});

/** The neighbouring doubles of a positive x: one ulp up and one ulp down. */
const ulps = (x: number): [number, number] => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const bits = view.getBigUint64(0);
  const at = (b: bigint) => (view.setBigUint64(0, b), view.getFloat64(0));
  return [at(bits + 1n), at(bits - 1n)];
};

describe('quantize', () => {
  it('rounds to the grid of 1/65536', () => {
    expect(QUANTUM).toBe(2 ** -16);
    expect(quantize(0.5)).toBe(0.5);
    expect(quantize(0.1)).toBe(6554 / 65536);
    expect(quantize(3 * QUANTUM + 0.49 * QUANTUM)).toBe(3 * QUANTUM);
    expect(quantize(3 * QUANTUM + 0.51 * QUANTUM)).toBe(4 * QUANTUM);
  });

  it('absorbs a difference in the last bit, as Math.pow and Math.sin may give on another engine', () => {
    let tested = 0;
    for (let i = 1; i < 2000; i++) {
      for (const x of [Math.pow(i / 2000, 0.37), Math.sin(i) ** 2, (i / 7) ** 1.5]) {
        const [up, down] = ulps(x);
        // Only a value within an ulp of a rounding boundary can still differ.
        const fromBoundary = Math.abs(((x / QUANTUM) % 1) - 0.5) * QUANTUM;
        if (fromBoundary <= Math.abs(up - x)) continue;
        expect(quantize(up)).toBe(quantize(x));
        expect(quantize(down)).toBe(quantize(x));
        tested++;
      }
    }
    expect(tested).toBeGreaterThan(5900);
  });
});

describe('chance', () => {
  it('is true for draws below the quantized probability', () => {
    expect(chance(0.25, 0.5)).toBe(true);
    expect(chance(0.5, 0.5)).toBe(false);
    expect(chance(0, 0)).toBe(false);
    expect(chance(0.9999, 1)).toBe(true);
    expect(chance(0.5, -0.2)).toBe(false);
    expect(chance(0.5, 1.4)).toBe(true);
  });

  it('refuses a probability that is not a number, and a draw outside [0, 1)', () => {
    expect(() => chance(0.5, NaN)).toThrow(/probability NaN is not a finite number/);
    expect(() => chance(0.5, Infinity)).toThrow(/not a finite number/);
    expect(() => chance(1.5, 0.5)).toThrow(/draw 1.5 is outside \[0, 1\)/);
    expect(() => chance(-0.1, 0.5)).toThrow(/outside \[0, 1\)/);
  });

  it('decides a draw alike on both sides of a one-ulp difference, where a raw comparison does not', () => {
    // Draws are multiples of 2^-32, so a draw can sit exactly on a probability.
    const [above] = ulps(0.5);
    expect(0.5 < above).not.toBe(0.5 < 0.5);
    expect(chance(0.5, above)).toBe(chance(0.5, 0.5));
  });
});

describe('pick', () => {
  /** How often each index is picked over n evenly spaced draws. */
  const sweep = (weights: number[], n = 2 ** 16) => {
    const counts = weights.map(() => 0);
    for (let i = 0; i < n; i++) counts[pick(i / n, weights)]!++;
    return counts.map((c) => c / n);
  };

  it('picks each index in proportion to its weight', () => {
    for (const weights of [
      [1, 1],
      [3, 1],
      [0.2, 0.5, 0.3],
      [4, 0, 1, 2.5],
      [1e-3, 1],
    ]) {
      const total = weights.reduce((a, b) => a + b, 0);
      sweep(weights).forEach((share, i) => expect(share).toBeCloseTo(weights[i]! / total, 3));
    }
  });

  it('never picks a weight of zero, or one below half a quantum', () => {
    const shares = sweep([0, 1, 0, QUANTUM * 0.49, 2]);
    expect([shares[0], shares[2], shares[3]]).toEqual([0, 0, 0]);
  });

  it('rises with the draw: the picks run through the indices in order', () => {
    const picks = [...Array(1000).keys()].map((i) => pick(i / 1000, [1, 2, 3, 4]));
    expect(picks).toEqual([...picks].sort((a, b) => a - b));
    expect(new Set(picks)).toEqual(new Set([0, 1, 2, 3]));
  });

  it('absorbs a difference in the last bit of any weight', () => {
    for (let i = 1; i < 500; i++) {
      const weights = [Math.pow(i / 500, 0.3), Math.sin(i) ** 2 + 0.1, 0.35];
      const draws = [...Array(64).keys()].map((j) => keyedRandom(9, i, j));
      const picks = draws.map((r) => pick(r, weights));
      const nudged = weights.map((w, j) => (j === i % 3 ? ulps(w)[0] : w));
      if (quantize(nudged[i % 3]!) !== quantize(weights[i % 3]!)) continue;
      expect(draws.map((r) => pick(r, nudged))).toEqual(picks);
    }
  });

  it('refuses weights that give nothing to pick, and draws outside [0, 1)', () => {
    expect(() => pick(0.5, [])).toThrow(/nothing to pick/);
    expect(() => pick(0.5, [0, QUANTUM * 0.2])).toThrow(/nothing to pick/);
    expect(() => pick(0.5, [1, -1])).toThrow(/negative or not finite/);
    expect(() => pick(0.5, [1, NaN])).toThrow(/negative or not finite/);
    expect(() => pick(1, [1, 1])).toThrow(/outside \[0, 1\)/);
    expect(() => pick(-0.1, [1, 1])).toThrow(/outside \[0, 1\)/);
  });
});

describe('draw', () => {
  it('names every stream with its own id, so no two decisions share their numbers', () => {
    const ids = Object.values(STREAMS);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(Number.isInteger(id) && id > 0).toBe(true);
  });

  it('keeps every stream of every seed apart, neighbouring seeds included', () => {
    // With the stream id mixed straight into the seed, seed 10's
    // drumVariation drew exactly seed 11's drumHit.
    const seen = new Map<string, string>();
    for (let seed = 0; seed < 256; seed++)
      for (const stream of Object.keys(STREAMS) as (keyof typeof STREAMS)[]) {
        const draws = [0, 1, 2].map((k) => draw(seed, stream, k, 5)).join();
        expect(seen.get(draws)).toBeUndefined();
        seen.set(draws, `${seed} ${stream}`);
      }
    expect(draw(7, 'form', 3)).not.toBe(draw(7, 'drumHit', 3));
  });
});
