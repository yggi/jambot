/**
 * The gap between the clock MIDI is scheduled on and the wall clock a MIDI
 * port's timestamps are read against.
 *
 * `Output.currentTime` runs on an audio context's clock; a MIDI message's
 * timestamp is read against `performance.now()`. Where the platform can
 * relate the two precisely (`outputTimestamp`), the gap is taken from that;
 * otherwise it falls back to comparing `now()` with `currentTime` directly,
 * which drifts by the two clocks' rounding but is close enough to start
 * from. Repeated samples are smoothed, nine parts kept to one part fresh,
 * so a single noisy sample cannot move a scheduled note far.
 */

export interface OutputClock {
  readonly currentTime: number;
  /** A precise pairing of the two clocks, where the platform gives one. */
  outputTimestamp?():
    { readonly contextTime: number; readonly performanceTime: number } | undefined;
}

export interface ClockOffset {
  /** Take a fresh sample, smoothed into the running offset. */
  update(): void;
  /** `seconds` on the output's clock, as a `performance.now()`-relative timestamp. */
  toDeviceMs(seconds: number): number;
  /** The inverse: a `performance.now()`-relative timestamp, as seconds on the output's clock. */
  fromDeviceMs(ms: number): number;
}

export function clockOffset(
  clock: OutputClock,
  now: () => number = () => performance.now(),
): ClockOffset {
  let offset: number | null = null;
  const sample = (): number => {
    const ts = clock.outputTimestamp?.();
    if (ts && ts.contextTime > 0 && ts.performanceTime > 0)
      return ts.performanceTime - ts.contextTime * 1000;
    return now() - clock.currentTime * 1000;
  };
  return {
    update() {
      const s = sample();
      offset = offset === null ? s : offset * 0.9 + s * 0.1;
    },
    toDeviceMs(seconds) {
      return seconds * 1000 + (offset ?? sample());
    },
    fromDeviceMs(ms) {
      return (ms - (offset ?? sample())) / 1000;
    },
  };
}
