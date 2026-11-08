/**
 * The Muse's ear for lead lines (#424): what a source played as a lead over
 * a section, as degrees of the key counted from its first note, distilled
 * into one bar, which the composer files in the learned layer (`facet.ts`'s
 * `filedHeard`; stated as cells text by `lead-lines.ts`'s `leadText`), as
 * her ear for bass lines does (`muse-line.ts`).
 *
 * A source is the band's lead, on a section where the composer found no
 * lead line and the lead played its own (`SOLOIST`), or a player: each
 * motif the Muse judged in a bar (U4, `judgeBar`), her own players' and
 * those a session's clients judged and sent, of a source she didn't hear as
 * a bass in that bar (`heardBass`), since a bass line is filed as one. One
 * path takes both:
 *
 * - **a bar's notes as a line** (`leadOf`, `motifNotes`): each note's step,
 *   and its degree of the key counted from the first note's, altered where
 *   it is off the key, as the Muse judges a motif (the top note on a step).
 *   A motif's rests aren't kept: the lead holds each note to the next.
 * - **distilled** (`distilledLead`): the section's recurring phrase, the
 *   pattern of notes its phrases play most often, as the first that plays
 *   it; ties to the longer, then the earlier. A phrase is a source's bars in a
 *   row, joined by where each bar's first note sits in the key (its
 *   judgement's `origin`, #580 rung 3), up to `PHRASE_BARS` of them, and a
 *   phrase that plays one part again and again is that part
 *   (`phrasesOfLead`). A bar heard without an origin (from a client of
 *   protocol 20 or before, or the lead's own) is a phrase of its own, so a
 *   section of those is distilled to its recurring bar, as it always was. A
 *   bar of fewer than `LEAD_FEWEST` notes is no line, as the Muse hears no
 *   motif in one, and ends a phrase.
 */

import { type Motif, alteredDegree } from '@jambot/theory';
import { decompose } from '@yggi/cells/repository/decompose';
import { type Key, keyHelix } from './key.ts';
import type { LeadNote } from './lead-query.ts';
import { type Judgement, MUSE } from './muse.ts';

/** The lead's source, as a line it played on a miss is filed (#424), as the bass's is `BASSIST`. */
export const SOLOIST = 'soloist';

/** The fewest notes a bar holds to be a lead line: the fewest the Muse hears a motif in (`MUSE.fewest`, 3). */
export const LEAD_FEWEST = MUSE.fewest;

/** A note as the Muse hears a lead: its step in the bar and its pitch. */
export interface LeadStep {
  readonly step: number;
  readonly note: number;
}

/**
 * A bar's notes as a lead line in a key: the top note on each step, in
 * order, each its degree of the key counted from the first's, altered as a
 * numeral writes a root off the key (`alteredDegree`).
 */
export function leadOf(notes: readonly LeadStep[], key: Key): LeadNote[] {
  const top = new Map<number, number>();
  for (const { step, note } of notes)
    if (!top.has(step) || note > top.get(step)!) top.set(step, note);
  const melody = [...top.entries()].sort(([a], [b]) => a - b);
  if (!melody.length) return [];
  const scale = keyHelix(key);
  const origin = alteredDegree(scale, melody[0]![1])!.degree;
  return melody.map(([step, note]) => {
    const { degree, accidental } = alteredDegree(scale, note)!;
    return { step, degree: degree - origin, alter: accidental };
  });
}

/** A judged motif's notes as a lead line: each note's onset, degree and accidental, its rests left out. */
export const motifNotes = (motif: Motif): LeadNote[] =>
  motif.onsets.flatMap((step, i) => {
    const degree = motif.degrees[i];
    return degree === null || degree === undefined
      ? []
      : [{ step, degree, alter: motif.accidentals[i] ?? 0 }];
  });

/** A line's pattern: its notes' steps, degrees and accidentals, in order. */
const patternOf = (notes: readonly LeadNote[]) =>
  notes.map((n) => `${n.step}:${n.degree}:${n.alter}`).join(' ');

/** The most bars a phrase the Muse files holds (#580, rung 3): four, a phrase of the lead's own (`lead.ts`). */
export const PHRASE_BARS = 4;

/**
 * A bar of a lead a source played, as the Muse keeps it for the section's end: which bar, its notes as she judged
 * them (each degree counted from the bar's first note) and where that first note sits in the key, where its judgement
 * said (`origin`).
 */
export interface LeadBar {
  readonly bar: number;
  readonly origin?: number | undefined;
  readonly notes: readonly LeadNote[];
  /** How sure the Muse's reading of the bar was (its judgement's `confidence`), 1 where it didn't say. */
  readonly confidence?: number | undefined;
}

/**
 * How many notes two playings of a bar may differ by and still be one bar played again (#580, rung 3): two, a note
 * slipped to a neighbouring place counting as one gone and one come. A phrase played twice confirms itself (#204's
 * ruling), so a slip in one playing is outvoted by the other, the surer reading kept.
 */
export const PHRASE_SLIPS = 2;

/** How many notes two bars' lines differ by: those either plays that the other doesn't. */
function slips(a: readonly LeadNote[], b: readonly LeadNote[]): number {
  const key = (n: LeadNote) => `${n.step}:${n.degree}:${n.alter}`;
  const left = new Map<string, number>();
  for (const n of a) left.set(key(n), (left.get(key(n)) ?? 0) + 1);
  let shared = 0;
  for (const n of b) {
    const k = key(n);
    if ((left.get(k) ?? 0) > 0) {
      left.set(k, left.get(k)! - 1);
      shared++;
    }
  }
  return a.length + b.length - 2 * shared;
}

/**
 * A source's phrases in its bars (#580, rung 3): its bars in a row, each of `LEAD_FEWEST` notes or more and with an
 * origin, joined into one line of `steps` a bar, each note's degree counted from the phrase's first note; cut every
 * `PHRASE_BARS` bars from where the run starts; and a phrase that plays its first bars again and again, at the same
 * place in the key and within `PHRASE_SLIPS` notes, is those bars, each the surest of its playings (the earliest on a
 * tie). A bar without an origin is a phrase of its own. In the order played.
 */
export function phrasesOfLead(bars: readonly LeadBar[], steps: number): (readonly LeadNote[])[] {
  return runsOf(bars).flatMap((run) =>
    Array.from({ length: Math.ceil(run.length / PHRASE_BARS) }, (_, k) =>
      lineOf(unitOf(run.slice(k * PHRASE_BARS, (k + 1) * PHRASE_BARS)), steps),
    ),
  );
}

/** A source's bars in runs: each of `LEAD_FEWEST` notes or more, a bar with an origin joining the bar before it with one. */
function runsOf(bars: readonly LeadBar[]): LeadBar[][] {
  const sorted = [...bars]
    .filter((b) => b.notes.length >= LEAD_FEWEST)
    .sort((a, b) => a.bar - b.bar);
  const runs: LeadBar[][] = [];
  for (const b of sorted) {
    const run = runs.at(-1);
    const last = run?.at(-1);
    if (
      run &&
      last &&
      b.origin !== undefined &&
      last.origin !== undefined &&
      b.bar === last.bar + 1
    )
      run.push(b);
    else runs.push([b]);
  }
  return runs;
}

/** Bars that play their first bars again and again, within `PHRASE_SLIPS` notes and in one place in the key, as those bars, each the surest of its playings. */
function unitOf(chunk: readonly LeadBar[]): LeadBar[] {
  const sameBar = (a: LeadBar, b: LeadBar) =>
    a.origin === b.origin && slips(a.notes, b.notes) <= PHRASE_SLIPS;
  const period =
    [...Array(chunk.length).keys()]
      .map((p) => p + 1)
      .find(
        (p) => chunk.length % p === 0 && chunk.every((b, i) => i < p || sameBar(b, chunk[i - p]!)),
      ) ?? chunk.length;
  return chunk
    .slice(0, period)
    .map((first, i) =>
      chunk
        .filter((_, j) => j % period === i)
        .reduce((best, b) => ((b.confidence ?? 1) > (best.confidence ?? 1) ? b : best), first),
    );
}

/** Bars as one line of `steps` a bar, each note's degree counted from the first bar's first note, plus `from`. */
function lineOf(unit: readonly LeadBar[], steps: number, from = 0): LeadNote[] {
  const origin = unit[0]!.origin ?? 0;
  return unit.flatMap((b, i) =>
    b.notes.map((n) => ({
      ...n,
      step: n.step + i * steps,
      degree: n.degree + (b.origin ?? 0) - origin + from,
    })),
  );
}

/**
 * A line as cells text, `length` steps long, for `decompose` to read: on the coarsest grid its notes fall on (a bar,
 * a half, a quarter, an eighth, a sixteenth), each note its degree and accidental, a rest `~`, as `leadText` writes a
 * line, so the line is weighed as briefly as it is written.
 */
function lineText(notes: readonly LeadNote[], length: number, steps: number): string {
  const grids = [
    { tap: '1m', size: steps },
    { tap: '2n', size: 8 },
    { tap: '4n', size: 4 },
    { tap: '8n', size: 2 },
    { tap: '16n', size: 1 },
  ];
  const grid = grids.find(
    (g) =>
      length % g.size === 0 && steps % g.size === 0 && notes.every((n) => n.step % g.size === 0),
  )!;
  const at = new Map(notes.map((n) => [n.step, n]));
  const token = (n: LeadNote) =>
    `${n.degree}${(n.alter > 0 ? '#' : 'b').repeat(Math.abs(n.alter))}`;
  const tokens = Array.from({ length: length / grid.size }, (_, i) =>
    at.has(i * grid.size) ? token(at.get(i * grid.size)!) : '~',
  );
  return `&lead over=&key step=${grid.tap} ${tokens.join(' ')}`;
}

/** The most bars a phrase is tried as a form over (#580 rung 4, the owner's ruling of 2026-11-08): eight, a section, as long as the Muse's ear holds. */
export const FORM_BARS = 8;

/** A lead line the Muse distils: its notes, each degree from its first note, and where it is a form over the seed's motifs, the text that says so. */
export interface DistilledLead {
  readonly notes: readonly LeadNote[];
  /** The line as a form over the seed's motifs (cells' `decompose`), its degrees the key's own; absent for a line. */
  readonly text?: string;
}

/**
 * A source's run as a form over the seed's motifs (#580 rung 4, the owner's rulings of 2026-11-08): the run, its repeat
 * taken as once (`unitOf`), of 2 to `FORM_BARS` bars, written in the key's own degrees (its first note's place in the
 * key, its `origin` less whole octaves of seven) and decomposed by cells (`decompose`, in `meter`); null where it is
 * no form, or its bars say no place in the key.
 */
function formOf(run: readonly LeadBar[], steps: number, meter: string): DistilledLead | null {
  const unit = unitOf(run);
  const origin = unit[0]?.origin;
  if (unit.length < 2 || unit.length > FORM_BARS || origin === undefined) return null;
  const notes = lineOf(unit, steps);
  const keyed = lineOf(unit, steps, ((origin % 7) + 7) % 7);
  const d = decompose(lineText(keyed, unit.length * steps, steps), 'lead', meter);
  return d.form === null ? null : { notes, text: d.text };
}

/**
 * A section's recurring lead line, `steps` a bar: of its phrases, the first that plays the pattern most of them play,
 * ties to the longer, then the earliest; null where none has enough notes. A run that is a form over the seed's motifs
 * (`formOf`, tried where `meter` names the section's meter) is that form, one phrase; any other is cut into phrases
 * (`phrasesOfLead`), as before.
 */
export function distilledLead(
  bars: readonly LeadBar[],
  steps: number,
  meter?: string,
): DistilledLead | null {
  const phrases: DistilledLead[] = runsOf(bars).flatMap((run) => {
    const form = meter === undefined ? null : formOf(run, steps, meter);
    return form ? [form] : phrasesOfLead(run, steps).map((notes) => ({ notes }));
  });
  const counts = new Map<string, { count: number; first: DistilledLead }>();
  for (const phrase of phrases) {
    const pattern = phrase.text ?? patternOf(phrase.notes);
    const seen = counts.get(pattern);
    if (seen) seen.count++;
    else counts.set(pattern, { count: 1, first: phrase });
  }
  const span = (line: DistilledLead) => Math.floor(line.notes.at(-1)!.step / steps);
  let best: { count: number; first: DistilledLead } | null = null;
  for (const entry of counts.values())
    if (
      !best ||
      entry.count > best.count ||
      (entry.count === best.count && span(entry.first) > span(best.first))
    )
      best = entry;
  return best ? best.first : null;
}

/** What a source played as a lead in one bar, as the Muse judged it (`heardLead`), and where its first note sits in the key. */
export interface HeardLeadBar {
  readonly source: string;
  readonly bar: number;
  readonly notes: readonly LeadNote[];
  readonly origin?: number | undefined;
  readonly confidence?: number | undefined;
}

/**
 * Each source's lead in a bar, from the bar's judgements: every motif, as a
 * line (`motifNotes`), of a source not among `bass`, those heard as a bass
 * in the bar. In the order judged; none where nothing was judged a motif.
 */
export function heardLead(
  judgements: readonly Judgement[],
  bar: number,
  bass: ReadonlySet<string> = new Set(),
): HeardLeadBar[] {
  return judgements.flatMap((j) =>
    j.kind === 'motif' && !bass.has(j.source)
      ? [
          {
            source: j.source,
            bar,
            notes: motifNotes(j.motif),
            ...(j.origin === undefined ? {} : { origin: j.origin }),
            ...(j.confidence === undefined ? {} : { confidence: j.confidence }),
          },
        ]
      : [],
  );
}
