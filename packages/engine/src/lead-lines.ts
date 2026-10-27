/**
 * Lead lines, as the composer asks them (#424): what the Muse files of a
 * lead (`muse-lead.ts`), stated as cells text (`leadText`) and read by
 * cells' compiler back into a bar's notes (`readLead`), ranked by cells'
 * own `query` on the facet `lead` (the loop's repository, `line-repository.ts`).
 * Cells holds no seed lead lines yet, so every line is one the layer filed:
 * with nothing filed, the composer finds none and the lead plays its own.
 *
 * A line is one bar of degrees of the key (`over=&key`) counted from its
 * first note, as the Muse hears a motif (U4), on the coarsest of the bar's
 * grids its notes fall on: each note a step of that grid, a rest `~`, a
 * note off the key with its accidental (`3b`, cells decision 015). What it
 * says is where each note starts and what it is; the lead holds each to the
 * next, as it plays every motif, so a line keeps no lengths and no rests
 * inside it. Its voice and card are `LEAD_VOICE`, this module's one place
 * for them. A line is read on a workbench of the meter and a key that
 * nothing reads but its hole (`leadBench`): any key serves, since what is
 * read is a degree, not a pitch.
 *
 * A line is varied by cells' vary (yggi/cells decision 052, rung 2) with
 * the lead's own four variations, each one of cells' operators: lift, every
 * note two degrees up (`transpose`, by 2); turn over, every note mirrored
 * about the first (`invert`); bend the last note 1 or 2 degrees either side
 * of the note before it (`bend`); and drop it, the note before held
 * (`trim`; cells v0.10.1, yggi/cells#267). A line a player bent off the
 * key is varied too, its accidental moved with its note: cells reads a
 * line with an accidental since v0.11 (yggi/cells#268, #272).
 */

import type { Meter, MeterName } from '@jambot/theory';
import { stepsOf } from '@jambot/theory';
import { compileSource } from '@yggi/cells/engine/compile';
import { flatten } from '@yggi/cells/engine/flatten';
import { codeShifts } from '@yggi/cells/engine/program';
import type { Operator } from '@yggi/cells/engine/vary/index';
import { tapWhole } from '@yggi/cells/engine/vary/lines';
import { unionOf } from '@yggi/cells/repository/fit';
import type { Fragment } from '@yggi/cells/repository/fragments';
import { LEAD_FACET, type LeadNote, type LeadRead, type LeadRepository } from './lead-query.ts';
import { gridOf, lineRepositoryOf, nameOf } from './line-repository.ts';

/**
 * Where a filed lead line's voice and card come from: the lead's voice, its register's floor the lead moves from
 * (`C4`, the bottom of `LEAD_RANGE`), and its card on Jambot's lead channel, 1. The one place this module states them.
 */
export const LEAD_VOICE: readonly string[] = [
  '&leadV loop=C4',
  '&leadOut map=midi(1) [&lead * &leadV]',
];

/** The operators the composer varies a lead line by: lift (`transpose` by 2), turn over (`invert`), bend the last note (`bend`) and drop it (`trim`). */
export const LEAD_OPERATORS: readonly Operator[] = ['transpose', 'invert', 'bend', 'trim'];

/** How far lift moves a line: two degrees up, as the lead's own lift does (`lead.ts`). */
export const LIFT = 2;

/** The workbench a line is read and varied on: the meter, and a key, so its hole is filled. */
export const leadBench = (name: MeterName): string =>
  [`&bar meter("${name}") step=120bpm`, '&key scale(ionian, C)'].join('\n');

/** A note's token: its degree, and its accidental as `#` or `b`, one a semitone. */
const tokenOf = ({ degree, alter }: LeadNote): string =>
  `${degree}${(alter > 0 ? '#' : 'b').repeat(Math.abs(alter))}`;

/**
 * A bar's lead line as cells text, open on its meter and its key (no `&bar`,
 * no key): its notes as degrees of the key on the coarsest grid they fall
 * on, and `LEAD_VOICE`. It reads back as the notes it was stated from
 * (`readLead`, the round trip).
 */
export function leadText(notes: readonly LeadNote[], steps: number): string {
  const sorted = [...notes].sort((a, b) => a.step - b.step);
  const grid = gridOf(
    sorted.map((n) => n.step),
    steps,
  );
  const tokens = Array.from({ length: steps / grid.length }, (_, i) => {
    const here = sorted.find((n) => n.step === i * grid.length);
    return here ? tokenOf(here) : '~';
  });
  return [`&lead over=&key step=${grid.tap} ${tokens.join(' ')}`, ...LEAD_VOICE].join('\n');
}

/**
 * A lead line's notes under a meter: each note's step on the bar's steps
 * (its grid step's onset, in whole notes, over a step's), its degree of the
 * key and its accidental, from cells' flattening of `&lead`. Null where the
 * meter has no name in cells, the text doesn't compile on the workbench, a
 * note reads other than the key unmoved, its lap is no whole number of
 * bars, or a note falls off the steps.
 */
export function readLead(text: string, meter: Meter): LeadRead | null {
  const name = nameOf(meter);
  if (!name) return null;
  const result = compileSource(unionOf(text, leadBench(name)).text);
  if (!result.ok) return null;
  const cell = result.cells.get('lead');
  if (!cell?.step) return null;
  const cellMeter = result.cells.get(cell.step.driver)?.meter ?? null;
  const whole = tapWhole(cell.step.tap, cellMeter);
  if (whole === null || !cellMeter) return null;
  const steps = stepsOf(meter);
  const perStep = cellMeter.pulses / cellMeter.unit / steps;
  const lap = (cell.steps * whole) / (perStep * steps);
  if (Math.abs(lap - Math.round(lap)) > 1e-9 || Math.round(lap) < 1) return null;
  const bars = Math.round(lap);
  const notes: LeadNote[] = [];
  for (const e of flatten(result, 'lead', codeShifts(result))) {
    if (e.table !== 'key' || e.via || e.tableShift !== 0 || (e.transpose ?? 0) !== 0) return null;
    const at = (e.step * whole) / perStep;
    const step = Math.round(at);
    if (Math.abs(at - step) > 1e-6 || step < 0 || step >= bars * steps) return null;
    // (`+ 0`: an inversion mirrors a 0 to -0)
    notes.push({ step, degree: e.value + 0, alter: e.alter + 0 });
  }
  if (!notes.length) return null;
  return { bars, notes: notes.sort((a, b) => a.step - b.step) };
}

/** A repository of lead lines, ranked by cells' query on the facet `lead` and read by `read` (cells', unless a test counts them). */
export function leadRepository(
  fragments: readonly Fragment[] = [],
  read: (text: string, meter: Meter) => LeadRead | null = readLead,
): LeadRepository {
  return lineRepositoryOf<LeadNote>({
    facet: LEAD_FACET,
    fragments,
    read,
    text: leadText,
    vary: (name) => ({ workbench: leadBench(name), operators: LEAD_OPERATORS, degrees: [LIFT] }),
  });
}

/** The lead lines the layer files, as the composer asks them. */
export const LEAD_REPOSITORY: LeadRepository = leadRepository();
