/**
 * What a host and a client keep on their device to come back after the
 * page went away: a reload, or a phone closing a PWA in the background.
 *
 * Only what can't be made again is kept. The band composes from its seed
 * and position, and the Muse starts afresh with each song (`Player#begin`),
 * so a host keeps the session's name and the secret that takes it back
 * from the lobby, who is in it and how they come back (`roster.ts`), the
 * players' names, the style, the key wish and the tempo nudge the
 * conductor had set, the meter asked for and its swing, and the lobby it opened in. A client keeps the session,
 * its name, its token and the lobby it joined through. A record older than `SAVED_MAX_AGE` is
 * forgotten: a session that long gone has moved on.
 *
 * Reading checks the record's fields and their types, not the engine
 * values (the style track and the key wish) inside: those are the app's
 * own, written by the same build, and a version bump retires a shape that
 * changes. The meter is checked as a meter (its pulses rising from the
 * downbeat within the bar), since a bar's length is built from it, or is
 * null, none asked for, where the composer asks the repository (#375); a
 * record saved before it was kept has none, and asks for the song's. The swing is
 * checked as a level and a share's glide; a record saved before the meter
 * held it (#360) has none, and plays straight. The radio's station (#313) is
 * checked as a seed and a count, and a record without one has the radio off.
 * The code a host admits by (#461) is kept, so a reload doesn't open the
 * session, and a record without one is open. Pure: the app stores and fetches, and gives the time, in
 * seconds since the epoch.
 */

import { type KeyWish, type StyleTrack, type SwingTrack, SWING_LEVELS } from '@jambot/engine';
import type { Meter } from '@jambot/theory';
import type { Member } from './roster.ts';
import { type Station, readStation } from './station.ts';

/** How long, in seconds, a saved record is good for. */
export const SAVED_MAX_AGE = 300;

const VERSION = 1;

/** A player of the roster as kept: without a link, which a new page doesn't have. */
export type SavedMember = Pick<Member, 'id' | 'name' | 'token' | 'listens'>;

export interface HostSnapshot {
  readonly version: 1;
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
  /**
   * The meter asked for, which the band takes at a section's start; null
   * where none is, and the composer asks the repository (#375); absent in a
   * record saved before it was kept.
   */
  readonly meter?: Meter | null;
  /** The meter's swing asked for (#360); absent in a record saved before the meter held it. */
  readonly swing?: SwingTrack;
  /** The radio's station, if it was on the air (#313); absent in a record saved before it, or with it off. */
  readonly station?: Station;
  /** The code the host admits its clients by (#461), or null for an open session; absent in a record saved before codes, open. */
  readonly code?: string | null;
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

/** Whether a value is a meter: a bar of whole eighths, its pulses rising from the downbeat at 0 within it. */
const isMeter = (v: unknown): v is Meter =>
  isRecord(v) &&
  Number.isInteger(v.cycle) &&
  (v.cycle as number) > 0 &&
  Array.isArray(v.heights) &&
  v.heights[0] === 0 &&
  v.heights.every(
    (h, i, all) =>
      Number.isInteger(h) && h < (v.cycle as number) && (i === 0 || h > (all[i - 1] as number)),
  );

/** Whether a value is a swing track: a level, and a glide of finite numbers. */
const isSwing = (v: unknown): v is SwingTrack =>
  isRecord(v) &&
  (SWING_LEVELS as readonly unknown[]).includes(v.level) &&
  isRecord(v.share) &&
  ['from', 'to', 'start', 'length', 'slope', 'brake'].every((k) =>
    Number.isFinite((v.share as Record<string, unknown>)[k]),
  );

/** Whether a record saved at `savedAt` is still good at `now`. */
const fresh = (savedAt: unknown, now: number): boolean =>
  typeof savedAt === 'number' &&
  Number.isFinite(savedAt) &&
  savedAt <= now &&
  now - savedAt <= SAVED_MAX_AGE;

/** A host's snapshot, or null for anything that isn't a good one at `now`. */
export function readHostSnapshot(data: unknown, now: number): HostSnapshot | null {
  if (!isRecord(data) || data.version !== VERSION || !fresh(data.savedAt, now)) return null;
  const {
    session,
    lobby,
    reclaim,
    player,
    roster,
    players,
    track,
    wish,
    tempoNudge,
    meter,
    swing,
    station,
    code,
  } = data;
  if (!isText(session) || typeof lobby !== 'string' || typeof player !== 'string') return null;
  if (reclaim !== null && typeof reclaim !== 'string') return null;
  if (typeof tempoNudge !== 'number' || !Number.isFinite(tempoNudge)) return null;
  if (!isRecord(track) || !isRecord(wish)) return null;
  if (meter !== undefined && meter !== null && !isMeter(meter)) return null;
  if (swing !== undefined && !isSwing(swing)) return null;
  if (station !== undefined && readStation(station) === null) return null;
  if (code !== undefined && code !== null && !isText(code)) return null;
  if (!isRecord(players) || !Object.values(players).every((n) => typeof n === 'string'))
    return null;
  if (
    !Array.isArray(roster) ||
    !roster.every(
      (m) =>
        isRecord(m) &&
        isText(m.id) &&
        typeof m.name === 'string' &&
        isText(m.token) &&
        (m.listens === undefined || m.listens === true),
    )
  )
    return null;
  return data as unknown as HostSnapshot;
}

/** A client's record, or null for anything that isn't a good one at `now`. */
export function readClientResume(data: unknown, now: number): ClientResume | null {
  if (!isRecord(data) || data.version !== VERSION || !fresh(data.savedAt, now)) return null;
  const { session, name, token, lobby } = data;
  if (!isText(session) || !isText(name) || !isText(token) || typeof lobby !== 'string') return null;
  return data as unknown as ClientResume;
}
