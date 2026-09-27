/**
 * The metronome: an independent click track, not the song's own clock.
 *
 * The transport's bar is always 16 steps in 4/4 (`transport.ts`); a
 * metronome that shows 3/4, 6/8, 12/8 or an additive meter like 5/8 needs a
 * bar of its own (`@jambot/theory`'s `Meter`, a helix of pulses over the
 * bar's eighths, and `meterWeights`). Every
 * subdivision of that bar lasts the same fraction of a pulse's own length,
 * `env.pulsesPerMinute` read live, the way the transport reads the style
 * track: a bar's worth of pulses divided by its subdivisions gives each
 * subdivision's length, and a pulse is however many subdivisions its own
 * meter gives it. This is exact for a simple or compound meter, where
 * every pulse spans the same number of subdivisions, so a pulse there
 * really does last 60 / pulsesPerMinute seconds; for an additive meter
 * (5/8's 3+2), pulses aren't equal, so `pulsesPerMinute` is a mean rate
 * over the bar, not any one pulse's own tempo (the meter's `gaps` give
 * each pulse's share). It is read fresh each tick
 * rather than glided through time, since a click track needs no composed
 * line's swing or legato to survive a tempo change.
 *
 * Time is absolute here too: on each tick every subdivision that starts
 * before now plus the lookahead is scheduled, and one the clock has
 * already passed is dropped, never played late.
 */

import type { Machine } from './machine.ts';
import { type Meter, type Weight, degreeBelow, meterWeights } from '@jambot/theory';

export interface MetronomeEnv {
  /** The clock time position 0 starts at, in seconds. */
  readonly start: number;
  /** The meter's mean pulse rate, exact where its pulses are equal. */
  readonly pulsesPerMinute: number;
  readonly meter: Meter;
}

export interface MetronomeInput {
  /** The clock now. Nothing is scheduled before it. */
  readonly now: number;
  /** Every subdivision that starts before this is scheduled. */
  readonly until: number;
}

export interface Click {
  /** Its subdivision's position in the bar, from 0. */
  readonly position: number;
  /** Its pulse in the bar, from 0. */
  readonly pulse: number;
  readonly weight: Weight;
  /** When it sounds, on the clock. */
  readonly seconds: number;
}

export interface MetronomeOutput {
  readonly clicks: readonly Click[];
  /** How many subdivisions the clock had passed before they could be scheduled. */
  readonly missed: number;
}

export interface MetronomeCarried {
  /** The next subdivision to schedule, and when it starts. */
  readonly head: { readonly position: number; readonly seconds: number };
}

/** How long one subdivision lasts, in seconds: a bar's pulses over its subdivisions, at the mean pulse rate. */
export function subdivisionSeconds(pulsesPerMinute: number, meter: Meter): number {
  return (60 / pulsesPerMinute) * (meter.heights.length / meter.cycle);
}

export const metronome: Machine<
  MetronomeEnv,
  MetronomeCarried | null,
  MetronomeInput,
  MetronomeOutput
> = {
  initial: null,
  advance(env, carried, { now, until }) {
    const { cycle } = env.meter;
    const weights = meterWeights(env.meter);
    const length = subdivisionSeconds(env.pulsesPerMinute, env.meter);
    let head = carried?.head ?? { position: 0, seconds: env.start };
    const clicks: Click[] = [];
    let missed = 0;

    while (head.seconds < until) {
      if (head.seconds + length <= now) {
        missed++;
        head = { position: head.position + 1, seconds: head.seconds + length };
        continue;
      }
      const inBar = head.position % cycle;
      clicks.push({
        position: inBar,
        pulse: degreeBelow(env.meter, inBar),
        weight: weights[inBar]!,
        seconds: head.seconds,
      });
      head = { position: head.position + 1, seconds: head.seconds + length };
    }
    return { carried: { head }, output: { clicks, missed } };
  },
};
