import { SCALES as NAMED_SCALES, gaps, positions, shift } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  COMPOSER_MODES,
  INITIAL_KEY,
  type Key,
  MELODIC_SCALES,
  type MelodicScale,
  keyHelix,
  keyName,
  melodicHelix,
  nextKey,
  released,
} from './key.ts';

const range = (n: number) => [...Array(n).keys()];

/** The prototype's scales and pivotRoot, as the reference. */
const SCALES: Record<string, number[]> = {
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  // (the three the prototype didn't play, #516)
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};
function pivotRoot(k: Key, mode: string): number {
  const cur = new Set(SCALES[k.mode]!.map((x) => (x + k.tonic) % 12));
  let best = k.tonic;
  let bs = -1e9;
  for (let r = 0; r < 12; r++) {
    const ov = SCALES[mode]!.filter((x) => cur.has((x + r) % 12)).length;
    const f = ((((r - k.tonic) * 7) % 12) + 12) % 12;
    const fifths = Math.min(f, 12 - f);
    const sc = ov * 100 - fifths * 2 - (r === k.tonic ? 0 : 1);
    if (sc > bs) {
      bs = sc;
      best = r;
    }
  }
  return best;
}

describe('keys', () => {
  it('are the seven diatonic modes, the prototype’s four first, starting in A minor (#516)', () => {
    // The prototype's minor, dorian, major and mixolydian, then the three its
    // tables didn't cover: the owner's "all 7 modes".
    expect(COMPOSER_MODES).toEqual([
      'aeolian',
      'dorian',
      'ionian',
      'mixolydian',
      'phrygian',
      'lydian',
      'locrian',
    ]);
    expect(INITIAL_KEY).toEqual({ tonic: 9, mode: 'aeolian' });
  });

  it('are a diatonic mode on a tonic', () => {
    expect(keyHelix({ tonic: 0, mode: 'ionian' }).heights).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(keyHelix(INITIAL_KEY).heights).toEqual([9, 11, 12, 14, 16, 17, 19]);
    for (const mode of COMPOSER_MODES)
      for (const tonic of range(12))
        expect(positions(keyHelix({ tonic, mode }))).toEqual(
          SCALES[mode]!.map((x) => (x + tonic) % 12).sort((a, b) => a - b),
        );
  });

  it('go where a wish with a tonic says, and stay when the wish is met', () => {
    const key: Key = { tonic: 2, mode: 'dorian' };
    expect(nextKey(key, { tonic: 7, mode: 'mixolydian' })).toEqual({
      tonic: 7,
      mode: 'mixolydian',
    });
    expect(nextKey(key, { tonic: null, mode: 'dorian' })).toBe(key);
    expect(nextKey(key, { tonic: 2, mode: 'dorian' })).toBe(key);
  });

  it('pivot on a wish for another mode alone, keeping the most notes, as the prototype does', () => {
    // A minor → D dorian → C major share all seven notes.
    expect(nextKey(INITIAL_KEY, { tonic: null, mode: 'dorian' })).toEqual({
      tonic: 2,
      mode: 'dorian',
    });
    expect(nextKey({ tonic: 2, mode: 'dorian' }, { tonic: null, mode: 'ionian' })).toEqual({
      tonic: 0,
      mode: 'ionian',
    });
    for (const from of COMPOSER_MODES)
      for (const tonic of range(12))
        for (const mode of COMPOSER_MODES) {
          const key = { tonic, mode: from };
          expect(nextKey(key, { tonic: null, mode }).tonic).toBe(
            mode === from ? tonic : pivotRoot(key, mode),
          );
        }
  });

  it('settle on a wish in one step: applied again, a wish changes nothing (C6)', () => {
    const wishes = COMPOSER_MODES.flatMap((mode) =>
      [null, ...range(12)].map((tonic) => ({ tonic, mode })),
    );
    for (const mode of COMPOSER_MODES)
      for (const tonic of range(12))
        for (const wish of wishes) {
          const once = nextKey({ tonic, mode }, wish);
          expect(once.mode).toBe(wish.mode);
          expect(nextKey(once, wish)).toEqual(once);
        }
  });

  it('names each key by its tonic, spelled in the key, and its mode (P2)', () => {
    expect(keyName(INITIAL_KEY)).toBe('A aeolian');
    expect(keyName({ tonic: 3, mode: 'dorian' })).toBe('Eb dorian');
    expect(keyName({ tonic: 6, mode: 'mixolydian' })).toBe('F# mixolydian');
    expect(keyName({ tonic: 1, mode: 'ionian' })).toBe('Db ionian');
    const names = COMPOSER_MODES.flatMap((mode) =>
      range(12).map((tonic) => keyName({ tonic, mode })),
    );
    expect(new Set(names).size).toBe(84);
  });
});

describe('a wish once met', () => {
  it('lets go of its tonic once the band plays the key wished, keeping the mode and the melodic scale, for every key (#169, #209)', () => {
    for (const mode of COMPOSER_MODES)
      for (let tonic = 0; tonic < 12; tonic++)
        for (const melodic of [null, ...MELODIC_SCALES])
          expect(released({ tonic, mode, melodic }, { tonic, mode })).toEqual({
            tonic: null,
            mode,
            melodic,
          });
  });

  it('holds a wish the band has not reached: another tonic, or another mode', () => {
    const wish = { tonic: 2, mode: 'dorian', melodic: 'blues' } as const;
    expect(released(wish, { tonic: 9, mode: 'dorian' })).toBe(wish);
    expect(released(wish, { tonic: 2, mode: 'aeolian' })).toBe(wish);
  });

  it('leaves a wish for a mode alone as it is, its melodic scale included', () => {
    const wish = { tonic: null, mode: 'ionian', melodic: 'pentatonic' } as const;
    expect(released(wish, { tonic: 0, mode: 'ionian' })).toBe(wish);
  });
});

describe('the melodic scale', () => {
  /** The theory's named scale each melodic scale is, over a minor or a major parent. */
  const NAMED: Record<MelodicScale, { minor: string | null; major: string | null }> = {
    plain: { minor: null, major: null },
    pentatonic: { minor: 'minor pentatonic', major: 'major pentatonic' },
    blues: { minor: 'blues', major: 'major blues' },
  };
  /**
   * The same, as intervals over the tonic, checked with music21 10.5.0 (the
   * parent's degrees picked and altered, over all 12 tonics and 4 modes) and
   * tonal 6.4 (`Scale.get('A minor blues')` and the others).
   */
  const INTERVALS: Record<Exclude<MelodicScale, 'plain'>, { minor: number[]; major: number[] }> = {
    pentatonic: { minor: [0, 3, 5, 7, 10], major: [0, 2, 4, 7, 9] },
    blues: { minor: [0, 3, 5, 6, 7, 10], major: [0, 2, 3, 4, 7, 9] },
  };
  // (locrian's fifth is diminished: it has no pentatonic or blues, its lead walking the key's seven, below)
  const KEYS: Key[] = COMPOSER_MODES.filter((mode) => mode !== 'locrian').flatMap((mode) =>
    range(12).map((tonic) => ({ tonic, mode })),
  );
  const minor = (key: Key) =>
    key.mode === 'aeolian' || key.mode === 'dorian' || key.mode === 'phrygian';

  it('are the plain mode, pentatonic and blues', () => {
    expect(MELODIC_SCALES).toEqual(['plain', 'pentatonic', 'blues']);
  });

  it('is the key itself when plain, exactly', () => {
    for (const key of KEYS) expect(melodicHelix(key, 'plain')).toEqual(keyHelix(key));
  });

  it("is the theory's pentatonic and blues, minor or major as the parent mode is, over every tonic and mode", () => {
    for (const key of KEYS)
      for (const scale of ['pentatonic', 'blues'] as const) {
        const side = minor(key) ? 'minor' : 'major';
        const named = NAMED_SCALES[NAMED[scale][side]!]!.helix;
        const helix = melodicHelix(key, scale);
        expect(positions(helix)).toEqual(positions(shift(named, key.tonic)));
        expect(positions(shift(helix, -key.tonic))).toEqual(INTERVALS[scale][side]);
      }
  });

  it('stands on the parent: its tonic where the key has it, rising within one turn, the pentatonic a subset and the blues one note more', () => {
    for (const key of KEYS) {
      const parent = keyHelix(key);
      const inParent = new Set(parent.heights);
      for (const scale of MELODIC_SCALES) {
        const helix = melodicHelix(key, scale);
        expect(helix.cycle).toBe(12);
        expect(helix.heights[0]).toBe(parent.heights[0]);
        expect(gaps(helix).every((g) => g > 0)).toBe(true);
        expect(gaps(helix).reduce((a, b) => a + b, 0)).toBe(12);
        const off = helix.heights.filter((h) => !inParent.has(h));
        expect(off).toHaveLength(scale === 'blues' ? 1 : 0);
      }
      // The blue note is a semitone under a degree of the pentatonic: the fifth in minor, the third in major.
      const blue = melodicHelix(key, 'blues').heights.find((h) => !inParent.has(h))!;
      expect(blue - parent.heights[0]!).toBe(minor(key) ? 6 : 3);
      expect(melodicHelix(key, 'pentatonic').heights).toEqual(
        melodicHelix(key, 'blues').heights.filter((h) => h !== blue),
      );
    }
  });
});

describe('locrian’s melodic scale (#516)', () => {
  it('is the key itself, whatever is asked: its fifth is diminished, and the pentatonic and the blues stand on a perfect one', () => {
    for (const tonic of range(12)) {
      const key: Key = { tonic, mode: 'locrian' };
      for (const scale of MELODIC_SCALES) expect(melodicHelix(key, scale)).toEqual(keyHelix(key));
    }
  });
});
