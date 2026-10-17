/**
 * Tempo, as a time map from positions to clock time.
 *
 * A tempo in bpm counts the beats of a meter (cells' decision 040, #367):
 * 4/4's quarters, 6/8's dotted quarters, 7/8's three unequal beats. A bar
 * at `bpm` lasts `beats * 60 / bpm` seconds, and its steps, two to an
 * eighth, are equal, so its beats keep their proportions (yggi/cells#88).
 * Each step lasts its share of that at the tempo where it starts, so a
 * step's length is known when it begins, and steps lie end to end. Through
 * a tempo glide the map is piecewise linear and rising, and its inverse
 * gives each position back from its time. Composed after swing, it takes a
 * written position to the second it sounds (see `swing.ts`).
 *
 * The meter a track's bpm counts is the meter heard: when the meter
 * changes, the number converts once (`rebeat`), so the felt tempo, how long
 * a step lasts, carries over and nothing jumps.
 *
 * The map reaches forward from an anchor, a step and the second it starts
 * at. Before the anchor, the music played to whatever the style track was
 * then, which the track no longer holds.
 */

import { type Meter, beatsOf, stepsOf } from '@jambot/theory';
import { SONG_METER } from './events.ts';
import { AXES, type StyleTrack, valueAt } from './style.ts';
import type { TimeMap } from './swing.ts';

/** A step, and the clock time in seconds it starts at. */
export interface Anchor {
  readonly step: number;
  readonly seconds: number;
}

/**
 * How long a step, a 16th note, lasts at a tempo counted in the meter's
 * beats: its bar's share, `beats * 60 / bpm` over its steps. In 4/4, 3/4
 * and 5/4, whose beats are quarters, that is 60 / bpm / 4.
 */
export function stepSeconds(bpm: number, meter: Meter = SONG_METER): number {
  return (60 * beatsOf(meter)) / (bpm * stepsOf(meter));
}

/**
 * Positions in steps from the anchor on, to seconds on the anchor's clock,
 * the track's bpm counting the beats of `meter`.
 */
export function tempoMap(track: StyleTrack, anchor: Anchor, meter: Meter = SONG_METER): TimeMap {
  const length = (step: number) => stepSeconds(valueAt('bpm', track.bpm, step), meter);
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

/**
 * The track with its bpm counting the beats of `to` where it counted those
 * of `from`, every step as long as it was: the felt tempo kept, the number
 * converted once, when the meter changes (#367). 108 in 4/4 is 72 in 6/8
 * and 92.571… in 7/8. The whole glide scales, which in log space is a shift,
 * so it keeps its shape. A number the conversion takes past the axis stops
 * at its end, and only there does a step's length move.
 */
export function rebeat(track: StyleTrack, from: Meter, to: Meter): StyleTrack {
  const ratio = stepSeconds(1, to) / stepSeconds(1, from);
  if (ratio === 1) return track;
  const { min, max } = AXES.bpm;
  const within = (bpm: number) => Math.max(min, Math.min(max, bpm * ratio));
  const glide = track.bpm;
  return { ...track, bpm: { ...glide, from: within(glide.from), to: within(glide.to) } };
}
