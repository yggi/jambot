/**
 * Ternary swing (#259, T16): the lean of a pulse of three eighths, which the
 * swing map plays straight (`swingMap`'s 8th level moves only a pulse of two
 * eighths). It is a time map over the bar's steps that leaves every pulse
 * start where it is and, in a pulse of three eighths (six steps), moves its
 * second eighth by up to `TERNARY_REACH` steps and the third by half as
 * much, the pieces between following linearly. Late (a positive amount) the
 * first eighth stretches and the other two share what is left: the pulse's
 * eighths last 3, 1.5 and 1.5 steps at full, long, short, short, a pulse
 * that reads as a quarter and two eighths, not as swung eighths. Early (a
 * negative amount) the first shrinks and the others stretch, 1, 2.5 and 2.5.
 * Straight is 0, as it is for the swing's lean. A pulse of any other length
 * is untouched. It is one more map on the swing's (`composeTimeMaps`), an
 * experiment's: which eighth wants to move, and by how much, is what
 * listening decides (#144).
 */

import { type TimeMap, composeTimeMaps, leanMap, leanOfShare } from '@jambot/engine';
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

/** The ternary swing map of a meter, for an amount from -1 (early) through 0 (none) to 1 (late). */
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

/**
 * The whole map of the meter screen: the swing's, then the ternary swing's.
 * The swing's two levels are the share of its span each one's first half
 * holds, 1/2 straight (`shareOfLean`).
 */
export function meterMap(
  meter: Meter,
  { eighth, sixteenth }: { eighth: number; sixteenth: number },
  ternary: number,
): TimeMap {
  return composeTimeMaps(
    leanMap({ eighth: leanOfShare(eighth), sixteenth: leanOfShare(sixteenth) }, meter),
    ternaryMap(meter, ternary),
  );
}
