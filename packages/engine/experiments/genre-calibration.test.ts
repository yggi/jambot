import { describe, expect, it } from 'vitest';
import { PROTOTYPE_LANDMARKS, calibrate, readLandmarks } from './genre-calibration.ts';

const points = calibrate(PROTOTYPE_LANDMARKS);
const read = calibrate(readLandmarks());
const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const bar = (rows: typeof points, name: string) => rows.find((r) => r.preset === name)!.bar;

describe('does Techno land where techno lands? (E24)', () => {
  it('lands well above chance overall against where the presets read, and better there than against their points (E24)', () => {
    const chance = 1 / read.length;
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(4 * chance);
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(mean(points.map((r) => r.bar)));
    // 0.69 since swing left the style (#360), 0.81 when it was read.
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(0.65);
    // Against the presets' placed points the mean is recorded, not bounded: placements are the composer's intent,
    // readings the critic's, two scales (the owner's ruling on yggi/cells#681, 2026-11-13).
    // On 2026-11-13, per bar, it is 0.655 with no `sync`, 0.528 with the old reading and 0.483 with cells'.
    // Against the placed points no reading beats leaving `sync` out, because the composer barely expresses the axis (#673).
  });

  it('lands Ambient nearly always from either set of landmarks, and Swing jazz, without its swing read, in about 0.7 (E24, #360)', () => {
    expect(bar(points, 'Ambient')).toBeGreaterThan(0.85);
    expect(bar(read, 'Ambient')).toBeGreaterThan(0.85);
    expect(bar(points, 'Swing jazz')).toBeGreaterThan(0.6);
    expect(bar(read, 'Swing jazz')).toBeGreaterThan(0.6);
  });

  it('lands every preset in at least 0.4 of its bars against where the presets read (E24)', () => {
    // Synth-pop reads 0.400 with cells' `sync`, the same as with no `sync` at all (0.425 with the old reading).
    for (const r of read) expect(r.bar, r.preset).toBeGreaterThanOrEqual(0.4);
  });

  it('lands Funk and Bossa nova against where the presets read, and not against their points: the reading is compressed short of their extremes (E23, E24)', () => {
    expect(bar(read, 'Funk')).toBeGreaterThan(0.75);
    expect(bar(read, 'Bossa nova')).toBeGreaterThan(0.5);
    for (const name of ['Funk', 'Bossa nova']) expect(bar(points, name), name).toBeLessThan(0.1);
  });

  it('reads a section no better than a bar: the mean of eight bars adds little (E24)', () => {
    for (const rows of [points, read])
      for (const r of rows) expect(Math.abs(r.section - r.bar), r.preset).toBeLessThan(0.15);
  });
});
