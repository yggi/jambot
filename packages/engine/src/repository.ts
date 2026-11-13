/**
 * Cells' repository of meters, as the composer asks it (#375): cells'
 * `METER_FRAGMENTS` (v0.4.0, yggi/cells#96 and #102; since v0.6.0 read from
 * its seed files, `fragments/meters/*.md`, decision 047), each read by cells'
 * own compiler into what the band plays (`readMeterFragment`), ranked by
 * cells' own `query` (decision 041). Each point names its facet, `meter`
 * (decision 046); the query names none, so it measures every point.
 *
 * A fragment the band can't play yet is left out, and says why: a meter
 * that is none of the band's named meters (`METERS`), a swing on more than
 * one level, or an articulation by level (`legato=`), which the band's
 * dynamics don't read. Every one of cells' thirteen is played, 2/4 (a bar of
 * 8 steps) and the alla breve (two beats of a half) among them (#652).
 *
 * What the host has learned (#398, cells decision 048) is merged at each
 * query where a layer is given, and a meter kept is a use of it at the
 * section's point (`useFragments`, of the facet `meter`), the layer kept
 * within its cap (`cappedLayer`). A fragment a layer filed is ranked only
 * where the band can play it: filing waits for the composer to make a meter
 * on a miss, so none is read yet, and a layer that files one leaves it out;
 * a groove the Muse files (#401) is a rhythm, which a meter query, on its
 * facet `meter`, never ranks. Cells' rhythms sit beside the meters in its
 * seed, unranked, so a meter used together with a rhythm is pulled by it
 * where a query names that rhythm as chosen (`chosen`, `short-term.ts`).
 *
 * The engine's barrel exports it, so a host that imports the engine loads
 * cells at start: node imports cells from `node_modules` through its
 * JavaScript build (cells decision 045).
 */

import { METERS, type Meter } from '@jambot/theory';
import { compileSource } from '@yggi/cells/engine/compile';
import { setTiming } from '@yggi/cells/engine/edit';
import { OLD_AXES, newPoint } from '@yggi/cells/engine/migrate/axes';
import { movedIds } from '@yggi/cells/engine/migrate/moved';
import { MOVED } from '@yggi/cells/engine/renamed';
import {
  type Fragment,
  type LearnedLayer,
  type WeightedPoint,
  byId,
  createRepository,
  layerProblems,
} from '@yggi/cells/repository/fragments';
import { renamedLayer, useFragments } from '@yggi/cells/repository/learned';
import { resolveSeed } from '@yggi/cells/repository/library';
import { METER_FRAGMENTS, BASS_FRAGMENTS, HARMONY_FRAGMENTS, RHYTHM_FRAGMENTS } from './library.ts';
import { sameMeter } from './events.ts';
import { cappedLayer } from './layer.ts';
import { MOTIF_LEADS, leadsAlone } from './lead-lines.ts';
import {
  MISS_DISTANCE,
  type MeterFragment,
  type MeterRepository,
  stylePoint,
} from './meter-query.ts';
import type { Preset } from './style.ts';
import { signedLayer } from './taken.ts';
import { roledLayer } from './muse-groove.ts';
import { type MeterSwing, STRAIGHT, SWING_LEVELS, type SwingLevel } from './swing.ts';

/** The eighths in a pulse of a meter's note value: two of a quarter, one of an eighth. */
const eighthsOf = (unit: number): number => 8 / unit;

/**
 * The tempo a fragment is read at: any, since a fragment is open on its
 * tempo (the host sets it, `setTiming`), and a meter's swing acts only on a
 * meter that has one.
 */
const READ_AT = '120bpm';

/**
 * A fragment read by cells' compiler into the band's terms, with a tempo
 * set as a host sets one: its `&bar`'s meter as a named meter, and its
 * swing; or why the band can't play it.
 */
export function readMeterFragment(fragment: Fragment): MeterFragment | string {
  const compiled = compileSource(setTiming(fragment.text, 'bar', 'step', READ_AT));
  const errors = compiled.diagnostics.filter((d) => d.severity === 'error');
  if (errors.length) return `it doesn't compile: ${errors.map((d) => d.message).join('; ')}`;
  const bar = compiled.cells.get('bar')?.meter;
  if (!bar) return 'it has no meter named &bar';
  if (bar.legato?.length) return 'it articulates by level (legato=), which the band does not read';
  const eighths = eighthsOf(bar.unit);
  const heights = bar.beats.reduce<number[]>(
    (starts, beat, i) => [...starts, i === 0 ? 0 : starts[i - 1]! + bar.beats[i - 1]! * eighths],
    [],
  );
  const read: Meter = { cycle: bar.pulses * eighths, heights };
  const meter = Object.values(METERS).find((named) => sameMeter(named, read));
  if (!meter)
    return `its meter, ${heights.length} beats in ${read.cycle} eighths at ${heights.join(' ')}, is none of the band's`;
  const levels = bar.swing ?? [];
  if (levels.length > 1) return 'it swings on more than one level';
  const [level] = levels;
  if (!level) return { id: fragment.id, meter, swing: STRAIGHT };
  if (!(SWING_LEVELS as readonly string[]).includes(level.level))
    return `it swings on ${level.level}, which the band does not`;
  return {
    id: fragment.id,
    meter,
    swing: { level: level.level as SwingLevel, share: level.share },
  };
}

/** Cells' meter fragments, each read, and why each the band can't play is left out. */
export const METER_READINGS: readonly {
  readonly id: string;
  readonly read: MeterFragment | string;
}[] = METER_FRAGMENTS.map((fragment) => ({ id: fragment.id, read: readMeterFragment(fragment) }));

/** A repository of the fragments the band can play, ranked by cells' query. */
export function meterRepository(fragments: readonly Fragment[] = METER_FRAGMENTS): MeterRepository {
  const played = new Map<string, MeterFragment>();
  for (const fragment of fragments) {
    const read = readMeterFragment(fragment);
    if (typeof read !== 'string') played.set(fragment.id, read);
  }
  // (the meters played with cells' rhythms beside them, which a meter query never ranks, its facet theirs alone:
  // so a meter and the rhythm it was kept with count as used together, #401)
  const cells = createRepository([
    ...fragments.filter((f) => played.has(f.id)),
    ...RHYTHM_FRAGMENTS,
  ]);
  const all = played.size + RHYTHM_FRAGMENTS.length;
  return {
    fragments: played,
    query: (point, layer, chosen = [], pull) =>
      (layer
        ? cells
            .query(
              point,
              all + layer.filed.length,
              {},
              {
                facet: 'meter',
                layer,
                ...(chosen.length ? { chosen } : {}),
                ...(pull === undefined ? {} : { pull }),
              },
            )
            .filter((found) => played.has(found.fragment.id))
        : cells.query(point, played.size, {}, { facet: 'meter' })
      ).map((found) => ({ id: found.fragment.id, distance: found.distance })),
    used: (layer, id, point) =>
      cappedLayer(useFragments(cells, layer, [{ id, point, facet: 'meter' }])),
  };
}

/** Cells' meters, as the composer asks them. */
export const METER_REPOSITORY: MeterRepository = meterRepository();

/**
 * The meter a preset's swing is read off (#459, rung 2 of #420): the one the
 * repository finds nearest the preset's point, as the composer takes it with
 * nothing playing, and its distance from the point asked at; null where it
 * misses. Each of the eight presets finds the 4/4 it once swung by hand, at
 * distance 0. It asks cells' seed alone, never what a host has learned, so a
 * preset swings the same in every session.
 */
export function presetMeter(
  preset: Pick<Preset, 'style'>,
  repository: MeterRepository = METER_REPOSITORY,
): { readonly fragment: MeterFragment; readonly distance: number } | null {
  const nearest = repository.query(stylePoint(preset.style))[0];
  const miss = repository.margins?.miss ?? MISS_DISTANCE;
  if (!nearest || nearest.distance > miss) return null;
  return { fragment: repository.fragments.get(nearest.id)!, distance: nearest.distance };
}

/** A preset's swing: the swing of the meter found at its point (`presetMeter`); null where none is. */
export function presetSwing(
  preset: Pick<Preset, 'style'>,
  repository: MeterRepository = METER_REPOSITORY,
): MeterSwing | null {
  return presetMeter(preset, repository)?.fragment.swing ?? null;
}

export type { Fragment };

/** Cells' seed, its meters, its rhythms, its bass lines (#423), its harmonies (#425), then its motifs as lead lines (#520), each with its text and the points it is found at: what a screen shows of a fragment the band took. */
export const SEED_FRAGMENTS: readonly Fragment[] = [
  ...METER_FRAGMENTS,
  ...RHYTHM_FRAGMENTS,
  ...BASS_FRAGMENTS,
  ...HARMONY_FRAGMENTS,
  ...MOTIF_LEADS,
];

/**
 * What is wrong with a learned layer for cells' meters and rhythms, each
 * problem a sentence; none for one a query takes. Its shape (cells'
 * `layerProblems`), and that it files no seed fragment's id, which a query
 * refuses.
 */
/**
 * A learned layer as a band reads it on load, whenever it was kept:
 * - its seed ids written as the words they are now (cells' `renamedLayer`, yggi/cells#443), for one kept before cells
 *   v0.16.0, so a band keeps the points and pairs it learned, which would otherwise be left out as unheld (#558);
 * - its lead lines without the voice and card they carried before #580 (`leadsAlone`), so a line heard again is
 *   known as the one filed;
 * - its bass lines and progressions with the signature they are stated with since cells v0.21.0 (`signedLayer`,
 *   #562), so a line heard again is known as the one filed;
 * - its points on the style axes since cells v0.23.0, `sync harm bite mood` (`axedLayer`), for one kept before;
 * - its grooves with each line's drum role written as a value since cells v0.24.0 (`roledLayer`), so a groove heard
 *   again is known as the one filed;
 * - the fragments cells v0.25.0 moved by their ids now, Kinderlieder's tunes its parts and two motifs renamed
 *   (`movedLayer`), so a line filed over them compiles and plays as it did.
 */
export const keptLayer = (layer: LearnedLayer): LearnedLayer =>
  movedLayer(roledLayer(axedLayer(signedLayer(leadsAlone(renamedLayer(layer))))));

/**
 * The seed motifs cells v0.25.0 moved (decision 082, yggi/cells#642), each old id and the id it has now: Kinderlieder's
 * six tunes, the parts of its document (`kinderlied/twinkle`, cells' `MOVED`), and `waltz` and `korobeiniki`, renamed
 * with their heads (`waltzBar`, `korobeinikiBar`) since their old ids are examples' keys (one namespace).
 */
export const MOVED_IDS: ReadonlyMap<string, string> = new Map([
  ...[...MOVED].map(([id, { document, head }]): [string, string] => [id, `${document}/${head}`]),
  ['waltz', 'waltzBar'],
  ['korobeiniki', 'korobeinikiBar'],
]);

/** A `from` line that takes a renamed motif by its old head (`&waltz from waltz &key`), and how it takes it now. */
const RENAMED_TAKE = /^(\s*)&(\w+)(?:=(\w+))? from (\w+)(?=[\s(]|$)/;

/**
 * A text filed over a moved motif as it reads now: a take of one of Kinderlieder's tunes as its document's part (cells'
 * Migrate, its rule `moved`: `&twinkle from twinkle &key` → `&twinkle from kinderlied &key`), and one of a motif
 * renamed by its new id, under the name the text reads it by (`&waltz from waltz &key` → `&waltz=waltzBar from waltzBar
 * &key`), so the lines that read it are as written.
 */
export function movedText(text: string): string {
  let moved = text;
  for (const rewrite of movedIds(text, resolveSeed)) moved = rewrite.apply(moved);
  return moved
    .split('\n')
    .map((line) => {
      const take = RENAMED_TAKE.exec(line);
      const now = take && !MOVED.has(take[4]!) ? MOVED_IDS.get(take[4]!) : undefined;
      if (!take || now === undefined || (take[3] ?? take[2]) !== take[4]) return line;
      return `${take[1]}&${take[2]}=${now} from ${now}${line.slice(take[0].length)}`;
    })
    .join('\n');
}

/**
 * A layer kept before cells v0.25.0, with the motifs it moved written as they are now (`MOVED_IDS`, `movedText`): the
 * ids in its points, its pairs and a filed line's `varies` chain, and the texts it filed over them. A layer that names
 * none is the layer itself.
 */
export function movedLayer(layer: LearnedLayer): LearnedLayer {
  const id = (old: string) => MOVED_IDS.get(old) ?? old;
  const named = [
    ...layer.points.map((p) => p.id),
    ...layer.together.flatMap((p) => p.ids),
    ...layer.filed.map((f) => f.meta['varies']),
  ].some((x) => typeof x === 'string' && MOVED_IDS.has(x));
  const texts = layer.filed.map((f) => movedText(f.fragment.text));
  if (!named && texts.every((t, k) => t === layer.filed[k]!.fragment.text)) return layer;
  return {
    ...layer,
    points: layer.points.map((p) => ({ ...p, id: id(p.id) })),
    together: layer.together.map((p) => ({
      ...p,
      ids: [id(p.ids[0]), id(p.ids[1])].sort(byId) as [string, string],
    })),
    filed: layer.filed.map((f, k) => {
      const varies = f.meta['varies'];
      return {
        ...f,
        fragment: { ...f.fragment, text: texts[k]! },
        meta: typeof varies === 'string' ? { ...f.meta, varies: id(varies) } : f.meta,
      };
    }),
  };
}

/** The facets a point speaks to mood for (cells decision 076 §2): a tonal fragment's; a meter's or a rhythm's has none. */
const MOODY = new Set(['bass', 'harmony', 'lead', 'motif', 'mode', 'stab', 'instrument']);

/**
 * A layer's points written on the style axes before cells v0.23.0, `sync harm artic energy`, on the axes now, as cells'
 * Migrate moved its own library's (`newPoint`, its rule `axes`, decision 076): `bite` the articulation, energy dropped,
 * and a tonal facet's `mood` read where the old point sits. A layer kept since is the layer itself.
 */
export function axedLayer(layer: LearnedLayer): LearnedLayer {
  const old = (point: WeightedPoint['point']) =>
    OLD_AXES.every((a) => typeof point[a] === 'number');
  const moved = <P extends WeightedPoint>(p: P): P =>
    old(p.point)
      ? {
          ...p,
          point: newPoint(
            p.point as Record<(typeof OLD_AXES)[number], number>,
            p.facet !== undefined && MOODY.has(p.facet),
          ),
        }
      : p;
  if (
    ![...layer.points, ...layer.filed.flatMap((f) => f.fragment.association)].some((p) =>
      old(p.point),
    )
  )
    return layer;
  return {
    ...layer,
    points: layer.points.map(moved),
    filed: layer.filed.map((file) => ({
      ...file,
      fragment: { ...file.fragment, association: file.fragment.association.map(moved) },
    })),
  };
}

export function repositoryLayerProblems(layer: unknown): string[] {
  if (typeof layer !== 'object' || layer === null || Array.isArray(layer))
    return ['the layer is not a map'];
  const shape = layerProblems(layer as LearnedLayer);
  if (shape.length) return shape;
  const seed = new Set(SEED_FRAGMENTS.map((f) => f.id));
  return (layer as LearnedLayer).filed
    .filter((file) => seed.has(file.fragment.id))
    .map((file) => `the layer files ${file.fragment.id}, a seed fragment's id`);
}
