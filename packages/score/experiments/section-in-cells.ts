/**
 * E35: the band writes a whole section as one cells text, every part, the
 * lead as its notes, and plays it through the cells engine (#390; the seam,
 * #63; #358).
 *
 * E33 stated a bar; this states a section, its 8 bars (`SECTION_BARS`), as
 * one text: the host's lines once at the top, then each part a line per
 * sound or voice, open on them (yggi/cells decision 047: taps, a bare
 * `over=key` for the main key, `over=&harm` for the chord in force).
 * Decision 047's union of lines (a line given twice is one line) is in
 * cells v0.6.0 (`unionOf`), but the text is built directly, the host's
 * lines given once, until a later rung builds sections by union; each part with the host's lines alone is a fragment
 * that plays as it does in the whole (the test shows it). The
 * corpus is E28's: every preset held at entropy 0.3, seeds 1 to 5, 64 bars
 * each, through the band's own transport in 4/4 (40 runs, 2,560 bars, 320
 * sections).
 *
 * The text, one section:
 *
 * - the host's lines, stated once: the meter with the section's tempo and
 *   swing (`&bar meter("4/4") step=84bpm swing=16n:.65`, as E33) and the
 *   key (`&key scale(aeolian, A)`); the plan holds both, and the melodic
 *   scale, for the section's 8 bars, so each is one line (the builder
 *   refuses a section whose bars part on any of them);
 * - the harmony once, `&harm over=key step=1m [0,2,4] [3,5,7] …`, every
 *   chord the band writes in the section at its slot (E32's stacks), which
 *   nothing plays;
 * - the drums, a line a role on `16n` over the section's 128 steps (E31),
 *   the rim a Euclid token a bar on `1m` where the meter is straight
 *   (E33's gap 4);
 * - the bass, the pad and the stab, each a line on `16n` over the chord in
 *   force (`over=&harm`, as E33), a line with a note no index reaches over
 *   the key (`over=key`), held `@k` for the written length and sounding
 *   its share of it (`legato=`), a line of shares where a line sounds more
 *   than one (`legato=&bassShare`: Swing jazz's breakdown bass, held 0.3 of
 *   a step short);
 * - the lead as its notes (yggi/cells#47, the owner's ruling of 2026-09-30,
 *   "A now, B as the goal"): the line it plays, as degrees over the plan's
 *   melodic scale from its voice, C4: over the key where the scale is the
 *   key's own (`plain`), else over the scale stated as a stack of the key's
 *   degrees, `&melo over=key step=1m [0,2,3,4,6]` (a pentatonic, read as
 *   the chord in force is, a lap the key's seven degrees); no cell or
 *   operator is named yet;
 * - velocities through a gate, a line of levels or one gain (E33), and one
 *   MIDI card on Jambot's channels: 1 the lead, 2 the bass, 3 the pad and
 *   the stab, 10 the drums.
 *
 * What is compared is the written layer (#390's Q1a): each note's step,
 * pitch, velocity (the performer's at feel 0, as E33) and written length,
 * read off what cells plays: a note's written span is its sounding span,
 * read as steps through the swing undone, over the share its line reads at
 * its onset (cells' own `legato=` tracks), since cells sounds a share of the
 * written steps and swings its end as its onset (v0.6.0, yggi/cells#120); and
 * each chord's step and notes (its pitch classes). The sounding length and
 * the chord's numeral read back, which E33 compared, are measured too.
 *
 * The reading plays `&harm` itself, as E33's does: a table that also plays
 * turns for the lines read through it (cells v0.6.0, yggi/cells#167).
 *
 * It runs under vitest. Its test, `section-in-cells.test.ts`, holds seed 1
 * of every preset (8 runs, 512 bars, 64 sections) in `pnpm verify`, and the
 * whole corpus with `E35_FULL=1`;
 * `E35_REPORT=1 pnpm vitest run --silent=false packages/score/experiments/section-in-cells.test.ts`
 * prints the table and a witness section's text.
 */

import {
  type BandBar,
  DRUM_ROLES,
  type DrumRole,
  type Key,
  type MelodicScale,
  PRESETS,
  SECTION_BARS,
  STRAIGHT,
  baseLengthOf,
  baseVelocityOf,
  keyHelix,
  leanMap,
  leansOf,
  melodicHelix,
  stepSeconds,
} from '@jambot/engine';
import {
  alteredDegree,
  diatonicMode,
  formatNumeral,
  joinChord,
  parseNumeral,
  stepsOf,
} from '@jambot/theory';
import { type Plan, planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { heldAt } from '@yggi/cells/engine/series';
import { type ScoreKey, lowerNumeral } from '../src/score.ts';
import {
  type Run,
  START,
  type StatedChord,
  barAsCells,
  indexOf,
  meterName,
  runOf,
  statedChords,
  swingText,
  textOf as barTextOf,
} from './bar-in-cells.ts';
import { VOICE_OF_NOTE, euclidOf, levelOf } from './drums-in-cells.ts';
import {
  PIN_VOICES,
  type PinVoice,
  type Tone,
  chordTones,
  degreeText,
  keyText,
  numeralOfNotes,
  pinTone,
  rhythmText,
} from './pitch-in-cells.ts';

/** The corpus, E28's: every preset at entropy 0.3 (E33's runs), seeds 1 to 5, 64 bars. */
export const SEEDS: readonly number[] = [1, 2, 3, 4, 5];
export const BARS = 64;

/** The seeds the quick test runs: seed 1 of every preset, 512 bars and 64 sections. */
export const QUICK_SEEDS: readonly number[] = [1];

/** One run of the corpus: a preset held, at a seed; in 4/4, with the melodic scale the style defaults to unless asked. */
export interface CorpusRun {
  readonly preset: string;
  readonly seed: number;
  readonly melodic?: MelodicScale;
}

/** Every run of the corpus, preset by preset. */
export const RUNS: readonly CorpusRun[] = PRESETS.flatMap((p) =>
  SEEDS.map((seed) => ({ preset: p.name, seed })),
);

/** The band's transport over a run: E33's, at the run's seed, for 64 bars. */
export const bandRun = ({ preset, seed, melodic }: CorpusRun): Run =>
  runOf({ preset, meter: '4/4', seed, barCount: BARS, ...(melodic ? { melodic } : {}) });

/** The parts compared: the band's channels, the comp being the pad and the stab on one; and the harmony. */
export const PARTS = ['drums', 'bass', 'comp', 'harmony', 'lead'] as const;
export type SectionPart = (typeof PARTS)[number];
export type NotePart = Exclude<SectionPart, 'harmony'>;

const CHANNEL_OF: Readonly<Record<NotePart, number>> = { lead: 1, bass: 2, comp: 3, drums: 10 };

/** A pitched line of the text: one per sound. */
type PitchedName = 'bass' | 'pad' | 'stab' | 'lead';

/** A note as composed or as cells plays it: its part, step in its bar, MIDI note, velocity, written and sounding length in steps. */
export interface Note {
  readonly part: NotePart;
  readonly step: number;
  readonly note: number;
  readonly velocity: number;
  readonly written: number;
  readonly length: number;
}

/** A note as composed, with the line that states it and, for the drums, its role. */
interface Composed extends Note {
  readonly line: PitchedName | 'drums';
  readonly role?: DrumRole;
}

const clampVelocity = (v: number) => Math.max(1, Math.min(127, Math.round(v)));

const sortNotes = <N extends Note>(notes: readonly N[]): N[] =>
  [...notes].sort((a, b) => a.part.localeCompare(b.part) || a.step - b.step || a.note - b.note);

/** A bar's written notes, every part: the step, pitch, velocity at feel 0, written and articulated length. */
export function writtenNotes(bar: BandBar): Composed[] {
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
export interface Line {
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
export interface Cut {
  readonly line: PitchedName;
  readonly step: number;
  readonly written: number;
  readonly stated: number;
}

/** A section as one cells text: its lines, the table each pitched line reads, and what it had to cut. */
export interface SectionText {
  readonly lines: readonly Line[];
  readonly pitched: readonly PitchedLine[];
  readonly cuts: readonly Cut[];
}

export const textOf = (s: SectionText) => s.lines.map((l) => l.text).join('\n');

/** A held token: `x`, or `x@k` for k steps. */
const held = (text: string, length: number) => (length === 1 ? text : `${text}@${length}`);

/** A number as the text writes it: no leading 0, twelve significant digits at most. */
const numberText = (x: number) => String(Number(x.toPrecision(12))).replace(/^0\./, '.');

/** What a section's bars share, stated once at its top: it throws at the first bar that parts on any of it. */
export function hostOf(bars: readonly BandBar[]): {
  meter: string;
  bpm: number;
  swing: string;
  key: string;
  melodic: MelodicScale;
} {
  const each = bars.map((bar) => ({
    meter: meterName(bar),
    bpm: bar.style.bpm,
    swing: swingText(bar.swing),
    key: keyText(bar.plan.key),
    melodic: bar.plan.melodic,
  }));
  for (const [i, h] of each.entries())
    for (const field of ['meter', 'bpm', 'swing', 'key', 'melodic'] as const)
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

/** A stack of tones as cells writes it. */
const stackText = (tones: readonly Tone[]) =>
  `[${tones.map((t) => degreeText(t.degree, t.accidental)).join(',')}]`;

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
type Placed = Composed & { readonly at: number };

/**
 * The drums: a line a role on 16ths over the section, the rim a Euclid token
 * a bar on `1m` where `euclid` allows and each bar's rim is one; and the
 * mix's terms and the voices.
 */
function drumLines(
  notes: readonly Placed[],
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
  notes: readonly Placed[],
  key: ScoreKey,
  total: number,
  voice: PinVoice,
  table: (at: number) => readonly Tone[] | null,
  asked: PitchTable,
  cuts: Cut[],
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

/** How a section is stated: the rim as Euclids or a line, and the tables the pitched lines read. */
export interface Statement {
  readonly euclid?: boolean;
  /** The table the bass and the comp read: the chord in force (E33's), or the key. */
  readonly table?: 'harm' | 'key';
  /** The table the lead reads: its melodic scale (the key where that is the key's own), or the key. */
  readonly lead?: 'melo' | 'key';
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
  }: Statement = {},
): SectionText {
  const host = hostOf(bars);
  const key = bars[0]!.plan.key;
  const steps = stepsOf(bars[0]!.meter);
  const total = bars.length * steps;
  const notes: Placed[] = bars.flatMap((bar, i) =>
    writtenNotes(bar).map((n) => ({ ...n, at: i * steps + n.step })),
  );
  const cuts: Cut[] = [];
  const pitched: PitchedLine[] = [];
  const chords = sectionChords(bars, steps);
  const chordStack = (numeral: string) =>
    chordTones(key, lowerNumeral(key, parseNumeral(numeral)!));
  const lines: Line[] = [
    { part: 'meter', text: `&bar meter("${host.meter}") step=${host.bpm}bpm${host.swing}` },
    { part: 'key', text: `&key ${host.key}` },
    {
      part: 'harmony',
      text: `&harm over=key ${rhythmText(chords, (i) => stackText(chordStack(chords[i]!.numeral)), total)}`,
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

/** A chord as the harmony states it: its step, its numeral, and its notes as pitch classes, low to high. */
export interface HeardChord extends StatedChord {
  readonly pitchClasses: readonly number[];
}

const pitchClassesOf = (notes: readonly number[]) =>
  [...new Set(notes.map((n) => ((n % 12) + 12) % 12))].sort((a, b) => a - b);

/** A bar's chords as the band writes them: each one's step, numeral and pitch classes. */
export const bandChords = (bar: BandBar): HeardChord[] =>
  statedChords(bar).map((c, i) => ({
    ...c,
    pitchClasses: pitchClassesOf(joinChord(bar.chords[i]!.chord)),
  }));

/** What a section's text plays through cells: its notes and chords bar by bar, each bar's length, and what cells said. */
export interface Played {
  /** Each bar's notes, in the order of `sortNotes`, with each one's onset in seconds from the section's start and the share of its held length it sounds. */
  readonly bars: readonly {
    readonly notes: Note[];
    readonly at: number[];
    readonly shares: number[];
  }[];
  readonly chords: readonly HeardChord[][];
  /** Where each bar starts and the section ends, in seconds: where its `1m` tap comes round. */
  readonly laps: readonly number[];
  readonly diagnostics: string[];
}

/**
 * The reading's own lines, not counted: each bar's lap and the harmony, each on a channel of its own (15 and 16).
 * The harmony heard is `&harm` itself: a played table turns for the lines read through it (cells v0.6.0, yggi/cells#167).
 */
const READING = [
  '&lap step=1m 0',
  '&readV loop=C4',
  '&read map=midi ~!14 [&lap * &readV] [&harm * &readV]',
].join('\n');

/** The share of its held length a note sounds, as cells reads its line's `legato=` at its onset. */
function shareOf(plan: Plan, output: string | undefined, at: number): number {
  const track = plan.tracks.find((t) => t.output.id === output);
  if (!track) return 1;
  const l = track.share;
  if (typeof l === 'number') return l;
  const x = l.series.reduce((a, m) => {
    const e = heldAt(plan, m, at);
    return a * (e ? e.value + e.alter : 1);
  }, 1);
  return l.range ? l.range[0] + (l.range[1] - l.range[0]) * x : x;
}

/**
 * A section's text played through cells' MIDI out, read back bar by bar.
 * Each time is read as a step of its bar through the band's swing undone
 * (`leanMap`'s `written`), and a note's written length as its sounding
 * length in those steps over the share its line reads at its onset.
 */
export function cellsPlays(text: string, bars: readonly BandBar[]): Played {
  const steps = stepsOf(bars[0]!.meter);
  const estimate = bars.length * steps * stepSeconds(bars[0]!.style.bpm, bars[0]!.meter);
  const plan = planOf(`${text}\n${READING}`);
  const route = router(plan.result, channelTable(plan.result));
  const out = windowAt(plan, 0, estimate * 1.25).events.flatMap((e) =>
    routesOf(route(e)).flatMap((r) => {
      const n = midiNote(e, r);
      return n ? [{ ...n, share: shareOf(plan, e.output, e.at) }] : [];
    }),
  );
  const laps = [...new Set(out.filter((n) => n.channel === 15).map((n) => n.at))]
    .sort((a, b) => a - b)
    .slice(0, bars.length + 1);
  const end = laps[bars.length]!;
  const barOf = (at: number) => laps.findLastIndex((l) => l <= at + 1e-9);
  const read = bars.map(() => ({ timed: [] as { note: Note; at: number; share: number }[] }));
  const harmony = bars.map(() => new Map<number, number[]>());
  for (const n of out) {
    if (n.at >= end - 1e-9) continue;
    const i = barOf(n.at);
    const bar = bars[i]!;
    const from = laps[i]!;
    const step = (laps[i + 1]! - from) / steps;
    if (n.channel === 16) {
      const s = Math.round((n.at - from) / step);
      harmony[i]!.set(s, [...(harmony[i]!.get(s) ?? []), n.note]);
      continue;
    }
    const part = (Object.keys(CHANNEL_OF) as NotePart[]).find((p) => CHANNEL_OF[p] === n.channel);
    if (!part) continue;
    const unswung = leanMap(leansOf(bar.swing), bar.meter);
    const stepOf = (seconds: number) => unswung.written((seconds - from) / step);
    const onset = stepOf(n.at);
    read[i]!.timed.push({
      at: n.at,
      share: n.share,
      note: {
        part,
        step: onset,
        note: n.note,
        velocity: n.velocity,
        written: (stepOf(n.end) - onset) / n.share,
        length: stepOf(n.end) - onset,
      },
    });
  }
  return {
    bars: read.map(({ timed }) => {
      timed.sort(
        (a, b) =>
          a.note.part.localeCompare(b.note.part) ||
          a.note.step - b.note.step ||
          a.note.note - b.note.note,
      );
      return {
        notes: timed.map((t) => t.note),
        at: timed.map((t) => t.at),
        shares: timed.map((t) => t.share),
      };
    }),
    chords: harmony.map((h, i) =>
      [...h]
        .sort(([a], [b]) => a - b)
        .map(([s, notes]) => {
          const numeral = numeralOfNotes(
            bars[i]!.plan.key,
            notes.sort((a, b) => a - b),
          );
          return {
            step: s,
            numeral: numeral ? formatNumeral(numeral) : '?',
            pitchClasses: pitchClassesOf(notes),
          };
        }),
    ),
    laps,
    diagnostics: plan.result.diagnostics.map((d) => d.message),
  };
}

/** Within a millionth of a step. */
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Where two lists of a part's notes part on the written layer (step, pitch, velocity, written length), one line each; with `sounding`, on the sounding length too. */
export function mismatches(
  band: readonly Note[],
  cells: readonly Note[],
  sounding = false,
): string[] {
  const [left, right] = [sortNotes(band), sortNotes(cells)];
  const out =
    left.length === right.length
      ? []
      : [`${left.length} notes in the band, ${right.length} in cells`];
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const [a, b] = [left[i]!, right[i]!];
    if (
      a.part !== b.part ||
      a.note !== b.note ||
      !same(a.step, b.step) ||
      !same(a.written, b.written) ||
      a.velocity !== b.velocity ||
      (sounding && !same(a.length, b.length))
    )
      out.push(`band ${JSON.stringify(a)}, cells ${JSON.stringify(b)}`);
  }
  return out;
}

const plain = ({ part, step, note, velocity, written, length }: Note): Note => ({
  part,
  step,
  note,
  velocity,
  written,
  length,
});

/** One bar of a section measured: per part whether it is the band's, on the written layer and with its sounding lengths. */
export interface MeasuredBar {
  readonly run: CorpusRun;
  readonly bar: BandBar;
  readonly section: number;
  /** Per part, the band's notes on the written layer; the harmony's, each chord's step and pitch classes. */
  readonly equal: Readonly<Record<SectionPart, boolean>>;
  /** Whether each chord reads back as the numeral the band wrote: its function too (E33's harmony bound). */
  readonly functions: boolean;
  /** The bass, comp and lead with their sounding lengths too (E33's bound). */
  readonly sounding: Readonly<Record<Exclude<NotePart, 'drums'>, boolean>>;
  readonly mismatches: Readonly<Record<NotePart, string[]>>;
  readonly notes: number;
}

/** One section measured: its text, what cells played, its bars, and each onset's distance from the transport's. */
export interface MeasuredSection {
  readonly run: CorpusRun;
  readonly section: number;
  readonly bars: readonly BandBar[];
  readonly text: SectionText;
  readonly played: Played;
  readonly measured: readonly MeasuredBar[];
  /** Each onset's distance from the transport's, in seconds. */
  readonly offsets: readonly number[];
  /** How many notes cells played that meet no onset of the band's. */
  readonly unmatched: number;
}

/** Every section of a run, stated, played (its text edited first, if asked) and compared; its onsets timed against the transport's. */
export function measureRun(
  key: CorpusRun,
  run: Run = bandRun(key),
  edit: (text: string) => string = (t) => t,
  state: (bars: readonly BandBar[]) => SectionText = (bars) => sectionAsCells(bars),
): MeasuredSection[] {
  const sections: MeasuredSection[] = [];
  let cellsStart = 0;
  for (let s = 0; s * SECTION_BARS < run.bars.length; s++) {
    const bars = run.bars.slice(s * SECTION_BARS, (s + 1) * SECTION_BARS);
    const text = state(bars);
    const played = cellsPlays(edit(textOf(text)), bars);
    const offsets: number[] = [];
    let unmatched = 0;
    const measured = bars.map((bar, i): MeasuredBar => {
      const band = writtenNotes(bar).map(plain);
      const cells = played.bars[i]!.notes;
      const of = (notes: readonly Note[], part: NotePart) => notes.filter((n) => n.part === part);
      const found = Object.fromEntries(
        (['drums', 'bass', 'comp', 'lead'] as const).map((p) => [
          p,
          mismatches(of(band, p), of(cells, p)),
        ]),
      ) as Record<NotePart, string[]>;
      for (const [j, n] of cells.entries()) {
        const event = run.events.find(
          (e) =>
            e.bar === bar.bar &&
            (n.part === 'comp'
              ? e.event.part === 'pad' || e.event.part === 'stab'
              : e.event.part === n.part) &&
            e.event.note === n.note &&
            same(e.event.step, n.step),
        );
        if (event) offsets.push(cellsStart + played.bars[i]!.at[j]! - (event.seconds - START));
        else unmatched++;
      }
      return {
        run: key,
        bar,
        section: s,
        equal: {
          drums: found.drums.length === 0,
          bass: found.bass.length === 0,
          comp: found.comp.length === 0,
          lead: found.lead.length === 0,
          harmony:
            JSON.stringify(played.chords[i]!.map((c) => [c.step, c.pitchClasses])) ===
            JSON.stringify(bandChords(bar).map((c) => [c.step, c.pitchClasses])),
        },
        functions:
          JSON.stringify(played.chords[i]!.map((c) => [c.step, c.numeral])) ===
          JSON.stringify(statedChords(bar).map((c) => [c.step, c.numeral])),
        sounding: {
          bass: mismatches(of(band, 'bass'), of(cells, 'bass'), true).length === 0,
          comp: mismatches(of(band, 'comp'), of(cells, 'comp'), true).length === 0,
          lead: mismatches(of(band, 'lead'), of(cells, 'lead'), true).length === 0,
        },
        mismatches: found,
        notes: band.length,
      };
    });
    sections.push({ run: key, section: s, bars, text, played, measured, offsets, unmatched });
    cellsStart += played.laps[bars.length]!;
  }
  return sections;
}

/** Characters by part over some texts, each line with its newline. */
export function characters(
  texts: readonly { readonly lines: readonly Line[] }[],
): Record<Line['part'] | 'total', number> {
  const out: Record<string, number> = { total: 0 };
  for (const t of texts)
    for (const line of t.lines) {
      out[line.part] = (out[line.part] ?? 0) + line.text.length + 1;
      out.total! += line.text.length + 1;
    }
  return out as Record<Line['part'] | 'total', number>;
}

/** The same 8 bars as E33 states them, each its own text, and their characters together. */
export const barCharacters = (bars: readonly BandBar[]) =>
  bars.reduce((n, bar) => n + barTextOf(barAsCells(bar)).length + 1, 0);

/** A run's row: bars equal per part, sections, onsets timed and within 1 ms, the largest distance, and characters against E33's bars. */
export function table(sections: readonly MeasuredSection[], runs: readonly CorpusRun[]) {
  return runs.map((run) => {
    const own = sections.filter((s) => s.run.preset === run.preset && s.run.seed === run.seed);
    const bars = own.flatMap((s) => s.measured);
    const offsets = own.flatMap((s) => s.offsets);
    const chars = characters(own.map((s) => s.text));
    return {
      preset: run.preset,
      seed: run.seed,
      sections: own.length,
      bars: bars.length,
      equal: Object.fromEntries(PARTS.map((p) => [p, bars.filter((m) => m.equal[p]).length])),
      timed: offsets.length,
      within1ms: offsets.filter((o) => Math.abs(o) < 0.001).length,
      largest: offsets.reduce((a, o) => Math.max(a, Math.abs(o)), 0),
      characters: chars.total,
      withoutLead: chars.total - (chars.lead ?? 0),
      e33: own.reduce((n, s) => n + barCharacters(s.bars), 0),
    };
  });
}

/** A section to read: the run, the section, what is equal, and its text. */
export function report(s: MeasuredSection): string {
  return [
    `${s.run.preset} seed ${s.run.seed}, section ${s.section}: ${PARTS.map((p) => `${p} ${s.measured.filter((m) => m.equal[p]).length}/${s.measured.length}`).join(', ')}`,
    ...textOf(s.text)
      .split('\n')
      .map((line) => `  ${line}`),
  ].join('\n');
}
