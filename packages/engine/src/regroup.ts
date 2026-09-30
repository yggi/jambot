/**
 * A rhythm written on 4/4's 16 steps, read in another meter (#260): the
 * decision was to hold such patterns in every meter, by a rule, regrouped,
 * and not to drop them.
 *
 * A step of 4/4's bar has a path from the bottom: its sixteenth in the
 * eighth (0 or 1), its eighth in the pulse (0 or 1), its pulse (0 to 3).
 * The same path is read in the target, whose pulses differ in number and in
 * length: the pulse is read over the target's pulses, the eighth over the
 * pulse's length, the sixteenth as it is, so every hit lands on a step the
 * target has. Two ways to read the pulse:
 *
 * - `fold`: pulse p is the target's pulse p mod P, so a bar of fewer pulses
 *   folds the later ones onto the earlier, and a bar of more leaves the last
 *   ones empty. Where two hits land on one step the stronger stays.
 * - `cycle`: the four pulses are a cycle run through the bars, so the bar b
 *   reads its pulse j from the cycle's pulse (b·P + j) mod 4, the downbeat's
 *   always the first: the pattern phases against the bar and keeps the
 *   downbeat.
 *
 * Both give 4/4 its own table, the same. Neither is the rule's last word: the
 * motifs of the Muse, which carry a cycle of their own, are read the same way
 * or another (#260).
 */

import { type Meter, STEPS_PER_EIGHTH, gaps, stepsOf } from '@jambot/theory';

export type Regroup = 'fold' | 'cycle';

/** Steps to a pulse, and pulses to a bar, of the 4/4 the tables are written in. */
const SOURCE_PULSE = 4;
const SOURCE_PULSES = 4;

/**
 * A table over 4/4's 16 steps, read over the steps of `meter`: a value on
 * each of its steps. `bar` is the bar's number, which `cycle` reads.
 */
export function readOnMeter(
  table: readonly number[],
  meter: Meter,
  mode: Regroup = 'fold',
  bar = 0,
): number[] {
  const pulses = meter.heights.length;
  const lengths = gaps(meter);
  const read = Array.from({ length: stepsOf(meter) }, () => 0);
  /** Put a source step's value on the target pulse, its eighth read over the pulse's length. */
  const place = (step: number, target: number) => {
    const eighth = Math.floor((step % SOURCE_PULSE) / 2);
    const into =
      meter.heights[target]! * STEPS_PER_EIGHTH +
      (eighth % lengths[target]!) * STEPS_PER_EIGHTH +
      (step % STEPS_PER_EIGHTH);
    read[into] = Math.max(read[into]!, table[step]!);
  };
  for (let step = 0; step < table.length; step++) {
    if (table[step] === 0) continue;
    const pulse = Math.floor(step / SOURCE_PULSE);
    if (mode === 'fold') place(step, pulse % pulses);
    else
      for (let target = 0; target < pulses; target++)
        if (pulse === (target === 0 ? 0 : (bar * pulses + target) % SOURCE_PULSES))
          place(step, target);
  }
  return read;
}
