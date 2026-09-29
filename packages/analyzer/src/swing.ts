/**
 * Grid and swing, the analyzer brief's second stage: a 4/4 span's onsets
 * quantised onto the 16-step grid the rest of the repository already reads
 * (T10, `barAt`/`stepInBar` in `@jambot/engine`, never `/16` or `%16`), by
 * reading the span's onsets with the engine's own reader (`readOnsets`, the
 * one the Muse reads a phrase with): the one swing value whose inverse best
 * explains where they actually fall, then rounding what is left. The
 * leftover after that is kept as microtiming, per note, not discarded (A6).
 */
import { barAt, readOnsets, stepInBar, swingMap } from '@jambot/engine';
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

/** A 4/4 span's notes, quantised onto the step grid: swing estimated once, then every onset un-swung and rounded (A6). */
export function quantiseSection(
  ppq: number,
  startTicks: number,
  notes: readonly RawNote[],
): SectionResult {
  const stepsPerTick = 4 / ppq;
  const rawStepOf = (ticks: number) => (ticks - startTicks) * stepsPerTick;
  const { swing, steps, residuals } = readOnsets(notes.map((note) => rawStepOf(note.ticks)));
  const map = swingMap(swing);

  let squaredError = 0;
  const quantised = notes.map((note, i): QuantisedNote => {
    const writtenStart = map.written(rawStepOf(note.ticks));
    const writtenEnd = map.written(rawStepOf(note.ticks + note.durationTicks));
    const step = steps[i]!;
    const residual = residuals[i]!;
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
