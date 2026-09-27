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
 * - and otherwise a motif (U4): the melody's onsets, and each note's degree
 *   of the key counted from the first, altered where it is off the key as
 *   a numeral writes a root (`alteredDegree`), so the motif follows the key
 *   and a blue note comes back as itself. A note released before the next
 *   one leaves a rest where it was released, and a bar that starts silent
 *   starts with a rest, unless a rest at its end already runs round to its
 *   first note.
 *
 * Of the motifs, the band takes the one with the most notes, and on a tie
 * the first to arrive.
 *
 * The Muse is a machine at bar rate (`muse`) over a bar's judgements, so a
 * judgement made here and one a client sent a host enter it alike. It
 * offers the motif it took,
 * with its source and the bar it was heard in, until another is taken, it
 * is asked to forget, or nobody has played for 16 bars: notes that give no
 * motif still count as playing. These are the prototype's rules and
 * thresholds.
 *
 * Each note's accent is its velocity less the player's level in the bar,
 * the rounded mean of the melody's velocities, so the motif keeps how they
 * accented and the judgement keeps how loud they played, beside it (U4).
 */

import { type Motif, alteredDegree, chromaticStep, heightOf, motifProblems } from '@jambot/theory';
import { BAR_STEPS } from './events.ts';
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
  | {
      readonly kind: 'motif';
      readonly source: string;
      readonly motif: Motif;
      /** The player's level in the bar, which the motif's accents are counted from. */
      readonly level: number;
    }
  | { readonly kind: 'mashing'; readonly source: string; readonly count: number }
  | { readonly kind: 'too few'; readonly source: string; readonly count: number }
  | { readonly kind: 'too wide'; readonly source: string; readonly range: number };

/**
 * The prototype's thresholds: the most notes, the fewest melody notes, the
 * widest range, and how many silent bars an offer outlasts.
 */
export const MUSE = { mashing: 12, fewest: 3, widest: 19, forgetAfter: 16 } as const;

/** The step nearest where a note was heard, from the song's start. */
const stepOf = (note: HeardNote) => Math.round(note.position);

/** The bar a note was heard in: the bar its nearest step is in. */
export const barOf = (note: HeardNote) => Math.floor(stepOf(note) / BAR_STEPS);

/** The notes heard in a bar. */
export function heardIn(notes: readonly HeardNote[], bar: number): HeardNote[] {
  return notes.filter((n) => barOf(n) === bar);
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
  const notes = (m: Motif) => m.degrees.filter((d) => d !== null).length;
  let best: (Judgement & { kind: 'motif' }) | null = null;
  for (const j of judgements)
    if (j.kind === 'motif' && (!best || notes(j.motif) > notes(best.motif))) best = j;
  return best;
}

function judge(source: string, heard: readonly HeardNote[], bar: number, key: Key): Judgement {
  if (heard.length > MUSE.mashing) return { kind: 'mashing', source, count: heard.length };
  const top = new Map<number, HeardNote>();
  for (const n of heard) {
    const step = stepOf(n) - bar * BAR_STEPS;
    if (n.note > (top.get(step)?.note ?? -Infinity)) top.set(step, n);
  }
  const melody = [...top].sort(([a], [b]) => a - b);
  if (melody.length < MUSE.fewest) return { kind: 'too few', source, count: melody.length };
  const notes = melody.map(([, n]) => n.note);
  const range = Math.max(...notes) - Math.min(...notes);
  if (range > MUSE.widest) return { kind: 'too wide', source, range };

  const scale = keyHelix(key);
  const origin = alteredDegree(scale, notes[0]!)!.degree;
  const level = Math.round(melody.reduce((sum, [, n]) => sum + n.velocity, 0) / melody.length);
  const arcs: { onset: number; degree: number | null; accidental: number; accent: number }[] = [];
  const rest = (onset: number) => ({ onset, degree: null, accidental: 0, accent: 0 });
  melody.forEach(([step, n], i) => {
    const { degree, accidental } = alteredDegree(scale, n.note)!;
    arcs.push({ onset: step, degree: degree - origin, accidental, accent: n.velocity - level });
    const next = melody[i + 1]?.[0] ?? BAR_STEPS;
    if (n.end === null) return;
    const released = Math.max(step + 1, Math.round(n.end) - bar * BAR_STEPS);
    if (released < next) arcs.push(rest(released));
  });
  if (arcs[0]!.onset > 0 && arcs.at(-1)!.degree !== null) arcs.unshift(rest(0));
  const motif: Motif = {
    cycle: BAR_STEPS,
    onsets: arcs.map((a) => a.onset),
    degrees: arcs.map((a) => a.degree),
    accidentals: arcs.map((a) => a.accidental),
  };
  const accents = arcs.map((a) => a.accent);
  return {
    kind: 'motif',
    source,
    motif: accents.some((a) => a !== 0) ? { ...motif, accents } : motif,
    level,
  };
}

/**
 * Whether a judgement could have come from `judgeBar`, as far as it says
 * so itself: a judgement made elsewhere, on a client, is checked by the
 * host with the same gates it was judged by. A motif is well formed
 * (`motifProblems`) on the bar's 16 steps, of whole degrees each altered by
 * at most one `b` or `#`; it has between `MUSE.fewest` and `MUSE.mashing`
 * notes; and in the bar's key it spans at most
 * `MUSE.widest` semitones from some first note (a motif counts degrees
 * from its first, and the span in semitones depends a little on which
 * degree that is). The player's level is a MIDI velocity. The other
 * judgements carry counts the gates would have given.
 */
export function admissible(judgement: Judgement, key: Key): boolean {
  if (!shaped(judgement)) return false;
  const count = (n: unknown) => Number.isInteger(n) && (n as number) >= 0;
  switch (judgement.kind) {
    case 'mashing':
      return count(judgement.count) && judgement.count > MUSE.mashing;
    case 'too few':
      return count(judgement.count) && judgement.count < MUSE.fewest;
    case 'too wide':
      return count(judgement.range) && judgement.range > MUSE.widest;
    case 'motif': {
      const { motif, level } = judgement;
      if (!Number.isInteger(level) || level < 0 || level > 127) return false;
      if (motif.cycle !== BAR_STEPS || motifProblems(motif).length > 0) return false;
      if (!motif.onsets.every(Number.isInteger)) return false;
      const notes = motif.degrees.filter((d) => d !== null);
      if (notes.length < MUSE.fewest || notes.length > MUSE.mashing) return false;
      if (!notes.every(Number.isInteger)) return false;
      if (!motif.accidentals.every((a) => a === -1 || a === 0 || a === 1)) return false;
      const scale = keyHelix(key);
      const step = chromaticStep(scale);
      const spanFrom = (origin: number) => {
        const heights = motif.degrees.flatMap((d, i) =>
          d === null ? [] : [heightOf(scale, origin + d) + motif.accidentals[i]! * step],
        );
        return Math.max(...heights) - Math.min(...heights);
      };
      return [0, 1, 2, 3, 4, 5, 6].some((origin) => spanFrom(origin) <= MUSE.widest);
    }
    default:
      return false;
  }
}

/**
 * Whether what arrived has a judgement's shape, before anything is read
 * from it: it comes off the wire as JSON, so its type is a claim, not a
 * fact. A motif's lists are checked for their lengths and element types,
 * which `motifProblems` takes as given.
 */
function shaped(judgement: unknown): judgement is Judgement {
  const j = judgement as Partial<Record<string, unknown>> | null;
  if (typeof j !== 'object' || j === null || typeof j.source !== 'string') return false;
  if (j.kind !== 'motif') return true;
  const motif = j.motif as Partial<Record<keyof Motif, unknown>> | null;
  if (typeof motif !== 'object' || motif === null || !Array.isArray(motif.onsets)) return false;
  const n = motif.onsets.length;
  const list = (xs: unknown, each: (x: unknown) => boolean) =>
    Array.isArray(xs) && xs.length === n && xs.every(each);
  const whole = (x: unknown) => Number.isInteger(x);
  return (
    typeof motif.cycle === 'number' &&
    list(motif.onsets, whole) &&
    list(motif.degrees, (d) => d === null || whole(d)) &&
    list(motif.accidentals, whole) &&
    (motif.accents === undefined || list(motif.accents, whole))
  );
}

/** A motif the Muse offers the band: what was heard, from whom, and when. */
export interface Offer {
  readonly motif: Motif;
  readonly source: string;
  /** The bar it was heard in. */
  readonly bar: number;
  /** The player's level in that bar: the reading of their style, never what the band plays at. */
  readonly level: number;
}

/** The bar the Muse hears. */
export interface MuseEnv {
  readonly bar: number;
}

export interface MuseInput {
  /** Each source's bar judged, in the order they arrived (`judgeBar`). */
  readonly judgements: readonly Judgement[];
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
  advance({ bar }, carried, { judgements, forget }) {
    let { offer, lastPlayed } = carried;
    let forgot: MuseOutput['forgot'] = null;
    if (forget && offer) {
      offer = null;
      forgot = 'asked';
    }
    if (judgements.length > 0) {
      lastPlayed = bar;
      const best = taken(judgements);
      if (best) offer = { motif: best.motif, source: best.source, bar, level: best.level };
    } else if (offer && lastPlayed !== null && bar - lastPlayed > MUSE.forgetAfter) {
      offer = null;
      forgot = 'silence';
    }
    return { carried: { offer, lastPlayed }, output: { bar, judgements, offer, forgot } };
  },
};
