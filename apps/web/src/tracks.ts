/**
 * The stage's tracks: one per band member, drums, bass, chords and lead, as
 * one plain snapshot each (`TrackView`). `tracksOf` reads the same `Hud` and
 * `SoundingNotes` every other view reads, and touches neither the engine nor
 * a session: the same tracks are built the same way whether the player
 * plays alone, hosts, or follows a host (`docs/briefs/host-mode.md`).
 *
 * A track's status reuses the words the rest of the stage already gives:
 * the lead's from `leadStatus`, the other three's from the style, since only
 * the lead's motif names a source today (#79's "later" list). A track's
 * `source` is the Muse's offer, named, only while the lead plays it.
 */

import { type Hud, leadStatus, styleStatus } from './hud.ts';
import { type SoundingNotes, TRACK_PARTS, type TrackPart } from './sounding.ts';

export interface TrackView {
  readonly part: TrackPart;
  readonly label: string;
  /** One line saying what the track is playing. */
  readonly status: string;
  /** The Muse's source for the motif the lead plays now, or null otherwise. */
  readonly source: string | null;
  /** The notes sounding on this track right now. */
  readonly sounding: readonly number[];
}

const LABELS: Readonly<Record<TrackPart, string>> = {
  drums: 'Drums',
  bass: 'Bass',
  comp: 'Chords',
  lead: 'Lead',
};

export function tracksOf(hud: Hud, sounding: SoundingNotes): readonly TrackView[] {
  const style = styleStatus(hud.style);
  const lead = leadStatus(hud);
  return TRACK_PARTS.map((part) => ({
    part,
    label: LABELS[part],
    status: part === 'lead' ? lead : style,
    source: part === 'lead' && hud.bar?.lead === 'motif' ? (hud.muse.motif?.source ?? null) : null,
    sounding: sounding[part],
  }));
}
