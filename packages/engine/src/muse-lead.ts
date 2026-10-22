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
 * - **distilled** (`distilledLead`): the section's recurring bar, the
 *   pattern of notes its bars play most often, as the first bar that plays
 *   it; ties to the earliest. A bar of fewer than `LEAD_FEWEST` notes is no
 *   line, as the Muse hears no motif in one.
 */

import { type Motif, alteredDegree } from '@jambot/theory';
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

/** A bar's pattern: its notes' steps, degrees and accidentals, in order. */
const patternOf = (notes: readonly LeadNote[]) =>
  notes.map((n) => `${n.step}:${n.degree}:${n.alter}`).join(' ');

/**
 * A section's recurring lead line: of its bars of `LEAD_FEWEST` notes or
 * more, the first that plays the pattern most of them play, ties to the
 * earliest; null where none has enough.
 */
export function distilledLead(bars: readonly (readonly LeadNote[])[]): readonly LeadNote[] | null {
  const counts = new Map<string, { count: number; first: readonly LeadNote[] }>();
  for (const bar of bars) {
    if (bar.length < LEAD_FEWEST) continue;
    const pattern = patternOf(bar);
    const seen = counts.get(pattern);
    if (seen) seen.count++;
    else counts.set(pattern, { count: 1, first: bar });
  }
  let best: { count: number; first: readonly LeadNote[] } | null = null;
  for (const entry of counts.values()) if (!best || entry.count > best.count) best = entry;
  return best ? best.first : null;
}

/** What a source played as a lead in one bar, as the Muse judged it (`heardLead`). */
export interface HeardLeadBar {
  readonly source: string;
  readonly bar: number;
  readonly notes: readonly LeadNote[];
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
      ? [{ source: j.source, bar, notes: motifNotes(j.motif) }]
      : [],
  );
}
