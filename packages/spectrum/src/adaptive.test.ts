import { describe, expect, it } from 'vitest';
import { estimateAdaptive, frameFor } from './adaptive.ts';
import { estimatePitch } from './pitch.ts';
import { harmonic, noise, sine, sum } from './signals.ts';

const sampleRate = 48000;
const hzOf = (midi: number, cents = 0) => 440 * 2 ** ((midi - 69 + cents / 100) / 12);
const centsBetween = (hz: number, expected: number) => 1200 * Math.log2(hz / expected);
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);
const newest = (x: ArrayLike<number>, n: number) =>
  Array.prototype.slice.call(x, x.length - n) as number[];

describe('frameFor', () => {
  it('is the smallest power of two that holds the periods, between the limits', () => {
    expect(frameFor(440, 48000, 16, 4096, 16384)).toBe(4096); // 16 periods of 440 Hz is 1745 samples
    expect(frameFor(110, 48000, 16, 4096, 16384)).toBe(8192); // 6982
    expect(frameFor(82.41, 48000, 16, 4096, 16384)).toBe(16384); // 9319
    expect(frameFor(41.2, 48000, 16, 4096, 16384)).toBe(16384); // 18640, held at the limit
    expect(frameFor(1000, 48000, 16, 4096, 16384)).toBe(4096);
  });

  it('never drops below the shortest frame, and is one of the powers of two', () => {
    for (let hz = 20; hz < 5000; hz *= 1.05) {
      const frame = frameFor(hz, sampleRate, 16, 4096, 16384);
      expect(Math.log2(frame) % 1).toBe(0);
      expect(frame).toBeGreaterThanOrEqual(4096);
      expect(frame).toBeLessThanOrEqual(16384);
    }
  });
});

describe('estimateAdaptive', () => {
  it('takes the frame a note needs: the lower the note, the longer, from E1 to E6', () => {
    let previous = Infinity;
    for (const midi of range(28, 88).reverse()) {
      const x = sine(hzOf(midi), 16384, sampleRate);
      const { frame, pitch } = estimateAdaptive(x, sampleRate);
      expect(pitch, `${midi}`).toBeDefined();
      expect(frame, `${midi}`).toBe(frameFor(hzOf(midi), sampleRate, 16, 4096, 16384));
      expect(frame, `${midi}`).toBeGreaterThanOrEqual(previous === Infinity ? 0 : previous);
      previous = frame;
    }
  });

  it('reads every note from E1 to E6 within a cent, whatever frame it took', () => {
    for (const midi of range(28, 88))
      for (const cents of [-30, 0, 30]) {
        const expected = hzOf(midi, cents);
        const { pitch } = estimateAdaptive(sine(expected, 16384, sampleRate), sampleRate);
        expect(Math.abs(centsBetween(pitch!.hz, expected)), `${midi} ${cents}`).toBeLessThan(1);
      }
  });

  it('is steadier than the short frame in noise, for a low note, where the short frame holds few periods', () => {
    const errors = { adaptive: [] as number[], short: [] as number[] };
    for (const midi of range(28, 47))
      for (const seed of range(1, 10)) {
        const expected = hzOf(midi, seed * 7 - 35);
        const x = sum([sine(expected, 16384, sampleRate), noise(16384, seed, 0.1)]);
        errors.adaptive.push(centsBetween(estimateAdaptive(x, sampleRate).pitch!.hz, expected));
        errors.short.push(centsBetween(estimatePitch(newest(x, 4096), sampleRate)!.hz, expected));
      }
    const rmsOf = (e: number[]) => Math.sqrt(e.reduce((s, v) => s + v * v, 0) / e.length);
    // Measured: 2.4 to 2.6 cents against 3.7 to 4.2.
    expect(rmsOf(errors.adaptive)).toBeLessThan(0.8 * rmsOf(errors.short));
    expect(rmsOf(errors.adaptive)).toBeLessThan(3.5);
  });

  it('keeps the short frame for a high note, which holds periods enough, so it answers as fast', () => {
    for (const midi of range(60, 100)) {
      const x = sum([sine(hzOf(midi), 16384, sampleRate), noise(16384, midi, 0.05)]);
      expect(estimateAdaptive(x, sampleRate).frame, `${midi}`).toBe(4096);
    }
  });

  it('follows a note that changes: the old note is not in the short frame a high note takes', () => {
    const x = Float64Array.from([...sine(110, 12288, sampleRate), ...sine(880, 4096, sampleRate)]);
    const { pitch, frame } = estimateAdaptive(x, sampleRate);
    expect(frame).toBe(4096);
    expect(Math.abs(centsBetween(pitch!.hz, 880))).toBeLessThan(1);
  });

  it('hears a low note whose fundamental is missing, from its partials, and then holds the frame the note needs', () => {
    for (const midi of range(33, 45)) {
      const expected = hzOf(midi);
      const x = harmonic(expected, [0, 1, 0.8, 0.6], 16384, sampleRate);
      const { pitch, frame } = estimateAdaptive(x, sampleRate);
      expect(Math.abs(centsBetween(pitch!.hz, expected)), `${midi}`).toBeLessThan(3);
      expect(frame, `${midi}`).toBe(frameFor(expected, sampleRate, 16, 4096, 16384));
    }
  });

  it('says there is no pitch in silence and in noise, and looks no further than the short frame', () => {
    expect(estimateAdaptive(new Float64Array(16384), sampleRate)).toEqual({
      pitch: undefined,
      frame: 4096,
    });
    for (const seed of [1, 2, 3])
      expect(estimateAdaptive(noise(16384, seed, 0.5), sampleRate).pitch).toBeUndefined();
  });

  it('works on a buffer shorter than the frame it would take, with the most of it that is a power of two', () => {
    const x = sine(440, 5000, sampleRate);
    const { pitch, frame } = estimateAdaptive(x, sampleRate);
    expect(frame).toBe(4096);
    expect(Math.abs(centsBetween(pitch!.hz, 440))).toBeLessThan(1);
    const short = estimateAdaptive(sine(440, 2500, sampleRate), sampleRate);
    expect(short.frame).toBeLessThanOrEqual(2048);
    expect(estimateAdaptive(new Float64Array(1), sampleRate).pitch).toBeUndefined();
  });

  it('stays within the limits it is given', () => {
    const x = sine(hzOf(28), 16384, sampleRate);
    expect(estimateAdaptive(x, sampleRate, { maxFrame: 8192 }).frame).toBeLessThanOrEqual(8192);
    expect(
      estimateAdaptive(sine(440, 16384, sampleRate), sampleRate, { minFrame: 8192 }).frame,
    ).toBe(8192);
  });
});
