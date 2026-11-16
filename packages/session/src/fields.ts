/**
 * The checks a session message's readers share across the contract's
 * versions (`protocol.ts` for version 1, `protocol-v2.ts` for version 2):
 * a message's kind, the small types its fields are of, the values both
 * versions carry alike (a song, a forecast, a Muse, a line of the log), and
 * the reading of a message by its kind's check. The package's own: the
 * barrel (`index.ts`) leaves it out, as its names say what a value is, not
 * what a session does.
 */

/** A message as a reader looks at it: any field, of any type, until checked. */
export type Fields = Partial<Record<string, unknown>>;

/** What a kind's message must carry, of their types, for a reader to read it. */
export type FieldChecks = Readonly<Record<string, (m: Fields) => boolean>>;

/** A message's kind, or null for what has none, a string. */
export const kindOf = (data: unknown): string | null =>
  typeof data === 'object' && data !== null && typeof (data as { kind?: unknown }).kind === 'string'
    ? (data as { kind: string }).kind
    : null;

/** An object, as a message's field is one: neither null nor an array. */
export const isObject = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const orNull = (value: unknown, is: (v: unknown) => boolean): boolean =>
  value === null || is(value);
export const each = (value: unknown, is: (v: unknown) => boolean): boolean =>
  Array.isArray(value) && value.every(is);
export const isString = (value: unknown): boolean => typeof value === 'string';

/** A song: its seed, its start on the host's clock, and the track, swing and meter it is laid by. */
export const isSong = (s: unknown): s is Fields =>
  isObject(s) &&
  Number.isInteger(s.seed) &&
  Number.isFinite(s.start) &&
  isObject(s.track) &&
  isObject(s.swing) &&
  isObject(s.tempoMeter);
/** A forecast: from which bar, how many, and the bars that changed. */
export const isForecast = (f: unknown): boolean =>
  isObject(f) &&
  Number.isInteger(f.from) &&
  Number.isInteger(f.count) &&
  each(f.changed, (b) => isObject(b) && Number.isInteger(b.bar));
/** The Muse as a host tells her: her offer, memory, log, what she dropped, and each player's name by id. */
export const isMuse = (u: unknown): boolean =>
  isObject(u) &&
  orNull(u.offer, isObject) &&
  Array.isArray(u.memory) &&
  orNull(u.asOf, Number.isInteger) &&
  orNull(u.lastPlayed, Number.isInteger) &&
  Array.isArray(u.log) &&
  Array.isArray(u.dropped) &&
  isObject(u.players) &&
  Object.values(u.players).every(isString);
/** A line of the session's log: the bar it is about or none, who says it, what kind of line, and the line. */
export const isEvent = (e: unknown): boolean =>
  isObject(e) &&
  orNull(e.bar, Number.isInteger) &&
  isString(e.who) &&
  isString(e.what) &&
  isString(e.text);

/**
 * A message read by its kind's check, or null: one of no kind, of a kind
 * the checks don't name, or without the fields its kind carries.
 */
export function readByKind<M>(checks: FieldChecks, data: unknown): M | null {
  const kind = kindOf(data);
  return kind !== null && Object.hasOwn(checks, kind) && checks[kind]!(data as Fields)
    ? (data as M)
    : null;
}
