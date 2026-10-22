/**
 * Cells' repository of rhythms, as the composer asks it (#397): cells'
 * `RHYTHM_FRAGMENTS` (v0.9.0: E31's eight drum bars and five claves), ranked
 * by cells' own `query` on the facet `rhythm` with the section's meter as
 * the workbench, so only the rhythms that fit it rank (cells' fit, decision
 * 047), and each read by cells' own compiler and MIDI out into hits a role a
 * line (`readRhythm`, E36's reading, 144 of E31's 144 hits).
 *
 * The workbench is the section's meter fragment, its tempo set as
 * `repository.ts` reads a meter (any tempo: a fragment is open on its
 * tempo), or, for a meter asked for, the meter named. A fragment is read
 * under its meter played straight, the swing left out, since the band swings
 * its hits as it swings its own (E36: a Euclid on `1m` stays straight under
 * a swung meter in cells, yggi/cells#121). Fragments are ranked by cells'
 * `query` and filtered by cells' `fitOf`, the fit its query's workbench
 * applies, each fit and read kept for the repository's life, so a section
 * asks again at the cost of a lookup. A fit not yet tested costs a compile
 * (2 to 15 ms), too much for a section's start while the band plays, so
 * the host warms the repository first (`warm`, over `RHYTHM_BENCHES`),
 * a step at a time, at idle.
 *
 * A groove the Muse files (#401) joins the rhythms through the layer: ranked
 * with them, held by its text there, read and fitted as they are. Filing
 * keeps its reading and its fit to the bench it was played on, which the
 * round trip gives (`muse-groove.ts`), so the section that takes it at once
 * compiles only its union with the bench, and those of the few fragments
 * within a clave's reach (whether a fragment layers with a rhythm is tested
 * one fragment at a time, only for those a section could take). The rest,
 * its fits, reads and unions on every bench, the host warms after filing,
 * or after loading a layer that filed it (#412: `warm` given the layer), so
 * no later section compiles them.
 *
 * A rhythm is varied by cells' vary (#442, yggi/cells decision 052): every
 * variation of its text by one of cells' rhythm operators on one line, on
 * the bench's workbench, which sets the anchors cells derives (the kick's
 * line and the backbeat's), beside the lines the composer keeps
 * (`GROOVE_KEEP`, the fill), each kept for the repository's life and
 * warmed with the rhythm's fit and read; the one a draw takes is read back
 * by its varied line alone, over the rhythm's lap, one compile (E39). */

import { METERS, type Meter, type MeterName, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { compileSource } from '@yggi/cells/engine/compile';
import { setTiming } from '@yggi/cells/engine/edit';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { cachedCompile, fitOf, unionOf } from '@yggi/cells/repository/fit';
import { type Fragment, createRepository } from '@yggi/cells/repository/fragments';
import { holesOf } from '@yggi/cells/repository/holes';
import { fileFragment, useFragments } from '@yggi/cells/repository/learned';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { type Variation, drawn, variations } from '@yggi/cells/engine/vary/index';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { sameMeter } from './events.ts';
import { type LearnedLayer, cappedLayer, stillHeld } from './layer.ts';
import type { StylePoint } from './meter-query.ts';
import { METER_REPOSITORY } from './repository.ts';
import { GROOVE_FEWEST, grooveText } from './muse-groove.ts';
import { BY, GROOVE_KEEP } from './novelty.ts';
import {
  type FragmentHit,
  type FragmentRead,
  type RhythmBench,
  type RhythmRepository,
  isOwnLine,
} from './rhythm-query.ts';
import { stepSeconds } from './tempo.ts';

/** The compiles kept: every fragment, workbench and union the benches meet, a few hundred, with room. */
const COMPILES = 2048;

/** The tempo a fragment is fitted and read at: any, since it is open on its tempo. */
const READ_AT = 120;

/** A meter's name as cells writes it in `meter("…")`, or null for one cells has no name for. */
const nameOf = (meter: Meter): MeterName | null =>
  (Object.keys(METERS) as MeterName[]).find((name) => sameMeter(METERS[name], meter)) ?? null;

/** A meter played straight, at the reading tempo. */
const straight = (name: MeterName) => `&bar meter("${name}") step=${READ_AT}bpm`;

/** The workbench of a bench: its meter fragment at the reading tempo, or the meter named. */
export function benchText({ meter, meterFragment }: RhythmBench): string | null {
  const fragment = METER_FRAGMENTS.find((f) => f.id === meterFragment);
  if (fragment) return setTiming(fragment.text, 'bar', 'step', `${READ_AT}bpm`);
  const name = nameOf(meter);
  return name ? straight(name) : null;
}

/** A fragment's MIDI card on channel 10: its line, and its terms, a line each. */
function cardOf(text: string): { readonly line: string; readonly terms: string[] } | null {
  const card = /^&\w+ map=midi\(10\) \[(.*)\]$/m.exec(text);
  return card ? { line: card[0], terms: card[1]!.split(', ') } : null;
}

/** Within a millionth of a step. */
const whole = (x: number) => (Math.abs(x - Math.round(x)) < 1e-6 ? Math.round(x) : x);

/**
 * A fragment's hits under a meter played straight, over its lap (the most
 * bars a line of it laps, `cycle=`): each line of its card alone, in its
 * union with the meter, through cells' MIDI out, its name the hit's role.
 * Null where the meter has no name in cells, the fragment no card on
 * channel 10, or a hit falls off the steps.
 */
export function readRhythm(text: string, meter: Meter): FragmentRead | null {
  if (!nameOf(meter) || !cardOf(text)) return null;
  const bars = Math.max(1, ...holesOf(text, compileSource).clock.map((need) => need.bars));
  return readLines(text, meter, bars);
}

/** A fragment's hits over a lap of `bars` (`readRhythm`), each line's, or one line's alone where a role is given. */
function readLines(text: string, meter: Meter, bars: number, role?: string): FragmentRead | null {
  const name = nameOf(meter);
  const card = cardOf(text);
  if (!name || !card) return null;
  const step = stepSeconds(READ_AT, meter);
  const steps = stepsOf(meter) * bars;
  const hits: FragmentHit[] = [];
  for (const term of card.terms) {
    const line = /^&(\w+)/.exec(term)![1]!;
    if (role !== undefined && line !== role) continue;
    const alone = text.replace(card.line, card.line.replace(/\[.*\]$/, `[${term}]`));
    const plan = planOf(unionOf(alone, straight(name)).text);
    const route = router(plan.result, channelTable(plan.result));
    for (const e of windowAt(plan, 0, steps * step).events)
      for (const r of routesOf(route(e))) {
        const note = midiNote(e, r);
        if (!note || note.channel !== 10) continue;
        const at = whole(note.at / step);
        if (!Number.isInteger(at) || at >= steps) return null;
        hits.push({ role: line, note: note.note, step: at, velocity: note.velocity });
      }
  }
  return { bars, hits: inOrder(hits) };
}

/** Hits in the order a read gives them: by step, then note. */
const inOrder = (hits: readonly FragmentHit[]): FragmentHit[] =>
  [...hits].sort((a, b) => a.step - b.step || a.note - b.note);

/** A meter's key in the caches: its cycle and pulses. */
const meterKey = (meter: Meter) => `${meter.cycle}:${meter.heights.join(' ')}`;

/** Whether a fragment fits a workbench: cells' `fitOf`, its compiles cached by text. */
export type RhythmFit = (fragment: string, workbench: string) => boolean;

/** Cells' fit, with a cache of compiles of its own. */
export function cellsFit(): RhythmFit {
  const compiled = cachedCompile(COMPILES);
  return (fragment, workbench) => fitOf(fragment, workbench, compiled).fits;
}

/** Whether a filed fragment is a rhythm: associated as one at some point. */
const isRhythm = ({ fragment }: LearnedLayer['filed'][number]) =>
  fragment.association.some((p) => p.facet === 'rhythm');

/** A repository of these rhythms, ranked by cells' query on the facet `rhythm`, filtered by the fit and read by `read` (cells', unless a test counts them). */
export function rhythmRepository(
  fragments: readonly Fragment[] = RHYTHM_FRAGMENTS,
  fit: RhythmFit = cellsFit(),
  read: (text: string, meter: Meter) => FragmentRead | null = readRhythm,
): RhythmRepository {
  // (the rhythms with cells' meters beside them, which a rhythm query never ranks, its facet theirs alone:
  // so a rhythm and the meter it was kept with count as used together, and a filing finds any text held)
  const cells = createRepository([...fragments, ...METER_FRAGMENTS]);
  const texts = new Map(fragments.map((f) => [f.id, f.text]));
  const textOf = (id: string, layer?: LearnedLayer) =>
    texts.get(id) ?? layer?.filed.find((f) => f.fragment.id === id)?.fragment.text;
  // (every fit tested, every read, each bench's workbench, each rhythm's union with one, whether a fragment
  // layers there, and each rhythm warmed on a workbench, by text: kept for the repository's life, a few
  // hundred of each at most, and a few dozen more for every groove filed)
  const fitted = new Map<string, boolean>();
  const reads = new Map<string, FragmentRead | null>();
  const workbenches = new Map<string, string | null>();
  const withIts = new Map<string, string>();
  const layering = new Map<string, boolean>();
  const warmed = new Set<string>();
  const varied = new Map<string, readonly Variation[]>();
  const fits = (text: string, workbench: string) => {
    const key = `${workbench.length}:${workbench}${text}`;
    if (!fitted.has(key)) fitted.set(key, fit(text, workbench));
    return fitted.get(key)!;
  };
  const benchKey = (bench: RhythmBench) => `${bench.meterFragment ?? ''}\n${meterKey(bench.meter)}`;
  const benchOf = (bench: RhythmBench) => {
    const key = benchKey(bench);
    if (!workbenches.has(key)) workbenches.set(key, benchText(bench));
    return workbenches.get(key)!;
  };
  const withItOf = (chosen: string, workbench: string) => {
    const key = `${chosen}\n${workbench}`;
    if (!withIts.has(key)) withIts.set(key, unionOf(chosen, workbench).text);
    return withIts.get(key)!;
  };
  // Whether a seed fragment layers with `chosen` on the workbench: another text, whose union with theirs renames none
  // of its names. Tested one fragment at a time, so a section tests it only for those within its reach.
  const layersWith = (id: string, chosen: string, workbench: string) => {
    const key = `${id}\n${chosen}\n${workbench}`;
    if (!layering.has(key)) {
      const text = texts.get(id);
      layering.set(
        key,
        text !== undefined &&
          text !== chosen &&
          unionOf(text, withItOf(chosen, workbench)).renamed.size === 0,
      );
    }
    return layering.get(key)!;
  };
  // Ranked as cells' query ranks them: the seed's every rhythm, and a groove filed (#401) no farther than `reach`,
  // so a fit is tested only for one a section could take.
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
          facet: 'rhythm',
          ...(layer ? { layer } : {}),
          ...(chosen.length ? { chosen } : {}),
          ...(pull === undefined ? {} : { pull }),
        },
      )
      .filter((f) => texts.has(f.fragment.id) || f.distance <= reach)
      .map((f) => ({ id: f.fragment.id, text: f.fragment.text, distance: f.distance }));
  const readText = (text: string, meter: Meter) => {
    const key = `${text}\n${meterKey(meter)}`;
    if (!reads.has(key)) reads.set(key, read(text, meter));
    return reads.get(key)!;
  };
  // Every variation of a rhythm on a workbench, by the composer's policy (`novelty.ts`): cells' rhythm operators on
  // every line but its anchors and those kept, none of fewer hits than a groove holds.
  const variationsOn = (text: string, workbench: string) => {
    const key = `${workbench.length}:${workbench}${text}`;
    if (!varied.has(key))
      varied.set(key, variations(text, { workbench, keep: GROOVE_KEEP, fewest: GROOVE_FEWEST }));
    return varied.get(key)!;
  };
  return {
    query(point, bench, layer, chosen = [], reach = Infinity, pull) {
      const workbench = benchOf(bench);
      return workbench === null
        ? []
        : ranked(point, layer, chosen, reach, pull)
            .filter((f) => fits(f.text, workbench))
            .map(({ id, distance }) => ({ id, distance }));
    },
    layered(point, bench, chosen, layer, reach = Infinity, more = [], pull) {
      const workbench = benchOf(bench);
      const chosenText = textOf(chosen, layer);
      if (workbench === null || chosenText === undefined) return [];
      return ranked(point, layer, [chosen, ...more], reach, pull)
        .filter(
          (f) =>
            f.distance <= reach &&
            layersWith(f.id, chosenText, workbench) &&
            fits(f.text, withItOf(chosenText, workbench)),
        )
        .map(({ id, distance }) => ({ id, distance }));
    },
    used: (layer, ids, point, alongside = []) =>
      cappedLayer(
        useFragments(cells, layer, [
          ...stillHeld(cells, layer, ids).map((id) => ({ id, point, facet: 'rhythm' })),
          ...stillHeld(cells, layer, alongside).map((id) => ({ id })),
        ]),
      ),
    file(layer, { hits, bench, point, source, created, tags, varies, by }) {
      const text = grooveText(hits, stepsOf(bench.meter));
      const filed = fileFragment(cells, layer, {
        text,
        point,
        facet: 'rhythm',
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
      // (the round trip: a groove stated from its hits reads back as them, and fits the bench it was played on)
      const known = `${text}\n${meterKey(bench.meter)}`;
      if (filed.file && !reads.has(known)) reads.set(known, { bars: 1, hits: inOrder(hits) });
      const workbench = benchOf(bench);
      if (filed.file && workbench !== null)
        fitted.set(`${workbench.length}:${workbench}${text}`, true);
      return { layer: cappedLayer(together), id: filed.id, held: filed.file === null };
    },
    read(id, meter, layer) {
      const text = textOf(id, layer);
      return text === undefined ? null : readText(text, meter);
    },
    vary(id, bench, draw, layer) {
      const text = textOf(id, layer);
      const workbench = benchOf(bench);
      const whole = text === undefined ? null : readText(text, bench.meter);
      if (text === undefined || workbench === null || whole === null) return null;
      const all = variationsOn(text, workbench);
      if (!all.length) return null;
      // (a variation rewrites one line, so only that line is read back from its text, over the rhythm's lap: one compile)
      const variation = all[drawn(draw, all.length)]!;
      const role = variation.line.slice(1);
      const line = readLines(variation.apply(text), bench.meter, whole.bars, role);
      if (line === null) return null;
      return {
        hits: inOrder([...whole.hits.filter((h) => h.role !== role), ...line.hits]),
        by: variation.by,
      };
    },
    *warm(benches, layer) {
      // (cells' rhythms, and the grooves the layer filed, newest first; a rhythm warmed on a workbench takes no step again)
      const rhythms = [
        ...(layer?.filed ?? [])
          .filter(isRhythm)
          .map((f) => f.fragment.text)
          .reverse(),
        ...fragments.map((f) => f.text),
      ];
      for (const bench of benches) {
        const asked = workbenches.has(benchKey(bench));
        const workbench = benchOf(bench);
        if (!asked) yield;
        if (workbench === null) continue;
        for (const text of rhythms) {
          const done = `${workbench.length}:${workbench}${text}`;
          if (warmed.has(done)) continue;
          warmed.add(done);
          if (!fits(text, workbench)) {
            yield;
            continue;
          }
          const got = readText(text, bench.meter);
          yield;
          // (and its variations, where the composer could vary it there: a bar of a drum bar's lines, so its ask reads one line)
          if (got !== null && got.bars === 1 && !isOwnLine(got)) {
            variationsOn(text, workbench);
            yield;
          }
          const withIt = withItOf(text, workbench);
          yield;
          for (const other of fragments) {
            if (layersWith(other.id, text, workbench)) {
              fits(other.text, withIt);
              readText(other.text, bench.meter);
            }
            yield;
          }
        }
      }
    },
  };
}

/**
 * Every bench a section can ask on: each meter the meter repository plays,
 * from its fragment, and each named meter a person can ask for. Warming the
 * repository on them (`RhythmRepository.warm`) leaves no section a fit to
 * compile.
 */
export const RHYTHM_BENCHES: readonly RhythmBench[] = [
  ...[...METER_REPOSITORY.fragments.values()].map((f) => ({ meter: f.meter, meterFragment: f.id })),
  ...Object.values(METERS).map((meter) => ({ meter })),
];

/** Cells' rhythms, as the composer asks them. */
export const RHYTHM_REPOSITORY: RhythmRepository = rhythmRepository();
