/**
 * A section the band composed as one cells text: the builder E35 found
 * (#390, #395, #396), which the experiment and the app share (#399; the seam,
 * #63; #358).
 *
 * The text, one section of the band's bars:
 *
 * - the host's lines, stated once: the meter with the section's tempo and
 *   swing (`&bar meter("4/4") step=84bpm swing=16n:.65`) and the key
 *   (`&key scale(aeolian, A)`); the plan holds both, and the melodic scale,
 *   for the section's bars, so each is one line (`hostOf` refuses a section
 *   whose bars part on any of them, the tempo too unless the statement lets
 *   it move: `tempo: 'first'`);
 * - the harmony once, `&harm over=key step=1m [0,2,4] [3,5,7] …`, every
 *   chord the band writes in the section at its slot (E32's stacks), which
 *   nothing plays;
 * - the drums, a line a role on `16n` over the section's steps (E31), the
 *   rim a Euclid token a bar on `1m` where the meter is straight (E33's gap 4);
 * - the bass, the pad and the stab, each a line on `16n` over the chord in
 *   force (`over=&harm`, E33), a line with a note no index reaches over the
 *   key (`over=key`), held `@k` for the written length and sounding its share
 *   of it (`legato=`), a line of shares where a line sounds more than one;
 * - the lead as its notes (yggi/cells#47): degrees over the plan's melodic
 *   scale from its voice, C4, over the key where the scale is the key's own,
 *   else over the scale stated as a stack of the key's degrees (`&melo`);
 * - velocities through a gate, a line of levels or one gain, and one MIDI
 *   card on Jambot's channels: 1 the lead, 2 the bass, 3 the pad and the stab,
 *   10 the drums.
 *
 * What it states is the written layer: each note's step, pitch, velocity as
 * the performer plays it at feel 0 (`writtenNotes`) and written length, and
 * each chord. Playing a text back is `section-play.ts`.
 *
 * The helpers come from the experiments that found each form: the drums'
 * voices and levels (E31), the key, the stacks and the pins (E32), and the
 * meter, the swing, the chords stated and the indices into the chord in
 * force (E33); those experiments import them from here.
 */

import {
  BAR_STEPS,
  type BandBar,
  DRUM_NOTES,
  DRUM_ROLES,
  type DrumRole,
  type Key,
  type MelodicScale,
  type MeterSwing,
  STRAIGHT,
  baseLengthOf,
  baseVelocityOf,
  chordNumeral,
  keyHelix,
  melodicHelix,
  sameMeter,
  slotStepOn,
} from '@jambot/engine';
import {
  type Chord,
  type Helix,
  METERS,
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
import { bjorklund } from '@yggi/cells/engine/parser/generators';
import { DRUM_WORDS, type ScoreKey, lowerNumeral } from './score.ts';

// ---------------------------------------------------------------------------
// The drums' voices and levels (E31)

/** The voice each drum note is written with: the score's words, and cells' `sd` for the snare. */
export const VOICE_OF_NOTE: ReadonlyMap<number, string> = new Map([
  ...Object.entries(DRUM_WORDS).map(
    ([sound, word]) => [DRUM_NOTES[sound as keyof typeof DRUM_WORDS], word] as const,
  ),
  [DRUM_NOTES.snare, 'sd'] as const,
]);

/** A velocity as a level, (v/127)², which cells' MIDI out strikes at 127·√level: six decimals, no leading 0. */
export function levelOf(velocity: number): string {
  if (velocity >= 127) return '1';
  return ((velocity / 127) ** 2).toFixed(6).replace(/0+$/, '').replace(/^0/, '');
}

/** The rotation `r` at which cells' `euclid(k, n, r)` hits exactly these steps of `n`, if any. */
export function euclidOf(steps: readonly number[], n = BAR_STEPS): { k: number; r: number } | null {
  const k = steps.length;
  if (k === 0 || k >= n) return null;
  const want = [...steps].sort((a, b) => a - b).join();
  const from = bjorklund(k, n).flatMap((on, j) => (on ? [j] : []));
  for (let r = 0; r < n; r++)
    if (
      from
        .map((j) => (j + r) % n)
        .sort((a, b) => a - b)
        .join() === want
    )
      return { k, r };
  return null;
}

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

/** Where a pin counts from: its part's voice, a C, and the key's tonic above it; the lead's C4 is E35's. */
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

/** A meter's swing as cells states it on `&bar`: none where it is straight. */
export const swingText = (swing: MeterSwing) =>
  swing.share === STRAIGHT.share ? '' : ` swing=${swing.level}:${shareText(swing.share)}`;

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

const clampVelocity = (v: number) => Math.max(1, Math.min(127, Math.round(v)));

/** Notes in the order the comparison reads them: by part, step, then pitch. */
export const sortNotes = <N extends SectionNote>(notes: readonly N[]): N[] =>
  [...notes].sort((a, b) => a.part.localeCompare(b.part) || a.step - b.step || a.note - b.note);

/** A bar's written notes, every part: the step, pitch, velocity at feel 0, written and articulated length. */
export function writtenNotes(bar: BandBar): ComposedNote[] {
  return sortNotes(
    bar.written.map((w) => ({
      part: w.part === 'pad' || w.part === 'stab' ? 'comp' : w.part,
      line: w.part,
      ...(w.role ? { role: w.role } : {}),
      step: w.step,
      note: w.note,
      velocity: clampVelocity(baseVelocityOf(bar, w) + (w.accent ?? 0)),
      written: w.length,
      length: baseLengthOf(bar, w),
    })),
  );
}

/** A line of the text, and which part it states. */
export interface SectionLine {
  readonly part: 'meter' | 'key' | SectionPart | 'card';
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
}

export const sectionTextOf = (s: SectionText) => s.lines.map((l) => l.text).join('\n');

/** A held token: `x`, or `x@k` for k steps. */
const held = (text: string, length: number) => (length === 1 ? text : `${text}@${length}`);

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
  const each = bars.map((bar) => ({
    meter: barMeterName(bar),
    bpm: bar.style.bpm,
    swing: swingText(bar.swing),
    key: keyText(bar.plan.key),
    melodic: bar.plan.melodic,
  }));
  const fields: readonly HostField[] =
    tempo === 'held'
      ? ['meter', 'bpm', 'swing', 'key', 'melodic']
      : ['meter', 'swing', 'key', 'melodic'];
  for (const [i, h] of each.entries())
    for (const field of fields)
      if (h[field] !== each[0]![field])
        throw new Error(
          `a section's ${field} changes at its bar ${i} (${each[0]![field]} to ${h[field]}): one text holds one`,
        );
  return each[0]!;
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

/** A section's steps, each mapped. */
const eachStep = (steps: number, f: (step: number) => string) =>
  Array.from({ length: steps }, (_, step) => f(step)).join(' ');

/** A hit's own level after its voice, none at full velocity. */
const hitLevel = (velocity: number) => (velocity >= 127 ? '' : `:0:${levelOf(velocity)}`);

/** A section's note, at its step in the section. */
type AtStep = ComposedNote & { readonly at: number };

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
  for (const role of DRUM_ROLES as readonly DrumRole[]) {
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
      lines.push(`&${role} step=1m ${rims.join(' ')}`);
      const velocities = new Set(hits.map((h) => h.velocity));
      const perBar = Array.from({ length: bars }, (_, i) => [
        ...new Set(ofBar(i).map((h) => h.velocity)),
      ]);
      if (velocities.size === 1) {
        const v = hits[0]!.velocity;
        terms.push(v >= 127 ? `&${role}` : `&${role} * ${levelOf(v)}`);
      } else if (perBar.every((v) => v.length <= 1)) {
        lines.push(
          `&${role}Level map=amp step=1m ${perBar.map((v) => (v.length ? levelOf(v[0]!) : '0')).join(' ')}`,
        );
        terms.push(`&${role} * &${role}Level`);
      } else {
        const level = (s: number) => hits.find((h) => h.at === s)?.velocity;
        lines.push(
          `&${role}Level map=amp step=16n ${eachStep(bars * steps, (s) => (level(s) ? levelOf(level(s)!) : '0'))}`,
        );
        terms.push(`&${role} * &${role}Level`);
      }
      continue;
    }
    const braid = eachStep(bars * steps, (s) => {
      const words = hits
        .filter((h) => h.at === s)
        .map((h) => `&${VOICE_OF_NOTE.get(h.note)!}${hitLevel(h.velocity)}`);
      return words.length === 0 ? '~' : words.length === 1 ? words[0]! : `[${words.join(',')}]`;
    });
    lines.push(`&${role} step=16n ${braid}`);
    terms.push(`&${role}`);
  }
  const voices = [...new Set(notes.map((n) => VOICE_OF_NOTE.get(n.note)!))];
  return { lines, terms, voices };
}

/**
 * A pitched line on 16ths over the section: each onset its notes as indices
 * into the table asked for (the chord in force, or the melodic scale) from
 * the line's voice, or, where a note has no index or the key is asked for,
 * as degrees of the key (`over=key`); a chord a stack, held for its written
 * length (cut at the next onset or the section's end), sounding its share of
 * it (`legato=`, a number or a line of shares); and its levels, as a line or
 * one gain.
 */
function pitchedLine(
  name: PitchedName,
  notes: readonly AtStep[],
  key: ScoreKey,
  total: number,
  voice: PinVoice,
  table: (at: number) => readonly Tone[] | null,
  asked: PitchTable,
  cuts: SectionCut[],
): { lines: string[]; level: string; pitched: PitchedLine } {
  const onsets = [...new Set(notes.map((n) => n.at))].sort((a, b) => a - b);
  const overKey: string[] = [];
  const overTable: string[] = [];
  const levels: string[] = [];
  const shares: string[] = [];
  const unreached: { step: number; note: number }[] = [];
  let accidentals = 0;
  let at = 0;
  const rest = (length: number) => {
    for (const words of [overKey, overTable, levels, shares]) words.push(held('~', length));
  };
  for (const [i, step] of onsets.entries()) {
    if (step > at) rest(step - at);
    const here = notes.filter((n) => n.at === step);
    const written = Math.max(...here.map((n) => n.written));
    const length = Math.min(written, (onsets[i + 1] ?? total) - step);
    if (length < written) cuts.push({ line: name, step, written, stated: length });
    const word = (tones: readonly string[]) =>
      held(tones.length === 1 ? tones[0]! : `[${tones.join(',')}]`, length);
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
    levels.push(held(levelOf(here[0]!.velocity), length));
    shares.push(held(numberText(here[0]!.length / here[0]!.written), length));
    at = step + length;
  }
  if (at < total) rest(total - at);
  const over: PitchTable = asked !== 'key' && unreached.length === 0 ? asked : 'key';
  const one = new Set(notes.map((n) => n.velocity)).size === 1;
  const shareSet = [...new Set(notes.map((n) => numberText(n.length / n.written)))];
  const legato =
    shareSet.length > 1
      ? ` legato=&${name}Share`
      : shareSet[0] === '1'
        ? ''
        : ` legato=${shareSet[0]}`;
  return {
    lines: [
      `&${name} over=${over === 'key' ? 'key' : `&${over}`} step=16n${legato} ${(over === 'key' ? overKey : overTable).join(' ')}`,
      ...(shareSet.length > 1 ? [`&${name}Share step=16n ${shares.join(' ')}`] : []),
      ...(one ? [] : [`&${name}Level map=amp step=16n ${levels.join(' ')}`]),
    ],
    level: one ? levelOf(notes[0]!.velocity) : `&${name}Level`,
    pitched: {
      part: name,
      table: over,
      accidentals: over === 'key' ? 0 : accidentals,
      unreached,
      shares: shareSet.length,
    },
  };
}

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
 * A section's bars, every part, as one cells text. The host's lines come
 * first, stated once (`hostOf` refuses bars that part on them), then the
 * harmony, then the parts, open on them.
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
  const notes: AtStep[] = bars.flatMap((bar, i) =>
    writtenNotes(bar).map((n) => ({ ...n, at: i * steps + n.step })),
  );
  const cuts: SectionCut[] = [];
  const pitched: PitchedLine[] = [];
  const chords = sectionChords(bars, steps);
  const chordStack = (numeral: string) =>
    chordTones(key, lowerNumeral(key, parseNumeral(numeral)!));
  const lines: SectionLine[] = [
    { part: 'meter', text: `&bar meter("${host.meter}") step=${host.bpm}bpm${host.swing}` },
    { part: 'key', text: `&key ${host.key}` },
    {
      part: 'harmony',
      text: `&harm over=key ${rhythmText(chords, (i) => stackText(chordStack(chords[i]!.numeral)), total, steps)}`,
    },
  ];
  const inForce = (at: number) => {
    const c = chords.findLast((x) => x.step <= at);
    return c ? chordStack(c.numeral) : null;
  };
  const drums = drumLines(
    notes.filter((n) => n.part === 'drums'),
    bars.length,
    steps,
    euclid,
  );
  lines.push(
    ...drums.lines.map((text) => ({ part: 'drums' as const, text })),
    ...(drums.terms.length
      ? [{ part: 'drums' as const, text: `&drums [${drums.terms.join(', ')}]` }]
      : []),
    ...drums.voices.map((voice) => ({ part: 'drums' as const, text: `&${voice} s=white` })),
  );
  const outs: Partial<Record<PitchedName, true>> = {};
  const state = (
    name: PitchedName,
    part: 'bass' | 'comp' | 'lead',
    voice: PinVoice,
    tableAt: (at: number) => readonly Tone[] | null,
    asked: PitchTable,
    voiceCell: string,
  ) => {
    const own = notes.filter((n) => n.line === name);
    if (own.length === 0) return;
    const line = pitchedLine(name, own, key, total, voice, tableAt, asked, cuts);
    pitched.push(line.pitched);
    outs[name] = true;
    lines.push(...line.lines.map((text) => ({ part, text })), {
      part,
      text: `&${name}Out play=&${name} level=${line.level} &${voiceCell}`,
    });
  };
  state('bass', 'bass', 'bass', inForce, table, 'bassV');
  if (outs.bass) lines.push({ part: 'bass', text: `&bassV loop=${PIN_VOICES.bass}` });
  state('pad', 'comp', 'comp', inForce, table, 'compV');
  state('stab', 'comp', 'comp', inForce, table, 'compV');
  if (outs.pad || outs.stab) lines.push({ part: 'comp', text: `&compV loop=${PIN_VOICES.comp}` });
  const melodic = host.melodic;
  const scaleOwn = melodic === 'plain' || lead === 'key';
  const scale = melodicTones(key, melodic);
  if (!scaleOwn && notes.some((n) => n.line === 'lead'))
    lines.push({ part: 'lead', text: `&melo over=key step=1m ${stackText(scale)}` });
  state('lead', 'lead', 'lead', () => scale, scaleOwn ? 'key' : 'melo', 'leadV');
  if (outs.lead) {
    lines.push({ part: 'lead', text: `&leadV loop=${PIN_VOICES.lead}` });
    // a `&melo` the lead's notes kept it off goes: the line reads the key
    const melo = lines.findIndex((l) => l.text.startsWith('&melo '));
    if (melo >= 0 && pitched.find((p) => p.part === 'lead')!.table === 'key') lines.splice(melo, 1);
  }
  const comp = (['pad', 'stab'] as const).filter((p) => outs[p]);
  const compEntry =
    comp.length === 0
      ? '~'
      : comp.length === 1
        ? `&${comp[0]}Out`
        : `[${comp.map((p) => `&${p}Out`).join(', ')}]`;
  lines.push({
    part: 'card',
    text: `&out map=midi ${outs.lead ? '&leadOut' : '~'} ${outs.bass ? '&bassOut' : '~'} ${compEntry} ~!6 ${drums.terms.length ? '&drums' : '~'}`,
  });
  return { lines, pitched, cuts };
}
