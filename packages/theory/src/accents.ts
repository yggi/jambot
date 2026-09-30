/**
 * The accent grades of a bar (#259, #260): how hard each eighth is stressed, read
 * off a tree over the meter. The bar is the root; its pulses are grouped by
 * halving, `even(2, p)` for four pulses or more (4 as 2+2, 5 as 3+2, 6 as
 * 3+3) and flat for two or three, so every node has two or three children,
 * the well-formedness rule of T6 one level up; the eighths are the leaves.
 * One operator at every level: a position's grade is the largest group that
 * starts on it, counted from the root. The downbeat starts the bar, `*`; a
 * group of the root's children starts `+`, of theirs `-`; a leaf is `.`.
 * `4/4 * . - . + . - .`, `6/8 * . . + . .`, `12/8 * . . - . . + . . - . .`,
 * and `5/4` is `* . - . - . + . - .` as 3+2 and `* . - . + . - . - .` as
 * 2+3, its `mirror`.
 *
 * Grades count from the root, not from the pulse: 6/8's second pulse is a
 * half of the bar, `+`, as 12/8's third is, and 12/8's second is `-`. Heard
 * against a grading by pulse and half alone, this one sounds right in 6/8,
 * 3/4, 5/4 and 7/8 (#259). A grade one below its parent's, in place of the
 * level's own, would tie 12/8's second pulse with its third, and has not been
 * heard.
 *
 * The engine's `Weight` has three (downbeat, pulse, subdivision): these are
 * the tree's first four levels, and the drums read their kick from them
 * (#260).
 */

import { even } from './even.ts';
import { type Meter, meterWeights } from './meter.ts';

export type AccentGrade = 'downbeat' | 'half' | 'pulse' | 'between';

/** The grades from the strongest down: the depth 1, 2, 3 and the leaves below. */
export const ACCENT_GRADES: readonly AccentGrade[] = ['downbeat', 'half', 'pulse', 'between'];

const SYMBOLS: Record<AccentGrade, string> = { downbeat: '*', half: '+', pulse: '-', between: '.' };

/**
 * The depth of the largest group starting at each pulse, from 1 (the bar):
 * the pulses under the bar or under its groups, the groups halved by `even`.
 * `mirrored` reads each halving the other way round, 5 as 2+3.
 */
function depthsOf(pulses: number, mirrored: boolean): number[] {
  const depth: number[] = Array(pulses).fill(Infinity);
  const walk = (from: number, to: number, level: number) => {
    depth[from] = Math.min(depth[from]!, level);
    const count = to - from;
    if (count <= 3) {
      for (let i = from; i < to; i++) depth[i] = Math.min(depth[i]!, level + 1);
      return;
    }
    const first = even(2, count).heights[1]!;
    const cut = from + (mirrored ? count - first : first);
    walk(from, cut, level + 1);
    walk(cut, to, level + 1);
  };
  walk(0, pulses, 1);
  return depth;
}

/** The grade of every eighth of the bar, from its downbeat. */
export function accentsOf(meter: Meter, mirrored = false): AccentGrade[] {
  const depth = depthsOf(meter.heights.length, mirrored);
  const grades: AccentGrade[] = meterWeights(meter).map(() => 'between');
  meter.heights.forEach((eighth, pulse) => {
    grades[eighth] = ACCENT_GRADES[Math.min(depth[pulse]!, ACCENT_GRADES.length) - 1]!;
  });
  return grades;
}

/** The bar written one symbol to the eighth: "* . - . + . - .". */
export function accentLine(meter: Meter, mirrored = false): string {
  return accentsOf(meter, mirrored)
    .map((grade) => SYMBOLS[grade])
    .join(' ');
}
