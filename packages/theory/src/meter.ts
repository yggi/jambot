/**
 * Meter: how a bar's pulses group its subdivisions, as a helix.
 *
 * A meter's pulses are `even(pulses, pulses, 0)` (every pulse, in order)
 * composed with `even(pulses, pulses * subdivision)` (the pulses spread
 * evenly over the bar's subdivisions): the same composition that nests the
 * backbeat over a bar's steps (`helix.test.ts`, "the beats on the steps of
 * a bar"). A simple meter splits each pulse into 2 subdivisions, a compound
 * one into 3, so 3/4 and 6/8 sound different at the same pulse tempo even
 * though a bar of either holds six subdivisions.
 */

import { even } from './even.ts';
import { compose, type Helix } from './helix.ts';

export type MeterName = '3/4' | '4/4' | '6/8' | '12/8';

export interface Meter {
  /** Pulses (beats) in a bar: what a steps-in-bar counter counts. */
  readonly pulses: number;
  /** Subdivisions per pulse: 2 for a simple meter, 3 for a compound one. */
  readonly subdivision: number;
}

export const METERS: Record<MeterName, Meter> = {
  '3/4': { pulses: 3, subdivision: 2 },
  '4/4': { pulses: 4, subdivision: 2 },
  '6/8': { pulses: 2, subdivision: 3 },
  '12/8': { pulses: 4, subdivision: 3 },
};

/** Where a meter's pulses fall among its bar's subdivisions. */
export function pulseHelix({ pulses, subdivision }: Meter): Helix {
  return compose(even(pulses, pulses, 0), even(pulses, pulses * subdivision));
}

/** A subdivision's weight: the bar's first pulse, another pulse, or between them. */
export type Weight = 'downbeat' | 'pulse' | 'subdivision';

/** Every subdivision of a meter's bar, in order, and its weight. */
export function meterWeights(meter: Meter): Weight[] {
  const pulses = new Set(pulseHelix(meter).heights);
  return Array.from({ length: meter.pulses * meter.subdivision }, (_, position) =>
    position === 0 ? 'downbeat' : pulses.has(position) ? 'pulse' : 'subdivision',
  );
}
