/**
 * The metronome: a reading of the transport's scheduled steps, not a clock
 * of its own. The band's steps are the song's grid, and a click is a step
 * that starts a pulse of the song's meter: the bar's downbeat or another
 * pulse. It reads the meter off the song's clock (`SongClock`, the
 * transport's own, 4/4's where none is given), so a bar of 6/8 clicks its two
 * dotted quarters and one of 7/8 its three pulses, 3+2+2. The eighths between
 * the pulses are not clicked unless asked for (`Subdivision`): a click on the
 * 'and' of a 4/4 bar says the bar is in eighths, which it is not, and a
 * player counting quarters hears it as a second pulse. It sounds where the
 * band would play a note on that step, through the swing the step's beat was
 * laid with, so the swing is heard in the click too once the eighths or the
 * sixteenths are clicked (a pulse does not move), and at the tempo the band
 * plays, glide and all, since each step is as long as the tempo where it
 * starts.
 *
 * Nothing here schedules or waits: the transport decides which steps are
 * laid, and a step the clock has passed is not laid, so a click is never
 * played late.
 */

import type { Weight } from '@jambot/theory';
import { SONG_CLOCK, type SongClock } from './events.ts';
import { swingMapAt } from './swing.ts';
import type { ScheduledStep } from './transport.ts';

/**
 * What a click sounds beside the pulses: nothing, the eighths between them
 * (every second step), or the sixteenths too (every step).
 */
export type Subdivision = 'pulses' | 'eighths' | 'sixteenths';

export const SUBDIVISIONS: readonly Subdivision[] = ['pulses', 'eighths', 'sixteenths'];

/** The steps in one eighth: the grid's step is a sixteenth, in every meter. */
const STEPS_PER_EIGHTH = 2;

/** What a click reads of a scheduled step. */
export type ClickStep = Pick<ScheduledStep, 'step' | 'seconds' | 'length' | 'swing' | 'pulse'>;

export interface Click {
  /** Its step, from the song's start. */
  readonly step: number;
  /** The eighth of the bar it falls in, from 0 (a sixteenth after an eighth is in it). */
  readonly eighth: number;
  /** Its pulse in the bar, from 0. */
  readonly pulse: number;
  /** How many pulses its bar has. */
  readonly pulses: number;
  readonly weight: Weight;
  /** When it sounds, on the clock the steps were laid on. */
  readonly seconds: number;
}

/**
 * When a step sounds: where it starts, moved by the swing its beat was laid
 * with, over that beat (`writtenAt` reads this back). A step on the beat does
 * not move.
 */
export function soundsAt({ step, seconds, length, swing, pulse }: ClickStep): number {
  return seconds + (swingMapAt(swing, pulse.start, pulse.length).played(step) - step) * length;
}

/**
 * The clicks in the steps laid, in their order: one on each pulse, and on
 * each eighth or sixteenth between them where `subdivision` asks.
 */
export function clicksOf(
  steps: readonly ClickStep[],
  clock: SongClock = SONG_CLOCK,
  subdivision: Subdivision = 'pulses',
): Click[] {
  const clicks: Click[] = [];
  for (const laid of steps) {
    const onPulse = clock.onBeat(laid.step);
    const bar = clock.barAt(laid.step);
    const inBar = laid.step - clock.barStart(bar);
    const wanted =
      onPulse ||
      subdivision === 'sixteenths' ||
      (subdivision === 'eighths' && inBar % STEPS_PER_EIGHTH === 0);
    if (!wanted) continue;
    clicks.push({
      step: laid.step,
      eighth: Math.floor(inBar / STEPS_PER_EIGHTH),
      pulse: clock.beatInBar(laid.step),
      pulses: clock.beatAt(clock.barStart(bar + 1)) - clock.beatAt(clock.barStart(bar)),
      weight: inBar === 0 ? 'downbeat' : onPulse ? 'pulse' : 'subdivision',
      seconds: soundsAt(laid),
    });
  }
  return clicks;
}
