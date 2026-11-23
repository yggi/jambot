import { describe, expect, it } from 'vitest';
import {
  MIXES_KEPT,
  MIX_BOTH,
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
  type SongVersion,
  versioned,
  versionTitle,
} from './rotation.ts';
import { MISS_DISTANCE } from './meter-query.ts';
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
    for (let s = 0; s < 8; s++) r = afterSection(r, 1, 1);
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

  it('grows bored with the song playing by the entropy a section, and the others fade as fast, to none', () => {
    let r = rotationOf(0.5, 0.5);
    r = afterSection(r, 1, 0.3);
    r = afterSection(r, 1, 0.3);
    r = afterSection(r, 2, 0.3);
    const [one, two] = r.songs;
    expect([one!.boredom, two!.boredom].map((b) => b.toFixed(4))).toEqual(['0.3000', '0.3000']);
    r = afterSection(afterSection(r, null, 0.3), null, 0.3);
    expect(r.songs.map((s) => s.boredom)).toEqual([0, 0]);
  });
});

/** A version of a song: the original (0) or a mix, its tonic, drum bar and bass line. */
const version = (id: number, over: Partial<SongVersion> = {}): SongVersion => ({
  id,
  tonic: 0,
  drums: { rhythmFragment: 'four_on_the_floor' },
  bass: 'root_bass',
  changes: id === 0 ? [] : ['key'],
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

  it('makes a new mix while the song keeps fewer than MIXES_KEPT, changing its key or its groove, now and then both', () => {
    expect([MIXES_KEPT, MIX_BOTH]).toEqual([3, 0.5]);
    const song = songIn(version(0), version(1), version(2));
    const made = Array.from({ length: 4000 }, (_, index) =>
      nextVersion(song, versionAsk({ index })),
    ).filter((p) => p.kind === 'new mix');
    expect(made.length).toBeGreaterThan(1000);
    const changes = made.map((p) => (p.kind === 'new mix' ? [...p.changes].sort().join('+') : ''));
    const share = (c: string) => changes.filter((x) => x === c).length / changes.length;
    // (one change each, key or groove alike; both at entropy 0.3 × MIX_BOTH, 0.15)
    expect(Math.abs(share('groove+key') - 0.15)).toBeLessThan(0.03);
    expect(Math.abs(share('key') - share('groove'))).toBeLessThan(0.05);
    expect(changes.every((c) => ['key', 'groove', 'groove+key'].includes(c))).toBe(true);
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
