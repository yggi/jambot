/**
 * Reading a style from notes: the critic's first slice (#15, step 1).
 *
 * The composer turns a style into notes; this goes the other way, one axis at
 * a time, by rule. Nothing here is learned, so it can be the baseline and the
 * oracle of the learned critic that comes after. It reads a bar's notes as
 * they sound (`BandBar.dough`): the steps are the written ones, and the
 * lengths are the performer's gate, which is where the articulation lives
 * (T4). The written lengths fill the gap and say none of it (E22). Swing,
 * which lives in the played time, is `estimateSwing` in `reading.ts`.
 *
 * A reading is raw, not fitted: `sync` and `artic` lie in 0 to 1 as their
 * axes do, `density` is onsets per step and has no axis to sit on yet. How
 * far each lies from the style that wrote the bar is what step 2 measures.
 * An axis with nothing to read in the bar is absent, not zero.
 *
 * Pure: it counts steps and knows no clock, file or key.
 */

import { BAR_STEPS, type DoughNote, onBeat } from './events.ts';

/** The steps in an eighth: the grid is 16ths. */
const STEPS_PER_EIGHTH = 2;

/** What a reading needs of a note: where it starts, in which part, and how long it sounds. */
export type Sounding = Pick<DoughNote, 'part' | 'step' | 'length'>;

/** The parts whose length says how the line is played; the others are hits and voicings. */
const LINES = ['bass', 'lead'] as const;

/** What one bar's notes say of its style, axis by axis. */
export interface StyleReading {
  /** Onsets per step of the bar; a chord struck at one step is one onset. */
  readonly density: number;
  /** The share of onsets off the beat and off the eighth: 0 on the grid's strong places, 1 all between. */
  readonly sync?: number;
  /** Legato (0) to staccato (1): one less the median share of its gap a note of the bass or lead sounds. */
  readonly artic?: number;
}

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/** The share of its gap to the next onset (or the bar's end) that each note of one line sounds. */
function soundingShares(line: readonly Sounding[]): number[] {
  const starts = [...new Set(line.map((n) => n.step))].sort((a, b) => a - b);
  return starts.map((step, i) => {
    const gap = (starts[i + 1] ?? BAR_STEPS) - step;
    const length = Math.max(...line.filter((n) => n.step === step).map((n) => n.length));
    return Math.min(length, gap) / gap;
  });
}

/** The style a bar's sounding notes read as, on the axes that can be read from notes alone. */
export function readStyle(notes: readonly Sounding[]): StyleReading {
  // (part, step) pairs: the same step of two parts is two onsets, a chord's notes are one.
  const onsets = [...new Set(notes.map((n) => `${n.part}:${n.step}`))].map((id) =>
    Number(id.split(':')[1]),
  );
  const density = onsets.length / BAR_STEPS;
  const shares = LINES.flatMap((part) => soundingShares(notes.filter((n) => n.part === part)));
  return {
    density,
    ...(onsets.length
      ? {
          sync:
            onsets.filter((step) => !onBeat(step) && step % STEPS_PER_EIGHTH !== 0).length /
            onsets.length,
        }
      : {}),
    ...(shares.length ? { artic: 1 - median(shares) } : {}),
  };
}
