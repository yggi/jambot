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
import { compileSource } from '@yggi/cells';
import { setTiming } from '@yggi/cells/edit';
import {
  type Fragment,
  type LearnedLayer,
  byId,
  createRepository,
  layerProblems,
  useFragments,
} from '@yggi/cells/repository';
import { METER_FRAGMENTS, BASS_FRAGMENTS, HARMONY_FRAGMENTS, RHYTHM_FRAGMENTS } from './library.ts';
import { isLibraryFragment } from '@yggi/cells/library';
import { sameMeter } from './events.ts';
import { askOptions } from './facet.ts';
import { BENCH_FRAGMENT, cappedLayer } from './layer.ts';
import { MOTIF_LEADS, leadsAlone } from './lead-lines.ts';
import {
  MISS_DISTANCE,
  type MeterFragment,
  type MeterRepository,
  stylePoint,
} from './meter-query.ts';
import type { Preset } from './style.ts';
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
  // (the meters played, and every other fragment of the library known, which a meter query never ranks: so a meter and
  // the rhythm it was kept with count as used together, #401, yggi/cells#861)
  const cells = createRepository(
    fragments.filter((f) => played.has(f.id)),
    { known: isLibraryFragment },
  );
  return {
    fragments: played,
    query: (point, layer, chosen = [], pull, ask) => {
      // (with no layer nothing was used together: the seed alone, by distance)
      const isPlayed = (fragment: Fragment) => played.has(fragment.id);
      const found = cells.query(
        point,
        ask?.k ?? played.size + (layer?.filed.length ?? 0),
        {},
        {
          facet: 'meter',
          ...(layer
            ? {
                layer,
                ...(chosen.length ? { chosen } : {}),
                ...(pull === undefined ? {} : { pull }),
              }
            : {}),
          ...(ask ? askOptions(ask, isPlayed) : {}),
        },
      );
      return (ask ? found : found.filter((f) => isPlayed(f.fragment))).map((f) => ({
        id: f.fragment.id,
        distance: f.distance,
      }));
    },
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
 * The ids of cells' meters before v0.30.0, each with the one it is now (yggi/cells decision 103, the map its changelog
 * gives, #751): the template `meter` is `bar`, each style's feel a fragment of its own, Ambient's lean dropped (its 4/4
 * straight, `bar`), and the odd groupings `odd_meter`.
 */
export const RENAMED_METERS: ReadonlyMap<string, string> = new Map([
  ['meter', 'bar'],
  ['meter(swing=8n:2/3)', 'swing_meter'],
  ['meter(swing=16n:.65)', 'lofi_meter'],
  ['meter(swing=16n:.6)', 'funk_meter'],
  ['meter(swing=16n:31/60)', 'bar'],
  ['meter(grouping=meter("2/2", 2))', 'bar(meter="4/4 in 2")'],
  ['meter(grouping=meter("2/4"))', 'bar(meter="2/4")'],
  ['meter(grouping=meter("3/4"))', 'bar(meter="3/4")'],
  ['meter(grouping=meter("6/8"))', 'bar(meter="6/8")'],
  ['meter(grouping=meter("12/8"))', 'bar(meter="12/8")'],
  ['meter(grouping=meter("5/4"))', 'odd_meter'],
  ['meter(grouping=meter("7/8"))', 'odd_meter(meter="7/8")'],
  ['meter(grouping=meter("10/8"))', 'odd_meter(meter="10/8")'],
]);

const isMap = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * A learned layer kept before cells v0.30.0, its meters named as they are now (`RENAMED_METERS`, #751): each learned
 * point, each pair used together and each groove variation's bench (`BENCH_FRAGMENT`) that names an old id names its
 * new one, each pair in cells' order (`byId`), two pairs that come to name the same two summed, and a pair that comes to
 * name one twice gone. Cells orders a pair by its ids and refuses a layer whose pair is out of order, so without it a
 * layer that kept a meter with a rhythm would be refused whole; and `from meter` finds no fragment, so a meter learned
 * under its old id would answer no query. Anything else, and a layer that names no old id, is given back as it is.
 */
export function meterIdsRenamed<T>(layer: T): T {
  if (!isMap(layer)) return layer;
  const renamed = (id: unknown) => (typeof id === 'string' ? (RENAMED_METERS.get(id) ?? id) : id);
  let changed = false;
  const points = Array.isArray(layer.points)
    ? layer.points.map((p: unknown) => {
        if (!isMap(p) || renamed(p.id) === p.id) return p;
        changed = true;
        return { ...p, id: renamed(p.id) };
      })
    : layer.points;
  const filed = Array.isArray(layer.filed)
    ? layer.filed.map((file: unknown) => {
        if (!isMap(file) || !isMap(file.meta)) return file;
        const bench = file.meta[BENCH_FRAGMENT];
        if (renamed(bench) === bench) return file;
        changed = true;
        return { ...file, meta: { ...file.meta, [BENCH_FRAGMENT]: renamed(bench) } };
      })
    : layer.filed;
  let together = layer.together;
  if (
    Array.isArray(together) &&
    together.some(
      (pair: unknown) =>
        isMap(pair) &&
        Array.isArray(pair.ids) &&
        pair.ids.some((id: unknown) => renamed(id) !== id),
    )
  ) {
    changed = true;
    const summed = new Map<string, { ids: [string, string]; count: number }>();
    const kept: unknown[] = [];
    for (const pair of together as unknown[]) {
      const [a, b] =
        isMap(pair) && Array.isArray(pair.ids) ? (pair.ids as unknown[]).map(renamed) : [];
      if (
        typeof a !== 'string' ||
        typeof b !== 'string' ||
        !isMap(pair) ||
        typeof pair.count !== 'number'
      ) {
        kept.push(pair);
        continue;
      }
      if (a === b) continue;
      const ids: [string, string] = byId(a, b) < 0 ? [a, b] : [b, a];
      const key = JSON.stringify(ids);
      const before = summed.get(key);
      if (before) before.count += pair.count;
      else {
        const entry = { ids, count: pair.count };
        summed.set(key, entry);
        kept.push(entry);
      }
    }
    together = kept;
  }
  return changed ? ({ ...layer, points, filed, together } as T) : layer;
}

/**
 * A learned layer as a band reads it on load: its meters named as cells names them now (`meterIdsRenamed`, #751), and
 * its lead lines without the voice and card they carried before #580 (`leadsAlone`, Jambot's own). Cells reads no
 * retired form before its 1.0.0 (yggi/cells#643), so nothing else is rewritten: a layer kept in an older form loads as
 * it was kept, and a text in it that takes an id cells refuses now answers no query, so the band plays its own line
 * there. A layer kept now is the layer itself.
 */
export const keptLayer = (layer: LearnedLayer): LearnedLayer => leadsAlone(meterIdsRenamed(layer));

/**
 * What is wrong with a learned layer for cells' meters and rhythms, each
 * problem a sentence; none for one a query takes. Its shape (cells'
 * `layerProblems`), and that it files no seed fragment's id, which a query
 * refuses.
 */
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
