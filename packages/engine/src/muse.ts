/**
 * The Muse: the band's ear toward the players (#79).
 *
 * The composer can't know what people play, so this is the one place the
 * band measures. Each bar, the notes each source played are judged on their
 * own. Notes are heard at exact positions and each is put on the step
 * nearest where it was heard; a bar's notes are those whose step is in it.
 * A source's bar is:
 *
 * - mashing, with more than 12 notes, a chord's every note counted;
 * - too few, when its melody, the top note on each step, has fewer than 3;
 * - too wide, when that melody spans more than 19 semitones;
 * - and otherwise a motif: the melody's steps, and each note's degree of
 *   the key counted from the first, so the motif follows the key.
 *
 * Of the motifs, the band takes the one with the most notes, and on a tie
 * the first to arrive. These are the prototype's rules and thresholds.
 *
 * Two choices are ahead of the evidence, until #7's decision (d) settles
 * what a motif carries: a note off the key goes to the key's nearest
 * degree, ties going down, and a motif keeps no velocity and no length.
 */

import { type Motif, snap } from '@jambot/theory';
import { type Key, keyHelix } from './key.ts';

/** A note a player played, heard at an exact position. */
export interface HeardNote {
  readonly note: number;
  readonly velocity: number;
  readonly source: string;
  /** Steps from the song's start, as heard: not rounded. */
  readonly position: number;
  /** Where it was released, or null while held or if unknown. */
  readonly end: number | null;
}

/** What one source played in a bar, judged. */
export type Judgement =
  | { readonly kind: 'motif'; readonly source: string; readonly motif: Motif }
  | { readonly kind: 'mashing'; readonly source: string; readonly count: number }
  | { readonly kind: 'too few'; readonly source: string; readonly count: number }
  | { readonly kind: 'too wide'; readonly source: string; readonly range: number };

/** The prototype's thresholds: the most notes, the fewest melody notes, the widest range. */
export const MUSE = { mashing: 12, fewest: 3, widest: 19 } as const;

const STEPS = 16;

/** The step nearest where a note was heard, from the song's start. */
const stepOf = (note: HeardNote) => Math.round(note.position);

/** The notes heard in a bar: those whose nearest step is in it. */
export function heardIn(notes: readonly HeardNote[], bar: number): HeardNote[] {
  return notes.filter((n) => Math.floor(stepOf(n) / STEPS) === bar);
}

/** Each source's notes in a bar, judged, in the order their first notes arrived. */
export function judgeBar(notes: readonly HeardNote[], bar: number, key: Key): Judgement[] {
  const bySource = new Map<string, HeardNote[]>();
  for (const n of heardIn(notes, bar))
    bySource.set(n.source, [...(bySource.get(n.source) ?? []), n]);
  return [...bySource].map(([source, heard]) => judge(source, heard, bar, key));
}

/** The motif the band takes from a bar's judgements, or none. */
export function taken(judgements: readonly Judgement[]): (Judgement & { kind: 'motif' }) | null {
  let best: (Judgement & { kind: 'motif' }) | null = null;
  for (const j of judgements)
    if (j.kind === 'motif' && (!best || j.motif.steps.length > best.motif.steps.length)) best = j;
  return best;
}

function judge(source: string, heard: readonly HeardNote[], bar: number, key: Key): Judgement {
  if (heard.length > MUSE.mashing) return { kind: 'mashing', source, count: heard.length };
  const top = new Map<number, number>();
  for (const n of heard) {
    const step = stepOf(n) - bar * STEPS;
    top.set(step, Math.max(top.get(step) ?? -Infinity, n.note));
  }
  const melody = [...top].sort(([a], [b]) => a - b);
  if (melody.length < MUSE.fewest) return { kind: 'too few', source, count: melody.length };
  const notes = melody.map(([, note]) => note);
  const range = Math.max(...notes) - Math.min(...notes);
  if (range > MUSE.widest) return { kind: 'too wide', source, range };
  const scale = keyHelix(key);
  const degrees = notes.map((note) => snap(scale, note));
  return {
    kind: 'motif',
    source,
    motif: {
      span: STEPS,
      steps: melody.map(([step]) => step),
      degrees: degrees.map((d) => d - degrees[0]!),
    },
  };
}
