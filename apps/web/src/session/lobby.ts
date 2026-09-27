/**
 * Where sessions are found, and how a host and its clients reach each
 * other. A lobby opens a session under a name, or joins one, and gives a
 * link: the host's to all its clients, or a client's to its host.
 *
 * Everything above a link is the same whatever carries it. This app has
 * one, `broadcastLobby`, between the tabs and windows of one browser; a
 * WebSocket lobby on a server, and WebRTC links it sets up, come next
 * (`docs/briefs/host-mode.md`).
 */

import type { ClientMessage, HostMessage } from '@jambot/session';

/** A host's end: to one client by its id, or to every client. */
export interface HostLink {
  send(message: HostMessage, to?: string): void;
  close(): void;
}

/** A client's end: to its host. */
export interface ClientLink {
  send(message: ClientMessage): void;
  close(): void;
}

export interface Lobby {
  /**
   * Open a session under a name, hearing each client's messages with its
   * id. Refused if the name is taken.
   */
  host(session: string, hear: (message: ClientMessage, from: string) => void): Promise<HostLink>;
  /** Reach the session under a name, hearing its host's messages. */
  join(session: string, hear: (message: HostMessage) => void): Promise<ClientLink>;
}

/** A session's name as a lobby compares it: trimmed, and in any case. */
export const sessionKey = (session: string) => session.trim().toLowerCase();
