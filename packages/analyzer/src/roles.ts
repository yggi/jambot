/**
 * Part roles, the analyzer brief's third stage (step 3): which of a file's
 * tracks are drums, bass, lead or harmony, and how clear-cut each call was.
 * Channel 10 is a General MIDI convention, not one of #108's open questions
 * about Jambot's own seat plan — a file's channel 10 is drums whatever #108
 * eventually decides a seat is, so this stage doesn't wait on it. Bass and
 * lead are read off the remaining tracks by the brief's own rules: a
 * monophonic line's register, and a track's name or program as a hint;
 * everything polyphonic is harmony evidence.
 */
import type { RawNote, RawTrack } from './tracks.ts';

export type PartRole = 'drums' | 'bass' | 'lead' | 'harmony';

export interface RoleAssignment {
  readonly track: RawTrack;
  readonly role: PartRole;
  readonly confidence: number;
  readonly reason: string;
}

/** General MIDI channel 10 (0-indexed): the one role this stage reads directly, not inferred. */
const DRUM_CHANNEL = 9;

/** General MIDI's "Synth Lead" program family (81–88, 0-indexed 80–87). */
const LEAD_PROGRAMS = { from: 80, to: 87 };

const LEAD_NAME_HINT = /melody|vocal|lead|voice|sing/i;

/** Below this average pitch, a lone monophonic line defaults to bass (the engine's own bass range tops out at 57, `MEMORY.md`). */
const BASS_CEILING = 55;

function isMonophonic(notes: readonly RawNote[]): boolean {
  const sorted = [...notes].sort((a, b) => a.ticks - b.ticks);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.ticks < sorted[i - 1]!.ticks + sorted[i - 1]!.durationTicks) return false;
  }
  return true;
}

function averagePitch(notes: readonly RawNote[]): number {
  return notes.reduce((sum, note) => sum + note.midi, 0) / notes.length;
}

function hasLeadHint(track: RawTrack): boolean {
  const named = track.name !== undefined && LEAD_NAME_HINT.test(track.name);
  const programmed =
    track.program !== undefined &&
    track.program >= LEAD_PROGRAMS.from &&
    track.program <= LEAD_PROGRAMS.to;
  return named || programmed;
}

/** Every non-drum, monophonic track: the lowest is bass, the highest (or the hinted one) is lead, the rest harmony evidence. */
function classifyMonophonic(tracks: readonly RawTrack[]): RoleAssignment[] {
  if (tracks.length === 0) return [];
  const byPitch = [...tracks].sort((a, b) => averagePitch(a.notes) - averagePitch(b.notes));

  if (byPitch.length === 1) {
    const track = byPitch[0]!;
    const hinted = hasLeadHint(track);
    const role: PartRole = hinted || averagePitch(track.notes) >= BASS_CEILING ? 'lead' : 'bass';
    const reason = hinted
      ? 'the only monophonic line, and its name or program hints melody'
      : role === 'bass'
        ? 'the only monophonic line, below the bass ceiling'
        : 'the only monophonic line, above the bass ceiling';
    return [{ track, role, confidence: hinted ? 0.9 : 0.5, reason }];
  }

  // A hinted track is lead wherever it sits in the register; bass is then
  // the lowest of what's left, so a hint outranks a bare pitch comparison.
  const hintedTrack = byPitch.find(hasLeadHint);
  const leadTrack = hintedTrack ?? byPitch.at(-1)!;
  const remaining = byPitch.filter((track) => track !== leadTrack);
  const bassTrack = remaining[0]!;

  return byPitch.map((track): RoleAssignment => {
    if (track === leadTrack)
      return {
        track,
        role: 'lead',
        confidence: hintedTrack ? 0.9 : 0.65,
        reason: hintedTrack ? 'its name or program hints melody' : 'the highest monophonic line',
      };
    if (track === bassTrack)
      return { track, role: 'bass', confidence: 0.8, reason: 'the lowest monophonic line' };
    return {
      track,
      role: 'harmony',
      confidence: 0.4,
      reason: 'monophonic, between the bass and lead lines',
    };
  });
}

/** Every track's role, and the rule behind each call, per the brief's step 3. */
export function assignRoles(tracks: readonly RawTrack[]): RoleAssignment[] {
  const drums: RoleAssignment[] = [];
  const rest: RawTrack[] = [];
  for (const track of tracks) {
    if (track.channel === DRUM_CHANNEL)
      drums.push({ track, role: 'drums', confidence: 1, reason: 'channel 10' });
    else rest.push(track);
  }

  const monophonic = rest.filter((track) => isMonophonic(track.notes));
  const polyphonic = rest.filter((track) => !isMonophonic(track.notes));
  const harmony = polyphonic.map((track): RoleAssignment => ({
    track,
    role: 'harmony',
    confidence: 0.7,
    reason: 'polyphonic',
  }));

  return [...drums, ...classifyMonophonic(monophonic), ...harmony];
}
