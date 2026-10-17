/**
 * What a host and its clients say to each other.
 *
 * A host composes; a client plays what it composed, with its own band, and
 * sends back what its players played, judged. Everything here is plain
 * data, so any link carries it: a BroadcastChannel as it is, a WebSocket
 * as JSON. Every join names the protocol's version, and a host refuses a
 * client of another version, since a cached app can be older than its
 * host.
 *
 * Times are on the host's clock, in seconds: the song's start, and where
 * each bar starts. A client maps them onto its own clock (`clock.ts`).
 */

import type {
  BarEnv,
  DroppedJudgement,
  Judgement,
  MuseOutput,
  Offer,
  Remembered,
  StyleTrack,
  SwingTrack,
  WrittenNote,
} from '@jambot/engine';
import type { ForecastDelta } from './forecast.ts';

/**
 * The protocol's version: a host and a client of different versions refuse
 * each other. The engine's `Motif`, `Judgement`, `BarEnv` (with its `Offer`),
 * `WrittenNote`, the Muse's log (`MuseOutput`, with what she recognised)
 * and her memory (`Remembered`)
 * travel as they are, so a change to their shape is a change to the
 * protocol, and bumps it (`protocol.test.ts` holds the shapes).
 */
export const PROTOCOL = 9;

/**
 * A bar as a host wrote it: everything its parts read, and the notes they
 * wrote. Its meter travels in its plan (`plan.meter`, #261): the section's,
 * which the client gives back to the bar (`follow.ts`), so a bar holds it once.
 */
export interface WrittenBar extends Omit<BarEnv, 'meter'> {
  readonly written: readonly WrittenNote[];
}

/** A bar a host sent, and where it starts on the host's clock, if the host laid it. */
export interface SentBar {
  readonly bar: WrittenBar;
  readonly start: number | null;
}

/** A song a host is playing: what a client needs to lay its steps. */
export interface Song {
  readonly seed: number;
  /**
   * The host's clock time step 0 starts at. A host tells it a bar ahead, as
   * its count-in starts, so a client has that bar to get ready in: to have
   * its clocks paired and the first bars arrive.
   */
  readonly start: number;
  readonly track: StyleTrack;
  /** The meter's swing (#360): the level asked for and the share's glide, which the client lays its beats by. */
  readonly swing: SwingTrack;
}

/**
 * What the Muse offers, its latest judgements, the bars judged on clients
 * it dropped, and each player's name by id, to read their sources by; and
 * the motifs she remembers, weighed as of the last bar she read (`memoryAt`
 * fades them to a later one), with the last bar anyone played in.
 */
export interface MuseState {
  readonly offer: Offer | null;
  readonly memory: readonly Remembered[];
  /** The bar `memory` is weighed at, or null before she has read one. */
  readonly asOf: number | null;
  /** The last bar anyone played in, or null before anyone has. */
  readonly lastPlayed: number | null;
  readonly log: readonly MuseOutput[];
  readonly dropped: readonly DroppedJudgement[];
  readonly players: Readonly<Record<string, string>>;
}

export type HostMessage =
  | {
      readonly kind: 'welcome';
      readonly protocol: number;
      readonly session: string;
      /**
       * What the player shows to come back as itself after its link drops
       * (`roster.ts`): sent again in the join that follows.
       */
      readonly resume: string;
      /** The song playing, with the bars composed and not yet played, or null while stopped. */
      readonly song: (Song & { readonly bars: readonly SentBar[] }) | null;
      readonly forecast: ForecastDelta;
      readonly muse: MuseState;
    }
  | { readonly kind: 'refused'; readonly reason: string }
  | { readonly kind: 'start'; readonly song: Song }
  /** The style and the meter's swing, as the host's conductor moved them. */
  | { readonly kind: 'track'; readonly track: StyleTrack; readonly swing: SwingTrack }
  | { readonly kind: 'bar'; readonly sent: SentBar }
  | { readonly kind: 'forecast'; readonly forecast: ForecastDelta }
  | { readonly kind: 'muse'; readonly muse: MuseState }
  | { readonly kind: 'stop' }
  /**
   * The song ends on this bar, its last: the host composed a finale and
   * plays through it, and a client does the same, then stops as the host's
   * band does, with its last chord left to ring.
   */
  | { readonly kind: 'finale'; readonly bar: number }
  /**
   * The answer to a ping: the host's page clock as it answered, in seconds,
   * and its output's offset from it, the moment heard less the page clock,
   * or null before its output is paired. A client that composes the two
   * with its own (`skewOf`) sounds with the host, whatever each output's
   * latency, and follows a buffer either output drops.
   */
  | {
      readonly kind: 'pong';
      readonly sent: number;
      readonly host: number;
      readonly heard: number | null;
    }
  | { readonly kind: 'closed' }
  /**
   * Said by a lobby, never by a host: the host's link dropped, and the
   * session waits for it to come back (`away`), or it has (`back`), when a
   * client joins again with its token.
   */
  | { readonly kind: 'away' }
  | { readonly kind: 'back' };

export type ClientMessage =
  | {
      readonly kind: 'join';
      readonly protocol: number;
      readonly name: string;
      /** The token a host's welcome gave, to come back as the same player. */
      readonly resume?: string;
    }
  /** A bar the client's players played in, judged. */
  | { readonly kind: 'judged'; readonly bar: number; readonly judgement: Judgement }
  | { readonly kind: 'forget' }
  /** A ping, stamped with the client's page clock as it was sent, in seconds. */
  | { readonly kind: 'ping'; readonly sent: number }
  | { readonly kind: 'leave' }
  /** Said by a lobby, never by a client: its link dropped without a `leave`. */
  | { readonly kind: 'lost' };

const HOST_KINDS: ReadonlySet<string> = new Set([
  'welcome',
  'refused',
  'start',
  'track',
  'bar',
  'forecast',
  'muse',
  'stop',
  'finale',
  'pong',
  'closed',
]);
const CLIENT_KINDS: ReadonlySet<string> = new Set(['join', 'judged', 'forget', 'ping', 'leave']);

const kindOf = (data: unknown): string | null =>
  typeof data === 'object' && data !== null && typeof (data as { kind?: unknown }).kind === 'string'
    ? (data as { kind: string }).kind
    : null;

/**
 * A message from a host, or null for anything that isn't one. It checks the
 * kind only: a client trusts the host it chose to join, whose version it
 * matched, where a host reads what any client sends (`readClientMessage`).
 */
export function readHostMessage(data: unknown): HostMessage | null {
  const kind = kindOf(data);
  return kind !== null && HOST_KINDS.has(kind) ? (data as HostMessage) : null;
}

/**
 * A message from a client, or null for anything that isn't one: its kind,
 * and the fields that kind carries, of their types. A host reads what any
 * client sends, and a message it can't read is dropped here rather than
 * thrown on while the band plays. What a judgement says is checked by the
 * host's Muse, which knows the bar's key (`admissible`).
 */
export function readClientMessage(data: unknown): ClientMessage | null {
  const kind = kindOf(data);
  if (kind === null || !CLIENT_KINDS.has(kind)) return null;
  const m = data as Partial<Record<string, unknown>>;
  const judgement = m.judgement as Partial<Record<string, unknown>> | null | undefined;
  const fits =
    kind === 'join'
      ? typeof m.protocol === 'number' &&
        typeof m.name === 'string' &&
        (m.resume === undefined || typeof m.resume === 'string')
      : kind === 'judged'
        ? Number.isInteger(m.bar) &&
          typeof judgement === 'object' &&
          judgement !== null &&
          typeof judgement.kind === 'string' &&
          typeof judgement.source === 'string'
        : kind === 'ping'
          ? Number.isFinite(m.sent)
          : true;
  return fits ? (data as ClientMessage) : null;
}

/**
 * Why a host refuses a join, or null to admit it: another version, no
 * name, or a name a player in the session already goes by (`inUse`), in
 * any case.
 */
export function refusal(
  join: ClientMessage & { kind: 'join' },
  inUse: readonly string[] = [],
): string | null {
  if (join.protocol !== PROTOCOL)
    return `This host speaks version ${PROTOCOL} of the session protocol, and this app ${join.protocol}: reload both.`;
  const name = join.name.trim();
  if (name === '') return 'A player needs a name to join.';
  if (inUse.some((n) => n.trim().toLowerCase() === name.toLowerCase()))
    return `A player named ${name} is already in this session. Pick another name.`;
  return null;
}

/** The id the host's own player goes by in its session; a client goes by the id its link has. */
export const HOST_PLAYER = 'host';

/**
 * A note source in a session: a player's id and the instrument. The Muse
 * tells players apart by it, never by a name: a name is for people to
 * read, and a client's id is the one the lobby gave its link, which the
 * client doesn't choose. Outside a session a source is the bare instrument.
 */
export function playerSource(player: string, instrument: string): string {
  return `@${player}/${instrument}`;
}

/** The player's id in a source, or null for a source outside a session. */
export function playerOf(source: string): string | null {
  return /^@([^/]+)\//.exec(source)?.[1] ?? null;
}

/**
 * A source as people read it: the player's name before the instrument,
 * "Ada's computer keys", from each player's name by id; the bare
 * instrument outside a session.
 */
export function sourceName(source: string, players: Readonly<Record<string, string>>): string {
  const found = /^@([^/]+)\/(.*)$/s.exec(source);
  if (!found) return source;
  const [, player, instrument] = found;
  return `${players[player!] ?? 'someone'}'s ${instrument!.replace(/^the /, '')}`;
}
