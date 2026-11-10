/**
 * The Transport's loop buttons: what a tap asks of the band, and what each
 * says. The section's (#628) and the looper's over the last bars (#629): one
 * plays at a time, and the other rests while it does.
 *
 * A tap cycles: a repeat sign on the section heard, a lock, released. A
 * repeat asked for before the bar after the section is composed repeats the
 * section heard; asked later, the band is already past it, so the next one.
 * A lock released plays the lap it is in to its end (`loopReleased`), so
 * nothing jumps; one released before it plays is none.
 */

import {
  type Loop,
  SECTION_BARS,
  barLoop,
  loopEnd,
  loopReleased,
  repeatSection,
} from '@jambot/engine';

/** What the button says: no loop, a loop that ends, or one locked. */
export type LoopState = 'off' | 'repeat' | 'locked';

/** A loop's state, `next` the first bar not yet composed: one whose last lap is composed is off. */
export function loopState(loop: Loop | null, next: number): LoopState {
  if (!loop || loop.song === 'runs') return 'off';
  const end = loopEnd(loop);
  if (end === null) return 'locked';
  return next > end ? 'off' : 'repeat';
}

/**
 * The loop after a tap, the section heard at bar `heard` and the first bar
 * not yet composed `next`: off to a repeat, a repeat to a lock, a lock to
 * released.
 */
export function tapped(loop: Loop | null, heard: number, next: number): Loop | null {
  if (barsLooped(loop, next) !== null) return loop;
  switch (loopState(loop, next)) {
    case 'off': {
      const section = Math.floor(heard / SECTION_BARS) * SECTION_BARS;
      const here = repeatSection(section, 1);
      return here.at >= next ? here : repeatSection(here.at, 1);
    }
    case 'repeat':
      return { ...loop!, laps: null };
    case 'locked':
      return loopReleased(loop!, next);
  }
}

/** Whether the band is past a loop: its last bar played again and the bar it put off are composed, so it can go. */
export const loopPast = (loop: Loop, next: number): boolean => {
  const end = loopEnd(loop);
  return end !== null && next > end;
};

/** How many bars the looper plays (#629), `next` the first bar not yet composed; null where it plays none. */
export function barsLooped(loop: Loop | null, next: number): number | null {
  if (!loop || loop.song !== 'runs' || loopPast(loop, next)) return null;
  return loop.bars;
}

/**
 * The loop after a tap on the looper's `bars` (#629): the last bars from the
 * next, locked; on the window playing, let go at the end of its lap; on
 * another, that many bars ending where the window ends, from the next bar,
 * as a DJ halves or doubles a loop. Nothing while a section plays again.
 */
export function tappedBars(loop: Loop | null, bars: number, next: number): Loop | null {
  if (loopState(loop, next) !== 'off') return loop;
  const playing = barsLooped(loop, next);
  if (playing === null) return barLoop(next, bars);
  if (playing === bars) return loopReleased(loop!, next);
  const end = loop!.from + loop!.bars;
  return { ...loop!, from: end - bars, bars, at: next, laps: null };
}
