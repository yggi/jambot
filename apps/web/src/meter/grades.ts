/**
 * The accent slider of the meter screen (#259): how far the grades of a bar
 * are spread, from the downbeat alone standing out to every grade at its own
 * level. The grades themselves are the tree's (`accentsOf`, `@jambot/theory`).
 */

import { ACCENT_GRADES, type AccentGrade } from '@jambot/theory';

export type Grade = AccentGrade;

/** The grades from the strongest down. */
export const GRADES = ACCENT_GRADES;

/** What each grade sounds at when the slider is at nothing: only the downbeat stands out. */
const FLAT: Record<Grade, number> = { downbeat: 1, half: 0.7, pulse: 0.7, between: 0.7 };

/** And at all, spread wide enough to hear: the grades fall away from the downbeat (#259). */
const FULL: Record<Grade, number> = { downbeat: 1, half: 0.8, pulse: 0.55, between: 0.3 };

/**
 * A grade's level, 0 to 1, for the accent slider from 0 (the downbeat alone
 * accented) to 1 (every grade its own level).
 */
export function gradeGain(grade: Grade, amount: number): number {
  return FLAT[grade] + (FULL[grade] - FLAT[grade]) * amount;
}
