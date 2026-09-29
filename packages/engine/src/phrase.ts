/**
 * Phrases: what a player plays between two empty bars, read as one span
 * (#204, A1).
 *
 * The Muse doesn't listen a bar at a time. A phrase runs until the player
 * leaves a bar empty, and only then is it cut at the bar lines, so a first
 * note struck a little early is read with the phrase it starts, not lost to
 * the bar before. The reading is a hand's: the notes are heard already
 * un-swung (the transport's own map did that, so no swing is searched), and
 * three things are found in what is left:
 *
 * - the phrase's offset: the whole phrase a little early or late, the mean
 *   of its onsets' residuals from the steps, shrunk toward none;
 * - the hand's looseness, the spread of what is left, which says how far an
 *   onset may be from the step it meant;
 * - the phrase's start, which very probably is on a beat: a first onset
 *   between a beat and the step nearest it goes where the odds, its
 *   distance weighed by the hand's own looseness against `BEAT_ODDS`, say.
 *
 * What a phrase was meant to be beyond where its onsets go, the note value,
 * the lengths and the rests, is A2 to A4's.
 */

import { BAR_STEPS, beatAt, beatStart } from './events.ts';
import type { HeardNote } from './muse.ts';
import { readOnsets } from './reading.ts';

/**
 * How long a silence ends a phrase: a whole bar, less a step, since a hand
 * doesn't leave a bar empty to the step.
 */
export const EMPTY_BAR = BAR_STEPS - 1;

/**
 * How many times likelier a phrase is to start on a beat than on one
 * particular step off it. A phrase starts on a beat very probably, and the
 * beat has three steps beside it to one.
 */
export const BEAT_ODDS = 6;

/** The least a hand's looseness is taken to be, in steps: a player exact to the ear is not exact to the step. */
export const LOOSENESS_FLOOR = 0.08;

const reach = (n: HeardNote) => n.end ?? n.position;

/**
 * The phrases in what was heard, in time. A phrase ends where nothing
 * sounds for `EMPTY_BAR` steps: from the last release, or the last onset
 * where the release is not known, to the next onset.
 */
export function phrasesOf(notes: readonly HeardNote[]): HeardNote[][] {
  const sorted = [...notes].sort((a, b) => a.position - b.position);
  const phrases: HeardNote[][] = [];
  let sounding = -Infinity;
  for (const n of sorted) {
    if (n.position - sounding >= EMPTY_BAR) phrases.push([]);
    phrases.at(-1)!.push(n);
    sounding = Math.max(sounding, reach(n));
  }
  return phrases;
}

/**
 * The phrase's offset: the mean of its onsets' residuals from the steps,
 * shrunk toward none by one onset's worth. A hand's own looseness is often
 * a third of a step, so the residuals cover the circle and only a phrase
 * that is early or late as a whole says so; the player aims at the same
 * grid the band plays, so an offset is a claim that needs its evidence.
 */
function offsetOf(residuals: readonly number[]): number {
  return residuals.reduce((sum, r) => sum + r, 0) / (residuals.length + 1);
}

/**
 * A phrase's notes on the steps they meant: the onsets and the releases
 * each less the phrase's offset and rounded, and the first onset put on the
 * beat where the odds say so. The notes keep their pitches, velocities and
 * sources; the order is the order of the onsets.
 */
export function readPhrase(phrase: readonly HeardNote[]): HeardNote[] {
  const notes = [...phrase].sort((a, b) => a.position - b.position);
  if (notes.length === 0) return [];
  const { residuals } = readOnsets(
    notes.map((n) => n.position),
    0,
  );
  const offset = offsetOf(residuals);
  const looseness = Math.max(
    LOOSENESS_FLOOR,
    Math.sqrt(residuals.reduce((sum, r) => sum + (r - offset) ** 2, 0) / residuals.length),
  );
  const steps = notes.map((n) => Math.round(n.position - offset));
  const first = notes[0]!.position - offset;
  const before = beatStart(beatAt(first));
  const after = beatStart(beatAt(first) + 1);
  const beat = first - before <= after - first ? before : after;
  if (beat !== steps[0]) {
    const score = (step: number, odds: number) =>
      Math.log(odds) - (first - step) ** 2 / (2 * looseness ** 2);
    if (score(beat, BEAT_ODDS) > score(steps[0]!, 1)) steps[0] = beat;
  }
  return notes.map((n, i) => ({
    ...n,
    position: steps[i]!,
    end: n.end === null ? null : Math.max(steps[i]! + 1, Math.round(n.end - offset)),
  }));
}

/** Everything heard, read phrase by phrase, in time. */
export function readHeard(notes: readonly HeardNote[]): HeardNote[] {
  return phrasesOf(notes).flatMap(readPhrase);
}
