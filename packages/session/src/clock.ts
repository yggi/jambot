/**
 * The host's clock, as a client reads it.
 *
 * A client pings the host, stamped with its own clock; the host answers
 * with its clock as it answered. If the way there and the way back take as
 * long, the host's clock read `host` halfway between sending and receiving,
 * and `host - (sent + received) / 2` is the offset between the two clocks.
 * Delay varies, and a ping held up on one leg reads wrong by half the hold,
 * so of the latest pings the one with the shortest round trip is trusted
 * (Cristian's method, filtered by the least delay). Delay that is always
 * longer one way than the other can't be seen from either end: the offset
 * is then off by half the difference.
 *
 * Two clocks drift apart by some parts per million, so the offset is
 * estimated on every ping. Once the client plays, the offset it plays by
 * never jumps: it moves toward the estimate by at most `CLOCK.slew` a ping.
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
}

export interface ClockReading {
  /** The offset to play by: the host's clock minus the client's. Null until enough pings. */
  readonly offset: number | null;
  /** The shortest round trip of the latest pings. */
  readonly trip: number;
  readonly tooFar: boolean;
}

export const hostClock: Machine<null, ClockCarried, Ping, ClockReading> = {
  initial: { pings: [], offset: null },
  advance(_, carried, { sent, received, host }) {
    const trip = received - sent;
    const pings = [...carried.pings, { trip, offset: host - (sent + received) / 2 }].slice(
      -CLOCK.window,
    );
    const best = pings.reduce((a, b) => (b.trip < a.trip ? b : a));
    let offset = carried.offset;
    if (pings.length >= CLOCK.ready)
      offset =
        offset === null
          ? best.offset
          : offset + Math.max(-CLOCK.slew, Math.min(CLOCK.slew, best.offset - offset));
    const tooFar = pings.length >= CLOCK.ready && best.trip > CLOCK.tooFar;
    return { carried: { pings, offset }, output: { offset, trip: best.trip, tooFar } };
  },
};
