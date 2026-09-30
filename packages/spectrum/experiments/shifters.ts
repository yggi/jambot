/**
 * Two pitch shifters, for the experiment on correcting live audio (#269):
 * PSOLA, which repeats or drops whole periods of the sound, and a phase
 * vocoder, which moves the bins of its spectrum. Each takes a signal and a
 * ratio for every sample (2^(cents / 1200)) and gives a signal of the same
 * length, in step with the input; what each would cost in delay when run
 * live is the experiment's to say, not these functions'.
 *
 * They live with the experiment, outside the pure `src/`, until it says one
 * is worth keeping.
 */

import { fft } from '../src/index.ts';

/** The period of the sound at a sample, in samples, or a value that is not positive where it has none. */
export type PeriodAt = (sample: number) => number;

/**
 * Time-domain pitch-synchronous overlap-add. Marks are laid one period apart
 * and pulled to the nearest peak of the waveform; each output period is the
 * Hann-windowed two periods around the nearest mark, placed a period over the
 * ratio after the last, and the sum is divided by the ratio, since closer
 * windows add up to more. It keeps a voice's formants where they were, for
 * the window is cut from the sound itself. Where there is no period the
 * input is passed through.
 */
export function psola(
  input: ArrayLike<number>,
  periodAt: PeriodAt,
  ratioAt: (sample: number) => number,
): Float64Array {
  const n = input.length;
  const out = new Float64Array(n);
  // The marks: a period apart, the first on the largest sample near the start of a voiced stretch, and each next
  // on the place within a quarter period of where it should fall whose surroundings look most like the last
  // mark's, so a waveform with several peaks to a period is not marked on a different one each time.
  const marks: number[] = [];
  let mark = -1;
  /** Where the next mark should fall, carried as a fraction so whole-sample marks do not drift from the period. */
  let due = 0;
  for (let t = 0; t < n;) {
    const period = periodAt(t);
    if (!(period > 2)) {
      t++;
      mark = -1;
      continue;
    }
    const reach = Math.max(1, Math.floor(period / 4));
    const half = Math.max(2, Math.round(period / 2));
    let best: number;
    if (mark < 0) {
      const centre = Math.round(t + period / 2);
      due = centre;
      best = centre;
      for (let i = centre - Math.round(period / 2); i <= centre + Math.round(period / 2); i++)
        if (i >= 0 && i < n && input[i]! > (input[best] ?? -Infinity)) best = i;
    } else {
      due += period;
      const centre = Math.round(due);
      best = centre;
      let bestScore = -Infinity;
      for (let i = centre - reach; i <= centre + reach; i++) {
        let dot = 0;
        let own = 1e-12;
        let other = 1e-12;
        for (let k = -half; k <= half; k++) {
          const a = mark + k;
          const b = i + k;
          if (a < 0 || b < 0 || a >= n || b >= n) continue;
          dot += input[a]! * input[b]!;
          own += input[a]! * input[a]!;
          other += input[b]! * input[b]!;
        }
        // The likeness of the two surroundings, less a little for each sample from where the period puts the mark.
        const score = dot / Math.sqrt(own * other) - (0.002 * Math.abs(i - due)) / reach;
        if (score > bestScore) [bestScore, best] = [score, i];
      }
    }
    if (best >= n) break;
    marks.push(best);
    mark = best;
    t = best;
  }
  if (marks.length === 0) return Float64Array.from(input);
  const nearest = (at: number) => {
    let lo = 0;
    let hi = marks.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (marks[mid]! < at) lo = mid + 1;
      else hi = mid;
    }
    return lo > 0 && at - marks[lo - 1]! < marks[lo]! - at ? lo - 1 : lo;
  };
  for (let t = marks[0]!; t < n;) {
    const m = marks[nearest(t)]!;
    const exact = periodAt(m);
    const period = Math.max(3, Math.round(exact));
    const ratio = ratioAt(Math.round(t));
    for (let k = -period; k <= period; k++) {
      const from = m + k;
      const to = Math.round(t) + k;
      if (from < 0 || from >= n || to < 0 || to >= n) continue;
      const window = 0.5 + 0.5 * Math.cos((Math.PI * k) / period);
      out[to]! += (input[from]! * window) / ratio;
    }
    t += exact / ratio;
  }
  return out;
}

export interface VocoderOptions {
  /** The transform's length, a power of two: the window the shifter looks through. */
  frame?: number;
  /** Overlap: frames to a window length. */
  overlap?: number;
}

/**
 * A phase vocoder: each frame's bins are read as the frequencies they hold
 * (from how their phase moved since the last frame), moved to the bin the
 * ratio puts them at, and resynthesised with phase that runs on at the new
 * frequency (the method of Bernsee's smbPitchShift). It moves the formants
 * with the pitch, since it moves the whole spectrum.
 */
export function phaseVocoder(
  input: ArrayLike<number>,
  sampleRate: number,
  ratioAt: (sample: number) => number,
  { frame = 2048, overlap = 4 }: VocoderOptions = {},
): Float64Array {
  const n = input.length;
  const size = frame;
  const half = size / 2;
  const hop = size / overlap;
  const freqPerBin = sampleRate / size;
  const expected = (2 * Math.PI * hop) / size;
  const window = Float64Array.from(
    { length: size },
    (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size),
  );
  const lastPhase = new Float64Array(half + 1);
  const sumPhase = new Float64Array(half + 1);
  const magnitude = new Float64Array(half + 1);
  const frequency = new Float64Array(half + 1);
  const newMagnitude = new Float64Array(half + 1);
  const newFrequency = new Float64Array(half + 1);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  const out = new Float64Array(n);
  for (let start = -size + hop; start < n; start += hop) {
    const ratio = ratioAt(Math.min(n - 1, Math.max(0, start + half)));
    for (let i = 0; i < size; i++) {
      const at = start + i;
      re[i] = (at >= 0 && at < n ? input[at]! : 0) * window[i]!;
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k <= half; k++) {
      magnitude[k] = 2 * Math.hypot(re[k]!, im[k]!);
      const phase = Math.atan2(im[k]!, re[k]!);
      let delta = phase - lastPhase[k]! - k * expected;
      lastPhase[k] = phase;
      // Wrap the deviation into ±π.
      delta -= 2 * Math.PI * Math.round(delta / (2 * Math.PI));
      frequency[k] = k * freqPerBin + ((overlap * delta) / (2 * Math.PI)) * freqPerBin;
    }
    newMagnitude.fill(0);
    newFrequency.fill(0);
    for (let k = 0; k <= half; k++) {
      const moved = Math.round(k * ratio);
      if (moved <= half) {
        newMagnitude[moved]! += magnitude[k]!;
        newFrequency[moved] = frequency[k]! * ratio;
      }
    }
    for (let k = 0; k <= half; k++) {
      const deviation =
        ((newFrequency[k]! - k * freqPerBin) / freqPerBin) * ((2 * Math.PI) / overlap);
      sumPhase[k]! += deviation + k * expected;
      re[k] = newMagnitude[k]! * Math.cos(sumPhase[k]!);
      im[k] = newMagnitude[k]! * Math.sin(sumPhase[k]!);
    }
    for (let k = half + 1; k < size; k++) {
      re[k] = 0;
      im[k] = 0;
    }
    // The inverse, through the forward transform of the conjugate.
    for (let k = 0; k < size; k++) im[k] = -im[k]!;
    fft(re, im);
    for (let i = 0; i < size; i++) {
      const at = start + i;
      if (at >= 0 && at < n)
        out[at]! += (2 * window[i]! * re[i]!) / (half * overlap * 0.375 * overlap);
    }
  }
  return out;
}
