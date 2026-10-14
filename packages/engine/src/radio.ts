/**
 * Radio mode (#313): left alone, the style walks slowly around an anchor that
 * walks more slowly still, as a radio station drifts through an evening.
 *
 * Two walks, one inside the other, each pulled back toward its centre, are
 * taken once a section, on every axis in its own space (tempo in log space,
 * the rest linearly):
 *
 * - the anchor walks around `home`, the style the radio was tuned in at
 *   (where the jam started, or where the players left it), with a time
 *   constant of `anchorTime` sections;
 * - the tip walks around the anchor, with a time constant of `tipTime`.
 *
 * Each is a fading memory of a continuous value (C9, `fading.ts`): a
 * section's distance from the centre is the last one faded by the decay
 * `1 − 1 / time`, so `timeConstant(decay)` is the time, plus a draw. The draw
 * is scaled so that the walk's spread about its centre settles at the spread
 * asked for (an Ornstein–Uhlenbeck process sampled once a section). A value
 * past its axis's end is held at the end.
 *
 * The tip is the section's targets, for `glideTo`, so nothing jumps, not even
 * the rate. The state is plain data, so a host can carry it and a client
 * compute the same walk. Every draw is keyed by the seed, the section and the
 * axis (`STREAMS.radio`). A draw is a sum of uniform ones, so a linear axis
 * meets nothing but arithmetic, and the tempo, which meets `Math.log` and
 * `Math.exp`, is quantised after them, so the same seed walks the same on
 * every device (`random.ts`).
 *
 * The parameters are speculative until #313's step 2 chooses them on E30's
 * measurements. The app decides when to call it (step 3).
 */

import { draw, quantize } from './random.ts';
import { AXES, AXIS_NAMES, type Axis, type Style } from './style.ts';

/** How the radio walks: two time constants, in sections, and a spread per axis for each walk. */
export interface RadioParams {
  /** The sections over which the tip's distance from the anchor fades to 1/e, about. At least 1. */
  readonly tipTime: number;
  /** The same for the anchor's distance from home. */
  readonly anchorTime: number;
  /** How far the tip strays from the anchor, settled (a standard deviation), in the axis's space. */
  readonly tipSpread: Readonly<Record<Axis, number>>;
  /** How far the anchor strays from home, settled. */
  readonly anchorSpread: Readonly<Record<Axis, number>>;
}

/**
 * The radio's walk by default. The tempo is heard most, so it walks least: a
 * spread of 0.03 in log space is about 3 % of the tempo. Entropy, which the
 * presets leave to the players, holds (#313's step 2 decides).
 */
export const RADIO: RadioParams = {
  tipTime: 4,
  anchorTime: 128,
  tipSpread: {
    swing: 0.05,
    sync: 0.06,
    harm: 0.08,
    artic: 0.08,
    energy: 0.05,
    entropy: 0,
    bpm: 0.03,
  },
  anchorSpread: {
    swing: 0.15,
    sync: 0.2,
    harm: 0.25,
    artic: 0.25,
    energy: 0.15,
    entropy: 0,
    bpm: 0.1,
  },
};

/** Where the radio is: plain data, carried from one section to the next. */
export interface Radio {
  /** Where the anchor is pulled back to. */
  readonly home: Style;
  /** Where the tip is pulled back to. */
  readonly anchor: Style;
  /** Where the style glides to this section: the targets. */
  readonly tip: Style;
}

/** The radio tuned in at a style: home, anchor and tip all there. */
export function tuneIn(style: Style): Radio {
  return { home: style, anchor: style, tip: style };
}

/** The walks, in the order their draws are keyed. */
const LEVELS = ['tip', 'anchor'] as const;
/** The uniform draws summed into one: four give a bell bounded at 2√3 spreads. */
const DRAWS = 4;

/**
 * A draw of mean 0 and standard deviation 1, from `DRAWS` uniform ones
 * (Irwin and Hall), so it needs nothing but adding: no logarithm or cosine,
 * which may differ in the last bit between engines.
 */
function bell(seed: number, ...keys: number[]): number {
  let sum = 0;
  for (let i = 0; i < DRAWS; i++) sum += draw(seed, 'radio', ...keys, i);
  return (sum - DRAWS / 2) * Math.sqrt(12 / DRAWS);
}

const inSpace = (axis: Axis, x: number) => (AXES[axis].space === 'log' ? Math.log(x) : x);
const outOfSpace = (axis: Axis, x: number) => (AXES[axis].space === 'log' ? Math.exp(x) : x);

function checked(params: RadioParams): RadioParams {
  for (const name of ['tipTime', 'anchorTime'] as const)
    if (!(params[name] >= 1 && Number.isFinite(params[name])))
      throw new Error(
        `walkRadio: ${name} ${params[name]} is not a number of sections of 1 or more`,
      );
  for (const spreads of [params.tipSpread, params.anchorSpread])
    for (const axis of AXIS_NAMES)
      if (!(spreads[axis] >= 0 && Number.isFinite(spreads[axis])))
        throw new Error(`walkRadio: ${axis}: spread ${spreads[axis]} is not a spread`);
  return params;
}

/**
 * One step of a walk on one axis, in the axis's space: the distance from the
 * centre faded by the decay, plus a draw of the spread that keeps the walk's
 * spread settled where it was asked, then held inside the axis.
 */
function stepOf(
  axis: Axis,
  value: number,
  centre: number,
  time: number,
  spread: number,
  bellDraw: number,
): number {
  const decay = 1 - 1 / time;
  const [at, from] = [inSpace(axis, value), inSpace(axis, centre)];
  const next = from + decay * (at - from) + spread * Math.sqrt(1 - decay * decay) * bellDraw;
  const { min, max, space } = AXES[axis];
  const held = Math.max(min, Math.min(max, outOfSpace(axis, next)));
  // Only a log axis meets `Math.log` and `Math.exp`, whose last bit may differ between engines.
  return space === 'log' ? quantize(held) : held;
}

/**
 * The radio at the start of `section`: its anchor a step on from the last,
 * around home, and its tip a step on from the last, around the new anchor.
 * The tip is the section's targets.
 */
export function walkRadio(
  radio: Radio,
  seed: number,
  section: number,
  params: RadioParams = RADIO,
): Radio {
  const { tipTime, anchorTime, tipSpread, anchorSpread } = checked(params);
  const anchor = {} as Record<Axis, number>;
  const tip = {} as Record<Axis, number>;
  for (const [index, axis] of AXIS_NAMES.entries()) {
    const [tipLevel, anchorLevel] = LEVELS.map((_, level) => bell(seed, section, level, index));
    anchor[axis] = stepOf(
      axis,
      radio.anchor[axis],
      radio.home[axis],
      anchorTime,
      anchorSpread[axis],
      anchorLevel!,
    );
    // The tip keeps its distance from the anchor, faded, so it rides the anchor's step.
    const off = inSpace(axis, radio.tip[axis]) - inSpace(axis, radio.anchor[axis]);
    tip[axis] = stepOf(
      axis,
      outOfSpace(axis, inSpace(axis, anchor[axis]) + off),
      anchor[axis],
      tipTime,
      tipSpread[axis],
      tipLevel!,
    );
  }
  return { home: radio.home, anchor, tip };
}
