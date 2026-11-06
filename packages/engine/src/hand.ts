/**
 * The hand's memory (#580, rung 6; #204 H9): what the Muse remembers of how
 * each source plays against the band's grid, a phrase at a time, and the
 * prior it reads that source's next phrase under.
 *
 * One phrase can't tell a hand late by a steady step from the same phrase
 * syncopated a step later, so the reader alone takes no phase past
 * `LATEST` (`phrase.ts`). Over phrases it can: a player's latency is the
 * same from one phrase to the next, and a syncopation isn't. So each
 * closed phrase of at least `PHASED_FEWEST` onsets is folded in twice:
 * - its phase, the share of a step its onsets sit off the nearest steps
 *   (`phaseOf`), which a tight hand states plainly, folded into a fading
 *   mean, and its spread from that mean, into a fading variance;
 * - a vote for how many whole steps lie under that phase, the one its own
 *   reading favours under a wide prior (`WIDE`, whole steps and no caps),
 *   folded into fading votes (`fading.ts`'s `fold`), so that the odd
 *   phrase read a step off is outvoted by the rest.
 * Once `HAND_EVIDENCE` phrases are folded, the source's next phrase is read
 * under the latency remembered, the phase and the whole steps most voted
 * (`priorOf`): spread as the hand's own phases are, so a consistent hand is
 * held close to its latency and an inconsistent one as a hand not yet
 * heard, with the phases and the caps moved to that latency.
 *
 * Every number is in steps, and every operation `+ − × ÷` and a square root
 * (exact in IEEE 754), so no engine's last bit decides a reading (#45).
 */

import type { SongClock } from './events.ts';
import { centreOf, fold, type Weights } from './fading.ts';
import type { HeardNote } from './muse.ts';
import {
  EARLIEST,
  LATENCY_MEAN,
  LATENCY_SPREAD,
  LATEST,
  PHASED_FEWEST,
  type HandPrior,
  type PhaseReading,
  phaseReadings,
  phrasesOf,
} from './phrase.ts';

/** How much of a hand's memory a phrase keeps of the phrases before it: 0.8, five phrases' worth. */
export const HAND_DECAY = 0.8;

/** How many phrases a hand is heard in before its memory is its prior: two. */
export const HAND_EVIDENCE = 2;

/** The least spread of a remembered latency, in steps: 0.15, about 19 ms at 120 bpm, so a memory never pins a hand. */
export const HAND_SPREAD_FLOOR = 0.15;

/** The whole steps a hand's latency may lie under its phase: a step early to two late. */
const WHOLE_STEPS = [-1, 0, 1, 2] as const;

/**
 * The prior a phrase is read under to vote: no latency at all (a spread without end), its phases whole steps and half
 * steps from a step early to a step and a half late, and no caps, so the phrase's own evidence alone says where it sits.
 */
const WIDE: HandPrior = {
  latency: 0,
  spread: Infinity,
  phases: [-1, -0.5, 0, 0.5, 1, 1.5],
  earliest: -Infinity,
  latest: Infinity,
  ownMean: true,
};

/**
 * The most a phrase votes, in nats: 3, about the beat's evidence and a bit a note on four notes. A phrase votes for the
 * whole steps its cheapest reading lies at by how much cheaper it is than the cheapest at any other whole steps, so a
 * phrase that could be either (sixteenths from an offbeat) hardly votes, and one that starts on the beat does.
 */
export const VOTE_MOST = 3;

/**
 * How far the most voted whole steps must lead the next, in nats, for the memory to be a prior: `VOTE_LEAD`. A hand
 * whose phrases are split between two readings is read as one not yet heard.
 */
export const VOTE_LEAD = 1;

/** What the Muse remembers of a source's hand. */
export interface Hand {
  /** The share of a step its onsets sit off the nearest steps, from −½ to ½: its latency's phase. */
  readonly phase: number;
  /** The fading variance of its phrases' phases about `phase`. */
  readonly variance: number;
  /** The fading votes for the whole steps under the phase, one weight for each of `WHOLE_STEPS`. */
  readonly votes: Weights;
  /** The weight of the phrases folded in, faded as they are: 1 for one, toward 5. */
  readonly weight: number;
  /** How many phrases have been folded in. */
  readonly phrases: number;
}

/** Every source's hand, by its name: a plain record, so the state a machine carries survives JSON (F1). */
export type Hands = Readonly<Record<string, Hand>>;

/** No source heard yet. */
export const NO_HANDS: Hands = {};

/** `x` moved by whole steps to lie within half a step of `near`. */
const unwrapped = (x: number, near: number) => x - Math.round(x - near);

/**
 * A phrase's phase: the mean share of a step its onsets sit off the nearest steps, each taken within half a step of the
 * first's, put back between −½ and ½.
 */
export function phaseOf(xs: readonly number[]): number {
  const first = xs[0]! - Math.round(xs[0]!);
  const mean = xs.reduce((sum, x) => sum + unwrapped(x - Math.round(x), first), 0) / xs.length;
  return unwrapped(mean, 0);
}

/**
 * The hand after a phrase is folded in: its phase and its spread, and a vote for the whole steps under the phase that
 * the phrase's reading under `WIDE` favours. A phrase of fewer than `PHASED_FEWEST` onsets says nothing of a latency and
 * leaves the hand as it was.
 */
export function folded(
  hand: Hand | undefined,
  phrase: readonly HeardNote[],
  clock: SongClock,
): Hand | undefined {
  const xs = phrase.map((n) => n.position).sort((a, b) => a - b);
  if (xs.length < PHASED_FEWEST) return hand;
  const own = phaseOf(xs);
  const readings = phaseReadings(xs, clock, WIDE);
  if (!hand) {
    const votes = fold(
      WHOLE_STEPS.map(() => 0),
      HAND_DECAY,
      voteOf(readings, own),
    );
    return { phase: own, variance: 0, votes, weight: 1, phrases: 1 };
  }
  const near = unwrapped(own, hand.phase);
  const kept = hand.weight * HAND_DECAY;
  const weight = kept + 1;
  const mean = (kept * hand.phase + near) / weight;
  const variance =
    (kept * (hand.variance + (hand.phase - mean) ** 2) + (near - mean) ** 2) / weight;
  // (the phase kept between −½ and ½: past it, a whole step moves from the phase to the votes)
  const shift = Math.round(mean);
  const phase = mean - shift;
  // (a latency is its phase and its whole steps: a phase moved down a step keeps the latency with a step more)
  const votes = fold(
    WHOLE_STEPS.map((_, i) => hand.votes[i - shift] ?? 0),
    HAND_DECAY,
    voteOf(readings, near - shift),
  );
  return { phase, variance, votes, weight, phrases: hand.phrases + 1 };
}

/**
 * A phrase's vote, as a fold's reading: the whole steps under `phase` of its cheapest reading, by how much cheaper that
 * is than the cheapest at any other whole steps, up to `VOTE_MOST`; none where every reading lies at the same.
 */
function voteOf(readings: readonly PhaseReading[], phase: number): [number, number][] {
  const least = new Map<number, number>();
  for (const { offset, cost } of readings) {
    const k = Math.min(WHOLE_STEPS.at(-1)!, Math.max(WHOLE_STEPS[0], Math.round(offset - phase)));
    least.set(k, Math.min(least.get(k) ?? Infinity, cost));
  }
  const ranked = [...least].sort((a, b) => a[1] - b[1]);
  if (ranked.length < 2) return [];
  const [[k, best], [, next]] = ranked as [[number, number], [number, number]];
  return [
    [WHOLE_STEPS.indexOf(k as (typeof WHOLE_STEPS)[number]), Math.min(VOTE_MOST, next - best)],
  ];
}

/** Where `phase` rounds to on the half steps. */
const halfStep = (x: number) => Math.round(2 * x) / 2;

/**
 * The prior a source's next phrase is read under: none until its hand is heard in `HAND_EVIDENCE` phrases, then the
 * latency it remembers (its phase and the whole steps most voted), spread as its phases are, from `HAND_SPREAD_FLOOR`
 * up to a hand not yet heard's, and the phases and caps of a hand not yet heard moved by as much as its latency is
 * from theirs.
 */
export function priorOf(hand: Hand | undefined): HandPrior | undefined {
  if (!hand || hand.phrases < HAND_EVIDENCE) return undefined;
  const steps = centreOf([...WHOLE_STEPS], (k) => hand.votes[WHOLE_STEPS.indexOf(k)]!);
  const [lead, next] = [...hand.votes].sort((a, b) => b - a) as [number, number];
  if (lead - next < VOTE_LEAD) return undefined;
  const latency = hand.phase + steps;
  const spread = Math.min(LATENCY_SPREAD, Math.max(HAND_SPREAD_FLOOR, Math.sqrt(hand.variance)));
  const moved = latency - LATENCY_MEAN;
  const centre = halfStep(latency);
  return {
    latency,
    spread,
    phases: [centre - 0.5, centre, centre + 0.5],
    earliest: -EARLIEST + moved,
    latest: LATEST + moved,
    ownMean: true,
  };
}

/**
 * Every source's hand once `bar` is judged: each phrase of a source that has closed by the bar's end (silent for a bar,
 * as `keptAfter` lets it go) folded into its hand, in time. A phrase still running is folded when it closes.
 */
export function handsAfter(
  hands: Hands,
  notes: readonly HeardNote[],
  bar: number,
  clock: SongClock,
): Hands {
  const edge = clock.barStart(bar + 1);
  let next: Record<string, Hand> | null = null;
  for (const source of new Set(notes.map((n) => n.source))) {
    const phrases = phrasesOf(
      notes.filter((n) => n.source === source && n.position < edge),
      clock,
    );
    const last = phrases.at(-1);
    const running =
      last &&
      edge - Math.max(...last.map((n) => n.end ?? n.position)) < clock.barSteps(bar + 1) - 1;
    const known = next ?? hands;
    let hand: Hand | undefined = Object.hasOwn(known, source) ? known[source] : undefined;
    const before = hand;
    for (const phrase of running ? phrases.slice(0, -1) : phrases)
      hand = folded(hand, phrase, clock);
    if (hand !== before && hand) (next ??= { ...hands })[source] = hand;
  }
  return next ?? hands;
}
