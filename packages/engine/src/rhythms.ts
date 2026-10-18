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
 * a step at a time, at idle. */

import { METERS, type Meter, type MeterName, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { compileSource } from '@yggi/cells/engine/compile';
import { setTiming } from '@yggi/cells/engine/edit';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { cachedCompile, fitOf, unionOf } from '@yggi/cells/repository/fit';
import { type Fragment, createRepository } from '@yggi/cells/repository/fragments';
import { holesOf } from '@yggi/cells/repository/holes';
import { useFragments } from '@yggi/cells/repository/learned';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { sameMeter } from './events.ts';
import { type LearnedLayer, cappedLayer } from './layer.ts';
import type { StylePoint } from './meter-query.ts';
import { METER_REPOSITORY } from './repository.ts';
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
  return { bars, hits: hits.sort((a, b) => a.step - b.step || a.note - b.note) };
}

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
  const cells = createRepository(fragments);
  const texts = new Map(fragments.map((f) => [f.id, f.text]));
  // (every fit tested, every read, each bench's workbench, and each rhythm's union with one and the
  // fragments that layer there: kept for the repository's life, a few hundred of each at most)
  const fitted = new Map<string, boolean>();
  const reads = new Map<string, FragmentRead | null>();
  const benches = new Map<string, string | null>();
  const withIts = new Map<string, { text: string; layers: readonly string[] }>();
  const fits = (id: string, workbench: string) => {
    const key = `${workbench.length}:${workbench}${id}`;
    if (!fitted.has(key)) fitted.set(key, fit(texts.get(id)!, workbench));
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
      const text = unionOf(texts.get(chosen)!, workbench).text;
      const layers = fragments
        .filter((f) => f.id !== chosen && unionOf(f.text, text).renamed.size === 0)
        .map((f) => f.id);
      withIts.set(key, { text, layers });
    }
    return withIts.get(key)!;
  };
  // Ranked as cells' query ranks them, a filed fragment left out, as the meter's are, until filing reads one (#401).
  const ranked = (point: StylePoint, layer?: LearnedLayer, chosen?: string) =>
    cells
      .query(
        point,
        fragments.length + (layer?.filed.length ?? 0),
        {},
        {
          facet: 'rhythm',
          ...(layer ? { layer } : {}),
          ...(chosen === undefined ? {} : { chosen: [chosen] }),
        },
      )
      .filter((f) => texts.has(f.fragment.id))
      .map((f) => ({ id: f.fragment.id, distance: f.distance }));
  const read = (id: string, meter: Meter) => {
    const key = `${id}\n${meterKey(meter)}`;
    if (!reads.has(key)) {
      const text = texts.get(id);
      reads.set(key, text === undefined ? null : readRhythm(text, meter));
    }
    return reads.get(key)!;
  };
  return {
    query(point, bench, layer) {
      const workbench = benchOf(bench);
      return workbench === null ? [] : ranked(point, layer).filter((f) => fits(f.id, workbench));
    },
    layered(point, bench, chosen, layer, reach = Infinity) {
      const workbench = benchOf(bench);
      if (workbench === null || !texts.has(chosen)) return [];
      const withIt = withItOf(chosen, workbench);
      return ranked(point, layer, chosen).filter(
        (f) => f.distance <= reach && withIt.layers.includes(f.id) && fits(f.id, withIt.text),
      );
    },
    used: (layer, ids, point) =>
      cappedLayer(
        useFragments(
          cells,
          layer,
          ids.map((id) => ({ id, point, facet: 'rhythm' })),
        ),
      ),
    read,
    *warm(benches) {
      for (const bench of benches) {
        const workbench = benchOf(bench);
        yield;
        if (workbench === null) continue;
        for (const { id } of fragments) {
          if (!fits(id, workbench)) {
            yield;
            continue;
          }
          read(id, bench.meter);
          yield;
          const withIt = withItOf(id, workbench);
          yield;
          for (const other of withIt.layers) {
            fits(other, withIt.text);
            read(other, bench.meter);
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
