/**
 * A bar as score text, and the text as a bar: `encodeBar` and `compileBar`
 * (#13, the seam of #63).
 *
 * ```
 * bar 186 groove key=C:ionian theme=A
 * style swing=1 sync=0.2 harm=0.6 artic=0.3 energy=0.6 entropy=0.3 bpm=148
 * harm "IVmaj9 V7/vi"
 * ```
 *
 * The score writes what a bar states, and `ScoreBar` is its own type for
 * it: the engine's bar fits it but is not imported, so the score stays the
 * contract between composer, compiler and analyzer rather than a view of
 * one of them (#63, ahead of the evidence). The round trip is the pawl:
 * `compileBar(encodeBar(bar))` is the bar, and `encodeBar ∘ compileBar`
 * writes every text that compiles in its one canonical form (Q1a, F3).
 *
 * - **The header** states the bar, its section, its key (a tonic spelled as
 *   the key spells it, and a diatonic mode) and its theme.
 * - **`style`** states every axis on C7's grid of `STYLE_DECIMALS`, `bpm`
 *   counting the grid's rate (T7).
 * - **`harm`** states the bar's chords as Roman numerals of the key (U1),
 *   each held for its weight (`mini.ts`). A chord states no scale: every
 *   chord the score writes implies one (U3), and one that doesn't is
 *   refused until the score can write `scale=`.
 *
 * A header that states no meter is a bar of 4/4, read from its helix on
 * the steps as the song reads its bars (T10); a `meter=` comes with #63
 * step 6.
 */

import {
  CHORD_QUALITIES,
  type Chord,
  DIATONIC_MODE_NAMES,
  type DiatonicModeName,
  type Helix,
  METERS,
  type Meter,
  type Numeral,
  chordOfNumeral,
  chordScale,
  diatonicMode,
  formatNumeral,
  joinChord,
  meterOnSteps,
  parseNote,
  parseNumeral,
  shift,
  spelledTonic,
  splitChord,
  wrap,
} from '@jambot/theory';
import { readSequence, writeSequence } from './mini.ts';

/** A key as the header states it: a tonic's pitch class, 0–11, C = 0, and a mode. */
export interface ScoreKey {
  readonly tonic: number;
  readonly mode: DiatonicModeName;
}

/** A chord as `harm` states it: the step it starts on and its numeral in the key. */
export interface HarmChord {
  readonly step: number;
  readonly numeral: Numeral;
}

/** The style's axes, in the order `style` writes them: the engine's (`AXES`). */
export const STYLE_AXES = ['swing', 'sync', 'harm', 'artic', 'energy', 'entropy', 'bpm'] as const;
export type StyleAxis = (typeof STYLE_AXES)[number];

/** The decimals `style` writes a value with, the grid the band reads it on (C7). */
export const STYLE_DECIMALS = 3;

/** The meter of a bar whose header states none: 4/4, the song's (T10). */
export const UNSTATED_METER: Meter = METERS['4/4'];

/** The steps of a bar whose header states no meter: its helix on the steps, two to an eighth. */
const UNSTATED_STEPS = meterOnSteps(UNSTATED_METER).cycle;

/** What a bar's text states. */
export interface ScoreBar {
  /** Counted from the song's start. */
  readonly bar: number;
  /** The section's type, a word: `groove`, `build`. */
  readonly section: string;
  readonly key: ScoreKey;
  /** The theme the section plays, a word: `A`, `B`, `build`. */
  readonly theme: string;
  readonly style: Readonly<Record<StyleAxis, number>>;
  readonly harm: readonly HarmChord[];
}

const WORD = /^[A-Za-z]+$/u;
const GRID = 10 ** STYLE_DECIMALS;
const onGrid = (x: number) => Number.isFinite(x) && Math.round(x * GRID) / GRID === x;

/** A style value as `style` writes it, the shortest decimal for it: `0.6`, `148`. */
export function writeStyleValue(value: number): string {
  if (!(value >= 0 && onGrid(value)))
    throw new Error(`writeStyleValue: ${value} is off the grid of ${STYLE_DECIMALS} decimals`);
  return String(value);
}

/** A style value from its text, `0.6`, `.6` or `148.0`, if it is a number on the grid. */
export function readStyleValue(text: string): number | undefined {
  const value = /^(\d+(\.\d*)?|\.\d+)$/u.test(text) ? Number(text) : NaN;
  return onGrid(value) ? value : undefined;
}

const keyHelix = (key: ScoreKey): Helix => shift(diatonicMode(key.mode), key.tonic);

/**
 * The chord a numeral means in a key, in the key's register: its root
 * within a turn above the tonic, its tones below the root's octave as the
 * helix and the rest as tensions (P6).
 */
export function lowerNumeral(key: ScoreKey, numeral: Numeral): Chord {
  const { root, quality } = chordOfNumeral(keyHelix(key), numeral);
  const inRegister = key.tonic + wrap(root - key.tonic, 12);
  return splitChord(CHORD_QUALITIES[quality]!.stack.map((x) => inRegister + x))!;
}

/** Whether the numeral's chord implies a scale in the key, which `chordScale` gives (U3). */
function impliesScale(key: ScoreKey, numeral: Numeral): boolean {
  const asked = `${key.tonic}:${key.mode}:${formatNumeral(numeral)}`;
  let implies = IMPLIES_SCALE.get(asked);
  if (implies === undefined) {
    implies = chordScale(keyHelix(key), joinChord(lowerNumeral(key, numeral))) !== undefined;
    IMPLIES_SCALE.set(asked, implies);
  }
  return implies;
}

/** `impliesScale`'s answers: at most every numeral in every key, a finite set. */
const IMPLIES_SCALE = new Map<string, boolean>();

const sign = (alteration: number) => (alteration < 0 ? 'b' : '#').repeat(Math.abs(alteration));

function writeKey(key: ScoreKey): string {
  const tonic = spelledTonic(keyHelix(key));
  return `${tonic.letter}${sign(tonic.alteration)}:${key.mode}`;
}

/** A bar's score text: its header, `style` and `harm`, one line each. */
export function encodeBar(bar: ScoreBar): string {
  const problems = barProblems(bar);
  if (problems.length) throw new Error(`encodeBar: ${problems.join('; ')}`);
  const style = STYLE_AXES.map((axis) => `${axis}=${writeStyleValue(bar.style[axis])}`).join(' ');
  const harm = writeSequence(
    bar.harm.map(({ step, numeral }) => ({ step, word: formatNumeral(numeral) })),
    UNSTATED_STEPS,
  );
  return [
    `bar ${bar.bar} ${bar.section} key=${writeKey(bar.key)} theme=${bar.theme}`,
    `style ${style}`,
    `harm "${harm}"`,
  ].join('\n');
}

/** What keeps a bar from being written, if anything. */
function barProblems(bar: ScoreBar): string[] {
  const problems: string[] = [];
  if (!(Number.isInteger(bar.bar) && bar.bar >= 0)) problems.push(`bar ${bar.bar} is no bar`);
  if (!WORD.test(bar.section)) problems.push(`section "${bar.section}" is not a word`);
  if (!WORD.test(bar.theme)) problems.push(`theme "${bar.theme}" is not a word`);
  if (!(Number.isInteger(bar.key.tonic) && bar.key.tonic >= 0 && bar.key.tonic < 12))
    problems.push(`tonic ${bar.key.tonic} is not a pitch class`);
  for (const axis of STYLE_AXES)
    if (!(bar.style[axis] >= 0 && onGrid(bar.style[axis])))
      problems.push(`${axis}=${bar.style[axis]} is off the grid of ${STYLE_DECIMALS} decimals`);
  if (problems.length) return problems;
  for (const { numeral } of bar.harm)
    if (!impliesScale(bar.key, numeral))
      problems.push(`${formatNumeral(numeral)} implies no scale, and needs scale= (U3)`);
  return problems;
}

/** The bar a score text states. Throws with every problem the text has, one per line. */
export function compileBar(text: string): ScoreBar {
  const read = readBar(text);
  if ('problems' in read) throw new Error(read.problems.join('\n'));
  return read.bar;
}

/** What is wrong with a score text, one line per problem; none when it compiles. */
export function scoreProblems(text: string): string[] {
  const read = readBar(text);
  return 'problems' in read ? read.problems : [];
}

/** The lines a bar's text has, each once, in the order `encodeBar` writes them. */
const LINES: readonly string[] = ['bar', 'style', 'harm'];

type Header = Pick<ScoreBar, 'bar' | 'section' | 'key' | 'theme'>;
type Read<T> = { value: T } | { problems: string[] };

function readBar(text: string): { bar: ScoreBar } | { problems: string[] } {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const byKind = new Map<string, string>();
  const problems: string[] = [];
  for (const line of lines) {
    const kind = line.split(/\s/u, 1)[0]!;
    if (!LINES.includes(kind)) problems.push(`"${kind}" is not a line`);
    else if (byKind.has(kind)) problems.push(`a bar has one ${kind} line`);
    else byKind.set(kind, line.slice(kind.length).trim());
  }
  for (const kind of LINES) if (!byKind.has(kind)) problems.push(`the ${kind} line is missing`);
  if (problems.length) return { problems };

  const header = readHeader(byKind.get('bar')!);
  const style = readStyle(byKind.get('style')!);
  const harm = readHarm(byKind.get('harm')!, 'value' in header ? header.value.key : undefined);
  for (const read of [header, style, harm]) if ('problems' in read) problems.push(...read.problems);
  if (!('value' in header && 'value' in style && 'value' in harm)) return { problems };
  return { bar: { ...header.value, style: style.value, harm: harm.value } };
}

function readHeader(rest: string): Read<Header> {
  const match = /^(\d+)\s+(\S+)\s+(.*)$/u.exec(rest);
  if (!match) return { problems: [`"bar ${rest}" is not bar <n> <section> key=… theme=…`] };
  const [, barText, section, fieldsText] = match;
  const problems: string[] = [];
  if (!WORD.test(section!)) problems.push(`section "${section}" is not a word`);
  const fields = readFields(fieldsText!, ['key', 'theme']);
  if ('problems' in fields) return { problems: [...problems, ...fields.problems] };
  const { key: keyText, theme } = fields.value;
  if (!WORD.test(theme!)) problems.push(`theme "${theme}" is not a word`);
  const key = readKey(keyText!);
  if ('problems' in key) problems.push(...key.problems);
  if (problems.length || !('value' in key)) return { problems };
  return { value: { bar: Number(barText), section: section!, key: key.value, theme: theme! } };
}

/** `name=value` fields, each of the names once and no other. */
function readFields(text: string, names: readonly string[]): Read<Record<string, string>> {
  const fields: Record<string, string> = {};
  const problems: string[] = [];
  for (const field of text.split(/\s+/u).filter(Boolean)) {
    const match = /^([a-z]+)=(\S+)$/u.exec(field);
    if (!match || !names.includes(match[1]!)) problems.push(`"${field}" is not a field here`);
    else if (match[1]! in fields) problems.push(`${match[1]}= is stated twice`);
    else fields[match[1]!] = match[2]!;
  }
  for (const name of names) if (!(name in fields)) problems.push(`${name}= is missing`);
  return problems.length ? { problems } : { value: fields };
}

function readKey(text: string): Read<ScoreKey> {
  const match = /^([^:]+):(.+)$/u.exec(text);
  const tonic = match && parseNote(match[1]!);
  const mode = match?.[2] as DiatonicModeName | undefined;
  if (!tonic || tonic.octave !== undefined || !mode || !DIATONIC_MODE_NAMES.includes(mode))
    return { problems: [`key=${text} is not a tonic and a mode, such as key=A:aeolian`] };
  return { value: { tonic: tonic.pitchClass, mode } };
}

function readStyle(rest: string): Read<Record<StyleAxis, number>> {
  const fields = readFields(rest, STYLE_AXES);
  if ('problems' in fields) return fields;
  const problems: string[] = [];
  const style = Object.fromEntries(
    STYLE_AXES.map((axis) => {
      const text = fields.value[axis]!;
      const value = readStyleValue(text);
      if (value === undefined)
        problems.push(`${axis}=${text} is not a number on the grid of ${STYLE_DECIMALS} decimals`);
      return [axis, value];
    }),
  ) as Record<StyleAxis, number>;
  return problems.length ? { problems } : { value: style };
}

function readHarm(rest: string, key: ScoreKey | undefined): Read<HarmChord[]> {
  const quoted = /^"(.*)"$/u.exec(rest);
  if (!quoted) return { problems: [`harm ${rest} is not a quoted sequence, such as harm "i VI"`] };
  const read = readSequence(quoted[1]!, UNSTATED_STEPS);
  if ('problems' in read) return { problems: read.problems.map((p) => `harm: ${p}`) };
  const problems: string[] = [];
  const harm = read.placed.map(({ word, step }) => {
    const numeral = parseNumeral(word);
    if (!numeral) problems.push(`harm: "${word}" is not a numeral`);
    else if (key && !impliesScale(key, numeral))
      problems.push(`harm: ${word} implies no scale, and needs scale= (U3)`);
    return { step, numeral: numeral! };
  });
  return problems.length ? { problems } : { value: harm };
}
