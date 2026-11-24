import { describe, expect, it } from 'vitest';
import { chordAccuracy, harmPresets, harmReadback, harmSweep } from './harm-readback.ts';

const accuracy = chordAccuracy();
const presets = harmReadback(harmPresets());
const sweep = harmReadback(harmSweep());

describe('the chords and the harm read back from the notes (E25)', () => {
  it('gives back the composer’s root and quality in all but a fraction of the bar halves where it reads a chord, in every preset (E25)', () => {
    // (above 0.98 in every preset before #655's song forms; Bossa nova's songs read 0.975; since cells v0.30.0, whose jazz
    // solos rest the pad, a half the stab alone sounds is read less well: Bossa nova 0.960, Swing jazz 0.974, where it
    // was 0.997, and 0.993 in all, where it was 0.996)
    for (const a of accuracy) {
      expect(a.root / a.read, a.preset).toBeGreaterThan(0.95);
      expect(a.chord / a.read, a.preset).toBeGreaterThan(0.95);
    }
    const share = (key: 'chord') =>
      accuracy.reduce((sum, a) => sum + a[key], 0) / accuracy.reduce((sum, a) => sum + a.read, 0);
    expect(share('chord')).toBeGreaterThan(0.99);
  });

  it('reads a chord in nearly every half: it reads none only where the comp is silent (E25)', () => {
    // (since cells v0.30.0 the jazz solos rest the pad, so Bossa nova reads a chord in 0.775 of its halves and Swing jazz
    // in 0.597, where they read 0.872 and 0.894; every other preset over 0.85 as before)
    const SOLOS = ['Bossa nova', 'Swing jazz'];
    for (const a of accuracy)
      expect(a.read, a.preset).toBeGreaterThan(SOLOS.includes(a.preset) ? 0.55 : 0.85);
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
