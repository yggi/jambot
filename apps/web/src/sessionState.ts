/**
 * What the session card says: the session's name, its state in a few words,
 * and the colours of the players in its network glyph. Read from the same
 * props the card takes, apart from the component, so a test can hold each
 * wording and each colour.
 */

import { SOURCE_COLOURS } from './attribution.ts';
import type { Mode } from './player.svelte.ts';
import type { ClientStatus } from './session/client.svelte.ts';
import type { Guest } from './session/host.svelte.ts';

export interface Hosting {
  readonly session: string | null;
  readonly guests: readonly Guest[];
}

export interface Following {
  readonly status: ClientStatus;
  readonly session: string | null;
  readonly name: string | null;
  readonly hostPlaying: boolean;
  readonly hostAway: boolean;
  readonly trip: number | null;
  readonly lacked: number;
}

/** The session by name: the one hosted or followed, or "Solo". */
export function sessionMain(mode: Mode, hosting: Hosting, following: Following): string {
  if (mode === 'host') return hosting.session ?? 'A session';
  if (mode === 'client') return following.session ?? 'A session';
  return 'Solo';
}

/** What the transport is between: the count-in before a song, or the last bar before it halts. */
export type Phase = 'counting' | 'ending';

/**
 * Its state in a few words: who has joined, or what the link and the host
 * are doing, and while a song begins or ends, that.
 */
export function sessionSub(
  mode: Mode,
  hosting: Hosting,
  following: Following,
  phase: Phase | null = null,
): string {
  const doing = phase === 'counting' ? 'counting in' : 'ending';
  if (mode === 'solo') return phase ? `Solo · ${doing}` : 'This device only';
  if (mode === 'host') {
    if (phase) return `Hosting · ${doing}`;
    const n = hosting.guests.length;
    return n === 0 ? 'Hosting · nobody has joined' : `Hosting · ${n} joined`;
  }
  if (following.status === 'reconnecting') return 'Reconnecting · playing on what it has';
  if (following.status !== 'joined') return 'Joining';
  if (following.hostAway) return 'Following · host away';
  if (phase) return `Following · host ${doing}`;
  return following.hostPlaying ? 'Following · host playing' : 'Following · host stopped';
}

/**
 * The colour of each node of the network, from 0: the first is the middle
 * one, the host (or the lone player), then those round it. A player's colour
 * is its place in the session's record of players (`sourceColour`); one not
 * in the record yet takes the next place along.
 */
export function networkColours(
  mode: Mode,
  hosting: Hosting,
  players: Readonly<Record<string, string>>,
  playerId: string | null,
): number[] {
  if (mode === 'solo') return [0];
  const places = Object.keys(players);
  const colour = (id: string | null, next: number) => {
    const place = id === null ? -1 : places.indexOf(id);
    return (place >= 0 ? place : next) % SOURCE_COLOURS;
  };
  if (mode === 'host') return [0, ...hosting.guests.map((guest, i) => colour(guest.id, i + 1))];
  return [0, colour(playerId, 1)];
}
