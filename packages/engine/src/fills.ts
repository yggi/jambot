/**
 * Cells' fills, as the drummer finds its own (#643): the fragments of the facet
 * `fill` (yggi/cells#718, #904), each style's fill line, a groove's own
 * `&fill` (the eight E31 grooves) or a fill of its own (the abanico, the tom
 * run, the waltz's, the march's roll, the timpani's), found at the style as
 * every member's fragments are, drawn among those on offer (`drawnOnOffer`,
 * #540). A build or a breakdown ends on the fill its kind asks for, cells'
 * `build_run`, which a text takes by its name (decision 090). The drummer
 * plays a found fill's hits on the section's last bar where it fills, and its
 * own snare run only on a miss.
 */

import { METERS, type Meter, type MeterName, stepsOf } from '@jambot/theory';
import { LIBRARY, resolveSeed } from '@yggi/cells/library';
import { answered, createRepository, hitsOf } from '@yggi/cells/repository';
import { drawnOnOffer } from './facet.ts';
import type { SectionType } from './form.ts';
import { facetFragments } from './library.ts';
import { MISS_DISTANCE, type StylePoint } from './meter-query.ts';
import { sameMeter } from './events.ts';

/** The facet cells files the fills under. */
export const FILL_FACET = 'fill';

/** Cells' fills: the library's fragments of the facet `fill`. */
export const FILL_FRAGMENTS = facetFragments(FILL_FACET);

/** The fill a section kind asks for, by name, where it asks for one: a build's lift and a breakdown's return. */
export const KIND_FILLS: Partial<Record<SectionType, string>> = {
  build: 'build_run',
  breakdown: 'build_run',
};

/** A hit of a fill: its step in the bar, the drum it strikes, and how hard, as cells gives it. */
export interface FillHit {
  readonly step: number;
  readonly note: number;
  readonly velocity: number;
}

const texts = new Map(LIBRARY.map((f) => [f.id, f.text]));
const reads = new Map<string, readonly FillHit[] | null>();

/**
 * A fragment's fill line alone under a meter played straight, a bar of it: a groove's `&fill`, or a fill fragment's one
 * line, its signature aside (`&fill from (&sd)`), so the lines that name its drums by the kit's aliases stay
 * (`&high=hightimbale from gm_kit`). A fill of its own is a line a piece mixes in (`[&groove, &fill * &fillAt]`), so it
 * is read in a mix of its own, as cells' `hitsOf` reads a drum track through its mix. Null where a hit falls off the
 * bar's steps.
 */
function readFill(template: string, meter: Meter): FillHit[] | null {
  const name = (Object.keys(METERS) as MeterName[]).find((n) => sameMeter(METERS[n], meter));
  if (!name) return null;
  const lines = answered(template)
    .split('\n')
    .filter((line) => !/ from \(/.test(line));
  if (!lines.some((line) => line.startsWith('&groove '))) lines.push('&groove [&fill]');
  const read = hitsOf(lines.join('\n'), `&bar meter("${name}") step=120bpm`, {
    resolve: resolveSeed,
  });
  if (!read) return null;
  const hits = read.hits.filter((h) => h.line === 'fill' && h.step < stepsOf(meter));
  return hits.every((h) => Number.isInteger(h.step))
    ? hits.map(({ step, note, velocity }) => ({ step, note, velocity }))
    : null;
}

/** A fill's hits under a meter, a bar of them; null where it can't be read there or plays nothing. */
export function fillHits(id: string, meter: Meter): readonly FillHit[] | null {
  const key = `${id} ${meter.cycle}:${meter.heights.join(' ')}`;
  if (!reads.has(key)) {
    const text = texts.get(id);
    const read = text === undefined ? null : readFill(text, meter);
    reads.set(key, read?.length ? read : null);
  }
  return reads.get(key)!;
}

const repository = createRepository(FILL_FRAGMENTS);

/**
 * The fill a section ends on where it fills (#643): the one its kind asks for; else one cells finds at the style that
 * reads under the meter and that the band's kit can play (`playable`, each of its notes: cells' drums performer takes
 * thirteen of the kit's voices, so the abanico's timbales wait for a kit by style, yggi/cells#881), drawn among those on offer by `pick`, a draw in
 * [0, 1), the nearer the likelier; none on a miss, where the drummer plays its own.
 */
export function sectionFill(
  point: StylePoint,
  type: SectionType,
  meter: Meter,
  pick: number,
  playable: (note: number) => boolean = () => true,
): string | undefined {
  const plays = (id: string) => fillHits(id, meter)?.every((h) => playable(h.note)) ?? false;
  const kind = KIND_FILLS[type];
  if (kind !== undefined) return plays(kind) ? kind : undefined;
  const found = repository
    .query(point, FILL_FRAGMENTS.length, {}, { facet: FILL_FACET, reach: MISS_DISTANCE })
    .filter((f) => plays(f.fragment.id))
    .map((f) => ({ id: f.fragment.id, distance: f.distance }));
  return drawnOnOffer(found, pick)?.id;
}
