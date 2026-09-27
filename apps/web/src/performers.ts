/**
 * The stage's performers: one per band performer, drums, bass, chords and
 * lead, as one plain snapshot each (`PerformerView`). `performersOf` reads
 * the same `Hud` and `SoundingNotes` every other view reads, and touches
 * neither the engine nor a session: the same performers are built the same
 * way whether the player plays alone, hosts, or follows a host
 * (`docs/briefs/host-mode.md`).
 *
 * A performer's status reuses the words the rest of the stage already
 * gives: the lead's from `leadStatus`, the other three's from the style,
 * since only the lead's motif names a source today (#79's "later" list). A
 * performer's `source` is the Muse's offer, named, only while the lead
 * plays that same offer — a bar's own decided offer, `hud.bar.motif`, not
 * whatever the Muse is offering now, which can already have moved on. Its
 * `pattern` is the last bar it finished (`Pattern`), for its piano roll.
 */

import { type Hud, leadStatus, styleStatus } from './hud.ts';
import type { BarPattern, PatternNote } from './pattern.ts';
import { type Performer, PERFORMERS, type SoundingNotes } from './sounding.ts';

export interface PerformerView {
  readonly performer: Performer;
  readonly label: string;
  /** One line saying what the performer is playing. */
  readonly status: string;
  /** The Muse's source for the motif the lead plays now, or null otherwise. */
  readonly source: string | null;
  /** The notes sounding on this performer right now. */
  readonly sounding: readonly number[];
  /** The notes of the last bar this performer finished. */
  readonly pattern: readonly PatternNote[];
}

const LABELS: Readonly<Record<Performer, string>> = {
  drums: 'Drums',
  bass: 'Bass',
  comp: 'Chords',
  lead: 'Lead',
};

export function performersOf(
  hud: Hud,
  sounding: SoundingNotes,
  pattern: BarPattern,
): readonly PerformerView[] {
  const style = styleStatus(hud.style);
  const lead = leadStatus(hud);
  const playingItsOwnMotif = hud.bar?.lead === 'motif' && hud.muse.motif?.bar === hud.bar.motif;
  return PERFORMERS.map((performer) => ({
    performer,
    label: LABELS[performer],
    status: performer === 'lead' ? lead : style,
    source: performer === 'lead' && playingItsOwnMotif ? hud.muse.motif!.source : null,
    sounding: sounding[performer],
    pattern: pattern[performer],
  }));
}
