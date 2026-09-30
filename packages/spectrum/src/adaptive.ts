/**
 * Pitch with a frame that fits the sound. A frame holds so many periods of
 * a note, and few of them leave a low note's pitch at the mercy of noise (see
 * `pitch.ts`), while a long frame is slow to follow a note that changes and
 * dear to compute. So the frame is chosen from what is heard: the short
 * frame's own spectrum says how low the lowest strong peak lies, and the
 * frame is the smallest that holds a number of periods of it. The pitch found
 * then corrects the choice once, since the lowest peak of a short frame is
 * smeared, and a missing fundamental is found from the partials that are
 * there.
 *
 * Measured (sine plus noise 17 dB down, 10 seeds a note, 48 kHz, the rms of
 * the error in cents): the error falls with the frame's length at every pitch,
 * so a low note, which holds few periods, is the one to give a long frame. A
 * fixed 4096 gives 3.7 (E1 to B1), 4.2 (C2 to B2), 3.0 and 1.8 and 0.8 cents
 * going up by octaves; 16 periods of the lowest peak, between 4096 and 16384,
 * gives 2.6, 2.4 and then the same as 4096 from G3 up, where it keeps the
 * short frame and answers as fast. A long frame follows a change slowly: the
 * lowest notes hear 340 ms of the past.
 */

import { spectrumOf } from './fft.ts';
import { findPeaks } from './peaks.ts';
import { estimatePitch, type PitchEstimate, type PitchOptions } from './pitch.ts';
import { rms } from './level.ts';

export interface AdaptiveOptions extends PitchOptions {
  /** The shortest frame, a power of two: the frame for anything high. */
  minFrame?: number;
  /** The longest, a power of two: how long a note is listened to for, at most. */
  maxFrame?: number;
  /** Periods of the lowest peak a frame should hold. */
  periods?: number;
  /** An rms below this is silence, and not looked at. */
  silence?: number;
}

const DEFAULTS = { minFrame: 4096, maxFrame: 16384, periods: 16, silence: 1e-4 };

/** The smallest power of two holding `periods` periods of `hz`, between the two limits. */
export function frameFor(
  hz: number,
  sampleRate: number,
  periods: number,
  minFrame: number,
  maxFrame: number,
): number {
  let frame = minFrame;
  while (frame < maxFrame && frame < (periods * sampleRate) / hz) frame *= 2;
  return frame;
}

/** The largest power of two that is at most `n`, 0 for nothing. */
function powerOfTwoBelow(n: number): number {
  if (n < 1) return 0;
  let power = 1;
  while (power * 2 <= n) power *= 2;
  return power;
}

/** What the adaptive estimator found, and the frame it found it in. */
export interface Adaptive {
  pitch: PitchEstimate | undefined;
  /** The length of the frame the pitch was read from, in samples. */
  frame: number;
}

/**
 * The pitch of the newest sound in `recent` (newest last), from a frame of
 * the length it needs. `recent` holds at least the shortest frame, and the
 * longest that may be used is the most of it that is a power of two.
 */
export function estimateAdaptive(
  recent: ArrayLike<number>,
  sampleRate: number,
  options: AdaptiveOptions = {},
): Adaptive {
  const { minFrame, maxFrame, periods, silence } = { ...DEFAULTS, ...options };
  const limit = Math.min(maxFrame, powerOfTwoBelow(recent.length));
  const newest = (n: number) => Array.prototype.slice.call(recent, recent.length - n) as number[];
  const start = Math.min(minFrame, limit);
  if (start < 2) return { pitch: undefined, frame: 0 };
  const first = newest(start);
  if (rms(first) < silence) return { pitch: undefined, frame: start };

  // What the short frame shows: the lowest of its strong peaks, on a finer grid than its bins.
  const observed = spectrumOf(first, sampleRate, start * 4);
  const peaks = findPeaks(observed, { minMagnitude: 0.1 * Math.max(...observed.magnitudes) });
  const lowest = Math.min(...peaks.map((p) => p.hz).filter((hz) => hz >= (options.minHz ?? 30)));

  let frame = Number.isFinite(lowest) ? frameFor(lowest, sampleRate, periods, start, limit) : start;
  let pitch = estimatePitch(newest(frame), sampleRate, options);
  // The pitch found says how many periods the frame holds; a low one may want more.
  if (pitch) {
    const wanted = frameFor(pitch.hz, sampleRate, periods, start, limit);
    if (wanted > frame) {
      frame = wanted;
      pitch = estimatePitch(newest(frame), sampleRate, options) ?? pitch;
    }
  }
  return { pitch, frame };
}
