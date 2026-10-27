/**
 * The composer's harmony, asked of a repository at a section's start (#425;
 * the loop of `facet.ts` for the facet `harmony`; yggi/cells decisions 043,
 * 046, 047 and 052).
 *
 * A repository holds progressions, each cells text of eight bars of triads
 * over the key (`over=&key`): cells' five seeds are the vamps a theme plays
 * at low harmony (`themes.ts`'s `VAMPS`), and the Muse files the
 * progressions players play (`muse-harmony.ts`). The band reads one into
 * its chord slots (`HarmonySlot`: where it starts, 16 steps a bar from the
 * section's start, a chord on step 0 or the bar's half, 8, as a theme's;
 * and its degree of the key), and plays it as a theme (`themeOf`): a vamp
 * laid as `buildTheme` lays one at the section's harmony, a progression as
 * it was filed. A progression is degrees, so it plays in whatever key the
 * section is in: it transposes with the key.
 *
 * The composer asks for a theme where it builds one (`composedHarmony`):
 * the A theme for the grooves and drops, the B for contrast, a fresh one for
 * each build, each at the style's point, on the section's bench. A and B ask
 * with each other chosen, so a pair used together pulls each other (cells'
 * use together), and a build asks with nothing chosen. A vamp fits only
 * under `VAMP_HARM`, where `buildTheme` lays vamps; a progression fits at
 * any harmony. Of the fits within the miss distance, those about as near as
 * the nearest (`OFFER`) are on offer, and the composer draws one as
 * `buildTheme` draws a vamp: in the order the mode's vamps are drawn
 * (`VAMPS`), those it doesn't name after, by the theme's first draw, and a
 * theme other than A moves to the next on offer where it drew A's, and
 * misses where A's is all there is. So where
 * the vamps on offer are the mode's, the composer plays the vamp main's
 * `buildTheme` would. None on a miss, where the mode's tables are the
 * generator (`buildTheme`).
 *
 * This module is pure and knows no cells: the repository is given, built
 * from cells' compiler by `progressions.ts`.
 */

import type { ComposerMode } from './key.ts';
import { type Bench, type FacetRepository, type Filing, marginsOf } from './facet.ts';
import type { LearnedLayer } from './layer.ts';
import { type QueriedStyle, stylePoint } from './meter-query.ts';
import { type Slot, type Theme, type ThemeKind, VAMP_HARM, vampBars, vampIndex } from './themes.ts';

/** The facet a progression is associated as (#425, the owner's ruling of 2026-10-18: bass, lead, harmony). */
export const HARMONY_FACET = 'harmony';

/** The steps of a bar a progression's slots are counted in, as a theme's are: 4/4's, scaled to the meter as they play (`chordsOn`). */
export const SLOT_BAR = 16;

/** A chord of a progression as the band reads it: where it starts, and its degree of the key. */
export interface HarmonySlot {
  /** Its step from the section's start, `SLOT_BAR` a bar: a bar's first on step 0 of it, a second on its half, 8. */
  readonly step: number;
  /** Its degree of the key, 0 to 6: the triad on it. */
  readonly degree: number;
}

/** A progression read: its slots over its lap, and the bars the lap holds (eight, a section's). */
export interface HarmonyRead {
  readonly bars: number;
  readonly notes: readonly HarmonySlot[];
}

/** What a progression filed carries of what the band plays: its slots. */
export interface HarmonyContent {
  readonly notes: readonly HarmonySlot[];
}

/** A progression to file: its slots, the bench it was played on, where and by whom (`muse-harmony.ts`). */
export type HarmonyFiling = Filing<HarmonyContent>;

/** A repository of progressions the composer asks (#425): the loop's repository for the facet `harmony` (`facet.ts`). */
export type HarmonyRepository = FacetRepository<HarmonyRead, HarmonyContent>;

/**
 * How much farther than the nearest a fit may lie and still be on offer: a
 * quarter. Past cells' `USE_CAP` (1.2), so use alone, which shortens a
 * fragment's distances by a sixth at most, never takes a seed's equal off
 * the offer: the composer's draw among equals is the same as long as the
 * style holds.
 */
export const OFFER = 1.25;

/** A progression's slots as a theme's eight bars of slots. */
export function barsOf(notes: readonly HarmonySlot[], bars: number): Slot[][] {
  const out: Slot[][] = Array.from({ length: bars }, () => []);
  for (const { step, degree } of [...notes].sort((a, b) => a.step - b.step))
    out[Math.floor(step / SLOT_BAR)]!.push({ step: step % SLOT_BAR, degree });
  return out;
}

/**
 * The chords of a progression that is a vamp: one chord for its first four
 * bars and one for its last four, each a chord a bar; the one chord where
 * they are the same. Null for one that isn't.
 */
export function vampOf(read: HarmonyRead): readonly number[] | null {
  if (read.bars !== 8) return null;
  const bars = barsOf(read.notes, read.bars);
  if (bars.some((b) => b.length !== 1 || b[0]!.step !== 0)) return null;
  const degree = (b: number) => (bars[b]![0] as { degree: number }).degree;
  const first = degree(0);
  const second = degree(4);
  if ([1, 2, 3].some((b) => degree(b) !== first) || [5, 6, 7].some((b) => degree(b) !== second))
    return null;
  return first === second ? [first] : [first, second];
}

/** Whether a progression read fits a section at a harmony: eight bars, and a vamp only under `VAMP_HARM`. */
export const fitsHarmony = (read: HarmonyRead | null, harm: number): boolean =>
  read !== null && read.bars === 8 && (harm < VAMP_HARM || vampOf(read) === null);

/** What a theme from the repository is built for: its kind and section, the mode and the harmony. */
export interface ThemeAt {
  readonly kind: ThemeKind;
  readonly index: number;
  readonly mode: ComposerMode;
  readonly harm: number;
}

/**
 * A progression read as a theme: a vamp laid as `buildTheme` lays one at
 * the harmony (`vampBars`), its place among the mode's vamps where it is
 * one; a progression its slots as read.
 */
export function themeOf(read: HarmonyRead, { kind, index, mode, harm }: ThemeAt): Theme {
  const vamp = vampOf(read);
  if (vamp) {
    const place = vampIndex(mode, vamp);
    return {
      kind,
      index,
      mode,
      harm,
      vamp: place === -1 ? null : place,
      bars: vampBars(vamp, harm),
    };
  }
  return { kind, index, mode, harm, vamp: null, bars: barsOf(read.notes, read.bars) };
}

/** What the composer asks a theme with, beside the style and the bench. */
export interface HarmonyAsk {
  /** The theme it builds: its kind, section, mode and harmony. */
  readonly at: ThemeAt;
  /** The theme's first draw, in [0, 1): the one `buildTheme` draws a vamp by. */
  readonly draw: number;
  /** The A theme's progression, where it plays one: a theme other than A moves off it. */
  readonly a?: string | undefined;
  /** Those it asks with: for A, B's progression; for B, A's; for a build, none. */
  readonly chosen?: readonly string[];
  /** Those it has tired of (`novelty.ts`), left out. */
  readonly rejected?: readonly string[];
  readonly layer?: LearnedLayer | undefined;
  /** How strongly use together pulls (#389, `pullOf`). */
  readonly pull?: number | undefined;
}

/**
 * The progression the composer takes for a theme at a style, on a bench:
 * of the fits within the miss distance, those on offer (within `OFFER` of
 * the nearest's distance past its score), in the mode's order of vamps then
 * as ranked, drawn by the theme's first draw, the next where a theme other
 * than A drew A's; none on a miss, nor for a theme other than A where A's
 * is all there is on offer.
 */
export function composedHarmony(
  repository: HarmonyRepository,
  style: QueriedStyle,
  bench: Bench,
  { at, draw, a, chosen = [], rejected = [], layer, pull }: HarmonyAsk,
): string | undefined {
  const { miss } = marginsOf(repository);
  const fits = repository
    .query(stylePoint(style), bench, layer, chosen, miss, pull)
    .filter((f) => f.distance <= miss && !rejected.includes(f.id))
    .map((f) => ({ ...f, read: repository.read(f.id, bench.meter, layer) }))
    .filter((f) => fitsHarmony(f.read, at.harm));
  const nearest = fits[0];
  if (!nearest) return undefined;
  const scoreOf = (f: (typeof fits)[number]) => f.score ?? f.distance;
  const edge = scoreOf(nearest) + (OFFER - 1) * nearest.distance + 1e-9;
  const placeOf = (f: (typeof fits)[number]) => {
    const vamp = vampOf(f.read!);
    const place = vamp ? vampIndex(at.mode, vamp) : -1;
    return place === -1 ? Infinity : place;
  };
  const offer = fits
    .filter((f) => scoreOf(f) <= edge)
    .map((f, rank) => ({ id: f.id, place: placeOf(f), rank }))
    .sort((x, y) => x.place - y.place || x.rank - y.rank);
  // (a contrast with nothing on offer but A's own is a miss: the tables write it)
  if (at.kind !== 'A' && offer.length === 1 && offer[0]!.id === a) return undefined;
  let i = Math.floor(draw * offer.length);
  if (at.kind !== 'A' && offer[i]!.id === a) i = (i + 1) % offer.length;
  return offer[i]!.id;
}
