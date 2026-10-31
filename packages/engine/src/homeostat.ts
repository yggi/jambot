/**
 * The homeostat's controller (#237, step 6; yggi/cells decision 043; the
 * owner's limits of 2026-10-22): the share of bars recognised over the last
 * sixteen (`recognised.ts`, `SHARE_BARS`) leans the loop's entropy, so a band that bores
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
 * Past entropy 1 the lean reaches on, by up to 1 more, into how restless the
 * held parts are (`restlessOf`, the owner's ruling on #536, 2026-10-31): the
 * excess is the chance that a part varies an even bar as it varies its odd
 * ones (`heldDraw`), so at the top every bar varies. E45 found the band still
 * bored at entropy 1, its share 0.66 against the band's 0.4 to 0.7; varying
 * every bar brings it to 0.59. Below entropy 1 it changes nothing.
 *
 * Integral, with the band as its dead zone: a reading out of the band, as
 * many in a row as `PATIENCE` asks, moves the lean
 * `LEAN_STEP` its way, and a reading inside holds it, so the band left
 * inside keeps the lean that brought it there. The lean never
 * takes the loop's entropy under 0, nor past 1 and full restlessness, and a
 * move it can't make isn't one.
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
 * How many readings in a row, the latest among them, a move waits for out of
 * the band on one side (`Homeostat.run` counts them): 1, since a reading over
 * `SHARE_BARS`, sixteen bars, already spans two sections (#536). Over eight
 * bars it was 2, so one section's noise (it spread by about 0.13, E45) didn't
 * move it, and with 1 the controller reversed up to 1.75 times per four
 * sections; over sixteen, with 1, at most 0.375, and 81 % of sections are
 * inside against 74 % to 78 % with 2 (E45, on the page's schedule, 2 seeds of
 * 256 bars held and 512 walked).
 */
export const PATIENCE = 1;

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

/** The controller's state: its lean, the way it moved last, how often it reversed, and the readings it has heard in a row. */
export interface Homeostat {
  /** What it adds to the players' entropy. */
  readonly lean: number;
  /** The way of its last move, 0 before its first. */
  readonly moved: -1 | 0 | 1;
  /** Its moves against the move before. */
  readonly reversals: number;
  /** The way of the latest reading. */
  readonly heard: -1 | 0 | 1;
  /** How many readings in a row, the latest among them, were out the way it heard, which a move waits for (`PATIENCE`); 0 inside. */
  readonly run: number;
}

/** Nothing leaned yet: a song's start. */
export const NO_LEAN: Homeostat = { lean: 0, moved: 0, reversals: 0, heard: 0, run: 0 };

/** The entropy the loop plays at: the players' leaned, inside 0 to 1. */
export const leanedEntropy = (entropy: number, lean: number): number =>
  Math.min(1, Math.max(0, entropy + lean));

/** How far past entropy 1 the lean reaches, into restlessness (`restlessOf`): 1, so at the top every held bar varies. */
export const RESTLESS_REACH = 1;

/** How restless the held parts play (`heldDraw`): the players' entropy leaned past 1, inside 0 to 1; 0 at entropy 1 and under. */
export const restlessOf = (entropy: number, lean: number): number =>
  Math.min(RESTLESS_REACH, Math.max(0, entropy + lean - 1));

/** The controller after a reading of the share at the players' entropy: a step its way, where `patience` readings in a row agree (`PATIENCE`) and the lean has room. */
export function regulated(
  state: Homeostat,
  share: number | null,
  entropy: number,
  step: number = LEAN_STEP,
  patience: number = PATIENCE,
): Homeostat {
  const heard = wayOf(share, entropy);
  const run = heard === 0 ? 0 : heard === state.heard ? state.run + 1 : 1;
  const way = run >= patience ? heard : 0;
  const lean = Math.min(1 + RESTLESS_REACH - entropy, Math.max(-entropy, state.lean + way * step));
  if (way === 0 || lean === state.lean) return { ...state, heard, run };
  return {
    lean,
    moved: way,
    reversals: state.reversals + (state.moved !== 0 && state.moved !== way ? 1 : 0),
    heard,
    run,
  };
}

/**
 * A lean from a bar on (`LeanChange`): what the loop adds to the players'
 * entropy at that bar and after, until the next change. A page keeps its
 * leans as a song's changes, as it keeps its meters, so a forecast reads
 * each bar's lean as the bar will be composed.
 */
export interface LeanChange {
  readonly bar: number;
  readonly lean: number;
}

/** The lean at a bar: the latest change at or before it; none before the first. */
export function leanAt(leans: readonly LeanChange[], bar: number): number {
  let lean = 0;
  for (const change of leans) if (change.bar <= bar) lean = change.lean;
  return lean;
}

/** The leans with `lean` from `bar` on: the changes from it on dropped, and none added where it leans as before; the same leans where nothing changes. */
export function withLean(
  leans: readonly LeanChange[],
  bar: number,
  lean: number,
): readonly LeanChange[] {
  const before = leans.filter((c) => c.bar < bar);
  if (leanAt(before, bar) !== lean) return [...before, { bar, lean }];
  return before.length === leans.length ? leans : before;
}

/**
 * How many sections after the one it reads a lean plays from, on a page: 2.
 * A page reads a section's share at its last bar, off the clock, and a
 * section's text is forecast at the middle bar of the section before
 * (`shadow.ts` in the app), so the section after the one read is forecast
 * before the reading is made, and the one after that a section and a half
 * later, which is the time the reading has to arrive.
 */
export const LEAN_AHEAD = 2;
