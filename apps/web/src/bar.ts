/**
 * A bar as the screen draws it, on any meter: a mark on each of its steps,
 * two to an eighth, at the place the step sounds under the swing
 * (`swingMap` over the meter's own pulses, T11). The eighths are counted by
 * pulse (`1 & 2 & 3 &`, or `1 & & 2 & &` in a compound bar), the downbeat
 * accented and the eighths between the pulses lesser; the steps between them
 * are faint. This is the metrum's bar and the meter screen's alike: the
 * song's 4/4 is one meter among them, and a pulse's mark is where `clicksOf`
 * sounds that pulse's click, an eighth's where it sounds that when asked to.
 */

import { type TimeMap, swingMap } from '@jambot/engine';
import { type Meter, STEPS_PER_EIGHTH, degreeBelow, meterWeights, stepsOf } from '@jambot/theory';
import type { Mark } from './components/Ruler.svelte';

/**
 * A mark on each step of the bar, at the place it sounds under a value on
 * the swing axis. `heard` is the eighth sounding now, from 0.
 */
export function barMarks(meter: Meter, swing: number, heard: number | null): Mark[] {
  return marksPlayed(meter, swingMap(swing, meter).played, heard);
}

/**
 * A mark on each step of the bar, at the place `played` puts it: the map from
 * a written step to the one sounded, whatever swing, lean or looseness it
 * holds.
 */
export function marksPlayed(meter: Meter, played: TimeMap['played'], heard: number | null): Mark[] {
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
