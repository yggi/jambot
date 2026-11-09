/**
 * The players' lean (docs/briefs/session-roles.md, step 2): a style moved by
 * whole steps on the axes a player may nudge, as the section line takes it.
 *
 * A nudge is a bias, not a request (the owner on #566): nobody takes or
 * declines it, and it moves the style the band walks by, on top of the
 * radio's walk where the radio is on (`radio.ts`). This is only the move;
 * which nudges are active, how each is weighed by the players present and how
 * it fades is the session's (`packages/session/src/nudges.ts`).
 *
 * A step is a player's own nudge on the host's cards: a tenth of a unit axis
 * (the Style card's nudge), and `TEMPO_STEP` of an octave on the tempo (the
 * Metrum's). Entropy takes none: it is the scale of every licence, so a nudge
 * of it would widen its own reach (#217), and it stays the host's.
 *
 * An axis leaned past an end stops there: a lean has a direction, so it is
 * clamped, never reflected as the radio's aimless walk is. The tempo, which
 * meets a power of two, is quantised after it, as the radio's is (`random.ts`).
 */

import { TEMPO_STEP } from './licence.ts';
import { quantize } from './random.ts';
import { AXES, type Axis, type Style } from './style.ts';

/**
 * What of the style a player may nudge, by the style's own names, each leaning by a share of a step: the session's
 * `nudge` targets (yggi/music-commons `contracts/session`), the axes the radio walked before mood came, and the tempo.
 * Mood, cells' since v0.23.0, is nudged once the contract carries it.
 */
export const LEANED = ['sync', 'harm', 'artic', 'energy', 'bpm'] as const satisfies readonly Axis[];
export type Leaned = (typeof LEANED)[number];

/**
 * What else a player may nudge, which moves only by whole steps (session
 * contract minor 6): the key, a fifth a step, and the meter, a beat a bar a
 * step. The session says when a step is taken (`nudges.ts`), and the player
 * takes it: a style has neither.
 */
export const STEPPED = ['key', 'meter'] as const;
export type Stepped = (typeof STEPPED)[number];

/** Everything a player may nudge. */
export const NUDGED = [...LEANED, ...STEPPED] as const;
export type Nudged = (typeof NUDGED)[number];

/** A nudge's step on each style axis: a tenth of a unit axis, and `TEMPO_STEP` of an octave on the tempo. */
export const NUDGE_STEP: Readonly<Record<Leaned, number>> = {
  sync: 0.1,
  harm: 0.1,
  artic: 0.1,
  energy: 0.1,
  bpm: TEMPO_STEP,
};

/** A lean in steps on each thing a player may nudge: up where positive, none where absent; whole steps on the key and the meter. */
export type Lean = Readonly<Partial<Record<Nudged, number>>>;

/** Whether a lean moves anything. */
export const leans = (lean: Lean): boolean => NUDGED.some((axis) => (lean[axis] ?? 0) !== 0);

/** `style` leaned by `lean` steps on each of its axes, held within the axis; the key and the meter aren't the style's, and are left to the player. */
export function leaned(style: Style, lean: Lean): Style {
  const next = { ...style };
  for (const axis of LEANED) {
    const steps = lean[axis] ?? 0;
    if (steps === 0) continue;
    const { min, max } = AXES[axis];
    const moved =
      axis === 'bpm'
        ? quantize(style.bpm * 2 ** (steps * NUDGE_STEP.bpm))
        : style[axis] + steps * NUDGE_STEP[axis];
    next[axis] = Math.min(max, Math.max(min, moved));
  }
  return next;
}
