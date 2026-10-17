/**
 * The composer's meter, asked of a repository at a section's start (#375;
 * yggi/cells decisions 041 and 043: the composer selects, and generation is
 * the miss).
 *
 * A repository holds meter fragments, each cells text read into what the
 * band plays: a named meter and its swing (`MeterFragment`). The composer
 * asks it with the style's point on the four axes the meters are placed on,
 * `sync`, `harm`, `artic` and `energy` (`stylePoint`): the tempo and the
 * entropy stay out (cells decision 037's D6). The repository ranks its
 * fragments as cells' `query` does; the composer takes the nearest, with two
 * rules of its own (`composedMeter`):
 *
 * - **a miss**: where no fragment lies within `MISS_DISTANCE`, it finds
 *   nothing, and the band keeps the meter it plays (filing a generated meter
 *   is a later rung);
 * - **the meter playing holds**: a fragment other than the one playing is
 *   taken only where it is nearer by more than `METER_HOLD`, so a style
 *   walking along the border between two fragments (the radio's) doesn't
 *   change the meter at every section.
 *
 * This module is pure and knows no cells: the repository is given, built
 * from cells' fragments by `repository.ts` (`@jambot/engine/repository`),
 * which only a host that bundles cells' TypeScript imports, so node runs the
 * engine and the lobby without it.
 */

import type { Meter } from '@jambot/theory';
import type { Style } from './style.ts';
import type { MeterSwing } from './swing.ts';

/** A meter fragment as the band plays it: its id in the repository, its meter and its swing. */
export interface MeterFragment {
  readonly id: string;
  readonly meter: Meter;
  readonly swing: MeterSwing;
}

/** A point in style space, axis names to numbers, as cells' repository takes one. */
export type StylePoint = Readonly<Record<string, number>>;

/** A repository of meters the composer asks (#375): what it holds, and how it ranks them. */
export interface MeterRepository {
  /** The fragments the band can play, by id. */
  readonly fragments: ReadonlyMap<string, MeterFragment>;
  /** Every fragment the band can play, with its distance from a point, nearest first. */
  query(point: StylePoint): readonly { readonly id: string; readonly distance: number }[];
  /** The composer's margins, where they are other than `MISS_DISTANCE` and `METER_HOLD`: an experiment tries others (E34). */
  readonly margins?: { readonly miss: number; readonly hold: number };
}

/** The axes the composer asks on: the style's but its tempo and its entropy (cells decision 037's D6). */
export const QUERY_AXES = ['sync', 'harm', 'artic', 'energy'] as const;

/** What the composer reads of a style: the axes it asks on. */
export type QueriedStyle = Pick<Style, (typeof QUERY_AXES)[number]>;

/** The style's point on the axes the composer asks on. */
export const stylePoint = (style: QueriedStyle): StylePoint =>
  Object.fromEntries(QUERY_AXES.map((axis) => [axis, style[axis]]));

/**
 * The farthest a fragment may lie from the style for the composer to take
 * it: past it, a miss. Distances are cells' (decision 041): the root of the
 * mean squared difference over the shared axes, each of range 1, so the
 * farthest two points can be is 1. At 0.3, 10 % of the axes' space misses,
 * toward its corners (no point lies farther than 0.47 from a fragment), and
 * the radio at entropy 0.3 misses in 0.75 % of its sections (E34).
 */
export const MISS_DISTANCE = 0.3;

/**
 * How much nearer another fragment must be than the one playing to take its
 * place. At entropy 0.3 the radio moves the style's point 0.014 a section
 * on average and 0.021 at the 99th percentile (E34), so a margin of 0.02
 * keeps a walk along a border from going back at the next section: E34
 * counts none in 120 hours, where no margin goes back 264 times.
 */
export const METER_HOLD = 0.02;

/**
 * The meter fragment the composer plays at a style, given the one playing
 * (null where the meter playing came from nowhere in the repository): the
 * nearest, unless it misses or the one playing is within `METER_HOLD` of
 * it; null on a miss, where the band keeps its meter.
 */
export function composedMeter(
  repository: MeterRepository,
  style: QueriedStyle,
  playing: string | null,
): MeterFragment | null {
  const { miss, hold } = repository.margins ?? { miss: MISS_DISTANCE, hold: METER_HOLD };
  const found = repository.query(stylePoint(style));
  const nearest = found[0];
  if (!nearest || nearest.distance > miss) return null;
  const held = playing === null ? undefined : found.find((f) => f.id === playing);
  const id =
    held && held.distance <= miss && held.distance - nearest.distance <= hold
      ? held.id
      : nearest.id;
  return repository.fragments.get(id)!;
}
