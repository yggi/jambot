/**
 * The accent grades of a bar (#259): how hard each eighth is stressed, in
 * four grades read off the meter's own pulses. The downbeat is `*`; where a
 * bar holds four pulses or more in an even count, the pulse that opens its
 * second half is `+` (4/4's third beat, 12/8's third pulse); any other pulse
 * is `-`; the eighths between the pulses are `.`. An accent line writes a
 * bar so, one symbol to the counted unit: the quarter where every pulse is
 * one, the eighth otherwise, and a pulse shows as `-` only where it is longer
 * than that unit, since a pulse that is the unit needs no mark of its own.
 * `4/4 * . + .`, `6/8 * . . - . .`, `12/8 * . . - . . + . . - . .`.
 *
 * The grades are local to the meter screen, an experiment: the engine's
 * `Weight` has three (downbeat, pulse, subdivision), and a fourth waits for
 * a measurement to say it earns its place (#261).
 */

import { type Meter, gaps, meterWeights } from '@jambot/theory';

export type Grade = 'downbeat' | 'half' | 'pulse' | 'between';

/** The grades from the strongest down: what the slider spreads. */
export const GRADES: readonly Grade[] = ['downbeat', 'half', 'pulse', 'between'];

const SYMBOLS: Record<Grade, string> = { downbeat: '*', half: '+', pulse: '-', between: '.' };

/** The grade of every eighth of the bar, from its downbeat. */
export function gradesOf(meter: Meter): Grade[] {
  const pulses = meter.heights.length;
  const half = pulses >= 4 && pulses % 2 === 0 ? meter.heights[pulses / 2]! : -1;
  return meterWeights(meter).map((weight, eighth) =>
    weight === 'downbeat'
      ? 'downbeat'
      : eighth === half
        ? 'half'
        : weight === 'pulse'
          ? 'pulse'
          : 'between',
  );
}

/** The eighths a symbol of the accent line stands for: 2 where every pulse is 2 eighths, else 1. */
const countedUnit = (meter: Meter): number => (gaps(meter).every((gap) => gap === 2) ? 2 : 1);

/** The bar written one symbol to the counted unit: "* . + .". */
export function accentLine(meter: Meter): string {
  const grades = gradesOf(meter);
  const unit = countedUnit(meter);
  const symbols: string[] = [];
  for (let eighth = 0; eighth < meter.cycle; eighth += unit) {
    const grade = grades[eighth]!;
    symbols.push(SYMBOLS[grade === 'pulse' && unit === 2 ? 'between' : grade]);
  }
  return symbols.join(' ');
}

/** What each grade sounds at when the slider is at nothing: only the downbeat stands out. */
const FLAT: Record<Grade, number> = { downbeat: 1, half: 0.7, pulse: 0.7, between: 0.7 };

/** And at all: the grades fall away from the downbeat. */
const FULL: Record<Grade, number> = { downbeat: 1, half: 0.85, pulse: 0.7, between: 0.45 };

/**
 * A grade's level, 0 to 1, for the accent slider from 0 (the downbeat alone
 * accented) to 1 (every grade its own level).
 */
export function gradeGain(grade: Grade, amount: number): number {
  return FLAT[grade] + (FULL[grade] - FLAT[grade]) * amount;
}
