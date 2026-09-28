/**
 * The written notation a quantised note keeps once its performance is
 * dropped (T4, L7): first the engine's own `WrittenNote` shape
 * (`@jambot/engine`), then the score's own drum lines
 * (`@jambot/score`'s `DrumLines`, the `drums` field `encodeBar`/`compileBar`
 * read and write, E16's form (iii): one line per sound, a default role).
 * Velocity and the residual microtiming are performance, not notation, and
 * stay behind (T4's decided written/played split); a drum hit's role
 * crosses only where the sound settles it on its own — the snare's
 * backbeat, fill or ghost still needs a hit-by-hit call, E16's one
 * remaining open question, not answered here.
 */
import { DRUM_NOTES, type DrumRole, type WrittenNote } from '@jambot/engine';
import { DRUM_SOUNDS, type DrumLines, type DrumSound } from '@jambot/score';
import type { QuantisedNote } from './swing.ts';

/** The one role a sound always plays in the engine's own drums (`drums.ts`); the snare has none, plays three. */
const UNAMBIGUOUS_ROLE: ReadonlyMap<number, DrumRole> = new Map([
  [DRUM_NOTES.kick, 'kick'],
  [DRUM_NOTES.pedalHat, 'pedal'],
  [DRUM_NOTES.rim, 'euclid'],
  [DRUM_NOTES.closedHat, 'hat'],
  [DRUM_NOTES.openHat, 'hat'],
  [DRUM_NOTES.ride, 'hat'],
]);

/** A drum track's quantised notes as `WrittenNote`s: role included only where the sound alone settles it. */
export function toDrumNotation(notes: readonly QuantisedNote[]): WrittenNote[] {
  return notes.map((note): WrittenNote => {
    const role = UNAMBIGUOUS_ROLE.get(note.midi);
    return {
      part: 'drums',
      step: note.step,
      note: note.midi,
      length: note.length,
      ...(role !== undefined && { role }),
    };
  });
}

/** The sound each of the score's supported drum words plays, the reverse of the engine's `DRUM_NOTES`. */
const SOUND_OF_NOTE: ReadonlyMap<number, DrumSound> = new Map(
  DRUM_SOUNDS.map((sound) => [DRUM_NOTES[sound], sound]),
);

/** Written drum notes, grouped into the score's own lines (E16): one entry per sound that hits; the snare's notes, unsupported still, are left out. */
export function toScoreDrums(written: readonly WrittenNote[]): DrumLines {
  const bySound = new Map<DrumSound, number[]>();
  for (const note of written) {
    if (note.part !== 'drums') continue;
    const sound = SOUND_OF_NOTE.get(note.note);
    if (!sound) continue;
    if (!bySound.has(sound)) bySound.set(sound, []);
    bySound.get(sound)!.push(note.step);
  }
  return Object.fromEntries(bySound);
}
