/**
 * The Transport's loop menu: what each choice asks of the band, and what the
 * menu says. The section's repeat and lock (#628) and the looper over the
 * last bars (#629): one plays at a time, and the other rests while it does.
 *
 * The menu asks a section to play once more or to lock (`askedSection`). A
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

/** What the loop menu asks of a section: play it once more, or lock it. */
export type SectionAsk = 'repeat' | 'lock';

/** The section a loop asked for now repeats: the section heard, or the next where the band is already past its end. */
function sectionAsked(heard: number, next: number, laps: number | null): Loop {
  const here = repeatSection(Math.floor(heard / SECTION_BARS) * SECTION_BARS, laps);
  return here.at >= next ? here : repeatSection(here.at, laps);
}

/**
 * The loop after the menu asks `ask` of a section, the section heard at bar
 * `heard` and the first bar not yet composed `next`.
 *
 * - Repeat once: with none, the section heard plays once more; asked again
 *   before it starts, it is called off; a lock lets go at its lap's end.
 * - Lock: with none, the section heard plays until let go; a repeat becomes
 *   a lock; asked again, the lock lets go at its lap's end.
 *
 * Nothing while the looper plays.
 */
export function askedSection(
  loop: Loop | null,
  ask: SectionAsk,
  heard: number,
  next: number,
): Loop | null {
  if (barsLooped(loop, next) !== null) return loop;
  const state = loopState(loop, next);
  if (state === 'off') return sectionAsked(heard, next, ask === 'repeat' ? 1 : null);
  if (ask === 'lock' && state === 'repeat') return { ...loop!, laps: null };
  return loopReleased(loop!, next);
}

/** What the loop menu shows: the state, the looper's window, and the trigger's word. */
export interface LoopView {
  readonly state: LoopState;
  /** The looper's window in bars, or null where it plays none. */
  readonly bars: number | null;
  /** The trigger's word: `loop`, `repeat`, `locked`, or the looper's `2 bars`. */
  readonly word: string;
}

/** The menu's view of a loop, `next` the first bar not yet composed. */
export function loopView(loop: Loop | null, next: number): LoopView {
  const state = loopState(loop, next);
  const bars = barsLooped(loop, next);
  const word =
    bars !== null ? (bars === 1 ? '1 bar' : `${bars} bars`) : state === 'off' ? 'loop' : state;
  return { state, bars, word };
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
 * The loop after a tap on the looper's `bars` (#629): the last bars heard,
 * from the next, locked; on the window playing, let go at the end of its
 * lap; on another, the last that many bars heard, from the next, which
 * halves a loop or doubles it with its own laps, as a DJ does. Nothing while
 * a section plays again, or before that many bars have played.
 */
export function tappedBars(loop: Loop | null, bars: number, next: number): Loop | null {
  if (loopState(loop, next) !== 'off' || next < bars) return loop;
  const playing = barsLooped(loop, next);
  if (playing === bars) return loopReleased(loop!, next);
  return barLoop(next, bars);
}
