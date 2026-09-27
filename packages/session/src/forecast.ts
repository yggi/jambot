/**
 * The bars ahead, sent as what changed.
 *
 * A client shows the host's forecast, the song map and the next bars, but
 * can't make it: it runs no band. The whole forecast is tens of kilobytes,
 * and from one bar to the next only the bar that came into view changes,
 * unless a control moved. So a host sends the bars that differ from what it
 * sent before, and the range they fall in.
 */

import type { ForecastBar } from '@jambot/engine';

export interface ForecastDelta {
  /** The first bar of the forecast. */
  readonly from: number;
  /** How many bars it holds, from `from` on. */
  readonly count: number;
  /** The bars that differ from those sent before, or are new. */
  readonly changed: readonly ForecastBar[];
}

/** A value as JSON with its keys in order, so two equal values read the same however they were built. */
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)))
      : v,
  );

/** What changed from the bars sent before to the bars now. */
export function forecastDelta(
  before: readonly ForecastBar[],
  now: readonly ForecastBar[],
): ForecastDelta {
  const sent = new Map(before.map((b) => [b.bar, canonical(b)]));
  return {
    from: now[0]?.bar ?? 0,
    count: now.length,
    changed: now.filter((b) => sent.get(b.bar) !== canonical(b)),
  };
}

/** The bars a client holds, with a delta applied: the forecast the host has. */
export function applyForecast(
  held: readonly ForecastBar[],
  { from, count, changed }: ForecastDelta,
): ForecastBar[] {
  const byBar = new Map(held.map((b) => [b.bar, b]));
  for (const b of changed) byBar.set(b.bar, b);
  const bars: ForecastBar[] = [];
  for (let bar = from; bar < from + count; bar++) {
    const b = byBar.get(bar);
    if (b) bars.push(b);
  }
  return bars;
}
