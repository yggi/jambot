/**
 * The host's clock, as a client reads it.
 *
 * A client pings the host, stamped with its own clock; the host answers
 * with its clock as it answered. If the way there and the way back take as
 * long, the host's clock read `host` halfway between sending and receiving,
 * and `host - (sent + received) / 2` is the offset between the two clocks.
 * Delay varies, and a ping held up on one leg reads wrong by half the hold,
 * so of the latest pings the one with the shortest round trip is trusted
 * (Cristian's method, filtered by the least delay). A ping that came back
 * before it was sent says the client's clock stepped in between, as an
 * output's does when it first pairs with the page's clock; it would be the
 * shortest of all, so it is dropped. Delay that is always
 * longer one way than the other can't be seen from either end: the offset
 * is then off by half the difference.
 *
 * Two clocks drift apart by some parts per million, so the offset is
 * estimated on every ping, and the offset played by moves toward the
 * estimate by at most `CLOCK.slew` a ping.
 *
 * A clock can also step: an output that drops a buffer loses 10 ms at once,
 * and so does its pairing with the page's clock. A ping says the offset
 * lies within half its round trip of what it read, so two pings whose
 * ranges don't meet (give or take `CLOCK.stepped`, the pairing's own
 * jitter) can't be of the same two clocks. When a ping disagrees so with
 * the one trusted, and the next agrees with it, the clocks stepped: the
 * pings before are dropped, and the offset follows at once. The sound
 * already moved with the step; following it at once puts it back, where
 * slewing would leave it out for seconds. A single ping that disagrees
 * is dropped, and a slow ping, whose range meets both, decides nothing.
 *
 * Jambot is played in one room, so a host whose best round trip over the
 * window is longer than `CLOCK.tooFar` is too far away, and a client leaves.
 */

import type { Machine } from '@jambot/engine';

export const CLOCK = {
  /** How many of the latest pings the estimate is taken from. */
  window: 16,
  /** How many pings it takes before the offset is trusted at all. */
  ready: 4,
  /** How far, in seconds, the offset played by moves on one ping. */
  slew: 0.0005,
  /** The longest best round trip, in seconds, a host may be away. */
  tooFar: 0.1,
  /** How far, in seconds, two pings' ranges may miss each other and still be of the same clocks. */
  stepped: 0.003,
} as const;

/** A ping answered: the client's clock as it sent and received, and the host's as it answered. */
export interface Ping {
  readonly sent: number;
  readonly received: number;
  readonly host: number;
}

export interface ClockCarried {
  /** The latest pings' round trips and offsets, the oldest first. */
  readonly pings: readonly { readonly trip: number; readonly offset: number }[];
  /** The offset played by, host minus client, once it is trusted. */
  readonly offset: number | null;
  /** A ping that disagreed with those before it, waiting for the next to say whether the clocks stepped. */
  readonly doubt: { readonly trip: number; readonly offset: number } | null;
}

export interface ClockReading {
  /** The offset to play by: the host's clock minus the client's. Null until enough pings. */
  readonly offset: number | null;
  /** The shortest round trip of the latest pings, or null before the first. */
  readonly trip: number | null;
  readonly tooFar: boolean;
}

/** Whether two pings could be of the same two clocks: their ranges meet, give or take `CLOCK.stepped`. */
const agree = (a: { trip: number; offset: number }, b: { trip: number; offset: number }) =>
  Math.abs(a.offset - b.offset) <= (a.trip + b.trip) / 2 + CLOCK.stepped;

export const hostClock: Machine<null, ClockCarried, Ping, ClockReading> = {
  initial: { pings: [], offset: null, doubt: null },
  advance(_, carried, { sent, received, host }) {
    const trip = received - sent;
    if (trip < 0) return { carried, output: reading(carried) };
    const ping = { trip, offset: host - (sent + received) / 2 };
    const trusted = bestOf(carried.pings);
    if (trusted && !agree(ping, trusted)) {
      if (!carried.doubt || !agree(ping, carried.doubt)) {
        // One ping against the rest: held until the next says which is right.
        const next = { ...carried, doubt: ping };
        return { carried: next, output: reading(next) };
      }
      // Two pings against the rest: the clocks stepped. Start again from them.
      const pings = [carried.doubt, ping];
      const offset = carried.offset === null ? null : bestOf(pings)!.offset;
      const next = { pings, offset, doubt: null };
      return { carried: next, output: reading(next) };
    }
    const pings = [...carried.pings, ping].slice(-CLOCK.window);
    const best = bestOf(pings)!;
    let offset = carried.offset;
    if (pings.length >= CLOCK.ready)
      offset =
        offset === null
          ? best.offset
          : offset + Math.max(-CLOCK.slew, Math.min(CLOCK.slew, best.offset - offset));
    // A slow ping agrees with both: it leaves a doubt standing.
    const doubt = carried.doubt && agree(ping, carried.doubt) ? carried.doubt : null;
    const next = { pings, offset, doubt };
    return { carried: next, output: reading(next) };
  },
};

const bestOf = (pings: ClockCarried['pings']) =>
  pings.length === 0 ? null : pings.reduce((a, b) => (b.trip < a.trip ? b : a));

function reading({ pings, offset }: ClockCarried): ClockReading {
  const trip = bestOf(pings)?.trip ?? null;
  const tooFar = pings.length >= CLOCK.ready && trip !== null && trip > CLOCK.tooFar;
  return { offset, trip, tooFar };
}
