/**
 * Where sessions are found, and how a host and its clients reach each
 * other. A lobby opens a session under a name, or joins one, and gives a
 * link: the host's to all its clients, or a client's to its host.
 *
 * Everything above a link is the same whatever carries it:
 * `broadcastLobby` between the tabs and windows of one browser, and
 * `websocketLobby` through a lobby server, on a laptop at the event or
 * hosted. WebRTC links the server sets up come next
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

/** Told why a link was lost, other than by closing it: the lobby went away. */
export type Lost = (why: string) => void;

export interface Lobby {
  /** The names of the sessions open now. */
  sessions(): Promise<string[]>;
  /**
   * Open a session under a name, hearing each client's messages with its
   * id. Refused if the name is taken. A client whose link closes is heard
   * leaving.
   */
  host(
    session: string,
    hear: (message: ClientMessage, from: string) => void,
    lost?: Lost,
  ): Promise<HostLink>;
  /**
   * Reach the session under a name, hearing its host's messages. It may be
   * refused at once, where the lobby knows no such session. A host whose
   * link closes is heard closing.
   */
  join(session: string, hear: (message: HostMessage) => void, lost?: Lost): Promise<ClientLink>;
}

export { sessionKey } from '@jambot/session';
