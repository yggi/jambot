/**
 * The output's clock against the page's: when what is scheduled on the
 * output is heard, on `performance.now()`, the clock MIDI timestamps and
 * notes played are read against.
 *
 * It is a device's output pair (`outputClock`, #27): the moment heard, on
 * the output's clock, less the page's clock, estimated from one reading a
 * tick. Where the platform pairs the two clocks (`outputTimestamp`), each
 * reading is the pairing's, good to a few tenths of a millisecond, and a
 * buffer the output drops is followed within three readings. In Chromium
 * the pairing steps by a buffer at a time while the output starts, so a
 * pairing is read only once the output has run for `PAIRED_AFTER`. Where
 * the platform never pairs, the output's clock less its latency stands in,
 * a render quantum coarser. The two are never mixed: in Chromium they
 * differ by some milliseconds (the heard moment lags `currentTime` by 35
 * ms against a stated latency of 32).
 */

import {
  type PairCarried,
  type PairEstimate,
  outputClock,
  pairingSample,
  unpairedSample,
} from '@jambot/session';

export interface OutputClock {
  readonly currentTime: number;
  /** How far behind `currentTime` what is heard is, in seconds. */
  readonly latency?: number;
  /** A precise pairing of the two clocks, where the platform gives one. */
  outputTimestamp?():
    { readonly contextTime: number; readonly performanceTime: number } | undefined;
}

/** How long, in seconds, an output runs before its clock's pairing is read. */
export const PAIRED_AFTER = 0.2;

export interface ClockOffset {
  /** Read the clocks once more: once a tick, and whenever a session needs them. */
  update(): void;
  /** The moment heard less the page's clock, in seconds, once trusted. */
  heardOffset(): number | null;
  /** The moment heard now, on the output's clock. */
  heard(): number;
  /** `seconds` on the output's clock, as a `performance.now()`-relative timestamp. */
  toDeviceMs(seconds: number): number;
  /** The inverse: a `performance.now()`-relative timestamp, as seconds on the output's clock. */
  fromDeviceMs(ms: number): number;
  /** The output pair's estimate: its offset, the bound it trusts, and the jumps it followed. */
  readonly estimate: PairEstimate;
}

export function clockOffset(
  clock: OutputClock,
  now: () => number = () => performance.now(),
): ClockOffset {
  let carried: PairCarried = outputClock.initial;
  let estimate: PairEstimate = { offset: null, bound: null, jumps: 0 };
  /** The output time of the reading last taken, so one reading isn't taken twice. */
  let last: number | null = null;
  /** One reading of the clocks, the pairing where the platform pairs: null where there is none to take. */
  const reading = () => {
    if (!clock.outputTimestamp) {
      const at = clock.currentTime;
      return { at, sample: unpairedSample(at, clock.latency ?? 0, now()) };
    }
    const ts = clock.outputTimestamp();
    if (!ts || !(ts.contextTime >= PAIRED_AFTER) || !(ts.performanceTime > 0)) return null;
    return { at: ts.contextTime, sample: pairingSample(ts.contextTime, ts.performanceTime) };
  };
  /** The offset to read by: the estimate, or before there is one, a single reading of whatever the platform gives. */
  const offset = () => {
    if (estimate.offset !== null) return estimate.offset;
    const ts = clock.outputTimestamp?.();
    if (ts && ts.contextTime > 0 && ts.performanceTime > 0)
      return pairingSample(ts.contextTime, ts.performanceTime).offset;
    return unpairedSample(clock.currentTime, clock.latency ?? 0, now()).offset;
  };
  return {
    update() {
      const read = reading();
      if (!read || read.at === last) return;
      last = read.at;
      const next = outputClock.advance(null, carried, read.sample);
      carried = next.carried;
      estimate = next.output;
    },
    heardOffset: () => estimate.offset,
    heard: () => now() / 1000 + offset(),
    toDeviceMs: (seconds) => (seconds - offset()) * 1000,
    fromDeviceMs: (ms) => ms / 1000 + offset(),
    get estimate() {
      return estimate;
    },
  };
}
