/**
 * Genre probabilities: nearness to the presets in style space (#15, step 3).
 *
 * A genre is not a patch but a point in the style space (`PRESETS`), so what
 * a bar's genre is, is how near a reading lies to each of them: a distance
 * to every preset's point, turned into probabilities by a softmax over the
 * distances. The temperature is one more place entropy may act.
 *
 * A reading covers `sync`, `artic` and the density, which `energyOf` puts on
 * the energy axis (`readStyle`), and the `bpm` of the clock (`readTiming`),
 * and `harm` from the chords (`readHarm`); it lacks `entropy`. Swing is the
 * meter's, not a point in style space (#360), so no genre is read from it. So a distance is taken over
 * the axes the reading has, as a root mean square, and a reading with none
 * is at the same distance (0) from every genre.
 *
 * Pure: it counts and knows no clock, file or key.
 */

import { AXES, PRESETS, type Style } from './style.ts';
import type { StyleReading, TimingReading } from './style-reading.ts';

/** The axes of a reading that sit on the style space's own. */
export type ReadAxes = Partial<Pick<Style, 'energy' | 'sync' | 'artic' | 'bpm' | 'harm'>>;

/**
 * The tempo on its own axis's scale, 0 to 1: the axis glides in log space,
 * heard in ratios, so its distances are taken there.
 */
export function bpmUnit(bpm: number): number {
  const { min, max } = AXES.bpm;
  return (Math.log(bpm) - Math.log(min)) / (Math.log(max) - Math.log(min));
}

/**
 * The density (onsets per step over all parts) at an energy of 0 and of 1,
 * as the band composes them (E23: 0.33 and 1.55, and near-linear between).
 */
const DENSITY_AT_MIN = 0.33;
const DENSITY_AT_MAX = 1.55;

/** The energy a density reads as: linear between `DENSITY_AT_MIN` and `DENSITY_AT_MAX`, clamped to 0 to 1. */
export function energyOf(density: number): number {
  return Math.min(1, Math.max(0, (density - DENSITY_AT_MIN) / (DENSITY_AT_MAX - DENSITY_AT_MIN)));
}

/** A reading on the style space's axes: the ones it has. */
export function readingAxes(
  reading: StyleReading & TimingReading & { readonly harm?: number },
): ReadAxes {
  return {
    energy: energyOf(reading.density),
    ...(reading.harm === undefined ? {} : { harm: reading.harm }),
    ...(reading.bpm === undefined ? {} : { bpm: bpmUnit(reading.bpm) }),
    ...(reading.sync === undefined ? {} : { sync: reading.sync }),
    ...(reading.artic === undefined ? {} : { artic: reading.artic }),
  };
}

/** The axes a reading can have. */
const READ_AXES = ['energy', 'sync', 'artic', 'bpm', 'harm'] as const;

/** The root mean square of the differences, over the axes the reading has. */
export function styleDistance(read: ReadAxes, at: Landmark['at']): number {
  const axes = READ_AXES.filter((axis) => read[axis] !== undefined);
  if (axes.length === 0) return 0;
  return Math.sqrt(
    axes.reduce((sum, axis) => sum + (read[axis]! - at[axis]) ** 2, 0) / axes.length,
  );
}

/** How likely a reading is each preset, in the presets' order. */
export interface Genre {
  readonly name: string;
  readonly p: number;
}

/** A named point on the axes a reading has. */
export interface Landmark {
  readonly name: string;
  /** The tempo is on its unit scale (`bpmUnit`). */
  readonly at: Readonly<Record<(typeof READ_AXES)[number], number>>;
}

/** The presets' own points: where the composer is asked to play. */
export const PRESET_LANDMARKS: readonly Landmark[] = PRESETS.map((p) => ({
  name: p.name,
  at: { ...p.style, bpm: bpmUnit(p.style.bpm) },
}));

/**
 * A softmax over the negated distances to the landmarks: near 1 for the
 * nearest at a low temperature, even at a high one. The landmarks are the
 * presets' points by default; E24 measures them against where the presets'
 * bars actually read.
 */
export function genreOf(
  read: ReadAxes,
  temperature = 0.1,
  landmarks: readonly Landmark[] = PRESET_LANDMARKS,
): Genre[] {
  const scores = landmarks.map((l) => Math.exp(-styleDistance(read, l.at) / temperature));
  const total = scores.reduce((a, b) => a + b, 0);
  return landmarks.map((l, i) => ({ name: l.name, p: scores[i]! / total }));
}
