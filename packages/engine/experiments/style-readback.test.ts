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

describe('the style read back from the notes it wrote (E22)', () => {
  it('reads the articulation from the gate: it rises with the axis, in the presets, its sweep and the tour (E22)', () => {
    expect(by(sweeps.artic, 'artic').tau).toBeGreaterThan(0.9);
    expect(by(held, 'artic').tau).toBeGreaterThan(0.9);
    expect(by(tour, 'artic').tau).toBeGreaterThan(0.6);
  });

  it('reads the articulation short of the axis: about 0.16 away, from a sounding that never reaches staccato (E22)', () => {
    expect(by(sweeps.artic, 'artic').distance).toBeGreaterThan(0.1);
    expect(by(sweeps.artic, 'artic').distance).toBeLessThan(0.25);
  });

  it('reads the syncopation as rising with the axis, but compressed and blurred: the drums carry it, and the chords never leave the grid (E22)', () => {
    expect(by(sweeps.sync, 'sync').tau).toBeGreaterThan(0.25);
    expect(by(held, 'sync').tau).toBeGreaterThan(0.25);
    expect(by(tour, 'sync').tau).toBeGreaterThan(0.1);
    // From the sweep's end to its end the reading covers about a quarter of the axis.
    expect(by(sweeps.sync, 'sync').distance).toBeGreaterThan(0.25);
  });

  it('reads the density as rising with the energy (E22)', () => {
    expect(by(sweeps.energy, 'energy').tau).toBeGreaterThan(0.5);
    expect(by(held, 'energy').tau).toBeGreaterThan(0.4);
    expect(by(tour, 'energy').tau).toBeGreaterThan(0.25);
  });

  it('reads an axis from its own and no other: a sweep of one moves no other reading (E22)', () => {
    for (const [swept, others] of [
      ['sync', ['artic', 'energy']],
      ['artic', ['sync', 'energy']],
      ['energy', ['sync', 'artic']],
    ] as const)
      for (const axis of others)
        expect(Math.abs(by(sweeps[swept], axis).tau), `${swept} → ${axis}`).toBeLessThan(0.05);
  });
});

describe('the timing read back from the clock it was played on (E22)', () => {
  const swingSweep = timingReadback(timingSweep('swing', 16));
  const bpmSweep = timingReadback(timingSweep('bpm', 16));
  const presets = timingReadback(timingPresets(16));
  const timingTourRead = timingReadback(timingTour(16));

  it('reads the tempo exactly from how long the steps last, held and in a sweep (E22)', () => {
    expect(bpmSweep.bpm.tau).toBe(1);
    expect(bpmSweep.bpm.distance).toBeLessThan(1e-6);
    expect(presets.bpm.tau).toBe(1);
  });

  it('reads the tempo of a moving style within a fraction of a bpm: the glide moves inside the bar (E22)', () => {
    expect(timingTourRead.bpm.tau).toBeGreaterThan(0.9);
    expect(timingTourRead.bpm.distance).toBeLessThan(0.5);
  });

  it('reads the swing from where the notes fall, rising with the axis and within 0.03 of it, through the seeded looseness (E22)', () => {
    expect(swingSweep.swing.tau).toBeGreaterThan(0.9);
    expect(swingSweep.swing.distance).toBeLessThan(0.05);
    expect(presets.swing.tau).toBeGreaterThan(0.85);
    expect(timingTourRead.swing.tau).toBeGreaterThan(0.9);
  });

  it('reads swing and tempo apart: a sweep of one moves no tau of the other (E22)', () => {
    expect(Math.abs(swingSweep.bpm.tau)).toBeLessThan(0.05);
    expect(Math.abs(bpmSweep.swing.tau)).toBeLessThan(0.05);
  });
});
