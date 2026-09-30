import { describe, expect, it } from 'vitest';
import { analyse, PIANO_BANDS } from './analyse.ts';
import { bandCentres } from './bands.ts';
import { harmonic, noise, sine } from './signals.ts';

const sampleRate = 48000;
const indexOfMax = (x: Float64Array) => x.reduce((top, v, i) => (v > x[top]! ? i : top), 0);

describe('analyse', () => {
  it('says how loud, what pitch from which frame, and where the energy lies, of one sound', () => {
    const a = analyse(sine(440, 16384, sampleRate, { amplitude: 0.5 }), sampleRate);
    expect(a.level.db).toBeCloseTo(20 * Math.log10(0.5 / Math.SQRT2), 1);
    expect(a.pitch!.hz).toBeCloseTo(440, 1);
    expect(a.frame).toBe(4096);
    expect(a.bands.length).toBe(bandCentres(PIANO_BANDS).length);
    expect(bandCentres(PIANO_BANDS)[indexOfMax(a.bands)]).toBeCloseTo(440, -1);
  });

  it('takes a longer frame for the pitch of a low note than it draws the spectrum from', () => {
    const a = analyse(sine(55, 16384, sampleRate), sampleRate);
    expect(a.frame).toBe(16384);
    expect(Math.abs(1200 * Math.log2(a.pitch!.hz / 55))).toBeLessThan(1);
  });

  it('finds silence quiet, pitchless and flat at the floor', () => {
    const a = analyse(new Float64Array(16384), sampleRate);
    expect(a.pitch).toBeUndefined();
    expect(a.level.db).toBe(-Infinity);
    expect(Math.max(...a.bands)).toBe(-90);
  });

  it('finds no pitch in noise, but a level and a spread spectrum', () => {
    const a = analyse(noise(16384, 4, 0.3), sampleRate);
    expect(a.pitch).toBeUndefined();
    expect(a.level.rms).toBeCloseTo(0.3, 2);
    expect(Math.min(...a.bands)).toBeGreaterThan(-90);
  });

  it('draws the spectrum from a shorter buffer than it was told to, and from the options it is given', () => {
    const a = analyse(sine(440, 3000, sampleRate), sampleRate);
    expect(a.bands.length).toBe(bandCentres(PIANO_BANDS).length);
    const b = analyse(sine(440, 16384, sampleRate), sampleRate, {
      bands: { lowHz: 100, highHz: 1600, perOctave: 12 },
      minFrame: 8192,
    });
    expect(b.bands.length).toBe(49);
    expect(b.frame).toBe(8192);
  });

  it('says what a pitched sound is made of, over the frame the pitch was read from', () => {
    const x = harmonic(220, [1, 0.5, 0.25, 0.125], 16384, sampleRate);
    const a = analyse(x, sampleRate);
    const { profile, fingerprint } = a.timbre!;
    expect(profile.harmonics).toHaveLength(12);
    expect(profile.harmonics[1]!.db!).toBeCloseTo(-6, 0);
    expect(profile.harmonics[3]!.db!).toBeCloseTo(-18, 0);
    expect(profile.width).toBeLessThan(3);
    expect(fingerprint).toHaveLength(12);
    expect(fingerprint[0]).toBe(0);
    expect(fingerprint[11]).toBe(-60);
  });

  it('says nothing of tone where there is no pitch', () => {
    expect(analyse(new Float64Array(16384), sampleRate).timbre).toBeUndefined();
    expect(analyse(noise(16384, 2, 0.4), sampleRate).timbre).toBeUndefined();
  });
});
