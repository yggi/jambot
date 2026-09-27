import { describe, expect, it } from 'vitest';
import { even, isEven } from './even.ts';
import { compose, gaps, heightOf, mirror, shift } from './helix.ts';
import { brightness, modes } from './modes.ts';
import {
  METERS,
  type Meter,
  type Weight,
  meterWeights,
  pulseHelix,
  pulseLengths,
} from './meter.ts';

/** The weight of every subdivision, worked out directly from the pulse positions `even` gives. */
function expectedWeights(meter: Meter): Weight[] {
  const pulses = new Set(pulseHelix(meter).heights);
  return Array.from({ length: meter.subdivisions }, (_, position) =>
    position === 0 ? 'downbeat' : pulses.has(position) ? 'pulse' : 'subdivision',
  );
}

describe('meter', () => {
  it('gives every named meter its pulses and subdivisions', () => {
    expect(METERS).toEqual({
      '3/4': { pulses: 3, subdivisions: 6 },
      '4/4': { pulses: 4, subdivisions: 8 },
      '5/8': { pulses: 2, subdivisions: 5 },
      '6/8': { pulses: 2, subdivisions: 6 },
      '7/8': { pulses: 3, subdivisions: 7 },
      '9/8': { pulses: 3, subdivisions: 9 },
      '12/8': { pulses: 4, subdivisions: 12 },
    });
  });

  it('places every meter’s pulses as evenly as `even` can over its bar’s subdivisions (finite: every meter, every position)', () => {
    for (const meter of Object.values(METERS)) {
      const helix = pulseHelix(meter);
      expect(helix.cycle).toBe(meter.subdivisions);
      expect(helix.heights).toHaveLength(meter.pulses);
      expect(helix.heights[0]).toBe(0);
      expect(isEven(helix)).toBe(true);
    }
  });

  it('weighs every subdivision of every named meter, matching a direct reading (finite: every meter, every position)', () => {
    for (const meter of Object.values(METERS))
      expect(meterWeights(meter)).toEqual(expectedWeights(meter));
  });

  it('marks position 0 the downbeat and no other position, in every meter', () => {
    for (const meter of Object.values(METERS)) {
      const weights = meterWeights(meter);
      expect(weights[0]).toBe('downbeat');
      expect(weights.slice(1)).not.toContain('downbeat');
    }
  });

  it('splits a bar’s pulses into equal lengths for a simple or compound meter (finite: 3/4, 4/4, 6/8, 9/8, 12/8)', () => {
    expect(pulseLengths(METERS['3/4'])).toEqual([2, 2, 2]);
    expect(pulseLengths(METERS['4/4'])).toEqual([2, 2, 2, 2]);
    expect(pulseLengths(METERS['6/8'])).toEqual([3, 3]);
    expect(pulseLengths(METERS['9/8'])).toEqual([3, 3, 3]);
    expect(pulseLengths(METERS['12/8'])).toEqual([3, 3, 3, 3]);
  });

  it('splits a bar’s pulses unequally for an additive meter, the same `even` that groups the bossa clave: 5/8 as 3+2, 7/8 as 3+2+2', () => {
    expect(pulseLengths(METERS['5/8'])).toEqual([3, 2]);
    expect(pulseLengths(METERS['7/8'])).toEqual([3, 2, 2]);
    for (const meter of Object.values(METERS))
      expect(pulseLengths(meter).reduce((a, b) => a + b, 0)).toBe(meter.subdivisions);
  });

  it('makes 3/4 and 6/8 sound different though both hold six subdivisions a bar: grouped in 2s or in 3s', () => {
    expect(METERS['3/4'].subdivisions).toBe(6);
    expect(METERS['6/8'].subdivisions).toBe(6);
    expect(meterWeights(METERS['3/4'])).toEqual([
      'downbeat',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
    ]);
    expect(meterWeights(METERS['6/8'])).toEqual([
      'downbeat',
      'subdivision',
      'subdivision',
      'pulse',
      'subdivision',
      'subdivision',
    ]);
  });

  it('makes 6/8 and 12/8 sound different: both grouped in 3s, but the downbeat recurs every 2 or every 4 pulses', () => {
    expect(pulseHelix(METERS['6/8']).heights).toEqual([0, 3]);
    expect(pulseHelix(METERS['12/8']).heights).toEqual([0, 3, 6, 9]);
  });

  it('groups an additive meter without being told which pulse is which: 5/8 long-short, 7/8 long-short-short', () => {
    expect(pulseHelix(METERS['5/8']).heights).toEqual([0, 3]);
    expect(pulseHelix(METERS['7/8']).heights).toEqual([0, 3, 5]);
  });

  describe('as a helix', () => {
    /** Every way to group n subdivisions into pulses of 2 and 3, from the downbeat. */
    const groupings = (n: number): number[][] =>
      n === 0
        ? [[]]
        : n < 2
          ? []
          : [...groupings(n - 2).map((g) => [2, ...g]), ...groupings(n - 3).map((g) => [3, ...g])];
    /** A helix's groupings: each of its modes, read from the downbeat. */
    const modeGroupings = (k: number, n: number): string[] =>
      modes(even(k, n)).map((m) => gaps(shift(m, -heightOf(m, 0))).join('+'));

    it('groups pulses in 2s and 3s exactly when 2 · pulses ≤ subdivisions ≤ 3 · pulses, and every named meter does (finite: every 2 ≤ k < n ≤ 16) (T6)', () => {
      for (let n = 3; n <= 16; n++)
        for (let k = 2; k < n; k++)
          expect(gaps(even(k, n)).every((g) => g === 2 || g === 3)).toBe(2 * k <= n && n <= 3 * k);
      for (const meter of Object.values(METERS))
        expect(pulseLengths(meter).every((l) => l === 2 || l === 3)).toBe(true);
    });

    it('reads an additive meter’s groupings as the modes of its pulse helix, and `pulseHelix` as the brightest, long first (T6)', () => {
      expect(modeGroupings(2, 5)).toEqual(['3+2', '2+3']);
      expect(modeGroupings(3, 7)).toEqual(['3+2+2', '2+2+3', '2+3+2']);
      expect(modeGroupings(4, 9)).toEqual(['3+2+2+2', '2+2+2+3', '2+2+3+2', '2+3+2+2']);
      for (const meter of Object.values(METERS)) {
        const helix = pulseHelix(meter);
        const brightest = Math.max(
          ...modes(helix).map((m) => brightness(shift(m, -heightOf(m, 0)))),
        );
        expect(brightness(helix)).toBe(brightest);
      }
    });

    it('mirrors a grouping into its retrograde: 7/8’s 3+2+2 into 2+2+3 (T6)', () => {
      for (const meter of Object.values(METERS))
        expect(gaps(mirror(pulseHelix(meter)))).toEqual([...pulseLengths(meter)].reverse());
    });

    it('does not reach every grouping: 79 of the 149 groupings into 2s and 3s of up to 16 subdivisions are modes of `even`, and 10/8’s 3+3+2+2 is the first that is not (T6)', () => {
      let reached = 0;
      let total = 0;
      const missed: string[] = [];
      for (let n = 2; n <= 16; n++)
        for (const grouping of groupings(n)) {
          total++;
          if (modeGroupings(grouping.length, n).includes(grouping.join('+'))) reached++;
          else missed.push(`${n}:${grouping.join('+')}`);
        }
      expect([reached, total]).toEqual([79, 149]);
      expect(missed.slice(0, 4)).toEqual(['10:2+2+3+3', '10:2+3+3+2', '10:3+2+2+3', '10:3+3+2+2']);
    });

    it('is the song’s beat in 4/4: its pulses composed onto a bar of 16 steps, two to a subdivision, are `even(4, 16)` (T6)', () => {
      expect(compose(pulseHelix(METERS['4/4']), even(8, 16))).toEqual(even(4, 16));
    });
  });

  it('has a pulse tempo only where every pulse is as long as the next: a simple or compound meter, never an additive one (finite: every well-formed 2 ≤ k < n ≤ 16) (T7)', () => {
    for (let n = 3; n <= 16; n++)
      for (let k = 2; k < n; k++) {
        if (2 * k > n || n > 3 * k) continue;
        const lengths = pulseLengths({ pulses: k, subdivisions: n });
        expect(new Set(lengths).size === 1).toBe(n % k === 0);
      }
  });
});
