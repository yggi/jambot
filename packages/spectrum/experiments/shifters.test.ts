import { estimatePitch, sine, rms } from '../src/index.ts';
import { describe, expect, it } from 'vitest';
import { phaseVocoder, psola } from './shifters.ts';

const sampleRate = 48000;
const seconds = 1.5;
const length = sampleRate * seconds;
const cents = (hz: number, expected: number) => 1200 * Math.log2(hz / expected);
const middle = (x: Float64Array) => x.slice(0.5 * sampleRate, 0.5 * sampleRate + 16384);

/** The two shifters behind one signature: a signal, its true period in samples, the ratio at each sample. */
const shifters = {
  psola: (x: Float64Array, hz: number, ratio: (i: number) => number) =>
    psola(x, () => sampleRate / hz, ratio),
  'phase vocoder': (x: Float64Array, _hz: number, ratio: (i: number) => number) =>
    phaseVocoder(x, sampleRate, ratio, { frame: 2048 }),
};

describe.each(Object.entries(shifters))('%s', (name, shift) => {
  const tolerance = name === 'psola' ? 1.5 : 4;

  it('gives a signal of the length it was given', () => {
    expect(shift(sine(220, length, sampleRate), 220, () => 1.05)).toHaveLength(length);
  });

  it('moves a sine to the pitch asked for, up and down, within a few cents', () => {
    for (const hz of [110, 220, 440, 880])
      for (const shiftCents of [-300, -100, -20, 20, 100, 300]) {
        const out = shift(sine(hz, length, sampleRate), hz, () => 2 ** (shiftCents / 1200));
        const found = estimatePitch(middle(out), sampleRate)!;
        const target = hz * 2 ** (shiftCents / 1200);
        expect(Math.abs(cents(found.hz, target)), `${hz} Hz ${shiftCents} cents`).toBeLessThan(
          tolerance,
        );
      }
  });

  it('leaves a sine at its own pitch and level when the ratio is 1', () => {
    const x = sine(220, length, sampleRate, { amplitude: 0.5 });
    const out = shift(x, 220, () => 1);
    expect(Math.abs(cents(estimatePitch(middle(out), sampleRate)!.hz, 220))).toBeLessThan(0.5);
    expect(rms(middle(out)) / rms(middle(x))).toBeGreaterThan(0.9);
    expect(rms(middle(out)) / rms(middle(x))).toBeLessThan(1.1);
  });

  it('keeps the level when it shifts, to within 2 dB', () => {
    const x = sine(220, length, sampleRate, { amplitude: 0.5 });
    for (const shiftCents of [-200, 200]) {
      const out = shift(x, 220, () => 2 ** (shiftCents / 1200));
      const db = 20 * Math.log10(rms(middle(out)) / rms(middle(x)));
      expect(Math.abs(db), `${shiftCents}`).toBeLessThan(2);
    }
  });

  it('follows a ratio that changes: the second half sounds a whole tone higher than the first', () => {
    const half = length / 2;
    const out = shift(sine(220, length, sampleRate), 220, (i) =>
      i < half ? 1 : 2 ** (200 / 1200),
    );
    const first = estimatePitch(out.slice(0.2 * sampleRate, 0.2 * sampleRate + 8192), sampleRate)!;
    const second = estimatePitch(out.slice(1.1 * sampleRate, 1.1 * sampleRate + 8192), sampleRate)!;
    expect(Math.abs(cents(first.hz, 220))).toBeLessThan(tolerance);
    expect(Math.abs(cents(second.hz, 220 * 2 ** (200 / 1200)))).toBeLessThan(tolerance);
  });
});
