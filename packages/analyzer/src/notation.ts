/**
 * The written notation a quantised note keeps once its performance is
 * dropped (T4, L7): the engine's own `WrittenNote` shape (`@jambot/engine`),
 * the seam `packages/score`'s `encodeBar`/`compileBar` read and write.
 * Velocity and the residual microtiming are performance, not notation, and
 * stay behind (T4's decided written/played split); only a drum hit's role
 * crosses, and only where the sound settles it on its own — the snare's
 * backbeat, fill or ghost still needs a hit-by-hit call, E16's open
 * question on #63, not answered here.
 */
import { DRUM_NOTES, type DrumRole, type WrittenNote } from '@jambot/engine';
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
