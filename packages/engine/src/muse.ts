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
 * the first to arrive.
 *
 * The Muse is a machine at bar rate (`muse`). It offers the motif it took,
 * with its source and the bar it was heard in, until another is taken, it
 * is asked to forget, or nobody has played for 16 bars: notes that give no
 * motif still count as playing. These are the prototype's rules and
 * thresholds.
 *
 * Two choices are ahead of the evidence, until #7's decision (d) settles
 * what a motif carries: a note off the key goes to the key's nearest
 * degree, ties going down, and a motif keeps no velocity and no length.
 */

import { type Motif, snap } from '@jambot/theory';
import { type Key, keyHelix } from './key.ts';
import type { Machine } from './machine.ts';

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

/**
 * The prototype's thresholds: the most notes, the fewest melody notes, the
 * widest range, and how many silent bars an offer outlasts.
 */
export const MUSE = { mashing: 12, fewest: 3, widest: 19, forgetAfter: 16 } as const;

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

/** A motif the Muse offers the band: what was heard, from whom, and when. */
export interface Offer {
  readonly motif: Motif;
  readonly source: string;
  /** The bar it was heard in. */
  readonly bar: number;
}

/** The bar the Muse judges, and its key. */
export interface MuseEnv {
  readonly bar: number;
  readonly key: Key;
}

export interface MuseInput {
  /** Notes heard; only those in the bar judged are read. */
  readonly heard: readonly HeardNote[];
  /** Whether someone asked it to forget what it offers. */
  readonly forget: boolean;
}

export interface MuseCarried {
  readonly offer: Offer | null;
  /** The last bar anyone played in, or null before anyone has. */
  readonly lastPlayed: number | null;
}

/** A bar as the Muse heard it: what it judged, what it offers after, and why it forgot, if it did. */
export interface MuseOutput {
  readonly bar: number;
  readonly judgements: readonly Judgement[];
  readonly offer: Offer | null;
  readonly forgot: 'asked' | 'silence' | null;
}

export const muse: Machine<MuseEnv, MuseCarried, MuseInput, MuseOutput> = {
  initial: { offer: null, lastPlayed: null },
  advance({ bar, key }, carried, { heard, forget }) {
    let { offer, lastPlayed } = carried;
    let forgot: MuseOutput['forgot'] = null;
    if (forget && offer) {
      offer = null;
      forgot = 'asked';
    }
    const judgements = judgeBar(heard, bar, key);
    if (judgements.length > 0) {
      lastPlayed = bar;
      const best = taken(judgements);
      if (best) offer = { motif: best.motif, source: best.source, bar };
    } else if (offer && lastPlayed !== null && bar - lastPlayed > MUSE.forgetAfter) {
      offer = null;
      forgot = 'silence';
    }
    return { carried: { offer, lastPlayed }, output: { bar, judgements, offer, forgot } };
  },
};
