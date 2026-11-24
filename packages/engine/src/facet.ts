/**
 * One loop, keyed by facet (#423; yggi/cells decisions 043, 046, 047, 048,
 * 052): the composer's loop over a repository of fragments, the same for
 * every band member that enters it, the drums (facet `rhythm`, #397, #401,
 * #411) and the bass (facet `bass`, #423). For a member, a repository of its
 * fragments, each read under a meter into what the member plays from (a
 * drum bar's hits, a bass line's notes over the chord in force), and these
 * steps, each in this module once:
 *
 * - **the query** (`offeredFigure`): at the style's point, on the section's
 *   bench (its meter, and the meter fragment it came from), the fragments the
 *   member admits within the repository's miss distance, one drawn among
 *   those as near as the nearest (`OFFER`, #540), the one playing held
 *   unless another is nearer by more than the hold; none on a miss, where the
 *   member's machine is the generator, as the drummer invents;
 * - **the ladder** (`climbedFigure`, `novelty.ts`): the composer tires of
 *   what it plays, varies it once by one of cells' operators on its text,
 *   files the variation and plays it, and past that rejects its family;
 * - **the Muse's filing** (`filedHeard`): each source's recurring bar of a
 *   section heard, the member's own on a miss and each player's, stated as
 *   cells text and filed at the point the section was asked at, with who and
 *   when;
 * - **the learned layer** (`figureLearned`): what the composer keeps is a use
 *   at the section's point, together with the section's meter fragment.
 *
 * What differs by member is only what its repository reads and states (its
 * read, its filing's content, its variation's), what it admits as a
 * section's fragment, and which stream its variations draw from. A drum bar
 * also carries a line of its own beside it, a clave, which is the drums'
 * alone (`rhythm-query.ts`).
 *
 * This module is pure and knows no cells: each repository is given, built
 * from cells' fragments (`rhythms.ts`, `bass-lines.ts`).
 */

import type { Meter } from '@jambot/theory';
import type { Fragment, QueryOptions } from '@yggi/cells/repository';
import { SECTION_BARS } from './form.ts';
import type { LearnedLayer } from './layer.ts';
import { METER_HOLD, MISS_DISTANCE, type StylePoint } from './meter-query.ts';
import { type Boredom, type Lineage, familyOf, lineageOf, wantsVariation } from './novelty.ts';
import { type Stream, draw, nameKey } from './random.ts';

/** What a fragment must fit: the section's meter, and the meter fragment it came from, where it came from one. */
export interface Bench {
  readonly meter: Meter;
  readonly meterFragment?: string | undefined;
}

/** A fragment found, and its distance from the point asked at. */
export interface Found {
  readonly id: string;
  readonly distance: number;
  /** What cells ranks it by, where the repository says: the distance less the pull of its use with those chosen (decision 046). */
  readonly score?: number;
}

/** Who filed a fragment, where and when: what every filing carries beside what the member played. */
export interface FilingMeta {
  /** The section's meter, and the meter fragment it came from, where it came from one: filing counts the fragment as used together with that one. */
  readonly bench: Bench;
  /** The point the section it was played in was asked at. */
  readonly point: StylePoint;
  /** Who played it: the member (`drummer`, `bass`), the composer, or the player as the Muse knows them. */
  readonly source: string;
  /** When, on the song's clock (the engine has no other): `song 3, bar 40`. */
  readonly created: string;
  readonly tags: readonly string[];
  /** The fragment it varies, by id, where the composer made it from one (#411, `novelty.ts`). */
  readonly varies?: string | undefined;
  /** How it varies that one, as cells' vary names it (`drop &hat 6`, `transpose &bassline 1`; decision 052, point 6). */
  readonly by?: string | undefined;
}

/** A filing: what the member played (`C`: a drum bar's hits, a bass line's notes), and who filed it, where and when. */
export type Filing<C> = C & FilingMeta;

/** A variation of a fragment: what it plays, and how it varies the fragment, for the filing's `by`. */
export type Varied<C> = C & { readonly by: string };

/** The composer's margins for a member: how far a fragment may lie, and how much nearer another must be to take the place of the one playing. */
export interface Margins {
  readonly miss: number;
  readonly hold: number;
}

/**
 * How much farther than the nearest a fit may lie and still be on offer: a
 * quarter (#540, first the harmony's alone). Past cells' `USE_CAP` (1.2), so
 * use alone, which shortens a fragment's distances by a sixth at most, never
 * takes a seed's equal off the offer: the composer's draw among equals is the
 * same as long as the style holds. One constant serves every member.
 */
export const OFFER = 1.25;

/**
 * And how far past that, at least (#540): a tenth, the step cells places a
 * style's alternates beside it at (a second motif 0.1 higher in bite, Pop's
 * four chords 0.1 lower in mood). Without it a style's own point, where the
 * nearest lies at 0, offers only exact ties, and every seed opens on the same
 * fragment; with it, those placed beside the style are on offer there too.
 */
export const OFFER_FLOOR = 0.1;

/** How a found fragment ranks: what cells ranks it by, its distance less the pull of its use, or its distance. */
const rankOf = (f: Found): number => f.score ?? f.distance;

/** The edge of the offer for fragments found, ranked: as near as the nearest within `OFFER`, or `OFFER_FLOOR` past it. */
const edgeOf = (found: readonly Found[]): number =>
  (found[0] === undefined ? 0 : rankOf(found[0])) * OFFER + OFFER_FLOOR;

/** Those of fragments found, ranked, that are on offer: within the offer's edge. */
export const onOffer = <F extends Found>(found: readonly F[]): F[] => {
  const edge = edgeOf(found);
  return found.filter((f) => rankOf(f) <= edge);
};

/**
 * One of the fragments on offer, taken by a draw in [0, 1), each as likely as it lies inside the offer's edge (the
 * edge less its rank): the nearest most often, a neighbour beside the style sometimes, one at the edge hardly ever
 * (#540). So what was placed for the style, or filed where it is, keeps its place, and the others vary it. Where some
 * on offer are `preferred` (what a player gave the band, `givenBy`), the draw is among those alone.
 */
export function drawnOnOffer<F extends Found>(
  found: readonly F[],
  pick: number,
  preferred: (id: string) => boolean = () => false,
): F | undefined {
  const edge = edgeOf(found);
  const onIt = onOffer(found);
  const given = onIt.filter((f) => preferred(f.id));
  const offer = given.length ? given : onIt;
  const weights = offer.map((f) => edge - rankOf(f));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (!(total > 0)) return offer[Math.floor(pick * offer.length)];
  let left = pick * total;
  for (const [i, w] of weights.entries()) if ((left -= w) < 0) return offer[i];
  return offer.at(-1);
}

/**
 * Who files that is the band itself, not a player: the composer's variations, and each member's own on a miss (the
 * drummer's, the bassist's, the soloist's). Named here, not imported, as the members' modules read this one; a test
 * holds it to their constants.
 */
export const BAND_SOURCES: ReadonlySet<string> = new Set([
  'composer',
  'drummer',
  'bassist',
  'soloist',
]);

/**
 * Whether a fragment is one a player gave the band: filed in the layer by the Muse under a player's name (#401, #424).
 * Within the offer it is taken first, as the band takes its players' motifs.
 */
export const givenBy = (layer: LearnedLayer | undefined, id: string): boolean =>
  layer?.filed.some((f) => {
    const source = f.meta['source'];
    return f.fragment.id === id && typeof source === 'string' && !BAND_SOURCES.has(source);
  }) ?? false;

/** The margins where a repository names none: the meter's, so a point misses for every member by one rule (E36). */
export const FIGURE_MARGINS: Margins = { miss: MISS_DISTANCE, hold: METER_HOLD };

/**
 * What the composer may take, as it asks a repository: cells' query applies it (`QueryOptions`, yggi/cells#869), and every
 * margin is the composer's own number, none read from cells.
 * - `reach`: the farthest a fragment may lie from the point, a miss past it;
 * - `exclude`: those the composer has tired of (`novelty.ts`), the next nearest found in their place;
 * - `accept`: what only the member can judge, tried in rank order (its read under the section's meter);
 * - `within`: how near the best a fragment must score to be on offer, a number ≥ 1 (a ratio alone; `onOffer` adds `OFFER_FLOOR`);
 * - `playing`: the fragment playing, returned first where it lies within `hold` of the nearest, and up to `slack` past `reach`;
 * - `k`: how many to return, every one that passes where none.
 */
export interface Ask {
  readonly reach: number;
  readonly exclude?: readonly string[] | undefined;
  readonly accept?: ((id: string) => boolean) | undefined;
  readonly within?: number | undefined;
  readonly playing?: QueryOptions['playing'] | undefined;
  readonly k?: number | undefined;
}

/**
 * An ask as cells' query options, the repository's own judgment of a fragment (`own`: its fit on the bench, whether the
 * member can read it) tried before the composer's.
 */
export const askOptions = (
  ask: Ask,
  own: (fragment: Fragment) => boolean = () => true,
): Pick<QueryOptions, 'reach' | 'exclude' | 'accept' | 'within' | 'playing'> => ({
  reach: ask.reach,
  ...(ask.exclude?.length ? { exclude: ask.exclude } : {}),
  accept: (fragment) => own(fragment) && (ask.accept?.(fragment.id) ?? true),
  ...(ask.within === undefined ? {} : { within: ask.within }),
  ...(ask.playing ? { playing: ask.playing } : {}),
});

/**
 * A repository of one member's fragments, as the composer asks it. `R` is a
 * fragment read under a meter (its lap of `bars`), `C` what a filing and a
 * variation carry of what the member plays.
 */
export interface FacetRepository<R extends { readonly bars: number }, C> {
  /**
   * Every fragment that fits the bench, with its distance from the point, in the order cells' query ranks them, with what
   * was learned merged where a layer is given; a fragment used often with those `chosen` (the composer's short-term memory
   * and the section's meter, `short-term.ts`) ranks nearer, as cells' query weighs use together (decision 046). Where an
   * `ask` is given, only what the composer may take (`Ask`), cells' query testing a fit only for one that could be taken.
   * Use together pulls as strongly as `pull` (cells' query option; its default where none, #389).
   */
  query(
    point: StylePoint,
    bench: Bench,
    layer?: LearnedLayer,
    chosen?: readonly string[],
    ask?: Ask,
    pull?: number,
  ): readonly Found[];
  /** The layer after the composer kept these fragments together at `point`: a use of each there, and of them together (cells' `useFragments`), and each counted as used together with those `alongside` (the section's meter), which it doesn't move; within its cap. None where the repository learns nothing. */
  used?(
    layer: LearnedLayer,
    ids: readonly string[],
    point: StylePoint,
    alongside?: readonly string[],
  ): LearnedLayer;
  /**
   * The layer with what a member played filed (#401; cells' `fileFragment`, decision 048): stated as cells text, an
   * association of the member's facet at its point with the filing's weight, its source, created and tags; or, where
   * its text is a fragment's held already, a use of that one there (identity). Either way counted as used together
   * with the bench's meter fragment; within the cap. What is stated so reads back as what it was stated from (the round
   * trip), so the repository keeps it as known and compiles nothing for it while the band plays. None where the
   * repository files nothing.
   */
  file?(
    layer: LearnedLayer,
    filing: Filing<C>,
  ): { readonly layer: LearnedLayer; readonly id: string; readonly held: boolean };
  /** A fragment read under a meter, played straight, or null where it can't be read there; a filed one's from the layer given. */
  read(id: string, meter: Meter, layer?: LearnedLayer): R | null;
  /**
   * One variation of a fragment on the bench, by one of cells' operators on one of its lines (decision 052), the one a
   * draw in [0, 1) takes of all of them, read back; a filed one's from the layer given. Null where it has none, or
   * can't be read there. None where the repository varies nothing.
   */
  vary?(id: string, bench: Bench, draw: number, layer?: LearnedLayer): Varied<C> | null;
  /**
   * Work the repository can do ahead, so that asking on these benches costs only lookups: for its own fragments and
   * those the layer given filed (#412), each step a compile at most, so a host runs it a step at a time between other
   * work, and what it warmed once takes no step again. None where it keeps nothing.
   */
  warm?(benches: readonly Bench[], layer?: LearnedLayer): Iterable<void>;
  /** The composer's margins, where they are other than `FIGURE_MARGINS`: an experiment tries others. */
  readonly margins?: Margins;
}

/** A repository's margins: its own, or `FIGURE_MARGINS`. */
export const marginsOf = (repository: { readonly margins?: Margins | undefined }): Margins =>
  repository.margins ?? FIGURE_MARGINS;

/**
 * The fragment a member plays a section from: of those that fit the bench
 * within the miss distance and that the composer hasn't `rejected`, those
 * the member `admits` (given its read under the section's meter) on offer
 * (`onOffer`), one drawn by the `pick`, a draw in [0, 1), the nearer the likelier, and one a player gave first (`drawnOnOffer`)
 * (#540: every member draws as the harmony does); the one `playing` held as
 * the meter is, where cells returns it first; none on a miss. Without a
 * `pick`, the nearest. It asks with those `chosen` (its short-term memory and
 * the section's meter), which pull the fragments used with them, as strongly
 * as `pull` (#389). Cells' query applies the margins (`Ask`).
 */
export function offeredFigure<R extends { readonly bars: number }, C>(
  repository: FacetRepository<R, C>,
  point: StylePoint,
  bench: Bench,
  playing: string | undefined,
  admits: (read: R | null, id: string) => boolean,
  layer?: LearnedLayer,
  chosen: readonly string[] = [],
  rejected: readonly string[] = [],
  pull?: number,
  pick?: number,
): string | undefined {
  const { miss, hold } = marginsOf(repository);
  const ask: Ask = {
    reach: miss,
    exclude: rejected,
    accept: (id) => admits(repository.read(id, bench.meter, layer), id),
    playing: playing === undefined ? undefined : { id: playing, hold },
    ...(pick === undefined ? { k: 1 } : {}),
  };
  const found = repository.query(point, bench, layer, chosen, ask, pull);
  // (the one playing is held while it is on offer, as near as the nearest: a neighbour drawn plays on until the ladder
  // tires of it or the style leaves it behind; otherwise a draw among those on offer)
  if (pick === undefined) return found[0]?.id;
  if (playing !== undefined && onOffer(found).some((f) => f.id === playing)) return playing;
  return drawnOnOffer(found, pick, (id) => givenBy(layer, id))?.id;
}

/** Where, when and by whom a section's filings are made: its seed and index, the point it is asked at, and the tags. */
export interface FilingAt {
  readonly seed: number;
  readonly index: number;
  readonly point: StylePoint;
  readonly tags: readonly string[];
}

/** Who makes a variation (#411): the composer, as what the Muse heard names who played it. */
export const COMPOSER = 'composer';

/** A fragment's place among the layer's filed fragments of a facet (those associated as it), or -1 for one it didn't file. */
export const placeIn = (layer: LearnedLayer, facet: string, id: string): number =>
  layer.filed
    .filter((f) => f.fragment.association.some((p) => p.facet === facet))
    .findIndex((f) => f.fragment.id === id);

/**
 * The novelty ladder where a member's fragment is found (#411, #414,
 * `novelty.ts`): the lineage its family belongs to (`familyOf`), a seed's or
 * one the layer filed; where the composer is bored enough to vary it, one
 * variation of it (`FacetRepository.vary`, cells' operators), drawn from the
 * member's `stream` by the fragment's place among the layer's filed
 * fragments of the member's `facet` (a seed's by its id, `nameKey`), so a forecast
 * varies it as the band will and another member's filings don't move the
 * draw; filed in the layer at the section's point, on its bench, by the
 * composer, created at the section's first bar, naming the fragment it
 * varies and how (`by`), and played in its place. The fragment and the
 * layer as they were, and no lineage, where the section found none, or a
 * seed's where the repository files nothing. A fragment whose lap is more
 * than a bar isn't varied: it repeats until it is rejected.
 */
export function climbedFigure<R extends { readonly bars: number }, C>(
  repository: FacetRepository<R, C> | undefined,
  facet: string,
  stream: Stream,
  at: FilingAt,
  layer: LearnedLayer,
  boredom: Boredom,
  id: string | undefined,
  bench: Bench,
): {
  readonly id: string | undefined;
  readonly layer: LearnedLayer;
  readonly playing: Lineage | null;
} {
  if (!repository || id === undefined) return { id, layer, playing: null };
  const filedHere = layer.filed.some((f) => f.fragment.id === id);
  if (!filedHere && !repository.file) return { id, layer, playing: null };
  const lineage = lineageOf(boredom, familyOf(layer, id));
  const read =
    wantsVariation(lineage) && repository.file && repository.vary
      ? repository.read(id, bench.meter, layer)
      : null;
  if (!read || read.bars !== 1) return { id, layer, playing: lineage };
  const position = filedHere ? placeIn(layer, facet, id) : -1;
  const drawKey = position === -1 ? nameKey(id) : position;
  const variation = repository.vary!(id, bench, draw(at.seed, stream, drawKey), layer);
  if (!variation) return { id, layer, playing: lineage };
  const { by, ...content } = variation;
  const filed = repository.file!(layer, {
    ...(content as unknown as C),
    bench,
    point: at.point,
    source: COMPOSER,
    created: `song ${at.seed}, bar ${at.index * SECTION_BARS}`,
    tags: at.tags,
    varies: id,
    by,
  });
  const grooves = lineage.grooves.includes(filed.id)
    ? lineage.grooves
    : [...lineage.grooves, filed.id];
  return { id: filed.id, layer: filed.layer, playing: { ...lineage, grooves } };
}

/** What a source played over a section, as the Muse heard it: each bar's, as the member's ear reads it. */
export interface HeardBars<B> {
  /** Who played it: the member, for the band's own on a miss, or the player as the Muse knows them. */
  readonly source: string;
  readonly bars: readonly B[];
}

/**
 * What the Muse files at a section's end (#401): each source's recurring bar
 * heard over the section before, distilled (`distil`, the member's: none
 * where no bar recurs enough) and filed in the layer at the point that
 * section was asked at, in its meter, created at its first bar on the song's
 * clock, tagged, and used together with its meter fragment. The layer as it
 * was, and nothing filed, where the repository files nothing or no source
 * played enough.
 */
export function filedHeard<R extends { readonly bars: number }, C, B>(
  repository: FacetRepository<R, C> | undefined,
  heard: readonly HeardBars<B>[],
  distil: (bars: readonly B[]) => C | null,
  bench: Bench,
  at: FilingAt,
  layer: LearnedLayer,
): { readonly layer: LearnedLayer; readonly ids: readonly string[] } {
  if (!repository?.file) return { layer, ids: [] };
  let filedLayer = layer;
  const ids: string[] = [];
  for (const { source, bars } of heard) {
    const content = distil(bars);
    if (!content) continue;
    const filed = repository.file(filedLayer, {
      ...content,
      bench,
      point: at.point,
      source,
      created: `song ${at.seed}, bar ${at.index * SECTION_BARS}`,
      tags: at.tags,
    });
    filedLayer = filed.layer;
    if (!ids.includes(filed.id)) ids.push(filed.id);
  }
  return { layer: filedLayer, ids };
}

/**
 * The layer with a section's fragments of a member, where it found them,
 * learned as used together at the section's point (#398), and each as used
 * together with the section's meter fragment (#401), which this use doesn't
 * move; as it was where it found none, or the repository learns nothing.
 */
export function figureLearned<R extends { readonly bars: number }, C>(
  repository: FacetRepository<R, C> | undefined,
  layer: LearnedLayer,
  ids: readonly (string | undefined)[],
  point: StylePoint,
  meterFragment: string | undefined,
): LearnedLayer {
  const kept = ids.filter((id) => id !== undefined);
  return kept.length && repository?.used
    ? repository.used(layer, kept, point, meterFragment === undefined ? [] : [meterFragment])
    : layer;
}
