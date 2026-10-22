/**
 * E32: the band's harmony as cells text (yggi/cells#50, its first step; the seam, #309).
 *
 * Over every preset held (8, seed 0, entropy 0.3, 32 bars each: 256 bars), what
 * a bar's harmony states (its key, its chords as numerals, the next bar's first
 * chord where a stab plays it, and the frame pin) is written under three
 * candidate spellings in cells, read back, and counted: characters, the bars
 * that come back exactly, and what no candidate can say. It decides no
 * language; the recommendation goes to the owner on yggi/cells#50.
 *
 * The three candidates, each a key cell the lines read through (`&key
 * scale(aeolian, A)`, cells' `scale(name, tonic)`, decision 013):
 *
 * - **stacks** (cells v0.9.0 parses it, the spelling of its `chords.cells`): a
 *   chord is a stack of degrees of the key, each the chord's own degree (root,
 *   third, fifth, …) altered where the chord leaves the key: `[4,6#,8]` is V in
 *   A minor.
 * - **shapes** (cells v0.9.0 parses it, the spelling of its `tines.cells`): a
 *   chord is a shape of degrees moved up the key by `^n` (decision 015), the
 *   shapes stated once in the bar: `&c0 [0,2#,4]`, then `&c0^4`; an
 *   accidental moves with its note (decision 033).
 * - **numerals** (a proposal: cells v0.9.0 has no numeral, decision 038's
 *   row (a)): a chord is Jambot's numeral (U1), a token of a line read over the
 *   key, `V7/V`. Its meaning is the stack the numeral names, so a numeral
 *   lowers to the stacks candidate, which is how it is played here.
 *
 * Shared by the three: the rhythm (a token per chord on the coarsest clock
 * of the bar's chords, `step=2n` for two halves, `@k` for a longer one);
 * the next chord as a one-chord cell, `&next`, over the next bar's key where
 * that differs; and the frame pin as degrees of the key, `&frame` (the comp's
 * voicing before the bar, counted from its voice at C3 and the key's tonic
 * above it) and `&frameBass` (the bass's register, from C1), each where the
 * score's own `frame` line states it. The scaffold that plays them (a bar, the
 * voices, MIDI cards) is the reading's, and not counted.
 *
 * A stacks or shapes text is read back through cells itself: compiled by
 * `@yggi/cells`, played through its MIDI out (`channelTable`, `router`,
 * `midiNote`), each chord's notes read as Jambot reads a chord in a key
 * (`numeralOf`). A numerals text is read by its tokens (`parseNumeral`), its
 * pins through cells. The score's own frozen spelling (`encodeBar`'s `key=`,
 * `harm`, `next` and `frame`) is the baseline, read by `compileBar`.
 *
 * It runs under vitest, as E31. Its test, `pitch-in-cells.test.ts`, holds
 * what it found;
 * `E32_REPORT=1 pnpm vitest run --silent=false packages/score/experiments/pitch-in-cells.test.ts`
 * prints the table and a witness bar's texts.
 */

import {
  presetMode,
  BAR_STEPS,
  type BandBar,
  type BandCarried,
  type BandEnv,
  type Key,
  PRESETS,
  SONG_METER,
  band,
  chordNumeral,
  slotStepOn,
  voicing,
  presetSwing,
} from '@jambot/engine';
import {
  CHORD_QUALITIES,
  type DiatonicModeName,
  type Numeral,
  chordScale,
  formatNumeral,
  joinChord,
  numeralOf,
  parseNote,
  parseNumeral,
  wrap,
} from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { SCALES } from '@yggi/cells/theory/modes';
import { TONAL_SCALES } from '@yggi/cells/theory/tonal';
import {
  BASS_INITIAL,
  type ScoreBar,
  type ScoreKey,
  compileBar,
  encodeBar,
  lowerNumeral,
} from '../src/score.ts';
import {
  CLOCK_OF_UNIT,
  PIN_VOICES,
  QUALITY_DEGREES,
  type Tone,
  chordTones,
  degreeText,
  keyText,
  numeralOfNotes,
  pinTone,
  rhythmText,
  scoreKeyHelix,
  stackText,
} from '../src/section-text.ts';

/** The key, the stacks and the pins E32 found, which the section's builder holds (`../src/section-text.ts`). */
export {
  PIN_VOICES,
  QUALITY_DEGREES,
  type PinVoice,
  type Tone,
  chordTones,
  degreeText,
  keyText,
  numeralOfNotes,
  pinNote,
  pinTone,
  rhythmText,
} from '../src/section-text.ts';

/** The run every bar comes from: each preset held, as E31's. */
export const SEED = 0;
export const ENTROPY = 0.3;
export const BARS = 32;

/** What a bar's harmony states: the score's `key=`, `harm`, `next` and `frame`, as data. */
export interface Harmony {
  readonly key: ScoreKey;
  readonly chords: readonly { readonly step: number; readonly numeral: Numeral }[];
  /** The next bar's first chord, in its own key, where a stab plays it. */
  readonly next?: { readonly key: ScoreKey; readonly numeral: Numeral };
  /** The comp's voicing before the bar (MIDI notes), and the bass's register where it is not E2 (40). */
  readonly frame?: { readonly comp?: readonly number[]; readonly bass?: number };
}

/** A bar the band played, with what it carried in and the key of the bar after. */
export interface Played {
  readonly preset: string;
  readonly env: BandEnv;
  readonly before: BandCarried;
  readonly bar: BandBar;
  readonly nextKey: Key;
}

/** Every bar of every preset held: 8 × 32, each run one bar longer for the key the last leads into. */
export function playedBars(): Played[] {
  return PRESETS.flatMap((preset) => {
    let carried: BandCarried = band.initial;
    const runs = Array.from({ length: BARS + 1 }, (_, bar) => {
      const env: BandEnv = {
        seed: SEED,
        bar,
        style: { ...preset.style, entropy: ENTROPY },
        swing: presetSwing(preset)!,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        offer: null,
      };
      const before = carried;
      const out = band.advance(env, before, null);
      carried = out.carried;
      return { env, before, bar: out.output };
    });
    return runs.slice(0, BARS).map((run, i): Played => ({
      preset: preset.name,
      ...run,
      nextKey: runs[i + 1]!.bar.plan.key,
    }));
  });
}

/** A part's notes at each step it sounds, low to high. */
const hitsOf = (bar: BandBar, part: 'pad' | 'stab') => {
  const byStep = new Map<number, number[]>();
  for (const note of bar.written)
    if (note.part === part) byStep.set(note.step, [...(byStep.get(note.step) ?? []), note.note]);
  return [...byStep].map(([step, notes]) => ({ step, notes: notes.sort((a, b) => a - b) }));
};

/**
 * The bar as the score states it, as the seam's test builds it (`seam.test.ts`),
 * its drums left out: what `encodeBar` writes the baseline from.
 */
export function scoreBarOf({ bar, before, nextKey }: Played): ScoreBar {
  if (bar.meter !== SONG_METER) throw new Error(`bar ${bar.bar}: only 4/4 is written`);
  const key = bar.plan.key;
  const pad = hitsOf(bar, 'pad');
  const stab = hitsOf(bar, 'stab');
  let previous = before.parts.comp;
  const voiced = bar.chords.map((chord) => (previous = voicing(chord.chord, previous)));
  const leads = stab.some(
    (hit) =>
      hit.notes.join() !==
      voiced[
        bar.chords.findLastIndex((chord) => slotStepOn(bar.meter, chord.slot.step) <= hit.step)
      ]!.join(),
  );
  const coming = bar.next[0];
  const hasComp = pad.length > 0 || stab.length > 0;
  return {
    bar: bar.bar,
    section: bar.plan.section.type,
    key,
    theme: bar.plan.theme.kind,
    style: bar.style,
    harm: bar.chords.map((chord) => ({
      step: slotStepOn(bar.meter, chord.slot.step),
      numeral: parseNumeral(chordNumeral(chord, key))!,
    })),
    drums: {},
    bass: {
      register: before.parts.bass,
      notes: bar.written
        .filter((note) => note.part === 'bass')
        .map((note) => ({ step: note.step, note: note.note })),
    },
    ...(hasComp && before.parts.comp ? { voicing: before.parts.comp } : {}),
    ...(pad.length ? { pad } : {}),
    ...(stab.length ? { stab } : {}),
    ...(leads && coming
      ? { next: { key: nextKey, numeral: parseNumeral(chordNumeral(coming, nextKey))! } }
      : {}),
  };
}

/** What a score bar states of its harmony. */
export function harmonyOfScore(score: ScoreBar): Harmony {
  const comp = score.voicing;
  const bass = score.bass && score.bass.register !== BASS_INITIAL ? score.bass.register : undefined;
  return {
    key: score.key,
    chords: score.harm,
    ...(score.next ? { next: score.next } : {}),
    ...(comp || bass !== undefined
      ? { frame: { ...(comp ? { comp } : {}), ...(bass !== undefined ? { bass } : {}) } }
      : {}),
  };
}

/** A bar's harmony, as the band wrote it. */
export const harmonyOf = (played: Played): Harmony => harmonyOfScore(scoreBarOf(played));

const keyHelix = scoreKeyHelix;
const toneText = (t: Tone) => degreeText(t.degree, t.accidental);
const stack = stackText;

/** The pin's lines, shared by every candidate: `&frame` and `&frameBass`, where the score states one. */
function frameLines(h: Harmony): string[] {
  const { comp, bass } = h.frame ?? {};
  return [
    ...(comp ? [`&frame over=&key ${stack(comp.map((n) => pinTone(h.key, n, 'comp')))}`] : []),
    ...(bass !== undefined
      ? [`&frameBass over=&key ${toneText(pinTone(h.key, bass, 'bass'))}`]
      : []),
  ];
}

const sameKey = (a: ScoreKey, b: ScoreKey) => a.tonic === b.tonic && a.mode === b.mode;

/** What a `&next` line reads over: the bar's key, or the next bar's own. */
const nextOver = (h: Harmony) =>
  h.next && sameKey(h.next.key, h.key) ? '&key' : keyText(h.next!.key);

/** A candidate spelling: whether cells v0.9.0 parses it, how it writes a bar, and how it reads one back. */
export interface Candidate {
  readonly name: string;
  readonly parses: boolean;
  readonly write: (h: Harmony) => string;
  readonly read: (text: string) => Harmony;
}

const chordOf = (key: ScoreKey, numeral: Numeral) => lowerNumeral(key, numeral);

/** stacks: `&harm over=&key step=2n [0,2,4] [4,6#,8]`. */
function writeStacks(h: Harmony): string {
  const chordStack = (key: ScoreKey, numeral: Numeral) =>
    stack(chordTones(key, chordOf(key, numeral)));
  return [
    `&key ${keyText(h.key)}`,
    `&harm over=&key ${rhythmText(h.chords, (i) => chordStack(h.key, h.chords[i]!.numeral))}`,
    ...(h.next ? [`&next over=${nextOver(h)} ${chordStack(h.next.key, h.next.numeral)}`] : []),
    ...frameLines(h),
  ].join('\n');
}

/** shapes: `&c0 [0,2,4]`, `&c1 [0,2#,4]`, `&harm over=&key step=2n &c0 &c1^4`. */
function writeShapes(h: Harmony): string {
  const shapes: string[] = [];
  const moved = (key: ScoreKey, numeral: Numeral) => {
    const tones = chordTones(key, chordOf(key, numeral));
    const root = tones[0]!.degree;
    const shape = stack(tones.map((t) => ({ degree: t.degree - root, accidental: t.accidental })));
    if (!shapes.includes(shape)) shapes.push(shape);
    return `&c${shapes.indexOf(shape)}${root === 0 ? '' : `^${root}`}`;
  };
  const harm = rhythmText(h.chords, (i) => moved(h.key, h.chords[i]!.numeral));
  const next = h.next && moved(h.next.key, h.next.numeral);
  return [
    `&key ${keyText(h.key)}`,
    ...shapes.map((shape, i) => `&c${i} ${shape}`),
    `&harm over=&key ${harm}`,
    ...(next ? [`&next over=${nextOver(h)} ${next}`] : []),
    ...frameLines(h),
  ].join('\n');
}

/** numerals (a proposal): `&harm over=&key step=2n i V`. */
function writeNumerals(h: Harmony): string {
  return [
    `&key ${keyText(h.key)}`,
    `&harm over=&key ${rhythmText(h.chords, (i) => formatNumeral(h.chords[i]!.numeral))}`,
    ...(h.next ? [`&next over=${nextOver(h)} ${formatNumeral(h.next.numeral)}`] : []),
    ...frameLines(h),
  ].join('\n');
}

/** A numerals text lowered to cells v0.9.0 by the proposal's meaning: each numeral the stack it names. */
export const lowerNumerals = (text: string): string => writeStacks(readNumerals(text));

/** The key a `scale(mode, tonic)` states. */
function readKey(text: string): ScoreKey {
  const match = /^scale\((\w+), ([A-G][#b]*)\)$/u.exec(text);
  const tonic = match && parseNote(match[2]!);
  if (!tonic) throw new Error(`not a key: ${text}`);
  return { tonic: tonic.pitchClass, mode: match[1] as DiatonicModeName };
}

/** A text's lines by cell name. */
function linesOf(text: string): Map<string, string> {
  return new Map(
    text.split('\n').map((line) => {
      const [name, ...rest] = line.split(' ');
      return [name!.slice(1), rest.join(' ')] as const;
    }),
  );
}

/** The scaffold a reading plays a text's harmony through: each cell on a MIDI card of its own. */
const PLAYED_BY = [
  { cell: 'harm', channel: 1, voice: 'C4' },
  { cell: 'next', channel: 2, voice: 'C4' },
  { cell: 'frame', channel: 3, voice: PIN_VOICES.comp },
  { cell: 'frameBass', channel: 4, voice: PIN_VOICES.bass },
] as const;

/** The bpm the reading plays at: a step is an eighth of a second. */
const STEP_SECONDS = 0.125;

/** What a text plays, by cell: each onset's step and its MIDI notes, low to high; and what cells said. */
export function cellsPlays(text: string): {
  played: Map<string, { step: number; notes: number[] }[]>;
  diagnostics: string[];
} {
  const names = linesOf(text);
  const cards = PLAYED_BY.filter(({ cell }) => names.has(cell));
  // One MIDI card, its entries channels 1 to 4; a cell with no clock of its own is held for the bar.
  const full = [
    '&bar scan(1 1 1 1) step=120bpm',
    text,
    ...cards.flatMap(({ cell, channel, voice }) => [
      `&v${channel} loop=${voice}`,
      ...(cell === 'harm' ? [] : [`&p${channel} step=1m &${cell}`]),
    ]),
    `&out map=midi ${PLAYED_BY.map(({ cell, channel }) =>
      !names.has(cell) ? '~' : `[&${cell === 'harm' ? cell : `p${channel}`} * &v${channel}]`,
    ).join(' ')}`,
  ].join('\n');
  const plan = planOf(full);
  const route = router(plan.result, channelTable(plan.result));
  const played = new Map<string, Map<number, number[]>>();
  for (const e of windowAt(plan, 0, BAR_STEPS * STEP_SECONDS).events)
    for (const r of routesOf(route(e))) {
      const note = midiNote(e, r);
      if (!note) continue;
      const cell = cards.find((c) => c.channel === note.channel)?.cell;
      if (!cell) continue;
      const step = Math.round(note.at / STEP_SECONDS);
      const byStep = played.get(cell) ?? new Map<number, number[]>();
      byStep.set(step, [...(byStep.get(step) ?? []), note.note]);
      played.set(cell, byStep);
    }
  return {
    played: new Map(
      [...played].map(([cell, byStep]) => [
        cell,
        [...byStep]
          .sort(([a], [b]) => a - b)
          .map(([step, notes]) => ({ step, notes: notes.sort((a, b) => a - b) })),
      ]),
    ),
    diagnostics: plan.result.diagnostics.map((d) => d.message),
  };
}

/** The pins a text plays, back to MIDI notes: the voice and the key's degrees undone by cells. */
function readFrame(
  played: Map<string, { step: number; notes: number[] }[]>,
): Harmony['frame'] | undefined {
  const comp = played.get('frame')?.[0]?.notes;
  const bass = played.get('frameBass')?.[0]?.notes[0];
  if (!comp && bass === undefined) return undefined;
  return { ...(comp ? { comp } : {}), ...(bass !== undefined ? { bass } : {}) };
}

/** What a `&next` line is read over. */
const readNextKey = (rest: string, key: ScoreKey): ScoreKey => {
  const over = /^over=(&key|scale\([^)]*\))/u.exec(rest)![1]!;
  return over === '&key' ? key : readKey(over);
};

/** stacks and shapes are read back through cells: compiled, played, and each chord read in its key. */
function readThroughCells(text: string): Harmony {
  const lines = linesOf(text);
  const key = readKey(lines.get('key')!);
  const { played } = cellsPlays(text);
  const chords = (played.get('harm') ?? []).map(({ step, notes }) => ({
    step,
    numeral: numeralOfNotes(key, notes)!,
  }));
  const nextLine = lines.get('next');
  const nextKey = nextLine === undefined ? undefined : readNextKey(nextLine, key);
  const nextNotes = played.get('next')?.[0]?.notes;
  const frame = readFrame(played);
  return {
    key,
    chords,
    ...(nextKey && nextNotes
      ? { next: { key: nextKey, numeral: numeralOfNotes(nextKey, nextNotes)! } }
      : {}),
    ...(frame ? { frame } : {}),
  };
}

/** numerals are read by their tokens, the pins through cells. */
function readNumerals(text: string): Harmony {
  const lines = linesOf(text);
  const key = readKey(lines.get('key')!);
  const [, clock, braid] = /^over=&key step=(\S+) (.*)$/u.exec(lines.get('harm')!)!;
  const unit = Number(Object.entries(CLOCK_OF_UNIT).find(([, c]) => c === clock)![0]);
  let at = 0;
  const chords = braid!.split(' ').flatMap((word) => {
    const [token, weight] = word.split('@');
    const step = at;
    at += unit * Number(weight ?? 1);
    return token === '~' ? [] : [{ step, numeral: parseNumeral(token!)! }];
  });
  const nextLine = lines.get('next');
  const pins = text
    .split('\n')
    .filter((line) => line.startsWith('&key ') || line.startsWith('&frame'))
    .join('\n');
  const frame = pins.includes('&frame') ? readFrame(cellsPlays(pins).played) : undefined;
  return {
    key,
    chords,
    ...(nextLine
      ? {
          next: {
            key: readNextKey(nextLine, key),
            numeral: parseNumeral(nextLine.split(' ').at(-1)!)!,
          },
        }
      : {}),
    ...(frame ? { frame } : {}),
  };
}

export const CANDIDATES: readonly Candidate[] = [
  { name: 'stacks', parses: true, write: writeStacks, read: readThroughCells },
  { name: 'shapes', parses: true, write: writeShapes, read: readThroughCells },
  { name: 'numerals', parses: false, write: writeNumerals, read: readNumerals },
];

/** The score's own spelling of a bar's harmony: its header's `key=`, and its `harm`, `next` and `frame` lines. */
export function scoreText(score: ScoreBar): string {
  const [header, ...lines] = encodeBar(score).split('\n');
  return [
    / (key=\S+)/u.exec(header!)![1]!,
    ...lines.filter((line) => /^(harm|next|frame) /u.test(line)),
  ].join('\n');
}

/** Two harmonies the same, field by field. */
export const sameHarmony = (a: Harmony, b: Harmony) => JSON.stringify(a) === JSON.stringify(b);

/** One bar under every spelling: the score's and each candidate's text, and whether each read back the same. */
export interface Measured {
  readonly preset: string;
  readonly bar: number;
  readonly harmony: Harmony;
  readonly texts: Readonly<Record<string, string>>;
  readonly back: Readonly<Record<string, boolean>>;
}

/** Every bar, under the score's spelling and the three candidates. */
export function measure(played: readonly Played[] = playedBars()): Measured[] {
  return played.map((p) => {
    const score = scoreBarOf(p);
    const harmony = harmonyOfScore(score);
    const texts: Record<string, string> = { score: scoreText(score) };
    const back: Record<string, boolean> = {
      score: sameHarmony(harmonyOfScore(compileBar(encodeBar(score))), harmony),
    };
    for (const c of CANDIDATES) {
      texts[c.name] = c.write(harmony);
      back[c.name] = sameHarmony(c.read(texts[c.name]!), harmony);
    }
    return { preset: p.preset, bar: p.bar.bar, harmony, texts, back };
  });
}

/** The table: per spelling, its characters over every bar and the bars that read back exactly. */
export function table(measured: readonly Measured[]) {
  return ['score', ...CANDIDATES.map((c) => c.name)].map((name) => ({
    name,
    characters: measured.reduce((n, m) => n + m.texts[name]!.length, 0),
    exact: measured.filter((m) => m.back[name]).length,
  }));
}

/** Whether a chord is a secondary dominant: a numeral with a target. */
export const isSecondary = (numeral: Numeral) => numeral.of !== undefined;

/** A pitch class's name, as cells reads a tonic: `C`, `F#`, `Bb`. */
const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * The scale a chord implies (`chordScale`, U3) on the chord's root, and how a
 * cells line states it once: by one of cells' own names (`scale(mixolydian, D)`),
 * else by one of tonal's in Strudel's spelling (`scale("E:phrygian:dominant")`),
 * else as a scan of its steps. Undefined where the chord implies none.
 */
export function chordScaleText(
  key: ScoreKey,
  numeral: Numeral,
): { steps: number[]; root: number; by: 'cells' | 'tonal' | 'scan'; text: string } | undefined {
  const chord = lowerNumeral(key, numeral);
  const scale = chordScale(keyHelix(key), joinChord(chord));
  if (!scale) return undefined;
  const first = scale.heights[0]!;
  const steps = scale.heights.map((h, i) => (scale.heights[i + 1] ?? first + 12) - h);
  const root = wrap(first, 12);
  const same = (s: readonly number[]) => s.join() === steps.join();
  const cells = Object.entries(SCALES).find(([, s]) => same(s.steps))?.[0];
  const tonal = Object.entries(TONAL_SCALES).find(([, s]) => same(s))?.[0];
  if (cells) return { steps, root, by: 'cells', text: `scale(${cells}, ${PITCH_NAMES[root]})` };
  if (tonal)
    return {
      steps,
      root,
      by: 'tonal',
      text: `scale("${PITCH_NAMES[root]}:${tonal.replaceAll(' ', ':')}")`,
    };
  return { steps, root, by: 'scan', text: `scan(${steps.join(' ')}) shift=${root}` };
}

/** Where a spelling's characters go: the key, the chords (with the shapes and the next chord), the frame pin. */
export function breakdown(measured: readonly Measured[], name: string) {
  const sum = (kind: (line: string) => boolean) =>
    measured.reduce(
      (n, m) =>
        n +
        m.texts[name]!.split('\n')
          .filter(kind)
          .reduce((k, line) => k + line.length + 1, 0),
      0,
    );
  const isKey = (line: string) => line.startsWith('&key ') || line.startsWith('key=');
  const isFrame = (line: string) => line.startsWith('&frame') || line.startsWith('frame ');
  return {
    key: sum(isKey),
    chords: sum((line) => !isKey(line) && !isFrame(line)),
    frame: sum(isFrame),
  };
}

/**
 * The shapes candidate with its shapes stated once a preset instead of once a
 * bar, as a text of the whole run would: its characters less every bar's shape
 * lines, plus each preset's distinct shapes once.
 */
export function shapesOnce(measured: readonly Measured[]): number {
  const isShape = (line: string) => /^&c\d+ /u.test(line);
  const lines = (m: Measured) => m.texts.shapes!.split('\n');
  const perBar = measured.reduce(
    (n, m) =>
      n +
      lines(m)
        .filter(isShape)
        .reduce((k, line) => k + line.length + 1, 0),
    0,
  );
  const presets = [...new Set(measured.map((m) => m.preset))];
  const once = presets.reduce((n, preset) => {
    const shapes = new Set(
      measured
        .filter((m) => m.preset === preset)
        .flatMap((m) => lines(m).filter(isShape))
        .map((line) => line.split(' ')[1]!),
    );
    return n + [...shapes].reduce((k, shape, i) => k + `&c${i} ${shape}`.length + 1, 0);
  }, 0);
  const total = measured.reduce((n, m) => n + m.texts.shapes!.length, 0);
  return total - perBar + once;
}

/** Every numeral a key can be written with, of any root on or off the key: `numeralOf` over every root and quality. */
export function everyNumeral(key: ScoreKey): Numeral[] {
  const helix = keyHelix(key);
  return Array.from({ length: 12 }, (_, root) => root).flatMap((root) =>
    Object.keys(QUALITY_DEGREES).flatMap((quality) => {
      const numeral = numeralOf(helix, { root: wrap(key.tonic + root, 12), quality });
      return numeral ? [numeral] : [];
    }),
  );
}

/** The qualities a numeral can name: every one but the harmonic series. */
export const NUMERAL_QUALITIES = Object.keys(CHORD_QUALITIES).filter((q) => q !== 'harmonics');

/** A witness bar to read: the preset, the bar, and its texts. */
export function report(m: Measured): string {
  return [
    `${m.preset}, bar ${m.bar}: ${Object.entries(m.back)
      .map(([name, ok]) => `${name} ${ok ? 'exact' : 'differs'}`)
      .join(', ')}`,
    ...Object.entries(m.texts).flatMap(([name, text]) => [
      `  ${name} (${text.length} characters)`,
      ...text.split('\n').map((line) => `    ${line}`),
    ]),
  ].join('\n');
}
