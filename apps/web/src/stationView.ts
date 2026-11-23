/**
 * Now playing (#547 rung 5, the owner's ruling of 2026-11-23): the song each section plays in and its version, the
 * original or a mix, as the host's plans plan them (`PlanCarried.song`, `version`), named for the screen. The plans run a section or two ahead of the bar heard, so the
 * names are kept by section, the last `SONGS_KEPT`, and the screen asks for the section heard. A client knows no songs
 * until the session carries them (#553).
 */

import { type PlanCarried, titleOf, versionTitle } from '@jambot/engine';

/** No section's song yet: a session before its first section planned. */
export const NO_SONGS: ReadonlyMap<number, string> = new Map();

/** How many sections' songs are kept: more than the plans run ahead of the bar heard. */
export const SONGS_KEPT = 8;

/** The songs by section, with the section the plans planned last; the same map where it holds already. */
export function songsAfter(
  songs: ReadonlyMap<number, string>,
  { before, song, version }: Pick<PlanCarried, 'before' | 'song' | 'version'>,
): ReadonlyMap<number, string> {
  if (!before || song === null) return songs;
  const index = before.section.index;
  const name = `${titleOf({ id: song })} · ${versionTitle(version ?? 0)}`;
  if (songs.get(index) === name) return songs;
  const kept = [...songs].filter(([i]) => i !== index && i > index - SONGS_KEPT);
  return new Map([...kept, [index, name]]);
}

/** The song a section plays in, by name, or null for one the chain plays or one not planned. */
export const nowPlaying = (
  songs: ReadonlyMap<number, string>,
  section: number | undefined,
): string | null => (section === undefined ? null : (songs.get(section) ?? null));
