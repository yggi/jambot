/**
 * When a client that lost its link tries again, and when it stops.
 *
 * A link drops for a phone's sake as often as the network's: a PWA in the
 * background has its sockets closed, or left open and dead. A client keeps
 * playing what it has while it tries, so an outage is a few bars resting
 * (`lacked`), not an end. It retries quickly at first and steadily after,
 * for `RECONNECT.window` seconds of trying. A page waking starts its
 * window again, since the time it slept through was no outage of the
 * host's. What stops it altogether, a refusal or the host closing on
 * purpose, is not an outage and never reaches this policy. Pure: the
 * caller keeps the timers.
 */

export const RECONNECT = {
  /** Seconds before the first, second, … try after a failure; the last repeats. */
  delays: [0.25, 0.5, 1, 2, 4],
  /** How long, in seconds, one outage is tried for. */
  window: 60,
  /** How long, in seconds, a link may say nothing before it is taken for dead. */
  stale: 1,
} as const;

export interface Outage {
  /** The moment, in seconds, the tries began. */
  readonly since: number;
  readonly tries: number;
}

export type Retry =
  { readonly kind: 'wait'; readonly seconds: number } | { readonly kind: 'give-up' };

export const outage = (now: number): Outage => ({ since: now, tries: 0 });

/** After a failed try. */
export const failed = (o: Outage): Outage => ({ ...o, tries: o.tries + 1 });

/** A page woke at `now`: the window and the delays start again. */
export const woken = (now: number): Outage => outage(now);

/** What to do at `now`: wait, then try, or stop. */
export function retry(o: Outage, now: number): Retry {
  if (now - o.since >= RECONNECT.window) return { kind: 'give-up' };
  const { delays } = RECONNECT;
  // The last try falls on the window's end, not after it.
  const left = RECONNECT.window - (now - o.since);
  return { kind: 'wait', seconds: Math.min(delays[Math.min(o.tries, delays.length - 1)]!, left) };
}

/**
 * Whether a link that last heard its host at `lastHeard` (null before any
 * answer) is to be taken for dead at `now`: a socket the system closed
 * under a sleeping page can read open for good.
 */
export const stale = (lastHeard: number | null, now: number): boolean =>
  lastHeard !== null && now - lastHeard > RECONNECT.stale;
