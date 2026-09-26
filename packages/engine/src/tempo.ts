/**
 * Tempo, as a time map from positions to clock time.
 *
 * Each step lasts a 16th note at the tempo where it starts, so a step's
 * length is known when it begins, and steps lie end to end. Through a tempo
 * glide the map is piecewise linear and rising, and its inverse gives each
 * position back from its time. Composed after swing, it takes a written
 * position to the second it sounds (see `swing.ts`).
 *
 * The map reaches forward from an anchor, a step and the second it starts
 * at. Before the anchor, the music played to whatever the style track was
 * then, which the track no longer holds.
 */

import { type StyleTrack, styleAt } from './style.ts';
import type { TimeMap } from './swing.ts';

/** A step, and the clock time in seconds it starts at. */
export interface Anchor {
  readonly step: number;
  readonly seconds: number;
}

/** How long a step, a 16th note, lasts at a tempo: 60 / bpm / 4. */
export function stepSeconds(bpm: number): number {
  return 15 / bpm;
}

/** Positions in steps from the anchor on, to seconds on the anchor's clock. */
export function tempoMap(track: StyleTrack, anchor: Anchor): TimeMap {
  const length = (step: number) => stepSeconds(styleAt(track, step).bpm);
  return {
    played(position) {
      if (position < anchor.step)
        throw new Error(`tempoMap: position ${position} is before the anchor at ${anchor.step}`);
      let step = anchor.step;
      let seconds = anchor.seconds;
      while (step + 1 <= position) seconds += length(step++);
      return seconds + (position - step) * length(step);
    },
    written(seconds) {
      if (seconds < anchor.seconds)
        throw new Error(`tempoMap: ${seconds} s is before the anchor at ${anchor.seconds} s`);
      let step = anchor.step;
      let start = anchor.seconds;
      while (start + length(step) <= seconds) start += length(step++);
      return step + (seconds - start) / length(step);
    },
  };
}
