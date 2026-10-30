/**
 * Lead lines, as the composer asks them (#424): what the Muse files of a
 * lead (`muse-lead.ts`), stated as cells text (`leadText`) and read by
 * cells' compiler back into a bar's notes (`readLead`), ranked by cells'
 * own `query` on the facet `lead` (the loop's repository, `line-repository.ts`).
 * Its seeds are cells' motifs (`MOTIF_FRAGMENTS`, the facet `motif`, #520):
 * each read as a lead line (`motifLead`), its head renamed `&lead` and the
 * lead's voice beside it, at the point cells associates it with, so every
 * preset finds the motif written for it; away from them, and in a meter no
 * motif fills, the lead plays its own unless the layer filed one.
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
import { METERS, stepsOf } from '@jambot/theory';
import { compileSource } from '@yggi/cells/engine/compile';
import { flatten } from '@yggi/cells/engine/flatten';
import { codeShifts } from '@yggi/cells/engine/program';
import { type Operator, variations } from '@yggi/cells/engine/vary/index';
import { tapWhole } from '@yggi/cells/engine/vary/lines';
import { unionOf } from '@yggi/cells/repository/fit';
import type { Fragment } from '@yggi/cells/repository/fragments';
import { FORM_FRAGMENTS } from '@yggi/cells/repository/forms';
import { holesOf } from '@yggi/cells/repository/holes';
import { MOTIF_FRAGMENTS } from '@yggi/cells/repository/motifs';
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
 * bars, or a note falls off the steps. A line shorter than the bar is read
 * as the bar, a rest after it (`paddedLead`).
 */
export function readLead(text: string, meter: Meter): LeadRead | null {
  const name = nameOf(meter);
  if (!name) return null;
  const result = compileSource(unionOf(text, leadBench(name)).text);
  if (!result.ok) return null;
  const cell = result.cells.get('lead');
  if (!cell?.step) return null;
  const cellMeter = result.cells.get(cell.step.driver)?.meter ?? null;
  const { tap } = cell.step;
  const whole = tapWhole(tap, cellMeter);
  if (whole === null || !cellMeter || !tap || cell.steps < 1) return null;
  const steps = stepsOf(meter);
  const perStep = cellMeter.pulses / cellMeter.unit / steps;
  const lap = (cell.steps * whole) / (perStep * steps);
  if (lap < 1 - 1e-9) return paddedLead(text, meter, tap, cell.steps, lap);
  if (Math.abs(lap - Math.round(lap)) > 1e-9) return null;
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

/**
 * A line shorter than the bar, read as the bar: the line, then a rest to the bar's end, as a piece pads a motif into a
 * longer meter (`&leadline step=8n &diesIrae ~@2` in 5/4, yggi/cells examples/spooky.md). The line keeps its own cell
 * (`&leadLine`) and `&lead` plays it and the rest, on its tap; null where no whole number of its taps fills the bar.
 */
function paddedLead(
  text: string,
  meter: Meter,
  tap: string,
  taps: number,
  lap: number,
): LeadRead | null {
  const pad = taps / lap - taps;
  if (Math.abs(pad - Math.round(pad)) > 1e-9 || Math.round(pad) < 1) return null;
  const line = text.replace(/^&lead(?=\s)/m, '&leadLine');
  return readLead(`${line}\n&lead step=${tap} &leadLine ~@${Math.round(pad)}`, meter);
}

/** Cells' facet of a motif, a line a form moves and answers (#294). */
export const MOTIF_FACET = 'motif';

/**
 * A motif of cells' as a lead line (#520): its head (`&<id>`) renamed `&lead`, the lead's voice beside it
 * (`LEAD_VOICE`), and its association moved from the facet `motif` to `lead`, at the same points and weights. It is
 * stated from its first note, as every lead line is, by cells' transpose (`&diesIrae`'s `2 1 2 0 …` as `0 -1 0 -2 …`):
 * the lead plays a line from the chord tone nearest where it was (`lead.ts`), so that is what it plays, and what the
 * Muse would file of it. One that reads in no meter stays as cells wrote it.
 */
export function motifLead(motif: Fragment): Fragment {
  const head = new RegExp(`^&${motif.id}(?=\\s)`, 'm');
  const text = [motif.text.replace(head, '&lead'), ...LEAD_VOICE].join('\n');
  const name = (Object.keys(METERS) as MeterName[]).find((n) => readLead(text, METERS[n]));
  const first = name ? readLead(text, METERS[name])!.notes[0]!.degree : 0;
  const lift =
    name && first !== 0
      ? variations(text, {
          workbench: leadBench(name),
          operators: ['transpose'],
          degrees: [-first],
        })[0]
      : undefined;
  return {
    ...motif,
    text: lift ? lift.apply(text) : text,
    association: motif.association.map((a) =>
      a.facet === MOTIF_FACET ? { ...a, facet: LEAD_FACET } : a,
    ),
  };
}

/** Cells' motifs as lead lines: the lead repository's seeds. */
export const MOTIF_LEADS: readonly Fragment[] = MOTIF_FRAGMENTS.map(motifLead);

/** A repository of lead lines, ranked by cells' query on the facet `lead` and read by `read` (cells', unless a test counts them). */
export function leadRepository(
  fragments: readonly Fragment[] = MOTIF_LEADS,
  read: (text: string, meter: Meter) => LeadRead | null = readLead,
): LeadRepository {
  return {
    ...lineRepositoryOf<LeadNote>({
      facet: LEAD_FACET,
      fragments,
      read,
      text: leadText,
      vary: (name) => ({ workbench: leadBench(name), operators: LEAD_OPERATORS, degrees: [LIFT] }),
    }),
    phrase: (notes, meter) => phraseOf(notes, meter, LEAD_FORM),
  };
}

/** Cells' motifs and the lead lines the layer files, as the composer asks them. */
export const LEAD_REPOSITORY: LeadRepository = leadRepository();

/**
 * The form the lead plays a found line in (#520, rung 2): cells' `call and answer`, the call, then the call two degrees
 * down, the owner's ask (2026-10-29: "jambot should be able to do call and answer, like the electroswing example").
 * Named, not found: cells holds its four forms at the centre of style space and breaks the tie by id, so a query finds
 * AABA everywhere (yggi/cells#371); once each form has a point of its own, the lead asks for one.
 */
export const LEAD_FORM: Fragment = FORM_FRAGMENTS.find((f) => f.id === 'call and answer')!;

/** A form's head, the line it plays, and its hole, the line it moves and answers: `&phrase` and `&call` for the call and its answer. */
function formParts(form: Fragment): { readonly head: string; readonly hole: string } | null {
  const head = /^&(\w+)/m.exec(form.text)?.[1];
  const hole = holesOf(form.text, compileSource).lines[0];
  return head && hole ? { head, hole } : null;
}

/** Every phrase read, by form, meter and line: kept for the module's life, as a repository keeps its reads. */
const phrases = new Map<string, LeadRead | null>();

/**
 * A lead line's notes played in a form under a meter (#520, rung 2): the line as the form's hole, on the bar's eighths
 * (the forms tap the host's meter by the eighth, `step=8n`, and splice their hole at that rate), and the form as
 * `&lead`, read by cells' compiler (`readLead`) over the bars it plays: the call and its answer two bars, each note a
 * degree from the line's first, the answer two below. Null where a note falls between the bar's eighths (a line on
 * sixteenths, which a form would play at half speed), the bar has no whole number of eighths, or cells can't read it.
 */
export function phraseOf(
  notes: readonly LeadNote[],
  meter: Meter,
  form: Fragment,
): LeadRead | null {
  const steps = stepsOf(meter);
  if (steps % 2 !== 0 || notes.some((n) => n.step % 2 !== 0 || n.step >= steps)) return null;
  const tokens = Array.from({ length: steps / 2 }, (_, i) => {
    const here = notes.find((n) => n.step === 2 * i);
    return here ? tokenOf(here) : '~';
  });
  const key = `${form.id}\n${meter.cycle}:${meter.heights.join(' ')}\n${tokens.join(' ')}`;
  if (!phrases.has(key)) {
    const parts = formParts(form);
    phrases.set(
      key,
      parts &&
        readLead(
          [
            form.text,
            `&leadCall over=&key step=8n ${tokens.join(' ')}`,
            `&${parts.hole.slice(1)} step=8n &leadCall`,
            `&lead step=8n &${parts.head}`,
          ].join('\n'),
          meter,
        ),
    );
  }
  return phrases.get(key)!;
}
