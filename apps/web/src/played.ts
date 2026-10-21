/**
 * What a player's outputs played, event by event, and a host's set against a
 * client's (#446): the bound of a session playing through cells is that a
 * client plays exactly the host's events (part, note, velocity, onset and
 * length), whichever way each plays them. The player keeps the latest
 * (`PlayedLog`), the dev readout gives them (`window.jambot.played`), and the
 * session's end-to-end check and soak compare two pages' (`compareSession`).
 *
 * A time is on the transport's clock, which a client's runs in the host's
 * time (`skew` aside), so a client's event and its host's fall at one time.
 */

import type { TimedEvent } from '@jambot/engine';

/** An event as an output played it: its bar, part, step, note, velocity, length in steps, and onset and duration in seconds. */
export interface PlayedEvent {
  readonly bar: number;
  readonly part: string;
  readonly step: number;
  readonly note: number;
  readonly velocity: number;
  readonly length: number;
  readonly seconds: number;
  readonly duration: number;
}

export const playedOf = ({ bar, seconds, duration, event }: TimedEvent): PlayedEvent => ({
  bar,
  part: event.part,
  step: event.step,
  note: event.note,
  velocity: event.velocity,
  length: event.length,
  seconds,
  duration,
});

/** How many events a log keeps, the latest: some 15 minutes of the band at full energy. */
export const PLAYED_KEPT = 20_000;

/**
 * The events played lately, each numbered from the first a page played, so a
 * reader that comes back for more takes only those it hasn't (`since`).
 */
export class PlayedLog {
  #kept: PlayedEvent[] = [];
  #count = 0;

  push(events: readonly TimedEvent[]) {
    for (const e of events) this.#kept.push(playedOf(e));
    this.#count += events.length;
    if (this.#kept.length > PLAYED_KEPT) this.#kept.splice(0, this.#kept.length - PLAYED_KEPT);
  }

  /** Every event kept numbered `from` on, and the number of the next to come. */
  since(from = 0): { readonly events: PlayedEvent[]; readonly next: number } {
    const first = this.#count - this.#kept.length;
    return { events: this.#kept.slice(Math.max(0, from - first)), next: this.#count };
  }
}

/** Within 1 ms: the bound on an onset and a duration between two pages. */
const WITHIN = 0.001;

/** What sets a host's events against a client's found: the bars and events compared, and what differs. */
export interface SessionComparison {
  /** The bars both played whole, first and last, and how many events in them. */
  readonly bars: { readonly from: number; readonly to: number };
  readonly events: number;
  /** Events one played and the other didn't, and events of both whose velocity, length in steps, onset or duration differs. */
  readonly mismatched: {
    readonly missing: number;
    readonly extra: number;
    readonly velocity: number;
    readonly length: number;
    readonly onset: number;
    readonly duration: number;
  };
  /** The farthest apart two events' onsets and durations were, in seconds. */
  readonly largest: { readonly onset: number; readonly duration: number };
  /** The first that differ, each in a line. */
  readonly differing: readonly string[];
}

/** Which event it is: its bar, part, step and note. */
const keyOf = (e: PlayedEvent) => `${e.bar} ${e.part} ${e.step.toFixed(6)} ${e.note}`;

/**
 * A host's events against a client's, over the bars both played whole: from
 * the later of their first bars, past it, to the earlier of their last, short
 * of it (a page read mid-bar holds it in part). Every event of one is the
 * other's, its velocity and length the same, its onset and duration within 1 ms.
 */
export function compareSession(
  host: readonly PlayedEvent[],
  client: readonly PlayedEvent[],
): SessionComparison {
  const bars = (es: readonly PlayedEvent[]) => es.map((e) => e.bar);
  const from = Math.max(Math.min(...bars(host)), Math.min(...bars(client))) + 1;
  const to = Math.min(Math.max(...bars(host)), Math.max(...bars(client))) - 1;
  const within = (es: readonly PlayedEvent[]) => es.filter((e) => e.bar >= from && e.bar <= to);
  const theirs = new Map<string, PlayedEvent[]>();
  for (const e of within(client)) theirs.set(keyOf(e), [...(theirs.get(keyOf(e)) ?? []), e]);
  const mismatched = { missing: 0, extra: 0, velocity: 0, length: 0, onset: 0, duration: 0 };
  const largest = { onset: 0, duration: 0 };
  const differing: string[] = [];
  const say = (line: string) => void (differing.length < 20 && differing.push(line));
  const mine = within(host);
  for (const h of mine) {
    const c = theirs.get(keyOf(h))?.shift();
    if (!c) {
      mismatched.missing++;
      say(`the client lacks ${keyOf(h)}`);
      continue;
    }
    const onset = Math.abs(c.seconds - h.seconds);
    const duration = Math.abs(c.duration - h.duration);
    largest.onset = Math.max(largest.onset, onset);
    largest.duration = Math.max(largest.duration, duration);
    const apart = {
      velocity: c.velocity !== h.velocity,
      length: Math.abs(c.length - h.length) >= 1e-6,
      onset: onset >= WITHIN,
      duration: duration >= WITHIN,
    };
    for (const field of ['velocity', 'length', 'onset', 'duration'] as const)
      if (apart[field]) mismatched[field]++;
    if (Object.values(apart).some(Boolean))
      say(`${keyOf(h)}: host ${JSON.stringify(h)}, client ${JSON.stringify(c)}`);
  }
  for (const left of theirs.values())
    for (const c of left) {
      mismatched.extra++;
      say(`the host lacks ${keyOf(c)}`);
    }
  return { bars: { from, to }, events: mine.length, mismatched, largest, differing };
}
