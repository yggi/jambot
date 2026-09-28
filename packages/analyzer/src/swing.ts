/**
 * Grid and swing, the analyzer brief's second stage: a 4/4 span's onsets
 * quantised onto the 16-step grid the rest of the repository already reads
 * (T10, `barAt`/`stepInBar` in `@jambot/engine`, never `/16` or `%16`), by
 * finding the one swing value (`swingMap`, `@jambot/engine`) whose inverse
 * best explains where the span's onsets actually fall, then rounding what
 * is left. The leftover after that is kept as microtiming, per note, not
 * discarded (A6).
 */
import { barAt, stepInBar, swingMap } from '@jambot/engine';
import type { RawNote } from './tracks.ts';

export interface QuantisedNote {
  readonly midi: number;
  readonly velocity: number;
  readonly bar: number;
  readonly step: number;
  readonly length: number;
  /** Steps left after quantising: the microtiming the grid doesn't state. */
  readonly residual: number;
}

export interface SectionResult {
  readonly swing: number;
  readonly notes: readonly QuantisedNote[];
  readonly confidence: number;
}

/** How finely `estimateSwing` searches the swing axis. */
const SWING_RESOLUTION = 1000;

/** The sum of squared distances from the nearest step, once `swing` is un-swung. */
function quantisingError(swing: number, rawSteps: readonly number[]): number {
  const map = swingMap(swing);
  let sum = 0;
  for (const raw of rawSteps) {
    const residual = map.written(raw) - Math.round(map.written(raw));
    sum += residual * residual;
  }
  return sum;
}

/** The swing (0 to 1) whose un-swung grid leaves a section's onsets closest to the steps. */
export function estimateSwing(rawSteps: readonly number[]): number {
  if (rawSteps.length === 0) return 0;
  let best = 0;
  let bestError = Infinity;
  for (let i = 0; i <= SWING_RESOLUTION; i++) {
    const swing = i / SWING_RESOLUTION;
    const error = quantisingError(swing, rawSteps);
    if (error < bestError) {
      bestError = error;
      best = swing;
    }
  }
  return best;
}

/** A 4/4 span's notes, quantised onto the step grid: swing estimated once, then every onset un-swung and rounded (A6). */
export function quantiseSection(
  ppq: number,
  startTicks: number,
  notes: readonly RawNote[],
): SectionResult {
  const stepsPerTick = 4 / ppq;
  const rawStepOf = (ticks: number) => (ticks - startTicks) * stepsPerTick;
  const swing = estimateSwing(notes.map((note) => rawStepOf(note.ticks)));
  const map = swingMap(swing);

  let squaredError = 0;
  const quantised = notes.map((note): QuantisedNote => {
    const writtenStart = map.written(rawStepOf(note.ticks));
    const writtenEnd = map.written(rawStepOf(note.ticks + note.durationTicks));
    const step = Math.round(writtenStart);
    const residual = writtenStart - step;
    squaredError += residual * residual;
    return {
      midi: note.midi,
      velocity: note.velocity,
      bar: barAt(step),
      step: stepInBar(step),
      length: Math.max(1, Math.round(writtenEnd - writtenStart)),
      residual,
    };
  });

  const confidence = notes.length ? 1 / (1 + squaredError / notes.length) : 1;
  return { swing, notes: quantised, confidence };
}
