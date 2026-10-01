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
 * moves by its lean, in sixths of the span (`leanMap`): late up to the
 * triplet at 1 and the dotted figure at 1.5, early to the mirror of each at
 * negative leans, straight at 0. The 8th level moves the offbeat 8th within
 * the beat, the 16th level, the secondary swing, the offbeat 16th within each
 * half-beat. The swing axis, a style's, runs from straight (0) through a full
 * 16th shuffle (0.5) to full triplet 8th swing (1), crossfading from the 16th
 * level to the 8th on the way: a path through the two levels, which never
 * leans early.
 *
 * Swing never moves a pulse's start (T11): the 16th level stays a fixed
 * 2-step span everywhere, meter-free, and the 8th level is read off the
 * meter's own pulses. A 2-eighth pulse swings exactly as a 4/4 beat always
 * has, anchored at its own start rather than a fixed modulus, so a meter
 * whose pulses aren't all 4 steps still keeps every pulse where it is
 * written. A pulse of any other length — every named meter's 3-eighth
 * pulses — plays straight at the 8th level, the easiest option to reverse
 * until a real performance measures a ternary feel (T16).
 */

import {
  type Helix,
  type Meter,
  METERS,
  degreeBelow,
  heightOf,
  meterOnSteps,
} from '@jambot/theory';
import { SONG_CLOCK, type SongClock } from './events.ts';
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

/**
 * How far a level's offbeat leans from the middle of its span, in sixths of
 * the span: 0 is straight, 1 the triplet (the first half holds two thirds), 1.5
 * the dotted figure (three quarters) and -1 its mirror, the offbeat pulled
 * early to a third. A level's `share`, what the first half of its span holds,
 * is the same number as a percentage: 50 straight, 67 triplet, 75 dotted.
 */
export const LEAN_RANGE = 1.5;

/** The share of its span a level's first half holds at a lean: 1/2 straight, 2/3 at 1. */
export const shareOfLean = (lean: number): number => 0.5 + lean / 6;

/** The lean at which a level's first half holds `share` of its span: the inverse of `shareOfLean`. */
export const leanOfShare = (share: number): number => (share - 0.5) * 6;

/**
 * The shares a value on the swing axis gives each level: what the first half of
 * a beat holds (the 8th level) and of each half-beat (the 16th, the secondary
 * swing), 1/2 straight and 2/3 at the triplet.
 */
export function swingShares(swing: number): { eighth: number; sixteenth: number } {
  const { eighth, sixteenth } = swingParts(swing);
  return { eighth: shareOfLean(eighth), sixteenth: shareOfLean(sixteenth) };
}

const clampLean = (lean: number) => Math.max(-LEAN_RANGE, Math.min(LEAN_RANGE, lean));

/**
 * The swing map of one lean per level, over a meter's pulses (4/4 unless
 * another is given): the 16th level, then the 8th (T11). A lean is signed, so
 * an offbeat can be pulled early as well as pushed late, and the two levels
 * are free of each other: the swing axis (`swingMap`) is one path through
 * them, and the metronome's two sliders are the plane.
 */
export function leanMap(
  { sixteenth, eighth }: { sixteenth: number; eighth: number },
  meter: Meter = METERS['4/4'],
): TimeMap {
  return composeTimeMaps(
    swingLevel(2, clampLean(sixteenth)),
    pulseLevel(meterOnSteps(meter), clampLean(eighth)),
  );
}

/**
 * The whole swing map for a value on the swing axis, over a meter's pulses
 * (4/4 unless another is given): the 16th level, then the 8th (T11).
 */
export function swingMap(swing: number, meter: Meter = METERS['4/4']): TimeMap {
  return leanMap(swingParts(swing), meter);
}

/**
 * The swing map of one pulse, which starts at `start` and is `length` steps
 * long, wherever on the song's steps it stands: the 16th level, then the 8th
 * over that one pulse (T11). In 4/4 a beat's is `swingMap`'s there.
 */
export function swingMapAt(swing: number, start: number, length: number): TimeMap {
  const { sixteenth, eighth } = swingParts(swing);
  return composeTimeMaps(swingLevel(2, sixteenth), pulseAt(start, length, eighth));
}

/**
 * The swing a style track plays: each beat swings by the swing where it
 * starts. Every beat's map keeps the beat's ends, so beats that swing
 * differently still join in order, and the whole stays invertible. A beat
 * is the finest rate at which that holds. The beats are the song's clock's
 * (`clock`, 4/4's where none is given), so a bar of another meter swings by
 * its own pulses, wherever the bar starts (#261).
 */
export function swingOf(track: StyleTrack, clock: SongClock = SONG_CLOCK): TimeMap {
  const at = (x: number) => {
    const beat = clock.beatAt(x);
    const start = clock.beatStart(beat);
    return swingMapAt(
      valueAt('swing', track.swing, start),
      start,
      clock.beatStart(beat + 1) - start,
    );
  };
  return { played: (x) => at(x).played(x), written: (y) => at(y).written(y) };
}

/** Maps `within` a span through the knots (0, from, span) → (0, to, span), or back. */
function throughSpan(within: number, from: number, to: number, span: number): number {
  return within < from
    ? (within * to) / from
    : to + ((within - from) * (span - to)) / (span - from);
}

/**
 * One level: in every span of `span` steps, the midpoint moves by
 * `amount` / 6 of the span (late, or early where negative), and the positions
 * between follow linearly.
 */
function swingLevel(span: number, amount: number): TimeMap {
  const half = span / 2;
  const mid = half + (amount * span) / 6;
  const through = (x: number, from: number, to: number) => {
    const start = Math.floor(x / span) * span;
    return start + throughSpan(x - start, from, to, span);
  };
  return { played: (x) => through(x, half, mid), written: (y) => through(y, mid, half) };
}

/**
 * The 8th level over a meter: a 2-eighth pulse of `clock` swings as
 * `swingLevel(4, amount)` does, anchored at its own start; a pulse of any
 * other length plays straight (T11, T16). `clock` is the meter composed onto
 * the bar's steps (`meterOnSteps`), whose heights are the pulse starts.
 */
function pulseLevel(clock: Helix, amount: number): TimeMap {
  const half = 2;
  const mid = half + (amount * 4) / 6;
  const through = (x: number, from: number, to: number) => {
    const degree = degreeBelow(clock, x);
    const start = heightOf(clock, degree);
    const length = heightOf(clock, degree + 1) - start;
    return length === 4 ? start + throughSpan(x - start, from, to, length) : x;
  };
  return { played: (x) => through(x, half, mid), written: (y) => through(y, mid, half) };
}

/** The 8th level over one pulse, from `start`, `length` steps long: as `pulseLevel` over the pulse that holds the position. */
function pulseAt(start: number, length: number, amount: number): TimeMap {
  const half = 2;
  const mid = half + (amount * 4) / 6;
  const through = (x: number, from: number, to: number) =>
    length === 4 ? start + throughSpan(x - start, from, to, length) : x;
  return { played: (x) => through(x, half, mid), written: (y) => through(y, mid, half) };
}
