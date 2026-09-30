import { describe, expect, it } from 'vitest';
import { spectrumOf } from './fft.ts';
import { findPeaks } from './peaks.ts';
import { noise, sine, sum } from './signals.ts';

const sampleRate = 8192;
const size = 2048; // a bin is 4 Hz
const binHz = sampleRate / size;

describe('findPeaks', () => {
  it('finds a sine between the bins to within a few hundredths of a bin, at every offset from one bin to the next', () => {
    for (const bin of [20, 100, 300, 900])
      for (let step = -10; step <= 10; step++) {
        const hz = (bin + step / 20) * binHz;
        const [peak] = findPeaks(spectrumOf(sine(hz, size, sampleRate), sampleRate));
        expect(Math.abs(peak!.hz - hz) / binHz, `${hz} Hz`).toBeLessThan(0.03);
        expect(peak!.magnitude, `${hz} Hz`).toBeGreaterThan(0.95);
        expect(peak!.magnitude, `${hz} Hz`).toBeLessThan(1.05);
      }
  });

  it('gives the strongest first, and as many as asked for', () => {
    const x = sum([
      sine(400, size, sampleRate, { amplitude: 0.3 }),
      sine(1200, size, sampleRate, { amplitude: 1 }),
      sine(2000, size, sampleRate, { amplitude: 0.6 }),
    ]);
    // The Hann window's side lobes are peaks too, 31 dB down, so a floor above them keeps the sines.
    const floor = { minMagnitude: 0.05 };
    const peaks = findPeaks(spectrumOf(x, sampleRate), floor);
    expect(peaks.map((p) => Math.round(p.hz))).toEqual([1200, 2000, 400]);
    expect(
      findPeaks(spectrumOf(x, sampleRate), { ...floor, count: 2 }).map((p) => Math.round(p.hz)),
    ).toEqual([1200, 2000]);
  });

  it('leaves out what is below the magnitude asked for', () => {
    const x = sum([sine(400, size, sampleRate, { amplitude: 0.05 }), sine(1200, size, sampleRate)]);
    const peaks = findPeaks(spectrumOf(x, sampleRate), { minMagnitude: 0.1 });
    expect(peaks.map((p) => Math.round(p.hz))).toEqual([1200]);
  });

  it('finds two sines a few bins apart as two, and no peak in nothing', () => {
    const x = sum([sine(1000, size, sampleRate), sine(1000 + 6 * binHz, size, sampleRate)]);
    expect(findPeaks(spectrumOf(x, sampleRate), { minMagnitude: 0.05 }).length).toBe(2);
    expect(findPeaks(spectrumOf(new Float64Array(size), sampleRate))).toEqual([]);
  });

  it('is not led astray by a noise floor far below the sine', () => {
    const x = sum([sine(1500, size, sampleRate), noise(size, 5, 0.001)]);
    const [peak] = findPeaks(spectrumOf(x, sampleRate), { minMagnitude: 0.1 });
    expect(Math.abs(peak!.hz - 1500)).toBeLessThan(1);
  });
});
