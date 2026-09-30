/**
 * Named `DrumNotes` a person can start from in `SoundPanel`, since a
 * hardware drum machine's pads often don't speak General MIDI (#102).
 *
 * 'GM' is the notes the engine already writes (`DEFAULT_DRUM_NOTES`):
 * correct for anything that reads General MIDI drums, and Jambot's own
 * built-in synth.
 *
 * 'Novation Circuit' is confirmed identical, note for note, in Novation's
 * own Programmer's Reference Guides for the original Circuit and Circuit
 * Tracks: both have exactly four Drum tracks, all on channel 10, and
 * respond only to notes 60, 62, 64 and 65 (Drum 1–4) — never a General
 * MIDI kit. Each pad plays whatever sample was loaded onto it, so there
 * is no musically "correct" way to collapse the engine's 7 drum sounds
 * onto 4 arbitrary pads; this groups them by the nearest physical
 * gesture (kick alone; rim with snare; pedal with the closed hat; ride
 * with the open hat) as a starting point a person can edit from.
 */

import { DEFAULT_DRUM_NOTES, type DrumNotes } from '../audio/midi-out.ts';

export const DRUM_NOTE_PRESETS: Readonly<Record<string, DrumNotes>> = {
  GM: DEFAULT_DRUM_NOTES,
  'Novation Circuit': {
    kick: 60,
    rim: 62,
    snare: 62,
    closedHat: 64,
    pedalHat: 64,
    openHat: 65,
    ride: 65,
  },
};

/** Which preset `drumNotes` matches exactly, or `null` for a custom map. */
export function presetNameOf(drumNotes: DrumNotes): string | null {
  for (const [name, preset] of Object.entries(DRUM_NOTE_PRESETS)) {
    const sounds = Object.keys(preset) as (keyof DrumNotes)[];
    if (sounds.every((sound) => preset[sound] === drumNotes[sound])) return name;
  }
  return null;
}
