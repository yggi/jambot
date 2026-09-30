/**
 * One look at the sound: how loud it is, its pitch from the frame it needs,
 * and its spectrum on a log axis to draw. The tuner runs it on the newest
 * samples every few tens of milliseconds; it holds no state, so a skipped look
 * costs nothing.
 */

import { type Adaptive, estimateAdaptive, type AdaptiveOptions } from './adaptive.ts';
import { type BandOptions, logBands } from './bands.ts';
import { spectrumOf } from './fft.ts';
import { type Level, levelOf } from './level.ts';

/** Every note of a piano (A0 to C8) in quarter tones, floored at −90 dB. */
export const PIANO_BANDS: BandOptions = { lowHz: 27.5, highHz: 4186.01, perOctave: 24 };

export interface AnalyseOptions extends AdaptiveOptions {
  /** The bands of the spectrum drawn: the piano's by default. */
  bands?: BandOptions;
  /** How many of the newest samples the spectrum is of, a power of two: 8192 by default. */
  displayFrame?: number;
}

/** What one look found. */
export interface Analysis extends Adaptive {
  /** The loudness of the newest samples, `displayFrame` of them. */
  level: Level;
  /** The spectrum of the same, in dB by band. */
  bands: Float64Array;
}

export function analyse(
  recent: ArrayLike<number>,
  sampleRate: number,
  { bands = PIANO_BANDS, displayFrame = 8192, ...options }: AnalyseOptions = {},
): Analysis {
  let frame = displayFrame;
  while (frame > recent.length && frame > 2) frame /= 2;
  const newest = Array.prototype.slice.call(recent, recent.length - frame) as number[];
  return {
    ...estimateAdaptive(recent, sampleRate, options),
    level: levelOf(newest),
    bands: logBands(spectrumOf(newest, sampleRate, frame * 2), bands),
  };
}
