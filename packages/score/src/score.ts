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
 * - **A drum line**, one per sound that hits in the bar, its word (`bd`,
 *   `hh`, `oh`, `ph`, `rd`, `rim`) starting it: every hit is that
 *   word, one step long, `~` the rest between (E16, form (iii), decided on
 *   the owner's measured options). A sound plays the one role it always
 *   does (kick, pedal, the Euclidean rim, every hi-hat sound); the snare's
 *   (backbeat, fill or ghost) is E16's still-open remainder, so `sd` is not
 *   written yet.
 * - **A bass line and its frame** (#263): `frame bass=E2` states the note the
 *   bass's next note is nearest to (S2, Q4b), and `bass 0=0 4=0 7=7 12=0^`
 *   its notes as `step=pitch` pairs: the step a note starts on, 0-based on
 *   the bar's steps, and its pitch in semitones above the root of the chord
 *   in force at that step, 0–11 (U2, U6). A note goes to the octave nearest
 *   the last one within 33–52, `^` the octave above it, and lasts to the next
 *   onset or the bar's end, so it states no length. Nothing before the first
 *   onset sounds. The frame is written exactly when the bar has a bass line.
 *   A finer grid, a group in a step, a loop or a rest is the tree of #275, and
 *   refused until then.
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
  spell,
  spelledTonic,
  splitChord,
  wrap,
} from '@jambot/theory';
import { type Placed, readSequence, writeSequence } from './mini.ts';

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

/**
 * A drum sound a line can name, the ones whose role never varies (E16):
 * the snare's (backbeat, fill or ghost) is still open, so it has no word
 * here yet.
 */
export const DRUM_SOUNDS = ['kick', 'closedHat', 'openHat', 'pedalHat', 'ride', 'rim'] as const;
export type DrumSound = (typeof DRUM_SOUNDS)[number];

/** The word a sound's line starts with, and every hit on it is written as. */
export const DRUM_WORDS: Readonly<Record<DrumSound, string>> = {
  kick: 'bd',
  closedHat: 'hh',
  openHat: 'oh',
  pedalHat: 'ph',
  ride: 'rd',
  rim: 'rim',
};

/** A bar's drum lines: the steps each sound hits on, one line per sound present. */
export type DrumLines = Readonly<Partial<Record<DrumSound, readonly number[]>>>;

/** The style's axes, in the order `style` writes them: the engine's (`AXES`). */
export const STYLE_AXES = ['swing', 'sync', 'harm', 'artic', 'energy', 'entropy', 'bpm'] as const;
export type StyleAxis = (typeof STYLE_AXES)[number];

/** The decimals `style` writes a value with, the grid the band reads it on (C7). */
export const STYLE_DECIMALS = 3;

/** The meter of a bar whose header states none: 4/4, the song's (T10). */
export const UNSTATED_METER: Meter = METERS['4/4'];

/** The steps of a bar whose header states no meter: its helix on the steps, two to an eighth. */
const UNSTATED_STEPS = meterOnSteps(UNSTATED_METER).cycle;

/** Where the bass puts a note before a jump: the carried register is always within it. */
export const BASS_FOLD = [33, 52] as const;

/** The highest note the bass plays, which an octave jump may reach. */
export const BASS_TOP = 57;

/** A bass note as the score states it: its step and its MIDI note, C4 = 60. It lasts to the next onset, or the bar's end. */
export interface BassNote {
  readonly step: number;
  readonly note: number;
}

/** A bass line: the register it reads from before the bar (S2), and its notes in order of step. */
export interface BassLine {
  readonly register: number;
  readonly notes: readonly BassNote[];
}

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
  readonly drums: DrumLines;
  /** Left out where the bar has no bass. */
  readonly bass?: BassLine;
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

/** The word a hit's own step holds until, where the next hit doesn't already (E16, form (iii)). */
const REST = '~';

/** A sound's hits as a sequence: each one step, held to `~` where the next isn't already there. */
function placeHits(word: string, steps: readonly number[]): Placed[] {
  const placed: Placed[] = [];
  if (steps[0] !== 0) placed.push({ word: REST, step: 0 });
  for (const [i, step] of steps.entries()) {
    placed.push({ word, step });
    const next = steps[i + 1] ?? UNSTATED_STEPS;
    if (step + 1 < next) placed.push({ word: REST, step: step + 1 });
  }
  return placed;
}

/**
 * The note of a pitch class nearest the last note, within the bass's fold,
 * ties down: the engine's own rule, which the seam's test holds it to.
 */
export function bassNearest(pitchClass: number, last: number): number {
  let best: number = BASS_FOLD[0];
  let distance = Infinity;
  for (let n = BASS_FOLD[0]; n <= BASS_FOLD[1]; n++)
    if (wrap(n, 12) === wrap(pitchClass, 12) && Math.abs(n - last) < distance) {
      distance = Math.abs(n - last);
      best = n;
    }
  return best;
}

/** The root of each chord of `harm`, a pitch class: what a bass pitch is counted above. */
function rootsOf(key: ScoreKey, harm: readonly HarmChord[]): number[] {
  return harm.map(({ numeral }) => wrap(lowerNumeral(key, numeral).helix.heights[0]!, 12));
}

/** The root of the chord in force at a step: the last chord that starts on or before it. */
const rootAt = (harm: readonly HarmChord[], roots: readonly number[], step: number) =>
  roots[
    Math.max(
      0,
      harm.findLastIndex((chord) => chord.step <= step),
    )
  ]!;

const TOKEN_STEPS_RISE = `bass: its steps must rise within the bar's ${UNSTATED_STEPS}`;

interface BassToken {
  readonly step: number;
  readonly pitch: number;
  readonly jump: boolean;
}

/** A bass line as tokens, or what keeps a note from having one. */
function bassTokens(bar: ScoreBar): { tokens: BassToken[] } | { problems: string[] } {
  const { register, notes } = bar.bass!;
  const problems: string[] = [];
  if (!(Number.isInteger(register) && register >= BASS_FOLD[0] && register <= BASS_FOLD[1]))
    problems.push(`bass: register ${register} is outside ${BASS_FOLD[0]}–${BASS_FOLD[1]}`);
  if (notes.length === 0) problems.push('bass: a bass line has at least one note');
  let previous = -1;
  let rising = true;
  for (const { step } of notes) {
    if (!(Number.isInteger(step) && step > previous && step < UNSTATED_STEPS)) rising = false;
    previous = step;
  }
  if (!rising) problems.push(TOKEN_STEPS_RISE);
  if (problems.length) return { problems };
  const roots = rootsOf(bar.key, bar.harm);
  const tokens: BassToken[] = [];
  let last = register;
  for (const { step, note } of notes) {
    const root = rootAt(bar.harm, roots, step);
    const near = bassNearest(root + wrap(note - root, 12), last);
    if (note === near || (note === near + 12 && note <= BASS_TOP))
      tokens.push({ step, pitch: wrap(note - root, 12), jump: note !== near });
    else
      problems.push(`bass: note ${note} at step ${step} cannot be written from register ${last}`);
    last = near;
  }
  return problems.length ? { problems } : { tokens };
}

const LETTER_PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;
type NaturalLetter = keyof typeof LETTER_PITCH_CLASS;
const NATURAL_LETTER = new Map<number, NaturalLetter>(
  (Object.entries(LETTER_PITCH_CLASS) as [NaturalLetter, number][]).map(([letter, pitchClass]) => [
    pitchClass,
    letter,
  ]),
);

/** A key's scale as it spells its notes, for the spelling of a register: cached, the keys are finite. */
const SPELLED_SCALES = new Map<string, ReturnType<typeof spell>>();

/**
 * A MIDI note as a name and an octave: as the key spells it where the key's
 * scale has it, else a natural, else flats in a key whose scale leans flat
 * and sharps otherwise, so the name is one thing for the round trip (F3).
 */
function writeRegister(key: ScoreKey, midi: number): string {
  const asked = `${key.tonic}:${key.mode}`;
  let scale = SPELLED_SCALES.get(asked);
  if (!scale) {
    scale = spell(spelledTonic(keyHelix(key)), keyHelix(key).heights);
    SPELLED_SCALES.set(asked, scale);
  }
  const pitchClass = wrap(midi, 12);
  let letter: NaturalLetter;
  let alteration: number;
  const inKey = scale.find((note) => note.pitchClass === pitchClass);
  if (inKey) ({ letter, alteration } = inKey);
  else if (NATURAL_LETTER.has(pitchClass)) {
    letter = NATURAL_LETTER.get(pitchClass)!;
    alteration = 0;
  } else if (scale.reduce((sum, note) => sum + note.alteration, 0) < 0) {
    letter = NATURAL_LETTER.get(pitchClass + 1)!;
    alteration = -1;
  } else {
    letter = NATURAL_LETTER.get(pitchClass - 1)!;
    alteration = 1;
  }
  const octave = Math.floor((midi - alteration - LETTER_PITCH_CLASS[letter]) / 12) - 1;
  return `${letter}${sign(alteration)}${octave}`;
}

/** A bar's score text: its header, `style`, `harm`, its `frame` and `bass`, and a line per sounding drum. */
export function encodeBar(bar: ScoreBar): string {
  const problems = barProblems(bar);
  if (problems.length) throw new Error(`encodeBar: ${problems.join('; ')}`);
  const style = STYLE_AXES.map((axis) => `${axis}=${writeStyleValue(bar.style[axis])}`).join(' ');
  const harm = writeSequence(
    bar.harm.map(({ step, numeral }) => ({ step, word: formatNumeral(numeral) })),
    UNSTATED_STEPS,
  );
  const drums = DRUM_SOUNDS.flatMap((sound) => {
    const steps = bar.drums[sound];
    if (!steps || steps.length === 0) return [];
    const word = DRUM_WORDS[sound];
    return [`${word} "${writeSequence(placeHits(word, steps), UNSTATED_STEPS)}"`];
  });
  const bassLines = bar.bass
    ? [
        `frame bass=${writeRegister(bar.key, bar.bass.register)}`,
        `bass ${(bassTokens(bar) as { tokens: BassToken[] }).tokens
          .map(({ step, pitch, jump }) => `${step}=${pitch}${jump ? '^' : ''}`)
          .join(' ')}`,
      ]
    : [];
  return [
    `bar ${bar.bar} ${bar.section} key=${writeKey(bar.key)} theme=${bar.theme}`,
    `style ${style}`,
    `harm "${harm}"`,
    ...bassLines,
    ...drums,
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
  for (const sound of DRUM_SOUNDS) {
    const steps = bar.drums[sound];
    if (!steps) continue;
    let previous = -1;
    for (const step of steps) {
      if (!(Number.isInteger(step) && step > previous && step < UNSTATED_STEPS))
        problems.push(
          `${DRUM_WORDS[sound]}: its steps must rise within the bar's ${UNSTATED_STEPS}`,
        );
      previous = step;
    }
  }
  if (problems.length) return problems;
  for (const { numeral } of bar.harm)
    if (!impliesScale(bar.key, numeral))
      problems.push(`${formatNumeral(numeral)} implies no scale, and needs scale= (U3)`);
  if (bar.bass) {
    const tokens = bassTokens(bar);
    if ('problems' in tokens) problems.push(...tokens.problems);
  }
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

/** The lines every bar's text has, each once, in the order `encodeBar` writes them. */
const REQUIRED_LINES: readonly string[] = ['bar', 'style', 'harm'];

/** A drum line, present only for a sound that hits in the bar. */
const DRUM_LINES: readonly string[] = DRUM_SOUNDS.map((sound) => DRUM_WORDS[sound]);

/** The bass's lines: a frame and a bass line, each present only with the other (S2). */
const BASS_LINES: readonly string[] = ['frame', 'bass'];

/** Every line a bar's text may have, required or not. */
const LINES: readonly string[] = [...REQUIRED_LINES, ...BASS_LINES, ...DRUM_LINES];

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
  for (const kind of REQUIRED_LINES)
    if (!byKind.has(kind)) problems.push(`the ${kind} line is missing`);
  if (byKind.has('bass') && !byKind.has('frame'))
    problems.push('a bass line needs a frame line, such as frame bass=E2');
  if (byKind.has('frame') && !byKind.has('bass'))
    problems.push('a frame line with no bass line has nothing to carry');
  if (problems.length) return { problems };

  const header = readHeader(byKind.get('bar')!);
  const style = readStyle(byKind.get('style')!);
  const harm = readHarm(byKind.get('harm')!, 'value' in header ? header.value.key : undefined);
  const drumReads = DRUM_SOUNDS.flatMap((sound) => {
    const rest = byKind.get(DRUM_WORDS[sound]);
    return rest === undefined ? [] : [{ sound, read: readDrumLine(sound, rest) }];
  });
  const frame = byKind.has('frame') ? readFrame(byKind.get('frame')!) : undefined;
  const bassLine =
    byKind.has('bass') && frame && 'value' in frame && 'value' in header && 'value' in harm
      ? readBassLine(byKind.get('bass')!, header.value.key, harm.value, frame.value)
      : undefined;
  for (const read of [header, style, harm, frame, bassLine])
    if (read && 'problems' in read) problems.push(...read.problems);
  for (const { read } of drumReads) if ('problems' in read) problems.push(...read.problems);
  if (!('value' in header && 'value' in style && 'value' in harm) || problems.length)
    return { problems };
  const drums = Object.fromEntries(
    drumReads.map(({ sound, read }) => [sound, (read as { value: readonly number[] }).value]),
  ) as DrumLines;
  const bass =
    frame && bassLine && 'value' in frame && 'value' in bassLine
      ? { bass: { register: frame.value, notes: bassLine.value } }
      : {};
  return { bar: { ...header.value, style: style.value, harm: harm.value, drums, ...bass } };
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

/** A drum sound's line: every hit is its own word, one step, `~` the rest (E16, form (iii)). */
function readDrumLine(sound: DrumSound, rest: string): Read<readonly number[]> {
  const word = DRUM_WORDS[sound];
  const quoted = /^"(.*)"$/u.exec(rest);
  if (!quoted)
    return {
      problems: [`${word} ${rest} is not a quoted sequence, such as ${word} "${word} ~@3"`],
    };
  const read = readSequence(quoted[1]!, UNSTATED_STEPS);
  if ('problems' in read) return { problems: read.problems.map((p) => `${word}: ${p}`) };
  const problems: string[] = [];
  const steps: number[] = [];
  for (const { word: token, step } of read.placed) {
    if (token === REST) continue;
    else if (token !== word) problems.push(`${word}: "${token}" is not ${word} or ${REST}`);
    else steps.push(step);
  }
  return problems.length ? { problems } : { value: steps };
}

/** The register a `frame` line states, as a MIDI note: `frame bass=E2`. */
function readFrame(rest: string): Read<number> {
  const fields = readFields(rest, ['bass']);
  if ('problems' in fields) return fields;
  const text = fields.value.bass!;
  const note = parseNote(text);
  if (note?.midi === undefined)
    return { problems: [`frame: bass=${text} is not a note with an octave, such as bass=E2`] };
  if (note.midi < BASS_FOLD[0] || note.midi > BASS_FOLD[1])
    return {
      problems: [
        `frame: bass=${text} is outside ${BASS_FOLD[0]}–${BASS_FOLD[1]}, where the bass register carries`,
      ],
    };
  return { value: note.midi };
}

/** What the tree of #275 will write: a loop, a group, a rest, a hold. */
const NOT_WRITTEN_YET = /[_~[\]()*!@,]/u;

/** A bass line's pairs, `step=pitch`, read into notes from the register the frame states. */
function readBassLine(
  rest: string,
  key: ScoreKey,
  harm: readonly HarmChord[],
  register: number,
): Read<BassNote[]> {
  const words = rest.split(/\s+/u).filter(Boolean);
  if (words.length === 0) return { problems: ['bass: the line has no notes'] };
  const problems: string[] = [];
  const tokens: BassToken[] = [];
  for (const word of words) {
    const match = /^(\d+)=(\d+)(\^?)$/u.exec(word);
    if (NOT_WRITTEN_YET.test(word)) problems.push(`bass: "${word}" is not written yet (#275)`);
    else if (!match) problems.push(`bass: "${word}" is not step=pitch, such as 4=0 or 12=0^`);
    else if (Number(match[2]) >= 12)
      problems.push(`bass: pitch ${match[2]} is not 0–11 semitones above the chord root`);
    else tokens.push({ step: Number(match[1]), pitch: Number(match[2]), jump: match[3] === '^' });
  }
  if (problems.length) return { problems };
  const rises = tokens.every(
    ({ step }, i) => step < UNSTATED_STEPS && (i === 0 || step > tokens[i - 1]!.step),
  );
  if (!rises) return { problems: [TOKEN_STEPS_RISE] };
  const roots = rootsOf(key, harm);
  const notes: BassNote[] = [];
  let last = register;
  for (const { step, pitch, jump } of tokens) {
    const near = bassNearest(rootAt(harm, roots, step) + pitch, last);
    if (jump && near + 12 > BASS_TOP) problems.push(`bass: step ${step} goes above ${BASS_TOP}`);
    notes.push({ step, note: jump ? near + 12 : near });
    last = near;
  }
  return problems.length ? { problems } : { value: notes };
}
