/**
 * The composer's bass line, asked of a repository at a section's start,
 * after its meter (#423; the loop of `facet.ts` for the facet `bass`;
 * yggi/cells decisions 043, 046, 047 and 052; the bass seeds of
 * yggi/cells#211 and #214).
 *
 * A repository holds bass lines, each cells text of indices into the chord
 * in force (`over=&harm`), which the band reads into its notes over the
 * lap (`LineNote`): each a step, the chord it reads (the one in force, or
 * the next, `&harm[>>]`), its index into that chord's stack, an accidental
 * and a shift in semitones. The composer asks it at the style's point, with
 * the section's meter as the bench, as it asks for a rhythm, and takes the
 * nearest line it admits (`composedLine`), held as the meter is, none on a
 * miss, where the bass's own machine is the generator (`bass.ts`), as the
 * drummer invents, and the Muse files what it played (`muse-line.ts`).
 *
 * It admits a line it can read under the section's meter, and a walk (a
 * note on every pulse and nowhere else, as `bass.ts`'s walk) only where the
 * section's meter swings its 8ths (`eighthSwing` above 0): the swing that
 * makes `bass.ts` walk is the meter's, which the style's point doesn't see
 * (the owner's ruling on yggi/cells#209, recorded on #423).
 *
 * What the bass plays from a line is `bass.ts`'s; the pitch a note of it
 * reads over the bar's chords is `lineTone`, as cells reads `over=&harm`
 * (since v0.5.0): the chord's stack (`joinChord`), its tone `index`, a lap
 * up (an octave) past its last, moved `alter` degrees of the key and
 * `shift` semitones. The octave is the bass's to choose (`nearest`), so a
 * line says pitch classes.
 *
 * This module is pure and knows no cells: the repository is given, built
 * from cells' bass lines by `bass-lines.ts`.
 */

import { type Meter, alteredDegree, heightOf, joinChord, meterOnSteps } from '@jambot/theory';
import { type BarChord, chordAt } from './chords.ts';
import {
  type Bench,
  type FacetRepository,
  type Filing,
  type Varied,
  nearestFigure,
} from './facet.ts';
import { type Key, keyHelix } from './key.ts';
import type { LearnedLayer } from './layer.ts';
import { type QueriedStyle, stylePoint } from './meter-query.ts';
import { type MeterSwing, eighthSwing } from './swing.ts';

/** The facet a bass line is associated as (yggi/cells#211, the owner's ruling). */
export const BASS_FACET = 'bass';

/** A note of a bass line as the band reads it: where it falls, and what it reads over the chords. */
export interface LineNote {
  /** Its step from the lap's start: a line of more than a bar counts on into the next. */
  readonly step: number;
  /** The chord it reads: 0 the one in force at its step (`&harm`), 1 the next (`&harm[>>]`). */
  readonly chord: number;
  /** Its index into that chord's stack: 0 the root, past the last tone the chord an octave up. */
  readonly index: number;
  /** An accidental, in degrees of the key (cells decision 015). */
  readonly alter: number;
  /** Semitones it is moved by (`^$n`). */
  readonly shift: number;
}

/** A bass line read under a meter, played straight: its notes over its lap, and the bars the lap holds. */
export interface LineRead {
  readonly bars: number;
  readonly notes: readonly LineNote[];
}

/** What a bass line filed and a line's variation carry of what the bass plays: a bar's notes over the chords. */
export interface LineContent {
  readonly notes: readonly LineNote[];
}

/** A bass line to file: a bar's notes over its chords, the bench it was played on, where and by whom (`muse-line.ts`). */
export type LineFiling = Filing<LineContent>;

/** A variation of a bass line (#423): its notes over its bar, and how it varies the line (cells' `transpose &bassline 1`). */
export type LineVariation = Varied<LineContent>;

/** A repository of bass lines the composer asks (#423): the loop's repository for the facet `bass` (`facet.ts`). */
export type LineRepository = FacetRepository<LineRead, LineContent>;

/** Whether a line walks: in every bar of its lap, a note on each of the meter's pulses and on no other step. */
export function isWalk(read: LineRead, meter: Meter, steps: number): boolean {
  const pulses = meterOnSteps(meter).heights;
  for (let bar = 0; bar < read.bars; bar++) {
    const onsets = [
      ...new Set(
        read.notes
          .filter((n) => n.step >= bar * steps && n.step < (bar + 1) * steps)
          .map((n) => n.step - bar * steps),
      ),
    ].sort((a, b) => a - b);
    if (onsets.join() !== pulses.join()) return false;
  }
  return true;
}

/**
 * The bass line the composer takes at a style, on a bench under the
 * section's swing, given the section before's: the nearest it admits (a
 * line it can read under the meter; a walk only where the meter swings its
 * 8ths), held as the meter is, none on a miss or with no repository. Those
 * `chosen` (its short-term memory and the section's meter) pull the lines
 * used with them; those `rejected` (lines it has tired of, `novelty.ts`) it
 * leaves out, so the next nearest is taken, or none. It asks with `pull`,
 * how strongly use together pulls (#389, `pullOf`).
 */
export function composedLine(
  repository: LineRepository,
  style: QueriedStyle,
  bench: Bench,
  swing: MeterSwing,
  steps: number,
  playing: string | undefined,
  layer?: LearnedLayer,
  chosen: readonly string[] = [],
  rejected: readonly string[] = [],
  pull?: number,
): string | undefined {
  const swings = eighthSwing(swing) > 0;
  return nearestFigure(
    repository,
    stylePoint(style),
    bench,
    playing,
    (read) => read !== null && (swings || !isWalk(read, bench.meter, steps)),
    layer,
    chosen,
    rejected,
    pull,
  );
}

/** A line's notes in one bar of a section: its bar of its lap, each on the bar's steps; none with no line, or one that can't be read. */
export function sectionNotes(
  repository: LineRepository,
  id: string | undefined,
  meter: Meter,
  barInSection: number,
  steps: number,
  layer?: LearnedLayer,
): LineNote[] {
  const read = id === undefined ? null : repository.read(id, meter, layer);
  if (!read) return [];
  const lap = barInSection % read.bars;
  return read.notes
    .filter((n) => Math.floor(n.step / steps) === lap)
    .map((n) => ({ ...n, step: n.step - lap * steps }));
}

/**
 * The pitch a note of a line reads over a bar's chords (on the bar's
 * meter), the bar after's first being next past the bar's last, in a key,
 * as cells reads `over=&harm`: its chord's stack tone `index`, an octave up
 * a lap past its last, moved `alter` degrees of the key and `shift`
 * semitones. The chord in force at its step where it reads 0, the one after
 * it where it reads 1; past the next bar's first, that one again.
 */
export function lineTone(
  note: LineNote,
  chords: readonly BarChord[],
  next: readonly BarChord[],
  key: Key,
): number {
  const here = chordAt(chords, note.step);
  const after = [...chords.filter((c) => c.slot.step > here.slot.step), ...next];
  const chord = note.chord === 0 ? here : (after[note.chord - 1] ?? after.at(-1) ?? here);
  const stack = joinChord(chord.chord);
  const lap = Math.floor(note.index / stack.length);
  const tone = stack[note.index - lap * stack.length]! + 12 * lap;
  if (note.alter === 0) return tone + note.shift;
  const scale = keyHelix(key);
  const degree = alteredDegree(scale, tone);
  const moved = degree
    ? heightOf(scale, degree.degree + note.alter) + degree.accidental * 1
    : tone + note.alter;
  return moved + note.shift;
}
