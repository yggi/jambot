/**
 * Reading onsets: from where a hand struck notes to the steps it meant (#204).
 *
 * One reader for both directions of the same inference. The analyzer reads a
 * file's section offline (`quantiseSection`), the Muse a phrase as it is
 * played, and both start from onsets in steps and want the written steps
 * back. The reader finds what the hand did to them, then rounds what is
 * left: first the swing, the one systematic bend of the grid (`estimateSwing`,
 * a hidden variable found, not assumed), and the leftover of each note is
 * kept as its microtiming (A6).
 *
 * Pure: it counts steps and knows no clock, file or key.
 */

import { swingMap } from './swing.ts';

/** How finely `estimateSwing` searches its path through the two levels (`swingMap`). */
const SWING_RESOLUTION = 1000;

/** The sum of squared distances from the nearest step, once `swing` is un-swung. */
function quantisingError(swing: number, rawSteps: readonly number[]): number {
  const map = swingMap(swing);
  let sum = 0;
  for (const raw of rawSteps) {
    const residual = map.written(raw) - Math.round(map.written(raw));
    sum += residual * residual;
  }
  return sum;
}

/** The swing (0 to 1) whose un-swung grid leaves onsets, in steps, closest to the steps. */
export function estimateSwing(rawSteps: readonly number[]): number {
  if (rawSteps.length === 0) return 0;
  let best = 0;
  let bestError = Infinity;
  for (let i = 0; i <= SWING_RESOLUTION; i++) {
    const swing = i / SWING_RESOLUTION;
    const error = quantisingError(swing, rawSteps);
    if (error < bestError) {
      bestError = error;
      best = swing;
    }
  }
  return best;
}

/** Onsets read: the swing found, and each onset's written position, step and what was left. */
export interface Onsets {
  readonly swing: number;
  /** Each onset un-swung, before it is rounded. */
  readonly written: readonly number[];
  /** The step each onset was read as. */
  readonly steps: readonly number[];
  /** `written` less `steps`: the microtiming the grid doesn't state. */
  readonly residuals: readonly number[];
}

/**
 * Onsets, in steps as played, read as the steps they were written on: swing
 * found once (or given, by a caller that knows it: the Muse hears notes
 * already un-swung by the transport's own map), then every onset un-swung
 * and rounded.
 */
export function readOnsets(rawSteps: readonly number[], given?: number): Onsets {
  const swing = given ?? estimateSwing(rawSteps);
  const map = swingMap(swing);
  const written = rawSteps.map((raw) => map.written(raw));
  const steps = written.map(Math.round);
  return { swing, written, steps, residuals: written.map((w, i) => w - steps[i]!) };
}
