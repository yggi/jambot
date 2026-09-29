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

/** How many steps apart two pitch classes sit on the wheel, the short way round: 0 to 6. */
export function wheelDistance(a: number, b: number): number {
  const apart = mod(fifthsIndex(a) - fifthsIndex(b), 12);
  return Math.min(apart, 12 - apart);
}

/**
 * A scale's pitch classes in wheel order, opening the circle at its widest
 * gap. A diatonic scale is seven contiguous positions, so this is the arc
 * they are, each next to the last; a scale with a hole in it (harmonic
 * minor) has consecutive members more than one step apart, and those are
 * the edges worth drawing as chords.
 */
export function figureArc(scale: readonly number[]): readonly number[] {
  const ring = [...scale].sort((a, b) => fifthsIndex(a) - fifthsIndex(b));
  if (ring.length < 2) return ring;
  const gap = (i: number) =>
    mod(fifthsIndex(ring[(i + 1) % ring.length]!) - fifthsIndex(ring[i]!), 12);
  let widest = 0;
  for (let i = 1; i < ring.length; i++) if (gap(i) > gap(widest)) widest = i;
  return [...ring.slice(widest + 1), ...ring.slice(0, widest + 1)];
}

/** All 12 pitch classes, in wheel order, for a shape that spans the whole wheel. */
export function wheelOrder(): readonly number[] {
  return [...Array(12).keys()].sort((a, b) => fifthsIndex(a) - fifthsIndex(b));
}
