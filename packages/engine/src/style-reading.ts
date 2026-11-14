/**
 * Reading a style from notes: the critic's first slice (#15, step 1), cells' reader on Jambot's notes and meters.
 *
 * The reader is cells' (`@yggi/cells/engine/reading/style`, yggi/cells#541), lifted from this file: a bar's sounding notes read as `sync`, `bite` and the density, one axis at a time, by rule, and the clock's steps as the tempo (`readTiming`).
 * Its `bite` is the style's `artic` (`CELLS_AXIS`), and `genre.ts` reads it onto that axis.
 * What is Jambot's here: a note as the band sounds it (`BandBar.dough`, where the lengths are the performer's gate, T4, E23), and a bar as its meter's (#260), the song's 4/4 where none is given.
 *
 * Pure: it counts steps and knows no file or key.
 */

import { type Meter, meterOnSteps, stepsOf } from '@jambot/theory';
import {
  type Bar,
  type StyleReading,
  readStyle as readBar,
} from '@yggi/cells/engine/reading/style';
import { type DoughNote, SONG_METER } from './events.ts';

export {
  type StyleReading,
  type TimingReading,
  readTiming,
} from '@yggi/cells/engine/reading/style';

/** What a reading needs of a note: where it starts, in which part, how long it sounds, and its pitch where it reads one. */
export type Sounding = Pick<DoughNote, 'part' | 'step' | 'length'> &
  Partial<Pick<DoughNote, 'note'>>;

/** A meter's bar as cells' reader counts it: its steps, and the steps its pulses start on. */
export const readingBar = (meter: Meter): Bar => ({
  steps: stepsOf(meter),
  pulses: meterOnSteps(meter).heights,
});

/** The style a bar's sounding notes read as, in its meter's bar (cells' `readStyle`). */
export function readStyle(notes: readonly Sounding[], meter: Meter = SONG_METER): StyleReading {
  return readBar(notes, readingBar(meter));
}
