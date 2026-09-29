/**
 * What an app and a lobby server say to each other over a WebSocket.
 *
 * The lobby finds sessions by name and relays between a host and its
 * clients. It carries the session's own messages (`protocol.ts`) without
 * reading them: a host's to one client or to all, a client's to its host.
 * What it says itself is only what a relay knows: that a name is taken or
 * open, that a client joined or left, that a host is gone.
 *
 * A host whose link drops has `LOBBY.hostGrace` seconds to take its session
 * back by the secret it was given, so a page that reloads doesn't end the
 * session for everyone in it.
 *
 * Each WebSocket plays one part: it lists the open sessions, or it hosts
 * one, or it joins one.
 */

import type { ClientMessage, HostMessage } from './protocol.ts';

/** The longest session name a lobby takes. */
export const SESSION_NAME_MAX = 40;

/** A session's name as a lobby compares it: trimmed, and in any case. */
export const sessionKey = (session: string) => session.trim().toLowerCase();

/** Why a lobby refuses a session name, or null to take it. */
export function nameRefusal(session: string): string | null {
  const name = session.trim();
  if (name === '') return 'A session needs a name.';
  if (name.length > SESSION_NAME_MAX)
    return `A session's name is ${SESSION_NAME_MAX} characters at most.`;
  return null;
}

export type ToLobby =
  | { readonly op: 'list' }
  /**
   * Open a session, or take back one whose host's link dropped, by the
   * secret its `hosting` answer gave (`reclaim`).
   */
  | { readonly op: 'host'; readonly session: string; readonly reclaim?: string }
  | { readonly op: 'join'; readonly session: string }
  /** From a host: to one client by its id, or to every client. */
  | { readonly op: 'send'; readonly to?: string; readonly message: HostMessage }
  /** From a client: to its host. */
  | { readonly op: 'tell'; readonly message: ClientMessage }
  /** From a host: the session is over, its name free at once, its clients told. */
  | { readonly op: 'end' };

export type FromLobby =
  | { readonly op: 'sessions'; readonly names: readonly string[] }
  /** To a host: its session is open, and this secret takes it back if its link drops. */
  | { readonly op: 'hosting'; readonly session: string; readonly reclaim: string }
  | { readonly op: 'joined'; readonly session: string }
  | { readonly op: 'refused'; readonly reason: string }
  /** To a host: a client's message, with its id. */
  | { readonly op: 'heard'; readonly from: string; readonly message: ClientMessage }
  /** To a host: a client's link closed. */
  | { readonly op: 'left'; readonly from: string }
  /** To a client: its host's message. */
  | { readonly op: 'said'; readonly message: HostMessage }
  /** To a client: its host's link closed for good. */
  | { readonly op: 'gone' }
  /** To a client: its host's link dropped, and the lobby holds the session for a while. */
  | { readonly op: 'away' }
  /** To a client: its host took the session back. */
  | { readonly op: 'back' };

const TO_LOBBY: ReadonlySet<string> = new Set(['list', 'host', 'join', 'send', 'tell', 'end']);
const FROM_LOBBY: ReadonlySet<string> = new Set([
  'sessions',
  'hosting',
  'joined',
  'refused',
  'heard',
  'left',
  'said',
  'gone',
  'away',
  'back',
]);

const opOf = (data: unknown): string | null =>
  typeof data === 'object' && data !== null && typeof (data as { op?: unknown }).op === 'string'
    ? (data as { op: string }).op
    : null;

/** A request to a lobby, or null for anything that isn't one. */
export function readToLobby(data: unknown): ToLobby | null {
  const op = opOf(data);
  if (op === null || !TO_LOBBY.has(op)) return null;
  const d = data as Record<string, unknown>;
  if ((op === 'host' || op === 'join') && typeof d.session !== 'string') return null;
  if ((op === 'send' || op === 'tell') && (typeof d.message !== 'object' || d.message === null))
    return null;
  if (op === 'host' && d.reclaim !== undefined && typeof d.reclaim !== 'string') return null;
  if (op === 'send' && d.to !== undefined && typeof d.to !== 'string') return null;
  return data as ToLobby;
}

/** What a lobby said, or null for anything that isn't. */
export function readFromLobby(data: unknown): FromLobby | null {
  const op = opOf(data);
  return op !== null && FROM_LOBBY.has(op) ? (data as FromLobby) : null;
}
