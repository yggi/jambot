/**
 * The players' nudges in a session (docs/briefs/session-roles.md, step 2):
 * what a host keeps of them, and what it releases at each section line.
 *
 * A nudge is a bias, not a request (the owner on #566): the host neither
 * takes nor declines one. It adds a step up or down to its axis, weighed by
 * the players present, so one among few moves it far and one among many
 * little, and many the same way far: a step over N players, N counting the
 * host's own. What is pending fades: each section line releases a share of it
 * (`NUDGE_FADE`), which the band leans by (`leaned` in the engine), and keeps
 * the rest, until the rest is under `NUDGE_LEAST` and goes whole. So a lone
 * player's nudge moves its axis one step in all, half of it at the next
 * section, and none is left after `log2(1 / NUDGE_LEAST)` sections, 7.
 * The key and the meter move only by whole steps (session contract minor
 * 6): a section line takes one where the players' nudges come to half a
 * step or more, so a lone player's nudge moves it at once, and one among
 * three moves it only with a second the same way.
 *
 * It is a fading memory (`fading.ts` in the engine), one weight per axis,
 * read as a lean, and kept as plain data: what a host has not released when
 * it reloads is lost, as a nudge is meant to fade anyway. Pure.
 */

import { type Lean, type Nudged, STEPPED } from '@jambot/engine';

/** The steps still to release on each axis a player nudged: none where absent. */
export type Nudges = Lean;

/** No nudges pending. */
export const NO_NUDGES: Nudges = {};

/** What a section line keeps of what is pending: it releases the rest. */
export const NUDGE_FADE = 0.5;

/** The pending steps under which an axis's rest is released whole, so a nudge ends. */
export const NUDGE_LEAST = 0.01;

/** `nudges` with a step `by` on `axis`, weighed by the `players` present (one at least). */
export function nudged(nudges: Nudges, axis: Nudged, by: 1 | -1, players: number): Nudges {
  const steps = (nudges[axis] ?? 0) + by / Math.max(1, players);
  const next: Partial<Record<Nudged, number>> = { ...nudges, [axis]: steps };
  if (steps === 0) delete next[axis];
  return next;
}

/** Whether `axis` moves only by whole steps: the key and the meter. */
const stepped = (axis: Nudged): boolean => (STEPPED as readonly string[]).includes(axis);

/**
 * The lean a section line releases from `nudges`, and what it keeps. A style
 * axis releases its share; the key and the meter move a whole step where
 * what is pending comes to half a step or more, which the step takes off it,
 * and what is left fades as the rest do, gone once it is under `NUDGE_LEAST`.
 */
export function releaseNudges(nudges: Nudges): { lean: Lean; nudges: Nudges } {
  const lean: Partial<Record<Nudged, number>> = {};
  const kept: Partial<Record<Nudged, number>> = {};
  for (const [axis, steps] of Object.entries(nudges) as [Nudged, number][]) {
    if (stepped(axis)) {
      const step = Math.abs(steps) >= 0.5 ? Math.sign(steps) : 0;
      if (step !== 0) lean[axis] = step;
      const rest = (steps - step) * NUDGE_FADE;
      if (Math.abs(rest) >= NUDGE_LEAST) kept[axis] = rest;
      continue;
    }
    const rest = steps * NUDGE_FADE;
    if (Math.abs(rest) < NUDGE_LEAST) lean[axis] = steps;
    else {
      lean[axis] = steps - rest;
      kept[axis] = rest;
    }
  }
  return { lean, nudges: kept };
}
