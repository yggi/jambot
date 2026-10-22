/**
 * The Muse's ear for bass lines (#423): what a source played as a bass
 * over a section, read as degrees over the chord in force, distilled into
 * one bar, which the composer files in the learned layer (`facet.ts`'s
 * `filedHeard`; stated as cells text by `bass-lines.ts`'s `lineText`), as
 * her ear for grooves does for the drums (`muse-groove.ts`).
 *
 * A source is the band's bass, on a section where the composer found no
 * line and the bass played its own (`BASSIST`), or a player: a source whose
 * every note of a bar lies in the bass's register, at or below
 * `BASS_RANGE`'s top (57), on whatever instrument, or a session client's
 * part `bass` (#410's message). One path takes both:
 *
 * - **a bar's notes over its chords** (`lineOf`): each note on its step, the
 *   lowest where two sound on one step, read against the chord in force
 *   there: a tone of its stack (its index, the lowest that sounds its pitch
 *   class), else the next chord's root (`&harm[>>]`), else that root a
 *   semitone off (an approach), else the root of the chord in force moved by
 *   semitones. The octave is the bass's to choose (`nearest`), so a line
 *   keeps pitch classes, and read back over the same chords (`lineTone`) it
 *   plays the pitch classes it was heard as: the round trip.
 * - **distilled** (`distilledLine`): the section's recurring bar, the
 *   pattern of notes (step and reading) its bars play most often, as the
 *   first bar that plays it; ties to the earliest. A bar of fewer than
 *   `LINE_FEWEST` notes is no line.
 */

import { type Meter, joinChord, stepsOf, wrap } from '@jambot/theory';
import { BASS_RANGE } from './bass.ts';
import type { LineNote } from './bass-query.ts';
import { type BarChord, chordAt, chordsOn } from './chords.ts';
import type { SongClock } from './events.ts';
import { type HeardNote, heardStep } from './muse.ts';

/** The bass's source, as a line it played on a miss is filed (#423), as the drummer's is `DRUMMER`. */
export const BASSIST = 'bassist';

/** The fewest notes a bar holds to be a line: two, the root bass's in 4/4, the sparsest of cells' seed lines. */
export const LINE_FEWEST = 2;

/** A note as the Muse hears a bass: its step in the bar and its pitch. */
export interface BassStep {
  readonly step: number;
  readonly note: number;
}

/**
 * A bar's notes as a line over its chords (on the bar's meter; the bar
 * after's first chord next past its last): each step's lowest note, read as
 * above. Steps in order.
 */
export function lineOf(
  notes: readonly BassStep[],
  chords: readonly BarChord[],
  next: readonly BarChord[],
): LineNote[] {
  const lowest = new Map<number, number>();
  for (const { step, note } of notes)
    if (!lowest.has(step) || note < lowest.get(step)!) lowest.set(step, note);
  return [...lowest.entries()]
    .sort(([a], [b]) => a - b)
    .map(([step, note]) => {
      const here = chordAt(chords, step);
      const stack = joinChord(here.chord);
      const pitch = wrap(note, 12);
      const index = stack.findIndex((tone) => wrap(tone, 12) === pitch);
      if (index >= 0) return { step, chord: 0, index, alter: 0, shift: 0 };
      const after = chords.find((c) => c.slot.step > here.slot.step) ?? next[0];
      const nextRoot = after && wrap(joinChord(after.chord)[0]!, 12);
      if (nextRoot !== undefined) {
        const off = wrap(pitch - nextRoot + 6, 12) - 6;
        if (Math.abs(off) <= 1) return { step, chord: 1, index: 0, alter: 0, shift: off };
      }
      const shift = wrap(pitch - stack[0]! + 6, 12) - 6;
      return { step, chord: 0, index: 0, alter: 0, shift };
    });
}

/** A bar's pattern: its notes' steps and readings, in order. */
const patternOf = (notes: readonly LineNote[]) =>
  notes.map((n) => `${n.step}:${n.chord}:${n.index}:${n.alter}:${n.shift}`).join(' ');

/**
 * A section's recurring line: of its bars of `LINE_FEWEST` notes or more,
 * the first that plays the pattern most of them play, ties to the earliest;
 * null where none has enough.
 */
export function distilledLine(bars: readonly (readonly LineNote[])[]): readonly LineNote[] | null {
  const counts = new Map<string, { count: number; first: readonly LineNote[] }>();
  for (const bar of bars) {
    if (bar.length < LINE_FEWEST) continue;
    const pattern = patternOf(bar);
    const seen = counts.get(pattern);
    if (seen) seen.count++;
    else counts.set(pattern, { count: 1, first: bar });
  }
  let best: { count: number; first: readonly LineNote[] } | null = null;
  for (const entry of counts.values()) if (!best || entry.count > best.count) best = entry;
  return best ? best.first : null;
}

/** What a source played as a bass in one bar, heard and read as a line over the bar's chords (`heardBass`). */
export interface HeardLineBar {
  readonly source: string;
  readonly bar: number;
  readonly notes: readonly LineNote[];
}

/**
 * Each source's bass in a bar, as the Muse hears it: each note on the step
 * her nearest reading rounds it to (`heardStep`), in the bar, of a source
 * whose every note in the bar lies at or below the bass's top (`BASS_RANGE`),
 * read over the bar's chords (`lineOf`; `chords` and `next` as the band
 * wrote them, on 4/4's slots). Sources in the order their first notes
 * arrived; none that played nothing there, or anything above the bass.
 */
export function heardBass(
  notes: readonly HeardNote[],
  bar: number,
  meter: Meter,
  clock: SongClock,
  chords: readonly BarChord[],
  next: readonly BarChord[],
): HeardLineBar[] {
  const steps = stepsOf(meter);
  const inBar = notes.filter((n) => clock.barAt(heardStep(n)) === bar);
  const sources = [...new Set(inBar.map((n) => n.source))];
  return sources.flatMap((source) => {
    const played = inBar.filter((n) => n.source === source);
    if (played.some((n) => n.note > BASS_RANGE[1])) return [];
    // (`+ 0`: a note a hair before the downbeat rounds to -0)
    const placed = played
      .map((n) => ({ step: clock.stepInBar(heardStep(n)) + 0, note: n.note }))
      .filter((n) => n.step < steps);
    const line = lineOf(placed, chordsOn(chords, meter), chordsOn(next, meter));
    return line.length ? [{ source, bar, notes: line }] : [];
  });
}
