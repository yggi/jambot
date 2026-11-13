/**
 * A humaniser and a yardstick for how the Muse reads a sloppy player (#204, H0).
 *
 * `humanise` plays a bar the way a hand would: each onset off the beat by
 * some milliseconds, the whole phrase early or late, the tempo drifting over
 * the bar, and each note released short of where it was written. One number,
 * `sloppiness`, is the standard deviation in milliseconds of the onset
 * jitter, of the phrase's offset, of the drift over a bar (or over the
 * phrase, if longer) and of the
 * release's jitter; the notes are also held the shorter of their length, the
 * sloppier the player (`gate`). At 0 it plays the bar exactly as written.
 *
 * `readingRate` measures a reader over a fixed set of patterns: the share of
 * bars it reads back as the motif the pattern was written as. A pattern is
 * played in bar 1, so a note struck early lands in bar 0, where it is lost
 * to the bar that meant it. The target is what the Muse makes of the
 * pattern played exactly (`judgeBar` on the nearest step, at sloppiness 0), so the yardstick asks
 * for nothing the Muse can't already give, and the baseline is the reading
 * that exists.
 *
 * Every draw is keyed by a seed and a position (`keyedRng`), so a table
 * replays exactly.
 */

import {
  BAR_STEPS,
  type HeardNote,
  type Judgement,
  type Key,
  barAt,
  barStart,
  judgeBar,
  keyedRng,
  readHeard,
  taken,
  type Reading,
  folded,
  priorOf,
  type Hand as RememberedHand,
  type LeadNote,
  distilledLead,
  heardLead,
  readLead,
  keyHelix,
  SONG_CLOCK,
  phrasesOf,
} from '../src/index.ts';
import { METERS, heightOf } from '@jambot/theory';
const METERS_4_4 = METERS['4/4'];

/** A reader: what the Muse would make of the notes heard, for one bar. */
export type Reader = (notes: readonly HeardNote[], bar: number, key: Key) => Judgement[];

/** The reading the Muse began with: `judgeBar`, each note on the nearest step. */
export const BASELINE: Reader = (notes, bar, key) => judgeBar(notes, bar, key, 'nearest');

/** The tempo the milliseconds are read at, in beats per minute. */
export const BPM = 120;

/** A step in milliseconds at `bpm`: a sixteenth of a bar of 4 beats. */
export const stepMs = (bpm = BPM) => 60000 / bpm / 4;

/** How much of a written length a hand holds a note: 1 at no sloppiness, less as it grows. */
export const gate = (sloppiness: number) => Math.max(0.5, 1 - sloppiness / 500);

/** A draw from the normal distribution with mean 0 and standard deviation 1 (Box-Muller). */
function normal(rng: () => number): number {
  const u = 1 - rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/**
 * The notes of a pattern played as a hand would, from `sloppiness` in
 * milliseconds. The draws are keyed by `seed` and `trial`; a note's are
 * also keyed by its place in the pattern, so the same trial at a growing
 * sloppiness moves the same notes further the same way.
 */
export function humanise(
  notes: readonly HeardNote[],
  sloppiness: number,
  seed: number,
  trial: number,
): HeardNote[] {
  if (sloppiness === 0) return notes.map((n) => ({ ...n }));
  const toSteps = sloppiness / stepMs();
  const phrase = keyedRng(seed, trial, 0);
  const offset = normal(phrase) * toSteps;
  const drift = normal(phrase) * toSteps;
  const first = notes[0]?.position ?? 0;
  const span = Math.max(BAR_STEPS, (notes.at(-1)?.position ?? 0) - first);
  return notes.map((n, i) => {
    const rng = keyedRng(seed, trial, 1 + i);
    const shift = offset + (drift * (n.position - first)) / span + normal(rng) * toSteps;
    const held = n.end === null ? null : (n.end - n.position) * gate(sloppiness);
    return {
      ...n,
      position: n.position + shift,
      end: held === null ? null : n.position + shift + held + normal(rng) * toSteps * 0.5,
    };
  });
}

/**
 * A hand as #580 measures it: a steady latency, late positive, and the
 * jitter of each onset about it, in milliseconds. A tight hand's latency
 * (its input, the audio it hears late, its own lead) is the same over a
 * phrase; only the jitter is its looseness. `humanise`'s one sloppiness
 * draws the latency afresh for every phrase, at the same size as the jitter.
 */
export interface Hand {
  readonly lateMs: number;
  readonly jitterMs: number;
}

/**
 * The notes of a pattern played by `hand`: each onset late by the hand's
 * latency and off it by a draw of its jitter, each note held as `humanise`
 * holds it at that jitter, its release off by half a draw. Keyed by `seed`
 * and `trial` as `humanise` is.
 */
export function handed(
  notes: readonly HeardNote[],
  hand: Hand,
  seed: number,
  trial: number,
): HeardNote[] {
  const late = hand.lateMs / stepMs();
  const jitter = hand.jitterMs / stepMs();
  return notes.map((n, i) => {
    const rng = keyedRng(seed, trial, 1 + i);
    const shift = late + normal(rng) * jitter;
    const held = n.end === null ? null : (n.end - n.position) * gate(hand.jitterMs);
    return {
      ...n,
      position: n.position + shift,
      end: held === null ? null : n.position + shift + held + normal(rng) * jitter * 0.5,
    };
  });
}

/** A note value in steps, and how a pattern is filled with them. */
const VALUES = [1, 2, 3, 4, 6, 8] as const;

/** A pattern: note or rest segments, filling a bar. */
export interface Segment {
  readonly length: number;
  readonly rest: boolean;
}

/**
 * The pattern with index `index`: a bar filled with one dominant note value
 * (a quarter, an eighth or a sixteenth) that sometimes gives way to the
 * value twice as long or half as long, or to a dotted one, with rests where
 * a player leaves gaps. The last segment is cut to fill the bar.
 */
export function pattern(index: number): Segment[] {
  const rng = keyedRng(17, index);
  const unit = ([1, 2, 4] as const)[Math.floor(rng() * 3)]!;
  const segments: Segment[] = [];
  let left = BAR_STEPS;
  while (left > 0) {
    const roll = rng();
    const wanted =
      roll < 0.65
        ? unit
        : roll < 0.75
          ? unit * 2
          : roll < 0.85
            ? Math.max(1, unit / 2)
            : VALUES[Math.floor(rng() * VALUES.length)]!;
    segments.push({ length: Math.min(wanted, left), rest: rng() < 0.15 });
    left -= segments.at(-1)!.length;
  }
  return segments;
}

/** How a beat divides, in steps: a quarter, two eighths, four sixteenths, and mixes of them, one of which is dotted. */
const BEAT_DIVISIONS = [[4], [2, 2], [1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [3, 1]] as const;

/**
 * The pattern with index `index` whose beats each divide by themselves: a
 * bar of four beats, each a quarter, eighths, sixteenths or a mix, so its
 * note values change from beat to beat (H3's ground). A segment is a rest
 * one time in ten.
 */
export function beatPattern(index: number): Segment[] {
  const rng = keyedRng(23, index);
  return range(4).flatMap(() =>
    BEAT_DIVISIONS[Math.floor(rng() * BEAT_DIVISIONS.length)]!.map((length) => ({
      length,
      rest: rng() < 0.1,
    })),
  );
}

/**
 * The pattern with index `index` a beginner plays (#580): quarters and
 * eighths on the beat, now and then a half, a rest one time in ten.
 */
export function beginnerPattern(index: number): Segment[] {
  const rng = keyedRng(29, index);
  const segments: Segment[] = [];
  let left = BAR_STEPS;
  while (left > 0) {
    const roll = rng();
    const lengths = roll < 0.45 ? [4] : roll < 0.85 ? [2, 2] : left >= 8 ? [8] : [4];
    for (const length of lengths) segments.push({ length, rest: rng() < 0.1 });
    left -= lengths.reduce((a, b) => a + b, 0);
  }
  return segments;
}

/**
 * Syncopations a skilled player means, on the sixteenths of a bar of 4/4,
 * each mixing onsets on the beat and off it: the tresillo twice, son and
 * rumba clave 3-2, a bossa nova's, a funk line's, an anticipated bar, and
 * offbeats against the downbeat.
 */
export const SYNCOPATIONS: readonly (readonly number[])[] = [
  [0, 3, 6, 8, 11, 14],
  [0, 3, 6, 10, 12],
  [0, 3, 7, 10, 12],
  [0, 3, 6, 10, 13],
  [0, 3, 6, 7, 10, 12, 15],
  [0, 2, 4, 7, 10, 12, 14],
  [0, 2, 6, 10, 14],
  [0, 4, 7, 9, 12, 15],
];

/** The pattern with index `index` a skilled player syncopates (#580): one of `SYNCOPATIONS`, each note held to the next. */
export function syncopatedPattern(index: number): Segment[] {
  const onsets = SYNCOPATIONS[index % SYNCOPATIONS.length]!;
  return onsets.map((at, i) => ({ length: (onsets[i + 1] ?? BAR_STEPS) - at, rest: false }));
}

/** The notes of a pattern played exactly in `bar`: each held its whole segment, in A minor's pentatonic. */
export function played(segments: readonly Segment[], bar: number, index: number): HeardNote[] {
  const rng = keyedRng(19, index);
  const pitches = [57, 60, 62, 64, 67, 69, 72];
  let at = barStart(bar);
  const heard: HeardNote[] = [];
  for (const { length, rest } of segments) {
    if (!rest)
      heard.push({
        note: pitches[Math.floor(rng() * pitches.length)]!,
        velocity: 100,
        source: 'a hand',
        position: at,
        end: at + length,
      });
    at += length;
  }
  return heard;
}

/** The bar a pattern is played in: bar 1, so that bar 0 is where an early note strays. */
export const BAR = 1;

/** The number of patterns a rate is measured over, and of humanised trials of each. */
export const PATTERNS = 200;
export const TRIALS = 5;

/** Why a bar was not read right: not exclusive, so a bar may count under several. */
export interface Causes {
  /** A note was heard in another bar than the pattern's. */
  readonly strayed: number;
  /** The Muse made no motif of it: too few notes, or mashing. */
  readonly noMotif: number;
  /** The motif has other rests than the pattern's. */
  readonly rests: number;
  /** The motif has the same notes and rests, but a note is on another step. */
  readonly moved: number;
  /** The motif has other notes than the pattern's, or the pattern's are merged. */
  readonly notes: number;
}

/** What a reader made of the patterns at one sloppiness. */
export interface Rate {
  readonly bars: number;
  /** The bars read back as the target motif exactly. */
  readonly right: number;
  /** The bars whose notes and rests fall on the target's steps, whatever the degrees. */
  readonly rhythm: number;
  readonly causes: Causes;
}

const motifOf = (judgements: readonly Judgement[]) => {
  const j = judgements.find((x) => x.kind === 'motif');
  return j?.kind === 'motif' ? j.motif : null;
};

/** Notes and rests of a motif as text: the step and what sounds there. */
const rhythmOf = (m: NonNullable<ReturnType<typeof motifOf>>) =>
  m.onsets.map((o, i) => `${o}${m.degrees[i] === null ? 'r' : 'n'}`).join(' ');

/**
 * The share of bars `reader` reads as their target at `sloppiness`, over
 * `PATTERNS` patterns (those whose exact playing the Muse takes as a motif)
 * each humanised `TRIALS` times. Rates depend on the seed only through the
 * draws that are keyed to it.
 */
export function readingRate(reader: Reader, sloppiness: number, key: Key, seed = 1): Rate {
  let bars = 0;
  let right = 0;
  let rhythm = 0;
  const causes = { strayed: 0, noMotif: 0, rests: 0, moved: 0, notes: 0 };
  for (let index = 0; index < PATTERNS; index++) {
    const exact = played(pattern(index), BAR, index);
    const target = motifOf(judgeBar(exact, BAR, key, 'nearest'));
    if (!target) continue;
    for (let trial = 0; trial < TRIALS; trial++) {
      const heard = humanise(exact, sloppiness, seed, index * TRIALS + trial);
      bars++;
      const read = motifOf(reader(heard, BAR, key));
      const same =
        read &&
        rhythmOf(read) === rhythmOf(target) &&
        read.degrees.join() === target.degrees.join() &&
        read.accidentals.join() === target.accidentals.join();
      if (same) right++;
      if (read && rhythmOf(read) === rhythmOf(target)) rhythm++;
      if (same) continue;
      if (heard.some((n) => barAt(Math.round(n.position)) !== BAR)) causes.strayed++;
      if (!read) causes.noMotif++;
      else {
        const rests = (m: typeof read) => m.degrees.filter((d) => d === null).length;
        const count = (m: typeof read) => m.degrees.length - rests(m);
        if (rests(read) !== rests(target)) causes.rests++;
        else if (count(read) !== count(target)) causes.notes++;
        else if (rhythmOf(read) !== rhythmOf(target)) causes.moved++;
        else causes.notes++;
      }
    }
  }
  return { bars, right, rhythm, causes };
}

/** A hearing: the notes as the reader takes them, before each bar is judged. The baseline takes them as heard. */
export type Hearing = (notes: readonly HeardNote[]) => HeardNote[];

/** Each note as heard. */
export const AS_HEARD: Hearing = (notes) => [...notes];

/** Each phrase read as one span (`readHeard`, #204 H1). */
export const AS_PHRASES: Hearing = readHeard;

/** What a hearing made of phrases, over the same bars (E17, H1). */
export interface PhraseRate {
  readonly bars: number;
  /** Bars read back as the target motif exactly. */
  readonly right: number;
  /** Bars whose notes all start on the steps they were meant for, whatever the rests. */
  readonly onsets: number;
  /** Bars whose rests all fall on the steps they were meant for, and no others (H4). */
  readonly rests: number;
  /** Bars with a note read in another bar than it was meant for. */
  readonly strayed: number;
}

/** The bars of phrase `which` of performance `index`: one to three, a pattern each. */
const phraseBars = (index: number, which: 0 | 1) => 1 + ((index + which) % 3);

/**
 * A performance: two phrases of one to three bars each, one empty bar
 * between, from bar 1. Each note's velocity is its number, so where a hearing
 * puts it can be told from where it was meant.
 */
function performance(index: number, source: (i: number) => Segment[]) {
  const first = phraseBars(index, 0);
  const second = phraseBars(index, 1);
  const bars = [
    ...range(first).map((j) => ({ bar: 1 + j, pattern: index * 6 + j, phrase: 0 })),
    ...range(second).map((j) => ({ bar: first + 2 + j, pattern: index * 6 + 3 + j, phrase: 1 })),
  ];
  const notes = bars.flatMap(({ bar, pattern: p, phrase }) =>
    played(source(p), bar, p).map((n) => ({ ...n, phrase })),
  );
  return notes.map(({ phrase, ...n }, i) => ({ note: { ...n, velocity: 1 + i }, phrase }));
}

const range = (n: number) => [...Array(n).keys()];

/** The bar-relative steps of a motif's notes. */
const noteSteps = (m: NonNullable<ReturnType<typeof motifOf>>) =>
  m.onsets.filter((_, i) => m.degrees[i] !== null).join();

/** The bar-relative steps of a motif's rests. */
const restSteps = (m: NonNullable<ReturnType<typeof motifOf>>) =>
  m.onsets.filter((_, i) => m.degrees[i] === null).join();

/**
 * The share of bars a hearing reads as their target, over performances of
 * two phrases each, judged as `reading` says (the nearest step unless the
 * Muse's own reading is asked for), of patterns of one dominant note value (`pattern`) or
 * of beats that divide by themselves (`beatPattern`), each humanised alone (a phrase's offset and drift are its own).
 */
export function phraseRate(
  hearing: Hearing,
  sloppiness: number,
  key: Key,
  seed = 1,
  source: (index: number) => Segment[] = pattern,
  reading: Reading = 'nearest',
): PhraseRate {
  return rateOf(
    hearing,
    (notes, trial) => humanise(notes, sloppiness, seed, trial),
    key,
    source,
    reading,
  );
}

/**
 * `phraseRate` for a hand of a steady latency and a jitter (#580): the same
 * performances and counts, each phrase played by `hand` (`handed`).
 */
export function handRate(
  hearing: Hearing,
  hand: Hand,
  key: Key,
  seed = 1,
  source: (index: number) => Segment[] = pattern,
  reading: Reading = 'nearest',
): PhraseRate {
  return rateOf(hearing, (notes, trial) => handed(notes, hand, seed, trial), key, source, reading);
}

/** What a hearing makes of the performances, each phrase played by `play`, keyed by its trial. */
function rateOf(
  hearing: Hearing,
  play: (notes: readonly HeardNote[], trial: number) => HeardNote[],
  key: Key,
  source: (index: number) => Segment[],
  reading: Reading,
): PhraseRate {
  let bars = 0;
  let right = 0;
  let onsets = 0;
  let rests = 0;
  let strayed = 0;
  for (let index = 0; index < PATTERNS; index++) {
    const parts = performance(index, source);
    const exact = parts.map((p) => p.note);
    const intended = new Map(exact.map((n) => [n.velocity, barAt(n.position)]));
    for (let trial = 0; trial < TRIALS; trial++) {
      const heard = [0, 1].flatMap((phrase) =>
        play(
          parts.filter((p) => p.phrase === phrase).map((p) => p.note),
          (index * TRIALS + trial) * 2 + phrase,
        ),
      );
      const read = hearing(heard);
      const barsOf = new Set(exact.map((n) => barAt(n.position)));
      for (const bar of barsOf) {
        const target = motifOf(judgeBar(exact, bar, key, 'nearest'));
        if (!target) continue;
        bars++;
        const got = motifOf(judgeBar(read, bar, key, reading));
        if (
          got &&
          rhythmOf(got) === rhythmOf(target) &&
          got.degrees.join() === target.degrees.join()
        )
          right++;
        if (got && noteSteps(got) === noteSteps(target)) onsets++;
        if (got && restSteps(got) === restSteps(target)) rests++;
        if (
          read.some(
            (n) => intended.get(n.velocity) === bar && barAt(Math.round(n.position)) !== bar,
          )
        )
          strayed++;
      }
    }
  }
  return { bars, right, onsets, rests, strayed };
}

/** A bar the Muse judged as a motif: how sure it said it was, and whether it read the motif meant. */
export interface Judged {
  readonly confidence: number;
  readonly right: boolean;
}

/**
 * The bars of one-bar patterns (`pattern`) that `judgeBar` reads, in its own
 * reading of a phrase so far, as motifs, at `sloppiness`, each with the
 * confidence it carries.
 */
export function judgedBars(sloppiness: number, key: Key, seed = 1): Judged[] {
  const out: Judged[] = [];
  for (let index = 0; index < PATTERNS; index++) {
    const exact = played(pattern(index), BAR, index);
    const target = motifOf(judgeBar(exact, BAR, key, 'nearest'));
    if (!target) continue;
    for (let trial = 0; trial < TRIALS; trial++) {
      const heard = humanise(exact, sloppiness, seed, index * TRIALS + trial);
      const j = judgeBar(heard, BAR, key).find((x) => x.kind === 'motif');
      if (j?.kind !== 'motif') continue;
      const same =
        rhythmOf(j.motif) === rhythmOf(target) && j.motif.degrees.join() === target.degrees.join();
      out.push({ confidence: j.confidence ?? 1, right: same });
    }
  }
  return out;
}

/**
 * The chance that a bar read right carries more confidence than one read
 * wrong, drawn at random from each (ties half): 0.5 for a confidence that
 * says nothing, 1 for one that always sorts the right from the wrong.
 */
export function separation(bars: readonly Judged[]): number {
  const right = bars.filter((b) => b.right);
  const wrong = bars.filter((b) => !b.right);
  if (right.length === 0 || wrong.length === 0) return 0.5;
  let wins = 0;
  for (const r of right)
    for (const w of wrong)
      wins += r.confidence > w.confidence ? 1 : r.confidence === w.confidence ? 0.5 : 0;
  return wins / (right.length * wrong.length);
}

/** How often the motif the band takes is one read right, of two players' bars. */
export interface Choice {
  /** Pairs of players whose bars were both read as motifs. */
  readonly pairs: number;
  /** The prototype's rule, the most notes, took a motif read right. */
  readonly byNotes: number;
  /** `taken`, the surest reading, took a motif read right. */
  readonly bySureness: number;
}

/**
 * Two players play different patterns in the same bar, one at
 * `sloppinessA` and one at `sloppinessB`; the Muse judges both, and each
 * rule takes one. A pick is right where it is the motif its player meant
 * (the Muse's reading of the exact playing), whichever player it is.
 */
export function choiceRate(sloppinessA: number, sloppinessB: number, key: Key, seed = 1): Choice {
  const notes = (j: Judgement & { kind: 'motif' }) =>
    j.motif.degrees.filter((d) => d !== null).length;
  let pairs = 0;
  let byNotes = 0;
  let bySureness = 0;
  for (let i = 0; i < PATTERNS; i++) {
    const own = [0, 1].map((k) => played(pattern(2 * i + k), BAR, 2 * i + k));
    const targets = own.map((exact, k) =>
      motifOf(
        judgeBar(
          exact.map((n) => ({ ...n, source: 'ab'[k]! })),
          BAR,
          key,
          'nearest',
        ),
      ),
    );
    if (!targets[0] || !targets[1]) continue;
    for (let trial = 0; trial < TRIALS; trial++) {
      const heard = [sloppinessA, sloppinessB].flatMap((s, k) =>
        humanise(
          own[k]!.map((n) => ({ ...n, source: 'ab'[k]! })),
          s,
          seed,
          (i * TRIALS + trial) * 2 + k,
        ),
      );
      const motifs = judgeBar(heard, BAR, key).filter(
        (j): j is Judgement & { kind: 'motif' } => j.kind === 'motif',
      );
      if (motifs.length < 2) continue;
      pairs++;
      const right = (j: Judgement & { kind: 'motif' }) => {
        const target = targets['ab'.indexOf(j.source)]!;
        return (
          rhythmOf(j.motif) === rhythmOf(target) && j.motif.degrees.join() === target.degrees.join()
        );
      };
      const byCount = motifs.reduce((best, j) => (notes(j) > notes(best) ? j : best));
      if (right(byCount)) byNotes++;
      const sure = taken(motifs);
      if (sure && right(sure)) bySureness++;
    }
  }
  return { pairs, byNotes, bySureness };
}

/** What a hearing made of a session's phrases (#580, rung 6): all of them, and those after the hand's memory has formed. */
export interface SessionRate {
  readonly bars: number;
  readonly right: number;
  /** The bars of the phrases from the third on, read once `HAND_EVIDENCE` phrases are folded. */
  readonly laterBars: number;
  readonly laterRight: number;
}

/** The phrases a session plays: `PHRASES_IN_SESSION` of them, each one bar or two, an empty bar between. */
export const PHRASES_IN_SESSION = 8;

/** The sessions a rate is measured over, each of one hand. */
export const SESSIONS = 60;

/**
 * One hand plays a session (#580, rung 6): `PHRASES_IN_SESSION` phrases, each of one or two bars of patterns of the
 * kinds `sources` cycles through, an empty bar between, all at the hand's one latency and jitter. Each phrase is read
 * as the Muse reads it, whole, under a prior: a hand not yet heard's, or with `remember`, the hand's memory of the
 * phrases before it (`priorOf`, `folded`). Bars right as in `phraseRate`.
 */
export function sessionRate(
  hand: Hand,
  key: Key,
  sources: readonly ((index: number) => Segment[])[],
  remember: boolean,
  seed = 1,
): SessionRate {
  let bars = 0;
  let right = 0;
  let laterBars = 0;
  let laterRight = 0;
  for (let session = 0; session < SESSIONS; session++) {
    let memory: RememberedHand | undefined;
    let bar = 1;
    for (let k = 0; k < PHRASES_IN_SESSION; k++) {
      const index = session * PHRASES_IN_SESSION + k;
      const source = sources[(session + k) % sources.length]!;
      const length = 1 + (index % 2);
      const exact = range(length).flatMap((j) =>
        played(source(index * 2 + j), bar + j, index * 2 + j),
      );
      const heard = handed(exact, hand, seed, index);
      const prior = remember ? priorOf(memory) : undefined;
      const read = phrasesOf(heard).flatMap((phrase) => readHeard(phrase, undefined, prior));
      for (let j = 0; j < length; j++) {
        const target = motifOf(judgeBar(exact, bar + j, key, 'nearest'));
        if (!target) continue;
        const got = motifOf(judgeBar(read, bar + j, key, 'nearest'));
        const same =
          got && rhythmOf(got) === rhythmOf(target) && got.degrees.join() === target.degrees.join();
        bars++;
        if (same) right++;
        if (k >= 2) {
          laterBars++;
          if (same) laterRight++;
        }
      }
      if (remember)
        for (const phrase of phrasesOf(heard)) memory = folded(memory, phrase, SONG_CLOCK);
      bar += length + 1;
    }
  }
  return { bars, right, laterBars, laterRight };
}

/** Twinkle's first two bars in A minor, eighths, the last of each held: A A E E F F E, D D C C B B A (#580, rung 3). */
export const TWINKLE_BARS: readonly (readonly (readonly [step: number, note: number])[])[] = [
  [69, 69, 76, 76, 77, 77, 76],
  [74, 74, 72, 72, 71, 71, 69],
].map((bar) => bar.map((note, i) => [2 * i, note] as const));

/** Twinkle's two bars as the one line the Muse should file: degrees from its first note, over two bars. */
export const TWINKLE_LINE: readonly LeadNote[] = [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0].map(
  (degree, i) => ({
    step: 2 * i + (i >= 7 ? 2 : 0),
    degree,
    alter: 0,
  }),
);

/**
 * How often the Muse files Twinkle's two bars as one line of two bars (#580, rung 3): over `seeds` hands of
 * `sloppiness`, each playing the two bars twice from bar 1 as one phrase, every bar judged as she judges it, the bars
 * heard as a lead (`heardLead`) and the section distilled (`distilledLead`).
 */
export function phraseFiledRate(
  sloppiness: number,
  key: Key,
  seeds = 20,
): { readonly seeds: number; readonly right: number } {
  let right = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const exact: HeardNote[] = range(4).flatMap((k) => {
      const bar = TWINKLE_BARS[k % 2]!;
      return bar.map(([step, note], i) => ({
        note,
        velocity: 100,
        source: 'a hand',
        position: barStart(1 + k) + step,
        end: barStart(1 + k) + (bar[i + 1]?.[0] ?? 16),
      }));
    });
    const heard = humanise(exact, sloppiness, seed, 0);
    const bars = range(4).flatMap((k) => heardLead(judgeBar(heard, 1 + k, key), 1 + k));
    const line = distilledLead(bars, BAR_STEPS)?.notes;
    if (line && JSON.stringify(line) === JSON.stringify(TWINKLE_LINE)) right++;
  }
  return { seeds, right };
}

/** Twinkle whole and Hänschen klein whole, each as cells writes it: the form over Kinderlieder's parts (#580, rung 4; yggi/cells#642). */
export const TUNES_WHOLE = {
  twinkle: [
    '&twinkle from kinderlied &key',
    '&wonder from kinderlied &key',
    '&lead from ternary(answer=&wonder) &twinkle',
  ].join('\n'),
  haenschen: [
    '&haenschen from kinderlied &key',
    '&hinein from kinderlied &key',
    '&heim from kinderlied &key',
    '&weinet from kinderlied &key',
    '&lead from rounded_binary(answer=&hinein, close=&heim, bridge=&weinet) &haenschen',
  ].join('\n'),
} as const;

/**
 * How often the Muse files a tune played whole as the form it is (#580, rung 4): over `seeds` hands of `sloppiness`,
 * each playing the tune's notes (cells' form over its motifs, read as the key's degrees, in `key` from the tonic of
 * A4's octave) from bar 1 once, every bar judged as she judges it, heard as a lead and the section distilled in 4/4;
 * right where she files the tune's own text.
 */
export function formFiledRate(
  tune: keyof typeof TUNES_WHOLE,
  sloppiness: number,
  key: Key,
  seeds = 40,
): { readonly seeds: number; readonly right: number } {
  const read = readLead(TUNES_WHOLE[tune], METERS_4_4)!;
  const scale = keyHelix(key);
  const exact: HeardNote[] = read.notes.map((n, i) => ({
    note: heightOf(scale, 35 + n.degree),
    velocity: 100,
    source: 'a hand',
    position: barStart(1) + n.step,
    end: barStart(1) + (read.notes[i + 1]?.step ?? read.bars * BAR_STEPS),
  }));
  let right = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const heard = humanise(exact, sloppiness, seed, 0);
    const bars = range(read.bars).flatMap((k) => heardLead(judgeBar(heard, 1 + k, key), 1 + k));
    if (distilledLead(bars, BAR_STEPS, '4/4')?.text === TUNES_WHOLE[tune]) right++;
  }
  return { seeds, right };
}
