/**
 * What a host makes of the bars it composes, before any of it goes on the
 * wire: each bar as it was written, with where it starts on its clock
 * (`SentBar`), which a bar's conduct is made from (`conductOf` in
 * `host-v2.ts`).
 *
 * A bar is kept as it was written, without a performer's fill (#107): the
 * dough notes it plays as. With it goes where it starts on the host's clock:
 * the host's head is short of the bar when the band composes it, so the bar
 * starts where the tempo map, laid from the head, puts it. A control moved in
 * the beat that is left moves the host's bar too, and the next bar's start
 * says so.
 *
 * No message carries a bar: the session contract Jambot speaks, version 2,
 * sends each bar's conduct and each section's score (`protocol.ts`), and a
 * client plays the scores on the clock the conducts give (`follow-v2.ts`).
 * The contract's own vectors carry a bar in this shape, as the one its
 * conduct vector is made from (`host-v2.test.ts`).
 */

import {
  type Anchor,
  type BandBar,
  type BarEnv,
  type ScheduledStep,
  type StyleTrack,
  SONG_CLOCK,
  SONG_METER,
  type SongClock,
  type WrittenNote,
  tempoMap,
} from '@jambot/engine';
import type { Meter } from '@jambot/theory';

/**
 * A bar as a host wrote it: everything its parts read, and the notes they
 * wrote. Its meter is in its plan (`plan.meter`, #261): the section's, so a
 * bar holds it once.
 */
export interface WrittenBar extends Omit<BarEnv, 'meter'> {
  readonly written: readonly WrittenNote[];
}

/** A bar a host composed, and where it starts on the host's clock, if the host laid it. */
export interface SentBar {
  readonly bar: WrittenBar;
  readonly start: number | null;
}

/** A bar as the band played it, as it was written. */
export function writtenBar(played: BandBar): WrittenBar {
  // (the fragments a section took are its score's, never a bar's, #731)
  const { dough, meter, derivedFrom, ...bar } = played;
  void dough;
  void meter;
  void derivedFrom;
  return bar;
}

/**
 * The bars composed on a tick, each with where it starts, from the steps
 * laid on the tick if one of them is its first, and otherwise from the head
 * through the tempo map, its bpm counting the beats of `tempoMeter`. A bar
 * whose start the head passed without laying it, in a stall, has none.
 */
export function sentBars(
  composed: readonly BandBar[],
  steps: readonly ScheduledStep[],
  head: Anchor,
  track: StyleTrack,
  clock: SongClock = SONG_CLOCK,
  tempoMeter: Meter = SONG_METER,
): SentBar[] {
  return composed.map((b) => {
    const first = clock.barStart(b.bar);
    const laid = steps.find((s) => s.step === first);
    const start = laid
      ? laid.seconds
      : head.step <= first
        ? tempoMap(track, head, tempoMeter).played(first)
        : null;
    return { bar: writtenBar(b), start };
  });
}
