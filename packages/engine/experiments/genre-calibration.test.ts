import { describe, expect, it } from 'vitest';
import { PRESET_LANDMARKS } from '../src/index.ts';
import { calibrate, readLandmarks } from './genre-calibration.ts';

const points = calibrate(PRESET_LANDMARKS);
const read = calibrate(readLandmarks());
const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const bar = (rows: typeof points, name: string) => rows.find((r) => r.preset === name)!.bar;

describe('does Techno land where techno lands? (E23)', () => {
  it('lands well above chance overall, and better against where the presets read than against their points (E23)', () => {
    const chance = 1 / points.length;
    expect(mean(points.map((r) => r.bar))).toBeGreaterThan(4 * chance);
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(mean(points.map((r) => r.bar)));
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(0.65);
  });

  it('lands Ambient and Swing jazz nearly always, from either set of landmarks (E23)', () => {
    for (const name of ['Ambient', 'Swing jazz']) {
      expect(bar(points, name), name).toBeGreaterThan(0.85);
      expect(bar(read, name), name).toBeGreaterThan(0.85);
    }
  });

  it('lands Funk and Bossa nova against where the presets read, and not against their points: the reading is compressed short of their extremes (E22, E23)', () => {
    for (const name of ['Funk', 'Bossa nova']) {
      expect(bar(read, name), name).toBeGreaterThan(0.6);
      expect(bar(points, name), name).toBeLessThan(0.05);
    }
  });

  it('loses Deep house most, taking it for Funk, where the two differ by what the reading still lacks: `harm` (E23)', () => {
    const worst = [...read].sort((a, b) => a.bar - b.bar)[0]!;
    expect(worst.preset).toBe('Deep house');
    expect(worst.bar).toBeLessThan(0.55);
    expect(worst.confused).toBe('Funk');
  });

  it('reads a section no better than a bar: the mean of eight bars adds little (E23)', () => {
    for (const rows of [points, read])
      for (const r of rows) expect(Math.abs(r.section - r.bar), r.preset).toBeLessThan(0.15);
  });
});
