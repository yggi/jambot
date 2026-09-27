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

import type { BarEnv, Judgement, MuseOutput, Offer, StyleTrack, WrittenNote } from '@jambot/engine';
import type { ForecastDelta } from './forecast.ts';

/** The protocol's version: a host and a client of different versions refuse each other. */
export const PROTOCOL = 1;

/** A bar as a host wrote it: everything its parts read, and the notes they wrote. */
export interface WrittenBar extends BarEnv {
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
  /** The host's clock time step 0 starts at. */
  readonly start: number;
  readonly track: StyleTrack;
}

/** What the Muse offers, and its latest judgements. */
export interface MuseState {
  readonly offer: Offer | null;
  readonly log: readonly MuseOutput[];
}

export type HostMessage =
  | {
      readonly kind: 'welcome';
      readonly protocol: number;
      readonly session: string;
      /** The song playing, with the bars composed and not yet played, or null while stopped. */
      readonly song: (Song & { readonly bars: readonly SentBar[] }) | null;
      readonly forecast: ForecastDelta;
      readonly muse: MuseState;
    }
  | { readonly kind: 'refused'; readonly reason: string }
  | { readonly kind: 'start'; readonly song: Song }
  | { readonly kind: 'track'; readonly track: StyleTrack }
  | { readonly kind: 'bar'; readonly sent: SentBar }
  | { readonly kind: 'forecast'; readonly forecast: ForecastDelta }
  | { readonly kind: 'muse'; readonly muse: MuseState }
  | { readonly kind: 'stop' }
  /**
   * The answer to a ping: the moment the host's output was heard as it
   * answered, on its clock. A client that sets its clock by what is heard
   * on both sides sounds with the host, whatever each output's latency.
   */
  | { readonly kind: 'pong'; readonly sent: number; readonly host: number }
  | { readonly kind: 'closed' };

export type ClientMessage =
  | { readonly kind: 'join'; readonly protocol: number; readonly name: string }
  /** A bar the client's players played in, judged. */
  | { readonly kind: 'judged'; readonly bar: number; readonly judgement: Judgement }
  | { readonly kind: 'forget' }
  /** A ping, stamped with the client's clock as it was sent. */
  | { readonly kind: 'ping'; readonly sent: number }
  | { readonly kind: 'leave' };

const HOST_KINDS: ReadonlySet<string> = new Set([
  'welcome',
  'refused',
  'start',
  'track',
  'bar',
  'forecast',
  'muse',
  'stop',
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
 * kind only: a session is among people in one room, and a link that
 * crosses the internet checks more.
 */
export function readHostMessage(data: unknown): HostMessage | null {
  const kind = kindOf(data);
  return kind !== null && HOST_KINDS.has(kind) ? (data as HostMessage) : null;
}

/** A message from a client, or null for anything that isn't one. */
export function readClientMessage(data: unknown): ClientMessage | null {
  const kind = kindOf(data);
  return kind !== null && CLIENT_KINDS.has(kind) ? (data as ClientMessage) : null;
}

/** Why a host refuses a join, or null to admit it. */
export function refusal(join: ClientMessage & { kind: 'join' }): string | null {
  if (join.protocol !== PROTOCOL)
    return `This host speaks version ${PROTOCOL} of the session protocol, and this app ${join.protocol}: reload both.`;
  if (join.name.trim() === '') return 'A player needs a name to join.';
  return null;
}

/**
 * A client's note source as the host's Muse names it: the player's name
 * before the instrument, so its log reads "from Ada's computer keys".
 */
export function sourceOf(player: string, source: string): string {
  return `${player}'s ${source.replace(/^the /, '')}`;
}
