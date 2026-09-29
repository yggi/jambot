import { describe, expect, it } from 'vitest';
import { estimateSwing, readOnsets } from './reading.ts';
import { swingMap } from './swing.ts';

const range = (n: number) => [...Array(n).keys()];
const TOUR = range(8 * 16);

describe('reading onsets', () => {
  it.each([0, 0.15, 0.3, 0.5, 0.7, 0.85, 1])(
    'recovers swing %s and every step of a bar tour exactly (A6)',
    (swing) => {
      const played = TOUR.map((step) => swingMap(swing).played(step));
      const read = readOnsets(played);
      expect(read.swing).toBeCloseTo(swing, 2);
      expect(read.steps).toEqual(TOUR);
      read.residuals.forEach((r) => expect(Math.abs(r)).toBeLessThan(0.02));
    },
  );

  it('keeps what rounding leaves as each onset’s residual', () => {
    const read = readOnsets([0.2, 4.9, 8]);
    expect(read.steps).toEqual([0, 5, 8]);
    read.residuals.forEach((r, i) => expect(read.written[i]! - read.steps[i]!).toBeCloseTo(r, 12));
  });

  it('finds no swing in no onsets', () => {
    expect(estimateSwing([])).toBe(0);
    expect(readOnsets([])).toEqual({ swing: 0, written: [], steps: [], residuals: [] });
  });
});
