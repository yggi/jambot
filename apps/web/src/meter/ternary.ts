/**
 * Ternary swing (#259, T16): the swing of a pulse of three eighths, which the
 * swing map plays straight (`swingMap`'s 8th level moves only a pulse of two
 * eighths). It is a time map over the bar's steps that leaves every pulse
 * start where it is and, in a pulse of three eighths (six steps), moves its
 * second eighth late by up to `TERNARY_REACH` steps and the third by half as
 * much, the pieces between following linearly, so the pulse leans long,
 * short, shorter. A pulse of any other length is untouched. It is one more
 * map on the swing's (`composeTimeMaps`), an experiment's: which eighth wants
 * to move, and by how much, is what listening decides (#144).
 */

import { type TimeMap, composeTimeMaps, swingMap } from '@jambot/engine';
import { type Meter, degreeBelow, heightOf, meterOnSteps } from '@jambot/theory';

/** How far the second eighth of a pulse of three moves late at full, in steps. */
export const TERNARY_REACH = 1;

/** The steps in a pulse of three eighths. */
const PULSE = 6;
const FIRST = 2;

/** Maps `within` a span through the knots (0, from, span) → (0, to, span). */
function through(within: number, from: number, to: number): number {
  return within < from
    ? (within * to) / from
    : to + ((within - from) * (PULSE - to)) / (PULSE - from);
}

/** The ternary swing map of a meter, for an amount from 0 (none) to 1. */
export function ternaryMap(meter: Meter, amount: number): TimeMap {
  const clock = meterOnSteps(meter);
  const moved = FIRST + amount * TERNARY_REACH;
  const across = (x: number, from: number, to: number) => {
    const start = heightOf(clock, degreeBelow(clock, x));
    const length = heightOf(clock, degreeBelow(clock, x) + 1) - start;
    return length === PULSE ? start + through(x - start, from, to) : x;
  };
  return { played: (x) => across(x, FIRST, moved), written: (y) => across(y, moved, FIRST) };
}

/** The whole map of the meter screen: the swing's, then the ternary swing's. */
export function meterMap(meter: Meter, swing: number, ternary: number): TimeMap {
  return composeTimeMaps(swingMap(swing, meter), ternaryMap(meter, ternary));
}
