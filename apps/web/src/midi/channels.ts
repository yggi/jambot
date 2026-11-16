/**
 * The band's channels and drum notes as Jambot keeps them: one channel per
 * part (L6), and the output note each drum sound goes out as. Plain data and
 * two helpers; where a note goes out is `audio/band-output.ts`'s, through
 * webmidi's `MidiOut`, and a device's map is webmidi's `DrumMap`
 * (`midi/drums.ts` turns one into the other).
 */

import type { DrumSound, Part } from '@jambot/engine';
import { DRUM_NOTES } from '@jambot/engine';

/** One channel per part (L6): the pad and the stab default to the same one. */
export type Channels = Readonly<Record<Part, number>>;

/** The channel each part goes out on at one output: a part not routed there is absent, and sends nothing. */
export type PartChannels = Readonly<Partial<Record<Part, number>>>;

export const DEFAULT_CHANNELS: Channels = { lead: 1, bass: 2, pad: 3, stab: 3, drums: 10 };

/** The output note each drum sound sends, keyed as `DRUM_NOTES` is: GM by default. */
export type DrumNotes = Readonly<Record<DrumSound, number>>;

export const DEFAULT_DRUM_NOTES: DrumNotes = DRUM_NOTES;

/** A 1–16 MIDI channel to its 0–15 status-byte nibble, wrapping rather than throwing. */
export const nibble = (channel: number) => (channel - 1) & 15;
