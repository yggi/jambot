/**
 * Reading one voice of the band alone (#15, step 4).
 *
 * The band's parts are five, and a reading of the whole bar (`readStyle`)
 * hides which of them says what. A voice is a part read on its own, the
 * pad and stab together as the comp since they play one harmony: `drums`,
 * `bass`, `comp`, `lead`. A voice's reading has the axes the voice can say:
 * its density (its share of the bar's steps, 16 in 4/4, so 0 to 1 by itself), its
 * `sync`, the `artic` of the bass and lead, and the `harm` of the comp. A
 * fill then has a distance from the style of its own, which licence
 * feedback reads (#237).
 *
 * The distance is taken from a landmark, where the voice reads at a
 * style, since each voice reads short of the axes as the whole bar does
 * (E23, E26).
 *
 * Pure: it counts steps and pitch classes and knows no clock, file or key.
 */

import { readHarm } from './chord-reading.ts';
import type { Meter } from '@jambot/theory';
import { type Part, SONG_METER } from './events.ts';
import { type Sounding, readStyle } from './style-reading.ts';

export const VOICES = ['drums', 'bass', 'comp', 'lead'] as const;
export type Voice = (typeof VOICES)[number];

/** The voice a part belongs to: the pad and the stab are the comp. */
export const voiceOf = (part: Part): Voice => (part === 'pad' || part === 'stab' ? 'comp' : part);

/** What one voice's notes say, on the axes it can say. */
export interface VoiceReading {
  /** Its share of the bar's 16 steps with an onset, 0 to 1. */
  readonly density: number;
  readonly sync?: number;
  /** The bass's and the lead's. */
  readonly artic?: number;
  /** The comp's. */
  readonly harm?: number;
}

/** A voice's notes alone, out of a bar's notes (the comp reads with its bass, for the chord's root). */
export function readVoice(
  voice: Voice,
  notes: readonly (Sounding & { note?: number })[],
  meter: Meter = SONG_METER,
): VoiceReading {
  const own = notes.filter((n) => voiceOf(n.part) === voice);
  const { density, sync, artic } = readStyle(own, meter);
  const harm =
    voice === 'comp'
      ? readHarm(notes.filter((n) => voiceOf(n.part) === 'comp' || n.part === 'bass'))?.harm
      : undefined;
  return {
    density,
    ...(sync === undefined ? {} : { sync }),
    ...(artic === undefined || (voice !== 'bass' && voice !== 'lead') ? {} : { artic }),
    ...(harm === undefined ? {} : { harm }),
  };
}

/** Where a voice reads at a style: the axes of a reading, each a number. */
export type VoiceLandmark = Readonly<Record<'density', number>> &
  Partial<Record<'sync' | 'artic' | 'harm', number>>;

const AXES = ['density', 'sync', 'artic', 'harm'] as const;

/** The root mean square of the differences over the axes the reading and the landmark both have. */
export function partDistance(read: VoiceReading, landmark: VoiceLandmark): number {
  const shared = AXES.filter((axis) => read[axis] !== undefined && landmark[axis] !== undefined);
  if (shared.length === 0) return 0;
  return Math.sqrt(
    shared.reduce((sum, axis) => sum + (read[axis]! - landmark[axis]!) ** 2, 0) / shared.length,
  );
}
