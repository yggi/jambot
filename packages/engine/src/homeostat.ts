/**
 * The homeostat's controller (#237, step 6; yggi/cells decision 043; the
 * owner's limits of 2026-10-22): the share of bars recognised over the last
 * eight (`recognised.ts`) leans the loop's entropy, so a band that bores
 * itself loosens and one that confuses tightens.
 *
 * The share is kept in a band (`bandOf`): 0.4 to 0.7 at entropy 0.3, the
 * owner's ruling, widening with entropy about the same centre, so a style
 * that leaves its players more licence tolerates more of both ends.
 * Above the band the band is bored, and the controller climbs the novelty
 * ladder; under it the band is confused, and it steps down and narrows
 * `free()`; inside it, it holds (`wayOf`).
 *
 * What it moves is entropy, the owner's nudge for the whole system on that
 * axis (#237, 2026-09-30): the players' entropy leaned by `lean`
 * (`leanedEntropy`), which the band plays at, so one number reaches every
 * rung, from how much a held groove varies on its odd bars to how soon the
 * composer tires of a fragment and fetches another. E45 measured the
 * ladder's rate alone moving the share by under 0.01 at entropy 0.3, and the
 * band's whole entropy from 0 to 1 moving it by 0.12, so the controller
 * leans the whole.
 *
 * Integral, with the band as its dead zone: a reading out of the band, where
 * the reading before was out on the same side (`PATIENCE`), moves the lean
 * `LEAN_STEP` its way, and a reading inside holds it, so the band left
 * inside keeps the lean that brought it there. The lean never
 * takes the loop's entropy past 0 or 1, and a move it can't make isn't one.
 * It counts its reversals (a move against the move before), which the
 * ruling bounds at one per four sections. A lean is a sum of steps, and
 * adding is exact alike on every device, so every device leans alike; at
 * no lean the band plays the players' entropy as it is. Pure.
 */

/** The band's width at entropy 0.3: 0.4 to 0.7 (the owner's ruling, #237, 2026-10-22). */
export const BAND_WIDTH = 0.3;

/** The band's centre: 0.55, the middle of the ruled 0.4 to 0.7, at every entropy. */
export const BAND_CENTRE = 0.55;

/** How much wider the band grows per unit of entropy: 0.21 at entropy 0, 0.51 at 1 (chosen in #237's controller, E45). */
export const BAND_WIDENING = 0.3;

/** How far a move leans the loop's entropy: half its range, so two moves reach either end (chosen in E45, beside 0.25). */
export const LEAN_STEP = 0.5;

/**
 * How many readings in a row a move waits for out of the band on one side: 2,
 * so one section's noise (a section's share spreads by about 0.13, E45)
 * doesn't move it; with 1 the controller reversed up to 1.75 times per four
 * sections, past the ruled 1 (chosen in E45).
 */
export const PATIENCE = 2;

/** The band the share is kept in at an entropy, inside 0 to 1. */
export function bandOf(entropy: number): { readonly low: number; readonly high: number } {
  const half = (BAND_WIDTH + BAND_WIDENING * (entropy - 0.3)) / 2;
  return { low: Math.max(0, BAND_CENTRE - half), high: Math.min(1, BAND_CENTRE + half) };
}

/** The way a share moves the ladder: 1 above the band (bored, climb), -1 under it (confused, step down), 0 inside it or where nothing was heard. */
export function wayOf(share: number | null, entropy: number): -1 | 0 | 1 {
  if (share === null) return 0;
  const { low, high } = bandOf(entropy);
  return share > high ? 1 : share < low ? -1 : 0;
}

/** The controller's state: its lean, the way it moved last, and how often it reversed. */
export interface Homeostat {
  /** What it adds to the players' entropy. */
  readonly lean: number;
  /** The way of its last move, 0 before its first. */
  readonly moved: -1 | 0 | 1;
  /** Its moves against the move before. */
  readonly reversals: number;
  /** The way of the reading before, which a move waits to agree with (`PATIENCE`). */
  readonly heard: -1 | 0 | 1;
}

/** Nothing leaned yet: a song's start. */
export const NO_LEAN: Homeostat = { lean: 0, moved: 0, reversals: 0, heard: 0 };

/** The entropy the loop plays at: the players' leaned, inside 0 to 1. */
export const leanedEntropy = (entropy: number, lean: number): number =>
  Math.min(1, Math.max(0, entropy + lean));

/** The controller after a reading of the share at the players' entropy: a step its way, where the reading before agreed (`PATIENCE`) and the lean has room. */
export function regulated(
  state: Homeostat,
  share: number | null,
  entropy: number,
  step: number = LEAN_STEP,
  patience: number = PATIENCE,
): Homeostat {
  const heard = wayOf(share, entropy);
  const way = patience > 1 && heard !== state.heard ? 0 : heard;
  const lean = Math.min(1 - entropy, Math.max(-entropy, state.lean + way * step));
  if (way === 0 || lean === state.lean) return { ...state, heard };
  return {
    lean,
    moved: way,
    reversals: state.reversals + (state.moved !== 0 && state.moved !== way ? 1 : 0),
    heard,
  };
}
