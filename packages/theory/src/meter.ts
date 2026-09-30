/**
 * Meter: how a bar's pulses group its eighths, as a helix.
 *
 * A meter is a `Helix` whose cycle is the bar's length in eighths, the one
 * unit that makes every meter here comparable (6 for 3/4, 8 for 4/4, 10 for
 * 5/4, 5 for 5/8, 6 for 6/8, and so on), and whose heights are where its pulses start,
 * the downbeat at 0. It is the same object as a scale over the chromatic
 * circle or a rhythm over a bar's steps, so every tool the helix has applies
 * unchanged: `gaps` gives each pulse's length in eighths, `mode` another
 * grouping of the same pulses, `mirror` the retrograde, and `compose` puts
 * the meter onto the bar's steps (`helix.test.ts`, "nests meter the same
 * way").
 *
 * Most named meters are maximally even, `even(pulses, eighths)`, and one
 * formula covers three named cases: a *simple* meter (3/4, 4/4) divides
 * evenly into 2 eighths a pulse, a *compound* one (6/8, 12/8) into 3, and an
 * *additive* one, whose pulses aren't equal (5/8 as 3+2, 7/8 as 3+2+2), is
 * what `even` gives when the pulses don't divide the eighths at all: the
 * same maximally even spread that gives the bossa clave its shape
 * (`rhythms.ts`). So 3/4 and 6/8 sound different at the same pulse tempo
 * though a bar of either holds six eighths, and a bar of 5/8 is felt
 * long-short without being told which pulse is which.
 *
 * Every pulse spans 2 or 3 eighths exactly when
 * `2 · pulses ≤ eighths ≤ 3 · pulses` (Lerdahl and Jackendoff's
 * well-formedness rule), but a grouping of 2s and 3s need not be a mode of
 * `even`: 10/8's 3+3+2+2 has the pulse lengths `even(4, 10)` gives, but not
 * their cyclic order (`even` alternates them, 3+2+3+2). Of the 149
 * groupings of up to 16 eighths into 2s and 3s, 79 are modes of `even`
 * (`meter.test.ts`, T6). A meter outside that reach is given by its
 * heights, as the son clave is among the rhythms, and 10/8 here is.
 */

import { even } from './even.ts';
import { type Helix, compose } from './helix.ts';

export type MeterName = '3/4' | '4/4' | '5/4' | '5/8' | '6/8' | '7/8' | '9/8' | '10/8' | '12/8';

/**
 * A meter: its pulses (the heights, the downbeat at 0) over its bar's
 * eighths (the cycle). `heights.length` is how many pulses a bar holds.
 */
export type Meter = Helix;

export const METERS: Record<MeterName, Meter> = {
  '3/4': even(3, 6),
  '4/4': even(4, 8),
  '5/4': even(5, 10),
  '5/8': even(2, 5), // 3+2
  '6/8': even(2, 6),
  '7/8': even(3, 7), // 3+2+2
  '9/8': even(3, 9),
  '10/8': { cycle: 10, heights: [0, 3, 6, 8] }, // 3+3+2+2, which no mode of `even` gives
  '12/8': even(4, 12),
};

/** An eighth's weight: the bar's first pulse, another pulse, or between them. */
export type Weight = 'downbeat' | 'pulse' | 'subdivision';

/** Every eighth of a meter's bar, in order, and its weight. */
export function meterWeights(meter: Meter): Weight[] {
  const pulses = new Set(meter.heights);
  return Array.from({ length: meter.cycle }, (_, position) =>
    position === 0 ? 'downbeat' : pulses.has(position) ? 'pulse' : 'subdivision',
  );
}

/** The grid's step is a sixteenth: two to an eighth, in every meter (T6). */
export const STEPS_PER_EIGHTH = 2;

/** How many steps a meter's bar has: 16 in 4/4, 12 in 6/8, 14 in 7/8. */
export function stepsOf(meter: Meter, stepsPerEighth = STEPS_PER_EIGHTH): number {
  return meter.cycle * stepsPerEighth;
}

/**
 * A meter on a bar's steps, `stepsPerEighth` to an eighth: its pulses as
 * steps. The song's 4/4 on its 16 steps is `even(4, 16)`, the beats the
 * transport plays (T6), and its bar, step in the bar and beat are this
 * helix's turn, position and degree (T10).
 */
export function meterOnSteps(meter: Meter, stepsPerEighth = STEPS_PER_EIGHTH): Helix {
  return compose(meter, even(meter.cycle, stepsPerEighth * meter.cycle));
}
