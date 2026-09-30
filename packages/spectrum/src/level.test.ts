import { describe, expect, it } from 'vitest';
import { levelOf, rms } from './level.ts';
import { sine } from './signals.ts';

describe('levelOf', () => {
  it('reads a sine by its rms, its peak and its decibels below full scale', () => {
    const level = levelOf(sine(440, 48000, 48000, { amplitude: 0.5 }));
    expect(level.rms).toBeCloseTo(0.5 / Math.SQRT2, 6);
    expect(level.peak).toBeCloseTo(0.5, 4);
    expect(level.db).toBeCloseTo(20 * Math.log10(0.5 / Math.SQRT2), 4); // −9.03 dB
  });

  it('reads a full-scale square as 0 dB, and silence as minus infinity with no rms', () => {
    const square = Float64Array.from({ length: 100 }, (_, i) => (i % 2 ? 1 : -1));
    expect(levelOf(square).db).toBeCloseTo(0, 9);
    expect(levelOf(new Float64Array(100))).toEqual({ rms: 0, peak: 0, db: -Infinity });
    expect(levelOf(new Float64Array(0))).toEqual({ rms: 0, peak: 0, db: -Infinity });
  });

  it('has rms on its own, 0 for no samples', () => {
    expect(rms([3, 4])).toBeCloseTo(Math.sqrt(12.5), 12);
    expect(rms([])).toBe(0);
  });
});
