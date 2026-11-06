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
 * A line is one bar of degrees of the key (`over=&key`): a motif of cells'
 * on its own degrees as written, which the lead plays from there (`keyed`,
 * #529); a line the Muse files counted from its first note, as she hears a
 * motif (U4). Each is stated on the coarsest of the bar's
 * grids its notes fall on: each note a step of that grid, a rest `~`, a
 * note off the key with its accidental (`3b`, cells decision 015). What it
 * says is where each note starts and what it is; the lead holds each to the
 * next, as it plays every motif, so a line keeps no lengths and no rests
 * inside it. A line is the line alone, as cells writes a motif (yggi/cells#291)
 * and the Muse files a bass line: no voice and no card, since what it sounds
 * on is an instrument, cells' `lead` fragment (`instruments.ts`), and where
 * its notes go is the performer's (#580, rung 1). A line filed before then
 * carried the lead's voice and card (`RETIRED_LEAD_VOICE`), which a kept
 * layer drops on load (`leadsAlone`). A line is read on a workbench of the
 * meter and a key that nothing reads but its hole (`leadBench`): any key
 * serves, since what is read is a degree, not a pitch.
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
import { bodyOf } from '@yggi/cells/engine/use';
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
import type { LearnedLayer } from './layer.ts';
import { gridOf, lineRepositoryOf, nameOf } from './line-repository.ts';

/**
 * The lead's voice and card a filed lead line carried before #580 (rung 1): its register's floor (`C4`) and its card
 * on Jambot's lead channel, 1. A line no longer carries them, its instrument a fragment of cells' (`lead`); a layer kept
 * before reads without them (`leadsAlone`).
 */
export const RETIRED_LEAD_VOICE: readonly string[] = [
  '&leadV loop=C4',
  '&leadOut map=midi(1) [&lead * &leadV]',
];

/** A lead line's text without the voice and card it carried before #580 (`RETIRED_LEAD_VOICE`); any other text as it is. */
export function leadAlone(text: string): string {
  const lines = text.split('\n');
  const kept = lines.filter((line) => !RETIRED_LEAD_VOICE.includes(line.trim()));
  return kept.length === lines.length ? text : kept.join('\n');
}

/**
 * A kept layer's lead lines without the voice and card they carried before #580 (`leadAlone`), so a line heard again
 * is known by its text (cells' `fileFragment` finds a held one by its text) and filed once. A layer with none is
 * returned as it is.
 */
export function leadsAlone(layer: LearnedLayer): LearnedLayer {
  const alone = (file: LearnedLayer['filed'][number]) => {
    const text = leadAlone(file.fragment.text);
    return text === file.fragment.text ? file : { ...file, fragment: { ...file.fragment, text } };
  };
  const filed = layer.filed.map(alone);
  return filed.every((file, i) => file === layer.filed[i]) ? layer : { ...layer, filed };
}

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
 * on, and nothing else, no voice and no card (#580). It reads back as the
 * notes it was stated from (`readLead`, the round trip).
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
  return `&lead over=&key step=${grid.tap} ${tokens.join(' ')}`;
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
 * A motif of cells' as a lead line (#520): its head (`&<id>`) renamed `&lead`, with no voice beside it, as the Muse
 * files a line (#580), and its association moved from the facet `motif` to `lead`, at the same points and weights. It keeps
 * its degrees of the key as written (#529: `&diesIrae`'s `2 1 2 0 …` starts on the third), since a motif written in
 * cells sets its place in the key, and the lead plays it from there (`keyed`, `lead.ts`).
 */
export function motifLead(motif: Fragment): Fragment {
  const head = new RegExp(`^&${motif.id}(?=\\s)`, 'm');
  // (its body: a template's signature line, `&hook from &key`, says what it takes, which the lead's bench gives)
  const text = bodyOf(motif.text).replace(head, '&lead');
  return {
    ...motif,
    text,
    association: motif.association.map((a) =>
      a.facet === MOTIF_FACET ? { ...a, facet: LEAD_FACET } : a,
    ),
  };
}

/** Every line stated from its first note, by text: kept for the module's life. */
const fromFirst = new Map<string, string>();

/**
 * A lead line stated from its first note (#529), as the Muse hears a motif (U4) and the homeostat's sensor reads a bar
 * (`leadOf`): by cells' transpose, so `&diesIrae`'s `2 1 2 0 …` reads `0 -1 0 -2 …`. A line already from 0, as the
 * Muse files them, and one that reads in no meter stay as they are. The recogniser's library is the lead's lines so
 * stated (`recognised.ts`), so a keyed line is known by its shape, whatever degree it starts on.
 */
export function fromFirstNote(line: Fragment): Fragment {
  if (!fromFirst.has(line.text)) {
    const name = (Object.keys(METERS) as MeterName[]).find((n) => readLead(line.text, METERS[n]));
    const first = name ? readLead(line.text, METERS[name])!.notes[0]!.degree : 0;
    const lift =
      name && first !== 0
        ? variations(line.text, {
            workbench: leadBench(name),
            operators: ['transpose'],
            degrees: [-first],
          })[0]
        : undefined;
    fromFirst.set(line.text, lift ? lift.apply(line.text) : line.text);
  }
  return { ...line, text: fromFirst.get(line.text)! };
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
    keyed: (id, layer) => keyedLine(fragments, id, layer),
  };
}

/**
 * Whether a lead line keeps its degrees of the key as written (#529): one of the seeds, cells' motifs, or a variation
 * the composer made of one (`varies`, through every variation between), since cells' operators keep a line's degrees.
 * A line the Muse filed is heard from its first note, which a player sets no degree for (U4), and so is any variation
 * of it; so is a line neither the seeds nor the layer hold.
 */
export function keyedLine(seeds: readonly Fragment[], id: string, layer?: LearnedLayer): boolean {
  const seen = new Set<string>();
  for (let at: string | undefined = id; at !== undefined && !seen.has(at);) {
    if (seeds.some((f) => f.id === at)) return true;
    seen.add(at);
    const varies: unknown = layer?.filed.find((f) => f.fragment.id === at)?.meta['varies'];
    at = typeof varies === 'string' ? varies : undefined;
  }
  return false;
}

/** Cells' motifs and the lead lines the layer files, as the composer asks them. */
export const LEAD_REPOSITORY: LeadRepository = leadRepository();

/**
 * The form the lead plays a found line in (#520, rung 2): cells' `call_and_answer`, the call, then the call two degrees
 * down, the owner's ask (2026-10-29: "jambot should be able to do call and answer, like the electroswing example").
 * Named, not found: cells holds its four forms at the centre of style space and breaks the tie by id, so a query finds
 * AABA everywhere (yggi/cells#371); once each form has a point of its own, the lead asks for one.
 */
export const LEAD_FORM: Fragment = FORM_FRAGMENTS.find((f) => f.id === 'call_and_answer')!;

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
