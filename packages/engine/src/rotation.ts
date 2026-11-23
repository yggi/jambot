/**
 * The station's rotation (#547 rung 5; the owner's direction and rulings of 2026-11-23): the band as a radio station.
 *
 * A **song** is made once, on the song form cells finds at the style (`songFormAt`), and keeps what makes it itself:
 * its themes A and B (the progressions it plays, by id where the repository gave them), its lead line, its mode, its
 * meter and the point it was made at, which is where it fits. Whatever plays it never changes those, so a chorus is the same
 * chorus every time the song is on air. (A mix, which varies a song with its themes kept, is step 2.)
 *
 * The **rotation** is the songs a session has made, at most `capOf(entropy)` of them: 4 at entropy 0 up to 16 at 1.
 * At a song's end the next one is chosen (`nextSong`):
 * - a new song while the rotation is under its cap, or where none of its songs fits (in the mode the key takes and the
 *   meter the section takes, within the composer's reach of the style, `MISS_DISTANCE`);
 * - else a draw among those that fit, weighted by fit, the nearest heaviest, and less as the station tires of a song
 *   (`weightOf`); never the song just played above entropy 0;
 * - at entropy 0 the song playing again, where it still fits: the station holds, as a groove holds at 0.
 *
 * **Boredom** is counted as the novelty ladder counts a groove's (`novelty.ts`): a section a song plays adds the
 * entropy the band plays at, which the homeostat leans, and a section it doesn't takes as much away, to none. Full,
 * the rotation lets the song that fits worst and played least go (`made`). Pure.
 */

import type { Meter } from '@jambot/theory';
import type { ComposerMode } from './key.ts';
import type { SwingLevel } from './swing.ts';
import { MISS_DISTANCE, type StylePoint } from './meter-query.ts';
import { draw, pick, quantize } from './random.ts';
import { pointDistance } from './style.ts';
import type { Theme } from './themes.ts';

/** What a song keeps of its themes: each kind's theme, a build's too, and the progression it plays, by id where the repository gave one. */
export interface SongThemes {
  readonly themes: {
    readonly A: Theme | null;
    readonly B: Theme | null;
    readonly build: Theme | null;
  };
  readonly themeFragments: {
    readonly A: string | null;
    readonly B: string | null;
    readonly build: string | null;
  };
  /** The lead line it plays from, by id, where the repository gave one. */
  readonly lead: string | null;
  /** The mode its themes are in. */
  readonly mode: ComposerMode;
}

/** A song's meter, as a section takes one (`SectionMeter`): the meter, the level it swings on, the share and the fragment. */
export interface SongMeter {
  readonly meter: Meter;
  readonly swing: SwingLevel;
  readonly share?: number;
  readonly meterFragment?: string;
}

/** A song of the rotation: what it is, where it fits, and how the station has played it. */
export interface Song extends SongThemes {
  /** Its number in the session, in the order the songs were made, from 1. */
  readonly id: number;
  /**
   * The meter it was made in (the level it swings on, and the fragment where the composer found one): it plays again
   * only where a section takes it, as only in its mode, so its lead line reads and a waltz stays a waltz.
   */
  readonly meter: SongMeter;
  /** The song form it is played on, cells' (`fragments/songs/`). */
  readonly form: string;
  /** The style's point where it was made: where it fits. */
  readonly point: StylePoint;
  /** How many times it started. */
  readonly plays: number;
  /** How tired of it the station is: the entropy of each section it played, less that of each it didn't, to none. */
  readonly boredom: number;
}

/** The songs a session has made, and how many it has made, which numbers the next. */
export interface Rotation {
  readonly songs: readonly Song[];
  readonly made: number;
}

/** A session's rotation before its first song. */
export const NO_ROTATION: Rotation = { songs: [], made: 0 };

/** The rotation's cap at entropy 0, and how much it grows to entropy 1 (the owner's ruling, 2026-11-23). */
export const ROTATION_FLOOR = 4;
export const ROTATION_SPAN = 12;

/** How many songs the rotation holds at an entropy: 4 at 0 to 16 at 1, rounded. */
export const capOf = (entropy: number): number =>
  Math.round(ROTATION_FLOOR + ROTATION_SPAN * Math.min(1, Math.max(0, entropy)));

/** What a song at the reach's edge still weighs, before its square: so every song that fits can be drawn (chosen in #547). */
export const FIT_FLOOR = 0.05;

/**
 * A song's weight in the draw: its fit (1 at the point, 0 at the reach), floored and squared, so the nearest is
 * drawn clearly more often, a heavy rotation (twice as often as one at half the reach, about); over one plus the
 * station's boredom with it.
 */
export function weightOf(song: Song, point: StylePoint): number {
  const fit = FIT_FLOOR + Math.max(0, 1 - pointDistance(song.point, point) / MISS_DISTANCE);
  return (fit * fit) / (1 + song.boredom);
}

/** What the station asks at a song's end. */
export interface SongAsk {
  readonly point: StylePoint;
  /** The mode the section's key takes: a song plays only in its own. */
  readonly mode: ComposerMode;
  /** The meter the section takes: a song plays only in its own. */
  readonly meter: SongMeter;
  /** The entropy the band plays at. */
  readonly entropy: number;
  readonly seed: number;
  readonly index: number;
  /** The song that just ended, by id; null where none did. */
  readonly playing: number | null;
  /** The song form cells finds at the style, which a new song is made on; null on a miss. */
  readonly found: string | null;
}

/** The next song: one of the rotation again, a new one on a form, or none, where the chain plays. */
export type NextSong =
  | { readonly kind: 'replay'; readonly song: Song }
  | { readonly kind: 'new'; readonly form: string }
  | { readonly kind: 'none' };

/** Whether two meters are one: the same fragment, cycle, pulses and level. */
export const sameSongMeter = (a: SongMeter, b: SongMeter): boolean =>
  a.meterFragment === b.meterFragment &&
  a.swing === b.swing &&
  a.meter.cycle === b.meter.cycle &&
  a.meter.heights.join() === b.meter.heights.join();

const fits = (song: Song, { point, mode, meter }: Pick<SongAsk, 'point' | 'mode' | 'meter'>) =>
  song.mode === mode &&
  sameSongMeter(song.meter, meter) &&
  pointDistance(song.point, point) <= MISS_DISTANCE;

/** The song a station plays next, at a song's end (see the module's comment). */
export function nextSong(rotation: Rotation, ask: SongAsk): NextSong {
  const { entropy, playing, found, seed, index, point } = ask;
  const still = rotation.songs.find((s) => s.id === playing);
  if (quantize(entropy) === 0 && still && fits(still, ask)) return { kind: 'replay', song: still };
  const fitting = rotation.songs.filter(
    (s) => fits(s, ask) && (s.id !== playing || quantize(entropy) === 0),
  );
  if ((fitting.length === 0 || rotation.songs.length < capOf(entropy)) && found !== null)
    return { kind: 'new', form: found };
  if (fitting.length === 0) return { kind: 'none' };
  const weights = fitting.map((s) => weightOf(s, point));
  return { kind: 'replay', song: fitting[pick(draw(seed, 'song', index), weights)]! };
}

/**
 * The rotation with a song made at `point` on `form`, numbered next; past `cap`, the song that lies farthest from
 * `now` leaves, the one played least among those as far, then the oldest, never the one made.
 */
export function made(
  rotation: Rotation,
  song: Pick<Song, 'form' | 'point' | 'mode' | 'meter'>,
  cap: number,
  now: StylePoint,
): Rotation {
  const fresh: Song = {
    ...song,
    id: rotation.made + 1,
    themes: { A: null, B: null, build: null },
    themeFragments: { A: null, B: null, build: null },
    lead: null,
    plays: 0,
    boredom: 0,
  };
  let songs = [...rotation.songs, fresh];
  while (songs.length > Math.max(1, cap)) {
    const leaving = songs
      .filter((s) => s !== fresh)
      .reduce((worst, s) => {
        const [d, w] = [pointDistance(s.point, now), pointDistance(worst.point, now)];
        return d > w || (d === w && s.plays < worst.plays) ? s : worst;
      });
    songs = songs.filter((s) => s !== leaving);
  }
  return { songs, made: fresh.id };
}

/** The rotation with a song's play counted, where it starts. */
export const played = (rotation: Rotation, id: number): Rotation => ({
  ...rotation,
  songs: rotation.songs.map((s) => (s.id === id ? { ...s, plays: s.plays + 1 } : s)),
});

/** The rotation with a song keeping the themes, progressions, lead line and mode it is heard with. */
export const heard = (rotation: Rotation, id: number, themes: SongThemes): Rotation => ({
  ...rotation,
  songs: rotation.songs.map((s) => (s.id === id ? { ...s, ...themes } : s)),
});

/** The rotation after a section: the song playing a section's entropy more tired of, every other as much less, to none. */
export function afterSection(
  rotation: Rotation,
  playing: number | null,
  entropy: number,
): Rotation {
  const step = quantize(entropy);
  return {
    ...rotation,
    songs: rotation.songs.map((s) => ({
      ...s,
      boredom: s.id === playing ? s.boredom + step : Math.max(0, s.boredom - step),
    })),
  };
}

/** A song's name as the app says it: its number. */
export const titleOf = (song: Pick<Song, 'id'>): string => `Song ${song.id}`;
