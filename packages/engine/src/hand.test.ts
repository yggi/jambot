import { describe, expect, it } from 'vitest';
import { SONG_CLOCK } from './events.ts';
import {
  HAND_EVIDENCE,
  HAND_SPREAD_FLOOR,
  NO_HANDS,
  type Hand,
  folded,
  handsAfter,
  phaseOf,
  priorOf,
} from './hand.ts';
import type { HeardNote } from './muse.ts';
import { judgeBar } from './muse.ts';
import { A_HAND, LATENCY_SPREAD, readPhrase } from './phrase.ts';

/** A note struck at `position`, held a step and a half. */
const note = (position: number, source = 'a hand', pitch = 60): HeardNote => ({
  note: pitch,
  velocity: 100,
  source,
  position,
  end: position + 1.5,
});

/** Eighths `0 2 4 6 8` from the start of `bar`, every onset `late` steps late, off it by under a 25th of a step. */
const eighths = (bar: number, late: number, source = 'a hand') =>
  [0, 2, 4, 6, 8].map((at, i) =>
    note(16 * bar + at + late + [0.04, -0.03, 0.05, -0.02, 0.01][i]!, source, 57 + 3 * i),
  );

/** A hand folded over phrases of eighths on the beat in bars 1, 3, 5 …, each `late` steps late. */
const heardOver = (phrases: number, late: number): Hand | undefined => {
  let hand: Hand | undefined;
  for (let k = 0; k < phrases; k++) hand = folded(hand, eighths(1 + 2 * k, late), SONG_CLOCK);
  return hand;
};

describe('a phrase’s phase (#580, rung 6)', () => {
  it('is the share of a step its onsets sit off the nearest steps, from −½ to ½, a whole step late or not', () => {
    expect(phaseOf([16.2, 18.2, 20.2])).toBeCloseTo(0.2, 9);
    expect(phaseOf([17.2, 19.2, 21.2])).toBeCloseTo(0.2, 9);
    expect(phaseOf([15.8, 17.8, 19.8])).toBeCloseTo(-0.2, 9);
    // (onsets either side of the halfway are taken together, not split between −½ and ½, which are one phase)
    expect(Math.abs(phaseOf([16.45, 18.55, 20.5]))).toBeCloseTo(0.5, 9);
  });
});

describe('the hand’s memory (#580, rung 6)', () => {
  it('is no prior until the hand is heard in HAND_EVIDENCE phrases, and leaves a phrase of fewer than three onsets out', () => {
    expect(HAND_EVIDENCE).toBe(2);
    expect(priorOf(undefined)).toBeUndefined();
    expect(priorOf(heardOver(1, 0.96))).toBeUndefined();
    expect(priorOf(heardOver(2, 0.96))).toBeDefined();
    const one = heardOver(1, 0.96);
    expect(folded(one, [note(80), note(82)], SONG_CLOCK)).toBe(one);
  });

  it('remembers a tight hand a steady 120 ms late as late by about a step, held close: its phases and caps moved there', () => {
    const prior = priorOf(heardOver(3, 0.96))!;
    expect(prior.latency).toBeCloseTo(0.96, 1);
    expect(prior.spread).toBe(HAND_SPREAD_FLOOR);
    expect(prior.phases).toEqual([0.5, 1, 1.5]);
    expect(prior.latest).toBeGreaterThan(1.5);
  });

  it('reads the hand’s next phrase on the beat it meant, where a hand not yet heard reads it a step later', () => {
    const next = eighths(9, 0.96);
    expect(readPhrase(next).map((n) => n.position)).toEqual([145, 147, 149, 151, 153]);
    expect(
      readPhrase(next, SONG_CLOCK, priorOf(heardOver(3, 0.96))).map((n) => n.position),
    ).toEqual([144, 146, 148, 150, 152]);
  });

  it('remembers a hand on time as on time, and reads its phrases as a hand not yet heard does', () => {
    const prior = priorOf(heardOver(4, 0))!;
    expect(prior.latency).toBeCloseTo(0.01, 1);
    const clave = [0, 3, 6, 10, 12].map((at) => note(144 + at));
    expect(readPhrase(clave, SONG_CLOCK, prior).map((n) => n.position)).toEqual(
      readPhrase(clave).map((n) => n.position),
    );
  });

  it('spreads its latency wider than the floor, and no wider than a hand not yet heard’s, when its phrases sit anywhere', () => {
    let hand: Hand | undefined;
    [0.3, -0.3, 0.25, -0.25, 0.3].forEach((late, k) => {
      hand = folded(hand, eighths(1 + 2 * k, late), SONG_CLOCK);
    });
    expect(priorOf(hand)!.spread).toBeLessThanOrEqual(LATENCY_SPREAD);
    expect(priorOf(hand)!.spread).toBeGreaterThan(HAND_SPREAD_FLOOR);
    expect(A_HAND.spread).toBe(LATENCY_SPREAD);
  });

  it('folds each phrase once, when it has closed: a phrase still running is left for later', () => {
    const notes = [...eighths(1, 0.96), ...eighths(3, 0.96), ...eighths(5, 0.96)];
    const once = handsAfter(NO_HANDS, notes, 5, SONG_CLOCK);
    // (the third phrase, in bar 5, runs on to bar 6: not yet closed at bar 5's end)
    expect(once['a hand']!.phrases).toBe(2);
    expect(handsAfter(NO_HANDS, notes, 6, SONG_CLOCK)['a hand']!.phrases).toBe(3);
    expect(handsAfter(NO_HANDS, [], 6, SONG_CLOCK)).toBe(NO_HANDS);
  });

  it('keeps each source’s hand its own: a late player’s memory moves no other player’s reading', () => {
    const late = [1, 3, 5].flatMap((bar) => eighths(bar, 0.96, 'late'));
    const onTime = [1, 3, 5].flatMap((bar) => eighths(bar, 0, 'on time'));
    const hands = handsAfter(NO_HANDS, [...late, ...onTime], 6, SONG_CLOCK);
    const bar9 = [...eighths(9, 0.96, 'late'), ...eighths(9, 0, 'on time')];
    const onsets = (source: string, h = hands) => {
      const j = judgeBar(bar9, 9, { tonic: 9, mode: 'aeolian' }, 'phrases', SONG_CLOCK, h).find(
        (x) => x.source === source,
      );
      // (the motif's notes: its onsets less its rests)
      return j?.kind === 'motif'
        ? j.motif.onsets.filter((_, i) => j.motif.degrees[i] !== null)
        : null;
    };
    expect(onsets('late')).toEqual([0, 2, 4, 6, 8]);
    expect(onsets('late', NO_HANDS)).toEqual([1, 3, 5, 7, 9]);
    expect(onsets('on time')).toEqual([0, 2, 4, 6, 8]);
  });

  it('survives JSON, as a machine’s carried state must', () => {
    const hands = handsAfter(NO_HANDS, [...eighths(1, 0.96), ...eighths(3, 0.96)], 4, SONG_CLOCK);
    expect(JSON.parse(JSON.stringify(hands))).toEqual(hands);
  });
});
