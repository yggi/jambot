/**
 * Swing, as a time map.
 *
 * What is written and what is played are kept apart: the score holds
 * positions on the grid, and a time map turns a written position into the
 * position it is played at. A map comes with its inverse, which reads played
 * notes (a player's input) back onto the grid. Maps compose, so swing and
 * tempo (`tempo.ts`), and later looseness, are each one more map.
 *
 * Swing works the same way at two levels. At each, the midpoint of a span
 * moves late, by up to a sixth of the span, where it lands on the triplet:
 * the 8th level moves the offbeat 8th within the beat, the 16th level moves
 * the offbeat 16th within each half-beat. The swing axis runs from straight
 * (0) through a full 16th shuffle (0.5) to full triplet 8th swing (1),
 * crossfading from the 16th level to the 8th on the way.
 */

import { beatAt, beatStart } from './events.ts';
import { type StyleTrack, valueAt } from './style.ts';

/** Positions in steps, a beat being 4, or on a clock in seconds. */
export interface TimeMap {
  /** Where a written position is played. */
  played(written: number): number;
  /** Where a played position is written: the inverse. */
  written(played: number): number;
}

/** `first`, then `second`; undone in reverse. */
export function composeTimeMaps(first: TimeMap, second: TimeMap): TimeMap {
  return {
    played: (x) => second.played(first.played(x)),
    written: (y) => first.written(second.written(y)),
  };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** How much each level swings, 0 to 1, for a value on the swing axis. */
export function swingParts(swing: number): { sixteenth: number; eighth: number } {
  const eighth = clamp01((swing - 0.5) * 2);
  return { sixteenth: clamp01(swing * 2) * (1 - eighth), eighth };
}

/** The whole swing map for a value on the swing axis: the 16th level, then the 8th. */
export function swingMap(swing: number): TimeMap {
  const { sixteenth, eighth } = swingParts(swing);
  return composeTimeMaps(swingLevel(2, sixteenth), swingLevel(4, eighth));
}

/**
 * The swing a style track plays: each beat swings by the swing where it
 * starts. Every beat's map keeps the beat's ends, so beats that swing
 * differently still join in order, and the whole stays invertible. A beat
 * is the finest rate at which that holds.
 */
export function swingOf(track: StyleTrack): TimeMap {
  const at = (x: number) => swingMap(valueAt('swing', track.swing, beatStart(beatAt(x))));
  return { played: (x) => at(x).played(x), written: (y) => at(y).written(y) };
}

/**
 * One level: in every span of `span` steps, the midpoint moves late by
 * `amount` / 6 of the span, and the positions between follow linearly.
 */
function swingLevel(span: number, amount: number): TimeMap {
  const half = span / 2;
  const mid = half + (amount * span) / 6;
  /** Map x within its span through the knots (0, half, span) → (0, to, span), or back. */
  const through = (x: number, from: number, to: number) => {
    const start = Math.floor(x / span) * span;
    const within = x - start;
    return (
      start +
      (within < from ? (within * to) / from : to + ((within - from) * (span - to)) / (span - from))
    );
  };
  return { played: (x) => through(x, half, mid), written: (y) => through(y, mid, half) };
}
