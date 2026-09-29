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
 * Of the motifs, the band takes the one the reading is surest of (`taken`).
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
 * accented and the judgement keeps how loud they played, beside it (U4). *
 * She remembers the motifs she took as a fading memory (`fading.ts`, C9),
 * and hears a motif played again, by the same player or another, as it was
 * or under one operator, as the one remembered (`recognise`, Q12): a
 * repetition confirms a motif, and a motif confirmed is taken before one
 * heard once (#204 H8). A motif heard once is remembered for 16 bars, as
 * long as an offer outlasts silence, and longer each time it is heard again.
 */

import {
  type Motif,
  type MotifOp,
  alteredDegree,
  alteredHeight,
  motifProblems,
  recognise,
} from '@jambot/theory';
import { BAR_STEPS, barAt, barStart } from './events.ts';
import { fold } from './fading.ts';
import { type Key, keyHelix } from './key.ts';
import type { Machine } from './machine.ts';
import { EMPTY_BAR, phrasesOf, readHeardWithMargins } from './phrase.ts';

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
      /**
       * How sure the reading of the bar is, from 0 to 1: the mean of how near
       * each note sits to the place it was read on, against the halfway to
       * the next (`PhraseReading`). Absent where the bar was read by the
       * nearest step, which has no such measure.
       */
      readonly confidence?: number;
    }
  | { readonly kind: 'mashing'; readonly source: string; readonly count: number }
  | { readonly kind: 'too few'; readonly source: string; readonly count: number }
  | { readonly kind: 'too wide'; readonly source: string; readonly range: number };

/**
 * The prototype's thresholds: the most notes, the fewest melody notes, the
 * widest range, and how many silent bars an offer outlasts.
 */
export const MUSE = { mashing: 12, fewest: 3, widest: 19, forgetAfter: 16 } as const;

/** The step nearest where a note was heard, from the song's start: the Muse's one rounding of what it hears. */
export const heardStep = (note: Pick<HeardNote, 'position'>) => Math.round(note.position);

/** The bar a note was heard in: the bar its nearest step is in. */
export const barOf = (note: HeardNote) => barAt(heardStep(note));

/** The notes heard in a bar. */
export function heardIn(notes: readonly HeardNote[], bar: number): HeardNote[] {
  return notes.filter((n) => barOf(n) === bar);
}

/**
 * How a bar's notes are placed before they are judged: read as phrases
 * (`readHeard`, the reading of a hand, #204), or each on the step nearest
 * where it was heard, the prototype's one rounding and the baseline the
 * reading is measured against (E17).
 */
export type Reading = 'phrases' | 'nearest';

/** How many bars of a running phrase the Muse keeps to read it by. */
export const PHRASE_MEMORY = 16;

/** A source's notes in a bar as the Muse hears them. */
export interface HeardBar {
  readonly source: string;
  /** The notes read into the bar, in time. */
  readonly notes: HeardNote[];
  /** How sure the reading is, or undefined for the nearest step's, which has no such measure (`Judgement`'s `confidence`). */
  readonly confidence?: number;
}

/**
 * Each source's notes in a bar as the Muse hears them, in the order their
 * first notes arrived: a source's notes up to the end of the bar, read as
 * phrases (`readHeard`), whole phrases so far and no notes of the bars after
 * the one heard, so that what the band plays never depends on what came
 * later (F7); then those read into the bar. What a player's lane shows and
 * what is judged are this.
 */
export function heardInBar(
  notes: readonly HeardNote[],
  bar: number,
  reading: Reading = 'phrases',
): HeardBar[] {
  const edge = barStart(bar + 1);
  const upTo = notes.filter((n) => n.position < edge);
  const sources = [...new Set([...heardIn(upTo, bar), ...upTo].map((n) => n.source))];
  return sources.flatMap((source): HeardBar[] => {
    const own = upTo.filter((n) => n.source === source);
    if (reading === 'nearest') {
      const heard = heardIn(own, bar);
      return heard.length === 0 ? [] : [{ source, notes: heard }];
    }
    const { notes: read, margins } = readHeardWithMargins(own);
    const heard = heardIn(read, bar);
    if (heard.length === 0) return [];
    const mean = heard.reduce((sum, n) => sum + margins.get(n)!, 0) / heard.length;
    return [{ source, notes: heard, confidence: Math.round(mean * 100) / 100 }];
  });
}

/** Each source's notes in a bar, judged, in the order their first notes arrived (`heardInBar`). */
export function judgeBar(
  notes: readonly HeardNote[],
  bar: number,
  key: Key,
  reading: Reading = 'phrases',
): Judgement[] {
  return heardInBar(notes, bar, reading).map(({ source, notes: heard, confidence }) =>
    judge(source, heard, bar, key, confidence),
  );
}

/**
 * The notes still needed once `bar` is judged: those of the bars after it,
 * and each source's running phrase, one that has not yet been silent for a
 * bar, which a later bar is read with. What a phrase left more than
 * `PHRASE_MEMORY` bars back is forgotten.
 */
export function keptAfter(notes: readonly HeardNote[], bar: number): HeardNote[] {
  const edge = barStart(bar + 1);
  const keep = new Set(notes.filter((n) => barOf(n) > bar));
  for (const source of new Set(notes.map((n) => n.source))) {
    const own = notes.filter((n) => n.source === source && n.position < edge);
    const phrase = phrasesOf(own).at(-1);
    if (!phrase || edge - Math.max(...phrase.map((n) => n.end ?? n.position)) >= EMPTY_BAR)
      continue;
    for (const n of phrase) if (n.position >= edge - PHRASE_MEMORY * BAR_STEPS) keep.add(n);
  }
  return notes.filter((n) => keep.has(n));
}

/**
 * The motif the band takes from a bar's judgements, or none: the one the
 * reading is surest of (a judgement without a confidence counts as sure),
 * and of those the one with the most notes, and of those the first to
 * arrive. The prototype took the most notes; the reading's confidence
 * separates the players read right from those read wrong far better than
 * the number of notes does (E17), so it comes first. Before both comes
 * whether the motif was `confirmed`, heard before (#204 H8, Q12).
 */
export function taken(
  judgements: readonly Judgement[],
  confirmed: ReadonlySet<Judgement> = new Set(),
): (Judgement & { kind: 'motif' }) | null {
  const notes = (m: Motif) => m.degrees.filter((d) => d !== null).length;
  const sure = (j: Judgement & { kind: 'motif' }) => j.confidence ?? 1;
  const heard = (j: Judgement) => (confirmed.has(j) ? 1 : 0);
  let best: (Judgement & { kind: 'motif' }) | null = null;
  for (const j of judgements) {
    if (j.kind !== 'motif') continue;
    if (
      best === null ||
      heard(j) > heard(best) ||
      (heard(j) === heard(best) &&
        (sure(j) > sure(best) || (sure(j) === sure(best) && notes(j.motif) > notes(best.motif))))
    )
      best = j;
  }
  return best;
}

function judge(
  source: string,
  heard: readonly HeardNote[],
  bar: number,
  key: Key,
  confidence?: number,
): Judgement {
  if (heard.length > MUSE.mashing) return { kind: 'mashing', source, count: heard.length };
  const top = new Map<number, HeardNote>();
  for (const n of heard) {
    const step = heardStep(n) - barStart(bar);
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
    const released = Math.max(step + 1, heardStep({ position: n.end }) - barStart(bar));
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
    ...(confidence === undefined ? {} : { confidence }),
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
      const { confidence } = judgement;
      if (confidence !== undefined && !(confidence >= 0 && confidence <= 1)) return false;
      if (motif.cycle !== BAR_STEPS || motifProblems(motif).length > 0) return false;
      if (!motif.onsets.every(Number.isInteger)) return false;
      const notes = motif.degrees.filter((d) => d !== null);
      if (notes.length < MUSE.fewest || notes.length > MUSE.mashing) return false;
      if (!notes.every(Number.isInteger)) return false;
      if (!motif.accidentals.every((a) => a === -1 || a === 0 || a === 1)) return false;
      const scale = keyHelix(key);
      const spanFrom = (origin: number) => {
        const heights = motif.degrees.flatMap((d, i) =>
          d === null ? [] : [alteredHeight(scale, origin + d, motif.accidentals[i]!)],
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
  if (j.confidence !== undefined && typeof j.confidence !== 'number') return false;
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

/**
 * How much a remembered motif keeps of its weight each bar: its time
 * constant is under seven bars, so a motif heard often weighs more than one
 * heard long ago.
 */
export const MOTIF_DECAY = 0.85;

/**
 * The least weight a motif is remembered at: what one heard once weighs
 * `MUSE.forgetAfter` bars on, and half a bar's fade more, so it is kept as
 * long as an offer outlasts silence and no longer.
 */
const MOTIF_FLOOR = MOTIF_DECAY ** (MUSE.forgetAfter + 0.5);

/** A motif the Muse remembers: as first heard, from whom and when, and how much it weighs now. */
export interface Remembered {
  readonly motif: Motif;
  readonly source: string;
  readonly bar: number;
  readonly weight: number;
}

/** A motif heard as one remembered: who played it, whose it was and when, and under which operator. */
export interface Recognition {
  readonly source: string;
  readonly of: { readonly source: string; readonly bar: number };
  readonly op: MotifOp;
}

export interface MuseCarried {
  readonly offer: Offer | null;
  /** The last bar anyone played in, or null before anyone has. */
  readonly lastPlayed: number | null;
  /** The motifs she took, fading (C9). */
  readonly memory: readonly Remembered[];
}

/** A bar as the Muse heard it: what it judged, what it offers after, and why it forgot, if it did. */
export interface MuseOutput {
  readonly bar: number;
  readonly judgements: readonly Judgement[];
  readonly offer: Offer | null;
  readonly forgot: 'asked' | 'silence' | null;
  /** The motifs of the bar heard as ones remembered from the bars before (Q12). */
  readonly recognised: readonly Recognition[];
}

/**
 * A bar's motifs heard against the memory of the bars before, and the
 * memory a bar later: faded, each motif heard again weighing more, each new
 * one remembered, and what has faded below the floor forgotten.
 */
function remember(
  memory: readonly Remembered[],
  judgements: readonly Judgement[],
  bar: number,
): { memory: Remembered[]; recognised: Recognition[]; confirmed: Set<Judgement> } {
  const faded = fold(
    memory.map((e) => e.weight),
    MOTIF_DECAY,
    [],
  );
  const alive = memory
    .map((e, i) => ({ ...e, weight: faded[i]! }))
    .filter((e) => e.weight >= MOTIF_FLOOR);
  const entries = [...alive];
  const readings: [number, number][] = [];
  const recognised: Recognition[] = [];
  const confirmed = new Set<Judgement>();
  for (const j of judgements) {
    if (j.kind !== 'motif') continue;
    let index = -1;
    let op: MotifOp | null = null;
    while (op === null && ++index < alive.length) op = recognise(j.motif, alive[index]!.motif);
    if (op !== null) {
      const { source, bar: first } = alive[index]!;
      recognised.push({ source: j.source, of: { source, bar: first }, op });
      confirmed.add(j);
    } else {
      // A unison heard in this bar is one motif, remembered once.
      index = entries.findIndex((e, i) => i >= alive.length && recognise(j.motif, e.motif));
      if (index === -1)
        index = entries.push({ motif: j.motif, source: j.source, bar, weight: 0 }) - 1;
    }
    if (!readings.some(([i]) => i === index)) readings.push([index, 1]);
  }
  // Faded already: the readings are added as they are.
  const weights = fold(
    entries.map((e) => e.weight),
    1,
    readings,
  );
  return { memory: entries.map((e, i) => ({ ...e, weight: weights[i]! })), recognised, confirmed };
}

export const muse: Machine<MuseEnv, MuseCarried, MuseInput, MuseOutput> = {
  initial: { offer: null, lastPlayed: null, memory: [] },
  advance({ bar }, carried, { judgements, forget }) {
    let { offer, lastPlayed } = carried;
    let forgot: MuseOutput['forgot'] = null;
    if (forget && offer) {
      offer = null;
      forgot = 'asked';
    }
    const { memory, recognised, confirmed } = remember(carried.memory, judgements, bar);
    if (judgements.length > 0) {
      lastPlayed = bar;
      const best = taken(judgements, confirmed);
      if (best) offer = { motif: best.motif, source: best.source, bar, level: best.level };
    } else if (offer && lastPlayed !== null && bar - lastPlayed > MUSE.forgetAfter) {
      offer = null;
      forgot = 'silence';
    }
    return {
      carried: { offer, lastPlayed, memory },
      output: { bar, judgements, offer, forgot, recognised },
    };
  },
};
