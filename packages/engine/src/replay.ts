/**
 * A loop (#626, #628): a window of bars the band has played, played again
 * from a later bar, a number of laps or locked until released.
 *
 * It is one form at every level it is used (the law of recursion): a section
 * repeated once is a repeat sign, a section locked a window with no last lap,
 * and a DJ's looper over the last bars or a part of a bar the same window,
 * smaller (#629, #630). In cells' words a lap is a count, `&A!2`, and a lock
 * a cycle with no end (yggi/cells#662).
 *
 * What the song does while a loop plays (`song`) is one of two:
 *
 * - **held**, a repeat sign, inserted into the song (the owner's ruling on
 *   #626): the band plays the window again and then goes on as if after the
 *   window's last bar, with the bar it had decided next. Nothing the band
 *   carries moves while the window plays again: no plan, no history, nothing
 *   heard. A section is what a held loop plays, so the song stays on its
 *   grid of sections.
 * - **runs**, a DJ's looper (#629): the song runs on beneath the loop, the
 *   band deciding and hearing its bars as it does a bar the clock passed,
 *   and where the loop ends it plays the bar the song has reached. A window
 *   of 1, 2 or 4 bars would move the song off its grid of sections were it
 *   inserted; running beneath, it never does.
 *
 * It is a standing input, as the key wished for is: the band reads it at
 * every bar, so a forecast that reads it is what plays.
 */

import { SECTION_BARS } from './form.ts';

export interface Loop {
  /** The first bar played again, on the song's clock. */
  readonly from: number;
  /** How many bars it plays again. */
  readonly bars: number;
  /** The first bar that plays it again: the bar after the window, for a repeat sign. */
  readonly at: number;
  /** How many times it plays again; null while it is locked. */
  readonly laps: number | null;
  /** Whether the song is held while the loop plays, a repeat sign, or runs on beneath it, a looper. */
  readonly song: 'held' | 'runs';
}

/** The windows the looper plays, in bars (#629). */
export const BAR_LOOPS = [1, 2, 4] as const;

/** How many of the bars it played the band keeps, to play again: a section's. */
export const KEPT_BARS = SECTION_BARS;

/** The section starting at bar `from`, played again `laps` times (null: locked) right after itself, a repeat sign. */
export const repeatSection = (from: number, laps: number | null): Loop =>
  checked({ from, bars: SECTION_BARS, at: from + SECTION_BARS, laps, song: 'held' });

/**
 * The looper (#629): the `bars` bars before `next`, the first bar not yet
 * composed, played from it, locked until released, the song running on
 * beneath.
 */
export const barLoop = (next: number, bars: number): Loop =>
  checked({ from: next - bars, bars, at: next, laps: null, song: 'runs' });

/** The first bar after the loop's last lap; null while it is locked. */
export const loopEnd = (loop: Loop): number | null =>
  loop.laps === null ? null : loop.at + loop.bars * loop.laps;

/** The bar a bar on the song's clock plays again, or null where it plays its own. */
export function replayOf(loop: Loop | null | undefined, bar: number): number | null {
  if (!loop || bar < loop.at) return null;
  const end = loopEnd(loop);
  if (end !== null && bar >= end) return null;
  return loop.from + ((bar - loop.at) % loop.bars);
}

/**
 * The loop released: it ends with the first lap that starts at or after
 * `bar`, the first bar not yet composed, so the lap playing is played to
 * its end and nothing jumps. Null where no lap has started by then: a loop
 * released before it plays is no loop.
 */
export function loopReleased(loop: Loop, bar: number): Loop | null {
  if (bar <= loop.at) return null;
  const laps = Math.ceil((bar - loop.at) / loop.bars);
  return loop.laps !== null && loop.laps <= laps ? loop : { ...loop, laps };
}

function checked(loop: Loop): Loop {
  const { from, bars, at, laps } = loop;
  if (!Number.isInteger(from) || from < 0) throw new Error(`loop: from ${from} is not a bar`);
  if (!Number.isInteger(bars) || bars < 1 || bars > KEPT_BARS)
    throw new Error(`loop: ${bars} bars, where the band keeps 1 to ${KEPT_BARS}`);
  if (!Number.isInteger(at) || at < from + bars)
    throw new Error(`loop: plays again from bar ${at}, inside its window ${from} + ${bars}`);
  if (laps !== null && (!Number.isInteger(laps) || laps < 1)) throw new Error(`loop: ${laps} laps`);
  if (at - from > KEPT_BARS)
    throw new Error(`loop: bar ${from} is no longer kept at bar ${at}, ${KEPT_BARS} bars on`);
  if (loop.song === 'held' && (bars !== SECTION_BARS || from % SECTION_BARS !== 0))
    throw new Error(`loop: a held loop plays a section, not ${bars} bars from bar ${from}`);
  return loop;
}
