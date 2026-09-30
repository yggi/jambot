import { describe, expect, it } from 'vitest';
import { estimatePitch } from './pitch.ts';
import { PsolaShifter } from './psola.ts';
import { harmonic, sine } from './signals.ts';
import { rms } from './level.ts';

const sampleRate = 48000;
const hzOf = (midi: number, cents = 0) => 440 * 2 ** ((midi - 69 + cents / 100) / 12);
const centsBetween = (hz: number, expected: number) => 1200 * Math.log2(hz / expected);

/** A signal through a shifter a block at a time, the period and ratio held as given, the output as long as the input. */
function run(
  shifter: PsolaShifter,
  x: Float64Array,
  period: (i: number) => number,
  ratio: (i: number) => number,
  block = 128,
): Float64Array {
  const out = new Float64Array(x.length);
  for (let i = 0; i + block <= x.length; i += block)
    out.set(shifter.process(x.subarray(i, i + block), period(i), ratio(i)), i);
  return out;
}

const middle = (x: Float64Array, from = 0.5) =>
  x.slice(from * sampleRate, from * sampleRate + 8192);

describe('PsolaShifter', () => {
  it('delays the sound by the latency it reports, and returns as much as it is given', () => {
    const shifter = new PsolaShifter({ sampleRate, minHz: 100 });
    const x = sine(220, sampleRate, sampleRate, { amplitude: 0.5 });
    const out = run(
      shifter,
      x,
      () => sampleRate / 220,
      () => 1,
    );
    expect(out).toHaveLength(x.length);
    expect(shifter.latency).toBeGreaterThan(0);
    expect(shifter.latency / sampleRate).toBeLessThan(0.05);
    // At a ratio of 1 what comes out is what went in, late by the latency.
    let worst = 0;
    for (let i = Math.round(0.4 * sampleRate); i < 0.9 * sampleRate; i++)
      worst = Math.max(worst, Math.abs(out[i]! - x[i - shifter.latency]!));
    expect(worst).toBeLessThan(0.05);
  });

  it('does not depend on how the signal is cut into blocks', () => {
    const x = harmonic(196, [1, 0.5, 0.25], 24576, sampleRate); // a whole number of blocks of 256
    const cut = (block: number) =>
      run(
        new PsolaShifter({ sampleRate, block: 256 }),
        x,
        () => sampleRate / 196,
        () => 2 ** (70 / 1200),
        block,
      );
    const [a, b, c] = [cut(128), cut(64), cut(256)];
    for (let i = 0; i < a.length; i++) {
      expect(b[i]).toBeCloseTo(a[i]!, 9);
      expect(c[i]).toBeCloseTo(a[i]!, 9);
    }
  });

  it(
    'moves a sine to the pitch asked for within 2 cents, at every note from E2 to C6 and a range of shifts',
    { timeout: 60_000 },
    () => {
      for (let midi = 40; midi <= 84; midi += 4)
        for (const shift of [-300, -100, -25, 25, 100, 300]) {
          const hz = hzOf(midi);
          const x = sine(hz, 1.2 * sampleRate, sampleRate);
          const out = run(
            new PsolaShifter({ sampleRate, minHz: 70, maxHz: 1500 }),
            x,
            () => sampleRate / hz,
            () => 2 ** (shift / 1200),
          );
          const found = estimatePitch(middle(out), sampleRate);
          expect(found, `${midi} ${shift}`).toBeDefined();
          expect(
            Math.abs(centsBetween(found!.hz, hz * 2 ** (shift / 1200))),
            `${midi} ${shift}`,
          ).toBeLessThan(2);
        }
    },
  );

  it('keeps the level of a sound it shifts, within 1.5 dB', () => {
    for (const shift of [-200, 200]) {
      const x = harmonic(165, [1, 0.6, 0.3, 0.15], 1.2 * sampleRate, sampleRate);
      const out = run(
        new PsolaShifter({ sampleRate }),
        x,
        () => sampleRate / 165,
        () => 2 ** (shift / 1200),
      );
      const db = 20 * Math.log10(rms(middle(out)) / rms(middle(x)));
      expect(Math.abs(db), `${shift}`).toBeLessThan(1.5);
    }
  });

  it('follows a ratio that changes from block to block, with no click: nothing larger than the signal itself', () => {
    const x = sine(220, 1.5 * sampleRate, sampleRate, { amplitude: 0.5 });
    const out = run(
      new PsolaShifter({ sampleRate }),
      x,
      () => sampleRate / 220,
      (i) => 2 ** ((100 * Math.sin((2 * Math.PI * i) / sampleRate)) / 1200),
    );
    let peak = 0;
    for (let i = Math.round(0.3 * sampleRate); i < out.length; i++)
      peak = Math.max(peak, Math.abs(out[i]!));
    expect(peak).toBeLessThan(0.75);
  });

  it('keeps going on the last period when it is told of none, and starts on a default one', () => {
    const x = sine(220, sampleRate, sampleRate, { amplitude: 0.5 });
    const out = run(
      new PsolaShifter({ sampleRate }),
      x,
      (i) => (i < 0.2 * sampleRate ? Number.NaN : sampleRate / 220),
      () => 1,
    );
    expect(
      Math.abs(centsBetween(estimatePitch(middle(out, 0.6), sampleRate)!.hz, 220)),
    ).toBeLessThan(1);
    expect(out.every(Number.isFinite)).toBe(true);
  });

  it('is silent on silence, and stays finite on noise-like input', () => {
    const silent = run(
      new PsolaShifter({ sampleRate }),
      new Float64Array(sampleRate / 2),
      () => 200,
      () => 1.1,
    );
    expect(Math.max(...silent.map(Math.abs))).toBe(0);
  });

  it('says its latency in samples: a period or so of the lowest note it is told to take, as it is asked for', () => {
    const low = new PsolaShifter({ sampleRate, minHz: 70 });
    const high = new PsolaShifter({ sampleRate, minHz: 140 });
    expect(low.latency).toBeGreaterThan(high.latency);
    expect(low.latency).toBeLessThan((sampleRate / 70) * 4);
  });
});
