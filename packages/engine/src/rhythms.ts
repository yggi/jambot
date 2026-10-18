/**
 * Cells' repository of rhythms, as the composer asks it (#397): cells'
 * `RHYTHM_FRAGMENTS` (v0.6.0: E31's eight drum bars and five claves), ranked
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
 * round trip gives (`muse-groove.ts`), so a filed groove costs no compile at
 * the next section; one asked on another bench, or near its point after a
 * reload, compiles once, as a fit not yet tested does. */

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
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { sameMeter } from './events.ts';
import { type LearnedLayer, cappedLayer } from './layer.ts';
import type { StylePoint } from './meter-query.ts';
import { METER_REPOSITORY } from './repository.ts';
import { grooveText } from './muse-groove.ts';
import type { FragmentHit, FragmentRead, RhythmBench, RhythmRepository } from './rhythm-query.ts';
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
function benchText({ meter, meterFragment }: RhythmBench): string | null {
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
  const name = nameOf(meter);
  const card = cardOf(text);
  if (!name || !card) return null;
  const bars = Math.max(1, ...holesOf(text, compileSource).clock.map((need) => need.bars));
  const step = stepSeconds(READ_AT, meter);
  const steps = stepsOf(meter) * bars;
  const hits: FragmentHit[] = [];
  for (const term of card.terms) {
    const role = /^&(\w+)/.exec(term)![1]!;
    const alone = text.replace(card.line, card.line.replace(/\[.*\]$/, `[${term}]`));
    const plan = planOf(unionOf(alone, straight(name)).text);
    const route = router(plan.result, channelTable(plan.result));
    for (const e of windowAt(plan, 0, steps * step).events)
      for (const r of routesOf(route(e))) {
        const note = midiNote(e, r);
        if (!note || note.channel !== 10) continue;
        const at = whole(note.at / step);
        if (!Number.isInteger(at) || at >= steps) return null;
        hits.push({ role, note: note.note, step: at, velocity: note.velocity });
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

/** A repository of these rhythms, ranked by cells' query on the facet `rhythm`, filtered by the fit (cells', unless a test counts it). */
export function rhythmRepository(
  fragments: readonly Fragment[] = RHYTHM_FRAGMENTS,
  fit: RhythmFit = cellsFit(),
): RhythmRepository {
  // (the rhythms with cells' meters beside them, which a rhythm query never ranks, its facet theirs alone:
  // so a rhythm and the meter it was kept with count as used together, and a filing finds any text held)
  const cells = createRepository([...fragments, ...METER_FRAGMENTS]);
  const texts = new Map(fragments.map((f) => [f.id, f.text]));
  const textOf = (id: string, layer?: LearnedLayer) =>
    texts.get(id) ?? layer?.filed.find((f) => f.fragment.id === id)?.fragment.text;
  // (every fit tested, every read, each bench's workbench, and each rhythm's union with one and the
  // fragments that layer there, by text: kept for the repository's life, a few hundred of each at most,
  // and one more of each for every groove filed that a section asks near)
  const fitted = new Map<string, boolean>();
  const reads = new Map<string, FragmentRead | null>();
  const benches = new Map<string, string | null>();
  const withIts = new Map<string, { text: string; layers: readonly string[] }>();
  const fits = (text: string, workbench: string) => {
    const key = `${workbench.length}:${workbench}${text}`;
    if (!fitted.has(key)) fitted.set(key, fit(text, workbench));
    return fitted.get(key)!;
  };
  const benchOf = (bench: RhythmBench) => {
    const key = `${bench.meterFragment ?? ''}\n${meterKey(bench.meter)}`;
    if (!benches.has(key)) benches.set(key, benchText(bench));
    return benches.get(key)!;
  };
  const withItOf = (chosen: string, workbench: string) => {
    const key = `${chosen}\n${workbench}`;
    if (!withIts.has(key)) {
      const text = unionOf(chosen, workbench).text;
      const layers = fragments
        .filter((f) => f.text !== chosen && unionOf(f.text, text).renamed.size === 0)
        .map((f) => f.id);
      withIts.set(key, { text, layers });
    }
    return withIts.get(key)!;
  };
  // Ranked as cells' query ranks them: the seed's every rhythm, and a groove filed (#401) no farther than `reach`,
  // so a fit is tested only for one a section could take.
  const ranked = (
    point: StylePoint,
    layer: LearnedLayer | undefined,
    chosen: readonly string[],
    reach: number,
  ) =>
    cells
      .query(
        point,
        fragments.length + METER_FRAGMENTS.length + (layer?.filed.length ?? 0),
        {},
        { facet: 'rhythm', ...(layer ? { layer } : {}), ...(chosen.length ? { chosen } : {}) },
      )
      .filter((f) => texts.has(f.fragment.id) || f.distance <= reach)
      .map((f) => ({ id: f.fragment.id, text: f.fragment.text, distance: f.distance }));
  const readText = (text: string, meter: Meter) => {
    const key = `${text}\n${meterKey(meter)}`;
    if (!reads.has(key)) reads.set(key, readRhythm(text, meter));
    return reads.get(key)!;
  };
  return {
    query(point, bench, layer, chosen = [], reach = Infinity) {
      const workbench = benchOf(bench);
      return workbench === null
        ? []
        : ranked(point, layer, chosen, reach)
            .filter((f) => fits(f.text, workbench))
            .map(({ id, distance }) => ({ id, distance }));
    },
    layered(point, bench, chosen, layer, reach = Infinity, more = []) {
      const workbench = benchOf(bench);
      const chosenText = textOf(chosen, layer);
      if (workbench === null || chosenText === undefined) return [];
      const withIt = withItOf(chosenText, workbench);
      return ranked(point, layer, [chosen, ...more], reach)
        .filter(
          (f) => f.distance <= reach && withIt.layers.includes(f.id) && fits(f.text, withIt.text),
        )
        .map(({ id, distance }) => ({ id, distance }));
    },
    used: (layer, ids, point, alongside = []) =>
      cappedLayer(
        useFragments(cells, layer, [
          ...ids.map((id) => ({ id, point, facet: 'rhythm' })),
          ...alongside.map((id) => ({ id })),
        ]),
      ),
    file(layer, { hits, bench, point, source, created, tags, varies }) {
      const text = grooveText(hits, stepsOf(bench.meter));
      const filed = fileFragment(cells, layer, {
        text,
        point,
        facet: 'rhythm',
        source,
        created,
        meta: { tags: [...tags], ...(varies === undefined ? {} : { varies }) },
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
    *warm(benches) {
      for (const bench of benches) {
        const workbench = benchOf(bench);
        yield;
        if (workbench === null) continue;
        for (const { text } of fragments) {
          if (!fits(text, workbench)) {
            yield;
            continue;
          }
          readText(text, bench.meter);
          yield;
          const withIt = withItOf(text, workbench);
          yield;
          for (const other of withIt.layers) {
            const otherText = texts.get(other)!;
            fits(otherText, withIt.text);
            readText(otherText, bench.meter);
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
