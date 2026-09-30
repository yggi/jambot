/**
 * What a host sends of the bars it composes.
 *
 * A bar goes as it was written, without a performer's fill (#107): the
 * dough notes it plays as, which the client makes itself (`playBar`). With
 * it goes where it starts on the host's clock: the host's head is short of
 * the bar when the band composes it, so the bar starts where the tempo
 * map, laid from the head, puts it. A control moved in the beat that is
 * left moves the host's bar too, and the next bar sent says so.
 */

import {
  type Anchor,
  type BandBar,
  type ScheduledStep,
  type StyleTrack,
  barStart,
  tempoMap,
} from '@jambot/engine';
import type { SentBar, WrittenBar } from './protocol.ts';

/** A bar as the band played it, as it was written. */
export function writtenBar(played: BandBar): WrittenBar {
  const { dough, meter, ...bar } = played;
  void dough;
  void meter;
  return bar;
}

/**
 * The bars composed on a tick, as sent: each with where it starts, from the
 * steps laid on the tick if one of them is its first, and otherwise from
 * the head through the tempo map. A bar whose start the head passed
 * without laying it, in a stall, goes without one.
 */
export function sentBars(
  composed: readonly BandBar[],
  steps: readonly ScheduledStep[],
  head: Anchor,
  track: StyleTrack,
): SentBar[] {
  return composed.map((b) => {
    const first = barStart(b.bar);
    const laid = steps.find((s) => s.step === first);
    const start = laid
      ? laid.seconds
      : head.step <= first
        ? tempoMap(track, head).played(first)
        : null;
    return { bar: writtenBar(b), start };
  });
}
