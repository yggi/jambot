/**
 * A humaniser and a yardstick for how the Muse reads a sloppy player (#204, A0).
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
 * pattern played exactly (`judgeBar` at sloppiness 0), so the yardstick asks
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
} from '../src/index.ts';

/** A reader: what the Muse would make of the notes heard, for one bar. */
export type Reader = (notes: readonly HeardNote[], bar: number, key: Key) => Judgement[];

/** The reading that exists: `judgeBar`. */
export const BASELINE: Reader = judgeBar;

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
 * note values change from beat to beat (A3's ground). A segment is a rest
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
    const target = motifOf(judgeBar(exact, BAR, key));
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

/** Each note as heard: judged on the nearest step by `judgeBar` itself. */
export const AS_HEARD: Hearing = (notes) => [...notes];

/** Each phrase read as one span (`readHeard`, #204 A1). */
export const AS_PHRASES: Hearing = readHeard;

/** What a hearing made of phrases, over the same bars (E17, A1). */
export interface PhraseRate {
  readonly bars: number;
  /** Bars read back as the target motif exactly. */
  readonly right: number;
  /** Bars whose notes all start on the steps they were meant for, whatever the rests. */
  readonly onsets: number;
  /** Bars whose rests all fall on the steps they were meant for, and no others (A4). */
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
 * two phrases each, of patterns of one dominant note value (`pattern`) or
 * of beats that divide by themselves (`beatPattern`), each humanised alone (a phrase's offset and drift are its own).
 */
export function phraseRate(
  hearing: Hearing,
  sloppiness: number,
  key: Key,
  seed = 1,
  source: (index: number) => Segment[] = pattern,
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
        humanise(
          parts.filter((p) => p.phrase === phrase).map((p) => p.note),
          sloppiness,
          seed,
          (index * TRIALS + trial) * 2 + phrase,
        ),
      );
      const read = hearing(heard);
      const barsOf = new Set(exact.map((n) => barAt(n.position)));
      for (const bar of barsOf) {
        const target = motifOf(judgeBar(exact, bar, key));
        if (!target) continue;
        bars++;
        const got = motifOf(judgeBar(read, bar, key));
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
