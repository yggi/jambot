/**
 * What a host says to its clients in version 2 of the session contract
 * (yggi/music-commons `contracts/session`, minor 1: protocol 31), as a client
 * reads it: read here, written by the app's host and played by its client
 * behind one switch (`host-v2.ts`, `follow-v2.ts`, `SESSION_SPEAKS` in the
 * app: #553's rungs 2 and 3), and spoken once the protocol moves to it at
 * rung 4; Jambot speaks version 1, `PROTOCOL`.
 *
 * Version 2 sends a section's **score** (`score`) in place of its text
 * (`section`), and each bar's **conduct** (`conduct`) in place of the bar
 * the host composed (`bar`): each client plays the score on its own band,
 * which never travels, so a score's lock never names `band`, and a reader
 * refuses one that does (yggi/cells decision 063). Its welcome carries the
 * conducts and scores not yet played, the fragments a score in force locks
 * that the client may lack, and the default band the host plays, which a
 * client may show and never plays. Version 1's `bar` and `section` are
 * kinds this reader doesn't know, dropped as any is.
 *
 * The other kinds a host sends are version 1's as they are
 * (`KEPT_HOST_FIELDS`), with what version 1's minors 6 to 9 added, which
 * version 2's minor 1 takes up. A client's messages are version 1's at
 * minor 9 too (`readClientMessage`), and a lobby's, which reads no version
 * (`lobby.ts`).
 */

import type { Offer, SectionType } from '@jambot/engine';
import { SECTION_TYPES } from '@jambot/engine';
import {
  type FieldChecks,
  each,
  isEvent,
  isForecast,
  isMuse,
  isObject,
  isSong,
  isString,
  orNull,
  readByKind,
} from './fields.ts';
import {
  type HostMessage,
  KEPT_HOST_FIELDS,
  type KeptHostKind,
  type MuseState,
  type SessionEvent,
  type SessionVersion,
  type Song,
  readHostMessage,
} from './protocol.ts';
import type { ForecastDelta } from './forecast.ts';

/** The protocol a peer of version 2, minor 1, carries in its join or welcome: the minor that takes up version 1's minors 6 to 9. */
export const PROTOCOL_V2 = 31;

/** The first protocol of version 2 (the owner's ruling of 2026-11-06): version 1 keeps 13 to 29 for its minors. */
export const FIRST_PROTOCOL_V2 = 30;

/** Version 2 of the session contract, read and not yet spoken: what a host or client of it admits by (`sameMajor`, `admit`). */
export const SESSION_V2: SessionVersion = {
  protocol: PROTOCOL_V2,
  firstProtocol: FIRST_PROTOCOL_V2,
};

/** A fragment named by its id and hash: a score's lock's entry, and a welcome's default band. */
export interface FragmentRef {
  readonly id: string;
  readonly hash: string;
}

/** A fragment's cells text by its id and hash: one a score in force locks that a client may lack. */
export interface FragmentText extends FragmentRef {
  readonly text: string;
}

/**
 * A bar's conduct: what a client needs beside the score to play the bar as
 * the host does. A host sends it a beat before the bar.
 */
export interface BarConduct {
  /** The bar, counted from the song's start. */
  readonly bar: number;
  /** Where it starts on the host's clock, or null for a bar the host's head passed without laying, in a stall. */
  readonly start: number | null;
  /** The seed its draws are keyed by. */
  readonly seed: number;
  /** The entropy the homeostat leaned to for the bar, from 0 to 1. */
  readonly entropy: number;
  /** The Muse's offer, or null for none. */
  readonly offer: Offer | null;
  /** The bar's digest: a client plays the score's bar only where it is the one the score foresaw. */
  readonly foreseen: string;
}

/**
 * A section's score: the cells text that states its bars, ending in a
 * `* from band` line, bare or passed the score's lines. A host sends it four
 * bars and a beat before the section plays, and again a beat before a bar
 * composed otherwise than foreseen.
 */
export interface SectionScore {
  /** The first bar it states, and that bar's first step on the song's clock. */
  readonly bar: number;
  readonly step: number;
  /** The section's type. */
  readonly section: SectionType;
  /** The score, or empty where none states the bars (`unstated` says why). */
  readonly text: string;
  /** Why no score states the bars (a key or meter moving between them), or null where one does. */
  readonly unstated: string | null;
  /** Every fragment the text takes `from`, never `band`. */
  readonly lock: readonly FragmentRef[];
  readonly fragments: readonly FragmentText[];
  /** Each bar's energy, from `bar` on. */
  readonly energy: readonly number[];
  /** A digest of what each bar, from `bar` on, was built from (`BarConduct.foreseen`). */
  readonly foreseen: readonly string[];
  /** The bars, by their place from `bar`, a note was cut in. */
  readonly cut: readonly number[];
}

export type HostMessageV2 =
  | Extract<HostMessage, { readonly kind: KeptHostKind | 'away' | 'back' }>
  | {
      readonly kind: 'welcome';
      readonly protocol: number;
      readonly session: string;
      /** The token to join again with (`roster.ts`). */
      readonly resume: string;
      /** The song playing, with the conducts sent and not yet played and the scores that state a bar not yet played, or null while stopped. */
      readonly song:
        | (Song & {
            readonly conducts: readonly BarConduct[];
            readonly scores: readonly SectionScore[];
          })
        | null;
      readonly forecast: ForecastDelta;
      readonly muse: MuseState;
      /** The texts a score in force locks that the client may lack. */
      readonly fragments: readonly FragmentText[];
      /** The default band the host plays, which a client may show and never plays, or null for none. */
      readonly band: FragmentRef | null;
      /** Present where this client was seated without the code of a host by code: it listens. */
      readonly listening?: true;
      /** The session's log, its tail as the host keeps it. */
      readonly events?: readonly SessionEvent[];
    }
  | ({ readonly kind: 'conduct' } & BarConduct)
  | ({ readonly kind: 'score' } & SectionScore);

/** What a host of either version says: version 1's messages, or version 2's (a host speaks one, `HOST_SPEAKS` in the app). */
export type HostSaid = HostMessage | HostMessageV2;

const SECTION_NAMES: ReadonlySet<unknown> = new Set(SECTION_TYPES);

const isRef = (r: unknown): boolean => isObject(r) && isString(r.id) && isString(r.hash);
/** A fragment's text by its id and hash, each a string. */
export const isFragmentText = (f: unknown): boolean =>
  isRef(f) && isString((f as FragmentRef & { text: unknown }).text);
/** A lock's entry: a fragment by its id and hash, never the band, which never travels. */
const isLocked = (r: unknown): boolean => isRef(r) && (r as FragmentRef).id !== 'band';

const isConduct = (c: unknown): boolean =>
  isObject(c) &&
  Number.isInteger(c.bar) &&
  orNull(c.start, Number.isFinite) &&
  Number.isInteger(c.seed) &&
  Number.isFinite(c.entropy) &&
  (c.entropy as number) >= 0 &&
  (c.entropy as number) <= 1 &&
  orNull(c.offer, isObject) &&
  isString(c.foreseen);

const isScore = (s: unknown): boolean =>
  isObject(s) &&
  Number.isInteger(s.bar) &&
  Number.isInteger(s.step) &&
  SECTION_NAMES.has(s.section) &&
  isString(s.text) &&
  orNull(s.unstated, isString) &&
  each(s.lock, isLocked) &&
  each(s.fragments, isFragmentText) &&
  each(s.energy, Number.isFinite) &&
  each(s.foreseen, isString) &&
  each(s.cut, Number.isInteger);

/** A welcome's song: a song with its conducts and its scores, both always there in version 2. */
const isPlayingV2 = (s: unknown): boolean =>
  isSong(s) && each(s.conducts, isConduct) && each(s.scores, isScore);

/**
 * Each kind a host of version 2 sends, and whether a message of it carries
 * that kind's fields, of their types (`contracts/session`'s table of host
 * messages). What a track, a swing, a meter, a conduct's offer or a
 * forecast's bar holds is not the reader's to fix.
 */
const HOST_FIELDS_V2: FieldChecks = {
  ...KEPT_HOST_FIELDS,
  welcome: (m) =>
    Number.isInteger(m.protocol) &&
    isString(m.session) &&
    isString(m.resume) &&
    (m.listening === undefined || m.listening === true) &&
    (m.events === undefined || each(m.events, isEvent)) &&
    orNull(m.song, isPlayingV2) &&
    isForecast(m.forecast) &&
    isMuse(m.muse) &&
    each(m.fragments, isFragmentText) &&
    orNull(m.band, isRef),
  conduct: isConduct,
  score: isScore,
};

/**
 * A message from a host of version 2, or null for anything that isn't one:
 * its kind, and the fields that kind carries, of their types, as version
 * 1's `readHostMessage` reads a host of version 1. A kind it doesn't know,
 * version 1's `bar` and `section` among them, is dropped as one malformed
 * is, the link kept.
 */
export function readHostMessageV2(data: unknown): HostMessageV2 | null {
  return readByKind<HostMessageV2>(HOST_FIELDS_V2, data);
}

/** The major version of the session contract a protocol is of: version 2 from `FIRST_PROTOCOL_V2` on, version 1 below. */
export const versionOf = (protocol: number): 1 | 2 => (protocol >= FIRST_PROTOCOL_V2 ? 2 : 1);

/**
 * A message from a host of either version, or null for one of neither: what a lobby hands a client, which reads it
 * again by the version its host's welcome says (`versionOf`).
 */
export function readHostSaid(data: unknown): HostSaid | null {
  return readHostMessage(data) ?? readHostMessageV2(data);
}
