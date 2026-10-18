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
 *
 * What its players play on drums is passed on as it was heard, a bar at a
 * time and at the same moment (`played`, #410): the host's Muse reads a
 * bar's hits onto its steps and files a groove a player plays over a
 * section under the player's name (#401), as she does her own players'. A
 * bar is passed on whether or not it is judged, since drums need no key,
 * and a drum note for a bar passed on already is dropped.
 */

import type { BarJudgement, HeardNote, Key } from '@jambot/engine';
import { SONG_CLOCK, type SongClock, barOfIn, judgeBar, keptAfter } from '@jambot/engine';
import { PLAYED_MOST, type PlayedBar } from './protocol.ts';

/** How many steps after a bar ends it is judged: a beat. */
export const EAR_AFTER = 4;

export interface EarCarried {
  /** Notes heard in bars not judged yet. */
  readonly pending: readonly HeardNote[];
  /** Drum notes heard in bars not passed on yet. */
  readonly drums: readonly HeardNote[];
  /** The next bar to judge, or null before the first note. */
  readonly next: number | null;
}

export const EAR: EarCarried = { pending: [], drums: [], next: null };

/**
 * The ear after notes arrived (`arrived`, and on drums `drums`) and the
 * moment heard moved to `heard`, a position on the grid: every bar that
 * ended a beat before it judged, each in its key, if the client knows it,
 * and its drum notes passed on, the earliest `PLAYED_MOST`.
 */
export function earListen(
  carried: EarCarried,
  arrived: readonly HeardNote[],
  heard: number,
  keyOf: (bar: number) => Key | undefined,
  clock: SongClock = SONG_CLOCK,
  drums: readonly HeardNote[] = [],
): { carried: EarCarried; judged: BarJudgement[]; played: PlayedBar[] } {
  let { next } = carried;
  let pending = [...carried.pending, ...arrived];
  let struck = [...carried.drums, ...drums];
  if (next !== null) struck = struck.filter((n) => barOfIn(n, clock) >= next!);
  if (next === null && pending.length + struck.length > 0)
    next = Math.min(...[...pending, ...struck].map((n) => barOfIn(n, clock)));
  const judged: BarJudgement[] = [];
  const played: PlayedBar[] = [];
  if (next === null) return { carried: { pending, drums: struck, next }, judged, played };
  for (; clock.barStart(next + 1) + EAR_AFTER <= heard; next++) {
    const key = keyOf(next);
    if (key)
      for (const judgement of judgeBar(pending, next, key, 'phrases', clock))
        judged.push({ bar: next, judgement });
    pending = keptAfter(pending, next, clock);
    const bar = next;
    const notes = struck
      .filter((n) => barOfIn(n, clock) === bar)
      .toSorted((x, y) => x.position - y.position)
      .slice(0, PLAYED_MOST);
    if (notes.length > 0) played.push({ part: 'drums', bar, notes });
    struck = struck.filter((n) => barOfIn(n, clock) > bar);
  }
  return { carried: { pending, drums: struck, next }, judged, played };
}
