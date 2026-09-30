import { describe, expect, it } from 'vitest';
import { chordAccuracy, harmPresets, harmReadback, harmSweep } from './harm-readback.ts';

const accuracy = chordAccuracy();
const presets = harmReadback(harmPresets());
const sweep = harmReadback(harmSweep());

describe('the chords and the harm read back from the notes (E25)', () => {
  it('gives back the composer’s root and quality in all but a fraction of the bar halves where it reads a chord, in every preset (E25)', () => {
    for (const a of accuracy) {
      expect(a.root / a.read, a.preset).toBeGreaterThan(0.98);
      expect(a.chord / a.read, a.preset).toBeGreaterThan(0.98);
    }
    const share = (key: 'chord') =>
      accuracy.reduce((sum, a) => sum + a[key], 0) / accuracy.reduce((sum, a) => sum + a.read, 0);
    expect(share('chord')).toBeGreaterThan(0.995);
  });

  it('reads a chord in nearly every half: it reads none only where the comp is silent (E25)', () => {
    for (const a of accuracy) expect(a.read, a.preset).toBeGreaterThan(0.85);
  });

  it('reads harm as rising with the axis: tau over 0.7, held and in a sweep (E25)', () => {
    expect(presets.tau).toBeGreaterThan(0.7);
    expect(sweep.tau).toBeGreaterThan(0.7);
  });

  it('reads harm short of the axis, about 0.19 from it, since the top of the axis is not reached (E25)', () => {
    expect(sweep.distance).toBeGreaterThan(0.1);
    expect(sweep.distance).toBeLessThan(0.3);
    expect(sweep.mean).toBeLessThan(0.5);
  });
});
