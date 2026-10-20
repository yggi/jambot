/**
 * The composer's rhythm, asked of a repository at a section's start, after
 * its meter (#397; E36, ruled by the owner on 2026-10-18; yggi/cells
 * decisions 046 and 047).
 *
 * A repository holds rhythm fragments, each cells text the band reads into
 * hits a role a line (`FragmentHit`). The composer asks it at the style's
 * point (`stylePoint`, as the meter is asked), with the section's meter as
 * the workbench (`RhythmBench`): the repository ranks only the fragments
 * that fit that meter (cells' fit). The composer takes the nearest drum bar,
 * with the meter's two rules (`composedRhythm`):
 *
 * - **a miss**: where no drum bar fits, or the nearest that fits lies past
 *   `RHYTHM_MISS`, it takes none, and the drummer invents as it does with no
 *   repository;
 * - **the rhythm playing holds**: another is taken only where it is nearer by
 *   more than `RHYTHM_HOLD`.
 *
 * A fragment that names none of the drummer's roles (`isOwnLine`: the
 * library's claves) is never a section's rhythm by itself: it only layers on
 * a drum bar, so where it lies nearer than any drum bar, the nearest drum bar
 * is the rhythm and the clave layers on it, and where no drum bar lies near,
 * the drummer invents, as on any other miss (#428, the owner's ruling of
 * 2026-10-20): a clave is chosen for the drum bar it layers on (cells
 * decision 046's use together), and alone it leaves the drummer only its own
 * roles to play.
 *
 * Beside the rhythm, a fragment chosen with it (cells decision 046's use
 * together): the nearest that fits with the rhythm on the workbench, renames
 * none of its names, so it layers as a line of its own, and names no role of
 * the drummer's (the library's claves), within `LAYER_DISTANCE`; held as the
 * rhythm is, and the clave playing also held `RHYTHM_HOLD` past that
 * distance, so a style walking along it doesn't drop the clave at one
 * section and take it back at the next (E37: 15 such in 40 hours of the
 * radio's walk without it, none with it).
 *
 * A query is handed what the host has learned, where it was given a layer
 * (#398; cells decision 048), and the fragments the composer keeps are a use
 * of each at the section's point and of the pair together (`used`), and each
 * a use together with the section's meter fragment, which the plans carry on
 * as they carry the meter's. A query also names what the composer has chosen
 * already (`chosen`: its short-term memory and the section's meter,
 * `short-term.ts`), so a fragment used often with those ranks nearer.
 *
 * A miss is where the Muse files (#401): the groove the drummer invented
 * there, and any a player played, distilled and stated as cells text
 * (`muse-groove.ts`), go into the layer (`file`, cells' `fileFragment`), so
 * the next query near the section's point finds it as a rhythm of its own.
 *
 * How the drummer plays from them is `groove.ts`. This module is pure and
 * knows no cells: the repository is given, built from cells' fragments by
 * `rhythms.ts`.
 */

import type { Meter } from '@jambot/theory';
import { DRUM_ROLES, type DrumRole } from './events.ts';
import type { LearnedLayer } from './layer.ts';
import { METER_HOLD, MISS_DISTANCE, type QueriedStyle, stylePoint } from './meter-query.ts';
import type { StylePoint } from './meter-query.ts';

/** A hit of a fragment as the band reads it: its line's name, its General MIDI note, its step in its lap, and its velocity. */
export interface FragmentHit {
  /** The line's name: one of the drummer's roles, or `clave`. */
  readonly role: string;
  readonly note: number;
  /** Its step from the lap's start: a fragment of two bars counts on into the second. */
  readonly step: number;
  readonly velocity: number;
}

/** A fragment read under a meter, played straight: its hits over its lap, and the bars the lap holds. */
export interface FragmentRead {
  readonly bars: number;
  readonly hits: readonly FragmentHit[];
}

/** What a rhythm must fit: the section's meter, and the meter fragment it came from, where it came from one. */
export interface RhythmBench {
  readonly meter: Meter;
  readonly meterFragment?: string | undefined;
}

/** A fragment found, and its distance from the point asked at. */
export interface FoundRhythm {
  readonly id: string;
  readonly distance: number;
}

/** A groove to file (#401): a bar's hits, the bench it was played on, where and by whom (`muse-groove.ts`). */
export interface GrooveFiling {
  readonly hits: readonly FragmentHit[];
  /** The section's meter, and the meter fragment it came from, where it came from one: filing counts the groove as used together with that fragment. */
  readonly bench: RhythmBench;
  /** The point the section it was played in was asked at. */
  readonly point: StylePoint;
  /** Who played it: `drummer`, or the player as the Muse knows them. */
  readonly source: string;
  /** When, on the song's clock (the engine has no other): `song 3, bar 40`. */
  readonly created: string;
  readonly tags: readonly string[];
  /** The groove it varies, by id, where the composer made it from one (#411, `novelty.ts`). */
  readonly varies?: string | undefined;
}

/** A repository of rhythms the composer asks (#397). */
export interface RhythmRepository {
  /**
   * Every fragment that fits the bench, with its distance from the point, nearest first, with what was learned merged
   * where a layer is given; a fragment used often with those `chosen` (the composer's short-term memory and the
   * section's meter, `short-term.ts`) ranks nearer, as cells' query weighs use together (decision 046). A fragment the
   * layer filed is among them only within `reach` of the point, so a fit is tested only for one that could be taken.
   * Use together pulls as strongly as `pull` (cells' query option; its default where none, #389).
   */
  query(
    point: StylePoint,
    bench: RhythmBench,
    layer?: LearnedLayer,
    chosen?: readonly string[],
    reach?: number,
    pull?: number,
  ): readonly FoundRhythm[];
  /** Every other fragment that fits the bench with `chosen` on it and layers there (its union renames none of its names), nearest first, the layer merged as for `query`, so use together with `chosen`, and with `more` chosen beside it, pulls; none farther than `reach`, where it is given, so a fit is tested only for those that can be taken; use together pulling as strongly as `pull`, as for `query`. */
  layered(
    point: StylePoint,
    bench: RhythmBench,
    chosen: string,
    layer?: LearnedLayer,
    reach?: number,
    more?: readonly string[],
    pull?: number,
  ): readonly FoundRhythm[];
  /** The layer after the composer kept these fragments together at `point`: a use of each there, and of the pair (cells' `useFragments`), and each counted as used together with those `alongside` (the section's meter), which it doesn't move; within its cap. None where the repository learns nothing. */
  used?(
    layer: LearnedLayer,
    ids: readonly string[],
    point: StylePoint,
    alongside?: readonly string[],
  ): LearnedLayer;
  /**
   * The layer with a groove filed (#401; cells' `fileFragment`, decision 048): stated as cells text
   * (`grooveText`), an association of the facet `rhythm` at its point with the filing's weight, its source,
   * created and tags; or, where its text is a fragment's held already, a use of that one there (identity).
   * Either way counted as used together with the bench's meter fragment; within the cap. A groove stated so reads
   * back as the hits it was stated from and fits its own bench (the round trip, `muse-groove.test.ts`), so the
   * repository keeps both as known and compiles neither while the band plays. None where the repository files
   * nothing.
   */
  file?(
    layer: LearnedLayer,
    filing: GrooveFiling,
  ): { readonly layer: LearnedLayer; readonly id: string; readonly held: boolean };
  /** A fragment's hits under a meter played straight, or null where it can't be read there; a filed one's from the layer given. */
  read(id: string, meter: Meter, layer?: LearnedLayer): FragmentRead | null;
  /**
   * Work the repository can do ahead, so that asking on these benches costs
   * only lookups: for its own rhythms and the grooves the layer given filed
   * (#412), each step a fit, a union or a read at most, so a host runs it a
   * step at a time between other work, and what it warmed once takes no step
   * again. None where it keeps nothing.
   */
  warm?(benches: readonly RhythmBench[], layer?: LearnedLayer): Iterable<void>;
  /** The composer's margins, where they are other than `RHYTHM_MISS`, `RHYTHM_HOLD` and `LAYER_DISTANCE`: an experiment tries others. */
  readonly margins?: { readonly miss: number; readonly hold: number; readonly layer: number };
}

/** The farthest a rhythm may lie from the style to be taken: the meter's, so a point misses for both by one rule (E36). */
export const RHYTHM_MISS = MISS_DISTANCE;

/** How much nearer another rhythm must be than the one playing to take its place: the meter's (the owner's ruling on E36). */
export const RHYTHM_HOLD = METER_HOLD;

/**
 * The farthest a fragment chosen with the rhythm may lie from the style:
 * E36 found the claves nearest Bossa nova and Funk 0.025 and 0.069 from
 * them, Lo-fi hip hop's 0.168, every other preset's 0.26 or more, so 0.1
 * takes the two a clave was written near and no other.
 */
export const LAYER_DISTANCE = 0.1;

/** The drummer's own roles, which a fragment's lines of those names give a pattern to: all but the clave, which plays as a line of its own. */
export const GROOVE_ROLES: readonly DrumRole[] = DRUM_ROLES.filter((role) => role !== 'clave');

/** Whether a fragment names none of the drummer's roles: a line of its own, as a clave is. */
export const isOwnLine = (read: FragmentRead): boolean =>
  read.hits.every((h) => !(GROOVE_ROLES as readonly string[]).includes(h.role));

/** A section's rhythm: the fragment the drummer plays from, and the one chosen with it, by id; none on a miss. */
export interface SectionRhythm {
  readonly rhythmFragment?: string;
  readonly claveFragment?: string;
}

/**
 * The nearest of `found` within `miss`, unless `playing` is among them no
 * farther than `hold` beyond it; the one playing reaches `edge` past `miss`
 * (0 for the rhythm, as for the meter: a rhythm past the distance gives way).
 */
function heldNearest(
  found: readonly FoundRhythm[],
  playing: string | undefined,
  miss: number,
  hold: number,
  edge = 0,
): string | undefined {
  const nearest = found[0];
  const held = playing === undefined ? undefined : found.find((f) => f.id === playing);
  if (held && held.distance <= miss + edge && held.distance - nearest!.distance <= hold)
    return held.id;
  return nearest && nearest.distance <= miss ? nearest.id : undefined;
}

/**
 * The rhythm the composer takes at a style, on a bench, given the section
 * before's: the nearest drum bar that fits (a fragment that reads as a line
 * of its own, `isOwnLine`, never is one, #428; one that can't be read under
 * the meter isn't told apart), held as the meter is, none on a miss; and
 * the line chosen with it, where one layers within `LAYER_DISTANCE`. Those
 * `chosen` (the composer's short-term memory and the section's meter) pull
 * the fragments used with them, as cells' query weighs use together. Those
 * `rejected` (rhythms it has tired of, and the claves played with them,
 * `novelty.ts`) it leaves out of what the repository returns, so the next
 * nearest is taken, or none. It asks both with `pull`, how strongly use
 * together pulls (#389, `pullOf`).
 */
export function composedRhythm(
  repository: RhythmRepository,
  style: QueriedStyle,
  bench: RhythmBench,
  playing: SectionRhythm | null,
  layer?: LearnedLayer,
  chosen: readonly string[] = [],
  rejected: readonly string[] = [],
  pull?: number,
): SectionRhythm {
  const point = stylePoint(style);
  const {
    miss,
    hold,
    layer: reach,
  } = repository.margins ?? { miss: RHYTHM_MISS, hold: RHYTHM_HOLD, layer: LAYER_DISTANCE };
  // (only a drum bar within the distance can be the rhythm: a line of its own only layers on one, #428)
  const rhythm = heldNearest(
    repository
      .query(point, bench, layer, chosen, miss, pull)
      .filter((f) => f.distance <= miss && !rejected.includes(f.id))
      .filter((f) => {
        const read = repository.read(f.id, bench.meter, layer);
        return read === null || !isOwnLine(read);
      }),
    playing?.rhythmFragment,
    miss,
    hold,
  );
  if (rhythm === undefined) return {};
  // (only a fragment within reach, or the clave playing a margin past it, can be taken: only those are read)
  const lines = repository
    .layered(point, bench, rhythm, layer, reach + hold, chosen, pull)
    .filter((f) => f.distance <= reach + hold && !rejected.includes(f.id))
    .filter((f) => {
      const read = repository.read(f.id, bench.meter, layer);
      return read !== null && isOwnLine(read);
    });
  const clave = heldNearest(lines, playing?.claveFragment, reach, hold, hold);
  return clave === undefined
    ? { rhythmFragment: rhythm }
    : { rhythmFragment: rhythm, claveFragment: clave };
}

/** A section's fragments' hits in one of its bars: each fragment's bar of its lap, the clave's line too; a filed one's read from the layer given. */
export function sectionHits(
  repository: RhythmRepository,
  rhythm: SectionRhythm,
  meter: Meter,
  barInSection: number,
  steps: number,
  layer?: LearnedLayer,
): FragmentHit[] {
  return [rhythm.rhythmFragment, rhythm.claveFragment].flatMap((id) => {
    const read = id === undefined ? null : repository.read(id, meter, layer);
    if (!read) return [];
    const lap = barInSection % read.bars;
    return read.hits
      .filter((h) => Math.floor(h.step / steps) === lap)
      .map((h) => ({ ...h, step: h.step - lap * steps }));
  });
}
