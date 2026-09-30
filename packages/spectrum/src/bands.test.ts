import { describe, expect, it } from 'vitest';
import { bandCentres, logBands } from './bands.ts';
import { spectrumOf } from './fft.ts';
import { sine, sum } from './signals.ts';

const sampleRate = 48000;
const options = { lowHz: 27.5, highHz: 4186.01, perOctave: 24 };

describe('bandCentres', () => {
  it('runs from the low end up by a constant ratio, a band for every quarter tone, and stops at the high end', () => {
    const centres = bandCentres(options);
    expect(centres[0]).toBeCloseTo(27.5, 9);
    expect(centres.at(-1)!).toBeLessThanOrEqual(4186.01 * 1.0001);
    for (let i = 1; i < centres.length; i++)
      expect(centres[i]! / centres[i - 1]!).toBeCloseTo(2 ** (1 / 24), 9);
    expect(centres.length).toBe(Math.floor(24 * Math.log2(4186.01 / 27.5) + 1e-9) + 1);
  });
});

describe('logBands', () => {
  const bandOf = (hz: number) => Math.round(24 * Math.log2(hz / 27.5));

  it('puts a sine in the band of its note, in decibels below full scale, at every note of a piano', () => {
    for (let midi = 21; midi <= 108; midi++) {
      const hz = 440 * 2 ** ((midi - 69) / 12);
      const bands = logBands(
        spectrumOf(sine(hz, 8192, sampleRate, { amplitude: 0.5 }), sampleRate, 16384),
        options,
      );
      let top = 0;
      bands.forEach((db, i) => {
        if (db > bands[top]!) top = i;
      });
      // Half a bin of the spectrum (2.9 Hz here) is as near as a band can be told, which is more than a band low down.
      const tolerance = Math.ceil((0.5 * (sampleRate / 16384)) / (hz * (2 ** (1 / 24) - 1)) - 1e-9);
      expect(Math.abs(top - bandOf(hz)), `${midi}`).toBeLessThanOrEqual(tolerance);
      expect(bands[top]!, `${midi}`).toBeGreaterThan(20 * Math.log10(0.5) - 1.5);
      expect(bands[top]!, `${midi}`).toBeLessThan(20 * Math.log10(0.5) + 1.5);
    }
  });

  it('floors what is quiet at the floor, silence included', () => {
    const silent = logBands(spectrumOf(new Float64Array(4096), sampleRate), {
      ...options,
      floorDb: -90,
    });
    expect(Math.max(...silent)).toBe(-90);
    expect(Math.min(...silent)).toBe(-90);
  });

  it('keeps two sines an octave apart as two bands that stand out', () => {
    const x = sum([sine(220, 8192, sampleRate), sine(440, 8192, sampleRate)]);
    const bands = logBands(spectrumOf(x, sampleRate, 16384), options);
    expect(bands[bandOf(220)]!).toBeGreaterThan(-3);
    expect(bands[bandOf(440)]!).toBeGreaterThan(-3);
    expect(bands[bandOf(311)]!).toBeLessThan(-30);
  });

  it('holds a low note on a coarse spectrum to within a few bands, all a bin of its width allows', () => {
    // 4096 samples at 48 kHz: a bin is 11.7 Hz, and a quarter tone at 55 Hz is 0.8 Hz.
    const bands = logBands(spectrumOf(sine(55, 4096, sampleRate), sampleRate), options);
    let top = 0;
    bands.forEach((db, i) => {
      if (db > bands[top]!) top = i;
    });
    expect(Math.abs(top - bandOf(55))).toBeLessThanOrEqual(3); // a bin is 10 bands wide here: no better can be drawn
  });
});
