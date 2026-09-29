/**
 * What a host and a client keep on their device to come back after the
 * page went away: a reload, or a phone closing a PWA in the background.
 *
 * Only what can't be made again is kept. The band composes from its seed
 * and position, and the Muse starts afresh with each song (`Player#begin`),
 * so a host keeps the session's name and the secret that takes it back
 * from the lobby, who is in it and how they come back (`roster.ts`), the
 * players' names, and the style, the key wish and the tempo nudge the
 * conductor had set, and the lobby it opened in. A client keeps the session,
 * its name, its token and the lobby it joined through. A record older than `SAVED_MAX_AGE` is
 * forgotten: a session that long gone has moved on.
 *
 * Reading checks the record's fields and their types, not the engine
 * values (the style track and the key wish) inside: those are the app's
 * own, written by the same build, and a version bump retires a shape that
 * changes. Pure: the app stores and fetches, and gives the time, in
 * seconds since the epoch.
 */

import type { KeyWish, StyleTrack } from '@jambot/engine';
import type { Member } from './roster.ts';

/** How long, in seconds, a saved record is good for. */
export const SAVED_MAX_AGE = 300;

/** The host's record's shape: 2 since the key wish names a melodic scale (#209). */
const HOST_VERSION = 2;

/** The client's record's shape. */
const CLIENT_VERSION = 1;

/** A player of the roster as kept: without a link, which a new page doesn't have. */
export type SavedMember = Pick<Member, 'id' | 'name' | 'token'>;

export interface HostSnapshot {
  readonly version: 2;
  readonly savedAt: number;
  readonly session: string;
  /** The address of the lobby it opened in, or an empty one for the tabs of the browser. */
  readonly lobby: string;
  /** What takes the session back from a lobby that kept it, or null where none was given. */
  readonly reclaim: string | null;
  /** The host's own player's name. */
  readonly player: string;
  readonly roster: readonly SavedMember[];
  /** Each player's name by id, kept after they leave. */
  readonly players: Readonly<Record<string, string>>;
  readonly track: StyleTrack;
  readonly wish: KeyWish;
  readonly tempoNudge: number;
}

export interface ClientResume {
  readonly version: 1;
  readonly savedAt: number;
  readonly session: string;
  readonly name: string;
  readonly token: string;
  /** The address of the lobby it joined through, or an empty one for the tabs of the browser. */
  readonly lobby: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** Whether a record saved at `savedAt` is still good at `now`. */
const fresh = (savedAt: unknown, now: number): boolean =>
  typeof savedAt === 'number' &&
  Number.isFinite(savedAt) &&
  savedAt <= now &&
  now - savedAt <= SAVED_MAX_AGE;

/** A host's snapshot, or null for anything that isn't a good one at `now`. */
export function readHostSnapshot(data: unknown, now: number): HostSnapshot | null {
  if (!isRecord(data) || data.version !== HOST_VERSION || !fresh(data.savedAt, now)) return null;
  const { session, lobby, reclaim, player, roster, players, track, wish, tempoNudge } = data;
  if (!isText(session) || typeof lobby !== 'string' || typeof player !== 'string') return null;
  if (reclaim !== null && typeof reclaim !== 'string') return null;
  if (typeof tempoNudge !== 'number' || !Number.isFinite(tempoNudge)) return null;
  if (!isRecord(track) || !isRecord(wish)) return null;
  if (!isRecord(players) || !Object.values(players).every((n) => typeof n === 'string'))
    return null;
  if (
    !Array.isArray(roster) ||
    !roster.every(
      (m) => isRecord(m) && isText(m.id) && typeof m.name === 'string' && isText(m.token),
    )
  )
    return null;
  return data as unknown as HostSnapshot;
}

/** A client's record, or null for anything that isn't a good one at `now`. */
export function readClientResume(data: unknown, now: number): ClientResume | null {
  if (!isRecord(data) || data.version !== CLIENT_VERSION || !fresh(data.savedAt, now)) return null;
  const { session, name, token, lobby } = data;
  if (!isText(session) || !isText(name) || !isText(token) || typeof lobby !== 'string') return null;
  return data as unknown as ClientResume;
}
