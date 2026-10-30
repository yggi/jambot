import { describe, expect, it } from 'vitest';
import {
  BAND_WIDTH,
  LEAN_AHEAD,
  BAND_WIDENING,
  LEAN_STEP,
  NO_LEAN,
  PATIENCE,
  bandOf,
  leanAt,
  leanedEntropy,
  regulated,
  wayOf,
  withLean,
} from './homeostat.ts';

/** Every entropy on a tenth's grid, 0 to 1. */
const ENTROPIES = [...Array(11).keys()].map((i) => i / 10);
/** Every share on a sixteenth's grid, 0 to 1, as a window of bars gives them. */
const SHARES = [...Array(17).keys()].map((i) => i / 16);

describe('the band the share is kept in (bandOf)', () => {
  it('is 0.4 to 0.7 at entropy 0.3, the owner’s ruling', () => {
    const band = bandOf(0.3);
    expect(band.low).toBeCloseTo(0.4, 12);
    expect(band.high).toBeCloseTo(0.7, 12);
  });

  it('widens with entropy about one centre, inside 0 to 1, at every entropy', () => {
    for (const [i, entropy] of ENTROPIES.entries()) {
      const { low, high } = bandOf(entropy);
      expect(low).toBeGreaterThanOrEqual(0);
      expect(high).toBeLessThanOrEqual(1);
      expect(low + high).toBeCloseTo(bandOf(0.3).low + bandOf(0.3).high, 12);
      expect(high - low).toBeCloseTo(BAND_WIDTH + BAND_WIDENING * (entropy - 0.3), 12);
      if (i)
        expect(high - low).toBeGreaterThan(
          bandOf(ENTROPIES[i - 1]!).high - bandOf(ENTROPIES[i - 1]!).low,
        );
    }
  });
});

describe('which way a share moves the ladder (wayOf)', () => {
  it('climbs above the band (bored), steps down under it (confused), holds inside it and where nothing was heard', () => {
    for (const entropy of ENTROPIES) {
      const { low, high } = bandOf(entropy);
      for (const share of SHARES)
        expect(wayOf(share, entropy)).toBe(share > high ? 1 : share < low ? -1 : 0);
      expect(wayOf(null, entropy)).toBe(0);
    }
  });
});

describe('the controller (regulated)', () => {
  it('leans the loop’s entropy a step the share’s way where the reading before agreed, never past 0 or 1, at every entropy, share, lean and reading before', () => {
    expect(PATIENCE).toBe(2);
    for (const entropy of ENTROPIES)
      for (const share of SHARES)
        for (const heard of [-1, 0, 1] as const)
          for (let lean = -entropy; lean <= 1 - entropy + 1e-9; lean += LEAN_STEP / 4) {
            const after = regulated(
              { ...NO_LEAN, lean, heard, run: Math.abs(heard) },
              share,
              entropy,
            );
            const way = wayOf(share, entropy) === heard ? heard : 0;
            expect(after.heard).toBe(wayOf(share, entropy));
            const wanted = Math.min(1 - entropy, Math.max(-entropy, lean + way * LEAN_STEP));
            expect(after.lean).toBe(way === 0 ? lean : wanted);
            expect(leanedEntropy(entropy, after.lean)).toBeGreaterThanOrEqual(0);
            expect(leanedEntropy(entropy, after.lean)).toBeLessThanOrEqual(1);
          }
  });

  it('waits for a second reading on one side, and counts a reversal where it moves against its last move', () => {
    const { low, high } = bandOf(0.3);
    const up = high + 0.1;
    const down = low - 0.1;
    const inside = (low + high) / 2;
    const read = (state: typeof NO_LEAN, ...shares: (number | null)[]) =>
      shares.reduce((s, share) => regulated(s, share, 0.3), state);
    let state = read(NO_LEAN, up);
    expect([state.lean, state.moved]).toEqual([0, 0]);
    state = read(state, up);
    expect([state.lean, state.moved, state.reversals]).toEqual([LEAN_STEP, 1, 0]);
    // (one reading out on the other side, then one inside: nothing moves)
    state = read(state, down, inside, up, down);
    expect([state.lean, state.moved, state.reversals]).toEqual([LEAN_STEP, 1, 0]);
    state = read(state, down);
    expect([state.lean, state.moved, state.reversals]).toEqual([0, -1, 1]);
    state = read(state, null, up, up);
    expect([state.lean, state.moved, state.reversals]).toEqual([LEAN_STEP, 1, 2]);
  });

  it('moves on every reading out of the band with no patience', () => {
    const state = regulated(NO_LEAN, 1, 0.3, LEAN_STEP, 1);
    expect([state.lean, state.moved]).toEqual([LEAN_STEP, 1]);
  });

  it('waits for as many readings in a row as its patience says, counting them, and starts again inside', () => {
    const { low, high } = bandOf(0.3);
    const up = high + 0.1;
    const inside = (low + high) / 2;
    for (const patience of [1, 2, 3, 4]) {
      let state = NO_LEAN;
      for (let reading = 1; reading <= patience; reading++) {
        expect(state.lean).toBe(0);
        state = regulated(state, up, 0.3, LEAN_STEP, patience);
        expect(state.run).toBe(reading);
      }
      expect(state.lean).toBe(LEAN_STEP);
      state = regulated(state, inside, 0.3, LEAN_STEP, patience);
      expect([state.run, state.lean]).toEqual([0, LEAN_STEP]);
    }
  });

  it('does not move, nor count a reversal, where the lean is already at its edge', () => {
    // (at entropy 0, leaned all the way down already: confused again moves nothing)
    const state = regulated({ lean: 0, moved: 1, reversals: 0, heard: -1, run: 1 }, 0, 0);
    expect(state).toEqual({ lean: 0, moved: 1, reversals: 0, heard: -1, run: 2 });
  });

  it('plays the players’ entropy as it is at no lean, and reaches 1 bored long enough', () => {
    for (const entropy of ENTROPIES) expect(leanedEntropy(entropy, NO_LEAN.lean)).toBe(entropy);
    let state = NO_LEAN;
    for (let i = 0; i < 3; i++) state = regulated(state, 1, 0.3);
    expect(state.lean).toBe(0.7);
    expect(leanedEntropy(0.3, state.lean)).toBe(1);
  });
});

describe('a song’s leans (leanAt, withLean)', () => {
  it('reads each bar’s lean from the latest change at or before it, none before the first', () => {
    const leans = withLean(withLean([], 16, 0.5), 32, 0);
    expect(leans).toEqual([
      { bar: 16, lean: 0.5 },
      { bar: 32, lean: 0 },
    ]);
    expect([0, 15, 16, 31, 32, 99].map((bar) => leanAt(leans, bar))).toEqual([
      0, 0, 0.5, 0.5, 0, 0,
    ]);
  });

  it('drops the changes after the bar a lean is set from, and adds none where it leans as before', () => {
    const leans = withLean(withLean([], 16, 0.5), 32, 1);
    expect(withLean(leans, 24, 0.5)).toEqual([{ bar: 16, lean: 0.5 }]);
    expect(withLean(leans, 24, 0.25)).toEqual([
      { bar: 16, lean: 0.5 },
      { bar: 24, lean: 0.25 },
    ]);
    expect(withLean([], 8, 0)).toEqual([]);
    expect(withLean(leans, 40, 1)).toBe(leans);
  });

  it('leans two sections after the one read, past the one forecast before the reading', () => {
    expect(LEAN_AHEAD).toBe(2);
  });
});
