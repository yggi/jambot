/**
 * The drum notes two ways: as webmidi keeps them, a `DrumMap` from the
 * General MIDI note the engine writes for a drum sound to the note a device
 * is sent, and as `MidiOut` takes them, the note each of Jambot's drum
 * sounds goes out as (`DrumNotes`). A device's map is its profile's
 * (`DeviceProfile.drums`), kept by its port's name in the book of setups.
 */

import { DRUM_NOTES, type DrumSound } from '@jambot/engine';
import { DRUM_PRESETS, type DrumMap, deviceNote } from '@yggi/webmidi/core';
import type { DrumNotes } from '../audio/midi-out.ts';

export const DRUM_SOUNDS = Object.keys(DRUM_NOTES) as readonly DrumSound[];

/** The note each drum sound goes out as under a map: what `MidiOut` takes, until note out is webmidi's too. */
export const drumNotesOf = (map: DrumMap): DrumNotes =>
  Object.fromEntries(
    DRUM_SOUNDS.map((sound) => [sound, deviceNote(map, DRUM_NOTES[sound])]),
  ) as DrumNotes;

/** The sounds `notes` names: all of them, but a save from before the clap (#508) names no clap. */
const soundsIn = (notes: Partial<DrumNotes>) => DRUM_SOUNDS.filter((s) => notes[s] !== undefined);

const sameNotes = (a: DrumNotes, b: Partial<DrumNotes>) => soundsIn(b).every((s) => a[s] === b[s]);

/**
 * A map that sends each drum sound as `notes` says: the preset that does, so
 * it is still named as one (a Circuit's map also places sounds Jambot never
 * plays), else `base` with each sound's General MIDI note sent as given. A
 * sound `notes` doesn't name goes out as the map sends it.
 */
export function drumMapOf(notes: Partial<DrumNotes>, base: DrumMap = {}): DrumMap {
  const preset = Object.values(DRUM_PRESETS).find((map) => sameNotes(drumNotesOf(map), notes));
  if (preset) return { ...preset };
  const map: Record<number, number> = { ...base };
  for (const sound of soundsIn(notes)) {
    const gm = DRUM_NOTES[sound];
    const note = notes[sound]!;
    if (note === gm) delete map[gm];
    else map[gm] = note;
  }
  return map;
}
