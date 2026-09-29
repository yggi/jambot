import { positions } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  COMPOSER_MODES,
  INITIAL_KEY,
  type Key,
  keyHelix,
  keyName,
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
  it('are the four modes the composer knows, starting in A minor', () => {
    // The prototype's minor, dorian, major and mixolydian: its transition
    // tables cover these four, so the port keeps them.
    expect(COMPOSER_MODES).toEqual(['aeolian', 'dorian', 'ionian', 'mixolydian']);
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
    expect(new Set(names).size).toBe(48);
  });
});

describe('a wish once met', () => {
  it('lets go of its tonic once the band plays the key wished, keeping the mode, for every key (#169)', () => {
    for (const mode of COMPOSER_MODES)
      for (let tonic = 0; tonic < 12; tonic++)
        expect(released({ tonic, mode }, { tonic, mode })).toEqual({ tonic: null, mode });
  });

  it('holds a wish the band has not reached: another tonic, or another mode', () => {
    const wish = { tonic: 2, mode: 'dorian' } as const;
    expect(released(wish, { tonic: 9, mode: 'dorian' })).toBe(wish);
    expect(released(wish, { tonic: 2, mode: 'aeolian' })).toBe(wish);
  });

  it('leaves a wish for a mode alone as it is', () => {
    const wish = { tonic: null, mode: 'ionian' } as const;
    expect(released(wish, { tonic: 0, mode: 'ionian' })).toBe(wish);
  });
});
