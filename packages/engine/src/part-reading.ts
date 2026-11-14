/**
 * Reading one voice of the band alone (#15, step 4): cells' reader (`@yggi/cells/engine/reading/voice`, yggi/cells#541), lifted from this file, on Jambot's meters.
 *
 * A voice is a part read on its own, the pad and the stab together as the comp: `drums`, `bass`, `comp`, `lead`.
 * Its reading has the axes it can say: its density, its `sync`, the `bite` of the bass and the lead, and the `harm` of the comp.
 * A fill then has a distance (`partDistance`) from a landmark where the voice reads at a style, which licence feedback reads (#237, E26).
 * What is Jambot's here: the bar is its meter's (`readingBar`), the song's 4/4 where none is given.
 *
 * Pure: it counts steps and pitch classes and knows no clock, file or key.
 */

import type { Meter } from '@jambot/theory';
import {
  type Voice,
  type VoiceReading,
  readVoice as readVoiceInBar,
} from '@yggi/cells/engine/reading/voice';
import { SONG_METER } from './events.ts';
import { type Sounding, readingBar } from './style-reading.ts';

export {
  VOICES,
  type Voice,
  type VoiceLandmark,
  type VoiceReading,
  partDistance,
  voiceOf,
} from '@yggi/cells/engine/reading/voice';

/** A voice's notes alone, out of a bar's notes, in its meter's bar (cells' `readVoice`). */
export function readVoice(
  voice: Voice,
  notes: readonly Sounding[],
  meter: Meter = SONG_METER,
): VoiceReading {
  return readVoiceInBar(voice, notes, readingBar(meter));
}
