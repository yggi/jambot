/**
 * The meters the band can be asked for, by name (#262): the nine named ones
 * (`METERS`) and the other groupings of the additive ones, 5/8 as 2+3 and 7/8
 * as 2+2+3 and 2+3+2, which are modes of the named meter (`mode`, a helix's
 * degree taken as its downbeat). A meter is a helix, so a choice is the helix
 * itself, and a bar says which it is in by `meterLabel`: "4/4", or "7/8 2+2+3"
 * where the grouping is not the named one's.
 */

import { sameMeter } from '@jambot/engine';
import { METERS, type Meter, type MeterName, gaps, mode, shift } from '@jambot/theory';

export interface MeterChoice {
  /** As the screen names it: "4/4", "7/8 2+2+3". */
  readonly text: string;
  readonly meter: Meter;
}

/** A meter's eighths as a signature, 7/8: the cycle is the bar's length in eighths. */
const signature = (meter: Meter) => `${meter.cycle}/8`;

/** The named meter a meter is, if it is one. */
const nameOf = (meter: Meter): MeterName | undefined =>
  (Object.keys(METERS) as MeterName[]).find((name) => sameMeter(METERS[name], meter));

/** A meter as the screen says it: its name, or its signature and grouping where it is another grouping. */
export function meterLabel(meter: Meter): string {
  return nameOf(meter) ?? `${signature(meter)} ${gaps(meter).join('+')}`;
}

/** The other groupings of a meter: each of its modes that groups the bar differently. */
function groupings(meter: Meter): Meter[] {
  const seen = new Set([gaps(meter).join('+')]);
  return meter.heights.flatMap((_, degree) => {
    // A mode starts on its degree's height; a meter starts on its downbeat, at 0.
    const rotated = mode(meter, degree);
    const other = shift(rotated, -rotated.heights[0]!);
    const key = gaps(other).join('+');
    if (seen.has(key)) return [];
    seen.add(key);
    return [other];
  });
}

/**
 * Every choice, the named meters in the order of `METERS`, each followed by
 * its other groupings where it has two or three unequal pulses.
 */
export const METER_CHOICES: readonly MeterChoice[] = (Object.keys(METERS) as MeterName[]).flatMap(
  (name) => {
    const meter = METERS[name];
    // Only a bar of two or three unequal pulses, 5/8 and 7/8, is offered regrouped.
    const regrouped = meter.heights.length <= 3 && new Set(gaps(meter)).size > 1;
    return [meter, ...(regrouped ? groupings(meter) : [])].map((m) => ({
      text: meterLabel(m),
      meter: m,
    }));
  },
);
