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
 *
 * The repository itself, its query, filing, uses and warming, is the one
 * every member's lines share (`line-repository.ts`); this module says only
 * what a bass line is.
 */

import { type Meter, type MeterName, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { compileSource } from '@yggi/cells/engine/compile';
import { flatten } from '@yggi/cells/engine/flatten';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { codeShifts } from '@yggi/cells/engine/program';
import { PITCHED_OPERATORS } from '@yggi/cells/engine/vary/index';
import { linesOf } from '@yggi/cells/engine/vary/lines';
import { BASS_FRAGMENTS } from '@yggi/cells/repository/bass';
import { unionOf } from '@yggi/cells/repository/fit';
import type { Fragment } from '@yggi/cells/repository/fragments';
import { BASS_FACET, type LineNote, type LineRead, type LineRepository } from './bass-query.ts';
import type { Bench } from './facet.ts';
import { gridOf, lineRepositoryOf, nameOf } from './line-repository.ts';
import { withInstruments } from './instruments.ts';
import { RHYTHM_BENCHES } from './rhythms.ts';
import { stepSeconds } from './tempo.ts';

/** The tempo a line is read at: any, since it is open on its tempo. */
const READ_AT = 120;

/**
 * A filed line's card: the line through the bass's voice on Jambot's bass channel, 2, as cells' seed lines write it.
 * The voice is a hole cells' `bass` instrument fills (`&bassV loop=C2`, its register's floor the performer moves from;
 * yggi/cells#260), which a line is read with (`withInstruments`). The one place this module states the card.
 */
export const BASS_VOICE: readonly string[] = ['&bassOut map=midi(2) [&bass * &bassV]'];

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
  const source = unionOf(withInstruments(text), readingBench(name)).text;
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

/** A repository of these lines, ranked by cells' query on the facet `bass` and read by `read` (cells', unless a test counts them). */
export function lineRepository(
  fragments: readonly Fragment[] = BASS_FRAGMENTS,
  read: (text: string, meter: Meter) => LineRead | null = readLine,
): LineRepository {
  return lineRepositoryOf<LineNote>({
    facet: BASS_FACET,
    fragments,
    read,
    text: lineText,
    vary: (name) => ({ workbench: readingBench(name), operators: PITCHED_OPERATORS }),
  });
}

/** Every bench a section can ask on: the rhythms' (`RHYTHM_BENCHES`); a line reads by its meter alone. */
export const LINE_BENCHES: readonly Bench[] = RHYTHM_BENCHES;

/** Cells' bass lines, as the composer asks them. */
export const BASS_REPOSITORY: LineRepository = lineRepository();
