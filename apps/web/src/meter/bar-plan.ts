/**
 * One bar of the meter screen, written from a meter alone (#259): what plays
 * on which step. The bar is the meter's own, two steps to an eighth
 * (`meterOnSteps`), and every onset lies on one of its eighths. Three
 * layers: the click on each eighth by weight; drums with the kick on the
 * downbeat and the half's pulse and the snare on the backbeat, hats on every
 * eighth; and a bass on the downbeat and the pulses. Each is scaled by its
 * eighth's accent grade (`gradeGain`).
 *
 * A backbeat is a choice of pulses, set out per meter (`BACKBEAT`): the
 * formula `compose(even(2, pulses, 1), pulses)` leaves the bar in a meter
 * whose pulses are not four (it reaches the bar's length, the next downbeat,
 * for 3/4, 5/8, 6/8 and 7/8). The hemiola (`HEMIOLA`) keeps the drums and
 * moves the bass onto the other meter's pulses: 6/8 over 3/4's, and back,
 * the same bar regrouped, as `parallel` regroups it (docs/shape.md).
 */

import { DRUM_NOTES } from '@jambot/engine';
import { METERS, type MeterName, type Weight, meterOnSteps, meterWeights } from '@jambot/theory';
import { STEPS_PER_EIGHTH } from '../bar.ts';
import { gradeGain, gradesOf } from './grades.ts';

export const LAYERS = ['click', 'drums', 'bass'] as const;
export type Layer = (typeof LAYERS)[number];

/** The tempos on offer, in quarters a minute. */
export const BPM_RANGE = { min: 40, max: 208 } as const;

/** The pulses (from 0, the downbeat's) the snare lands on, in each meter. */
export const BACKBEAT: Record<MeterName, readonly number[]> = {
  '3/4': [1, 2],
  '4/4': [1, 3],
  '5/4': [1, 3],
  '5/8': [1],
  '6/8': [1],
  '7/8': [1, 2],
  '9/8': [1, 2],
  '10/8': [2],
  '12/8': [1, 3],
};

/** Each meter that has one, and the meter whose pulses regroup its bar. */
export const HEMIOLA: Partial<Record<MeterName, MeterName>> = { '3/4': '6/8', '6/8': '3/4' };

export interface Setting {
  readonly name: MeterName;
  readonly layers: Readonly<Record<Layer, boolean>>;
  /** The bass takes the other meter's pulses, where there is one. */
  readonly hemiola: boolean;
  /** The accent slider, 0 to 1. */
  readonly grade: number;
  /** The pulses grouped the other way round, 5 as 2+3 (`gradesOf`). */
  readonly mirror: boolean;
}

export type Onset =
  | {
      readonly layer: 'click';
      readonly step: number;
      readonly weight: Weight;
      readonly gain: number;
    }
  | {
      readonly layer: 'drums' | 'bass';
      readonly step: number;
      readonly note: number;
      readonly velocity: number;
      /** In steps. */
      readonly length: number;
    };

const ROOT = 40;
const FIFTH = 47;

const velocity = (base: number, gain: number) =>
  Math.max(1, Math.min(127, Math.round(base * gain)));

/** What plays in one bar of the meter, in time order. */
export function barPlan({ name, layers, hemiola, grade, mirror }: Setting): Onset[] {
  const meter = METERS[name];
  const grades = gradesOf(meter, mirror);
  const weights = meterWeights(meter);
  const pulses = meterOnSteps(meter).heights;
  const barSteps = meter.cycle * STEPS_PER_EIGHTH;
  const gainAt = (step: number) => gradeGain(grades[step / STEPS_PER_EIGHTH]!, grade);
  const onsets: Onset[] = [];

  if (layers.click)
    weights.forEach((weight, eighth) => {
      const step = eighth * STEPS_PER_EIGHTH;
      onsets.push({ layer: 'click', step, weight, gain: gainAt(step) });
    });

  if (layers.drums) {
    const drum = (step: number, note: number, base: number) =>
      onsets.push({
        layer: 'drums',
        step,
        note,
        velocity: velocity(base, gainAt(step)),
        length: 1,
      });
    grades.forEach((g, eighth) => {
      const step = eighth * STEPS_PER_EIGHTH;
      if (g === 'downbeat' || (g === 'half' && meter.heights.length >= 4))
        drum(step, DRUM_NOTES.kick, 118);
      drum(step, DRUM_NOTES.closedHat, 100);
    });
    for (const pulse of BACKBEAT[name]) drum(pulses[pulse]!, DRUM_NOTES.snare, 108);
  }

  if (layers.bass) {
    const partner = hemiola ? HEMIOLA[name] : undefined;
    const starts = partner ? meterOnSteps(METERS[partner]).heights : pulses;
    starts.forEach((step, i) => {
      const next = starts[i + 1] ?? barSteps;
      onsets.push({
        layer: 'bass',
        step,
        note: i === 0 ? ROOT : FIFTH,
        velocity: velocity(100, gradeGain(i === 0 ? 'downbeat' : 'pulse', grade)),
        length: next - step,
      });
    });
  }

  return onsets.sort((a, b) => a.step - b.step);
}
