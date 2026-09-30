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
    expect(mean(points.map((r) => r.bar))).toBeGreaterThan(2 * chance);
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(mean(points.map((r) => r.bar)));
  });

  it('lands Ambient nearly always, from either set of landmarks (E23)', () => {
    expect(bar(points, 'Ambient')).toBeGreaterThan(0.85);
    expect(bar(read, 'Ambient')).toBeGreaterThan(0.85);
  });

  it('lands Techno and Funk against where the presets read, and not against their points (E23)', () => {
    for (const name of ['Techno', 'Funk']) {
      expect(bar(read, name), name).toBeGreaterThan(0.5);
      expect(bar(points, name), name).toBeLessThan(0.1);
    }
  });

  it('loses the presets that differ by what the reading lacks: Synth-pop, Lo-fi hip hop and Bossa nova stay under a fifth (E23)', () => {
    for (const name of ['Synth-pop', 'Lo-fi hip hop', 'Bossa nova']) {
      expect(bar(read, name), name).toBeLessThan(0.2);
      expect(bar(points, name), name).toBeLessThan(0.2);
    }
  });

  it('reads a section no better than a bar: the mean of eight bars adds little (E23)', () => {
    for (const rows of [points, read])
      for (const r of rows) expect(Math.abs(r.section - r.bar), r.preset).toBeLessThan(0.15);
  });
});
