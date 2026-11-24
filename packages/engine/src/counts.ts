/**
 * Cells' counts, as the drummer counts a song in (#646): the fragments of the
 * facet `count` (yggi/cells#720, #904), a click track from the meter, a click
 * on every beat as strong as the meter's grouping makes it, on the sound the
 * style counts on: the sticks (`stick_count`), the hi-hat's pedal
 * (`hat_count`), the claves (`clave_count`), or the wood block where no
 * drummer would count (`click`). A count plays every bar; the count-in is its
 * first, before the song's. Found at the style the song opens at, the nearest;
 * on a miss, cells' `click` by its name, the metronome's own.
 */

import { type Meter, stepsOf } from '@jambot/theory';
import { planOf } from '@yggi/cells';
import { LIBRARY, resolveSeed } from '@yggi/cells/library';
import { notesOf } from '@yggi/cells/midi';
import { createRepository } from '@yggi/cells/repository';
import { facetFragments } from './library.ts';
import { nameOf } from './line-repository.ts';
import { MISS_DISTANCE, type StylePoint } from './meter-query.ts';
import { stepSeconds } from './tempo.ts';

/** The facet cells files the counts under. */
export const COUNT_FACET = 'count';

/** Cells' counts: the library's fragments of the facet `count`. */
export const COUNT_FRAGMENTS = facetFragments(COUNT_FACET);

/** The count on a miss: cells' click from the meter, on the wood block. */
export const DEFAULT_COUNT = 'click';

/** A click of a count: its step in the bar, the drum it strikes, and how hard, 0 to 1. */
export interface CountHit {
  readonly step: number;
  readonly note: number;
  readonly velocity: number;
}

/** The tempo a count is read at. */
const READ_AT = 120;

const texts = new Map(LIBRARY.map((f) => [f.id, f.text]));
const reads = new Map<string, readonly CountHit[] | null>();

/**
 * A count's bar under a meter: a click on each beat at its accent; null where it can't be read there or plays nothing.
 * Read through a MIDI card of its own, as cells plays it: a count is its clicks played at the meter's accents
 * (`[&clicks * &accent]`), a product of lines a reading of hits alone doesn't take.
 */
export function countHits(id: string, meter: Meter): readonly CountHit[] | null {
  const name = nameOf(meter);
  const key = `${id} ${name}`;
  if (!reads.has(key)) {
    const text = texts.get(id);
    let read: CountHit[] | null = null;
    if (text !== undefined && name !== null) {
      try {
        const lines = text.split('\n').filter((line) => !/ from \(/.test(line));
        const source = [
          `&bar meter("${name}") step=${READ_AT}bpm`,
          ...lines,
          '&countMidi map=midi ~ &count',
        ];
        const step = stepSeconds(READ_AT, meter);
        const notes = notesOf(planOf(source.join('\n'), undefined, { resolve: resolveSeed }), {
          to: stepsOf(meter) * step - 1e-9,
        });
        read = notes.map((n) => ({
          step: Math.round(n.at / step),
          note: n.note,
          velocity: n.velocity / 127,
        }));
      } catch {
        read = null;
      }
    }
    reads.set(key, read?.length ? read : null);
  }
  return reads.get(key)!;
}

const repository = createRepository(COUNT_FRAGMENTS);

/** The count a song opening at a point counts in on, in its opening meter: the nearest that reads there, else `DEFAULT_COUNT`. */
export function countAt(point: StylePoint, meter: Meter): string {
  const [found] = repository
    .query(point, COUNT_FRAGMENTS.length, {}, { facet: COUNT_FACET, reach: MISS_DISTANCE })
    .filter((f) => countHits(f.fragment.id, meter) !== null);
  return found?.fragment.id ?? DEFAULT_COUNT;
}
