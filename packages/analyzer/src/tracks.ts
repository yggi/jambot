/**
 * Load and normalise, the first of the analyzer brief's stages that can run
 * without #116's open questions (`docs/briefs/analyzer.md` step 1): drop
 * empty tracks, and a later track that exactly repeats an earlier one on the
 * same channel, counting each so nothing is dropped silently.
 */

/** A note as a parsed MIDI file states it, in ticks (this package's own input shape). */
export interface RawNote {
  readonly midi: number;
  readonly ticks: number;
  readonly durationTicks: number;
  readonly velocity: number;
}

/** One track: a channel and its notes, in file order. */
export interface RawTrack {
  readonly name?: string;
  /** The General MIDI program its last program-change event named, a hint for `roles.ts`. */
  readonly program?: number;
  readonly channel: number;
  readonly notes: readonly RawNote[];
}

export interface NormalisedTracks {
  readonly tracks: readonly RawTrack[];
  readonly droppedEmpty: number;
  readonly droppedDuplicate: number;
}

const noteKey = (note: RawNote) =>
  `${note.midi}:${note.ticks}:${note.durationTicks}:${note.velocity}`;

const trackKey = (track: RawTrack) => `${track.channel}|${track.notes.map(noteKey).join(',')}`;

/** Drops every empty track and every later exact duplicate, with their counts. */
export function normaliseTracks(tracks: readonly RawTrack[]): NormalisedTracks {
  let droppedEmpty = 0;
  let droppedDuplicate = 0;
  const seen = new Set<string>();
  const kept: RawTrack[] = [];
  for (const track of tracks) {
    if (track.notes.length === 0) {
      droppedEmpty++;
      continue;
    }
    const key = trackKey(track);
    if (seen.has(key)) {
      droppedDuplicate++;
      continue;
    }
    seen.add(key);
    kept.push(track);
  }
  return { tracks: kept, droppedEmpty, droppedDuplicate };
}
