/**
 * The composer's lead line, asked of a repository at a section's start,
 * after its bass line (#424; the loop of `facet.ts` for the facet `lead`;
 * yggi/cells decisions 043, 046, 047 and 052).
 *
 * A repository holds lead lines, each cells text of degrees of the key
 * (`over=key`) counted from its first note, one bar long: a motif as the
 * Muse hears one (U4), its notes' onsets and degrees, each altered where it
 * is off the key. The band reads one into its notes over the bar
 * (`LeadNote`: a step, a degree and an accidental), and the lead plays them
 * as a motif (`leadMotif`), realized as it realizes the Muse's: the first
 * note where its phrase starts, each held to the next, in the key's own
 * degrees, as heard (`lead.ts`).
 *
 * The composer asks it at the style's point, with the section's meter as
 * the bench, as it asks for a bass line, and takes the nearest line it can
 * read under that meter (`composedLead`), held as the meter is; none on a
 * miss, where the lead's own machine is the generator (`lead.ts`), and the
 * Muse files what it played (`muse-lead.ts`).
 *
 * This module is pure and knows no cells: the repository is given, built
 * from cells' compiler by `lead-lines.ts`.
 */

import type { Meter, Motif } from '@jambot/theory';
import {
  type Bench,
  type FacetRepository,
  type Filing,
  type Varied,
  nearestFigure,
} from './facet.ts';
import type { LearnedLayer } from './layer.ts';
import { type QueriedStyle, stylePoint } from './meter-query.ts';

/** The facet a lead line is associated as (#424, the owner's ruling of 2026-10-18: bass, lead, harmony). */
export const LEAD_FACET = 'lead';

/** A note of a lead line as the band reads it: where it falls, and its degree of the key. */
export interface LeadNote {
  /** Its step from the bar's start. */
  readonly step: number;
  /** Its degree of the key, as written: counted from the line's first note where the Muse filed it. */
  readonly degree: number;
  /** Its accidental, in semitones (U2): −1 for `b`. */
  readonly alter: number;
}

/** A lead line read under a meter, played straight: its notes over its lap, and the bars the lap holds. */
export interface LeadRead {
  readonly bars: number;
  readonly notes: readonly LeadNote[];
}

/** What a lead line filed and a line's variation carry of what the lead plays: a bar's notes. */
export interface LeadContent {
  readonly notes: readonly LeadNote[];
}

/** A lead line to file: a bar's notes, the bench it was played on, where and by whom (`muse-lead.ts`). */
export type LeadFiling = Filing<LeadContent>;

/** A variation of a lead line (#424): its notes, and how it varies the line (cells' `transpose &lead 2`). */
export type LeadVariation = Varied<LeadContent>;

/** A repository of lead lines the composer asks (#424): the loop's repository for the facet `lead` (`facet.ts`). */
export type LeadRepository = FacetRepository<LeadRead, LeadContent>;

/**
 * The lead line the composer takes at a style, on a bench, given the
 * section before's: the nearest it can read under the bench's meter, a bar
 * long, held as the meter is; none on a miss. Those `chosen` (its
 * short-term memory and the section's meter) pull the lines used with them;
 * those `rejected` (lines it has tired of, `novelty.ts`) it leaves out. It
 * asks with `pull`, how strongly use together pulls (#389, `pullOf`).
 */
export function composedLead(
  repository: LeadRepository,
  style: QueriedStyle,
  bench: Bench,
  playing: string | undefined,
  layer?: LearnedLayer,
  chosen: readonly string[] = [],
  rejected: readonly string[] = [],
  pull?: number,
): string | undefined {
  return nearestFigure(
    repository,
    stylePoint(style),
    bench,
    playing,
    (read) => read !== null && read.bars === 1,
    layer,
    chosen,
    rejected,
    pull,
  );
}

/**
 * A lead line as a motif of a bar of `steps` (U4): its notes' onsets,
 * degrees and accidentals, a rest first where the bar starts silent, as the
 * lead's own shapes start; none with no line, or one that can't be read.
 */
export function leadMotif(
  repository: LeadRepository,
  id: string | undefined,
  meter: Meter,
  steps: number,
  layer?: LearnedLayer,
): Motif | null {
  const read = id === undefined ? null : repository.read(id, meter, layer);
  if (!read || read.bars !== 1 || !read.notes.length) return null;
  const notes = [...read.notes].sort((a, b) => a.step - b.step);
  const rest = notes[0]!.step > 0;
  return {
    cycle: steps,
    onsets: [...(rest ? [0] : []), ...notes.map((n) => n.step)],
    degrees: [...(rest ? [null] : []), ...notes.map((n) => n.degree)],
    accidentals: [...(rest ? [0] : []), ...notes.map((n) => n.alter)],
  };
}
