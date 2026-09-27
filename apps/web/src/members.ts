/**
 * The stage's members: one per band member, drums, bass, chords and lead, as
 * one plain snapshot each (`MemberView`). `membersOf` reads the same `Hud`
 * and `SoundingNotes` every other view reads, and touches neither the engine
 * nor a session: the same members are built the same way whether the player
 * plays alone, hosts, or follows a host (`docs/briefs/host-mode.md`).
 *
 * A member's status reuses the words the rest of the stage already gives:
 * the lead's from `leadStatus`, the other three's from the style, since only
 * the lead's motif names a source today (#79's "later" list). A member's
 * `source` is the Muse's offer, named, only while the lead plays that same
 * offer — a bar's own decided offer, `hud.bar.motif`, not whatever the Muse
 * is offering now, which can already have moved on.
 */

import { type Hud, leadStatus, styleStatus } from './hud.ts';
import { type Member, MEMBERS, type SoundingNotes } from './sounding.ts';

export interface MemberView {
  readonly member: Member;
  readonly label: string;
  /** One line saying what the member is playing. */
  readonly status: string;
  /** The Muse's source for the motif the lead plays now, or null otherwise. */
  readonly source: string | null;
  /** The notes sounding on this member right now. */
  readonly sounding: readonly number[];
}

const LABELS: Readonly<Record<Member, string>> = {
  drums: 'Drums',
  bass: 'Bass',
  comp: 'Chords',
  lead: 'Lead',
};

export function membersOf(hud: Hud, sounding: SoundingNotes): readonly MemberView[] {
  const style = styleStatus(hud.style);
  const lead = leadStatus(hud);
  const playingItsOwnMotif = hud.bar?.lead === 'motif' && hud.muse.motif?.bar === hud.bar.motif;
  return MEMBERS.map((member) => ({
    member,
    label: LABELS[member],
    status: member === 'lead' ? lead : style,
    source: member === 'lead' && playingItsOwnMotif ? hud.muse.motif!.source : null,
    sounding: sounding[member],
  }));
}
