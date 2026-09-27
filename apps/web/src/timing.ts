/**
 * The timing report (#27): the device's counters in one plain object, as
 * the `?timing` panel shows them and its export writes them, in
 * milliseconds throughout.
 *
 * - **The transport**: how far apart its ticks came on the page's clock, how
 *   far ahead of the output's clock each event was scheduled (the least is how near a note came to
 *   playing late), and the steps it laid and missed (`timedTick`).
 * - **The output pair**: the moment heard less the page's clock, the bound
 *   it trusts, and the jumps it followed, which are the buffers the output
 *   dropped (`clockOffset`).
 * - **The network pair**, on a client: every ping's round trip, the best
 *   lately, the jumps followed, and the skew played by (`hostClock`).
 * - **The session**: a client's bars that came too late, and the
 *   judgements from clients the Muse dropped, by why.
 */

import type { PairEstimate, SpreadSummary, TransportTiming } from '@jambot/session';
import { summaryOf } from '@jambot/session';
import type { Mode } from './player.svelte.ts';
import type { NetworkTiming } from './session/client.svelte.ts';

/** What the report is read from. */
export interface TimingSources {
  readonly mode: Mode;
  readonly transport: TransportTiming;
  /** The output pair's estimate, once the output exists. */
  readonly output: PairEstimate | null;
  readonly network: NetworkTiming | null;
  /** How many of the host's bars, as a client, came too late. */
  readonly lacked: number;
}

/** Where the report was taken. */
export interface TimingPlace {
  /** When, as an ISO date. */
  readonly taken: string;
  readonly userAgent: string;
}

export interface TimingReport extends TimingPlace {
  readonly report: 'jambot timing';
  readonly version: 1;
  readonly mode: Mode;
  readonly transport: {
    readonly ticks: SpreadSummary;
    readonly margins: SpreadSummary;
    readonly laid: number;
    readonly missed: number;
  };
  readonly output: {
    readonly offset: number | null;
    readonly bound: number | null;
    readonly jumps: number;
  } | null;
  readonly network: {
    readonly trips: SpreadSummary;
    readonly best: number | null;
    readonly jumps: number;
    readonly skew: number | null;
  } | null;
  readonly session: {
    readonly lacked: number;
    readonly dropped: TransportTiming['dropped'];
  };
}

/** Seconds as milliseconds, to a microsecond; null stays null. */
const ms = (seconds: number | null) => (seconds === null ? null : Math.round(seconds * 1e6) / 1e3);

/** A millisecond figure to a microsecond. */
const fine = (value: number | null) => (value === null ? null : Math.round(value * 1e3) / 1e3);

const summary = (spread: TransportTiming['ticks']): SpreadSummary => {
  const { count, least, p50, p99, most } = summaryOf(spread);
  return { count, least: fine(least), p50: fine(p50), p99: fine(p99), most: fine(most) };
};

export function timingReport(sources: TimingSources, place: TimingPlace): TimingReport {
  const { mode, transport, output, network, lacked } = sources;
  return {
    report: 'jambot timing',
    version: 1,
    ...place,
    mode,
    transport: {
      ticks: summary(transport.ticks),
      margins: summary(transport.margins),
      laid: transport.laid,
      missed: transport.missed,
    },
    output: output && { offset: ms(output.offset), bound: ms(output.bound), jumps: output.jumps },
    network: network && {
      trips: summary(network.trips),
      best: ms(network.reading?.trip ?? null),
      jumps: network.reading?.jumps ?? 0,
      skew: ms(network.skew),
    },
    session: { lacked, dropped: transport.dropped },
  };
}

/** The report as a file a person attaches: its name and its text. */
export function timingFile(report: TimingReport): { name: string; text: string } {
  const stamp = report.taken.replace(/[:.]/g, '-');
  return { name: `jambot-timing-${stamp}.json`, text: `${JSON.stringify(report, null, 2)}\n` };
}
