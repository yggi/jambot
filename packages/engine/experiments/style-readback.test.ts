import { describe, expect, it } from 'vitest';
import {
  presetSamples,
  readback,
  sweepSamples,
  timingPresets,
  timingReadback,
  timingSweep,
  timingTour,
  tourSamples,
} from './style-readback.ts';

const by = (set: ReturnType<typeof readback>, axis: string) => set.find((r) => r.axis === axis)!;

const held = readback(presetSamples(16));
const tour = readback(tourSamples(16));
const sweeps = {
  sync: readback(sweepSamples('sync', 16)),
  artic: readback(sweepSamples('artic', 16)),
  energy: readback(sweepSamples('energy', 16)),
};

describe('the style read back from the notes it wrote (E23)', () => {
  it('reads the articulation from the gate: it rises with the axis, in the presets, its sweep and the tour (E23)', () => {
    expect(by(sweeps.artic, 'artic').tau).toBeGreaterThan(0.9);
    expect(by(held, 'artic').tau).toBeGreaterThan(0.9);
    expect(by(tour, 'artic').tau).toBeGreaterThan(0.6);
  });

  it('reads the articulation short of the axis: about 0.16 away, from a sounding that never reaches staccato (E23)', () => {
    expect(by(sweeps.artic, 'artic').distance).toBeGreaterThan(0.1);
    expect(by(sweeps.artic, 'artic').distance).toBeLessThan(0.25);
  });

  it('reads the syncopation as rising with the axis, but compressed and blurred: the drums carry it, and the chords never leave the grid (E23)', () => {
    expect(by(sweeps.sync, 'sync').tau).toBeGreaterThan(0.25);
    expect(by(held, 'sync').tau).toBeGreaterThan(0.25);
    expect(by(tour, 'sync').tau).toBeGreaterThan(0.1);
    // From the sweep's end to its end the reading covers about a quarter of the axis.
    expect(by(sweeps.sync, 'sync').distance).toBeGreaterThan(0.25);
  });

  it('reads the density as rising with the energy (E23)', () => {
    expect(by(sweeps.energy, 'energy').tau).toBeGreaterThan(0.5);
    expect(by(held, 'energy').tau).toBeGreaterThan(0.4);
    expect(by(tour, 'energy').tau).toBeGreaterThan(0.25);
  });

  it('reads an axis from its own and no other: a sweep of one moves no other reading (E23)', () => {
    for (const [swept, others] of [
      ['sync', ['artic', 'energy']],
      ['artic', ['sync', 'energy']],
      ['energy', ['sync', 'artic']],
    ] as const)
      for (const axis of others)
        expect(Math.abs(by(sweeps[swept], axis).tau), `${swept} → ${axis}`).toBeLessThan(0.05);
  });
});

describe('the timing read back from the clock it was played on (E23)', () => {
  const bpmSweep = timingReadback(timingSweep(16));
  const presets = timingReadback(timingPresets(16));
  const timingTourRead = timingReadback(timingTour(16));

  it('reads the tempo exactly from how long the steps last, held and in a sweep (E23)', () => {
    expect(bpmSweep.bpm.tau).toBe(1);
    expect(bpmSweep.bpm.distance).toBeLessThan(1e-6);
    expect(presets.bpm.tau).toBe(1);
  });

  it('reads the tempo of a moving style within a fraction of a bpm: the glide moves inside the bar (E23)', () => {
    expect(timingTourRead.bpm.tau).toBeGreaterThan(0.9);
    expect(timingTourRead.bpm.distance).toBeLessThan(0.5);
  });
});
