/**
 * The timing test's drum patterns (#204, H7): what plays, and when every hit
 * falls.
 *
 * A pattern is a bar of two sounds, a kick and a snare, on the 16-step grid.
 * The test plays it for `TEST_BARS` bars after a count-in bar of closed
 * hats, at a tempo picked from `TEMPOS`, and the player follows every hit of
 * either sound. `planTest` lays it out on a clock of seconds whose zero is
 * the start of the first bar of the test: the count-in is before it, at
 * negative times. Nothing here reads a clock or plays a sound.
 */

import { DRUM_NOTES } from '@jambot/engine';

/** The steps of the test's bar: its own, sixteen, whatever meter a song is in. */
const PATTERN_STEPS = 16;

export type TestSound = 'kick' | 'snare';

/** The General MIDI drum note each sound plays as. */
export const SOUND_NOTES: Readonly<Record<TestSound, number>> = {
  kick: DRUM_NOTES.kick,
  snare: DRUM_NOTES.snare,
};

export interface PatternHit {
  readonly step: number;
  readonly sound: TestSound;
}

export type PatternId = 'quarters' | 'eighths' | 'syncopated';

export interface TestPattern {
  readonly id: PatternId;
  /** What the choice says. */
  readonly name: string;
  /** What it asks of the player, for a tooltip. */
  readonly about: string;
  /** The hits of one bar, in time order. */
  readonly hits: readonly PatternHit[];
}

const hit = (sound: TestSound, ...steps: number[]): PatternHit[] =>
  steps.map((step) => ({ step, sound }));

const inOrder = (hits: PatternHit[]): readonly PatternHit[] =>
  [...hits].sort((a, b) => a.step - b.step);

/**
 * From the widest window to the tightest: the quarters are at least four
 * steps apart, the eighths two, the syncopated pattern has hits a step apart.
 */
export const TEST_PATTERNS: readonly TestPattern[] = [
  {
    id: 'quarters',
    name: 'Quarters',
    about: 'Kick on 1 and 3, snare on 2 and 4: a hit every beat or two.',
    hits: inOrder([...hit('kick', 0, 8), ...hit('snare', 4, 12)]),
  },
  {
    id: 'eighths',
    name: 'Eighths',
    about: 'A kick on the and of 2 as well: hits on the eighths.',
    hits: inOrder([...hit('kick', 0, 6, 8), ...hit('snare', 4, 12)]),
  },
  {
    id: 'syncopated',
    name: 'Syncopated',
    about: 'Kicks and snares off the beat, sixteenths apart.',
    hits: inOrder([...hit('kick', 0, 3, 10), ...hit('snare', 4, 12, 14)]),
  },
];

/** The tempos on offer, in beats per minute. */
export const TEMPOS = [80, 100, 120] as const;
export type Tempo = (typeof TEMPOS)[number];

/** The bars the player follows the pattern for, after the count-in. */
export const TEST_BARS = 8;

/** The bars of hats counted in before the pattern. */
export const COUNT_IN_BARS = 1;

/** How long, in seconds, the test goes on listening after its last hit. */
export const TAIL_SECONDS = 1;

/** A hit of the test, where it falls in the bar and on the clock. */
export interface Expected {
  readonly index: number;
  /** From 0, the first bar of the test. */
  readonly bar: number;
  readonly step: number;
  readonly sound: TestSound;
  readonly note: number;
  /** Seconds from the start of the test's first bar. */
  readonly at: number;
}

export interface TestPlan {
  readonly pattern: TestPattern;
  readonly bpm: number;
  readonly bars: number;
  readonly stepSeconds: number;
  readonly barSeconds: number;
  /** The count-in's hats, in seconds from the start of the test's first bar: negative. */
  readonly countIn: readonly number[];
  readonly expected: readonly Expected[];
}

export const patternById = (id: PatternId): TestPattern =>
  TEST_PATTERNS.find((p) => p.id === id) ?? TEST_PATTERNS[0]!;

/** The pattern laid out on a clock of seconds: every hit of every bar, and the hats before them. */
export function planTest(id: PatternId, bpm: number, bars = TEST_BARS): TestPlan {
  const pattern = patternById(id);
  const stepSeconds = 60 / bpm / 4;
  const barSeconds = stepSeconds * PATTERN_STEPS;
  const beatSeconds = barSeconds / 4;
  const countIn = Array.from(
    { length: COUNT_IN_BARS * 4 },
    (_, k) => (k - COUNT_IN_BARS * 4) * beatSeconds,
  );
  const expected = Array.from({ length: bars }, (_, bar) =>
    pattern.hits.map(({ step, sound }) => ({
      bar,
      step,
      sound,
      note: SOUND_NOTES[sound],
      at: (bar * PATTERN_STEPS + step) * stepSeconds,
    })),
  )
    .flat()
    .map((e, index) => ({ ...e, index }));
  return { pattern, bpm, bars, stepSeconds, barSeconds, countIn, expected };
}

/** The last hit's time, in seconds from the start of the test. */
export const lastHitAt = (plan: TestPlan): number => plan.expected.at(-1)?.at ?? 0;

/** The end of the test: its bars, and the tail after them. */
export const testEnd = (plan: TestPlan): number => plan.bars * plan.barSeconds + TAIL_SECONDS;
