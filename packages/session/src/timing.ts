/**
 * Timing counters (#27): what a device's timing did while it played, in
 * numbers a person can attach instead of describing a symptom.
 *
 * A duration counted over a whole evening is kept as a spread: how many
 * there were, the least and the most exactly, and in between, how many fell
 * in each whole millisecond up to a second. So its quantiles are good to
 * half a millisecond below a second however long it runs, and cost the same
 * to keep after four hours as after four seconds.
 *
 * The transport's counters come from its ticks (`timedTick`): how far apart
 * the ticks came, on the page's clock, which a stalled main thread holds up
 * and a held output doesn't; how far ahead of the clock the transport reads
 * each event was scheduled, whose least is how near the device came
 * to playing a note late; the steps it laid and missed, and the events it
 * dropped late; and the bars judged elsewhere that its Muse dropped, by why.
 * Steps passed and events dropped before the first step laid are not
 * counted: they are where a client joined a song already playing.
 */

import type { DroppedJudgement, TransportOutput } from '@jambot/engine';

/** How many whole milliseconds a spread keeps apart: those of a second. */
export const SPREAD_MS = 1000;

/** Durations counted, in milliseconds. */
export interface Spread {
  readonly count: number;
  /** The least and the most counted, exactly; null while none is. */
  readonly least: number | null;
  readonly most: number | null;
  /**
   * How many fell in each whole millisecond from 0, the last holding every
   * one of `SPREAD_MS` or more. Below 0 counts in the first.
   */
  readonly bins: readonly number[];
}

export const EMPTY_SPREAD: Spread = {
  count: 0,
  least: null,
  most: null,
  bins: Array.from({ length: SPREAD_MS + 1 }, () => 0),
};

/** The spread with one more duration, in milliseconds. */
export function spreadWith(spread: Spread, ms: number): Spread {
  if (!Number.isFinite(ms)) return spread;
  const bin = Math.max(0, Math.min(SPREAD_MS, Math.floor(ms)));
  const bins = [...spread.bins];
  bins[bin]!++;
  return {
    count: spread.count + 1,
    least: spread.least === null ? ms : Math.min(spread.least, ms),
    most: spread.most === null ? ms : Math.max(spread.most, ms),
    bins,
  };
}

/**
 * The `q` quantile (0 to 1) of the spread, by nearest rank: the middle of
 * the millisecond it falls in, within the least and the most counted. So
 * it is within half a millisecond of the true one below a second, and the
 * most counted beyond. Null while none is counted.
 */
export function quantile(spread: Spread, q: number): number | null {
  if (spread.count === 0) return null;
  const rank = Math.max(1, Math.ceil(q * spread.count));
  let seen = 0;
  for (let bin = 0; bin < SPREAD_MS; bin++) {
    seen += spread.bins[bin]!;
    if (seen >= rank) return Math.max(spread.least!, Math.min(bin + 0.5, spread.most!));
  }
  return spread.most;
}

/** A spread as a person reads it, in milliseconds. */
export interface SpreadSummary {
  readonly count: number;
  readonly least: number | null;
  readonly p50: number | null;
  readonly p99: number | null;
  readonly most: number | null;
}

export const summaryOf = (spread: Spread): SpreadSummary => ({
  count: spread.count,
  least: spread.least,
  p50: quantile(spread, 0.5),
  p99: quantile(spread, 0.99),
  most: spread.most,
});

/** The transport's counters. */
export interface TransportTiming {
  /** The page's clock at the tick before, in seconds, or null before the first. */
  readonly last: number | null;
  /** How far apart the ticks came, on the page's clock. */
  readonly ticks: Spread;
  /** How far ahead of the clock each event was scheduled. */
  readonly margins: Spread;
  /** The steps laid, and those the clock passed after the first was laid. */
  readonly laid: number;
  readonly missed: number;
  /**
   * The events dropped late after the first step was laid (#462): each whose
   * onset the clock had passed as its step was laid, or whose step it passed
   * whole. Beside `missed`, which counts steps, this counts what didn't sound.
   */
  readonly lateEvents: number;
  /** The bars judged elsewhere that the Muse dropped, by why. */
  readonly dropped: Readonly<Record<DroppedJudgement['why'], number>>;
}

export const TRANSPORT_TIMING: TransportTiming = {
  last: null,
  ticks: EMPTY_SPREAD,
  margins: EMPTY_SPREAD,
  laid: 0,
  missed: 0,
  lateEvents: 0,
  dropped: { late: 0, ahead: 0, inadmissible: 0 },
};

/** One tick of the transport: when it ticked, the time it scheduled from, and what it scheduled. */
export interface TimedTick {
  /** The page's clock as it ticked, in seconds. */
  readonly at: number;
  /** The time the transport scheduled from, on its clock: a client's is the host's. */
  readonly now: number;
  readonly scheduled: TransportOutput;
}

/** The counters after one more tick. */
export function timedTick(
  timing: TransportTiming,
  { at, now, scheduled }: TimedTick,
): TransportTiming {
  const ticks =
    timing.last === null ? timing.ticks : spreadWith(timing.ticks, (at - timing.last) * 1000);
  let margins = timing.margins;
  for (const { seconds } of scheduled.events) margins = spreadWith(margins, (seconds - now) * 1000);
  const dropped = { ...timing.dropped };
  for (const { why } of scheduled.dropped) dropped[why]++;
  return {
    last: at,
    ticks,
    margins,
    laid: timing.laid + scheduled.steps.length,
    missed: timing.missed + (timing.laid > 0 ? scheduled.missed : 0),
    lateEvents: timing.lateEvents + (timing.laid > 0 ? scheduled.lateEvents.length : 0),
    dropped,
  };
}
