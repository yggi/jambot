/**
 * What a host and its clients say to each other.
 *
 * A host composes; a client plays what it composed, with its own band, and
 * sends back what its players played, judged. Everything here is plain
 * data, so any link carries it: a BroadcastChannel as it is, a WebSocket
 * as JSON. Every join names the protocol's version, and a host refuses a
 * client of another major version, since a cached app can be older than
 * its host; any minor of its own it admits (`sameMajor`, #460).
 *
 * Times are on the host's clock, in seconds: the song's start, and where
 * each bar starts. A client maps them onto its own clock (`clock.ts`).
 */

import {
  type BarEnv,
  type DroppedJudgement,
  type HeardNote,
  type Judgement,
  type Key,
  type MeterSwing,
  type MuseOutput,
  type Offer,
  PARTS,
  type Part,
  type Remembered,
  type StyleTrack,
  type SwingTrack,
  type WrittenNote,
} from '@jambot/engine';
import type { Meter } from '@jambot/theory';
import type { ForecastDelta } from './forecast.ts';

/**
 * The protocol's version: a host and a client of different major versions
 * refuse each other (13 on is one, below). The engine's `Motif`, `Judgement`, `BarEnv` (with its `Offer`),
 * `WrittenNote`, the Muse's log (`MuseOutput`, with what she recognised)
 * and her memory (`Remembered`)
 * travel as they are, so a change to their shape is a change to the
 * protocol, and bumps it (`protocol.test.ts` holds the shapes). So does a
 * change to what they mean. Version 10 carries the meter's swing track
 * beside the style (`swing`, #360, #369), and counts the style's bpm in the
 * beats of the meter that travels with it (`tempoMeter`, #367, #373), so a
 * host and a client of different counts would lay a 6/8 bar at different
 * lengths. Version 11 has a section's plan say the meter fragment the
 * composer took from the repository and the share it swings at (`Plan.share`,
 * `Plan.meterFragment`, #375), which a client's transport swings by in place
 * of the swing track's. Version 12 has it say the rhythm fragment the drummer
 * plays the section from and the clave chosen with it (`Plan.rhythmFragment`,
 * `Plan.claveFragment`, #397), and a drum hit may be the clave's
 * (`DrumRole`'s `clave`), which a client's performer accents. Version 13
 * has a client pass on each bar its players played on drums, the notes as
 * its ear heard them (`played`, #410), for the host's Muse to file a groove
 * under the player's name. Version 14 has a host whose band plays through
 * cells send each section's cells text to its clients (`section`, and
 * `texts` in a welcome, #446), which a client's own cells engine plays.
 * Version 15 has a join carry the code a host may admit its clients by
 * (`code`, #461), which a host that asks for one refuses a join without.
 *
 * From 13 on, a protocol is a minor version of the session contract's major
 * version 1 (yggi/music-commons `contracts/session`, the owner's ruling on
 * yggi/music-commons#22, #460): 14 is minor 1, and 15 minor 2. A host admits a join of any
 * of them, and a client stays with a host of any (`sameMajor`), each
 * ignoring a kind it doesn't know, so a minor that adds a kind deploys
 * without every client in lockstep: a client at 13 drops the `section`
 * messages and the welcome's `song.texts` it can't read, and plays the bars.
 */
export const PROTOCOL = 15;

/** The first protocol of the session contract's major version 1 (#460): every protocol from it on is one of its minors. */
export const FIRST_PROTOCOL = 13;

/** Whether a protocol is a minor of this one's major version: an integer from `FIRST_PROTOCOL` on (#460). */
export const sameMajor = (protocol: unknown): boolean =>
  Number.isInteger(protocol) && (protocol as number) >= FIRST_PROTOCOL;

/**
 * A section's cells text, as a host's band through cells states it (#446,
 * cells decision 037: the text holds what is composed): sent to every client
 * as the host takes it from where it was built (`section`), four bars and a
 * beat before the section plays, again at a bar composed otherwise than
 * foreseen (a beat before it plays), and with a welcome, every text that
 * states a bar not yet played (`texts`). A client compiles and plays it with
 * its own cells engine, and its performer plays its feel on each event, as
 * the host's does, so the two play the same events. The text travels, not
 * the events cells plays from it: the score is what is legible all the way
 * down, and it is the smaller, 2.6 to 6.3 KB a section as JSON over the
 * presets' second sections at entropy 0.3, where the events would be 4 to 12
 * times that, 11 to 75 KB (`section-texts.test.ts` in the app measures both).
 */
export interface SectionText {
  /** The first bar the text states, and its first step on the song's clock. */
  readonly bar: number;
  readonly step: number;
  /** The text, or empty where none states the bars (`unstated` says why). */
  readonly text: string;
  /** Why no text states the bars (a section's key or meter moving between them), or null where one does. */
  readonly unstated: string | null;
  /**
   * What cells' reading of the text needs beside it, one for the section,
   * as a text states one meter, swing and key: its first bar's meter, swing,
   * tempo and key (`SectionFrame` in `@jambot/score`).
   */
  readonly frame: {
    readonly meter: Meter;
    readonly swing: MeterSwing;
    readonly bpm: number;
    readonly key: Key;
  };
  /**
   * What each bar, in order from `bar`, was built from, as a digest
   * (`foreseenOf` in the app): a client plays the text in a bar only where
   * the bar the host sends is the one foreseen, as the host does.
   */
  readonly foreseen: readonly string[];
  /** The bars, by their place from `bar`, a note was cut in, which the text doesn't play as the band does. */
  readonly cut: readonly number[];
}

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
      /**
       * The song playing, with the bars composed and not yet played and the
       * section texts that state a bar not yet played (#446), or null while stopped.
       */
      readonly song:
        | (Song & { readonly bars: readonly SentBar[]; readonly texts: readonly SectionText[] })
        | null;
      readonly forecast: ForecastDelta;
      readonly muse: MuseState;
      /**
       * Present where the host admits by a code and this client was seated
       * without it (#461): it listens, and what it plays reaches no Muse
       * (`CODE_LISTENS`).
       */
      readonly listening?: true;
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
  | { readonly kind: 'bar'; readonly sent: SentBar }
  /** A section's cells text, as the host's band through cells states it (#446). */
  | ({ readonly kind: 'section' } & SectionText)
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
  /** A ping, stamped with the client's page clock as it was sent, in seconds. */
  | { readonly kind: 'ping'; readonly sent: number }
  | { readonly kind: 'leave' }
  /** Said by a lobby, never by a client: its link dropped without a `leave`. */
  | { readonly kind: 'lost' };

const CLIENT_KINDS: ReadonlySet<string> = new Set([
  'join',
  'judged',
  'played',
  'forget',
  'ping',
  'leave',
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

const kindOf = (data: unknown): string | null =>
  typeof data === 'object' && data !== null && typeof (data as { kind?: unknown }).kind === 'string'
    ? (data as { kind: string }).kind
    : null;

/** An object, as a message's field is one: neither null nor an array. */
const isObject = (value: unknown): value is Partial<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const orNull = (value: unknown, is: (v: unknown) => boolean): boolean =>
  value === null || is(value);
const each = (value: unknown, is: (v: unknown) => boolean): boolean =>
  Array.isArray(value) && value.every(is);
const isString = (value: unknown): boolean => typeof value === 'string';

const isSong = (s: unknown): s is Partial<Record<string, unknown>> =>
  isObject(s) &&
  Number.isInteger(s.seed) &&
  Number.isFinite(s.start) &&
  isObject(s.track) &&
  isObject(s.swing) &&
  isObject(s.tempoMeter);
const isSent = (s: unknown): boolean =>
  isObject(s) && isObject(s.bar) && orNull(s.start, Number.isFinite);
const isForecast = (f: unknown): boolean =>
  isObject(f) &&
  Number.isInteger(f.from) &&
  Number.isInteger(f.count) &&
  each(f.changed, (b) => isObject(b) && Number.isInteger(b.bar));
const isMuse = (u: unknown): boolean =>
  isObject(u) &&
  orNull(u.offer, isObject) &&
  Array.isArray(u.memory) &&
  orNull(u.asOf, Number.isInteger) &&
  orNull(u.lastPlayed, Number.isInteger) &&
  Array.isArray(u.log) &&
  Array.isArray(u.dropped) &&
  isObject(u.players) &&
  Object.values(u.players).every(isString);
const isText = (t: unknown): boolean =>
  isObject(t) &&
  Number.isInteger(t.bar) &&
  Number.isInteger(t.step) &&
  isString(t.text) &&
  orNull(t.unstated, isString) &&
  isObject(t.frame) &&
  isObject(t.frame.meter) &&
  isObject(t.frame.swing) &&
  Number.isFinite(t.frame.bpm) &&
  isObject(t.frame.key) &&
  each(t.foreseen, isString) &&
  each(t.cut, Number.isInteger);
/** A welcome's song: its bars not yet played, and its texts, absent from a host of 13. */
const isPlaying = (s: unknown): boolean =>
  isSong(s) && each(s.bars, isSent) && (s.texts === undefined || each(s.texts, isText));

/**
 * Each kind a host sends, and whether a message of it carries that kind's
 * fields, of their types (yggi/music-commons `contracts/session`, minor 1).
 * What a track, a swing, a
 * meter or a sent bar holds is the shapes' to fix (`protocol.test.ts`), not
 * the reader's.
 */
const HOST_FIELDS: Readonly<Record<string, (m: Partial<Record<string, unknown>>) => boolean>> = {
  welcome: (m) =>
    Number.isInteger(m.protocol) &&
    isString(m.session) &&
    isString(m.resume) &&
    (m.listening === undefined || m.listening === true) &&
    orNull(m.song, isPlaying) &&
    isForecast(m.forecast) &&
    isMuse(m.muse),
  refused: (m) => isString(m.reason),
  start: (m) => isSong(m.song),
  track: (m) => isObject(m.track) && isObject(m.swing) && isObject(m.tempoMeter),
  bar: (m) => isSent(m.sent),
  section: isText,
  forecast: (m) => isForecast(m.forecast),
  muse: (m) => isMuse(m.muse),
  stop: () => true,
  finale: (m) => Number.isInteger(m.bar),
  pong: (m) =>
    Number.isFinite(m.sent) && Number.isFinite(m.host) && orNull(m.heard, Number.isFinite),
  closed: () => true,
};

/**
 * A message from a host, or null for anything that isn't one: its kind, and
 * the fields that kind carries, of their types, as a host reads a client's
 * (`readClientMessage`). A client checks them though it chose the host it
 * joined: one not built from this code can't take a field's type on trust
 * (the contract's ruling), and a message it can't read is dropped here, the
 * link kept, rather than thrown on while its band plays.
 */
export function readHostMessage(data: unknown): HostMessage | null {
  const kind = kindOf(data);
  return kind !== null &&
    Object.hasOwn(HOST_FIELDS, kind) &&
    HOST_FIELDS[kind]!(data as Partial<Record<string, unknown>>)
    ? (data as HostMessage)
    : null;
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
 * Why a host refuses a join, or null to admit it: another major version
 * (any minor of its own is admitted, `sameMajor`, #460), a wrong code where
 * the host admits by one (`code`, #461, looked at before the name, so a join
 * refused for it learns nothing of who is in the session; a join without a
 * code is admitted, to listen, `admit`),
 * no name, or a name a player in the session already goes by (`inUse`), in
 * any case. A code is compared trimmed, as a phone's keyboard may pad it.
 */
export function refusal(
  join: ClientMessage & { kind: 'join' },
  inUse: readonly string[] = [],
  code: string | null = null,
): string | null {
  if (!sameMajor(join.protocol))
    return `This host speaks version ${PROTOCOL} of the session protocol, which takes ${FIRST_PROTOCOL} on, and this app ${join.protocol}: reload it.`;
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
