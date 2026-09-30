/**
 * Synthetic signals: sines, harmonic sounds and noise as arrays of samples,
 * the same every time. They are what the estimators are tested on, and the
 * first rungs of a ladder for audio, as a metronome and one voice are for
 * MIDI (#150). The noise is seeded, never `Math.random`, so a failing case
 * can be run again.
 */

export interface SineOptions {
  /** Peak amplitude, 1 by default. */
  amplitude?: number;
  /** Phase in radians at the first sample, 0 by default. */
  phase?: number;
}

/** A sine of `hz`, `length` samples long at `sampleRate`. */
export function sine(
  hz: number,
  length: number,
  sampleRate: number,
  { amplitude = 1, phase = 0 }: SineOptions = {},
): Float64Array {
  const x = new Float64Array(length);
  for (let i = 0; i < length; i++)
    x[i] = amplitude * Math.sin(phase + (2 * Math.PI * hz * i) / sampleRate);
  return x;
}

/**
 * A sound of partials at whole multiples of `fundamental`: `amplitudes[0]`
 * is the fundamental's, `amplitudes[1]` the octave's. An amplitude of 0
 * leaves a partial out, the fundamental too.
 */
export function harmonic(
  fundamental: number,
  amplitudes: readonly number[],
  length: number,
  sampleRate: number,
): Float64Array {
  return sum(
    amplitudes.map((amplitude, i) =>
      sine(fundamental * (i + 1), length, sampleRate, { amplitude }),
    ),
    length,
  );
}

/** A small deterministic generator (mulberry32) of numbers in [0, 1) from a seed. */
function uniform(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** White noise of the given rms, from a seed: uniform samples scaled so their rms is what was asked. */
export function noise(length: number, seed: number, rmsAmplitude = 1): Float64Array {
  const next = uniform(seed);
  const x = new Float64Array(length);
  // Uniform on [−1, 1) has an rms of 1/√3.
  const scale = rmsAmplitude * Math.sqrt(3);
  for (let i = 0; i < length; i++) x[i] = scale * (2 * next() - 1);
  return x;
}

/** The signals added sample by sample. They must be one length, `length` when there are none. */
export function sum(
  signals: readonly ArrayLike<number>[],
  length = signals[0]?.length ?? 0,
): Float64Array {
  const total = new Float64Array(length);
  for (const signal of signals) {
    if (signal.length !== length) throw new Error('signals of different lengths cannot be added');
    for (let i = 0; i < length; i++) total[i]! += signal[i]!;
  }
  return total;
}

/** The root mean square of a signal, 0 for none. */
export function rms(signal: ArrayLike<number>): number {
  if (signal.length === 0) return 0;
  let squares = 0;
  for (let i = 0; i < signal.length; i++) squares += signal[i]! * signal[i]!;
  return Math.sqrt(squares / signal.length);
}
