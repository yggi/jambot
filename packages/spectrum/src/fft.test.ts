import { describe, expect, it } from 'vitest';
import { autocorrelation, fft, hann, spectrumOf } from './fft.ts';
import { noise, sine } from './signals.ts';

/** The discrete Fourier transform by its definition, for the size the fast one is checked at. */
function dft(x: ArrayLike<number>) {
  const n = x.length;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let k = 0; k < n; k++)
    for (let j = 0; j < n; j++) {
      const angle = (-2 * Math.PI * k * j) / n;
      re[k]! += x[j]! * Math.cos(angle);
      im[k]! += x[j]! * Math.sin(angle);
    }
  return { re, im };
}

describe('fft', () => {
  it('is the discrete Fourier transform, at every power-of-two size up to 256', () => {
    for (let n = 1; n <= 256; n *= 2) {
      const x = noise(n, n);
      const re = Float64Array.from(x);
      const im = new Float64Array(n);
      fft(re, im);
      const by = dft(x);
      for (let k = 0; k < n; k++) {
        expect(re[k], `re ${k} of ${n}`).toBeCloseTo(by.re[k]!, 9);
        expect(im[k], `im ${k} of ${n}`).toBeCloseTo(by.im[k]!, 9);
      }
    }
  });

  it('takes a complex input, not only a real one', () => {
    const n = 16;
    const a = noise(n, 3);
    const b = noise(n, 4);
    const re = Float64Array.from(a);
    const im = Float64Array.from(b);
    fft(re, im);
    const fa = dft(a);
    const fb = dft(b);
    for (let k = 0; k < n; k++) {
      expect(re[k]).toBeCloseTo(fa.re[k]! - fb.im[k]!, 9);
      expect(im[k]).toBeCloseTo(fa.im[k]! + fb.re[k]!, 9);
    }
  });

  it('keeps the energy: Parseval, the sum of squares over the size', () => {
    const x = noise(1024, 9);
    const re = Float64Array.from(x);
    const im = new Float64Array(1024);
    fft(re, im);
    const time = x.reduce((s, v) => s + v * v, 0);
    const frequency = re.reduce((s, v, k) => s + v * v + im[k]! ** 2, 0) / 1024;
    expect(frequency).toBeCloseTo(time, 9);
  });

  it('refuses a size that is not a power of two, and inputs of different sizes', () => {
    expect(() => fft(new Float64Array(12), new Float64Array(12))).toThrow();
    expect(() => fft(new Float64Array(8), new Float64Array(4))).toThrow();
    expect(() => fft(new Float64Array(0), new Float64Array(0))).toThrow();
  });
});

describe('hann', () => {
  it('rises from 0 to 1 at the middle and falls back, and sums to half its length', () => {
    const w = hann(64);
    expect(w[0]).toBe(0);
    expect(w[32]).toBeCloseTo(1, 12);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(32, 9);
    for (let i = 1; i < 64; i++) expect(w[i]).toBeCloseTo(w[64 - i]!, 12);
  });
});

describe('spectrumOf', () => {
  const sampleRate = 8192;
  const size = 1024; // a bin is 8 Hz

  it('reads a sine that sits on a bin at its amplitude, and everything else far below', () => {
    const spectrum = spectrumOf(sine(800, size, sampleRate, { amplitude: 0.5 }), sampleRate);
    expect(spectrum.binHz).toBe(8);
    expect(spectrum.magnitudes.length).toBe(size / 2 + 1);
    expect(spectrum.magnitudes[100]).toBeCloseTo(0.5, 9);
    const away = spectrum.magnitudes.filter((_, k) => Math.abs(k - 100) > 2);
    expect(Math.max(...away)).toBeLessThan(1e-9);
  });

  it('reads a sine between two bins as close to its amplitude, and above its neighbours', () => {
    const spectrum = spectrumOf(sine(804, size, sampleRate), sampleRate);
    for (const k of [100, 101]) expect(spectrum.magnitudes[k]).toBeGreaterThan(0.8);
    expect(spectrum.magnitudes[99]).toBeLessThan(spectrum.magnitudes[100]!);
    expect(spectrum.magnitudes[102]).toBeLessThan(spectrum.magnitudes[101]!);
  });

  it('pads a short frame with zeros to the size asked for, which only interpolates the same spectrum', () => {
    const spectrum = spectrumOf(sine(800, 512, sampleRate), sampleRate, 2048);
    expect(spectrum.binHz).toBe(4);
    expect(spectrum.magnitudes.length).toBe(1025);
    let top = 0;
    spectrum.magnitudes.forEach((m, k) => {
      if (m > spectrum.magnitudes[top]!) top = k;
    });
    expect(top * spectrum.binHz).toBe(800);
  });

  it('refuses a size that is not a power of two, or smaller than the frame', () => {
    expect(() => spectrumOf(new Float64Array(100), 8000, 100)).toThrow();
    expect(() => spectrumOf(new Float64Array(64), 8000, 32)).toThrow();
  });
});

describe('autocorrelation', () => {
  it('is the sum of products at every lag, as its definition has it', () => {
    for (const n of [1, 5, 8, 100]) {
      const x = noise(n, n + 40);
      const r = autocorrelation(x);
      expect(r.length).toBe(n);
      for (let lag = 0; lag < n; lag++) {
        let by = 0;
        for (let j = 0; j + lag < n; j++) by += x[j]! * x[j + lag]!;
        expect(r[lag], `${n} at ${lag}`).toBeCloseTo(by, 9);
      }
    }
  });
});
