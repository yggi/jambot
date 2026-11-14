/**
 * Reading chords from notes, and `harm` from the chords (#15, the critic): cells' reader (`@yggi/cells/engine/reading/chords`, yggi/cells#541), lifted from this file.
 *
 * A bar's chords read back from what the comp (the pad and the stab) sounds, a root and a quality for each half of the bar, and `harm` from those chords: how often they change and how rich they are.
 * Its qualities are the theory's (`CHORD_QUALITIES`, but the harmonic series), in their order, which the test holds.
 * The Muse hears a player's chords by its `chordOf` (`muse-harmony.ts`).
 *
 * Pure: it counts pitch classes and knows no clock, file or key.
 */

export {
  type HarmReading,
  type ReadChord,
  chordOf,
  readChords,
  readHarm,
} from '@yggi/cells/engine/reading/chords';
