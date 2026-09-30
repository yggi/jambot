/**
 * A bar as the screen draws it, on any meter: a mark on each of its steps,
 * two to an eighth, at the place the step sounds under the swing
 * (`swingMap` over the meter's own pulses, T11). The eighths are the ones
 * clicked, counted by pulse (`1 & 2 & 3 &`, or `1 & & 2 & &` in a compound
 * bar), the downbeat accented and the eighths between the pulses lesser; the
 * steps between them are faint. This is the metrum's bar and the meter
 * screen's alike: the song's 4/4 is one meter among them, and the marks here
 * are what `clicksOf` reads of a 4/4 bar. Until the engine reads a song's
 * meter (#261) `clicksOf` stays 4/4's, and this is written from theory alone.
 */

import { type TimeMap, swingMap } from '@jambot/engine';
import { type Meter, STEPS_PER_EIGHTH, degreeBelow, meterWeights, stepsOf } from '@jambot/theory';
import type { Mark } from './components/Ruler.svelte';

/**
 * A mark on each step of the bar, at the place it sounds. `heard` is the
 * eighth sounding now, from 0. `played` is the map from a written step to
 * the one sounded, the meter's own swing unless another is given.
 */
export function barMarks(
  meter: Meter,
  swing: number,
  heard: number | null,
  played: TimeMap['played'] = swingMap(swing, meter).played,
): Mark[] {
  const weights = meterWeights(meter);
  return Array.from({ length: stepsOf(meter) }, (_, step): Mark => {
    if (step % STEPS_PER_EIGHTH !== 0) return { at: played(step), faint: true };
    const eighth = step / STEPS_PER_EIGHTH;
    const weight = weights[eighth]!;
    return {
      at: played(step),
      text: weight === 'subdivision' ? '&' : String(degreeBelow(meter, eighth) + 1),
      accent: weight === 'downbeat',
      minor: weight === 'subdivision',
      lit: eighth === heard,
    };
  });
}

/**
 * The eighth of the bar the step heard is in, from 0, or null before
 * anything is heard: what the bar's marks light.
 */
export function eighthHeard(meter: Meter, heard: number | null): number | null {
  if (heard === null) return null;
  const inBar = ((heard % stepsOf(meter)) + stepsOf(meter)) % stepsOf(meter);
  return Math.floor(inBar / STEPS_PER_EIGHTH);
}
