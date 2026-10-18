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
 * dynamics don't read. Of cells' thirteen, eleven are played: the alla breve
 * (two beats of a half) and 2/4 (a bar of 8 steps) are not.
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
import {
  type Fragment,
  type LearnedLayer,
  createRepository,
  layerProblems,
} from '@yggi/cells/repository/fragments';
import { useFragments } from '@yggi/cells/repository/learned';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { sameMeter } from './events.ts';
import { cappedLayer } from './layer.ts';
import type { MeterFragment, MeterRepository } from './meter-query.ts';
import { STRAIGHT, SWING_LEVELS, type SwingLevel } from './swing.ts';

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
    query: (point, layer, chosen = []) =>
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
  const seed = new Set([...METER_FRAGMENTS, ...RHYTHM_FRAGMENTS].map((f) => f.id));
  return (layer as LearnedLayer).filed
    .filter((file) => seed.has(file.fragment.id))
    .map((file) => `the layer files ${file.fragment.id}, a seed fragment's id`);
}
