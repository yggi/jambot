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
 * half-beat.
 *
 * The band's swing is its meter's (#360, the owner's ruling on #309): a
 * level, `8n` or `16n`, and the share of each span at that level its first
 * half holds (`MeterSwing`), 1/2 straight and 2/3 the triplet. The share
 * glides as a style's axis does (`SwingTrack`); the level is a frame of the
 * section, as the meter is, and changes only where a section starts. A meter
 * swung on `8n` brings in the jazz kit and the walking bass (`eighthSwing`),
 * until drum and bass fragments come from the repository (yggi/cells#82).
 *
 * The readers search one path through the two levels (`swingMap`): from
 * straight (0) through a full 16th shuffle (0.5) to full triplet 8th swing
 * (1), crossfading from the 16th level to the 8th on the way, never leaning
 * early. It was the style's swing axis before the meter took it.
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
import { type AxisRange, type Glide, glideIn, valueIn } from './style.ts';

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

/** How much each level swings, 0 to 1, for a value on the readers' path (`swingMap`). */
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

const clampLean = (lean: number) => Math.max(-LEAN_RANGE, Math.min(LEAN_RANGE, lean));

/**
 * The swing map of one lean per level, over a meter's pulses (4/4 unless
 * another is given): the 16th level, then the 8th (T11). A lean is signed, so
 * an offbeat can be pulled early as well as pushed late, and the two levels
 * are free of each other: a meter's swing (`leansOf`) leans one of them,
 * the readers' path (`swingMap`) crosses from one to the other, and the
 * metronome's two sliders are the plane.
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
 * The whole swing map for a value on the readers' path, over a meter's
 * pulses (4/4 unless another is given): the 16th level, then the 8th (T11).
 */
export function swingMap(swing: number, meter: Meter = METERS['4/4']): TimeMap {
  return leanMap(swingParts(swing), meter);
}

/**
 * The swing map of one pulse, which starts at `start` and is `length` steps
 * long, wherever on the song's steps it stands: the 16th level, then the 8th
 * over that one pulse (T11). In 4/4 a beat's is `leanMap`'s there.
 */
export function swingMapAt(swing: MeterSwing, start: number, length: number): TimeMap {
  const { sixteenth, eighth } = leansOf(swing);
  return composeTimeMaps(swingLevel(2, sixteenth), pulseAt(start, length, eighth));
}

/**
 * The swing the band plays, beat by beat: each beat swings by `swingAt` its
 * start, the meter's swing there. Every beat's map keeps the beat's ends, so
 * beats that swing differently still join in order, and the whole stays
 * invertible. A beat is the finest rate at which that holds. The beats are
 * the song's clock's (`clock`, 4/4's where none is given), so a bar of
 * another meter swings by its own pulses, wherever the bar starts (#261).
 */
export function swingOf(
  swingAt: (beatStart: number) => MeterSwing,
  clock: SongClock = SONG_CLOCK,
): TimeMap {
  const at = (x: number) => {
    const beat = clock.beatAt(x);
    const start = clock.beatStart(beat);
    return swingMapAt(swingAt(start), start, clock.beatStart(beat + 1) - start);
  };
  return { played: (x) => at(x).played(x), written: (y) => at(y).written(y) };
}

/** The level a meter swings on: the offbeat 8th of each beat, or the offbeat 16th of each half-beat. */
export type SwingLevel = '8n' | '16n';
export const SWING_LEVELS: readonly SwingLevel[] = ['8n', '16n'];

/**
 * A meter's swing (#360, yggi/cells#18): the level it leans and the share of
 * each span at that level the first half holds, 1/2 straight, 2/3 the
 * triplet, up to 3/4 the dotted figure. It never leans early. A preset's is
 * the swing of the meter the repository finds at its point (`presetSwing`).
 */
export interface MeterSwing {
  readonly level: SwingLevel;
  readonly share: number;
}

/** A straight meter: no lean, on the 16ths. */
export const STRAIGHT: MeterSwing = { level: '16n', share: 0.5 };

/** The shares a meter's swing glides through: straight to the dotted figure. */
export const SHARE: AxisRange = { min: 0.5, max: shareOfLean(LEAN_RANGE), space: 'linear' };

/** A meter's swing as a lean per level: its own level leans, the other plays straight. */
export function leansOf({ level, share }: MeterSwing): { sixteenth: number; eighth: number } {
  const lean = leanOfShare(share);
  return level === '8n' ? { sixteenth: 0, eighth: lean } : { sixteenth: lean, eighth: 0 };
}

/**
 * How far a meter swings its 8ths, 0 straight to 1 the triplet: what brings
 * in the jazz kit and the walking bass, and rounds the bass's tone (the
 * owner's ruling on #360). A meter swung on `16n` gives none.
 */
export const eighthSwing = (swing: MeterSwing): number => clamp01(leansOf(swing).eighth);

/**
 * How swung a meter is, 0 to 1: its lean, a 16th lean counting half of an
 * 8th's. What the lead's pickups and the performer's feel read; on the
 * presets it is the value the swing axis had (`swingParts`' inverse).
 */
export const swingWeight = (swing: MeterSwing): number =>
  clamp01(leanOfShare(swing.share) * (swing.level === '8n' ? 1 : 0.5));

/**
 * The meter's swing as the conductor sets it: the level asked for, which the
 * band takes where the next section starts, as it takes a meter (#261), and
 * the share, gliding as a style's axis does (`glideTo`). Plain data, so it
 * can be carried.
 */
export interface SwingTrack {
  readonly level: SwingLevel;
  readonly share: Glide;
}

/** A track that holds a swing still. */
export function holdingSwing({ level, share }: MeterSwing): SwingTrack {
  return { level, share: { from: share, to: share, start: 0, length: 0, slope: 0, brake: 0 } };
}

/**
 * The track with the level asked for and the share gliding to its target
 * from `start` over `length` steps, leaving from where it is and as fast,
 * so nothing jumps (`glideIn`). A length of 0 sets it at once.
 */
export function swingTo(
  track: SwingTrack,
  { level = track.level, share }: Partial<MeterSwing>,
  start: number,
  length: number,
): SwingTrack {
  return {
    level,
    share: share === undefined ? track.share : glideIn(SHARE, track.share, share, start, length),
  };
}

/** The share a track has at a position, on the level it asks for. */
export const swingAt = (track: SwingTrack, position: number): MeterSwing => ({
  level: track.level,
  share: valueIn(SHARE, track.share, position),
});

/** Where a track is going: the level asked for and the share's target. */
export const swingTarget = (track: SwingTrack): MeterSwing => ({
  level: track.level,
  share: track.share.to,
});

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
