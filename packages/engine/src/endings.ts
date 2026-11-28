/**
 * Cells' endings, as the band finds the one it closes a song on (#646): the
 * fragments of the facet `ending` (yggi/cells#720, #922), each a song's last
 * bar and its ring written as heads, `&cadence` (the chords), `&finaleBass`,
 * `&finalePad`, `&finaleLead` and `&finaleDrums`: Jambot's finale, the stop on
 * the one, the tierce de Picardie, the amen, the blues' seventh, the held
 * drone. Found at the style as every member's fragments are, drawn among those
 * on offer (`drawnOnOffer`, #540). The band plays a found ending through its
 * performers (`finale`, `ending.ts`): its chords, its rhythm and its pitch
 * classes, each part voiced from where it was, as the band's own finale is;
 * that one plays only on a miss.
 *
 * A fragment is read once for each mode and meter, on a workbench of a key on
 * C at the reading tempo, each head through a MIDI card of its own: its notes
 * as steps of the bar and semitones above the tonic, and its drums as hits.
 */

import { type Meter, stepsOf } from '@jambot/theory';
import { planOf } from '@yggi/cells';
import { LIBRARY, resolveSeed } from '@yggi/cells/library';
import { notesOf } from '@yggi/cells/midi';
import { createRepository } from '@yggi/cells/repository';
import { drawnOnOffer } from './facet.ts';
import type { ComposerMode } from './key.ts';
import { facetFragments } from './library.ts';
import { nameOf } from './line-repository.ts';
import { MISS_DISTANCE, type StylePoint } from './meter-query.ts';
import type { FragmentHit } from './rhythm-query.ts';
import { readDrums } from './rhythms.ts';
import { stepSeconds } from './tempo.ts';

/** The facet cells files the endings under. */
export const ENDING_FACET = 'ending';

/** Cells' endings: the library's fragments of the facet `ending`. */
export const ENDING_FRAGMENTS = facetFragments(ENDING_FACET);

/** A note of an ending: its step in the bar, how many steps it sounds (past the bar, its ring), and its semitones above the tonic. */
export interface EndingNote {
  readonly step: number;
  readonly length: number;
  readonly offset: number;
}

/** An ending read: its chords' notes, each part's, and its drums. */
export interface EndingRead {
  readonly cadence: readonly EndingNote[];
  readonly bass: readonly EndingNote[];
  readonly pad: readonly EndingNote[];
  readonly lead: readonly EndingNote[];
  /** Its drums, or null where they don't read in the meter (a grid of steps it lacks). */
  readonly drums: readonly FragmentHit[] | null;
}

/** The heads an ending writes each part as. */
const HEADS = {
  cadence: 'cadence',
  bass: 'finaleBass',
  pad: 'finalePad',
  lead: 'finaleLead',
} as const;

/** The tempo an ending is read at, and the note its key's tonic sounds on there (the card's voice loops on C3). */
const READ_AT = 120;
const TONIC = 48;

const texts = new Map(LIBRARY.map((f) => [f.id, f.text]));
const reads = new Map<string, EndingRead | null>();

/** A head's notes, read through a card of its own; null where it doesn't compile or a note falls off the steps. */
function headNotes(
  lines: readonly string[],
  bench: string,
  head: string,
  step: number,
  to: number,
): EndingNote[] | null {
  const source = [
    bench,
    ...lines,
    '&endV s=sine loop=C3',
    `&endOut play=&${head} &endV`,
    '&endMidi map=midi ~ &endOut',
  ];
  const plan = planOf(source.join('\n'), undefined, { resolve: resolveSeed });
  const notes: EndingNote[] = [];
  for (const n of notesOf(plan, { to })) {
    const at = n.at / step;
    const length = (n.end - n.at) / step;
    if (Math.abs(at - Math.round(at)) > 1e-6) return null;
    notes.push({ step: Math.round(at), length: Math.round(length), offset: n.note - TONIC });
  }
  return notes.sort((a, b) => a.step - b.step || a.offset - b.offset);
}

/** An ending read over a key in a mode and a meter; null where it can't be read there. */
export function endingRead(id: string, mode: ComposerMode, meter: Meter): EndingRead | null {
  const name = nameOf(meter);
  const key = `${id} ${mode} ${name}`;
  if (reads.has(key)) return reads.get(key)!;
  const text = texts.get(id);
  let read: EndingRead | null = null;
  if (text !== undefined && name !== null) {
    try {
      const lines = text.split('\n').filter((line) => !/ from \(/.test(line));
      const bench = `&bar meter("${name}") step=${READ_AT}bpm\n&key scale(${mode}, C)`;
      const step = stepSeconds(READ_AT, meter);
      // (the final bar and the one its ring sounds into: a fragment's lap repeats past them)
      const to = 2 * stepsOf(meter) * step - 1e-9;
      const [cadence, bass, pad, lead] = (Object.values(HEADS) as string[]).map((head) =>
        headNotes(lines, bench, head, step, to),
      );
      const drums = readDrums(text, meter, `&key scale(${mode}, C)`);
      if (cadence?.length && bass && pad && lead)
        read = { cadence, bass, pad, lead, drums: drums?.hits ?? null };
    } catch {
      read = null;
    }
  }
  reads.set(key, read);
  return read;
}

const repository = createRepository(ENDING_FRAGMENTS);

/**
 * The ending a song closes on, asked where each section starts (#646): one cells finds at the style that reads over the
 * mode and meter, drawn among those on offer by `pick`, a draw in [0, 1), the nearer the likelier; none on a miss,
 * where the band plays its own finale.
 */
export function sectionEnding(
  point: StylePoint,
  mode: ComposerMode,
  meter: Meter,
  pick: number,
): string | undefined {
  const found = repository
    .query(point, ENDING_FRAGMENTS.length, {}, { facet: ENDING_FACET, reach: MISS_DISTANCE })
    .filter((f) => endingRead(f.fragment.id, mode, meter) !== null)
    .map((f) => ({ id: f.fragment.id, distance: f.distance }));
  return drawnOnOffer(found, pick)?.id;
}
