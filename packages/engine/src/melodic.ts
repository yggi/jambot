/**
 * Cells' melodic scales, as the lead finds its own (#644): cells' fragments of
 * the facet `melodic` (yggi/cells#719), each a `&melo` taken on the key, the
 * key's own scale (`plain`), its pentatonics, its blues, found by style as
 * every member's fragments are, drawn among those on offer (`onOffer`, #540)
 * and held while still on offer. A fragment found plays its own notes, read
 * off its scale over the section's key (`fragmentScale`); where none is found,
 * or a player wishes for a scale, the key's table writes it (`melodicHelix`),
 * the generator on a miss as every member's machine is.
 *
 * A fragment is named by its family, the id before its arguments
 * (`pentatonic(phase=3)` is a pentatonic), so the plan, a wish and the
 * licence speak of the scales as `MELODIC_SCALES` does; its notes are its
 * own. Cells' blues is the minor blues over any key, the blue notes over a
 * dominant blues; the key's table plays a major blues over a major key.
 */

import { type Helix, diatonicMode } from '@jambot/theory';
import { createRepository } from '@yggi/cells/repository';
import { drawnOnOffer, onOffer } from './facet.ts';
import {
  type ComposerMode,
  type Key,
  MELODIC_SCALES,
  type MelodicScale,
  keyHelix,
  melodicHelix,
} from './key.ts';
import { facetFragments } from './library.ts';
import { MISS_DISTANCE, type StylePoint } from './meter-query.ts';
import { compileTaken, takenOn } from './taken.ts';

/** The facet cells files the melodic scales under. */
export const MELODIC_FACET = 'melodic';

/** Cells' melodic scales: the library's fragments of the facet `melodic`. */
export const MELODIC_FRAGMENTS = facetFragments(MELODIC_FACET);

/** The name a fragment's scale goes by: its family, the id before its arguments, and the blues for every blues. */
export function melodicNameOf(id: string): MelodicScale | null {
  const family = id.split('(')[0]!;
  const name = family.endsWith('blues') ? 'blues' : family;
  return (MELODIC_SCALES as readonly string[]).includes(name) ? (name as MelodicScale) : null;
}

/** The workbench a fragment is read on: a meter, and a key in the mode on C, with its tonic for a fragment that takes one. */
const benchOf = (mode: ComposerMode) =>
  `&bar meter("4/4") step=120bpm\n&key scale(${mode}, C)\n&tonic C`;

const offsets = new Map<string, readonly number[] | null>();

/**
 * A fragment's scale over a key in a mode, as semitones above the tonic, rising; null where it can't be read there.
 * Its scan's steps are degrees of the key where its lap is the key's seven, semitones where it is twelve.
 */
export function melodicOffsets(id: string, mode: ComposerMode): readonly number[] | null {
  const at = `${id} ${mode}`;
  if (offsets.has(at)) return offsets.get(at)!;
  const fragment = MELODIC_FRAGMENTS.find((f) => f.id === id);
  let read: readonly number[] | null = null;
  if (fragment) {
    const main = fragment.text.includes('from &tonic') ? '&tonic' : '&key';
    const compiled = compileTaken(takenOn(fragment.text, benchOf(mode), { head: '&melo', main }));
    const scan = compiled.cells.get('melo')?.scan;
    const parent = diatonicMode(mode).heights;
    if (scan && !compiled.diagnostics.some((d) => d.severity === 'error')) {
      const places = scan.steps
        .slice(0, -1)
        .reduce<number[]>((at, s) => [...at, at.at(-1)! + s], [0]);
      if (scan.lap === 12) read = places;
      else if (scan.lap === parent.length) read = places.map((p) => parent[p]! - parent[0]!);
    }
  }
  offsets.set(at, read);
  return read;
}

/** A fragment's scale over a key, as a helix on the key's heights, rising from its tonic; the key's own where it can't be read. */
export function fragmentScale(id: string, key: Key): Helix {
  const parent = keyHelix(key);
  const read = melodicOffsets(id, key.mode);
  return read ? { cycle: parent.cycle, heights: read.map((o) => parent.heights[0]! + o) } : parent;
}

/** What a plan says of the lead's scale: the key, the scale's name, and the fragment it was found as, where it was. */
export interface PlannedScale {
  readonly key: Key;
  readonly melodic: MelodicScale;
  readonly melodicFragment?: string | undefined;
}

/**
 * The notes the lead walks over a plan's key: the found fragment's own where it is the scale the plan names, else the
 * key's table's for the scale named (a wish, or a miss).
 */
export const planScale = ({ key, melodic, melodicFragment }: PlannedScale): Helix =>
  melodicFragment !== undefined && melodicNameOf(melodicFragment) === melodic
    ? fragmentScale(melodicFragment, key)
    : melodicHelix(key, melodic);

const repository = createRepository(MELODIC_FRAGMENTS);

/**
 * The melodic fragments on offer at a point, for a key in a mode (`onOffer`), nearest first: those within the miss
 * distance that read over the mode and that the plan can name.
 */
export function offeredMelodic(
  point: StylePoint,
  mode: ComposerMode,
): readonly { readonly id: string; readonly distance: number }[] {
  const found = repository
    .query(point, MELODIC_FRAGMENTS.length, {}, { facet: MELODIC_FACET, reach: MISS_DISTANCE })
    .filter(
      (f) => melodicNameOf(f.fragment.id) !== null && melodicOffsets(f.fragment.id, mode) !== null,
    )
    .map((f) => ({ id: f.fragment.id, distance: f.distance }));
  return onOffer(found);
}

/** The scales cells offers at a point (#644), by name, in `MELODIC_SCALES`' order: those a style's licence reaches as well. */
export const offeredScales = (point: StylePoint): MelodicScale[] => {
  const names = new Set(
    onOffer(
      repository
        .query(point, MELODIC_FRAGMENTS.length, {}, { facet: MELODIC_FACET, reach: MISS_DISTANCE })
        .map((f) => ({ id: f.fragment.id, distance: f.distance })),
    ).map((f) => melodicNameOf(f.id)),
  );
  return MELODIC_SCALES.filter((s) => names.has(s));
};

/**
 * The melodic fragment a section's lead walks where no one wishes for a scale (#644): the one playing, held while it is
 * on offer, else one drawn among those on offer by `pick`, a draw in [0, 1), the nearer the likelier; none on a miss.
 */
export function foundMelodic(
  point: StylePoint,
  mode: ComposerMode,
  pick: number,
  playing?: string,
): string | undefined {
  const offer = offeredMelodic(point, mode);
  if (playing !== undefined && offer.some((f) => f.id === playing)) return playing;
  return drawnOnOffer(offer, pick)?.id;
}
