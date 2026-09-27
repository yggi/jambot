/**
 * Meter: how a bar's pulses group its subdivisions, as a helix.
 *
 * A meter is `pulses` felt in a bar of `subdivisions`, the bar's length in
 * eighths (6 for 3/4 and for 6/8, 12 for 12/8, 5 for 5/8). Where the
 * pulses fall is `even(pulses, subdivisions, 0)`: the same primitive that
 * places the backbeat over a bar's steps and the diatonic set over the
 * chromatic circle (`helix.test.ts`, "nests meter the same way").
 *
 * One formula covers every named meter, not three cases: a *simple* meter (3/4, 4/4)
 * divides evenly into 2 subdivisions a pulse, a *compound* one (6/8, 12/8)
 * into 3, and an *additive* one, whose pulses aren't equal (5/8 as 3+2,
 * 7/8 as 3+2+2), is what `even` gives when `pulses` doesn't divide
 * `subdivisions` at all — the same maximally even spread that gives the
 * bossa clave its shape (`rhythms.ts`). So 3/4 and 6/8 sound different at
 * the same pulse tempo even though a bar of either holds six subdivisions,
 * and a bar of 5/8 is felt long-short without being told which pulse is
 * which: `even` places it, and places the long pulse first. The other
 * groupings of the same meter, 7/8 as 2+2+3 or 2+3+2, are the modes of its
 * pulse helix, and `mirror` gives the retrograde. A grouping that is not
 * maximally even, 10/8 as 3+3+2+2, is a helix `even` doesn't give, as the
 * son clave is among the rhythms (`meter.test.ts`, T6).
 */

import { even } from './even.ts';
import { type Helix } from './helix.ts';

export type MeterName = '3/4' | '4/4' | '5/8' | '6/8' | '7/8' | '9/8' | '12/8';

export interface Meter {
  /** Pulses (beats) in a bar: what a steps-in-bar counter counts. */
  readonly pulses: number;
  /** The bar's length in eighths: 6 for 3/4 and for 6/8, 8 for 4/4, 5 for 5/8. */
  readonly subdivisions: number;
}

export const METERS: Record<MeterName, Meter> = {
  '3/4': { pulses: 3, subdivisions: 6 },
  '4/4': { pulses: 4, subdivisions: 8 },
  '5/8': { pulses: 2, subdivisions: 5 }, // 3+2
  '6/8': { pulses: 2, subdivisions: 6 },
  '7/8': { pulses: 3, subdivisions: 7 }, // 3+2+2
  '9/8': { pulses: 3, subdivisions: 9 },
  '12/8': { pulses: 4, subdivisions: 12 },
};

/** Where a meter's pulses fall among its bar's subdivisions. */
export function pulseHelix({ pulses, subdivisions }: Meter): Helix {
  return even(pulses, subdivisions, 0);
}

/** A subdivision's weight: the bar's first pulse, another pulse, or between them. */
export type Weight = 'downbeat' | 'pulse' | 'subdivision';

/** Every subdivision of a meter's bar, in order, and its weight. */
export function meterWeights(meter: Meter): Weight[] {
  const pulses = new Set(pulseHelix(meter).heights);
  return Array.from({ length: meter.subdivisions }, (_, position) =>
    position === 0 ? 'downbeat' : pulses.has(position) ? 'pulse' : 'subdivision',
  );
}

/**
 * How many subdivisions each of a meter's pulses spans, in order: `[2, 2,
 * 2, 2]` for 4/4, `[3, 3]` for 6/8, `[3, 2]` for 5/8's 3+2, `[3, 2, 2]` for
 * 7/8. A simple or compound meter's are all equal; an additive one's
 * aren't, and this is where that shows.
 */
export function pulseLengths(meter: Meter): number[] {
  const heights = pulseHelix(meter).heights;
  return heights.map((h, i) => (i + 1 < heights.length ? heights[i + 1]! : meter.subdivisions) - h);
}
