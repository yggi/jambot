/**
 * E35: the band writes a whole section as one cells text, every part, the
 * lead as its notes, and plays it through the cells engine (#390; the seam,
 * #63; #358).
 *
 * E33 stated a bar; this states a section, its 8 bars (`SECTION_BARS`), as
 * one text: the host's lines once at the top, then each part a line per
 * sound or voice, open on them (yggi/cells decision 047: taps, a bare
 * `over=&key` for the main key, `over=&harm` for the chord in force).
 * Decision 047's union of lines (a line given twice is one line) is in
 * cells since v0.6.0 (`unionOf`), but the text is built directly, the host's
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
 * - the harmony once, `&harm over=&key step=1m [0,2,4] [3,5,7] …`, every
 *   chord the band writes in the section at its slot (E32's stacks), which
 *   nothing plays;
 * - the drums, a line a role on `16n` over the section's 128 steps (E31),
 *   the rim a Euclid token a bar on `1m` where the meter is straight
 *   (E33's gap 4);
 * - the bass, the pad and the stab, each a line on `16n` over the chord in
 *   force (`over=&harm`, as E33), a line with a note no index reaches over
 *   the key (`over=&key`), held `@k` for the written length and sounding
 *   its share of it (`legato=`), a line of shares where a line sounds more
 *   than one (`legato=&bassShare`: Swing jazz's breakdown bass, held 0.3 of
 *   a step short);
 * - the lead as its notes (yggi/cells#47, the owner's ruling of 2026-09-30,
 *   "A now, B as the goal"): the line it plays, as degrees over the plan's
 *   melodic scale from its voice, C4: over the key where the scale is the
 *   key's own (`plain`), else over the scale stated as a stack of the key's
 *   degrees, `&melo over=&key step=1m [0,2,3,4,6]` (a pentatonic, read as
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
 * The builder and the reading live in `../src/section-text.ts` and
 * `../src/section-play.ts`, which the app's shadow shares (#399); this file
 * holds the corpus, the measuring and the report, and names them as it did.
 *
 * It runs under vitest. Its test, `section-in-cells.test.ts`, holds seed 1
 * of every preset (8 runs, 512 bars, 64 sections) in `pnpm verify`, and the
 * whole corpus with `E35_FULL=1`;
 * `E35_REPORT=1 pnpm vitest run --silent=false packages/score/experiments/section-in-cells.test.ts`
 * prints the table and a witness section's text.
 */

import { type BandBar, type MelodicScale, PRESETS, SECTION_BARS } from '@jambot/engine';
import { type PlayedSection, bandChords, mismatches, playSection } from '../src/section-play.ts';
import {
  type NotePart,
  SECTION_PARTS,
  type SectionLine,
  type SectionNote,
  type SectionPart,
  type SectionText,
  sectionAsCells,
  sectionTextOf,
  statedChords,
  writtenNotes,
} from '../src/section-text.ts';
import { type Run, START, barAsCells, runOf, textOf as barTextOf } from './bar-in-cells.ts';

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

/** The parts compared, a note as composed or as cells plays it, a line, a cut and a section's text: the builder's (`../src/section-text.ts`). */
export {
  SECTION_PARTS as PARTS,
  type SectionPart,
  type NotePart,
  type SectionNote as Note,
  type SectionLine as Line,
  type PitchTable,
  type PitchedLine,
  type SectionCut as Cut,
  type SectionText,
  type Statement,
  sectionTextOf as textOf,
  writtenNotes,
  hostOf,
  melodicTones,
  sectionAsCells,
} from '../src/section-text.ts';
/** What a section's text plays through cells, and where two lists of notes part: the reading's (`../src/section-play.ts`). */
export {
  type HeardChord,
  type PlayedSection as Played,
  bandChords,
  playSection as cellsPlays,
  mismatches,
} from '../src/section-play.ts';

/** Within a millionth of a step. */
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

const plain = ({ part, step, note, velocity, written, length }: SectionNote): SectionNote => ({
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
  readonly played: PlayedSection;
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
    const played = playSection(edit(sectionTextOf(text)), bars);
    const offsets: number[] = [];
    let unmatched = 0;
    const measured = bars.map((bar, i): MeasuredBar => {
      const band = writtenNotes(bar).map(plain);
      const cells = played.bars[i]!.notes;
      const of = (notes: readonly SectionNote[], part: NotePart) =>
        notes.filter((n) => n.part === part);
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
  texts: readonly { readonly lines: readonly SectionLine[] }[],
): Record<SectionLine['part'] | 'total', number> {
  const out: Record<string, number> = { total: 0 };
  for (const t of texts)
    for (const line of t.lines) {
      out[line.part] = (out[line.part] ?? 0) + line.text.length + 1;
      out.total! += line.text.length + 1;
    }
  return out as Record<SectionLine['part'] | 'total', number>;
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
      equal: Object.fromEntries(
        SECTION_PARTS.map((p) => [p, bars.filter((m) => m.equal[p]).length]),
      ),
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
    `${s.run.preset} seed ${s.run.seed}, section ${s.section}: ${SECTION_PARTS.map((p) => `${p} ${s.measured.filter((m) => m.equal[p]).length}/${s.measured.length}`).join(', ')}`,
    ...sectionTextOf(s.text)
      .split('\n')
      .map((line) => `  ${line}`),
  ].join('\n');
}
