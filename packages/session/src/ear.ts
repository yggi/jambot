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
 * and a drum note for a bar passed on already is dropped. So is what a
 * player plays as a bass (#423): a source whose every note of a bar lies in
 * the bass's register (at or below `BASS_RANGE`'s top) has that bar passed
 * on too, as the part `bass`, for the host's Muse to file the line under the
 * player's name, as she files a bass her own players play. And so is what a
 * player plays on the bass part itself (#569, `bass`), whatever its register,
 * in the same message as the bar's low notes.
 */

import type { BarJudgement, HeardNote, Key } from '@jambot/engine';
import {
  BASS_RANGE,
  SONG_CLOCK,
  type SongClock,
  barOfIn,
  judgeBar,
  NO_HANDS,
  type Hands,
  handsAfter,
  keptAfter,
} from '@jambot/engine';
import { PLAYED_MOST, type PlayedBar } from './protocol.ts';

/** How many steps after a bar ends it is judged: a beat. */
export const EAR_AFTER = 4;

export interface EarCarried {
  /** Notes heard in bars not judged yet. */
  readonly pending: readonly HeardNote[];
  /** Each source's hand, as the phrases it closed have shown it (#580, rung 6): what its next phrase is read under. */
  readonly hands: Hands;
  /** Drum notes heard in bars not passed on yet. */
  readonly drums: readonly HeardNote[];
  /** Notes played on the bass part (#569), in bars not passed on yet. */
  readonly bass: readonly HeardNote[];
  /** The next bar to judge, or null before the first note. */
  readonly next: number | null;
}

export const EAR: EarCarried = { pending: [], hands: NO_HANDS, drums: [], bass: [], next: null };

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
  bass: readonly HeardNote[] = [],
): { carried: EarCarried; judged: BarJudgement[]; played: PlayedBar[] } {
  let { next } = carried;
  let pending = [...carried.pending, ...arrived];
  let { hands } = carried;
  let struck = [...carried.drums, ...drums];
  let bassed = [...carried.bass, ...bass];
  if (next !== null) struck = struck.filter((n) => barOfIn(n, clock) >= next!);
  if (next !== null) bassed = bassed.filter((n) => barOfIn(n, clock) >= next!);
  if (next === null && pending.length + struck.length + bassed.length > 0)
    next = Math.min(...[...pending, ...struck, ...bassed].map((n) => barOfIn(n, clock)));
  const judged: BarJudgement[] = [];
  const played: PlayedBar[] = [];
  if (next === null)
    return { carried: { pending, hands, drums: struck, bass: bassed, next }, judged, played };
  for (; clock.barStart(next + 1) + EAR_AFTER <= heard; next++) {
    const key = keyOf(next);
    if (key)
      for (const judgement of judgeBar(pending, next, key, 'phrases', clock, hands))
        judged.push({ bar: next, judgement });
    const bar = next;
    // (a bass: the bar's low notes, and what was played on the bass part, in the order they were played)
    const low = [
      ...bassOf(pending.filter((n) => barOfIn(n, clock) === bar)),
      ...bassed.filter((n) => barOfIn(n, clock) === bar),
    ].toSorted((x, y) => x.position - y.position);
    if (low.length > 0) played.push({ part: 'bass', bar, notes: low.slice(0, PLAYED_MOST) });
    bassed = bassed.filter((n) => barOfIn(n, clock) > bar);
    hands = handsAfter(hands, pending, next, clock);
    pending = keptAfter(pending, next, clock);
    const notes = struck
      .filter((n) => barOfIn(n, clock) === bar)
      .toSorted((x, y) => x.position - y.position)
      .slice(0, PLAYED_MOST);
    if (notes.length > 0) played.push({ part: 'drums', bar, notes });
    struck = struck.filter((n) => barOfIn(n, clock) > bar);
  }
  return { carried: { pending, hands, drums: struck, bass: bassed, next }, judged, played };
}

/** The notes of a bar each source played wholly in the bass's register, in the order they were played. */
function bassOf(notes: readonly HeardNote[]): HeardNote[] {
  const above = new Set(notes.filter((n) => n.note > BASS_RANGE[1]).map((n) => n.source));
  return notes.filter((n) => !above.has(n.source)).toSorted((x, y) => x.position - y.position);
}
