/**
 * The session's log (docs/briefs/session-roles.md step 3, session contract
 * minor 7): what a host keeps of it, and the tail a welcome carries.
 *
 * It is human-readable and like a chat: the players' lines (who joined and
 * left, who nudged what) and the band's own voices' (the conductor's moves,
 * the composer's sections, the Muse's inspirations) in one list, oldest
 * first. The host words each line (`apps/web/src/session/log-lines.ts`),
 * keeps the last `LOG_KEPT`, says each to every client (`event`), and gives
 * a client that joins the last `LOG_TAIL` (`welcome`'s `events`). A client
 * keeps the same. Pure.
 */

import type { SessionEvent } from './protocol.ts';

/** How many lines a host or a client keeps: the oldest go first. */
export const LOG_KEPT = 200;

/** How many lines a welcome carries, the newest: about 4 KB as JSON at 80 bytes a line. */
export const LOG_TAIL = 50;

/** The log with `line` said, the oldest let go past `LOG_KEPT`. */
export const said = (log: readonly SessionEvent[], line: SessionEvent): SessionEvent[] =>
  [...log, line].slice(-LOG_KEPT);

/** The tail of the log a welcome carries. */
export const tailOf = (log: readonly SessionEvent[]): SessionEvent[] => log.slice(-LOG_TAIL);
