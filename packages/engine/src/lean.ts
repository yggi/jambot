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
import { AXES, type Style } from './style.ts';

/** What a player may nudge: the axes the radio walks, and the tempo, by the style's own names. */
export const NUDGED = ['sync', 'harm', 'artic', 'energy', 'bpm'] as const;
export type Nudged = (typeof NUDGED)[number];

/** A nudge's step on each: a tenth of a unit axis, and `TEMPO_STEP` of an octave on the tempo. */
export const NUDGE_STEP: Readonly<Record<Nudged, number>> = {
  sync: 0.1,
  harm: 0.1,
  artic: 0.1,
  energy: 0.1,
  bpm: TEMPO_STEP,
};

/** A lean in steps on each axis a player may nudge: up where positive, none where absent. */
export type Lean = Readonly<Partial<Record<Nudged, number>>>;

/** Whether a lean moves anything. */
export const leans = (lean: Lean): boolean => NUDGED.some((axis) => (lean[axis] ?? 0) !== 0);

/** `style` leaned by `lean` steps on each axis, held within the axis. */
export function leaned(style: Style, lean: Lean): Style {
  const next = { ...style };
  for (const axis of NUDGED) {
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
