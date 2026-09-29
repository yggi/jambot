/**
 * The tracks' performers: one per band performer, drums, bass, chords and
 * lead, as one plain snapshot each (`PerformerView`). `performersOf` reads
 * the same `Hud` and `SoundingNotes` every other view reads, and touches
 * neither the engine nor a session: the same performers are built the same
 * way whether the player plays alone, hosts, or follows a host
 * (`docs/briefs/host-mode.md`).
 *
 * A performer's status reuses the words the rest of the page already
 * gives: the lead's from `leadStatus`, the other three's from the style,
 * since only the lead's motif names a source today (#79's "later" list).
 * Its `pattern` is the last bar it finished (`Pattern`), for its piano
 * roll, and the lead's `motif` is whose motif it played in that same bar,
 * named by player: the bar's own offer, as the band composed it, never
 * whatever the Muse offers now.
 */

import { sourceName } from '@jambot/session';
import { type Attribution, type Hud, leadStatus, styleStatus } from './hud.ts';
import type { PatternBar, PatternNote } from './pattern.ts';
import { type Performer, PERFORMERS, type SoundingNotes } from './sounding.ts';

export interface PerformerView {
  readonly performer: Performer;
  readonly label: string;
  /** One line saying what the performer is playing. */
  readonly status: string;
  /** For the lead, whose motif it played in the bar of its `pattern`, named; null otherwise. */
  readonly motif: Attribution | null;
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

/** Each band performer's row; `players` names a session's sources, by player id. */
export function performersOf(
  hud: Hud,
  sounding: SoundingNotes,
  pattern: PatternBar,
  players: Readonly<Record<string, string>> = {},
): readonly PerformerView[] {
  const style = styleStatus(hud.style);
  const lead = leadStatus(hud);
  const motif = pattern.motif && {
    ...pattern.motif,
    source: sourceName(pattern.motif.source, players),
  };
  return PERFORMERS.map((performer) => ({
    performer,
    label: LABELS[performer],
    status: performer === 'lead' ? lead : style,
    motif: performer === 'lead' ? motif : null,
    sounding: sounding[performer],
    pattern: pattern.parts[performer],
  }));
}
