/**
 * The metronome: a reading of the transport's scheduled steps, not a clock
 * of its own. The band's steps are the song's grid, and a click is a step
 * that starts an eighth of the song's meter (`SONG_METER`, two steps to an
 * eighth): the bar's downbeat, another pulse, or a subdivision between them
 * (`@jambot/theory`'s `meterWeights`). It sounds where the band would play
 * a note on that step, through the swing the step's beat was laid with, so
 * the swing is heard in the click too, and at the tempo the band plays,
 * glide and all, since each step is as long as the tempo where it starts.
 *
 * Nothing here schedules or waits: the transport decides which steps are
 * laid, and a step the clock has passed is not laid, so a click is never
 * played late. A different meter than 4/4 is the time tower's (#116, #122):
 * when the song's meter changes, this reads it from the song's clock.
 */

import { type Weight, degreeBelow, meterWeights } from '@jambot/theory';
import { BAR_STEPS, SONG_METER, stepInBar } from './events.ts';
import { swingMap } from './swing.ts';
import type { ScheduledStep } from './transport.ts';

/** The steps in one eighth of the song's meter. */
const STEPS_PER_EIGHTH = BAR_STEPS / SONG_METER.cycle;

const WEIGHTS = meterWeights(SONG_METER);

/** What a click reads of a scheduled step. */
export type ClickStep = Pick<ScheduledStep, 'step' | 'seconds' | 'length' | 'swing'>;

export interface Click {
  /** Its step, from the song's start. */
  readonly step: number;
  /** The eighth of the bar it falls on, from 0. */
  readonly eighth: number;
  /** Its pulse in the bar, from 0. */
  readonly pulse: number;
  readonly weight: Weight;
  /** When it sounds, on the clock the steps were laid on. */
  readonly seconds: number;
}

/**
 * When a step sounds: where it starts, moved by the swing its beat was laid
 * with (`writtenAt` reads this back). A step on the beat does not move.
 */
export function soundsAt({ step, seconds, length, swing }: ClickStep): number {
  return seconds + (swingMap(swing).played(step) - step) * length;
}

/** The clicks in the steps laid, in their order: one on each eighth of the bar. */
export function clicksOf(steps: readonly ClickStep[]): Click[] {
  const clicks: Click[] = [];
  for (const laid of steps) {
    const inBar = stepInBar(laid.step);
    if (inBar % STEPS_PER_EIGHTH !== 0) continue;
    const eighth = inBar / STEPS_PER_EIGHTH;
    clicks.push({
      step: laid.step,
      eighth,
      pulse: degreeBelow(SONG_METER, eighth),
      weight: WEIGHTS[eighth]!,
      seconds: soundsAt(laid),
    });
  }
  return clicks;
}
