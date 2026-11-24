/**
 * What a host and its clients say to each other: version 2 of the family's
 * session contract (yggi/music-commons `contracts/session`, #553), the one
 * version Jambot speaks.
 *
 * A host composes; a client plays the section's **score** it sends
 * (`score`, cells text) on its own band, which never travels, bar by bar as
 * each bar's **conduct** (`conduct`) says, and sends back what its players
 * played, judged, and each bar it didn't play (`lacked`). Everything here is
 * plain data, so any link carries it: a BroadcastChannel as it is, a
 * WebSocket as JSON. Every join names the protocol, and a host refuses a
 * client below version 2's first protocol, since a cached app can be older
 * than its host; any minor of version 2 it admits (`sameMajor`, #460).
 *
 * Times are on the host's clock, in seconds: the song's start, and where
 * each bar starts. A client maps them onto its own clock (`clock.ts`).
 */

import {
  type DroppedJudgement,
  type HeardNote,
  type Judgement,
  type MuseOutput,
  NUDGED,
  type Nudged,
  type Offer,
  PARTS,
  type Part,
  type Remembered,
  SECTION_TYPES,
  type SectionType,
  type StyleTrack,
  type SwingTrack,
} from '@jambot/engine';
import type { Meter } from '@jambot/theory';
import {
  type FieldChecks,
  each,
  isEvent,
  isForecast,
  isMuse,
  isObject,
  isSong,
  isString,
  kindOf,
  orNull,
  readByKind,
} from './fields.ts';
import type { ForecastDelta } from './forecast.ts';

/**
 * The protocol a peer carries in its join or welcome: version 2 of the
 * session contract at minor 3. Version 2 takes protocols 30 on
 * (`FIRST_PROTOCOL`, the owner's ruling of 2026-11-06), and each is a minor
 * of it: 30 is minor 0, which sends a section's score and each bar's
 * conduct; 31 minor 1, which has a player nudge the key and the meter
 * (`nudge`), a host tell every line of the session's log (`event`, and a
 * welcome's `events`), a judgement carry its `origin` (#580 rung 3) and a
 * style its `mood` (cells' style axis, decision 076); 32 minor 2, which has
 * a client tell its host each bar it didn't play (`lacked`,
 * yggi/music-commons#74); and 33 minor 3, which lets a score's section be a
 * kind of a song form, `verse`, `chorus` or `outro` (#655,
 * yggi/music-commons#76). A host admits a join of any of them, and a client
 * stays with a host of any (`sameMajor`), each ignoring a kind it doesn't
 * know, so a minor that adds a kind deploys without every client in lockstep.
 *
 * The engine's `Judgement`, the Muse's log (`MuseOutput`, with what she
 * recognised), her memory (`Remembered`) and her `Offer` (on a conduct)
 * travel as they are, so a change to their shape is a change to the
 * protocol, and bumps it (`protocol.test.ts` holds the shapes). So does a
 * change to what they mean.
 */
export const PROTOCOL = 33;

/**
 * What a client may be seated as (docs/briefs/session-roles.md): a
 * player's ear reaches the host's Muse, a listener's reaches nothing. The
 * host is no seat: it sets everything. A co-host joins them with the
 * brief's step 5, when it has something of its own to do.
 */
export const ROLES = ['player', 'listener'] as const;
export type Role = (typeof ROLES)[number];

/** The first protocol of version 2 of the session contract (#460, #553): every protocol from it on is one of its minors. */
export const FIRST_PROTOCOL = 30;

/** Whether a protocol is a minor of version 2: an integer from its first protocol on (#460). */
export const sameMajor = (protocol: unknown): boolean =>
  Number.isInteger(protocol) && (protocol as number) >= FIRST_PROTOCOL;

/**
 * A line of the session's log (docs/briefs/session-roles.md step 3):
 * human-readable, like a chat, the players' and the band's own voices in
 * one place. The host keeps the log and says each line to every
 * client; a welcome carries its tail.
 */
export interface SessionEvent {
  /** The bar it is about, or null while the band is stopped. */
  readonly bar: number | null;
  /** Who says it: a player's id, as the Muse's players name it, or one of the band's voices. */
  readonly who: string;
  /** What kind of line: joined, left, nudged, moved, composed, inspired and more, kept whatever it says. */
  readonly what: string;
  /** The line, for people. */
  readonly text: string;
}

/** The band's own voices in the log, which no player's id is: a lobby gives `c0`, `c1`, …, and the host plays as `host`. */
export const BAND_VOICES = ['conductor', 'composer', 'muse'] as const;

/**
 * What a client's players played on one part in one bar, as its ear heard
 * the notes (`earListen`): a bar a message, passed on as the bar is judged,
 * a beat after it ends. A note is a `HeardNote`, which any part's notes are,
 * so a pitched part travels as drums do; a host hears drums and the bass
 * (`heardFrom`, #423), and the note's source is the client's instrument,
 * which the host names by the player it seated.
 */
export interface PlayedBar {
  readonly part: Part;
  readonly bar: number;
  readonly notes: readonly HeardNote[];
}

/**
 * The most notes a played bar carries: a 4/4 bar's 16 steps with 4 sounds
 * struck on every one, more than the kit's grooves strike, so a hand never
 * meets it and a message stays under 6 KB, about 85 bytes a note as JSON. A client
 * passes on the earliest, and a host reads no message with more.
 */
export const PLAYED_MOST = 64;

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
  /** The meter whose beats the track's bpm counts (#367), which travels with it. */
  readonly tempoMeter: Meter;
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
      /**
       * Present where the host admits by a code and this client was seated
       * without it (#461): it listens, and what it plays reaches no Muse
       * (`CODE_LISTENS`).
       */
      readonly listening?: true;
      /** The session's log, its tail as the host keeps it. */
      readonly events?: readonly SessionEvent[];
    }
  | { readonly kind: 'refused'; readonly reason: string }
  | { readonly kind: 'start'; readonly song: Song }
  /**
   * The style, the meter's swing as the host's conductor moved them, and the
   * meter whose beats the style's bpm counts (#367): one message, so a client
   * lays every step as the host does.
   */
  | {
      readonly kind: 'track';
      readonly track: StyleTrack;
      readonly swing: SwingTrack;
      readonly tempoMeter: Meter;
    }
  /** A bar's conduct, a beat before the bar. */
  | ({ readonly kind: 'conduct' } & BarConduct)
  /** A section's score, with the fragments it locks that this client lacks. */
  | ({ readonly kind: 'score' } & SectionScore)
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
   * The role the host now seats this client as (#567): sent to it alone,
   * when the host changes it, never with a welcome, whose `listening` says it.
   */
  | { readonly kind: 'role'; readonly role: Role }
  /** A line of the session's log, as the host says it to every client. */
  | ({ readonly kind: 'event' } & SessionEvent)
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
      /**
       * The code the host admits its clients by, where it asks for one (#461):
       * a person reads it off the host's Session card, and it travels only here.
       */
      readonly code?: string;
    }
  /** A bar the client's players played in, judged. */
  | { readonly kind: 'judged'; readonly bar: number; readonly judgement: Judgement }
  /** What the client's players played on a part in a bar, as heard (#410). */
  | ({ readonly kind: 'played' } & PlayedBar)
  | { readonly kind: 'forget' }
  /**
   * A player leans a style axis or the tempo a step up or down (step 2 of
   * docs/briefs/session-roles.md): an event, not a total, and a bias, not a
   * request, which the host answers by the style its track carries.
   */
  | { readonly kind: 'nudge'; readonly target: Nudged; readonly by: 1 | -1 }
  /** A ping, stamped with the client's page clock as it was sent, in seconds. */
  | { readonly kind: 'ping'; readonly sent: number }
  /**
   * A bar the client didn't play, and why (minor 2, protocol 32 on, yggi/music-commons#74): one a bar, which a host
   * counts by client (`countLacked`).
   */
  | {
      readonly kind: 'lacked';
      readonly bar: number;
      readonly why: LackedWhy;
      readonly text: string;
    }
  | { readonly kind: 'leave' }
  /** Said by a lobby, never by a client: its link dropped without a `leave`. */
  | { readonly kind: 'lost' };

/**
 * Why a client didn't play a bar, as the session contract's `lacked` names it (minor 2): no score stated it
 * (`silent`), its conduct's digest is not the one its score foresaw (`digest`), its score locks a fragment the client
 * lacks (`lock`), or the client came to it too late to play it (`late`).
 */
export const LACKED_WHYS = ['silent', 'digest', 'lock', 'late'] as const;
export type LackedWhy = (typeof LACKED_WHYS)[number];

const CLIENT_KINDS: ReadonlySet<string> = new Set([
  'join',
  'judged',
  'played',
  'forget',
  'nudge',
  'ping',
  'leave',
  'lacked',
]);
const PART_NAMES: ReadonlySet<unknown> = new Set(PARTS);

const isMidi = (value: unknown, least: number): boolean =>
  Number.isInteger(value) && (value as number) >= least && (value as number) <= 127;

/** Whether a value is a note as an ear heard it: a MIDI note and velocity, its source, and where it was heard and released. */
function isHeard(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const n = value as Partial<Record<string, unknown>>;
  return (
    isMidi(n.note, 0) &&
    isMidi(n.velocity, 0) &&
    typeof n.source === 'string' &&
    Number.isFinite(n.position) &&
    (n.end === null || Number.isFinite(n.end))
  );
}

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

/** A welcome's song: a song with its conducts and its scores, both always there. */
const isPlaying = (s: unknown): boolean =>
  isSong(s) && each(s.conducts, isConduct) && each(s.scores, isScore);

/**
 * Each kind a host sends, and whether a message of it carries that kind's
 * fields, of their types (`contracts/session`'s table of host messages).
 * What a track, a swing, a meter, a Muse's log, a conduct's offer or a
 * forecast's bar holds is the shapes' to fix (`protocol.test.ts`), not the
 * reader's.
 */
const HOST_FIELDS: FieldChecks = {
  welcome: (m) =>
    Number.isInteger(m.protocol) &&
    isString(m.session) &&
    isString(m.resume) &&
    (m.listening === undefined || m.listening === true) &&
    (m.events === undefined || each(m.events, isEvent)) &&
    orNull(m.song, isPlaying) &&
    isForecast(m.forecast) &&
    isMuse(m.muse) &&
    each(m.fragments, isFragmentText) &&
    orNull(m.band, isRef),
  refused: (m) => isString(m.reason),
  start: (m) => isSong(m.song),
  track: (m) => isObject(m.track) && isObject(m.swing) && isObject(m.tempoMeter),
  conduct: isConduct,
  forecast: (m) => isForecast(m.forecast),
  muse: (m) => isMuse(m.muse),
  score: isScore,
  stop: () => true,
  finale: (m) => Number.isInteger(m.bar),
  pong: (m) =>
    Number.isFinite(m.sent) && Number.isFinite(m.host) && orNull(m.heard, Number.isFinite),
  closed: () => true,
  role: (m) => (ROLES as readonly unknown[]).includes(m.role),
  event: isEvent,
};

/**
 * A message from a host, or null for anything that isn't one: its kind, and
 * the fields that kind carries, of their types, as a host reads a client's
 * (`readClientMessage`). A client checks them though it chose the host it
 * joined: one not built from this code can't take a field's type on trust
 * (the contract's ruling), and a message it can't read, or of a kind it
 * doesn't know, is dropped here, the link kept, rather than thrown on while
 * its band plays. A lobby's `away` and `back` are no host's, and read as none.
 */
export function readHostMessage(data: unknown): HostMessage | null {
  return readByKind<HostMessage>(HOST_FIELDS, data);
}

/** How many bars a client told its host it didn't play (`lacked`), by why. */
export type LackedCount = Readonly<Record<LackedWhy, number>>;

/** No bar lacked, for any reason. */
export const NO_LACKED: LackedCount = { silent: 0, digest: 0, lock: 0, late: 0 };

/** The bars each client lacked, by its seat's id: what a host counts and its Session card shows. */
export type LackedBy = Readonly<Record<string, LackedCount>>;

/** The counts with one more bar a client lacked, for why. */
export function countLacked(counts: LackedBy, id: string, why: LackedWhy): LackedBy {
  const was = counts[id] ?? NO_LACKED;
  return { ...counts, [id]: { ...was, [why]: was[why] + 1 } };
}

/** The bars lacked over every client, by why and in all (`bars`): what a soak's bound reads (#553). */
export function lackedIn(counts: LackedBy): LackedCount & { readonly bars: number } {
  const sum = (why: LackedWhy) => Object.values(counts).reduce((n, c) => n + c[why], 0);
  const by = Object.fromEntries(LACKED_WHYS.map((why) => [why, sum(why)])) as Record<
    LackedWhy,
    number
  >;
  return { ...by, bars: LACKED_WHYS.reduce((n, why) => n + by[why], 0) };
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
      ? Number.isInteger(m.protocol) &&
        typeof m.name === 'string' &&
        (m.resume === undefined || typeof m.resume === 'string') &&
        (m.code === undefined || typeof m.code === 'string')
      : kind === 'judged'
        ? Number.isInteger(m.bar) &&
          typeof judgement === 'object' &&
          judgement !== null &&
          typeof judgement.kind === 'string' &&
          typeof judgement.source === 'string'
        : kind === 'played'
          ? PART_NAMES.has(m.part) &&
            Number.isInteger(m.bar) &&
            Array.isArray(m.notes) &&
            m.notes.length <= PLAYED_MOST &&
            m.notes.every(isHeard)
          : kind === 'ping'
            ? Number.isFinite(m.sent)
            : kind === 'nudge'
              ? (NUDGED as readonly unknown[]).includes(m.target) && (m.by === 1 || m.by === -1)
              : kind === 'lacked'
                ? Number.isInteger(m.bar) &&
                  (LACKED_WHYS as readonly unknown[]).includes(m.why) &&
                  typeof m.text === 'string'
                : true;
  return fits ? (data as ClientMessage) : null;
}

/**
 * How many digits a host's code has (#461): a million codes, typed on a
 * phone's number pad. The code keeps out a person who finds the session in
 * the lobby's list, not a script: the lobby takes 50 messages a second from
 * a socket (`LOBBY.rate`), so one socket trying every code takes 20,000 s,
 * some 5.6 hours, and the 31 sockets a session has room for beside one
 * player (`LOBBY.maxClients`) some 11 minutes, each half that on average;
 * a host draws another code whenever it likes.
 */
export const CODE_DIGITS = 6;

/**
 * What a client seated without the code of a session by code is told (#461,
 * the owner's ruling on yggi/music-commons#22: a name is enough to listen, a
 * code comes before a client contributes): it listens, and what it plays,
 * judges or forgets reaches no Muse.
 */
export const CODE_LISTENS =
  'This session admits players by a code: without it you listen. Ask the host for it to play.';

/** Why a host that admits by a code refuses a join with another (#461). */
export const CODE_WRONG = "That is not this session's code: ask the host for it.";

/**
 * How many wrong codes a host takes across its session in a window of
 * seconds before it refuses every code for the rest of that window (#461):
 * five a minute keeps a script to some 7,200 codes a day, a million taking
 * months, at the cost that a stranger trying codes can hold a player's code
 * off for a minute. A join without a code, which listens, is never held off.
 */
export const WRONG_CODES = { count: 5, seconds: 60 } as const;

/** Why a host refuses a code while too many wrong ones were tried (`WRONG_CODES`, #461). */
export const CODE_LOCKED =
  'Too many wrong codes were tried in this session: wait a minute, then try again.';

/** The times of wrong codes still inside the window at `now`. */
export const wrongCodesWithin = (times: readonly number[], now: number): number[] =>
  times.filter((t) => now - t < WRONG_CODES.seconds);

/** The largest count of 32-bit words that holds every code equally often: the last whole million of 2^32. */
const CODE_WORDS = Math.floor(2 ** 32 / 10 ** CODE_DIGITS) * 10 ** CODE_DIGITS;

/**
 * A code drawn from `word`, a source of random 32-bit unsigned words (the
 * app's is the browser's `crypto`, as a resume token is): `CODE_DIGITS`
 * digits, a word past the last whole million drawn again, so every code is
 * as likely as another.
 */
export function codeOf(word: () => number): string {
  let w = word();
  while (w >= CODE_WORDS) w = word();
  return String(w % 10 ** CODE_DIGITS).padStart(CODE_DIGITS, '0');
}

/**
 * Why a host refuses a join, or null to admit it: a protocol below version
 * 2's first (any minor of version 2 is admitted, `sameMajor`, #460), a wrong
 * code where the host admits by one (`code`, #461, looked at before the
 * name, so a join refused for it learns nothing of who is in the session; a
 * join without a code is admitted, to listen, `admit`),
 * no name, or a name a player in the session already goes by (`inUse`), in
 * any case. A code is compared trimmed, as a phone's keyboard may pad it.
 */
export function refusal(
  join: ClientMessage & { kind: 'join' },
  inUse: readonly string[] = [],
  code: string | null = null,
): string | null {
  if (!sameMajor(join.protocol))
    return `This host speaks version 2 of the session protocol, protocol ${FIRST_PROTOCOL} on, and this app protocol ${join.protocol}: reload it.`;
  if (code !== null) {
    const given = join.code?.trim() ?? '';
    if (given !== '' && given !== code) return CODE_WRONG;
  }
  const name = join.name.trim();
  if (name === '') return 'A player needs a name to join.';
  if (inUse.some((n) => n.trim().toLowerCase() === name.toLowerCase()))
    return `A player named ${name} is already in this session. Pick another name.`;
  return null;
}

/**
 * What a host's Muse hears of a played bar on one part, the drums unless
 * another is named: its notes, each named by the player who played them, as
 * the host's own player's are, so a groove (#401) or a bass line (#423) is
 * filed under the name; nothing where the bar is another part's. A note
 * outside the bar is the transport's to drop, as its own player's are.
 */
export function heardFrom(
  played: PlayedBar,
  name: string,
  part: Extract<Part, 'drums' | 'bass'> = 'drums',
): HeardNote[] {
  return played.part === part ? played.notes.map((n) => ({ ...n, source: name })) : [];
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
