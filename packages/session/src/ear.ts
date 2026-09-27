/**
 * A client's ear: it judges what its players played, bar by bar, and sends
 * the judgements to the host.
 *
 * The Muse filters on both sides. Here a player's bar is judged as a host
 * would judge it (`judgeBar`): mashing, too few and too wide stay here, and
 * only the judgement travels. The host's Muse takes one motif of all it
 * hears, its own players' and every client's.
 *
 * A bar is judged a beat after it ends (`EAR_AFTER`), once a note played a
 * little late has been placed in it. The host hears bar k as it composes
 * bar k + 2, on the last beat of bar k + 1, so a judgement has about half a
 * bar to arrive. A bar the client never played, such as one it lacked, is
 * not judged: it has no key to judge it in.
 */

import type { BarJudgement, HeardNote, Key } from '@jambot/engine';
import { barOf, barStart, judgeBar } from '@jambot/engine';

/** How many steps after a bar ends it is judged: a beat. */
export const EAR_AFTER = 4;

export interface EarCarried {
  /** Notes heard in bars not judged yet. */
  readonly pending: readonly HeardNote[];
  /** The next bar to judge, or null before the first note. */
  readonly next: number | null;
}

export const EAR: EarCarried = { pending: [], next: null };

/**
 * The ear after notes arrived and the moment heard moved to `heard`, a
 * position on the grid: every bar that ended a beat before it judged, each
 * in its key, if the client knows it.
 */
export function earListen(
  { pending, next }: EarCarried,
  arrived: readonly HeardNote[],
  heard: number,
  keyOf: (bar: number) => Key | undefined,
): { carried: EarCarried; judged: BarJudgement[] } {
  pending = [...pending, ...arrived];
  if (next === null && pending.length > 0) next = Math.min(...pending.map(barOf));
  const judged: BarJudgement[] = [];
  if (next === null) return { carried: { pending, next }, judged };
  for (; barStart(next + 1) + EAR_AFTER <= heard; next++) {
    const key = keyOf(next);
    if (key)
      for (const judgement of judgeBar(pending, next, key)) judged.push({ bar: next, judgement });
    const done = next;
    pending = pending.filter((n) => barOf(n) > done);
  }
  return { carried: { pending, next }, judged };
}
