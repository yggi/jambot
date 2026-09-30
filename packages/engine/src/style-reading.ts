/**
 * Reading a style from notes: the critic's first slice (#15, step 1).
 *
 * The composer turns a style into notes; this goes the other way, one axis at
 * a time, by rule. Nothing here is learned, so it can be the baseline and the
 * oracle of the learned critic that comes after. It reads a bar's notes as
 * they sound (`BandBar.dough`): the steps are the written ones, and the
 * lengths are the performer's gate, which is where the articulation lives
 * (T4). The written lengths fill the gap and say none of it (E23). Swing,
 * which lives in the played time, is `estimateSwing` in `reading.ts`.
 *
 * A reading is raw, not fitted: `sync` and `artic` lie in 0 to 1 as their
 * axes do, `density` is onsets per step and has no axis to sit on yet. How
 * far each lies from the style that wrote the bar is what step 2 measures.
 * An axis with nothing to read in the bar is absent, not zero.
 *
 * Pure: it counts steps and knows no file or key; the clock is what `readTiming` is given.
 *
 * A bar is its meter's (#260): `readStyle` takes the meter, the song's 4/4 where none is
 * given, and counts its steps and its pulses.
 */

import { type Meter, STEPS_PER_EIGHTH, meterOnSteps, stepsOf } from '@jambot/theory';
import { type DoughNote, SONG_METER } from './events.ts';
import { estimateSwing } from './reading.ts';
import type { ScheduledStep } from './transport.ts';

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
function soundingShares(line: readonly Sounding[], steps: number): number[] {
  const starts = [...new Set(line.map((n) => n.step))].sort((a, b) => a - b);
  return starts.map((step, i) => {
    const gap = (starts[i + 1] ?? steps) - step;
    const length = Math.max(...line.filter((n) => n.step === step).map((n) => n.length));
    return Math.min(length, gap) / gap;
  });
}

/** The style a bar's sounding notes read as, on the axes that can be read from notes alone. */
export function readStyle(notes: readonly Sounding[], meter: Meter = SONG_METER): StyleReading {
  const steps = stepsOf(meter);
  const pulses = meterOnSteps(meter).heights;
  // (part, step) pairs: the same step of two parts is two onsets, a chord's notes are one.
  const onsets = [...new Set(notes.map((n) => `${n.part}:${n.step}`))].map((id) =>
    Number(id.split(':')[1]),
  );
  const density = onsets.length / steps;
  const shares = LINES.flatMap((part) =>
    soundingShares(
      notes.filter((n) => n.part === part),
      steps,
    ),
  );
  return {
    density,
    ...(onsets.length
      ? {
          sync:
            onsets.filter((step) => !pulses.includes(step) && step % STEPS_PER_EIGHTH !== 0)
              .length / onsets.length,
        }
      : {}),
    ...(shares.length ? { artic: 1 - median(shares) } : {}),
  };
}

/** What a reading needs of a laid step: where it is on the grid and on the clock. */
export type Laid = Pick<ScheduledStep, 'step' | 'seconds' | 'length'>;

/** The timing a bar's steps and onsets read as: the tempo and the swing. */
export interface TimingReading {
  /** Beats per minute, from how long the steps last. */
  readonly bpm?: number;
  /** The swing (0 to 1) whose un-swung grid leaves the onsets closest to the steps (`estimateSwing`). */
  readonly swing?: number;
}

/**
 * The tempo and swing of a bar from the clock: its steps as laid (each a
 * step of the grid with the seconds it starts at and lasts) and the seconds
 * its notes sound at. The tempo is 60 over the mean length of a beat, four
 * steps of 16th; swing does not enter it, since it moves notes inside a beat
 * and leaves the beat whole. The swing is found from the onsets, each put
 * back on the steps as played, by the one reader `reading.ts` gives the Muse
 * and the analyzer.
 */
export function readTiming(laid: readonly Laid[], onsets: readonly number[]): TimingReading {
  const bpm = laid.length
    ? 15 / (laid.reduce((sum, s) => sum + s.length, 0) / laid.length)
    : undefined;
  const played = onsets.flatMap((seconds) => {
    const at = laid.findLast((s) => s.seconds <= seconds);
    return at ? [at.step + (seconds - at.seconds) / at.length] : [];
  });
  return {
    ...(bpm === undefined ? {} : { bpm }),
    ...(played.length ? { swing: estimateSwing(played) } : {}),
  };
}
