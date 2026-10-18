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
 * a swung meter in cells, yggi/cells#121). Each read is kept by fragment and
 * meter, and cells keeps each fit it has tested, so a section asks again at
 * the cost of a lookup; a workbench cells hasn't seen costs a compile a
 * fragment it tests (E36: 2 to 3 ms for the nearest).
 */

import { METERS, type Meter, type MeterName, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { compileSource } from '@yggi/cells/engine/compile';
import { setTiming } from '@yggi/cells/engine/edit';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { unionOf } from '@yggi/cells/repository/fit';
import { type Fragment, createRepository } from '@yggi/cells/repository/fragments';
import { holesOf } from '@yggi/cells/repository/holes';
import { useFragments } from '@yggi/cells/repository/learned';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { sameMeter } from './events.ts';
import { type LearnedLayer, cappedLayer } from './layer.ts';
import type { StylePoint } from './meter-query.ts';
import type { FragmentHit, FragmentRead, RhythmBench, RhythmRepository } from './rhythm-query.ts';
import { stepSeconds } from './tempo.ts';

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

/** A repository of these rhythms, ranked by cells' query on the facet `rhythm`. */
export function rhythmRepository(
  fragments: readonly Fragment[] = RHYTHM_FRAGMENTS,
): RhythmRepository {
  const cells = createRepository(fragments);
  const texts = new Map(fragments.map((f) => [f.id, f.text]));
  const reads = new Map<string, FragmentRead | null>();
  // (each bench's workbench, and each rhythm's union with one and the fragments that layer there, kept as reads are)
  const benches = new Map<string, string | null>();
  const withIts = new Map<string, { text: string; layers: ReadonlySet<string> }>();
  const benchOf = (bench: RhythmBench) => {
    const key = `${bench.meterFragment ?? ''}\n${bench.meter.cycle}:${bench.meter.heights.join(' ')}`;
    if (!benches.has(key)) benches.set(key, benchText(bench));
    return benches.get(key)!;
  };
  // (a fragment the layer files is left out, as the meter's are, until filing reads one: #401)
  const found = (point: StylePoint, workbench: string, layer?: LearnedLayer, chosen?: string) =>
    cells
      .query(
        point,
        fragments.length + (layer?.filed.length ?? 0),
        {},
        {
          facet: 'rhythm',
          workbench,
          ...(layer ? { layer } : {}),
          ...(chosen === undefined ? {} : { chosen: [chosen] }),
        },
      )
      .filter((f) => texts.has(f.fragment.id))
      .map((f) => ({ id: f.fragment.id, distance: f.distance }));
  return {
    query(point, bench, layer) {
      const workbench = benchOf(bench);
      return workbench === null ? [] : found(point, workbench, layer);
    },
    layered(point, bench, chosen, layer) {
      const workbench = benchOf(bench);
      const text = texts.get(chosen);
      if (workbench === null || text === undefined) return [];
      const key = `${chosen}\n${workbench}`;
      if (!withIts.has(key)) {
        const withIt = unionOf(text, workbench).text;
        const layers = new Set(
          fragments
            .filter((f) => f.id !== chosen && unionOf(f.text, withIt).renamed.size === 0)
            .map((f) => f.id),
        );
        withIts.set(key, { text: withIt, layers });
      }
      const { text: withIt, layers } = withIts.get(key)!;
      return found(point, withIt, layer, chosen).filter((f) => layers.has(f.id));
    },
    used: (layer, ids, point) =>
      cappedLayer(
        useFragments(
          cells,
          layer,
          ids.map((id) => ({ id, point, facet: 'rhythm' })),
        ),
      ),
    read(id, meter) {
      const key = `${id}\n${meter.cycle}:${meter.heights.join(' ')}`;
      if (!reads.has(key)) {
        const text = texts.get(id);
        reads.set(key, text === undefined ? null : readRhythm(text, meter));
      }
      return reads.get(key)!;
    },
  };
}

/** Cells' rhythms, as the composer asks them. */
export const RHYTHM_REPOSITORY: RhythmRepository = rhythmRepository();
