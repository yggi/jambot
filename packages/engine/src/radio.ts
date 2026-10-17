/**
 * Radio mode (#313): left alone, the style wanders freely, as a radio station
 * drifts through an evening, with energy and entropy as the walk's
 * temperature.
 *
 * Once a section, every axis takes a step in its own space (tempo in log
 * space, the rest linearly), drawn uniformly between minus and plus its
 * `step`, and nothing pulls it back: no home, no anchor, no preset.
 *
 * - **Entropy sets the variance.** Every step is scaled by the style's
 *   entropy: at 1 an axis moves up to its whole `step` a section, at 0.25 a
 *   quarter of it, and at 0 the style holds. Entropy itself holds by default:
 *   it is the dial, which the players set, and a walk scaled by itself would
 *   creep toward 0 and freeze there (E30).
 * - **Energy leans the tempo.** The tempo drifts by `tempoLean` a section at
 *   an energy of 1, as much down at 0, and not at all at 0.5, linearly
 *   between, on top of its step. Energy walks as the other axes do, so the
 *   tempo rises and falls with it.
 * - **The tempo changes slowly.** Its step and its lean together are at most
 *   0.01 in log tempo, about 1 %, a section.
 * - **An axis's ends reflect.** A step past an end comes back off it by as
 *   much, so a target always lies inside its axis, `glideTo`'s clamp does not
 *   act, and the walk neither sticks to an end nor is drawn away from one.
 *
 * It is the style's row of the loop every level may run (C9, #210), with
 * nobody in it:
 *
 * - **hold:** the axes' bounds, and the energy and entropy the level above
 *   gives, as the walk's temperature;
 * - **fill:** the walk;
 * - **read, remember, lean:** none, by the owner's ruling on #313 (no
 *   attraction), until a player acts; then the radio's position is the
 *   default the players' nudges lean from (#195).
 *
 * So it has no time constant of its own: it remembers where it is for as
 * long as the bounds let it, which E30 measures (A4), and it never comes
 * home (Q11).
 *
 * The walk is a Mealy machine (F1, `radio`): the state it carries is the
 * style it last reached, plain data, so a host carries nothing more, a client
 * computes the same walk, and a run resumed from that state at any section
 * is the run from the start (S2). Every draw is keyed by the seed, the section
 * and the axis (`STREAMS.radio`), one uniform draw each, so a unit axis meets
 * nothing but arithmetic; the tempo, which meets `Math.log` and `Math.exp`,
 * is quantised after them, so the same seed walks the same on every device
 * (`random.ts`).
 *
 * The app glides to each section's style with `glideTo` (step 3), and the
 * session, not the band, will carry the station (the owner, #313).
 */

import type { Machine } from './machine.ts';
import { draw, quantize } from './random.ts';
import { AXES, AXIS_NAMES, type Axis, type Style } from './style.ts';

/** How the radio walks: a step per axis, and the tempo's lean. */
export interface RadioParams {
  /** The most an axis moves a section at an entropy of 1, in its space (log space for tempo). */
  readonly step: Readonly<Record<Axis, number>>;
  /** How far the tempo drifts a section at an energy of 1, in log space: up; as much down at 0. */
  readonly tempoLean: number;
}

/**
 * The radio's walk by default. The unit axes are heard unequally: energy
 * steps least, harmony and articulation most. Swing is the meter's, not an
 * axis (#360), so the radio leaves it where it is. The tempo is heard most,
 * so its step and its lean together stay at 0.01 in log tempo, about 1 % a
 * section, a twentieth of it the lean: about 8 % an hour at an energy of 1.
 */
export const RADIO: RadioParams = {
  step: {
    sync: 0.08,
    harm: 0.1,
    artic: 0.1,
    energy: 0.06,
    entropy: 0,
    bpm: 0.0095,
  },
  tempoLean: 0.0005,
};

function checked(params: RadioParams): RadioParams {
  for (const axis of AXIS_NAMES)
    if (!(params.step[axis] >= 0 && Number.isFinite(params.step[axis])))
      throw new Error(`walkRadio: ${axis}: step ${params.step[axis]} is not a step`);
  if (!Number.isFinite(params.tempoLean))
    throw new Error(`walkRadio: tempoLean ${params.tempoLean} is not a number`);
  return params;
}

/** `x` folded into [low, high]: past an end, it comes back off it by as much, as often as it takes. */
function reflected(x: number, low: number, high: number): number {
  const width = high - low;
  const around = (((x - low) % (2 * width)) + 2 * width) % (2 * width);
  return low + (around > width ? 2 * width - around : around);
}

/**
 * The style a section on: every axis a step from where it is, in its space,
 * scaled by the style's entropy, the tempo leaned by its energy, and folded
 * back into the axis at its ends.
 */
export function walkRadio(
  style: Style,
  seed: number,
  section: number,
  params: RadioParams = RADIO,
): Style {
  const { step, tempoLean } = checked(params);
  const next = {} as Record<Axis, number>;
  for (const [index, axis] of AXIS_NAMES.entries()) {
    const { min, max, space } = AXES[axis];
    const towards = 2 * draw(seed, 'radio', section, index) - 1;
    const move =
      step[axis] * style.entropy * towards +
      (axis === 'bpm' ? tempoLean * (2 * style.energy - 1) : 0);
    if (space === 'linear') {
      next[axis] = move === 0 ? style[axis] : reflected(style[axis] + move, min, max);
      continue;
    }
    const at = reflected(Math.log(style[axis]) + move, Math.log(min), Math.log(max));
    // Only a log axis meets `Math.log` and `Math.exp`, whose last bit may differ between engines.
    next[axis] = move === 0 ? style[axis] : Math.max(min, Math.min(max, quantize(Math.exp(at))));
  }
  return next;
}

/** What the radio reads at a section's start. */
export interface RadioEnv {
  readonly seed: number;
  readonly section: number;
  /** The style the radio is tuned in at, read only when it carries none: where the jam is, or where the players left it. */
  readonly tunedIn: Style;
}

/**
 * The radio as a machine at the section rate (F1). It carries the style it
 * last reached, none before it is tuned in; a section's output is the style
 * to glide to. Nobody plays into it: a player's act ends it.
 */
export const radio: Machine<RadioEnv, Style | null, null, Style> = {
  initial: null,
  advance({ seed, section, tunedIn }, before) {
    const style = before === null ? tunedIn : walkRadio(before, seed, section);
    return { carried: style, output: style };
  },
};
