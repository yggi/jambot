import { describe, expect, it } from 'vitest';
import { estimatePitch, mpm, yin, type PitchEstimator } from './pitch.ts';
import { harmonic, noise, sine, sum } from './signals.ts';

const FRAME = 4096;
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);
/** A note's frequency in equal temperament at A4 = 440, written here so this package needs no other. */
const hzOf = (midi: number, cents = 0) => 440 * 2 ** ((midi - 69 + cents / 100) / 12);
const centsBetween = (hz: number, expected: number) => 1200 * Math.log2(hz / expected);

/**
 * How far off each estimator is allowed to be, from what the two measured on
 * these signals (a frame of 4096): the sine's worst, and the worst in noise by
 * register, where a low note has few periods in the frame to average the noise
 * over. McLeod's is the tighter, which is why `estimatePitch` is it.
 */
const bounds = {
  mpm: { sine: 1, noise: (midi: number) => (midi < 72 ? 12 : midi < 84 ? 4 : 2) },
  yin: {
    sine: 2.5,
    noise: (midi: number) => (midi < 48 ? 30 : midi < 72 ? 12 : midi < 84 ? 5 : 3),
  },
};

const estimators: [keyof typeof bounds, PitchEstimator][] = [
  ['mpm', mpm],
  ['yin', yin],
];

describe.each(estimators)('%s', (name, estimate) => {
  it('reads a sine within a cent or two, at every note from E1 to C7, detuned up and down, at two sample rates', () => {
    for (const sampleRate of [44100, 48000])
      for (const midi of range(28, 96))
        for (const cents of [-40, -15, 0, 15, 40]) {
          const expected = hzOf(midi, cents);
          const found = estimate(sine(expected, FRAME, sampleRate), sampleRate);
          const at = `${midi} ${cents} cents at ${sampleRate}`;
          expect(found, at).toBeDefined();
          expect(Math.abs(centsBetween(found!.hz, expected)), at).toBeLessThan(bounds[name].sine);
        }
  });

  it('does not care how loud the sound is', () => {
    for (const amplitude of [0.001, 0.05, 1])
      expect(estimate(sine(220, FRAME, 48000, { amplitude }), 48000)!.hz).toBeCloseTo(220, 0);
  });

  it('reads the fundamental of a rich sound, over a range of notes and of partial profiles', () => {
    const profiles = [
      [1, 0.5, 0.33, 0.25, 0.2, 0.16],
      [0.4, 1, 0.5, 0.3], // a second partial above the first, like a guitar's low string
      [0.3, 0.2, 1, 0.5], // a third above it
      [1, 0, 0.5, 0, 0.3], // odd partials only, as a clarinet
    ];
    for (const profile of profiles)
      for (const midi of range(40, 84))
        for (const cents of [-30, 0, 30]) {
          const expected = hzOf(midi, cents);
          const found = estimate(harmonic(expected, profile, FRAME, 48000), 48000);
          const at = `${midi} ${cents} cents, partials ${profile}`;
          expect(found, at).toBeDefined();
          expect(Math.abs(centsBetween(found!.hz, expected)), at).toBeLessThan(2);
        }
  });

  it('hears a missing fundamental: the pitch of the partials that are there', () => {
    for (const midi of range(45, 76)) {
      const expected = hzOf(midi);
      const found = estimate(harmonic(expected, [0, 1, 0.8, 0.6, 0.4], FRAME, 48000), 48000);
      expect(Math.abs(centsBetween(found!.hz, expected)), `${midi}`).toBeLessThan(2);
    }
  });

  it('holds its pitch in noise 17 dB below the sound, to within a few cents, more of them for a low note', () => {
    for (const midi of range(36, 88))
      for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const expected = hzOf(midi, seed * 7);
        const x = sum([sine(expected, FRAME, 48000, { amplitude: 1 }), noise(FRAME, seed, 0.1)]);
        const found = estimate(x, 48000);
        expect(Math.abs(centsBetween(found!.hz, expected)), `${midi} seed ${seed}`).toBeLessThan(
          bounds[name].noise(midi),
        );
      }
  });

  it('says there is no pitch in silence, and none in noise', () => {
    expect(estimate(new Float64Array(FRAME), 48000)).toBeUndefined();
    for (const seed of [1, 2, 3, 4, 5])
      expect(estimate(noise(FRAME, seed, 0.5), 48000), `${seed}`).toBeUndefined();
  });

  it('gives a clarity that is high for a clean sound and lower in noise', () => {
    const clean = estimate(sine(330, FRAME, 48000), 48000)!;
    const noisy = estimate(sum([sine(330, FRAME, 48000), noise(FRAME, 3, 0.4)]), 48000)!;
    expect(clean.clarity).toBeGreaterThan(0.95);
    expect(noisy.clarity).toBeLessThan(clean.clarity);
  });

  it('stays inside the range asked for', () => {
    const x = sine(110, FRAME, 48000);
    expect(estimate(x, 48000, { minHz: 200 })?.hz ?? 0).not.toBeCloseTo(110, 0);
    expect(estimate(x, 48000, { minHz: 50, maxHz: 500 })!.hz).toBeCloseTo(110, 0);
  });
});

describe('estimatePitch', () => {
  it('is the McLeod method, the estimator that measured the tighter', () => {
    expect(estimatePitch).toBe(mpm);
  });
});
