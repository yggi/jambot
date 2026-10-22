/**
 * Cells' bass lines, as the composer asks them (#423): cells'
 * `BASS_FRAGMENTS` (v0.9.0: `bass.ts`'s five patterns as seed fragments,
 * yggi/cells#211 and #214), ranked by cells' own `query` on the facet
 * `bass`, and each read by cells' compiler into the notes of its line over
 * the chord in force (`readLine`): where each falls, from cells' MIDI out
 * under the meter played straight, and what it reads (the chord, the index
 * into its stack, an accidental and a shift), from cells' own flattening of
 * the line, so the band plays what cells would of it (`bass-lines.test.ts`
 * sets each against cells' MIDI out over a harmony).
 *
 * A line is read on a workbench of the meter, a key and a harmony that
 * nothing reads but the line's holes (`readingBench`): any key and chord
 * serve, since what is read is where a note falls and what it indexes, not
 * its pitch. A line fits any workbench that writes `&bar` and `&harm`
 * first (cells' fit of an open fragment), so the repository tests no fit:
 * a line it can read under the section's meter is one that fits it. Each
 * read is kept for the repository's life, so a section asks again at the
 * cost of a lookup; the host warms the reads first (`warm`, over the
 * benches it is given), a step at a time, at idle, as it does the rhythms'.
 *
 * A line the Muse files (#423, `muse-line.ts`) is stated as cells text
 * (`lineText`): one line of indices over the chord in force on the
 * coarsest of the bar's grids its notes fall on, the next chord's root
 * spliced in where a note reads it (`&bassNext`, `over=&harm[>>]`), and a
 * note off every tone of its chord as the root moved by semitones
 * (`&bassRoot^$n`). Its voice and card are `BASS_VOICE`, this module's
 * one place for them: where cells moves a line's voice into a hole an
 * instrument fragment fills (yggi/cells#260), only it changes. Filing keeps
 * its read, the round trip (`muse-line.test.ts`), so the section that takes
 * it compiles nothing.
 *
 * A line is varied by cells' vary (yggi/cells decision 052, rung 2): every
 * variation of its text by one of cells' pitched operators (transpose by a
 * degree of the chord, invert, reverse), around its anchors, which cells
 * derives from the workbench's harmony (the root on a chord change: here
 * the bar's downbeat, the chord the reading bench changes on, as #423 asks:
 * never a chord change's root on its downbeat). The one a draw takes is
 * read back, one compile.
 */

import { METERS, type Meter, type MeterName, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { compileSource } from '@yggi/cells/engine/compile';
import { flatten } from '@yggi/cells/engine/flatten';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { codeShifts } from '@yggi/cells/engine/program';
import {
  PITCHED_OPERATORS,
  type Variation,
  drawn,
  variations,
} from '@yggi/cells/engine/vary/index';
import { linesOf } from '@yggi/cells/engine/vary/lines';
import { BASS_FRAGMENTS } from '@yggi/cells/repository/bass';
import { unionOf } from '@yggi/cells/repository/fit';
import { type Fragment, createRepository } from '@yggi/cells/repository/fragments';
import { fileFragment, useFragments } from '@yggi/cells/repository/learned';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { BASS_FACET, type LineNote, type LineRead, type LineRepository } from './bass-query.ts';
import { sameMeter } from './events.ts';
import type { Bench } from './facet.ts';
import { type LearnedLayer, cappedLayer } from './layer.ts';
import type { StylePoint } from './meter-query.ts';
import { BY } from './novelty.ts';
import { RHYTHM_BENCHES } from './rhythms.ts';
import { stepSeconds } from './tempo.ts';

/** The tempo a line is read at: any, since it is open on its tempo. */
const READ_AT = 120;

/**
 * Where a filed line's voice and card come from: the bass's voice, its register's floor the performer moves from
 * (`C2`, as cells' seed lines write it), and its card on Jambot's bass channel, 2. The one place this module states
 * them, so a pin of cells that fills the voice from an instrument fragment (`use "bass"`, yggi/cells#260) changes these
 * lines alone.
 */
export const BASS_VOICE: readonly string[] = [
  '&bassV loop=C2',
  '&bassOut map=midi(2) [&bass * &bassV]',
];

/** A meter's name as cells writes it in `meter("…")`, or null for one cells has no name for. */
const nameOf = (meter: Meter): MeterName | null =>
  (Object.keys(METERS) as MeterName[]).find((name) => sameMeter(METERS[name], meter)) ?? null;

/**
 * The workbench a line is read and varied on: the meter played straight at the reading tempo, a key, and a harmony of
 * one chord a bar, so the line's holes are filled and cells' anchors are the roots on the bars' downbeats.
 */
export const readingBench = (name: MeterName): string =>
  [
    `&bar meter("${name}") step=${READ_AT}bpm`,
    '&key scale(ionian, C)',
    '&harm over=key step=1m [0,2,4]',
  ].join('\n');

/** Within a millionth of a step. */
const whole = (x: number) => (Math.abs(x - Math.round(x)) < 1e-6 ? Math.round(x) : x);

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * A line's notes under a meter played straight, over its lap: the bars after which its notes fall on the bar's steps
 * as they did (its steps against the ticks its grid gives a bar, cells' grid starting again each bar), each note's step
 * from cells' MIDI out, and what it reads from cells' flattening of the line. Null where the meter has no name in cells,
 * the text doesn't compile on the reading bench, it has other than one pitched line over `&harm` (cells' `linesOf`), a
 * note reads further than the next chord, or one falls off the steps.
 */
export function readLine(text: string, meter: Meter): LineRead | null {
  const name = nameOf(meter);
  if (!name) return null;
  const source = unionOf(text, readingBench(name)).text;
  const result = compileSource(source);
  if (!result.ok) return null;
  const pitched = linesOf(source, result).filter((l) => l.pitched);
  if (pitched.length !== 1) return null;
  const [line] = pitched as [(typeof pitched)[number]];
  if (line.pitched!.table !== 'harm' || line.stepWhole === null || !line.meter) return null;
  const events = flatten(result, line.trigger, codeShifts(result));
  const reads: Omit<LineNote, 'step'>[] = [];
  for (const n of line.notes) {
    const e = events.find((x) => Math.abs(x.step - n.step) < 1e-9);
    if (!e || e.table !== 'harm' || e.via || e.tableShift < 0 || e.tableShift > 1) return null;
    // (`+ 0`: an inversion mirrors a 0 to -0)
    reads.push({
      chord: e.tableShift,
      index: e.value + 0,
      alter: e.alter + 0,
      shift: (e.transpose ?? 0) + 0,
    });
  }
  if (!reads.length) return null;
  const barWhole = line.meter.pulses / line.meter.unit;
  const ticks = Math.ceil(barWhole / line.stepWhole - 1e-9);
  const bars = line.steps / gcd(line.steps, ticks);
  const steps = stepsOf(meter);
  const step = stepSeconds(READ_AT, meter);
  const plan = planOf(source);
  const route = router(plan.result, channelTable(plan.result));
  const onsets: number[] = [];
  for (const e of windowAt(plan, 0, bars * steps * step).events)
    for (const r of routesOf(route(e))) {
      const note = midiNote(e, r);
      if (!note) continue;
      const at = whole(note.at / step);
      if (!Number.isInteger(at) || at >= bars * steps) return null;
      onsets.push(at);
    }
  onsets.sort((a, b) => a - b);
  return { bars, notes: onsets.map((at, j) => ({ step: at, ...reads[j % reads.length]! })) };
}

/** The coarsest grid of a bar of `steps` all these steps fall on, as cells writes it, and its length in steps. */
function gridOf(
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

/**
 * A note's token, as cells' vary writes one back (`pitchText`): an index over the chord in force; where it reads the
 * next chord or moves by semitones, a splice of that chord's root (`&bassNext`, or `&bassRoot` for the chord in force)
 * moved by its semitones (`^$n`) and by its index (`^n` on a bare splice, else `degree(…, n)`). An accidental is none a
 * line is filed with (`lineOf` writes none) and none cells' vary reads on a line (`linesOf`), and is refused.
 */
function tokenOf(note: LineNote): string {
  if (note.alter !== 0) throw new Error(`lineText: an accidental (${JSON.stringify(note)})`);
  if (note.chord === 0 && note.shift === 0) return String(note.index);
  const cell = note.chord === 1 ? '&bassNext' : '&bassRoot';
  const moved = note.shift === 0 ? cell : `${cell}^$${note.shift}`;
  if (note.index === 0) return moved;
  return note.shift === 0 ? `${cell}^${note.index}` : `degree(${moved}, ${note.index})`;
}

/**
 * A bar's line as cells text, open on its meter and its chords (no `&bar`, no key, no harmony): its notes as indices
 * over the chord in force on the coarsest grid they fall on, `&bassNext` and `&bassRoot` defined where a note splices
 * them (`tokenOf`), and `BASS_VOICE`. It reads back as the notes it was stated from (`readLine`, the round trip).
 */
export function lineText(notes: readonly LineNote[], steps: number): string {
  const sorted = [...notes].sort((a, b) => a.step - b.step);
  const grid = gridOf(
    sorted.map((n) => n.step),
    steps,
  );
  const tokens = Array.from({ length: steps / grid.length }, (_, i) => {
    const here = sorted.find((n) => n.step === i * grid.length);
    return here ? tokenOf(here) : '~';
  });
  const spliced = (cell: string) => sorted.some((n) => tokenOf(n).includes(cell));
  return [
    `&bass over=&harm step=${grid.tap} ${tokens.join(' ')}`,
    ...(spliced('&bassNext') ? ['&bassNext over=&harm[>>] 0'] : []),
    ...(spliced('&bassRoot') ? ['&bassRoot over=&harm 0'] : []),
    ...BASS_VOICE,
  ].join('\n');
}

/** Whether a filed fragment is a bass line: associated as one at some point. */
const isLine = ({ fragment }: LearnedLayer['filed'][number]) =>
  fragment.association.some((p) => p.facet === BASS_FACET);

/** A meter's key in the caches: its cycle and pulses. */
const meterKey = (meter: Meter) => `${meter.cycle}:${meter.heights.join(' ')}`;

/** A repository of these lines, ranked by cells' query on the facet `bass` and read by `read` (cells', unless a test counts them). */
export function lineRepository(
  fragments: readonly Fragment[] = BASS_FRAGMENTS,
  read: (text: string, meter: Meter) => LineRead | null = readLine,
): LineRepository {
  // (the lines with cells' meters beside them, which a line query never ranks, its facet theirs alone: so a line and
  // the meter it was kept with count as used together)
  const cells = createRepository([...fragments, ...METER_FRAGMENTS]);
  const texts = new Map(fragments.map((f) => [f.id, f.text]));
  const textOf = (id: string, layer?: LearnedLayer) =>
    texts.get(id) ?? layer?.filed.find((f) => f.fragment.id === id)?.fragment.text;
  // (every read and every line's variations on a meter, by text: kept for the repository's life)
  const reads = new Map<string, LineRead | null>();
  const varied = new Map<string, readonly Variation[]>();
  const readText = (text: string, meter: Meter) => {
    const key = `${text}\n${meterKey(meter)}`;
    if (!reads.has(key)) reads.set(key, read(text, meter));
    return reads.get(key)!;
  };
  const variationsOn = (text: string, name: MeterName) => {
    const key = `${name}\n${text}`;
    if (!varied.has(key))
      varied.set(
        key,
        variations(text, { workbench: readingBench(name), operators: PITCHED_OPERATORS }),
      );
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
          facet: BASS_FACET,
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
          ...ids.map((id) => ({ id, point, facet: BASS_FACET })),
          ...alongside.map((id) => ({ id })),
        ]),
      ),
    file(layer, { notes, bench, point, source, created, tags, varies, by }) {
      const text = lineText(notes, stepsOf(bench.meter));
      const filed = fileFragment(cells, layer, {
        text,
        point,
        facet: BASS_FACET,
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

/** Every bench a section can ask on: the rhythms' (`RHYTHM_BENCHES`); a line reads by its meter alone. */
export const LINE_BENCHES: readonly Bench[] = RHYTHM_BENCHES;

/** Cells' bass lines, as the composer asks them. */
export const BASS_REPOSITORY: LineRepository = lineRepository();
