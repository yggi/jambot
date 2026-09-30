/**
 * Following a hit (#204, H7): which hit of the pattern a tap answers, how
 * far off it was, and how a run of taps adds up.
 *
 * A tap answers the nearest hit not answered yet, within a window of half
 * the least gap between two hits (so a tap is never nearer to a hit that
 * isn't its own than to its own, for a player who is on time). What a
 * player does beyond that is left to the log, which keeps every tap and its
 * time for a better matching elsewhere. Offsets are in milliseconds, and
 * positive where the player was late.
 */

import type { Expected, TestPlan } from './pattern.ts';

/** How far, in milliseconds, a tap may be off a hit and still be called on time. */
export const ON_TIME_MS = 25;

/** The window a tap may answer a hit in, in seconds: half the least gap between two hits, bars joined. */
export function matchWindow(plan: TestPlan): number {
  const times = plan.expected.map((e) => e.at);
  let least = Infinity;
  for (let i = 1; i < times.length; i++) least = Math.min(least, times[i]! - times[i - 1]!);
  return Number.isFinite(least) ? least / 2 : plan.barSeconds / 2;
}

export interface Match {
  readonly hit: Expected;
  /** Milliseconds; positive where the tap was late. */
  readonly offsetMs: number;
}

/**
 * The hit a tap at `at` seconds answers, or null: the nearest of those not
 * in `claimed` within `window`, the earlier of two equally near.
 */
export function matchTap(
  expected: readonly Expected[],
  claimed: ReadonlySet<number>,
  at: number,
  window: number,
): Match | null {
  let best: Expected | null = null;
  for (const e of expected) {
    if (claimed.has(e.index)) continue;
    const distance = Math.abs(at - e.at);
    if (distance > window) continue;
    if (best === null || distance < Math.abs(at - best.at)) best = e;
  }
  return best && { hit: best, offsetMs: (at - best.at) * 1000 };
}

export type Verdict = 'early' | 'on time' | 'late';

export const verdictOf = (offsetMs: number): Verdict =>
  Math.abs(offsetMs) <= ON_TIME_MS ? 'on time' : offsetMs < 0 ? 'early' : 'late';

/** What a tap was, in words: "12 ms late", "on time (3 ms early)". */
export function describeOffset(offsetMs: number): string {
  const ms = Math.round(Math.abs(offsetMs));
  const side = offsetMs < 0 ? 'early' : 'late';
  return verdictOf(offsetMs) === 'on time' ? `on time (${ms} ms ${side})` : `${ms} ms ${side}`;
}

export interface OffsetStats {
  readonly count: number;
  /** The mean offset, milliseconds: where the player sits against the beat. */
  readonly mean: number | null;
  /** The spread of the offsets, milliseconds: how steady the player is. */
  readonly sd: number | null;
  readonly median: number | null;
  /** The share of offsets within `ON_TIME_MS`, from 0 to 1. */
  readonly onTime: number | null;
}

/** A run of offsets, in milliseconds, summed up. */
export function statsOf(offsets: readonly number[]): OffsetStats {
  const count = offsets.length;
  if (count === 0) return { count, mean: null, sd: null, median: null, onTime: null };
  const mean = offsets.reduce((a, b) => a + b, 0) / count;
  const sd = Math.sqrt(offsets.reduce((sum, o) => sum + (o - mean) ** 2, 0) / count);
  const sorted = [...offsets].sort((a, b) => a - b);
  const mid = count >> 1;
  const median = count % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  const onTime = offsets.filter((o) => Math.abs(o) <= ON_TIME_MS).length / count;
  return { count, mean, sd, median, onTime };
}
