/**
 * Phrases: what a player plays between two empty bars, read as one span
 * (#204, H1).
 *
 * The Muse doesn't listen a bar at a time. A phrase runs until the player
 * leaves a bar empty, and only then is it cut at the bar lines, so a first
 * note struck a little early is read with the phrase it starts, not lost to
 * the bar before. The reading is a hand's: the notes are heard already
 * un-swung (the transport's own map did that, so no swing is searched), and
 * three things are found in what is left:
 *
 * - the phrase's offset: the whole phrase a little early or late, the mean
 *   of its onsets' residuals from the steps, shrunk toward none, against the
 *   same phrase on steps half a step, a step or more away, where a steady
 *   latency put every onset past the halfway (`offsetOf`, #580);
 * - the hand's looseness, the spread of what is left, which says how far an
 *   onset may be from the step it meant;
 * - the phrase's start, which very probably is on a beat: a first onset
 *   between a beat and the step nearest it goes where the odds, its
 *   distance weighed by the hand's own looseness against `BEAT_EVIDENCE`, say.
 *
 * - the note value: the lattice of a half, a quarter, an eighth or a
 *   sixteenth its onsets sit on, and each beat's own, snapped to (`lattice.ts`,
 *   H2 and H3);
 * - the rests: a release short of the next onset is the player's
 *   articulation unless it stands out from what the phrase's own notes
 *   leave, and then it is a rest of a plausible length (`releasesOf`, H4).
 *
 * What is left, the lengths themselves and how sure the reading is, is H5's.
 */

import { BAR_STEPS, SONG_CLOCK, type SongClock } from './events.ts';
import type { HeardNote } from './muse.ts';
import { LOOSENESS_FLOOR, distance, leastCost, snapToValues, valueOf } from './lattice.ts';
import { quantize } from './random.ts';

/**
 * How long a silence ends a phrase: a whole bar, less a step, since a hand
 * doesn't leave a bar empty to the step.
 */
export const EMPTY_BAR = BAR_STEPS - 1;

/**
 * The silence that ends a phrase where a note starts: a whole bar, less a
 * step, of the bar it is in (`EMPTY_BAR` in 4/4). Each reading here takes the
 * song's clock, 4/4's where none is given, and reads a bar and a beat on it
 * (#260).
 */
const emptyBar = (clock: SongClock, at: number) => clock.barSteps(clock.barAt(at)) - 1;

/**
 * What a phrase starting on a beat is worth against starting on one
 * particular step off it, as the log of the odds, in nats: about 1.8, odds
 * of 6 to 1. A phrase starts on a beat very probably, and the beat has
 * three steps beside it to one. Written as a log so that no transcendental
 * function decides a step (#45).
 */
export const BEAT_EVIDENCE = 1.8;

/**
 * The lengths of a rest a player plausibly means, in steps: a sixteenth, an
 * eighth, a dotted eighth, a quarter and so on up to a bar. A gap between
 * notes is one of these, or none (H4); a gap between them is the nearest.
 */
export const REST_VALUES = [1, 2, 3, 4, 6, 8, 12, 16] as const;

/**
 * How many times the spread of a release against the next onset a gap must
 * exceed the player's usual articulation to be a rest at all. The spread is
 * the hand's looseness, twice over: a release and an onset are each loose.
 */
export const REST_MARGIN = 3;

/** The most of a note's slot a player is taken to leave off it, as articulation; more is a rest. */
export const ARTICULATION_CEILING = 0.3;

const reach = (n: HeardNote) => n.end ?? n.position;

/**
 * The phrases in what was heard, in time. A phrase ends where nothing
 * sounds for `EMPTY_BAR` steps: from the last release, or the last onset
 * where the release is not known, to the next onset.
 */
export function phrasesOf(
  notes: readonly HeardNote[],
  clock: SongClock = SONG_CLOCK,
): HeardNote[][] {
  const sorted = [...notes].sort((a, b) => a.position - b.position);
  const phrases: HeardNote[][] = [];
  let sounding = -Infinity;
  for (const n of sorted) {
    if (n.position - sounding >= emptyBar(clock, n.position)) phrases.push([]);
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
function shrunkOffset(residuals: readonly number[]): number {
  return residuals.reduce((sum, r) => sum + r, 0) / (residuals.length + 1);
}

/**
 * A hand's steady latency, as a prior (#580), in steps: its mean, a fifth of
 * a step late, 25 ms at 120 bpm, and its spread, half a step, about 60 ms. A
 * hand that hears the band late through its input, its audio and its own
 * lead is late by the same over a phrase: #242's first round found a mean of
 * 5 to 34 ms late in every run that kept the beat. Swept on E17 and #580's
 * hands: a mean of none read a phrase 70 ms late as the same phrase a step
 * later and early in about 9 % of bars of one value, and of 0.1 still lost a
 * hand 80 ms late in 10 %; a spread of 0.6 lost 5.5 points of an offbeat
 * phrase played on time.
 */
export const LATENCY_MEAN = 0.2;
export const LATENCY_SPREAD = 0.5;

/**
 * The phases a phrase's steps are tried at, in steps from the nearest, the nearest first: half a step either way,
 * which reads a hand late or early by more than half a step. A whole step more can't be told from the same phrase
 * syncopated a step later, in one phrase; that is the hand's memory's to tell (#580, rung 6).
 */
export const PHASES = [0, -0.5, 0.5] as const;

/**
 * The latest and the earliest a phase reads a phrase, in steps (#580): three quarters of a step late, about 94 ms at
 * 120 bpm, and 0.6 of a step early, 75 ms. Past them, a phrase a little off is read as the same phrase on the beat
 * most of a step away (E17's offbeat phrases at 10 ms); a hand that rushes is rarer than one that drags.
 */
export const LATEST = 0.75;
export const EARLIEST = 0.6;

/**
 * The fewest onsets a phrase is read at another phase with: three, the fewest the Muse hears a motif in. A steady
 * latency is what a phrase's onsets share, and one or two say nothing of it: any phase fits a lone note, and the lattice
 * would put it on whichever step is the coarser.
 */
export const PHASED_FEWEST = 3;

/**
 * The phrase's offset (#580). The nearest steps read a hand late by more
 * than half a step as the phrase a step later and early: every residual
 * wraps. So the phrase is also read at each phase of `PHASES`, every onset
 * half a step earlier or later, each phase with its own offset (the mean of
 * its residuals under the latency's prior, `LATENCY_MEAN`, `LATENCY_SPREAD`)
 * and its own looseness, and each reading costs, in nats:
 * - its onsets less its offset on the lattice that describes them best
 *   (`leastCost`: a place each, and the distance from it over the looseness):
 *   eighths on the beat cost less than the same a sixteenth later, and a
 *   loose hand's quarters less than a rhythm that fits its every slip;
 * - what the looseness costs, a nat an onset for each e-fold of it: a hand
 *   read tighter is likelier, and no phase can explain a loose hand away;
 * - the offset against the latency's prior;
 * - less `BEAT_EVIDENCE` where its first onset is on a beat.
 * The cheapest wins, the nearest steps on a tie and wherever another phase
 * reads the hand later than `LATEST` or earlier than `EARLIEST`. The
 * nearest steps keep the offset and looseness they always had
 * (`shrunkOffset`), so a phrase read there reads as before.
 */
function offsetOf(
  xs: readonly number[],
  clock: SongClock,
): { readonly offset: number; readonly looseness: number } {
  const spreadAbout = (residuals: readonly number[], offset: number) =>
    Math.max(
      LOOSENESS_FLOOR,
      Math.sqrt(residuals.reduce((sum, r) => sum + (r - offset) ** 2, 0) / residuals.length),
    );
  const onBeat = (step: number) => clock.beatStart(clock.beatAt(step)) === step;
  // (each phase's steps, its residuals and its own offset, shrunk as the nearest steps' is; half rounds up, so a phase
  // below rounds toward the earlier step: an exact onset stays on its step either way)
  const readings: { key: string; steps: number[]; residuals: number[]; shrunk: number }[] = [];
  for (const phase of xs.length < PHASED_FEWEST ? [0] : PHASES) {
    const steps = xs.map((x) => (phase < 0 ? -Math.round(phase - x) : Math.round(x - phase)));
    const key = steps.join();
    if (readings.some((r) => r.key === key)) continue;
    const residuals = xs.map((x, i) => x - steps[i]!);
    readings.push({ key, steps, residuals, shrunk: shrunkOffset(residuals) });
  }
  const spreads = readings.map((r) => spreadAbout(r.residuals, r.shrunk));
  let best = 0;
  let least = Infinity;
  const offsets = readings.map(({ steps, residuals }, i) => {
    // (each phase at its own looseness, and what that looseness costs: a hand read tighter is likelier, by a nat for
    // each onset and each e-fold, so no phase can explain a loose hand away; quantised, so no engine's last bit decides)
    const looseness = spreads[i]!;
    const prior = looseness ** 2 / LATENCY_SPREAD ** 2;
    const offset =
      (residuals.reduce((sum, r) => sum + r, 0) + prior * LATENCY_MEAN) /
      (residuals.length + prior);
    const bar = clock.barStart(clock.barAt(steps[0]!));
    const cost =
      leastCost(
        xs.map((x) => x - offset - bar),
        looseness,
      ) +
      xs.length * quantize(Math.log(looseness)) +
      (offset - LATENCY_MEAN) ** 2 / (2 * LATENCY_SPREAD ** 2) -
      (onBeat(steps[0]!) ? BEAT_EVIDENCE : 0);
    if (cost < least && (i === 0 || (offset <= LATEST && offset >= -EARLIEST))) {
      least = cost;
      best = i;
    }
    return offset;
  });
  // (the nearest steps keep the offset and looseness they always had)
  return best === 0
    ? { offset: readings[0]!.shrunk, looseness: spreads[0]! }
    : { offset: offsets[best]!, looseness: spreads[best]! };
}

/**
 * A phrase read: its notes on the steps they meant, and how sure each
 * onset's place is.
 */
export interface PhraseReading {
  readonly notes: HeardNote[];
  /** Per note, in the order of the onsets: 1 where it was struck on its place, 0 halfway to the next. */
  readonly margins: number[];
}

/** How far a position is from its place, as a share of the way to the next place of a lattice of `value`: 1 on it, 0 halfway. */
const margin = (x: number, value: number) => Math.max(0, 1 - (2 * distance(x, value)) / value);

/**
 * A phrase's notes on the steps they meant: the onsets and the releases
 * each less the phrase's offset and rounded, and the first onset put on the
 * beat where the odds say so. The notes keep their pitches, velocities and
 * sources; the order is the order of the onsets. Each onset also gets its
 * margin (`PhraseReading`): how near it sits to the place it was read on,
 * against the halfway to the next, which is what the reading is unsure of.
 */
export function readPhraseWithMargins(
  phrase: readonly HeardNote[],
  clock: SongClock = SONG_CLOCK,
): PhraseReading {
  const notes = [...phrase].sort((a, b) => a.position - b.position);
  if (notes.length === 0) return { notes: [], margins: [] };
  const { offset, looseness } = offsetOf(
    notes.map((n) => n.position),
    clock,
  );
  const steps = notes.map((n) => Math.round(n.position - offset));
  const first = notes[0]!.position - offset;
  const before = clock.beatStart(clock.beatAt(first));
  const after = clock.beatStart(clock.beatAt(first) + 1);
  const beat = first - before <= after - first ? before : after;
  if (beat !== steps[0]) {
    const score = (step: number, evidence: number) =>
      evidence - (first - step) ** 2 / (2 * looseness ** 2);
    if (score(beat, BEAT_EVIDENCE) > score(steps[0]!, 0)) steps[0] = beat;
  }
  const xs = notes.map((n) => n.position - offset);
  const on = snapToValues(xs, steps[0]!, looseness);
  const value = valueOf(xs.slice(1), looseness);
  const margins = xs.map((x, i) =>
    i === 0 ? margin(x - steps[0]! + on[0]!, 1) : margin(x, value),
  );
  const ends = releasesOf(notes, on, offset, looseness, clock);
  return {
    notes: notes.map((n, i) => ({ ...n, position: on[i]!, end: ends[i]! })),
    margins,
  };
}

/** A phrase's notes on the steps they meant (`readPhraseWithMargins`). */
export function readPhrase(
  phrase: readonly HeardNote[],
  clock: SongClock = SONG_CLOCK,
): HeardNote[] {
  return readPhraseWithMargins(phrase, clock).notes;
}

/** The lower quartile of a list, or 0 of none: what most of it is at least. */
function lowerQuartile(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 4)]!;
}

/**
 * The rest a gap is, in steps: the plausible length nearest to it, the
 * shorter of two equally near, where that is within `tolerance` of it, and
 * otherwise the whole steps nearest to it, since a tight hand that leaves a
 * gap of five steps meant five. 0 where the gap is less than half the
 * least rest.
 */
function restFor(gap: number, tolerance: number): number {
  if (gap < REST_VALUES[0] / 2) return 0;
  const nearest = REST_VALUES.reduce((best, v) =>
    Math.abs(v - gap) < Math.abs(best - gap) ? v : best,
  );
  return Math.abs(nearest - gap) <= tolerance ? nearest : Math.round(gap);
}

/**
 * Where each note is read as released (H4): a rest, or none. A note is
 * released before the next one or the bar's end by some gap, and a gap is
 * either the player's articulation, a share of the note's slot that they
 * leave off it, or a rest. The share is the phrase's own, the lower
 * quartile of what its notes leave (what most of them leave at least, so a
 * phrase that is half rests still shows its articulation), up to
 * `ARTICULATION_CEILING`.
 * What a gap is beyond that share and the spread the hand's looseness
 * makes of it is a rest only where it is more than `REST_MARGIN` times that
 * spread, and then of the plausible length nearest to it (`REST_VALUES`).
 * A note not released, or released after what follows, is held to it.
 */
function releasesOf(
  notes: readonly HeardNote[],
  steps: readonly number[],
  offset: number,
  looseness: number,
  clock: SongClock,
): (number | null)[] {
  const slots = notes.map((n, i) => {
    const barEnd = clock.barStart(clock.barAt(steps[i]!) + 1);
    const next = notes[i + 1] ? notes[i + 1]!.position - offset : Infinity;
    const nextStep = notes[i + 1] ? steps[i + 1]! : Infinity;
    const start = n.position - offset;
    return {
      boundary: Math.min(nextStep, barEnd),
      slot: Math.min(next, barEnd) - start,
      gap: n.end === null ? null : Math.min(next, barEnd) - (n.end - offset),
    };
  });
  const ratios = slots.map((s) => (s.gap === null || s.slot <= 0 ? null : s.gap / s.slot));
  // A note's own release can't say what the player's articulation is, so it is read from the others.
  const shareFor = (i: number) =>
    Math.min(
      ARTICULATION_CEILING,
      Math.max(0, lowerQuartile(ratios.filter((r, j): r is number => r !== null && j !== i))),
    );
  const spread = REST_MARGIN * looseness * Math.SQRT2;
  return notes.map((n, i) => {
    const { boundary, slot, gap } = slots[i]!;
    if (gap === null) return null;
    const excess = gap - shareFor(i) * slot;
    const rest = excess > spread ? restFor(excess, spread) : 0;
    return Math.max(steps[i]! + 1, boundary - rest);
  });
}

/** Everything heard, read phrase by phrase, in time. */
export function readHeard(notes: readonly HeardNote[], clock: SongClock = SONG_CLOCK): HeardNote[] {
  return phrasesOf(notes, clock).flatMap((phrase) => readPhrase(phrase, clock));
}

/**
 * Everything heard, read phrase by phrase, with each read note's margin,
 * keyed by the note read.
 */
export function readHeardWithMargins(
  notes: readonly HeardNote[],
  clock: SongClock = SONG_CLOCK,
): {
  readonly notes: HeardNote[];
  readonly margins: ReadonlyMap<HeardNote, number>;
} {
  const margins = new Map<HeardNote, number>();
  const read = phrasesOf(notes, clock).flatMap((phrase) => {
    const reading = readPhraseWithMargins(phrase, clock);
    reading.notes.forEach((n, i) => margins.set(n, reading.margins[i]!));
    return reading.notes;
  });
  return { notes: read, margins };
}
