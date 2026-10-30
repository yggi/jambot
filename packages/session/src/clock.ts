/**
 * Clocks read against each other: one estimator for every pair of clocks.
 *
 * Two clocks are read against each other by samples, each saying the
 * offset between them (one clock less the other) lies within its `bound`
 * of what it read. Of the latest samples the one with the least bound is
 * trusted, the latest of equals. Clocks drift apart by some parts per
 * million, so the offset played by moves toward the trusted sample's by at
 * most the pair's `slew` a sample.
 *
 * A clock can also jump: an output that drops a buffer loses 10 ms at
 * once. Two samples whose ranges don't meet, give or take the pair's
 * `jumped`, can't be of the same two clocks. When `confirm` samples in a
 * row disagree so with the one trusted and agree with each other, the
 * clocks jumped: the samples before are dropped, and the offset follows at
 * once. The sound already moved with the jump; following it at once puts
 * it back, where slewing would leave it out. Fewer such samples are
 * dropped, as a blip is, and a wide sample, whose range meets both, decides
 * nothing.
 * A jump no wider than the samples' ranges and `jumped` is not told from
 * drift, so it is slewed: a pair's resolution is its samples' bounds.
 * Where every sample is sure to hold the offset within its bound
 * (`bounded`), the offset played by is also kept within the trusted one's:
 * a quicker sample that shows it out moves it there at once, as a jump does,
 * since slewing would leave it known to be wrong for seconds (#509).
 *
 * Jambot reads two kinds of pair (`clockPair`):
 *
 * - **A device's output** (`outputClock`): the moment its speakers are
 *   heard, on the output's clock, against the page's clock,
 *   `performance.now()`. The platform pairs the two (`getOutputTimestamp`)
 *   to within a few tenths of a millisecond, so this pair sees its own
 *   output drop a buffer, and follows it within three samples.
 * - **The host's page clock, as a client reads it** (`hostClock`): from
 *   pings, stamped with the page clocks, which don't jump. A ping bounds
 *   the offset to half its round trip (Cristian's method), so the one with
 *   the shortest round trip is trusted. Delay that is always longer one way
 *   than the other can't be seen from either end: the offset is then off
 *   by half the difference. Jambot is played in one room, so a host whose
 *   best round trip is longer than `CLOCK.tooFar` is too far away. The
 *   host's clock was read between sending and receiving, so a ping's bound
 *   is sure (`bounded`): a busy host's slow first answers set the offset
 *   some milliseconds out, and the first quick one puts it right.
 *
 * A host answers each ping with its page clock and its own output's
 * offset, the moment heard less its page clock. So a client sets its clock
 * by the host's as three pairs composed (`skewOf`): the host's heard
 * moment is the host's page clock plus its output's offset, which is the
 * client's page clock plus the network's offset, less the client's
 * output's offset from its own heard moment. A buffer dropped on either
 * device moves only that device's output pair, which follows it within
 * three ticks, however slow the link: the network's pings never read a
 * jump. A host's jump reaches a client with the next answer after.
 */

import type { Machine } from '@jambot/engine';

/** How a pair of clocks is estimated. */
export interface PairConfig {
  /** How many of the latest samples the estimate is taken from. */
  readonly window: number;
  /** How many samples it takes before the offset is trusted at all. */
  readonly ready: number;
  /** How far, in seconds, the offset played by moves on one sample. */
  readonly slew: number;
  /** How far, in seconds, two samples' ranges may miss each other and still be of the same clocks. */
  readonly jumped: number;
  /** How many samples in a row it takes to say the clocks jumped. */
  readonly confirm: number;
  /** Whether every sample is sure to hold the offset within its bound, so the offset played by is kept within the trusted one's. */
  readonly bounded: boolean;
}

/** A sample of a pair's offset: it lies within `bound` of `offset`, both in seconds. */
export interface Sample {
  readonly offset: number;
  readonly bound: number;
}

export interface PairCarried {
  /** The latest samples, the oldest first. */
  readonly samples: readonly Sample[];
  /** The offset played by, once it is trusted. */
  readonly offset: number | null;
  /** The samples in a row that disagreed with those before them, waiting for enough to say the clocks jumped. */
  readonly doubts: readonly Sample[];
  /** How many jumps the pair has followed. */
  readonly jumps: number;
}

export interface PairEstimate {
  /** The offset to play by, in seconds. Null until enough samples. */
  readonly offset: number | null;
  /** The bound of the sample trusted, or null before the first. */
  readonly bound: number | null;
  /** How many jumps the pair has followed. */
  readonly jumps: number;
}

/** Whether two samples could be of the same two clocks: their ranges meet, give or take `jumped`. */
const agree = (a: Sample, b: Sample, jumped: number) =>
  Math.abs(a.offset - b.offset) <= a.bound + b.bound + jumped;

/** The sample trusted: the least bound, the latest of equals. */
const trustedOf = (samples: readonly Sample[]) =>
  samples.length === 0 ? null : samples.reduce((a, b) => (b.bound <= a.bound ? b : a));

const estimate = ({ samples, offset, jumps }: PairCarried): PairEstimate => ({
  offset,
  bound: trustedOf(samples)?.bound ?? null,
  jumps,
});

/** The estimator of a pair of clocks, from samples of their offset. */
export function clockPair(config: PairConfig): Machine<null, PairCarried, Sample, PairEstimate> {
  const { window, ready, slew, jumped, confirm, bounded } = config;
  return {
    initial: { samples: [], offset: null, doubts: [], jumps: 0 },
    advance(_, carried, sample) {
      if (!(sample.bound >= 0)) return { carried, output: estimate(carried) };
      const trusted = trustedOf(carried.samples);
      const withDoubts = carried.doubts.every((d) => agree(sample, d, jumped));
      if (trusted && !agree(sample, trusted, jumped)) {
        const doubts = withDoubts ? [...carried.doubts, sample] : [sample];
        if (doubts.length < confirm) {
          // Too few against the rest: held until more say which is right.
          const next = { ...carried, doubts };
          return { carried: next, output: estimate(next) };
        }
        // Enough against the rest: the clocks jumped. Start again from them.
        const followed = carried.offset !== null;
        const next = {
          samples: doubts,
          offset: followed ? trustedOf(doubts)!.offset : null,
          doubts: [],
          jumps: carried.jumps + (followed ? 1 : 0),
        };
        return { carried: next, output: estimate(next) };
      }
      const samples = [...carried.samples, sample].slice(-window);
      const best = trustedOf(samples)!;
      let offset = carried.offset;
      if (samples.length >= ready)
        offset =
          offset === null
            ? best.offset
            : offset + Math.max(-slew, Math.min(slew, best.offset - offset));
      if (offset !== null && bounded)
        offset = Math.max(best.offset - best.bound, Math.min(best.offset + best.bound, offset));
      // A wide sample agrees with both: it leaves the doubts standing.
      const next = {
        samples,
        offset,
        doubts: withDoubts ? carried.doubts : [],
        jumps: carried.jumps,
      };
      return { carried: next, output: estimate(next) };
    },
  };
}

/**
 * A device's output against its page: the moment heard, on the output's
 * clock, less the page's clock, from one pairing each tick. The pairing is
 * good to a few tenths of a millisecond, and blips by a few on a busy
 * machine, one reading at a time (#27). Two blips in a row that agree are
 * rare but not negligible over thousands of ticks, so a jump takes three
 * readings to confirm: a dropped buffer is followed within three ticks,
 * 75 ms. Where the platform has no pairing, the output's clock less its
 * latency stands in, a render quantum coarser.
 */
export const OUTPUT = {
  window: 16,
  ready: 2,
  confirm: 3,
  /** A blip reads past its bound, so the offset slews through it. */
  bounded: false,
  /** A quarter of a millisecond a tick: a jump inside the jump rule is gone in some eight ticks. */
  slew: 0.00025,
  jumped: 0.001,
  /** The bound of a reading of the pairing. */
  paired: 0.0005,
  /** The bound of a reading of the clock less its latency: a render quantum, at 44.1 kHz. */
  unpaired: 0.003,
} as const;

export const outputClock = clockPair(OUTPUT);

/** A reading of the platform's pairing, as a sample of the output's offset from the page's clock. */
export const pairingSample = (contextTime: number, performanceTime: number): Sample => ({
  offset: contextTime - performanceTime / 1000,
  bound: OUTPUT.paired,
});

/** The output's clock less its latency, against the page's clock in milliseconds, where the platform doesn't pair them. */
export const unpairedSample = (currentTime: number, latency: number, pageMs: number): Sample => ({
  offset: currentTime - latency - pageMs / 1000,
  bound: OUTPUT.unpaired,
});

/** The host's page clock, as a client reads it from pings. */
export const CLOCK = {
  window: 16,
  ready: 4,
  slew: 0.0005,
  jumped: 0.003,
  confirm: 2,
  bounded: true,
  /** The longest best round trip, in seconds, a host may be away. */
  tooFar: 0.1,
} as const;

const network = clockPair(CLOCK);

/**
 * A ping answered: the client's page clock as it sent and received, the
 * host's page clock as it answered, and the host's output's offset from
 * its page clock then, or null before the host's output is paired.
 */
export interface Ping {
  readonly sent: number;
  readonly received: number;
  readonly host: number;
  readonly heard: number | null;
}

export interface ClockCarried {
  readonly pair: PairCarried;
  /** The host's output's offset from its page clock, from the latest answer that had one. */
  readonly heard: number | null;
}

export interface ClockReading {
  /** The host's page clock less the client's. Null until enough pings. */
  readonly offset: number | null;
  /** The shortest round trip of the latest pings, or null before the first. */
  readonly trip: number | null;
  readonly tooFar: boolean;
  /** The host's output's offset from its page clock, once a ping has said. */
  readonly heard: number | null;
  /** How many jumps the pair has followed. */
  readonly jumps: number;
}

export const hostClock: Machine<null, ClockCarried, Ping, ClockReading> = {
  initial: { pair: network.initial, heard: null },
  advance(_, carried, { sent, received, host, heard }) {
    const trip = received - sent;
    // A ping that came back before it was sent is no reading.
    const sample = { offset: host - (sent + received) / 2, bound: trip >= 0 ? trip / 2 : NaN };
    const { carried: pair, output } = network.advance(null, carried.pair, sample);
    const next = { pair, heard: heard ?? carried.heard };
    const best = output.bound === null ? null : output.bound * 2;
    const tooFar = pair.samples.length >= CLOCK.ready && best !== null && best > CLOCK.tooFar;
    return {
      carried: next,
      output: { offset: output.offset, trip: best, tooFar, heard: next.heard, jumps: output.jumps },
    };
  },
};

/**
 * The host's heard moment less the client's: the network's offset, plus
 * the host's output's offset, less the client's. Null until each is known.
 */
export function skewOf(host: ClockReading, heard: number | null): number | null {
  if (host.offset === null || host.heard === null || heard === null) return null;
  return host.offset + host.heard - heard;
}
