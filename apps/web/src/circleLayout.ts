/**
 * The geometry of a circle-of-fifths wheel: where its 12 positions sit, and
 * in what order a scale's pitch classes trace the figure connecting them.
 *
 * Pure and DOM-free, so it is tested without mounting a component. A
 * `CircleOfFifths` component turns its points into SVG.
 */

import { fifthsIndex, mod } from '@jambot/theory';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The wheel index's angle, in radians, index 0 at the top, rising clockwise. */
export function wheelAngle(index: number): number {
  return ((index * 30 - 90) * Math.PI) / 180;
}

/** Where a wheel index sits, `radius` out from the centre at (0, 0). */
export function wheelPoint(index: number, radius: number): Point {
  const angle = wheelAngle(index);
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

/**
 * A scale's pitch classes, ordered to trace the figure from the tonic: by
 * how many wheel steps each is from the tonic, nearest first. A diatonic
 * scale is seven wheel-adjacent positions, so this draws the arc they are,
 * whichever part of the wheel the tonic falls on.
 */
export function figureOrder(scale: readonly number[], tonic: number): readonly number[] {
  const tonicIndex = fifthsIndex(tonic);
  const distance = (pitchClass: number) => mod(fifthsIndex(pitchClass) - tonicIndex, 12);
  return [...scale].sort((a, b) => distance(a) - distance(b));
}
