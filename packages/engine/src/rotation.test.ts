import { describe, expect, it } from 'vitest';
import {
  MIXES_KEPT,
  MIX_CHANGES,
  MIX_SECOND,
  SPEED_LEAST,
  SPEED_REACH,
  STYLE_STEP,
  NO_ROTATION,
  ROTATION_FLOOR,
  ROTATION_SPAN,
  type Rotation,
  type Song,
  afterSection,
  capOf,
  heard,
  made,
  nextSong,
  nextVersion,
  played,
  titleOf,
  trimmed,
  WORN,
  type SongVersion,
  mixShiftOf,
  mixTempoOf,
  styleShifted,
  versioned,
  versionTitle,
} from './rotation.ts';
import { MISS_DISTANCE } from './meter-query.ts';
import { INITIAL_STYLE as STYLE_AT } from './style.ts';
import { METERS } from '@jambot/theory';

const at = (sync: number) => ({ sync, harm: 0.5, bite: 0.5, mood: 0.5 });
const HERE = at(0.5);
/** The song's 4/4, as the repository gives it; and a waltz. */
const FOUR = { meter: METERS['4/4'], swing: '16n' as const, meterFragment: 'meter' };
const WALTZ = { meter: METERS['3/4'], swing: '16n' as const, meterFragment: 'meter_3_4' };

/** A rotation of songs made at these syncs, in order, each in ionian, none played. */
const rotationOf = (...syncs: number[]): Rotation =>
  syncs.reduce<Rotation>(
    (r, sync) =>
      made(r, { form: 'verse_chorus', point: at(sync), mode: 'ionian', meter: FOUR }, 16, at(sync)),
    NO_ROTATION,
  );

const ask = (over: Partial<Parameters<typeof nextSong>[1]> = {}) => ({
  point: HERE,
  mode: 'ionian' as const,
  meter: FOUR,
  entropy: 0.3,
  seed: 1,
  index: 8,
  playing: null,
  found: 'verse_chorus',
  ...over,
});

describe('the rotation’s cap (#547 rung 5, the owner’s ruling of 2026-11-23)', () => {
  it('holds 4 songs at entropy 0 and 16 at entropy 1, rounded between', () => {
    expect([ROTATION_FLOOR, ROTATION_SPAN]).toEqual([4, 12]);
    expect([0, 0.3, 0.5, 1].map(capOf)).toEqual([4, 8, 10, 16]);
  });

  it('stays within its floor and its top past either end of entropy', () => {
    expect([capOf(-0.2), capOf(1.4)]).toEqual([4, 16]);
  });
});

describe('a song made', () => {
  it('is numbered in the order the songs are made, and named by its number', () => {
    const r = rotationOf(0.5, 0.52);
    expect(r.songs.map((s) => s.id)).toEqual([1, 2]);
    expect(titleOf(r.songs[1]!)).toBe('Song 2');
    expect(r.songs.every((s) => s.plays === 0 && s.boredom === 0)).toBe(true);
  });

  it('crowds out the song that fits worst where the rotation is full, then the one played least, never the one made', () => {
    // (cap 4 at entropy 0: the fifth song made at 0.5 crowds out the farthest, at 0.9)
    const full = rotationOf(0.5, 0.9, 0.55, 0.6);
    const fifth = made(
      full,
      { form: 'verse_chorus', point: HERE, mode: 'ionian', meter: FOUR },
      capOf(0),
      HERE,
    );
    expect(fifth.songs.map((s) => s.id)).toEqual([1, 3, 4, 5]);
    // (two as far, exactly: the one played less leaves)
    const twins = played(rotationOf(0.25, 0.75, 0.5, 0.5), 2);
    const next = made(
      twins,
      { form: 'vamp', point: HERE, mode: 'ionian', meter: FOUR },
      capOf(0),
      HERE,
    );
    expect(next.songs.map((s) => s.id)).toEqual([2, 3, 4, 5]);
  });
});

describe('the next song (the owner’s rulings of 2026-11-23)', () => {
  it('makes a new song while the rotation is under its cap, on the form the style finds', () => {
    expect(nextSong(rotationOf(0.5, 0.5), ask())).toEqual({ kind: 'new', form: 'verse_chorus' });
  });

  it('makes a new song where no song of the rotation lies within reach, full or not', () => {
    const far = rotationOf(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(nextSong(far, ask({ point: at(1) }))).toEqual({ kind: 'new', form: 'verse_chorus' });
  });

  it('plays the chain where nothing fits and the style finds no form', () => {
    expect(nextSong(NO_ROTATION, ask({ found: null }))).toEqual({ kind: 'none' });
  });

  it('draws a song of the rotation once it is full, never the one just played above entropy 0', () => {
    const full = rotationOf(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
    for (let index = 0; index < 200; index++) {
      const next = nextSong(full, ask({ index, playing: 3 }));
      expect(next.kind).toBe('replay');
      expect(next.kind === 'replay' && next.song.id).not.toBe(3);
    }
  });

  it('repeats the song playing at entropy 0, where it still fits', () => {
    const r = rotationOf(0.5, 0.5, 0.5, 0.5);
    const next = nextSong(r, ask({ entropy: 0, playing: 2 }));
    expect(next.kind === 'replay' && next.song.id).toBe(2);
  });

  it('plays a song that fits better more often', () => {
    // (8 songs at entropy 0.3, a full rotation: one at the point, the others at the reach's middle)
    const r = rotationOf(0.5, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65);
    const counts = new Map<number, number>();
    for (let index = 0; index < 5000; index++) {
      const next = nextSong(r, ask({ index }));
      if (next.kind === 'replay') counts.set(next.song.id, (counts.get(next.song.id) ?? 0) + 1);
    }
    // (its weight 1.05², theirs 0.8²: 1.72 times as often, expected)
    const nearest = counts.get(1)!;
    for (const id of [2, 3, 4, 5, 6, 7, 8]) expect(nearest).toBeGreaterThan(counts.get(id)! * 1.4);
  });

  it('plays a song it tired of less often: its boredom lowers its weight', () => {
    let r = rotationOf(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
    // (5 of boredom, under WORN: on air, at a sixth of the weight)
    for (let s = 0; s < 5; s++) r = afterSection(r, 1, 1);
    const counts = new Map<number, number>();
    for (let index = 0; index < 2000; index++) {
      const next = nextSong(r, ask({ index }));
      if (next.kind === 'replay') counts.set(next.song.id, (counts.get(next.song.id) ?? 0) + 1);
    }
    expect(counts.get(1)! * 3).toBeLessThan(counts.get(2)!);
  });

  it('plays only a song in the mode the key takes, and none farther than the composer’s reach', () => {
    const r = made(
      rotationOf(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5),
      { form: 'vamp', point: HERE, mode: 'dorian', meter: FOUR },
      8,
      HERE,
    );
    for (let index = 0; index < 100; index++) {
      const next = nextSong(r, ask({ index, mode: 'dorian', meter: FOUR }));
      expect(next.kind === 'replay' && next.song.id).toBe(8);
    }
    const reach = rotationOf(...Array.from({ length: 8 }, () => 0.5 + 2 * MISS_DISTANCE + 0.01));
    expect(nextSong(reach, ask()).kind).toBe('new');
  });

  it('plays only a song in the meter the section takes, as only in its mode: a waltz stays a waltz', () => {
    const r = made(
      rotationOf(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5),
      { form: 'vamp', point: HERE, mode: 'ionian', meter: WALTZ },
      8,
      HERE,
    );
    for (let index = 0; index < 100; index++) {
      const next = nextSong(r, ask({ index, meter: WALTZ }));
      expect(next.kind === 'replay' && next.song.id).toBe(8);
    }
  });

  it('is the same for the same seed and index, and another for another seed somewhere', () => {
    const full = rotationOf(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
    const pickOf = (seed: number, index: number) => {
      const next = nextSong(full, ask({ seed, index }));
      return next.kind === 'replay' ? next.song.id : 0;
    };
    expect(pickOf(1, 9)).toBe(pickOf(1, 9));
    expect(Array.from({ length: 20 }, (_, i) => pickOf(1, i)).join()).not.toBe(
      Array.from({ length: 20 }, (_, i) => pickOf(2, i)).join(),
    );
  });
});

describe('a song as it plays', () => {
  it('counts its plays, and keeps the themes, the progressions and the lead line it is heard with', () => {
    const r = played(rotationOf(0.5), 1);
    const kept = heard(r, 1, {
      themes: { A: null, B: null, build: null },
      themeFragments: { A: 'main', B: null, build: null },
      lead: 'twinkle',
      mode: 'ionian',
    });
    const song: Song = kept.songs[0]!;
    expect([song.plays, song.themeFragments.A, song.lead]).toEqual([1, 'main', 'twinkle']);
  });

  it('grows bored with the song playing by the entropy a section, and the others fade by that entropy shared among the songs on air, to none (step 3)', () => {
    let r = rotationOf(0.5, 0.5, 0.5);
    r = afterSection(r, 1, 0.3);
    r = afterSection(r, 1, 0.3);
    r = afterSection(r, 2, 0.3);
    const fixed = (rot: Rotation) => rot.songs.map((s) => s.boredom.toFixed(4));
    // (0.3 a section shared among 3 songs: 0.1 off each other a section)
    expect(fixed(r)).toEqual(['0.5000', '0.3000', '0.0000']);
    for (let i = 0; i < 5; i++) r = afterSection(r, null, 0.3);
    expect(fixed(r)).toEqual(['0.0000', '0.0000', '0.0000']);
  });
});

describe('a worn song rests (step 3, the owner’s rulings of 2026-11-24)', () => {
  /** The rotation after `sections` sections of song `id` at entropy 1. */
  const playedFor = (r: Rotation, id: number, sections: number) => {
    for (let i = 0; i < sections; i++) r = afterSection(r, id, 1);
    return r;
  };

  it('rests past the ladder’s last rung, WORN, and comes back once its boredom has faded to none', () => {
    expect(WORN).toBe(6);
    let r = playedFor(rotationOf(0.5, 0.52, 0.54, 0.56, 0.58), 1, 5);
    expect(r.songs[0]!.resting).toBe(false);
    r = playedFor(r, 1, 1);
    expect([r.songs[0]!.boredom, r.songs[0]!.resting]).toEqual([6, true]);
    // (off air, a section no song plays: 1 shared among the 4 songs on air, a quarter each; 24 sections to none)
    for (let i = 0; i < 23; i++) r = afterSection(r, null, 1);
    expect([r.songs[0]!.boredom, r.songs[0]!.resting]).toEqual([0.25, true]);
    r = afterSection(r, null, 1);
    expect([r.songs[0]!.boredom, r.songs[0]!.resting]).toEqual([0, false]);
  });

  it('never draws a resting song, and doesn’t count it toward the cap: a new song is made in its place', () => {
    // (cap 8 at 0.3: a rotation of 8 with one resting has 7 on air, under its cap, so a new song is made)
    let r = rotationOf(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
    r = playedFor(r, 3, 6);
    expect(r.songs.find((s) => s.id === 3)!.resting).toBe(true);
    expect(nextSong(r, ask({ playing: 1 }))).toEqual({ kind: 'new', form: 'verse_chorus' });
    // (with no form found, a draw among those on air: never song 3)
    for (let index = 0; index < 200; index++) {
      const next = nextSong(r, ask({ playing: 1, found: null, index }));
      expect(next.kind === 'replay' && next.song.id).not.toBe(3);
    }
  });

  it('keeps a resting song where a new one is made, and trims the songs on air to the cap once it returns: the one that fits worst and played least leaves, never a resting one or the one playing', () => {
    let r = rotationOf(0.5, 0.9, 0.55, 0.6);
    r = playedFor(r, 1, 6);
    // (cap 4 at entropy 0: song 1 resting, a fifth made at 0.5 leaves 4 on air and keeps song 1)
    const fifth = made(
      r,
      { form: 'verse_chorus', point: HERE, mode: 'ionian', meter: FOUR },
      capOf(0),
      HERE,
    );
    expect(fifth.songs.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
    // (song 1 back on air makes 5: the farthest, song 2 at 0.9, leaves; where song 2 is playing, the next farthest, 4)
    const back = { ...fifth, songs: fifth.songs.map((s) => ({ ...s, resting: false })) };
    expect(trimmed(back, capOf(0), HERE, 2).songs.map((s) => s.id)).toEqual([1, 2, 3, 5]);
    expect(trimmed(back, capOf(0), HERE, null).songs.map((s) => s.id)).toEqual([1, 3, 4, 5]);
    const kept = trimmed(back, capOf(0), HERE, null);
    expect(trimmed(kept, capOf(0), HERE, null)).toBe(kept);
    expect(trimmed(fifth, capOf(0), HERE, null)).toBe(fifth);
  });

  it('trims the songs on air as a song comes back from its rest, as seen from the style now, never the one playing', () => {
    // (cap 4 at entropy 0.04: song 1 resting with a hair of boredom left comes back after a section, making 5 on air)
    const r = playedFor(rotationOf(0.5, 0.9, 0.55, 0.6), 1, 6);
    const fifth = made(
      r,
      { form: 'verse_chorus', point: HERE, mode: 'ionian', meter: FOUR },
      capOf(0.04),
      HERE,
    );
    const nearlyRested = {
      ...fifth,
      songs: fifth.songs.map((s) => (s.id === 1 ? { ...s, boredom: 0.005 } : s)),
    };
    const back = afterSection(nearlyRested, 2, 0.04, HERE);
    expect(back.songs.find((s) => s.id === 1)!.resting).toBe(false);
    // (song 2, at 0.9 the farthest, is playing: the next farthest, song 4, leaves)
    expect(back.songs.map((s) => s.id)).toEqual([1, 2, 3, 5]);
    expect(afterSection(nearlyRested, 2, 0.04).songs.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
  });
});

/** A version of a song: the original (0) or a mix, its tonic, drum bar and bass line. */
const version = (id: number, over: Partial<SongVersion> = {}): SongVersion => ({
  id,
  tonic: 0,
  drums: { rhythmFragment: 'four_on_the_floor' },
  bass: 'root_bass',
  changes: id === 0 ? [] : ['key'],
  tempo: 1,
  shift: {},
  ...over,
});

/** Song 1 of a rotation, heard in these versions, the last of them played last. */
const songIn = (...versions: SongVersion[]): Song =>
  versions.reduce((r, v) => versioned(r, 1, v), rotationOf(0.5)).songs[0]!;

const versionAsk = (over: Partial<Parameters<typeof nextVersion>[1]> = {}) => ({
  entropy: 0.3,
  seed: 1,
  index: 8,
  ...over,
});

describe('a song’s versions: its original and its mixes (#547 rung 5 step 2, the owner’s rulings of 2026-11-23)', () => {
  it('plays a new song as its original, and keeps what the original plays: its tonic, drum bar and bass line', () => {
    const fresh = rotationOf(0.5).songs[0]!;
    expect(fresh.versions).toEqual([]);
    expect(nextVersion(fresh, versionAsk())).toEqual({ kind: 'original' });
    const song = songIn(version(0, { tonic: 7 }));
    expect([song.versions.length, song.versions[0]!.tonic, song.version]).toEqual([1, 7, 0]);
  });

  it('plays the version it played last at entropy 0: the station holds, a mix too', () => {
    expect(nextVersion(songIn(version(0)), versionAsk({ entropy: 0 }))).toEqual({
      kind: 'original',
    });
    expect(nextVersion(songIn(version(0), version(1)), versionAsk({ entropy: 0 }))).toEqual({
      kind: 'mix',
      version: 1,
    });
  });

  it('mixes a song played again as often as the entropy says: 0.3 of its plays at 0.3, 0.7 at 0.7', () => {
    const song = songIn(version(0));
    for (const entropy of [0.3, 0.7]) {
      const plays = Array.from({ length: 4000 }, (_, index) =>
        nextVersion(song, versionAsk({ entropy, index })),
      );
      const mixed = plays.filter((p) => p.kind !== 'original').length / plays.length;
      expect(Math.abs(mixed - entropy), `at ${entropy}`).toBeLessThan(0.03);
    }
  });

  it('makes a new mix while the song keeps fewer than MIXES_KEPT, changing one of its key, groove, speed or style, now and then a second', () => {
    expect([MIXES_KEPT, MIX_SECOND]).toEqual([3, 0.5]);
    expect(MIX_CHANGES).toEqual(['key', 'groove', 'speed', 'style']);
    const song = songIn(version(0), version(1), version(2));
    const made = Array.from({ length: 4000 }, (_, index) =>
      nextVersion(song, versionAsk({ index })),
    ).filter((p) => p.kind === 'new mix');
    expect(made.length).toBeGreaterThan(1000);
    const changes = made.map((p) => (p.kind === 'new mix' ? [...p.changes].sort().join('+') : ''));
    const share = (c: string) => changes.filter((x) => x === c).length / changes.length;
    // (one change each, the four alike; a second at entropy 0.3 × MIX_SECOND, 0.15, any of the other three)
    const twos = changes.filter((c) => c.includes('+')).length / changes.length;
    expect(Math.abs(twos - 0.15)).toBeLessThan(0.03);
    for (const one of MIX_CHANGES) expect(Math.abs(share(one) - 0.85 / 4), one).toBeLessThan(0.03);
    const pairs = new Set(changes.filter((c) => c.includes('+')));
    expect(pairs.size).toBe(6);
    for (const c of changes)
      expect(c.split('+').every((one) => (MIX_CHANGES as readonly string[]).includes(one))).toBe(
        true,
      );
  });

  it('moves a speed mix’s tempo by SPEED_LEAST to SPEED_REACH of the original’s, faster or slower, and shifts a style mix’s style by STYLE_STEP on every axis', () => {
    expect([SPEED_LEAST, SPEED_REACH, STYLE_STEP]).toEqual([0.03, 0.08, 0.075]);
    const tempos = Array.from({ length: 2000 }, (_, index) => mixTempoOf(1, index));
    for (const t of tempos) {
      expect(Math.abs(t - 1)).toBeGreaterThanOrEqual(SPEED_LEAST);
      expect(Math.abs(t - 1)).toBeLessThanOrEqual(SPEED_REACH);
    }
    const faster = tempos.filter((t) => t > 1).length / tempos.length;
    expect(Math.abs(faster - 0.5)).toBeLessThan(0.05);
    const axes = ['sync', 'harm', 'bite', 'mood'];
    const shifts = Array.from({ length: 2000 }, (_, index) => mixShiftOf(1, index, axes));
    for (const shift of shifts) {
      expect(Object.keys(shift)).toEqual(axes);
      for (const axis of axes) expect(Math.abs(shift[axis]!)).toBe(STYLE_STEP);
    }
    for (const axis of axes)
      expect(Math.abs(shifts.filter((s) => s[axis]! > 0).length / 2000 - 0.5)).toBeLessThan(0.05);
    expect([mixTempoOf(1, 3), mixShiftOf(1, 3, axes)]).toEqual([
      mixTempoOf(1, 3),
      mixShiftOf(1, 3, axes),
    ]);
  });

  it('shifts a style by a shift’s axes, held within each axis, the rest as it was', () => {
    const style = { ...STYLE_AT, sync: 0.5, harm: 0.97, bite: 0.02 };
    const shifted = styleShifted(style, { sync: 0.075, harm: 0.075, bite: -0.075 });
    expect([shifted.sync, shifted.harm, shifted.bite, shifted.mood, shifted.bpm]).toEqual([
      0.575,
      1,
      0,
      style.mood,
      style.bpm,
    ]);
    expect(styleShifted(style, {})).toEqual(style);
  });

  it('plays one of the mixes it keeps once it keeps MIXES_KEPT, never the one it played last', () => {
    const song = songIn(version(0), version(1), version(3), version(2));
    const mixes = Array.from({ length: 2000 }, (_, index) =>
      nextVersion(song, versionAsk({ index })),
    ).filter((p) => p.kind !== 'original');
    expect(mixes.every((p) => p.kind === 'mix')).toBe(true);
    const played = new Set(mixes.map((p) => (p.kind === 'mix' ? p.version : -1)));
    expect([...played].sort()).toEqual([1, 3]);
  });

  it('is the same for the same seed and index', () => {
    const song = songIn(version(0), version(1));
    const at = (seed: number) =>
      Array.from({ length: 64 }, (_, index) => nextVersion(song, versionAsk({ seed, index })));
    expect(at(1)).toEqual(at(1));
    expect(at(1)).not.toEqual(at(2));
  });

  it('keeps a version heard again in its place, and names the original and each mix', () => {
    const song = songIn(version(0), version(1), version(0, { tonic: 2 }));
    expect(song.versions.map((v) => [v.id, v.tonic])).toEqual([
      [0, 2],
      [1, 0],
    ]);
    expect(song.version).toBe(0);
    expect([0, 1, 2].map(versionTitle)).toEqual(['original', 'mix 1', 'mix 2']);
  });
});
