/**
 * Who is in a session: its clients, by the id each plays under, and how one
 * that lost its link comes back as itself.
 *
 * A client's id is the one its lobby gave its first link (`Member.id`), and
 * the Muse knows its motifs by it. A link that drops and comes back is a new
 * link with a new lobby id, so a client comes back by a token the host
 * issued in its welcome: a join that carries it takes the old id up again,
 * under a name that is free. A token opens its own player's seat only: a
 * name held by another is refused as ever. Where the host admits by a code
 * (#461), a join with another code is refused; one without a code is seated
 * to listen (`listens`), what it plays reaching no Muse; one whose token
 * opens a seat comes back as it was, so a player the host seated before
 * plays on without the code. While too many wrong codes were tried
 * (`WRONG_CODES`), every code is refused. A player away is kept for
 * `RESUME_WINDOW` seconds, then forgotten; one that leaves is forgotten at
 * once. Pure: the host gives the token, its name and the time.
 */

import { CODE_LOCKED, type ClientMessage, refusal } from './protocol.ts';

/** How long, in seconds, a player whose link dropped may come back as itself. */
export const RESUME_WINDOW = 300;

export interface Member {
  /** The id the player goes by in the session's Muse. */
  readonly id: string;
  readonly name: string;
  /** What the player shows to come back as itself. */
  readonly token: string;
  /** The lobby's id of its link now, or null while it is away. */
  readonly link: string | null;
  /** When, in seconds, its link dropped, or null while it is joined. */
  readonly awaySince: number | null;
  /** Seated without the code of a session by code (#461): it listens, and what it plays reaches no Muse. */
  readonly listens?: true;
}

export type Roster = readonly Member[];

export type Admission =
  { readonly roster: Roster; readonly member: Member } | { readonly refusal: string };

/** The players whose link is up. */
export const present = (roster: Roster): Roster => roster.filter((m) => m.link !== null);

/** The player on a link, if any. */
export const memberAt = (roster: Roster, link: string): Member | undefined =>
  roster.find((m) => m.link === link);

/**
 * Admit a join that came on `link`, or say why not. `token` is minted for a
 * player that is new; `hostName` is the host's own player's name, which is
 * taken; `code` is the code the host admits by, or null for an open session;
 * `locked`, that too many wrong codes were tried (`WRONG_CODES`).
 */
export function admit(
  roster: Roster,
  join: ClientMessage & { kind: 'join' },
  link: string,
  token: string,
  hostName: string,
  code: string | null = null,
  locked = false,
): Admission {
  const resumed =
    join.resume === undefined ? undefined : roster.find((m) => m.token === join.resume);
  const given = join.code?.trim() ?? '';
  if (code !== null && !resumed && given !== '' && locked) return { refusal: CODE_LOCKED };
  const others = roster.filter((m) => m !== resumed && m.link !== null && m.link !== link);
  const refused = refusal(join, [hostName, ...others.map((m) => m.name)], resumed ? null : code);
  if (refused) return { refusal: refused };
  const name = join.name.trim();
  if (resumed) {
    // A listener that comes back with the code plays; a seat from before the code plays on.
    const listens = resumed.listens === true && code !== null && given !== code;
    const { id, token: seatToken } = resumed;
    const member: Member = {
      id,
      name,
      token: seatToken,
      link,
      awaySince: null,
      ...(listens ? { listens: true } : {}),
    };
    return { roster: roster.map((m) => (m === resumed ? member : m)), member };
  }
  const kept = roster.filter((m) => m.link !== link);
  let id = link;
  while (kept.some((m) => m.id === id)) id += "'";
  const listens = code !== null && given === '';
  const member: Member = {
    id,
    name,
    token,
    link,
    awaySince: null,
    ...(listens ? { listens: true } : {}),
  };
  return { roster: [...kept, member], member };
}

/** The player on `link` has lost it: away from `now`, seat kept. */
export const lose = (roster: Roster, link: string, now: number): Roster =>
  roster.map((m) => (m.link === link ? { ...m, link: null, awaySince: now } : m));

/** The player on `link` leaves: no seat to come back to. */
export const leave = (roster: Roster, link: string): Roster =>
  roster.filter((m) => m.link !== link);

/** The roster without the players away for `RESUME_WINDOW` seconds by `now`. */
export const expire = (roster: Roster, now: number): Roster =>
  roster.filter((m) => m.awaySince === null || now - m.awaySince < RESUME_WINDOW);
