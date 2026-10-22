/**
 * A repository of pitched lines as the composer asks it (#423, #424): one
 * for every band member whose fragments are lines of notes, the bass's
 * (`bass-lines.ts`) and the lead's (`lead-lines.ts`). A member's kind says
 * only its facet, its seed fragments, how a text reads into its notes under
 * a meter, how its notes are stated as text, and which of cells' operators
 * vary it on what workbench; the rest is this module's, once: cells' query
 * on the facet, the learned layer's uses and filings, the reads and
 * variations kept for the repository's life, and the warming a host does
 * ahead, a step at a time.
 *
 * A line filed keeps its read, the round trip (what is stated from notes
 * reads back as them), so the section that takes it compiles nothing.
 */

import { METERS, type Meter, type MeterName, stepsOf } from '@jambot/theory';
import { type VaryOptions, type Variation, drawn, variations } from '@yggi/cells/engine/vary/index';
import { type Fragment, createRepository } from '@yggi/cells/repository/fragments';
import { fileFragment, useFragments } from '@yggi/cells/repository/learned';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { sameMeter } from './events.ts';
import type { FacetRepository } from './facet.ts';
import { type LearnedLayer, cappedLayer, stillHeld } from './layer.ts';
import type { StylePoint } from './meter-query.ts';
import { BY } from './novelty.ts';

/** A line read under a meter: its notes over its lap, and the bars the lap holds. */
export interface LinesRead<N> {
  readonly bars: number;
  readonly notes: readonly N[];
}

/** What a member's lines are: everything about them that isn't the loop's. */
export interface LineKind<N extends { readonly step: number }> {
  /** The facet its lines are associated as. */
  readonly facet: string;
  /** Its seed lines, cells'. */
  readonly fragments: readonly Fragment[];
  /** A line's text read under a meter, played straight, or null where it can't be read there. */
  readonly read: (text: string, meter: Meter) => LinesRead<N> | null;
  /** A bar's notes as a line's text, open on its meter: it reads back as them (the round trip). */
  readonly text: (notes: readonly N[], steps: number) => string;
  /** How cells varies a line under a named meter: its workbench and operators. */
  readonly vary: (name: MeterName) => VaryOptions;
}

/** A meter's name as cells writes it in `meter("…")`, or null for one cells has no name for. */
export const nameOf = (meter: Meter): MeterName | null =>
  (Object.keys(METERS) as MeterName[]).find((name) => sameMeter(METERS[name], meter)) ?? null;

/** A meter's key in the caches: its cycle and pulses. */
const meterKey = (meter: Meter) => `${meter.cycle}:${meter.heights.join(' ')}`;

/** The coarsest grid of a bar of `steps` all these steps fall on, as cells writes it, and its length in steps. */
export function gridOf(
  onsets: readonly number[],
  steps: number,
): { readonly tap: string; readonly length: number } {
  const grids = [
    { tap: '1m', length: steps },
    { tap: '2n', length: 8 },
    { tap: '4n', length: 4 },
    { tap: '8n', length: 2 },
  ];
  return (
    grids.find((g) => steps % g.length === 0 && onsets.every((s) => s % g.length === 0)) ?? {
      tap: '16n',
      length: 1,
    }
  );
}

/** A repository of a member's lines, ranked by cells' query on its facet and read by its kind. */
export function lineRepositoryOf<N extends { readonly step: number }>(
  kind: LineKind<N>,
): FacetRepository<LinesRead<N>, { readonly notes: readonly N[] }> {
  const { facet, fragments, read } = kind;
  // (the lines with cells' meters beside them, which a line query never ranks, its facet theirs alone: so a line and
  // the meter it was kept with count as used together)
  const cells = createRepository([...fragments, ...METER_FRAGMENTS]);
  const texts = new Map(fragments.map((f) => [f.id, f.text]));
  const textOf = (id: string, layer?: LearnedLayer) =>
    texts.get(id) ?? layer?.filed.find((f) => f.fragment.id === id)?.fragment.text;
  const isLine = ({ fragment }: LearnedLayer['filed'][number]) =>
    fragment.association.some((p) => p.facet === facet);
  // (every read and every line's variations on a meter, by text: kept for the repository's life)
  const reads = new Map<string, LinesRead<N> | null>();
  const varied = new Map<string, readonly Variation[]>();
  const readText = (text: string, meter: Meter) => {
    const key = `${text}\n${meterKey(meter)}`;
    if (!reads.has(key)) reads.set(key, read(text, meter));
    return reads.get(key)!;
  };
  const variationsOn = (text: string, name: MeterName) => {
    const key = `${name}\n${text}`;
    if (!varied.has(key)) varied.set(key, variations(text, kind.vary(name)));
    return varied.get(key)!;
  };
  const ranked = (
    point: StylePoint,
    layer: LearnedLayer | undefined,
    chosen: readonly string[],
    reach: number,
    pull: number | undefined,
  ) =>
    cells
      .query(
        point,
        fragments.length + METER_FRAGMENTS.length + (layer?.filed.length ?? 0),
        {},
        {
          facet,
          ...(layer ? { layer } : {}),
          ...(chosen.length ? { chosen } : {}),
          ...(pull === undefined ? {} : { pull }),
        },
      )
      .filter((f) => texts.has(f.fragment.id) || f.distance <= reach);
  return {
    query(point, bench, layer, chosen = [], reach = Infinity, pull) {
      return ranked(point, layer, chosen, reach, pull)
        .filter((f) => readText(f.fragment.text, bench.meter) !== null)
        .map((f) => ({ id: f.fragment.id, distance: f.distance }));
    },
    used: (layer, ids, point, alongside = []) =>
      cappedLayer(
        useFragments(cells, layer, [
          ...stillHeld(cells, layer, ids).map((id) => ({ id, point, facet })),
          ...stillHeld(cells, layer, alongside).map((id) => ({ id })),
        ]),
      ),
    file(layer, { notes, bench, point, source, created, tags, varies, by }) {
      const text = kind.text(notes, stepsOf(bench.meter));
      const filed = fileFragment(cells, layer, {
        text,
        point,
        facet,
        source,
        created,
        meta: {
          tags: [...tags],
          ...(varies === undefined ? {} : { varies }),
          ...(by === undefined ? {} : { [BY]: by }),
        },
      });
      // (filing is its use at the point; beside the meter fragment it was played in, a use together)
      const { meterFragment } = bench;
      const together =
        meterFragment === undefined
          ? filed.layer
          : useFragments(cells, filed.layer, [{ id: filed.id }, { id: meterFragment }]);
      // (the round trip: a line stated from its notes reads back as them, on its bench)
      const known = `${text}\n${meterKey(bench.meter)}`;
      if (filed.file && !reads.has(known))
        reads.set(known, { bars: 1, notes: [...notes].sort((a, b) => a.step - b.step) });
      return { layer: cappedLayer(together), id: filed.id, held: filed.file === null };
    },
    read(id, meter, layer) {
      const text = textOf(id, layer);
      return text === undefined ? null : readText(text, meter);
    },
    vary(id, bench, draw, layer) {
      const text = textOf(id, layer);
      const name = nameOf(bench.meter);
      if (text === undefined || name === null || readText(text, bench.meter) === null) return null;
      const all = variationsOn(text, name);
      if (!all.length) return null;
      const variation = all[drawn(draw, all.length)]!;
      const got = read(variation.apply(text), bench.meter);
      return got && { notes: got.notes, by: variation.by };
    },
    *warm(benches, layer) {
      // (cells' lines, and those the layer filed, newest first; a line read on a meter takes no step again)
      const lines = [
        ...(layer?.filed ?? [])
          .filter(isLine)
          .map((f) => f.fragment.text)
          .reverse(),
        ...fragments.map((f) => f.text),
      ];
      const meters = benches.filter(
        (b, i) => benches.findIndex((o) => sameMeter(o.meter, b.meter)) === i,
      );
      for (const { meter } of meters) {
        const name = nameOf(meter);
        if (name === null) continue;
        for (const text of lines) {
          if (reads.has(`${text}\n${meterKey(meter)}`)) continue;
          const got = readText(text, meter);
          yield;
          // (and its variations, where the composer could vary it there: a line of a bar)
          if (got !== null && got.bars === 1 && !varied.has(`${name}\n${text}`)) {
            variationsOn(text, name);
            yield;
          }
        }
      }
    },
  };
}
