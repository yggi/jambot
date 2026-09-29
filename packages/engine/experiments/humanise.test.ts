import { describe, expect, it } from 'vitest';
import { BAR_STEPS, type HeardNote, type Key } from '../src/index.ts';
import {
  BAR,
  BASELINE,
  PATTERNS,
  TRIALS,
  humanise,
  pattern,
  played,
  readingRate,
  stepMs,
} from './humanise.ts';

const KEY: Key = { tonic: 9, mode: 'aeolian' };
const range = (n: number) => [...Array(n).keys()];
const sd = (xs: number[]) => {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
};

describe('the humaniser', () => {
  const exact = played(pattern(3), BAR, 3);

  it('plays a bar exactly as written at no sloppiness', () => {
    expect(humanise(exact, 0, 1, 0)).toEqual(exact);
  });

  it('is keyed: the same seed and trial give the same hand, another trial another', () => {
    expect(humanise(exact, 40, 1, 7)).toEqual(humanise(exact, 40, 1, 7));
    expect(humanise(exact, 40, 1, 7)).not.toEqual(humanise(exact, 40, 1, 8));
  });

  it('moves the same notes the same way, further as the sloppiness grows', () => {
    const at = (s: number) =>
      humanise(exact, s, 1, 4).map((n, i) => n.position - exact[i]!.position);
    at(20).forEach((shift, i) => expect(at(40)[i]).toBeCloseTo(2 * shift, 9));
  });

  it('puts the first note off by about sloppiness √2 (offset and jitter), measured in ms', () => {
    const shifts = range(4000).map(
      (trial) => (humanise(exact, 40, 1, trial)[0]!.position - exact[0]!.position) * stepMs(),
    );
    expect(sd(shifts)).toBeGreaterThan(40 * Math.SQRT2 * 0.93);
    expect(sd(shifts)).toBeLessThan(40 * Math.SQRT2 * 1.07);
  });

  it('holds a note shorter as the player gets sloppier, and leaves a held note held', () => {
    const held = (s: number) =>
      range(2000).reduce((sum, trial) => {
        const n = humanise(exact, s, 1, trial)[0]!;
        return sum + (n.end! - n.position);
      }, 0) /
      2000 /
      (exact[0]!.end! - exact[0]!.position);
    expect(held(20)).toBeGreaterThan(held(100));
    expect(held(100)).toBeLessThan(0.85);
    const open: HeardNote[] = exact.map((n) => ({ ...n, end: null }));
    expect(humanise(open, 40, 1, 0).every((n) => n.end === null)).toBe(true);
  });
});

describe('the patterns', () => {
  it('fill exactly one bar, in every one of them', () => {
    for (let index = 0; index < PATTERNS; index++)
      expect(
        pattern(index)
          .map((s) => s.length)
          .reduce((a, b) => a + b, 0),
      ).toBe(BAR_STEPS);
  });

  it('use every dominant unit and have both rests and mixed lengths', () => {
    const all = range(PATTERNS).map(pattern);
    for (const unit of [1, 2, 4])
      expect(all.some((p) => p.filter((s) => s.length === unit).length > p.length / 2)).toBe(true);
    expect(all.some((p) => p.some((s) => s.rest))).toBe(true);
    expect(all.some((p) => new Set(p.map((s) => s.length)).size >= 3)).toBe(true);
  });
});

describe('the yardstick, before a reader is measured with it', () => {
  it('gives 0% to a reader that hears nothing, and counts why', () => {
    const rate = readingRate(() => [], 40, KEY);
    expect(rate.right).toBe(0);
    expect(rate.causes.noMotif).toBe(rate.bars);
  });

  it('takes bars from the patterns whose exact playing the Muse takes as a motif', () => {
    const rate = readingRate(BASELINE, 0, KEY);
    expect(rate.bars).toBeGreaterThan(800);
    expect(rate.bars).toBeLessThanOrEqual(PATTERNS * TRIALS);
  });
});

/**
 * The baseline: the reading that exists (`judgeBar`, each note on the nearest
 * step), recorded as literals to ±3 points (E17). A better reading raises
 * them, and when a step does, its test here becomes a floor the reading must
 * stay above: the pawl (ratchet W3). Until then they say how bad it is.
 */
describe('the Muse’s baseline reading of a sloppy hand (E17)', () => {
  const rate = (sloppiness: number) => readingRate(BASELINE, sloppiness, KEY);

  it('reads an exact hand right every time, and 10 ms off nearly every time', () => {
    const exact = rate(0);
    expect(exact.right).toBe(exact.bars);
    const near = rate(10);
    expect(near.right / near.bars).toBeGreaterThan(0.97);
  });

  it.each([
    [20, 0.69],
    [30, 0.27],
    [60, 0.01],
  ])('reads %i ms of sloppiness right about %f of the time', (sloppiness, expected) => {
    const r = rate(sloppiness);
    expect(Math.abs(r.right / r.bars - expected)).toBeLessThan(0.03);
  });

  it('loses more the sloppier the hand', () => {
    const shares = [0, 10, 20, 30, 40, 60, 100].map((s) => {
      const r = readingRate(BASELINE, s, KEY);
      return r.right / r.bars;
    });
    shares.forEach((share, i) => i > 0 && expect(share).toBeLessThan(shares[i - 1]!));
  });

  it('mostly loses to rests that were never meant, and a note strayed into the bar before', () => {
    const r = readingRate(BASELINE, 30, KEY);
    expect(r.causes.rests / r.bars).toBeGreaterThan(0.5);
    expect(r.causes.strayed / r.bars).toBeGreaterThan(0.05);
  });
});
