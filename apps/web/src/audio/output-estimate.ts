/**
 * The clock offset (`clockOffset`, `@yggi/webmidi/core`) with the output
 * pair's estimate the timing panel shows (#27): the offset, the bound of the
 * reading it trusts, and how many jumps of the output's clock it followed,
 * as dropped buffers.
 *
 * webmidi's offset keeps its estimate to itself (yggi/webmidi#9), so this
 * reads it off what it shows. Its readings all have one bound, the
 * pairing's or, where the platform has none, the clock's. Its offset moves
 * by at most `OUTPUT.slew` on a reading unless it follows a jump, so a
 * reading that moves it further is a jump followed. A restart that moves
 * it less goes uncounted: on a pairing that blips, the estimate Jambot had
 * before counted 54 jumps where this counts 53 (`output-estimate.test.ts`),
 * and over a simulated device's faults, six dropped buffers among them, the
 * two count the same.
 */

import type { PairEstimate } from '@jambot/session';
import { type ClockOffset, OUTPUT, type OutputClock, clockOffset } from '@yggi/webmidi/core';

export interface EstimatedOffset extends ClockOffset {
  /** The output pair's estimate: its offset, the bound it trusts, and the jumps it followed. */
  readonly estimate: PairEstimate;
}

/** How far, in seconds, a reading moves the offset past the slew before it counts as a jump: a nanosecond, for rounding. */
const ROUNDING = 1e-9;

export function estimatedOffset(clock: OutputClock, now?: () => number): EstimatedOffset {
  const offset = clockOffset(clock, now);
  const bound = offset.paired ? OUTPUT.paired : OUTPUT.unpaired;
  let jumps = 0;
  return {
    update() {
      const before = offset.heardOffset();
      offset.update();
      const after = offset.heardOffset();
      if (before !== null && after !== null && Math.abs(after - before) > OUTPUT.slew + ROUNDING)
        jumps++;
    },
    heardOffset: offset.heardOffset,
    heard: offset.heard,
    toDeviceMs: offset.toDeviceMs,
    fromDeviceMs: offset.fromDeviceMs,
    paired: offset.paired,
    get estimate() {
      const trusted = offset.heardOffset();
      return { offset: trusted, bound: trusted === null ? null : bound, jumps };
    },
  };
}
