/**
 * Cells' harmonies, as the composer asks them (#425): cells'
 * `HARMONY_FRAGMENTS` (v0.9.0: the vamps of `themes.ts` as five seed
 * fragments, yggi/cells#219), and the progressions the Muse files
 * (`muse-harmony.ts`), ranked by cells' own `query` on the facet `harmony`
 * (the loop's repository, `line-repository.ts`), and each read by cells'
 * compiler into the chord slots a theme plays (`readProgression`).
 *
 * A progression is eight bars of triads over the key, `&harm over=&key
 * step=1m cycle=8`, as cells' seeds write them: each bar a stack on a degree
 * of the key, `[d,d+2,d+4]`, or two, a bar's halves, `[[0,2,4] [3,5,7]]`; a
 * run of one chord as `!n`, so a vamp the Muse hears is stated as the seed
 * that plays it, and filing it adds to the seed (identity). It is read on a
 * workbench of the meter and a key nothing reads but its hole
 * (`harmonyBench`): any key serves, since what is read is a degree.
 *
 * Cells has no operators on a harmony yet (decision 052's rung 3,
 * yggi/cells#208: a secondary dominant toward a slot, a slot reharmonised by
 * a third, never the fourth bar's cadence), so the composer varies no
 * progression: one it tires of repeats until it is rejected (`novelty.ts`).
 */

import type { Meter, MeterName } from '@jambot/theory';
import { compileSource } from '@yggi/cells/engine/compile';
import { flatten } from '@yggi/cells/engine/flatten';
import { codeShifts } from '@yggi/cells/engine/program';
import { tapWhole } from '@yggi/cells/engine/vary/lines';
import { unionOf } from '@yggi/cells/repository/fit';
import type { Fragment } from '@yggi/cells/repository/fragments';
import { HARMONY_FRAGMENTS } from '@yggi/cells/repository/harmony';
import { SECTION_BARS } from './form.ts';
import {
  HARMONY_FACET,
  type HarmonyRead,
  type HarmonyRepository,
  type HarmonySlot,
  SLOT_BAR,
} from './harmony-query.ts';
import { lineRepositoryOf, nameOf } from './line-repository.ts';

/** The workbench a progression is read on: the meter, and a key, so its hole is filled. */
export const harmonyBench = (name: MeterName): string =>
  [`&bar meter("${name}") step=120bpm`, '&key scale(ionian, C)'].join('\n');

/** The half of a bar a slot starts on: step 8 of `SLOT_BAR`. */
const HALF = SLOT_BAR / 2;

/** A triad on a degree, as cells writes a stack. */
const stackOf = (degree: number) => `[${degree},${degree + 2},${degree + 4}]`;

/**
 * A section's progression as cells text, open on its meter and its key: a
 * bar a step (`1m`), each the triad on its slot's degree, or its two halves'
 * where it has a slot on its half, runs of a bar written `!n`. It reads
 * back as the slots it was stated from (`readProgression`, the round trip).
 */
export function progressionText(notes: readonly HarmonySlot[]): string {
  const bars = Array.from({ length: SECTION_BARS }, (_, b) => {
    const here = notes.filter((n) => Math.floor(n.step / SLOT_BAR) === b);
    const at = (step: number) => here.find((n) => n.step % SLOT_BAR === step);
    const first = at(0)!;
    const half = at(HALF);
    return half && half.degree !== first.degree
      ? `[${stackOf(first.degree)} ${stackOf(half.degree)}]`
      : stackOf(first.degree);
  });
  const runs: string[] = [];
  for (let b = 0; b < bars.length;) {
    let n = 1;
    while (b + n < bars.length && bars[b + n] === bars[b]) n++;
    runs.push(n > 1 ? `${bars[b]}!${n}` : bars[b]!);
    b += n;
  }
  return `&harm over=&key step=1m cycle=${SECTION_BARS} ${runs.join(' ')}`;
}

/**
 * A progression's slots under a meter: each stack's onset, in bars from its
 * start (a bar's start or its half), and the degree its triad stands on,
 * from cells' flattening of `&harm`. Null where the meter has no name in
 * cells, the text doesn't compile on the workbench, its lap is other than a
 * section's bars, a stack is no triad of the key's degrees unmoved (a third
 * and a fifth above its root, no accidental), one starts off a bar's start
 * or half, or a bar starts with none.
 */
export function readProgression(text: string, meter: Meter): HarmonyRead | null {
  const name = nameOf(meter);
  if (!name) return null;
  const result = compileSource(unionOf(text, harmonyBench(name)).text);
  if (!result.ok) return null;
  const cell = result.cells.get('harm');
  if (!cell?.step) return null;
  const cellMeter = result.cells.get(cell.step.driver)?.meter ?? null;
  const whole = tapWhole(cell.step.tap, cellMeter);
  if (whole === null || !cellMeter) return null;
  const barWhole = cellMeter.pulses / cellMeter.unit;
  const lap = (cell.steps * whole) / barWhole;
  if (Math.abs(lap - SECTION_BARS) > 1e-9) return null;
  const stacks = new Map<number, number[]>();
  for (const e of flatten(result, 'harm', codeShifts(result))) {
    if (e.table !== 'key' || e.via || e.tableShift !== 0 || (e.transpose ?? 0) !== 0) return null;
    if (e.alter !== 0) return null;
    const at = (e.step * whole) / barWhole;
    const step = Math.round(at * SLOT_BAR);
    if (Math.abs(at * SLOT_BAR - step) > 1e-6 || step % HALF !== 0) return null;
    if (step < 0 || step >= SECTION_BARS * SLOT_BAR) return null;
    stacks.set(step, [...(stacks.get(step) ?? []), e.value]);
  }
  const notes: HarmonySlot[] = [];
  for (const [step, values] of [...stacks].sort(([a], [b]) => a - b)) {
    const root = Math.min(...values);
    const tones = [...new Set(values)].sort((a, b) => a - b);
    if (tones.join(' ') !== `${root} ${root + 2} ${root + 4}`) return null;
    notes.push({ step, degree: ((root % 7) + 7) % 7 });
  }
  for (let b = 0; b < SECTION_BARS; b++)
    if (!notes.some((n) => n.step === b * SLOT_BAR)) return null;
  // (a bar's half that repeats its start is the same chord: one slot, as a theme writes it)
  const kept = notes.filter(
    (n) =>
      n.step % SLOT_BAR === 0 || notes.find((m) => m.step === n.step - HALF)!.degree !== n.degree,
  );
  return { bars: SECTION_BARS, notes: kept };
}

/** A repository of progressions, ranked by cells' query on the facet `harmony` and read by `read` (cells', unless a test counts them). */
export function harmonyRepository(
  fragments: readonly Fragment[] = HARMONY_FRAGMENTS,
  read: (text: string, meter: Meter) => HarmonyRead | null = readProgression,
): HarmonyRepository {
  return lineRepositoryOf<HarmonySlot>({
    facet: HARMONY_FACET,
    fragments,
    read,
    text: (notes) => progressionText(notes),
    bars: SECTION_BARS,
  });
}

/** Cells' harmonies, and the progressions the layer files, as the composer asks them. */
export const HARMONY_REPOSITORY: HarmonyRepository = harmonyRepository();
