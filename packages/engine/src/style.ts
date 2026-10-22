/**
 * Style space: the axes the band is steered along, and how they glide.
 *
 * A style is a point in the space, one value per axis. Genres are not
 * patches but points: the presets are eight of them. Nothing jumps: a change
 * is a glide from the value an axis has now to a target, over a length of
 * steps, on an S-curve. Each axis glides on its own, in its own space: tempo
 * in log space, because it is heard in ratios, and the rest linearly.
 *
 * Swing is not an axis: it is the meter's (`swing.ts`, #360), and a
 * preset's is the swing of the meter the repository finds at its point
 * (`presetSwing`, `repository.ts`, #459). A preset's mode is found at its
 * point the same way (`presetMode`, `mode-repository.ts`, #420).
 *
 * Positions are steps of the song, counted from its start, 16 to a bar.
 */

import { barStart } from './events.ts';

export interface AxisRange {
  readonly min: number;
  readonly max: number;
  /** How the axis glides: `log` for ratios, such as tempo. */
  readonly space: 'linear' | 'log';
}

const unit: AxisRange = { min: 0, max: 1, space: 'linear' };

export const AXES = {
  /** On the beat (0) to off the beat (1). */
  sync: unit,
  /** A static vamp (0) to moving, rich harmony (1). */
  harm: unit,
  /** Legato (0) to staccato (1). */
  artic: unit,
  /** Sparse (0) to dense (1). */
  energy: unit,
  /** Predictable (0) to surprising (1). */
  entropy: unit,
  /** Beats per minute: the beats of the meter the track counts (`tempo.ts`, #367). */
  bpm: { min: 60, max: 180, space: 'log' },
} as const satisfies Record<string, AxisRange>;

export type Axis = keyof typeof AXES;
export const AXIS_NAMES = Object.keys(AXES) as Axis[];

export type Style = Readonly<Record<Axis, number>>;

/**
 * A change of one axis: from a value to a target, over `length` steps from
 * `start`, leaving at `slope` and arriving at rest.
 */
export interface Glide {
  readonly from: number;
  readonly to: number;
  readonly start: number;
  readonly length: number;
  /**
   * How fast the value is moving as the glide starts, per step, in the axis's
   * space (for tempo, in log bpm per step). A glide from rest has slope 0.
   */
  readonly slope: number;
  /**
   * Over how many steps that motion dies away, at most `length`. Heading for
   * the target it is `length`; heading away, it is no longer than the motion
   * had left, and short enough to stay inside the axis.
   */
  readonly brake: number;
}

/** Where each axis is going: one glide per axis. Plain data, so it can be carried. */
export type StyleTrack = Readonly<Record<Axis, Glide>>;

export interface Preset {
  readonly name: string;
  /** Every axis but entropy, which stays where the players put it. */
  readonly style: Readonly<Record<Exclude<Axis, 'entropy'>, number>>;
}

/** A preset's axes in order: sync, harm, artic, energy, bpm. */
type PresetAxes = [number, number, number, number, number];

const preset = (name: string, [sync, harm, artic, energy, bpm]: PresetAxes): Preset => ({
  name,
  style: { sync, harm, artic, energy, bpm },
});

/**
 * The prototype's presets. Each swings as it did on the swing axis: the
 * meter the repository finds at its point swings at the level and share
 * `swingParts` gave at its value there (`presetSwing`), the straight ones
 * on the 16ths, where nothing brings in the jazz band. Each one's mode is
 * the one the repository finds at its point (`presetMode`).
 */
export const PRESETS: readonly Preset[] = [
  preset('Synth-pop', [0.3, 0.45, 0.55, 0.55, 108]),
  preset('Techno', [0.12, 0, 1, 0.8, 130]),
  preset('Deep house', [0.35, 0.55, 0.65, 0.65, 122]),
  preset('Ambient', [0.05, 0.3, 0, 0.2, 72]),
  preset('Lo-fi hip hop', [0.5, 0.75, 0.35, 0.5, 84]),
  preset('Funk', [1, 0.12, 0.85, 0.75, 104]),
  preset('Bossa nova', [0.75, 0.85, 0.45, 0.45, 132]),
  preset('Swing jazz', [0.35, 1, 0.3, 0.6, 148]),
];

/** A preset glides over 8 bars, a slider over one. */
export const PRESET_GLIDE = barStart(8);
export const SLIDER_GLIDE = barStart(1);

export const INITIAL_STYLE: Style = { ...PRESETS[0]!.style, entropy: 0.3 };

/** The decimals the score writes a style with, and the band reads it at (C7). */
export const STYLE_DECIMALS = 3;

/**
 * A style as the score writes it: each axis rounded to `STYLE_DECIMALS`.
 * The band reads its style this way, so a bar's header states exactly the
 * style it was composed from (C7, decided on #7). A glide passes through
 * values of any length; what plays between bars, the tempo, the transport
 * reads from the style track itself, as it reads the swing's share from its
 * own track (`SwingTrack`).
 */
export function writtenStyle(style: Style): Style {
  const grid = 10 ** STYLE_DECIMALS;
  return Object.fromEntries(
    AXIS_NAMES.map((axis) => [axis, Math.round(style[axis] * grid) / grid]),
  ) as Style;
}

/** The range's space: where a glide is a straight line (log for tempo). */
const inSpace = (range: AxisRange, x: number) => (range.space === 'log' ? Math.log(x) : x);

/**
 * The value of one axis at a position, as its glide has it, in the axis's
 * space: a smoothstep from `from` to `to` over `length`, plus the motion the
 * glide left with, `slope`, dying away over `brake` steps. Where the brake is
 * the length, the sum is a cubic Hermite curve from `from` at `slope` to `to`
 * at rest; from rest it is the smoothstep alone.
 */
export function valueAt(axis: Axis, glide: Glide, position: number): number {
  return valueIn(AXES[axis], glide, position);
}

/** `valueAt` over any range: an axis's, or another value that glides as one does (the swing's share). */
export function valueIn(range: AxisRange, glide: Glide, position: number): number {
  const { from, to, start, length } = glide;
  if (position >= start + length) return to;
  if (position <= start) return from;
  const u = (position - start) / length;
  const toward = u * u * (3 - 2 * u);
  const onward = carried(glide, position);
  const value =
    range.space === 'log'
      ? from * Math.pow(to / from, toward) * Math.exp(onward)
      : from * (1 - toward) + to * toward + onward;
  // Only rounding can take a glide past its axis (see glideTo).
  return Math.max(range.min, Math.min(range.max, value));
}

/** The motion a glide left with, as far as it has carried the value by a position. */
function carried({ start, slope, brake }: Glide, position: number): number {
  const s = (position - start) / brake;
  return brake > 0 && s < 1 ? slope * brake * s * (1 - s) * (1 - s) : 0;
}

/** How fast one axis is moving at a position, per step, in the axis's space. */
export function rateAt(axis: Axis, glide: Glide, position: number): number {
  return rateIn(AXES[axis], glide, position);
}

/** `rateAt` over any range. */
function rateIn(range: AxisRange, glide: Glide, position: number): number {
  const { from, to, start, length, slope, brake } = glide;
  if (position < start || position >= start + length) return 0;
  const u = (position - start) / length;
  const s = brake > 0 ? (position - start) / brake : 1;
  const distance = inSpace(range, to) - inSpace(range, from);
  const onward = s < 1 ? slope * (1 - s) * (1 - 3 * s) : 0;
  return onward + (distance * 6 * u * (1 - u)) / length;
}

/** The whole style at a position. */
export function styleAt(track: StyleTrack, position: number): Style {
  return Object.fromEntries(
    AXIS_NAMES.map((axis) => [axis, valueAt(axis, track[axis], position)]),
  ) as Style;
}

/** A track that holds a style still. */
export function holding(style: Style): StyleTrack {
  return Object.fromEntries(
    AXIS_NAMES.map((axis) => [
      axis,
      { from: style[axis], to: style[axis], start: 0, length: 0, slope: 0, brake: 0 },
    ]),
  ) as StyleTrack;
}

/**
 * The track with the given axes gliding towards their targets from `start`.
 * Each glide leaves from the value its axis has there, and as fast, so
 * nothing jumps, not even the rate: a slider dragged with many retargets
 * keeps moving.
 *
 * - A glide heading for its target arrives sooner rather than overshoot it:
 *   its length is at most 3 × distance / slope, which keeps the curve
 *   monotone (Fritsch and Carlson).
 * - A glide sent the other way carries on for a moment and turns. Its motion
 *   dies away no later than the glide it came from would have ended, and
 *   soon enough to peak inside the axis (the carry peaks at
 *   slope × brake × 4/27), however long the new glide is.
 *
 * A target outside its axis is clamped into it. A length of 0 sets the
 * values at `start`, for when the band is not playing.
 */
export function glideTo(
  track: StyleTrack,
  targets: Partial<Style>,
  start: number,
  length: number,
): StyleTrack {
  if (!(length >= 0 && Number.isFinite(length)))
    throw new Error(`glideTo: length ${length} is not a length in steps`);
  const next = { ...track };
  for (const [axis, target] of Object.entries(targets) as [Axis, number][]) {
    if (!Number.isFinite(target)) throw new Error(`glideTo: ${axis}: ${target} is not a value`);
    next[axis] = glideIn(AXES[axis], track[axis], target, start, length);
  }
  return next;
}

/**
 * One glide of `glideTo`, over any range: from where `old` has the value at
 * `start`, and as fast, to `target` clamped into the range.
 */
export function glideIn(
  range: AxisRange,
  old: Glide,
  target: number,
  start: number,
  length: number,
): Glide {
  if (!(length >= 0 && Number.isFinite(length)))
    throw new Error(`glideTo: length ${length} is not a length in steps`);
  if (!Number.isFinite(target)) throw new Error(`glideTo: ${target} is not a value`);
  const { min, max } = range;
  const to = Math.max(min, Math.min(max, target));
  const from = valueIn(range, old, start);
  const slope = length === 0 ? 0 : rateIn(range, old, start);
  if (slope === 0) return { from, to, start, length, slope: 0, brake: 0 };
  const distance = inSpace(range, to) - inSpace(range, from);
  if (slope * distance > 0) {
    const arrival = Math.min(length, (3 * distance) / slope);
    return { from, to, start, length: arrival, slope, brake: arrival };
  }
  const room =
    slope > 0
      ? inSpace(range, max) - inSpace(range, from)
      : inSpace(range, from) - inSpace(range, min);
  const left = old.start + old.length - start;
  const brake = Math.min(length, left, (27 * room) / (4 * Math.abs(slope)));
  return { from, to, start, length, slope, brake };
}
