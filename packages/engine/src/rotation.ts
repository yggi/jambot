/**
 * The station's rotation (#547 rung 5; the owner's direction and rulings of 2026-11-23): the band as a radio station.
 *
 * A **song** is made once, on the song form cells finds at the style (`songFormAt`), and keeps what makes it itself:
 * its themes A and B (the progressions it plays, by id where the repository gave them), its lead line, its mode, its
 * meter and the point it was made at, which is where it fits. Whatever plays it never changes those, so a chorus is the same
 * chorus every time the song is on air.
 *
 * A song is played in **versions** (step 2; the owner's rulings of 2026-11-23): its original, which its first play makes,
 * and its mixes. A version keeps a tonic, a drum bar, a bass line, a tempo and a style shift, and each play starts from
 * its version's, the ladders free within the play, as the lead line starts from the song's. A play again is a mix as
 * often as the entropy says (`nextVersion`); a mix changes one of the key, the groove, the speed (the player glides the
 * tempo to the original's times `tempo`) or the style (the band's written style shifted, so it resolves and performs a
 * little elsewhere: `styleShifted`), now and then a second, never a theme, the lead line or the mode. A song keeps
 * `MIXES_KEPT` mixes, so a mix comes round again; at entropy 0 a song plays the version it played last.
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
 * entropy the band plays at, which the homeostat leans, and a section it doesn't takes that entropy shared among the
 * songs on air away, to none, so a song drawn more than its share tires the station (step 3, the owner's rulings of
 * 2026-11-24). **A worn song rests:** past the ladder's last rung (`WORN`) it leaves the air until its boredom has faded
 * to none, as a rejected groove does; resting, it doesn't count toward the cap, so a new song is made in its place, and
 * where it comes back the songs on air are trimmed to the cap (`trimmed`). Full, the rotation lets the song that fits
 * worst and played least go, never one resting or the one playing (`made`, `trimmed`). Pure.
 */

import type { Meter } from '@jambot/theory';
import type { ComposerMode } from './key.ts';
import type { SwingLevel } from './swing.ts';
import { MISS_DISTANCE, type StylePoint } from './meter-query.ts';
import { BORED, GROOVE_RUNGS } from './novelty.ts';
import { chance, draw, pick, quantize } from './random.ts';
import type { SectionRhythm } from './rhythm-query.ts';
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

/** What a mix changes of the original: the key's tonic, the groove (the drum bar and the bass line), the speed or the style. */
export const MIX_CHANGES = ['key', 'groove', 'speed', 'style'] as const;
export type MixChange = (typeof MIX_CHANGES)[number];

/** A shift of the style, axis by axis: what a style mix adds to the style the band writes; none for the original. */
export type StyleShift = StylePoint;

/** A version of a song: its original (0) or a mix of it (1 on), and the tonic, drum bar and bass line each play starts from. */
export interface SongVersion {
  readonly id: number;
  /** Its key's tonic, the mode the song's. */
  readonly tonic: number;
  /** Its drum bar, and the clave on it, as the repository gave them; none where the drummer invented. */
  readonly drums: SectionRhythm;
  /** Its bass line, by id; null where the bass invented. */
  readonly bass: string | null;
  /** What it changed of the original: none for the original. */
  readonly changes: readonly MixChange[];
  /** Its tempo, as a share of the one the style sets: 1 for the original. */
  readonly tempo: number;
  /** Its style shift, added to the style the band writes: none for the original. */
  readonly shift: StyleShift;
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
  /** The versions it was heard in, the original first; none before its first play is heard. */
  readonly versions: readonly SongVersion[];
  /** The version it played last, by id; null before its first. */
  readonly version: number | null;
  /** Whether it rests: worn past `WORN`, off the air and the cap until its boredom has faded to none. */
  readonly resting: boolean;
}

/** The songs a session has made, and how many it has made, which numbers the next. */
export interface Rotation {
  readonly songs: readonly Song[];
  readonly made: number;
}

/** A session's rotation before its first song. */
export const NO_ROTATION: Rotation = { songs: [], made: 0 };

/** The boredom past which a song rests: the novelty ladder's last rung, as a groove past it is rejected. */
export const WORN = BORED * GROOVE_RUNGS;

/** The songs on air: those not resting, which the cap counts and the station draws among. */
export const onAir = (rotation: Rotation): readonly Song[] =>
  rotation.songs.filter((s) => !s.resting);

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
  !song.resting &&
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
  if ((fitting.length === 0 || onAir(rotation).length < capOf(entropy)) && found !== null)
    return { kind: 'new', form: found };
  if (fitting.length === 0) return { kind: 'none' };
  const weights = fitting.map((s) => weightOf(s, point));
  return { kind: 'replay', song: fitting[pick(draw(seed, 'song', index), weights)]! };
}

/**
 * The rotation with its songs on air at most `cap`: past it, the song that lies farthest from `now` leaves, the one played
 * least among those as far, then the oldest, never one resting or `keep` (the one playing, or the one made); the same
 * rotation where it is within its cap.
 */
export function trimmed(
  rotation: Rotation,
  cap: number,
  now: StylePoint,
  keep: number | null,
): Rotation {
  let songs = rotation.songs;
  while (songs.filter((s) => !s.resting).length > Math.max(1, cap)) {
    const leaving = songs
      .filter((s) => !s.resting && s.id !== keep)
      .reduce<Song | null>((worst, s) => {
        if (!worst) return s;
        const [d, w] = [pointDistance(s.point, now), pointDistance(worst.point, now)];
        return d > w || (d === w && s.plays < worst.plays) ? s : worst;
      }, null);
    if (!leaving) break;
    songs = songs.filter((s) => s !== leaving);
  }
  return songs === rotation.songs ? rotation : { ...rotation, songs };
}

/**
 * The rotation with a song made at `point` on `form`, numbered next, its songs on air trimmed to `cap` (`trimmed`),
 * never the one made.
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
    versions: [],
    version: null,
    resting: false,
  };
  return trimmed({ songs: [...rotation.songs, fresh], made: fresh.id }, cap, now, fresh.id);
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

/**
 * The rotation after a section: the song playing a section's entropy more tired of, every other that entropy shared among
 * the songs on air less, to none; a song past `WORN` rests, and one resting comes back once its boredom is none, the
 * songs on air then trimmed to the cap where it takes them past it, as seen from `now` (`trimmed`), never the one
 * playing.
 */
export function afterSection(
  rotation: Rotation,
  playing: number | null,
  entropy: number,
  now?: StylePoint,
): Rotation {
  const step = quantize(entropy);
  const share = quantize(step / Math.max(1, onAir(rotation).length));
  const after = {
    ...rotation,
    songs: rotation.songs.map((s) => {
      const boredom = s.id === playing ? s.boredom + step : Math.max(0, s.boredom - share);
      return { ...s, boredom, resting: boredom >= WORN || (s.resting && boredom > 0) };
    }),
  };
  return now ? trimmed(after, capOf(entropy), now, playing) : after;
}

/** How many mixes a song keeps: a mixed play makes a new one while it keeps fewer (chosen in #547 step 2). */
export const MIXES_KEPT = 3;

/** How likely a new mix changes a second thing, at entropy 1: a mix varies more as entropy rises. */
export const MIX_SECOND = 0.5;

/** How far a speed mix moves the tempo, least and most, as a share of the original's: within the plan's ±8 %. */
export const SPEED_LEAST = 0.03;
export const SPEED_REACH = 0.08;

/** How far a style mix shifts each axis of the style: 0.15 in all on four axes, half the composer's reach. */
export const STYLE_STEP = 0.075;

/** A speed mix's tempo, as a share of the original's: faster or slower, by `SPEED_LEAST` to `SPEED_REACH`. */
export function mixTempoOf(seed: number, index: number): number {
  const by = SPEED_LEAST + draw(seed, 'mix', index, 5) * (SPEED_REACH - SPEED_LEAST);
  return chance(draw(seed, 'mix', index, 6), 0.5) ? 1 - by : 1 + by;
}

/** A style mix's shift: each of the axes `STYLE_STEP` up or down. */
export function mixShiftOf(seed: number, index: number, axes: readonly string[]): StyleShift {
  return Object.fromEntries(
    axes.map((axis, i) => [
      axis,
      chance(draw(seed, 'mix', index, 7, i), 0.5) ? -STYLE_STEP : STYLE_STEP,
    ]),
  );
}

/** A style shifted by a shift's axes, each held within 0 to 1, the rest as it was. */
export function styleShifted<S extends Readonly<Record<string, number>>>(
  style: S,
  shift: StyleShift,
): S {
  const keys = Object.keys(shift);
  if (keys.length === 0) return style;
  return {
    ...style,
    ...Object.fromEntries(
      keys.map((axis) => [axis, Math.min(1, Math.max(0, (style[axis] ?? 0) + shift[axis]!))]),
    ),
  };
}

/** What a song plays as, where it starts: its original, a mix it keeps, or a new mix with what it changes. */
export type NextVersion =
  | { readonly kind: 'original' }
  | { readonly kind: 'mix'; readonly version: number }
  | { readonly kind: 'new mix'; readonly changes: readonly MixChange[] };

/**
 * The version a song plays, where it starts (see the module's comment): its original first; at entropy 0 the version it
 * played last; else a mix as often as the entropy says, a new one while it keeps fewer than `MIXES_KEPT`, or one of
 * those it keeps, never the one it played last; otherwise its original.
 */
export function nextVersion(
  song: Pick<Song, 'versions' | 'version'>,
  {
    entropy,
    seed,
    index,
  }: { readonly entropy: number; readonly seed: number; readonly index: number },
): NextVersion {
  if (song.versions.length === 0) return { kind: 'original' };
  if (quantize(entropy) === 0)
    return song.version === null || song.version === 0
      ? { kind: 'original' }
      : { kind: 'mix', version: song.version };
  if (!chance(draw(seed, 'mix', index), entropy)) return { kind: 'original' };
  const mixes = song.versions.filter((v) => v.id > 0);
  if (mixes.length < MIXES_KEPT) {
    const even = MIX_CHANGES.map(() => 1);
    const one = MIX_CHANGES[pick(draw(seed, 'mix', index, 1), even)]!;
    if (!chance(draw(seed, 'mix', index, 2), quantize(entropy) * MIX_SECOND))
      return { kind: 'new mix', changes: [one] };
    const rest = MIX_CHANGES.filter((c) => c !== one);
    const two =
      rest[
        pick(
          draw(seed, 'mix', index, 8),
          rest.map(() => 1),
        )
      ]!;
    return { kind: 'new mix', changes: [one, two] };
  }
  const others = mixes.filter((v) => v.id !== song.version);
  const from = others.length > 0 ? others : mixes;
  return {
    kind: 'mix',
    version:
      from[
        pick(
          draw(seed, 'mix', index, 3),
          from.map(() => 1),
        )
      ]!.id,
  };
}

/** The rotation with a song heard in a version, kept in its place or added, and played last. */
export const versioned = (rotation: Rotation, id: number, version: SongVersion): Rotation => ({
  ...rotation,
  songs: rotation.songs.map((s) =>
    s.id !== id
      ? s
      : {
          ...s,
          versions: s.versions.some((v) => v.id === version.id)
            ? s.versions.map((v) => (v.id === version.id ? version : v))
            : [...s.versions, version],
          version: version.id,
        },
  ),
});

/** A version's name as the app says it: the original, or the mix's number. */
export const versionTitle = (id: number): string => (id === 0 ? 'original' : `mix ${id}`);

/** A song's name as the app says it: its number. */
export const titleOf = (song: Pick<Song, 'id'>): string => `Song ${song.id}`;
