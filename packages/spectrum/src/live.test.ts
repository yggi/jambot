import { describe, expect, it } from 'vitest';
import { MAJOR } from './corrector.ts';
import { LiveCorrector } from './live.ts';
import { estimatePitch } from './pitch.ts';
import { harmonic, sine } from './signals.ts';

const sampleRate = 48000;
const hzOf = (note: number) => 440 * 2 ** ((note - 69) / 12);
const cents = (hz: number, expected: number) => 1200 * Math.log2(hz / expected);

function run(live: LiveCorrector, x: Float64Array, block = 128): Float64Array {
  const out = new Float64Array(x.length);
  for (let i = 0; i + block <= x.length; i += block)
    out.set(live.process(x.subarray(i, i + block)), i);
  return out;
}

const pitchAt = (x: Float64Array, seconds: number) =>
  estimatePitch(
    x.slice(Math.round(seconds * sampleRate), Math.round(seconds * sampleRate) + 4096),
    sampleRate,
  )!.hz;

/** A pitch that wavers: a note, its vibrato and a slow wander, in cents, at every sample. */
function voice(
  note: number,
  seconds: number,
  wander: number,
  vibrato: number,
  timbre: number[],
): Float64Array {
  const n = Math.round(seconds * sampleRate);
  const f0 = Float64Array.from({ length: n }, (_, i) => {
    const t = i / sampleRate;
    const off =
      vibrato * Math.sin(2 * Math.PI * 5.5 * t) + wander * Math.sin(2 * Math.PI * 0.7 * t + 1);
    return hzOf(note + off / 100);
  });
  const x = new Float64Array(n);
  const phases = new Float64Array(timbre.length);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < timbre.length; k++) {
      phases[k]! += (2 * Math.PI * f0[i]! * (k + 1)) / sampleRate;
      x[i]! += timbre[k]! * Math.sin(phases[k]!);
    }
  return x.map((v) => v * 0.4);
}

describe('LiveCorrector', () => {
  it('pulls a sine 20 cents sharp of A2 onto A2, hard, within 4 cents', () => {
    const live = new LiveCorrector({ sampleRate, scale: MAJOR, retuneSeconds: 0 });
    const out = run(live, sine(hzOf(45) * 2 ** (20 / 1200), 1.5 * sampleRate, sampleRate));
    // A window of 1024 holds only 2.3 periods of an A2: the tracker reads it to about 3 cents.
    expect(Math.abs(cents(pitchAt(out, 0.8), hzOf(45)))).toBeLessThan(4);
    expect(live.offsetCents).toBeGreaterThan(-24);
    expect(live.offsetCents).toBeLessThan(-16);
    expect(live.heard).toBeGreaterThan(0);
  });

  it('leaves a sound already in tune where it is', () => {
    const live = new LiveCorrector({ sampleRate, scale: MAJOR, retuneSeconds: 0 });
    const out = run(live, sine(hzOf(57), 1.2 * sampleRate, sampleRate));
    expect(Math.abs(cents(pitchAt(out, 0.7), hzOf(57)))).toBeLessThan(1);
  });

  it('takes a wavering voice, 25 cents of wander and of vibrato, to the scale’s note within 6 cents, at three pitches', () => {
    for (const note of [57, 64, 74]) {
      const live = new LiveCorrector({ sampleRate, scale: MAJOR, retuneSeconds: 0 });
      const x = voice(note, 2, 25, 25, [1, 0.5, 0.25, 0.12]);
      const out = run(live, x);
      const errors: number[] = [];
      for (let t = 0.7; t < 1.7; t += 0.1) errors.push(cents(pitchAt(out, t), hzOf(note)));
      const rmsError = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
      expect(rmsError, `${note}`).toBeLessThan(6);
    }
  });

  it('reports the delay it adds, in samples: a sound that starts comes out that much later, give or take a period', () => {
    const live = new LiveCorrector({ sampleRate, scale: MAJOR, retuneSeconds: 0, limitCents: 0 });
    expect(live.latency / sampleRate).toBeGreaterThan(0.02);
    expect(live.latency / sampleRate).toBeLessThan(0.06);
    const start = Math.round(0.3 * sampleRate);
    const x = new Float64Array(sampleRate);
    x.set(sine(220, sampleRate - start, sampleRate, { amplitude: 0.5 }), start);
    const out = run(live, x);
    const first = out.findIndex((v, i) => i > start && Math.abs(v) > 0.1);
    const late = first - start;
    // A sound is carried by whole periods, so it comes out late by the latency to within one of them.
    expect(Math.abs(late - live.latency)).toBeLessThan(sampleRate / 220 + 2);
  });

  it('changes the scale it snaps to while it runs, and lets the change be heard', () => {
    const live = new LiveCorrector({ sampleRate, scale: [0, 2, 4, 5, 7, 9, 11], retuneSeconds: 0 });
    const x = sine(hzOf(69) * 2 ** (10 / 1200), 2.4 * sampleRate, sampleRate);
    const first = run(live, x.subarray(0, 1.2 * sampleRate));
    expect(Math.abs(cents(pitchAt(first, 0.8), hzOf(69)))).toBeLessThan(2);
    live.corrector.scale = [1, 3, 6, 8, 10]; // the black keys: A is between A♭ and B♭, and takes the higher
    const second = run(live, x.subarray(1.2 * sampleRate));
    expect(Math.abs(cents(pitchAt(second, 0.8), hzOf(70)))).toBeLessThan(3);
  });

  it('is silent for silence, and keeps going through a stretch with no pitch', () => {
    const live = new LiveCorrector({ sampleRate, scale: MAJOR, retuneSeconds: 0.05 });
    const x = new Float64Array(sampleRate);
    x.set(harmonic(220, [1, 0.5], 0.4 * sampleRate, sampleRate), 0);
    const out = run(live, x);
    expect(out.every(Number.isFinite)).toBe(true);
    expect(Math.max(...out.slice(0.7 * sampleRate).map(Math.abs))).toBeLessThan(1e-6);
  });
});
