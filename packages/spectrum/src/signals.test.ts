import { describe, expect, it } from 'vitest';
import { harmonic, noise, rms, sine, sum } from './signals.ts';

describe('sine', () => {
  it('is the length asked for, at the amplitude and phase asked for', () => {
    const x = sine(1000, 48, 48000, { amplitude: 0.5, phase: Math.PI / 2 });
    expect(x.length).toBe(48);
    expect(x[0]).toBeCloseTo(0.5, 12);
    expect(x[12]).toBeCloseTo(0, 12); // a quarter of a period at 1 kHz is 12 samples of 48 kHz
  });

  it('has the rms of a sine, its amplitude over the root of two', () => {
    expect(rms(sine(440, 48000, 48000, { amplitude: 0.7 }))).toBeCloseTo(0.7 / Math.SQRT2, 6);
  });
});

describe('harmonic', () => {
  it('is the sum of sines at whole multiples, the first amplitude the fundamental', () => {
    const amplitudes = [1, 0.5, 0.25];
    const x = harmonic(220, amplitudes, 1000, 44100);
    const by = sum(amplitudes.map((a, i) => sine(220 * (i + 1), 1000, 44100, { amplitude: a })));
    for (let i = 0; i < 1000; i++) expect(x[i]).toBeCloseTo(by[i]!, 12);
  });

  it('may leave the fundamental out with an amplitude of zero', () => {
    const x = harmonic(220, [0, 1], 1000, 44100);
    const octave = sine(440, 1000, 44100);
    for (let i = 0; i < 1000; i++) expect(x[i]).toBeCloseTo(octave[i]!, 12);
  });
});

describe('noise', () => {
  it('is the same for the same seed, and another for another', () => {
    expect(noise(64, 1)).toEqual(noise(64, 1));
    expect(noise(64, 1)).not.toEqual(noise(64, 2));
  });

  it('has the rms asked for, and no mean to speak of', () => {
    const x = noise(20000, 7, 0.25);
    expect(rms(x)).toBeCloseTo(0.25, 2);
    expect(Math.abs(x.reduce((a, b) => a + b, 0) / x.length)).toBeLessThan(0.01);
  });
});

describe('sum', () => {
  it('adds signals sample by sample, and needs them the same length', () => {
    expect([...sum([Float64Array.of(1, 2), Float64Array.of(10, 20)])]).toEqual([11, 22]);
    expect(() => sum([Float64Array.of(1), Float64Array.of(1, 2)])).toThrow();
  });
});
