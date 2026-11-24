/**
 * A section the band composed as a score: one cells text, the builder E35
 * found (#390, #395, #396), which the experiment and the app share (#399; the
 * seam, #63), written as yggi/cells decision 063 has a score (#531).
 *
 * The score, one section of the band's bars, says what is played and never
 * who plays it, on what, or where it goes out:
 *
 * - the host's lines, stated once, each taken by its `from` line from the
 *   fragment it is (#531, yggi/cells#714): the meter from cells' `bar`
 *   template with the section's tempo and swing (`&bar swing=16n:.65 from
 *   bar 84bpm`, which plays `&bar meter("4/4") step=84bpm
 *   swing=16n:.65`) and the key from its mode fragment (`&key from
 *   diatonic(mode=aeolian) A`, which plays `scale(aeolian, A)`); the plan
 *   holds both, and the melodic scale, for the section's bars, so each is one
 *   line (`hostOf` refuses a section whose bars part on any of them, the
 *   tempo too unless the statement lets it move: `tempo: 'first'`);
 * - the section's style, the note `&style` (decision 063 §3): labelled with
 *   the section's kind, at its first bar's point, or a range to
 *   its last bar's where the style moves within it (`style=&from..&to`), each
 *   end named by its preset's id in cells' library of styles where it sits on
 *   one (`&funk from styles`);
 * - each part the composer took from a fragment, the progression, the drum
 *   bar, the bass line and the lead line (#731, `takenFragments`), by its
 *   `from` line with the argument it is taken on: alone where it plays what the
 *   band plays (`&harm from vamp_to_the_seventh &key`, a progression the band
 *   doesn't colour), else with every head the band's own lines write over it,
 *   which win (`* from funk_bass &harm`, then `&bassline …`: the band thins a
 *   found drum bar and bass line to its own count and register, #656, and plays
 *   a lead line as its phrase's shape); the lead's own line then takes its
 *   motif's head (`&riff part=lead …`, passed as `leadline=&riff`); a part
 *   whose bars took a fragment the seed library lacks is written out;
 * - the harmony once, `&harm over=&key step=1m [0,2,4] [3,5,7] …`, every
 *   chord the band writes in the section at its slot (E32's stacks), unless
 *   the progression's `from` line plays it;
 * - the drums, a line a role on `16n` over the section's steps (E31), the
 *   rim a Euclid token a bar on `1m` where the meter is straight (E33's gap 4),
 *   stacked as the drummer's part (`&drumlines`), each line its role as a
 *   value (`&kick role=kick step=16n …`), which the feel reads, never its
 *   name (cells decision 075, feel v3, #615); the clave the composer chose
 *   with the rhythm taken by its `from` line where the section plays it
 *   whole (`&clave from son_clave_3_2`, at the drummer's level in the mix,
 *   `takenClave`);
 * - the bass, the pad and the stab, each a line on `16n` over the chord in
 *   force (`over=&harm`, E33), a line with a note no index reaches over the
 *   key (`over=&key`), held `@k` for the written length and sounding its share
 *   of it (`legato=`), a line of shares where a line sounds more than one;
 * - the lead as its notes (yggi/cells#47): degrees over the plan's melodic
 *   scale from its register, C4, over the key where the scale is the key's own,
 *   else over the scale stated as a stack of the key's degrees (`&melo`);
 * - the section's intensity (yggi/cells decision 096, #645): its song's, the style's energy, plus its kind's offset,
 *   `&song .75` and `&intensity [&song + -.15 + &rise * .45]` (Jambot's `barEnergy` as cells' sum), which the band's
 *   drums, bass and stabs play at;
 * - each part's velocities, a line of levels or one level (`&bassLevel`), each driven part's level the one cells
 *   strikes at its velocity once the band's drive is read (`drivenLevel`), so a build's levels repeat bar to bar;
 * - each line says its part (`&bassline part=bass …`, feel v3, #615), a word
 *   about the line that sounds nothing, which a performer takes since cells
 *   v0.25.0 (yggi/cells#708);
 * - a tacet for each of the band's five parts that rests the whole section
 *   (`&leadline part=lead step=1m ~`, decision 063 §4: a line with no clock
 *   starts nothing, an error);
 * - and last the band, `* from band(…)`, passed what the score writes
 *   (cells' `bandLine`): each part and its levels, the style and the intensity.
 *
 * The band is the client's own, resolved where the score is played and never
 * sent (`compileSection`, cells' `resolveBand`): cells' default `band` plays
 * each part through its seed performer at the part's register (`PIN_VOICES`),
 * on the instrument found at the score's style (a clarinet at Electro swing's
 * point), and sends it on Jambot's channels: 1 the lead, 2 the bass, 3 the pad
 * and the stab, 10 the drums.
 *
 * Each line on `16n` states a bar it plays more than once once, a cell of its
 * own spliced in where it plays (`&bassline … &basslineA!4 &basslineB`,
 * `barred`), and a drum role whose levels are each its step's in the bar
 * states them as one bar of levels (`&hat * &hatLevel`), so what recurs in a
 * section is written once (#498).
 *
 * What it states is the written layer: each note's step, pitch, velocity as
 * the performer plays it at feel 0 (`writtenNotes`) and written length, and
 * each chord. Playing a score back is `section-play.ts`.
 *
 * The helpers come from the experiments that found each form: the drums'
 * voices and levels (E31), the key, the stacks and the pins (E32), and the
 * meter, the swing, the chords stated and the indices into the chord in
 * force (E33); those experiments import them from here.
 */

import {
  BAR_STEPS,
  type BandBar,
  DRUM_ORDER,
  type DrumRole,
  type Key,
  VOICE_OF_NOTE,
  euclidOf,
  PRESETS,
  CELLS_AXIS,
  STYLE_AXIS_NAMES,
  type StyleAxisName,
  type MelodicScale,
  type MeterSwing,
  STRAIGHT,
  baseLengthOf,
  composedLevel,
  energyOffset,
  SECTION_BARS,
  chordNumeral,
  keyHelix,
  melodicHelix,
  readRhythm,
  readProgression,
  SLOT_BAR,
  sameMeter,
  slotStepOn,
} from '@jambot/engine';
import {
  type Chord,
  type Helix,
  METERS,
  type Meter,
  type MeterName,
  type Numeral,
  alteredDegree,
  diatonicMode,
  formatNumeral,
  heightOf,
  joinChord,
  numeralOf,
  parseNumeral,
  qualityOf,
  shift,
  spelledTonic,
  splitChord,
  stepsOf,
  wrap,
} from '@jambot/theory';
import { fromLine, signatureOf } from '@yggi/cells';
import { bandLine, resolveSeed } from '@yggi/cells/library';
import { type ScoreKey, lowerNumeral } from './score.ts';

// ---------------------------------------------------------------------------
// The drums' voices and levels (E31): the engine's, which states a groove the Muse files the same way (#401)

export { VOICE_OF_NOTE, euclidOf, levelOf } from '@jambot/engine';

// ---------------------------------------------------------------------------
// The key, the stacks and the pins (E32)

/** A key as a helix: its mode's degrees from its tonic. */
export const scoreKeyHelix = (key: ScoreKey): Helix => shift(diatonicMode(key.mode), key.tonic);

/** The key's tonic as the score spells it: `F#`, `Bb`. */
function tonicName(key: ScoreKey): string {
  const tonic = spelledTonic(scoreKeyHelix(key));
  return tonic.letter + (tonic.alteration < 0 ? 'b' : '#').repeat(Math.abs(tonic.alteration));
}

/** A key as cells writes it: `scale(aeolian, A)`. */
export const keyText = (key: ScoreKey) => `scale(${key.mode}, ${tonicName(key)})`;

/**
 * The key as the score takes it (#531, yggi/cells#714): cells' mode fragment, `diatonic`, with the mode as its argument
 * and the tonic its main one, `&key from diatonic(mode=aeolian) A`, which plays `scale(aeolian, A)`.
 */
export const keyLine = (key: ScoreKey) =>
  fromLine({
    names: ['&key'],
    id: 'diatonic',
    args: [{ name: 'mode', value: key.mode }],
    main: tonicName(key),
  });

/**
 * The meter as the score takes it (#531): cells' `bar` template (yggi/cells decision 103), its meter where it isn't the
 * template's 4/4 and its swing on the head where it swings, the tempo its main argument, `&bar swing=16n:.6 from bar
 * 104bpm`, which plays `&bar meter("4/4") step=104bpm swing=16n:.6`, as the composer's meter fragment plays it.
 */
export function meterLine(meter: string, bpm: number, swing: string): string {
  const swung = swing.replace(/^ swing=/, '');
  return fromLine({
    names: ['&bar'],
    ...(swung ? { head: [`swing=${swung}`] } : {}),
    id: 'bar',
    ...(meter === '4/4' ? {} : { args: [{ name: 'meter', value: `"${meter}"` }] }),
    main: `${bpm}bpm`,
  });
}

/** A degree as a cells number writes it: the accidental after it (`6#`, `3bb`), as decision 033 reads. */
export const degreeText = (degree: number, accidental: number) =>
  `${degree}${(accidental < 0 ? 'b' : '#').repeat(Math.abs(accidental))}`;

/** Each quality's tones as degrees above its root, counted in the key: a third is 2, a ninth 8. */
export const QUALITY_DEGREES: Readonly<Record<string, readonly number[]>> = {
  major: [0, 2, 4],
  minor: [0, 2, 4],
  diminished: [0, 2, 4],
  augmented: [0, 2, 4],
  sus2: [0, 1, 4],
  sus4: [0, 3, 4],
  '5': [0, 4],
  '6': [0, 2, 4, 5],
  m6: [0, 2, 4, 5],
  '7': [0, 2, 4, 6],
  maj7: [0, 2, 4, 6],
  m7: [0, 2, 4, 6],
  mMaj7: [0, 2, 4, 6],
  m7b5: [0, 2, 4, 6],
  dim7: [0, 2, 4, 6],
  '9': [0, 2, 4, 6, 8],
  maj9: [0, 2, 4, 6, 8],
  m9: [0, 2, 4, 6, 8],
  m7b9: [0, 2, 4, 6, 8],
  m7b5b9: [0, 2, 4, 6, 8],
  add9: [0, 2, 4, 8],
};

/** A tone of a chord as a degree of its key, from the tonic, and the alteration it needs. */
export interface Tone {
  readonly degree: number;
  readonly accidental: number;
}

/**
 * A chord as degrees of the key: its root where `alteredDegree` puts it (a
 * degree of the key, else altered as the parallel major has it, else a flat
 * above or a sharp below), and each other tone on the chord's own degree
 * above it (`QUALITY_DEGREES`), altered by what the key leaves.
 */
export function chordTones(key: ScoreKey, chord: Chord): Tone[] {
  const scale = diatonicMode(key.mode);
  const heights = joinChord(chord).map((h) => h - key.tonic);
  const quality = qualityOf(heights.map((h) => h - heights[0]!));
  const generic = quality && QUALITY_DEGREES[quality];
  const root = alteredDegree(scale, heights[0]!);
  if (!generic || !root) throw new Error(`chordTones: no degrees for ${heights.join(' ')}`);
  return heights.map((height, i) => {
    const degree = root.degree + generic[i]!;
    return { degree, accidental: height - heightOf(scale, degree) };
  });
}

/** A stack of tones as cells writes it: `[0,2,4]`. */
export const stackText = (tones: readonly Tone[]) =>
  `[${tones.map((t) => degreeText(t.degree, t.accidental)).join(',')}]`;

/** The clock a bar's chords are written on, by the length of its unit in steps; a unit of the whole bar is `1m`. */
export const CLOCK_OF_UNIT: Readonly<Record<number, string>> = {
  16: '1m',
  12: '2n.',
  8: '2n',
  6: '4n.',
  4: '4n',
  3: '8n.',
  2: '8n',
  1: '16n',
};
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Chords as a braid: the clock of their coarsest unit, a token a chord, `@k`
 * a longer one, over `total` 16ths; a unit of `bar` 16ths (one bar, the
 * whole of it unless said) is `1m`, and a unit no note value names (7 of
 * 7/8's 14) is counted in 16ths.
 */
export function rhythmText(
  chords: readonly { step: number }[],
  token: (i: number) => string,
  total = BAR_STEPS,
  bar = total,
): string {
  const starts = chords.map((c) => c.step);
  const spans = [
    ...(starts[0]! > 0 ? [{ text: '~', length: starts[0]! }] : []),
    ...starts.map((step, i) => ({ text: token(i), length: (starts[i + 1] ?? total) - step })),
  ];
  const coarsest = spans.reduce((g, s) => gcd(g, s.length), total);
  const named = coarsest === bar ? '1m' : CLOCK_OF_UNIT[coarsest];
  const unit = named ? coarsest : 1;
  const words = spans.map(({ text, length }) =>
    length === unit ? text : `${text}@${length / unit}`,
  );
  return `step=${named ?? '16n'} ${words.join(' ')}`;
}

/**
 * Where a pin counts from: its part's register, a C, and the key's tonic above it; the lead's C4 is E35's.
 * The part sounds there through the band's performer, whose gate plays it on an instrument that holds a register of
 * its own and moves it by this one less the instrument's: the bass's C1 is cells' `bass` (C2) an octave down, `^$-12`,
 * and the others' are their instruments' own (yggi/cells decision 058).
 */
export const PIN_VOICES = { comp: 'C3', bass: 'C1', lead: 'C4' } as const;
const PIN_FROM = { comp: 48, bass: 24, lead: 60 } as const;
export type PinVoice = keyof typeof PIN_VOICES;

/** A pinned note as a degree of the key from its voice, altered where it is off the key. */
export function pinTone(key: ScoreKey, note: number, part: PinVoice): Tone {
  const height = note - PIN_FROM[part] - key.tonic;
  const at = alteredDegree(diatonicMode(key.mode), height)!;
  return { degree: at.degree, accidental: at.accidental };
}

/** A degree of the key from a part's voice, altered: the MIDI note it plays (`pinTone`'s inverse). */
export const pinNote = (key: ScoreKey, tone: Tone, part: PinVoice) =>
  PIN_FROM[part] + key.tonic + heightOf(diatonicMode(key.mode), tone.degree) + tone.accidental;

/** A chord's notes, from voice C4 (60), read in a key as Jambot reads one: the numeral `numeralOf` writes. */
export function numeralOfNotes(key: ScoreKey, notes: readonly number[]): Numeral | undefined {
  const heights = notes.map((n) => n - 60);
  const chord = splitChord(heights);
  const quality = qualityOf(heights.map((h) => h - heights[0]!));
  if (!chord || !quality) return undefined;
  return numeralOf(scoreKeyHelix(key), { root: wrap(heights[0]!, 12), quality });
}

// ---------------------------------------------------------------------------
// The meter, the swing, the chords stated and the chord in force (E33)

/** A chord the harmony states, at its step, as Jambot's numeral. */
export interface StatedChord {
  readonly step: number;
  readonly numeral: string;
}

/** A bar's meter's name, as cells writes it in `meter("…")`. */
export function barMeterName(bar: BandBar): MeterName {
  return (Object.keys(METERS) as MeterName[]).find((name) => sameMeter(METERS[name], bar.meter))!;
}

/** A bar's chords as its harmony states them: the step on its meter and the numeral in its key. */
export function statedChords(bar: BandBar): StatedChord[] {
  return bar.chords.map((chord) => ({
    step: slotStepOn(bar.meter, chord.slot.step),
    numeral: formatNumeral(parseNumeral(chordNumeral(chord, bar.plan.key))!),
  }));
}

/** A swing share as the text states it: the shorter of its shortest decimal and a fraction that is exactly it (`2/3`, `31/60`, `.65`). */
export function shareText(share: number): string {
  const decimal = String(share).replace(/^0/, '');
  for (let d = 2; d <= 100; d++) {
    const n = Math.round(share * d);
    if (n / d === share) return `${n}/${d}`.length < decimal.length ? `${n}/${d}` : decimal;
  }
  return decimal;
}

/** Each pulse's length in eighths. */
const pulseLengths = (meter: Meter) =>
  meter.heights.map((start, i) => (meter.heights[i + 1] ?? meter.cycle) - start);

/**
 * Whether the band's swing on a level moves anything in a meter: on `16n` it
 * does in every meter, and on `8n` only a pulse of 2 eighths swings (T16), so
 * in a meter whose pulses are all 3 eighths, 6/8's, 9/8's or 12/8's, the band
 * plays an 8n swing straight, whatever its share.
 */
export const levelSwings = (meter: Meter, level: MeterSwing['level']) =>
  level !== '8n' || pulseLengths(meter).includes(2);

/**
 * A meter's swing as cells states it on `&bar`: none where the band plays it straight (#438), and plain elsewhere. In a
 * meter of pulses of 2 and of 3 eighths (5/8, 7/8, 10/8) the band swings each pulse of 2 eighths and plays a pulse of 3
 * straight (T16), which is what cells' `swing=8n:r` means since yggi/cells v0.18.0 (decision 071): a swing leans pairs
 * only, so the `:pairs` decision 053 needed says nothing more.
 */
export function swingText(meter: Meter, swing: MeterSwing): string {
  if (swing.share === STRAIGHT.share || !levelSwings(meter, swing.level)) return '';
  return ` swing=${swing.level}:${shareText(swing.share)}`;
}

/** An index into the chord in force as a cells number writes it: `n` its tone (a lap up past its last), `alter` an accidental. */
export interface ChordIndex {
  readonly n: number;
  readonly alter: number;
}

/**
 * What an index into a chord reads, as cells reads `over=&harm` (since v0.5.0): the chord's tone `n` (past its last tone the
 * chord a lap up, a lap the key's seven degrees, so index 4 of a seventh chord is its root an octave up), moved by its
 * accidental a degree of the key (an accidental moves a step of the table below, cells decision 015), and keeping the
 * tone's own alteration.
 */
export function throughChord(key: ScoreKey, chord: readonly Tone[], index: ChordIndex): Tone {
  const lap = Math.floor(index.n / chord.length);
  const tone = chord[index.n - lap * chord.length]!;
  const degrees = diatonicMode(key.mode).heights.length;
  return { degree: tone.degree + lap * degrees + index.alter, accidental: tone.accidental };
}

/** The order an index is looked for in: no accidental first, then one, then two; and the tone nearest 0. */
const ALTERS = [0, 1, -1, 2, -2];
const INDICES = Array.from({ length: 41 }, (_, i) => (i % 2 ? (i + 1) / 2 : i && -i / 2));

/** The index into the chord in force that plays `note` from a part's voice: the first in ALTERS × INDICES, or none. */
export function indexOf(
  key: ScoreKey,
  chord: readonly Tone[],
  note: number,
  voice: PinVoice,
): ChordIndex | null {
  for (const alter of ALTERS)
    for (const n of INDICES)
      if (pinNote(key, throughChord(key, chord, { n, alter }), voice) === note) return { n, alter };
  return null;
}

// ---------------------------------------------------------------------------
// A section as one text (E35)

/** The parts compared: the band's channels, the comp being the pad and the stab on one; and the harmony. */
export const SECTION_PARTS = ['drums', 'bass', 'comp', 'harmony', 'lead'] as const;
export type SectionPart = (typeof SECTION_PARTS)[number];
export type NotePart = Exclude<SectionPart, 'harmony'>;

/** A pitched line of the text: one per sound. */
export type PitchedName = 'bass' | 'pad' | 'stab' | 'lead';

/** The part each of the band's lines states. */
const PART_OF_LINE = {
  drumlines: 'drums',
  bassline: 'bass',
  padline: 'comp',
  stabline: 'comp',
  leadline: 'lead',
} as const;

/** A number as a style's axis writes it: three decimals at most, no leading zero (`.35`, `1`). */
const axisText = (x: number) => String(Math.round(x * 1000) / 1000).replace(/^0\./, '.');

/** A style as Jambot holds it: a value on each of its axes. */
type StylePoint = Readonly<Record<StyleAxisName, number>>;

/** Whether two styles are one: every axis within a billionth. */
const sameStyle = (a: StylePoint, b: StylePoint) =>
  STYLE_AXIS_NAMES.every((x) => Math.abs(a[x] - b[x]) < 1e-9);

/**
 * The section's style as cells reads it (decision 063 §3): the note `&style`, labelled with the section's kind
 * (`label="groove"`, never its place in the song, so a section the band repeats is the same score), at its first bar's
 * point, or where the style moves within the section,
 * a range from its first bar's point to its last's (`style=&funk..&bossaNova`), which cells glides over the score's
 * bars. Each end is named by its preset's id in cells' library of styles where it sits on one (`&funk from styles`,
 * #596), else written at its point, each axis by its name in cells' table (`STYLE_AXIS_NAMES`, `CELLS_AXIS`), so a
 * cells version whose axes differ says so rather than reading it otherwise. A style named as a part the score takes is
 * renamed where it is taken (`&marchStyle=march from styles`, beside a march motif's `&march`, #731).
 */
const styleLines = (
  first: StylePoint,
  last: StylePoint,
  label: string,
  given: ReadonlySet<string> = new Set(),
): string[] => {
  const ends = sameStyle(first, last) ? [first] : [first, last];
  const named = ends.map((style) => PRESETS.find((p) => sameStyle(p.style, style))?.id);
  const taken = [...new Set(named.filter((id) => id !== undefined))];
  const nameOf = (id: string) => (given.has(`&${id}`) ? `&${id}Style` : `&${id}`);
  const written = ends.map((style, i) =>
    named[i] !== undefined
      ? nameOf(named[i])
      : `&(map=style ${STYLE_AXIS_NAMES.map((a) => `${CELLS_AXIS[a]}=${axisText(style[a])}`).join(' ')})`,
  );
  const binds = taken.map((id) => (nameOf(id) === `&${id}` ? `&${id}` : `${nameOf(id)}=${id}`));
  return [
    ...(taken.length ? [`${binds.join(', ')} from styles`] : []),
    `&style label="${label}" style=${written.join('..')}`,
  ];
};

/** The band's five parts, as its signature names each part's line: what a score passes it, or writes as a tacet. */
export const BAND_PARTS = ['drumlines', 'bassline', 'padline', 'stabline', 'leadline'] as const;

/** A note as composed or as cells plays it: its part, step in its bar, MIDI note, velocity, written and sounding length in steps. */
export interface SectionNote {
  readonly part: NotePart;
  readonly step: number;
  readonly note: number;
  readonly velocity: number;
  readonly written: number;
  readonly length: number;
}

/** A note as composed, with the line that states it and, for the drums, its role. */
export interface ComposedNote extends SectionNote {
  readonly line: PitchedName | 'drums';
  readonly role?: DrumRole;
}

/**
 * The order the comparison reads notes in: by part, step, then pitch.
 * Steps within a millionth are one step, as the comparison reads them: a step read back off cells' clock lies a hair either side of the band's (7/8's unequal beats).
 */
export const noteOrder = (a: SectionNote, b: SectionNote): number =>
  a.part.localeCompare(b.part) ||
  (Math.abs(a.step - b.step) < 1e-6 ? 0 : a.step - b.step) ||
  a.note - b.note;

/** Notes in the order the comparison reads them (`noteOrder`). */
export const sortNotes = <N extends SectionNote>(notes: readonly N[]): N[] =>
  [...notes].sort(noteOrder);

/** A bar's written notes, every part: the step, pitch, velocity at feel 0, written and articulated length. */
export function writtenNotes(bar: BandBar): ComposedNote[] {
  return sortNotes(
    bar.written.map((w) => ({
      part: w.part === 'pad' || w.part === 'stab' ? 'comp' : w.part,
      line: w.part,
      ...(w.role ? { role: w.role } : {}),
      step: w.step,
      note: w.note,
      velocity: Math.round(composedLevel(bar, w)),
      written: w.length,
      length: baseLengthOf(bar, w),
    })),
  );
}

/** A line of the text, and which part it states. */
export interface SectionLine {
  readonly part: 'meter' | 'key' | SectionPart | 'band';
  readonly text: string;
}

/** The table a pitched line reads: the chord in force, the key, or the plan's melodic scale. */
export type PitchTable = 'harm' | 'key' | 'melo';

/** A pitched line of a section's text: the table it reads, and the notes that kept it off the table asked for. */
export interface PitchedLine {
  readonly part: PitchedName;
  readonly table: PitchTable;
  /** Over the chord or the melodic scale: how many notes take an accidental on their index. */
  readonly accidentals: number;
  /** The notes no index into the table asked for reaches, by their step in the section. */
  readonly unreached: readonly { readonly step: number; readonly note: number }[];
  /** How many shares of its written length the line sounds: 1 is a `legato=` number, more a line of shares. */
  readonly shares: number;
}

/** What could not be held as written: a note cut at its line's next onset or the section's end. */
export interface SectionCut {
  readonly line: PitchedName;
  readonly step: number;
  readonly written: number;
  readonly stated: number;
}

/** A section as one cells text: its lines, the table each pitched line reads, and what it had to cut. */
export interface SectionText {
  readonly lines: readonly SectionLine[];
  readonly pitched: readonly PitchedLine[];
  readonly cuts: readonly SectionCut[];
  /** Each part the composer took from a fragment, and how the score writes it (#731). */
  readonly taken: readonly TakenFragment[];
}

export const sectionTextOf = (s: SectionText) => s.lines.map((l) => l.text).join('\n');

/** A held token: `x`, or `x@k` for k steps. */
const held = (text: string, length: number) => (length === 1 ? text : `${text}@${length}`);

/** A word of a line at its step in the section, held for its length: a rest is `~`. */
interface Span {
  readonly at: number;
  readonly length: number;
  readonly text: string;
}

/** The name of a line's `i`th bar stated once: the line's name and a letter, `&bassA`, then `&bassB`, past Z `&bassAA`. */
const barName = (cell: string, i: number): string => {
  let letters = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26))
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return `${cell}${letters}`;
};

/**
 * A line's words over a section of bars of `steps`, as the law of recursion has it at the bar: each bar the line
 * plays more than once is stated once, as a cell of its own (`&bassA 0@4 2@12`), and spliced in wherever it plays,
 * a run of it as one word (`&bassA!3 &bassB 0@16`), so it reads through its line's table, step and share. A bar
 * played once stays in the line, and so does a bar of rests alone (cells reads the voices after such a splice as
 * picks of a kit). Rests in a row are one rest (`~@13`), cut at a bar's end; a note held across one leaves the
 * line's words in a row, as they are.
 */
export function barred(
  cell: string,
  given: readonly Span[],
  steps: number,
): { readonly words: string; readonly cells: readonly string[] } {
  const spans: Span[] = [];
  for (const w of given) {
    const last = spans.at(-1);
    if (last && last.text === '~' && w.text === '~')
      spans[spans.length - 1] = { ...last, length: last.length + w.length };
    else spans.push(w);
  }
  const flat = { words: spans.map((w) => held(w.text, w.length)).join(' '), cells: [] };
  const bars: string[][] = [];
  for (const w of spans) {
    const into = Math.floor(w.at / steps);
    const room = (into + 1) * steps - w.at;
    if (w.length > room && w.text !== '~') return flat;
    for (let at = w.at, left = w.length; left > 0;) {
      const bar = Math.floor(at / steps);
      const here = Math.min(left, (bar + 1) * steps - at);
      (bars[bar] ??= []).push(held(w.text, here));
      at += here;
      left -= here;
    }
  }
  const texts = bars.map((words) => words.join(' '));
  const count = new Map<string, number>();
  for (const t of texts) count.set(t, (count.get(t) ?? 0) + 1);
  const named = new Map<string, string>();
  for (const [i, t] of texts.entries())
    if (
      count.get(t)! > 1 &&
      !named.has(t) &&
      bars[i]!.some((w) => !w.startsWith('~')) &&
      t.length > cell.length + 2
    )
      named.set(t, barName(cell, named.size));
  if (named.size === 0) return flat;
  const words: string[] = [];
  for (let i = 0; i < texts.length;) {
    const name = named.get(texts[i]!);
    if (!name) {
      words.push(texts[i++]!);
      continue;
    }
    let run = 1;
    while (texts[i + run] === texts[i]) run++;
    words.push(run === 1 ? `&${name}` : `&${name}!${run}`);
    i += run;
  }
  return {
    words: words.join(' '),
    cells: [...named].map(([text, name]) => `&${name} ${text}`),
  };
}

/** A number as the text writes it: no leading 0, twelve significant digits at most. */
const numberText = (x: number) => String(Number(x.toPrecision(12))).replace(/^0\./, '.');

/** Which of a section's host fields its bars must share: all of them, or all but the tempo. */
type HostField = 'meter' | 'bpm' | 'swing' | 'key' | 'melodic';

/**
 * What a section's bars share, stated once at its top: it throws at the
 * first bar that parts on any of it. With `tempo: 'first'` the bars' tempos
 * may part, and the first bar's is stated (a host that lays the text on its
 * own clock reads each event's position at that tempo, `section-play.ts`).
 */
export function hostOf(
  bars: readonly BandBar[],
  { tempo = 'held' }: { readonly tempo?: 'held' | 'first' } = {},
): {
  meter: string;
  bpm: number;
  swing: string;
  key: string;
  melodic: MelodicScale;
} {
  const each = bars.map(hostFieldsOf);
  const fields = hostFields(tempo);
  for (const [i, h] of each.entries())
    for (const field of fields)
      if (h[field] !== each[0]![field])
        throw new Error(
          `a section's ${field} changes at its bar ${i} (${each[0]![field]} to ${h[field]}): one text holds one`,
        );
  return each[0]!;
}

/** What a bar states at a text's top, field by field (`hostOf`). */
const hostFieldsOf = (bar: BandBar) => ({
  meter: barMeterName(bar),
  bpm: bar.style.bpm,
  swing: swingText(bar.meter, bar.swing),
  key: keyText(bar.plan.key),
  melodic: bar.plan.melodic,
});

/** The fields a text's bars must share: all of them, or all but the tempo. */
const hostFields = (tempo: 'held' | 'first'): readonly HostField[] =>
  tempo === 'held'
    ? ['meter', 'bpm', 'swing', 'key', 'melodic']
    : ['meter', 'swing', 'key', 'melodic'];

/**
 * A section's bars as runs that one text each can state (`hostOf`): split at
 * each bar that parts from the one before on what a text states once at its
 * top (its meter, swing, key and melodic scale, and its tempo unless `tempo`
 * is `'first'`), in order, every bar in one run. A section that holds them
 * all is one run. A looper over two plans whose keys part mixes them in a
 * section (#648), and a host of session version 2 states each run as a
 * score of its own, since a bar no score states plays silent (#553, #626).
 */
export function sectionRuns(
  bars: readonly BandBar[],
  { tempo = 'held' }: { readonly tempo?: 'held' | 'first' } = {},
): BandBar[][] {
  const fields = hostFields(tempo);
  const runs: BandBar[][] = [];
  let before: ReturnType<typeof hostFieldsOf> | null = null;
  for (const bar of bars) {
    const h = hostFieldsOf(bar);
    if (before === null || fields.some((f) => h[f] !== before![f])) runs.push([]);
    runs.at(-1)!.push(bar);
    before = h;
  }
  return runs;
}

/** The melodic scale as degrees of the key, each with its accidental (the key's own scale is every degree). */
export function melodicTones(key: Key, scale: MelodicScale): Tone[] {
  const tonic = keyHelix(key).heights[0]!;
  return melodicHelix(key, scale).heights.map((h) => {
    const at = alteredDegree(diatonicMode(key.mode), h - tonic)!;
    return { degree: at.degree, accidental: at.accidental };
  });
}

/** A section's chords, each at its step in the section, as the band states them. */
function sectionChords(bars: readonly BandBar[], steps: number) {
  return bars.flatMap((bar, i) =>
    statedChords(bar).map((c) => ({ step: i * steps + c.step, numeral: c.numeral })),
  );
}

/** A section's steps, each a word a step long. */
const eachStep = (steps: number, f: (step: number) => string): Span[] =>
  Array.from({ length: steps }, (_, at) => ({ at, length: 1, text: f(at) }));

/**
 * A velocity as the score writes its level: the shortest decimal cells strikes at that velocity, `round(127 · √level)`
 * (cells' `velocityOf`), kept off the ends of the velocity's interval by a thousandth of its width, so a level is two or
 * three digits where the square of `velocity / 127` is six (`levelOf`, which the Muse files a groove with). 127 is `1`.
 */
export function scoreLevel(velocity: number): string {
  if (velocity >= 127) return '1';
  // (squares and powers of ten by multiplication, exact on every engine: no `Math.pow`)
  const square = (v: number) => (Math.max(0, v) / 127) * (Math.max(0, v) / 127);
  const [lo, hi] = [square(velocity - 0.5), square(velocity + 0.5)];
  const margin = (hi - lo) / 1000;
  const mid = (lo + hi) / 2;
  for (let digits = 1, scale = 10; ; digits++, scale *= 10) {
    const near = Math.round(mid * scale) / scale;
    if (near > lo + margin && near < hi - margin)
      return String(Number(near.toFixed(digits))).replace(/^0\./, '.');
  }
}

/**
 * The drive the default band plays a part at, on the velocity's scale, by the bar's intensity: Jambot's dynamics, which
 * cells' band reads from the score's `&intensity` (yggi/cells `fragments/bands/01-band.md` @ v0.26.1, decision 096). The
 * pad and the lead have none.
 */
const DRIVES: Partial<Record<PitchedName | 'drums', readonly [number, number]>> = {
  drums: [0.35, 0.65],
  bass: [0.25, 0.75],
  stab: [0.2222, 0.7778],
};
/** A part's drive at an intensity, summed as cells sums it (`[&intensity * a + b]`: the constant, then the term). */
export const driveOf = (line: PitchedName | 'drums', intensity: number): number => {
  const d = DRIVES[line];
  return d ? d[1] + d[0] * intensity : 1;
};

/**
 * A velocity as the score writes its level where the band drives it (decision 096): a level cells strikes at that
 * velocity once the drive is read twice, `round(127 · √level · drive)`, kept off the ends of the interval as
 * `scoreLevel` keeps it: the shortest decimal there, or the level of the velocity the drive scales up from,
 * `round(velocity / drive)`, where it falls there and is no longer, so a part's levels repeat as its accents do. With no
 * drive, `scoreLevel`.
 */
export function drivenLevel(velocity: number, drive: number): string {
  if (drive === 1) return scoreLevel(velocity);
  const square = (v: number) => (Math.max(0, v) / (127 * drive)) * (Math.max(0, v) / (127 * drive));
  const [lo, hi] = [square(velocity - 0.5), square(velocity + 0.5)];
  const margin = (hi - lo) / 1000;
  const inside = (x: number) => x > lo + margin && x < hi - margin;
  const mid = (lo + hi) / 2;
  let shortest = '';
  for (let digits = 1, scale = 10; !shortest; digits++, scale *= 10) {
    const near = Math.round(mid * scale) / scale;
    if (inside(near)) shortest = String(Number(near.toFixed(digits))).replace(/^0\./, '.');
  }
  const base = scoreLevel(Math.max(1, Math.round(velocity / drive)));
  return inside(Number(base)) && base.length <= shortest.length ? base : shortest;
}

/** A hit's own level after its voice, none at full velocity. */
const hitLevel = (level: string) => (level === '1' ? '' : `:0:${level}`);

/** A section's note, at its step in the section, and its level as the score writes it (`drivenLevel`). */
type AtStep = ComposedNote & { readonly at: number; readonly level: string };

/**
 * The section's intensity (yggi/cells decision 096): its song's, the style's energy, plus its kind's offset, a sum the
 * band's drives read (`&song .55`, `&intensity [&song + -.45]`; a build's ramp a line by its weight). Where that sum
 * wouldn't play each bar's energy (a style that moves within the section), a line of the bars' intensities. Each bar's
 * intensity as cells reads what is written.
 */
function intensityOf(bars: readonly BandBar[]): { lines: string[]; at: number[] } {
  const kind = bars[0]!.plan.section.type;
  const word = (x: number) => String(Number(x.toFixed(6))).replace(/^(-?)0\./, '$1.');
  const songs = new Set(bars.map((b) => word(b.style.energy)));
  const inSection = bars.map((b) => b.bar % SECTION_BARS);
  const held = (x: number) => Math.max(0, Math.min(1, x));
  if (songs.size === 1 && bars.every((b) => b.plan.section.type === kind)) {
    const song = Number([...songs][0]!);
    if (kind === 'build') {
      const rise = inSection.map((k) => Number(word(k / (SECTION_BARS - 1))));
      // (cells' sum: its constant, the song's number folded in, then the rise by its weight)
      const at = rise.map((r) => held(-0.15 + song + 0.45 * r));
      if (at.every((e, i) => Math.abs(e - bars[i]!.barEnergy) < 1e-5))
        return {
          lines: [
            `&song ${word(song)}`,
            `&rise step=1m ${rise.map(word).join(' ')}`,
            '&intensity [&song + -.15 + &rise * .45]',
          ],
          at,
        };
    } else {
      const offset = energyOffset(kind, 0);
      const at = bars.map(() => held(song + offset));
      if (at.every((e, i) => Math.abs(e - bars[i]!.barEnergy) < 1e-5))
        return { lines: [`&song ${word(song)}`, `&intensity [&song + ${word(offset)}]`], at };
    }
  }
  const at = bars.map((b) => Number(word(b.barEnergy)));
  return { lines: [`&intensity step=1m ${at.map(word).join(' ')}`], at };
}

/**
 * The drums: a line a role on 16ths over the section, the rim a Euclid token
 * a bar on `1m` where `euclid` allows and each bar's rim is one; and the
 * mix's terms and the voices.
 */
function drumLines(
  notes: readonly AtStep[],
  bars: number,
  steps: number,
  euclid: boolean,
): { lines: string[]; terms: string[]; voices: string[] } {
  const lines: string[] = [];
  const terms: string[] = [];
  for (const role of DRUM_ORDER as readonly DrumRole[]) {
    const hits = notes.filter((n) => n.role === role);
    if (hits.length === 0) continue;
    const ofBar = (i: number) => hits.filter((h) => Math.floor(h.at / steps) === i);
    const rims =
      euclid && role === 'euclid'
        ? Array.from({ length: bars }, (_, i) => {
            const own = ofBar(i);
            if (own.length === 0) return '~';
            if (new Set(own.map((h) => h.note)).size !== 1) return null;
            const e = euclidOf(
              own.map((h) => h.step),
              steps,
            );
            return e && `&${VOICE_OF_NOTE.get(own[0]!.note)!}(${e.k},${steps},${e.r})`;
          })
        : null;
    if (rims && rims.every((r) => r !== null)) {
      lines.push(`&${role} role=${role} step=1m ${rims.join(' ')}`);
      const levelSet = new Set(hits.map((h) => h.level));
      const perBar = Array.from({ length: bars }, (_, i) => [
        ...new Set(ofBar(i).map((h) => h.level)),
      ]);
      if (levelSet.size === 1) {
        const l = hits[0]!.level;
        terms.push(l === '1' ? `&${role}` : `&${role} * ${l}`);
      } else if (perBar.every((v) => v.length <= 1)) {
        lines.push(
          `&${role}Level map=amp step=1m ${perBar.map((v) => (v.length ? v[0]! : '0')).join(' ')}`,
        );
        terms.push(`&${role} * &${role}Level`);
      } else {
        const level = (s: number) => hits.find((h) => h.at === s)?.level;
        const levels = barred(
          `${role}Level`,
          eachStep(bars * steps, (s) => level(s) ?? '0'),
          steps,
        );
        lines.push(...levels.cells, `&${role}Level map=amp step=16n ${levels.words}`);
        terms.push(`&${role} * &${role}Level`);
      }
      continue;
    }
    const braidOf = (level: (level: string) => string) =>
      barred(
        role,
        eachStep(bars * steps, (s) => {
          const words = hits
            .filter((h) => h.at === s)
            .map((h) => `&${VOICE_OF_NOTE.get(h.note)!}${level(h.level)}`);
          return words.length === 0 ? '~' : words.length === 1 ? words[0]! : `[${words.join(',')}]`;
        }),
        steps,
      );
    const own = braidOf(hitLevel);
    const each = [...own.cells, `&${role} role=${role} step=16n ${own.words}`];
    // A hit is a step long, so where a role's level is its step's in the bar, one bar of levels states them all, looped:
    // cells levels each lap's first hit of a looped line of levels (yggi/cells#460), so it needn't be a section long.
    const atStep = new Map<number, string>();
    const placed = hits.every((h) => {
      const step = h.at % steps;
      if ((atStep.get(step) ?? h.level) !== h.level) return false;
      atStep.set(step, h.level);
      return true;
    });
    if (placed) {
      const bare = braidOf(() => '');
      const looped = [
        ...bare.cells,
        `&${role} role=${role} step=16n ${bare.words}`,
        `&${role}LevelA ${barred(
          `${role}Level`,
          eachStep(steps, (s) => atStep.get(s) ?? '~'),
          steps,
        ).words.replace(/~/g, '0')}`,
        `&${role}Level map=amp step=16n &${role}LevelA`,
      ];
      const term = `&${role} * &${role}Level`;
      if (looped.join('\n').length + term.length < each.join('\n').length + role.length + 1) {
        lines.push(...looped);
        terms.push(term);
        continue;
      }
    }
    lines.push(...each);
    terms.push(`&${role}`);
  }
  const voices = [...new Set(notes.map((n) => VOICE_OF_NOTE.get(n.note)!))];
  return { lines, terms, voices };
}

/**
 * A pitched part on 16ths over the section, the two holes its performer
 * leaves (`&bassline` and `&bassLevel`): each onset its notes as indices
 * into the table asked for (the chord in force, or the melodic scale) from
 * the part's register, or, where a note has no index or the key is asked for,
 * as degrees of the key (`over=&key`); a chord a stack, held for its written
 * length (cut at the next onset or the section's end), sounding its share of
 * it (`legato=`, a number or a line of shares); and its levels, a line of
 * them or one.
 */
function pitchedLine(
  name: PitchedName,
  notes: readonly AtStep[],
  key: ScoreKey,
  total: number,
  steps: number,
  voice: PinVoice,
  table: (at: number) => readonly Tone[] | null,
  asked: PitchTable,
  cuts: SectionCut[],
): { lines: string[]; pitched: PitchedLine } {
  const onsets = [...new Set(notes.map((n) => n.at))].sort((a, b) => a - b);
  const overKey: Span[] = [];
  const overTable: Span[] = [];
  const levels: Span[] = [];
  const shares: Span[] = [];
  const unreached: { step: number; note: number }[] = [];
  let accidentals = 0;
  let at = 0;
  const rest = (length: number) => {
    for (const words of [overKey, overTable, levels, shares]) words.push({ at, length, text: '~' });
  };
  for (const [i, step] of onsets.entries()) {
    if (step > at) rest(step - at);
    at = step;
    const here = notes.filter((n) => n.at === step);
    const written = Math.max(...here.map((n) => n.written));
    const length = Math.min(written, (onsets[i + 1] ?? total) - step);
    if (length < written) cuts.push({ line: name, step, written, stated: length });
    const word = (tones: readonly string[]): Span => ({
      at: step,
      length,
      text: tones.length === 1 ? tones[0]! : `[${tones.join(',')}]`,
    });
    overKey.push(
      word(
        here.map((n) => {
          const t = pinTone(key, n.note, voice);
          return degreeText(t.degree, t.accidental);
        }),
      ),
    );
    const tones = asked === 'key' ? null : table(step);
    overTable.push(
      word(
        here.map((n) => {
          const index = tones && indexOf(key, tones, n.note, voice);
          if (!index) {
            // (the line then reads the key, and this word is never written)
            if (asked !== 'key') unreached.push({ step, note: n.note });
            return '?';
          }
          if (index.alter !== 0) accidentals++;
          return degreeText(index.n, index.alter);
        }),
      ),
    );
    levels.push({ at: step, length, text: here[0]!.level });
    shares.push({ at: step, length, text: numberText(here[0]!.length / here[0]!.written) });
    at = step + length;
  }
  if (at < total) rest(total - at);
  const over: PitchTable = asked !== 'key' && unreached.length === 0 ? asked : 'key';
  const one = new Set(notes.map((n) => n.level)).size === 1;
  const shareSet = [...new Set(notes.map((n) => numberText(n.length / n.written)))];
  const legato =
    shareSet.length > 1
      ? ` legato=&${name}Share`
      : shareSet[0] === '1'
        ? ''
        : ` legato=${shareSet[0]}`;
  const line = barred(`${name}line`, over === 'key' ? overKey : overTable, steps);
  const share = barred(`${name}Share`, shares, steps);
  const level = barred(`${name}Level`, levels, steps);
  return {
    lines: [
      ...line.cells,
      `&${name}line part=${name} over=&${over} step=16n${legato} ${line.words}`,
      ...(shareSet.length > 1 ? [...share.cells, `&${name}Share step=16n ${share.words}`] : []),
      ...(one ? [] : level.cells),
      `&${name}Level map=amp ${one ? notes[0]!.level : `step=16n ${level.words}`}`,
    ],
    pitched: {
      part: name,
      table: over,
      accidentals: over === 'key' ? 0 : accidentals,
      unreached,
      shares: shareSet.length,
    },
  };
}

/**
 * The clave the composer chose with the section's rhythm, taken by its `from` line (#531): `&clave from son_clave_3_2`,
 * at the level the drummer plays it, `&clave * .27`. Only where the section plays the fragment whole, every hit the
 * drummer writes the fragment's and every hit of the fragment written, its lap counted from the section's start as the
 * band counts it (`sectionHits`), at one level: a hit the rim wins (`groove.ts`) or a fragment cells' seed doesn't hold
 * (one the layer filed) leaves the clave written out.
 */
function takenClave(
  bars: readonly BandBar[],
  notes: readonly AtStep[],
  steps: number,
): { readonly line: string; readonly term: string } | null {
  const id = bars[0]!.plan.claveFragment;
  if (id === undefined || bars.some((bar) => bar.plan.claveFragment !== id)) return null;
  const text = resolveSeed(id);
  const read = text === null ? null : readRhythm(text, bars[0]!.meter);
  if (!read || read.hits.some((h) => h.role !== 'clave')) return null;
  const hits = notes.filter((n) => n.part === 'drums' && n.role === 'clave');
  const levels = new Set(hits.map((h) => h.level));
  if (levels.size !== 1) return null;
  const expected = bars.flatMap((_, b) =>
    read.hits
      .filter((h) => Math.floor(h.step / steps) === b % read.bars)
      .map((h) => `${b * steps + (h.step % steps)}:${h.note}`),
  );
  const written = hits.map((h) => `${h.at}:${h.note}`);
  const same = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && [...a].sort().join() === [...b].sort().join();
  if (!same(expected, written)) return null;
  const l = hits[0]!.level;
  return {
    line: fromLine({ names: ['&clave'], id }),
    term: l === '1' ? '&clave' : `&clave * ${l}`,
  };
}

/**
 * The parts the composer takes from a fragment (#731), each with the head its fragment gives and the argument it is
 * taken on: the harmony over the key, the bass over the harmony, the lead over the key, the drums on nothing (a groove's
 * drums are its optional parameters, filled from cells' kit).
 */
export const TAKEN_PARTS = {
  harmony: { head: '&harm', main: '&key' },
  bass: { head: '&bassline', main: '&harm' },
  lead: { head: '&leadline', main: '&key' },
  drums: { head: null, main: null },
} as const;
export type TakenPart = keyof typeof TAKEN_PARTS;

/**
 * How the score writes a part the composer took from a fragment (#731): `whole`, its `from` line alone, where that
 * plays what the band plays; `over`, where the band changed it, the fragment taken with every head it gives the band's
 * own lines' (`* from funk_bass &harm`, then `&bassline …`: a template's head the piece writes is the piece's, cells'
 * `docs/language/use.md`); `written`, written out with no `from` line, and why.
 */
export interface TakenFragment {
  readonly part: TakenPart;
  readonly id: string;
  readonly as: 'whole' | 'over' | 'written';
  /**
   * The head its fragment gives a pitched part, which the band's own line over it takes, so it wins (a motif's, `&hook`,
   * passed to the band as `leadline=&hook`); none for the drums, whose role lines are the heads a groove gives.
   */
  readonly head?: string;
  readonly why?: string;
}

/** Why a part taken from a fragment is written out: its bars part on what they took, or the score can't resolve it. */
export const WRITTEN_WHY = {
  parts: 'its bars take different fragments, or some none',
  filed: 'it isn’t in the seed library, which the score reads its `from` lines through',
  head: 'its fragment’s head isn’t the one the band’s other lines read',
  named: 'its fragment’s head is a name the score gives already',
} as const;

/** The names a line of a score defines: its head, or each a `from` line binds (`&funk, &march from styles`). */
const headsOfLine = (text: string): string[] => {
  const left = /^(&[A-Za-z_]\w*(?:\s*,\s*&[A-Za-z_]\w*)*)(?=\s|$)/.exec(text)?.[1];
  return left ? left.split(/\s*,\s*/) : [];
};

/** The fragment each bar of a section took for a part: the progression, the bass and lead lines, the drum bar. */
const fragmentOf = (bar: BandBar, part: TakenPart): string | null =>
  part === 'drums' ? (bar.plan.rhythmFragment ?? null) : (bar.derivedFrom?.[part] ?? null);

/** A progression's chords by its id and meter, as cells reads its seed (`readProgression`), read once each. */
const progressions = new Map<string, ReturnType<typeof readProgression>>();
function seedProgression(id: string, meter: Meter): ReturnType<typeof readProgression> {
  const key = `${id} ${meter.cycle}:${meter.heights.join(',')}`;
  if (!progressions.has(key)) {
    const text = resolveSeed(id);
    progressions.set(key, text === null ? null : readProgression(text, meter));
  }
  return progressions.get(key)!;
}

/** A chord's tones as a word, to compare: each degree and accidental. */
const tonesKey = (tones: readonly Tone[]) =>
  tones.map((t) => `${t.degree}:${t.accidental}`).join(' ');

/**
 * Whether a progression's `from` line alone plays the section's chords: a section's text from its first bar, and every
 * chord the band states at its step, each stack's tones as the band writes them (`chordTones`), where the seed states
 * one; a chord held on is one chord. The band colours a progression it takes (sevenths, secondary dominants: #624
 * rung 6), and then writes its own `&harm` over the take.
 */
function playsProgression(
  bars: readonly BandBar[],
  id: string,
  steps: number,
  chords: readonly { readonly step: number; readonly tones: string }[],
): boolean {
  if (bars[0]!.barInSection !== 0) return false;
  const read = seedProgression(id, bars[0]!.meter);
  if (!read) return false;
  const total = bars.length * steps;
  const held = (list: readonly { step: number; tones: string }[]) =>
    list.filter((c, i) => c.step < total && (i === 0 || c.tones !== list[i - 1]!.tones));
  const seed = read.notes.map((n) => ({
    step: Math.floor(n.step / SLOT_BAR) * steps + slotStepOn(bars[0]!.meter, n.step % SLOT_BAR),
    tones: tonesKey(
      (n.stack ?? [0, 2, 4].map((k) => ({ degree: n.degree + k, alter: 0 }))).map((t) => ({
        degree: t.degree,
        accidental: t.alter,
      })),
    ),
  }));
  const ours = held(chords);
  const theirs = held(seed);
  return (
    ours.length === theirs.length &&
    ours.every((c, i) => c.step === theirs[i]!.step && c.tones === theirs[i]!.tones)
  );
}

/**
 * What a section's bars took for each part, and how the score writes it (`TakenFragment`): a part every bar took from
 * one seed fragment is taken by its `from` line, whole where it plays so (the harmony alone: the band thins a found
 * drum bar and bass line to its own count and register, #656, and plays a lead line as its phrase's shape), else with
 * the band's own lines over it.
 */
function takenFragments(
  bars: readonly BandBar[],
  steps: number,
  chords: readonly { readonly step: number; readonly tones: string }[],
): TakenFragment[] {
  return (Object.keys(TAKEN_PARTS) as TakenPart[]).flatMap((part): TakenFragment[] => {
    const ids = new Set(bars.map((bar) => fragmentOf(bar, part)));
    const [id] = ids;
    if (id === undefined || id === null) {
      const found = [...ids].find((x) => x !== null);
      return found ? [{ part, id: found, as: 'written', why: WRITTEN_WHY.parts }] : [];
    }
    if (ids.size > 1) return [{ part, id, as: 'written', why: WRITTEN_WHY.parts }];
    const text = resolveSeed(id);
    if (text === null) return [{ part, id, as: 'written', why: WRITTEN_WHY.filed }];
    const own = TAKEN_PARTS[part].head;
    if (own === null) return [{ part, id, as: 'over' }];
    // (the harmony and the bass keep their heads, which other lines read; the lead's line takes its motif's)
    const heads = signatureOf(text)?.names ?? [];
    const head = heads[0];
    if (heads.length !== 1 || !head || (part !== 'lead' && head !== own))
      return [{ part, id, as: 'written', why: WRITTEN_WHY.head }];
    const whole = part === 'harmony' && playsProgression(bars, id, steps, chords);
    return [{ part, id, as: whole ? 'whole' : 'over', head }];
  });
}

/** A part's fragment as the score takes it: its head alone where whole, every head (`*`) where the band's lines win. */
const takenLine = (t: TakenFragment): string => {
  const { head, main } = TAKEN_PARTS[t.part];
  return fromLine({
    names: t.as === 'whole' && head ? [head] : null,
    id: t.id,
    ...(main ? { main } : {}),
  });
};

/** The lead's line, as the band's signature names it. */
const LEAD_LINE = TAKEN_PARTS.lead.head;

/** What a section offers the band, the heads of its own signature (yggi/cells decision 075): its harmony and its key. */
const OFFERS = '&harm, &key from';

/** How a section is stated: the rim as Euclids or a line, the tables the pitched lines read, and whether its tempo may move. */
export interface Statement {
  readonly euclid?: boolean;
  /** The table the bass and the comp read: the chord in force (E33's), or the key. */
  readonly table?: 'harm' | 'key';
  /** The table the lead reads: its melodic scale (the key where that is the key's own), or the key. */
  readonly lead?: 'melo' | 'key';
  /** One tempo the section holds (E35's), or the first bar's stated while the bars' tempos part (`hostOf`). */
  readonly tempo?: 'held' | 'first';
}

/**
 * A section's bars, every part, as a score. What it offers the band comes
 * first (`&harm, &key from`), then the host's lines, stated once (`hostOf`
 * refuses bars that part on them), the style, then the harmony, then the
 * parts and the tacets, and last the band (`* from band(…)`).
 */
export function sectionAsCells(
  bars: readonly BandBar[],
  {
    euclid = bars[0]!.swing.share === STRAIGHT.share,
    table = 'harm',
    lead = 'melo',
    tempo = 'held',
  }: Statement = {},
): SectionText {
  const host = hostOf(bars, { tempo });
  const key = bars[0]!.plan.key;
  const steps = stepsOf(bars[0]!.meter);
  const total = bars.length * steps;
  const intensity = intensityOf(bars);
  const notes: AtStep[] = bars.flatMap((bar, i) =>
    writtenNotes(bar).map((n) => ({
      ...n,
      at: i * steps + n.step,
      level: drivenLevel(n.velocity, driveOf(n.line, intensity.at[i]!)),
    })),
  );
  const cuts: SectionCut[] = [];
  const pitched: PitchedLine[] = [];
  const chords = sectionChords(bars, steps);
  const chordStack = (numeral: string) =>
    chordTones(key, lowerNumeral(key, parseNumeral(numeral)!));
  let taken = takenFragments(
    bars,
    steps,
    chords.map((c) => ({ step: c.step, tones: tonesKey(chordStack(c.numeral)) })),
  );
  const takenOf = (part: TakenPart) => taken.find((t) => t.part === part && t.as !== 'written');
  const harm = takenOf('harmony');
  const lines: SectionLine[] = [
    // (the section offers the band its harmony and its key, the heads of its own signature: a part that doesn't read
    // the harmony leaves it unread, not silent, yggi/cells decision 075, #609)
    { part: 'harmony', text: OFFERS },
    { part: 'meter', text: meterLine(host.meter, host.bpm, host.swing) },
    { part: 'key', text: keyLine(key) },
    // (the section's style over its bars: what the band's instruments read, `&style[bite]`, decision 063 §3)
    ...styleLines(
      bars[0]!.style,
      bars.at(-1)!.style,
      bars[0]!.plan.section.type,
      new Set(taken.flatMap((t) => (t.head && t.part === 'lead' ? [t.head] : []))),
    ).map((text) => ({
      part: 'meter' as const,
      text,
    })),
    // (the progression the composer took, by its `from` line: alone where it plays the band's chords, else the band's
    // own `&harm` over it, #731)
    ...(harm ? [{ part: 'harmony' as const, text: takenLine(harm) }] : []),
    ...(harm?.as === 'whole'
      ? []
      : [
          {
            part: 'harmony' as const,
            text: `&harm over=&key ${rhythmText(chords, (i) => stackText(chordStack(chords[i]!.numeral)), total, steps)}`,
          },
        ]),
    // (the section's intensity, which the band's drums, bass and stabs play at: yggi/cells decision 096, #645)
    ...intensity.lines.map((text) => ({ part: 'meter' as const, text })),
  ];
  const inForce = (at: number) => {
    const c = chords.findLast((x) => x.step <= at);
    return c ? chordStack(c.numeral) : null;
  };
  const clave = takenClave(bars, notes, steps);
  const drums = drumLines(
    notes.filter((n) => n.part === 'drums' && !(clave && n.role === 'clave')),
    bars.length,
    steps,
    euclid,
  );
  // (the drum bar the composer took, every head the band's own drum lines write theirs: #656 thins it, #731)
  const groove = takenOf('drums');
  if (groove) lines.push({ part: 'drums', text: takenLine(groove) });
  if (clave) {
    lines.push({ part: 'drums', text: clave.line });
    drums.terms.push(clave.term);
  }
  // (the band's drummer plays the 13 voices of the General MIDI kit it takes, every voice the band strikes: cells'
  // `drums_performer`, yggi/cells#287, #338)
  lines.push(
    ...drums.lines.map((text) => ({ part: 'drums' as const, text })),
    ...(drums.terms.length
      ? [{ part: 'drums' as const, text: `&drumlines [${drums.terms.join(', ')}]` }]
      : []),
  );
  const outs: Partial<Record<PitchedName, true>> = {};
  const state = (
    name: PitchedName,
    part: 'bass' | 'comp' | 'lead',
    voice: PinVoice,
    tableAt: (at: number) => readonly Tone[] | null,
    asked: PitchTable,
  ) => {
    const own = notes.filter((n) => n.line === name);
    if (own.length === 0) return;
    const line = pitchedLine(name, own, key, total, steps, voice, tableAt, asked, cuts);
    pitched.push(line.pitched);
    outs[name] = true;
    lines.push(...line.lines.map((text) => ({ part, text })));
  };
  // (the bass line and the lead line the composer took, each with the band's own line over it: #656, #731)
  const bassTake = takenOf('bass');
  if (bassTake) lines.push({ part: 'bass', text: takenLine(bassTake) });
  state('bass', 'bass', 'bass', inForce, table);
  state('pad', 'comp', 'comp', inForce, table);
  state('stab', 'comp', 'comp', inForce, table);
  const melodic = host.melodic;
  const scaleOwn = melodic === 'plain' || lead === 'key';
  const scale = melodicTones(key, melodic);
  const leadTake = takenOf('lead');
  if (leadTake) lines.push({ part: 'lead', text: takenLine(leadTake) });
  if (!scaleOwn && notes.some((n) => n.line === 'lead'))
    lines.push({ part: 'lead', text: `&melo over=&key step=1m ${stackText(scale)}` });
  state('lead', 'lead', 'lead', () => scale, scaleOwn ? 'key' : 'melo');
  if (outs.lead) {
    // a `&melo` the lead's notes kept it off goes: the line reads the key
    const melo = lines.findIndex((l) => l.text.startsWith('&melo '));
    if (melo >= 0 && pitched.find((p) => p.part === 'lead')!.table === 'key') lines.splice(melo, 1);
  }
  // (a part that rests the whole section is a tacet, so the score says it rests: decision 063 §4)
  const tacets = BAND_PARTS.filter((p) => !lines.some((l) => l.text.startsWith(`&${p} `))).map(
    // (a pitched tacet says its part, as every pitched line does: #615)
    (p) => ({
      part: PART_OF_LINE[p],
      text: p === 'drumlines' ? `&${p} step=1m ~` : `&${p} part=${p.replace('line', '')} step=1m ~`,
    }),
  );
  lines.push(...tacets);
  // (a motif whose head the score names already, a style's (`&march from styles`), can't be taken: the lead's written)
  const named = new Set(lines.flatMap((l) => headsOfLine(l.text)));
  const clash = leadTake?.head !== undefined && named.has(leadTake.head);
  if (clash) {
    lines.splice(
      lines.findIndex((l) => l.text === takenLine(leadTake!)),
      1,
    );
    taken = taken.map((t) =>
      t === leadTake ? { part: t.part, id: t.id, as: 'written', why: WRITTEN_WHY.named } : t,
    );
  }
  const band = bandLine(lines.map((l) => l.text).join('\n'));
  // (the lead's own line over a motif takes the motif's head, so it wins over the take's, and the band is passed it)
  const leadHead = (!clash && leadTake?.head) || LEAD_LINE;
  if (leadHead !== LEAD_LINE)
    for (const [i, l] of lines.entries())
      if (l.text.startsWith(`${LEAD_LINE} `))
        lines[i] = { ...l, text: `${leadHead}${l.text.slice(LEAD_LINE.length)}` };
  lines.push({
    part: 'band',
    text: band.replace(`leadline=${LEAD_LINE}`, `leadline=${leadHead}`),
  });
  return { lines, pitched, cuts, taken };
}
