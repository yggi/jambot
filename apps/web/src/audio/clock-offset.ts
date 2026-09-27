/**
 * The gap between the clock MIDI is scheduled on and the wall clock a MIDI
 * port's timestamps are read against.
 *
 * `Output.currentTime` runs on an audio context's clock; a MIDI message's
 * timestamp is read against `performance.now()`. Both are related through
 * the moment being heard: a MIDI note goes out when the audio scheduled
 * with it is heard, and a note played is placed at what was heard as it was
 * played. Where the platform relates the two precisely (`outputTimestamp`),
 * its context time is that moment; otherwise the fallback compares `now()`
 * with `currentTime` less the output's latency, which drifts by the two
 * clocks' rounding but is close enough to start from. In Chromium the
 * precise heard moment lags `currentTime` by about the output latency (35
 * ms against 32). Repeated samples are smoothed, nine parts kept to one part fresh,
 * so a single noisy sample cannot move a scheduled note far.
 */

export interface OutputClock {
  readonly currentTime: number;
  /** How far behind `currentTime` what is heard is, in seconds. */
  readonly latency?: number;
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
    return now() - (clock.currentTime - (clock.latency ?? 0)) * 1000;
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
