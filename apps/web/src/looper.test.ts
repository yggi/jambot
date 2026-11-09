import { SECTION_BARS, loopEnd, repeatSection, replayOf } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { loopPast, loopState, tapped } from './looper.ts';

const range = (n: number) => [...Array(n).keys()];

describe('the loop button (#628)', () => {
  it('repeats the section heard where the bar after it is still to compose, else the next, for every bar heard', () => {
    for (const heard of range(4 * SECTION_BARS))
      for (const next of [heard + 1, heard + 2]) {
        const loop = tapped(null, heard, next)!;
        const section = Math.floor(heard / SECTION_BARS) * SECTION_BARS;
        const repeated = section + SECTION_BARS >= next ? section : section + SECTION_BARS;
        expect(loop, `heard ${heard}, next ${next}`).toEqual(repeatSection(repeated, 1));
        // No bar it plays again is composed yet.
        expect(loop.at).toBeGreaterThanOrEqual(next);
        expect(loopState(loop, next)).toBe('repeat');
      }
  });

  it('cycles: a repeat, a lock, released to the end of its lap', () => {
    const once = tapped(null, 10, 11)!;
    expect(loopState(once, 11)).toBe('repeat');
    const locked = tapped(once, 10, 11)!;
    expect(loopState(locked, 11)).toBe('locked');
    expect(loopEnd(locked)).toBeNull();
    // Released before it plays, it is none.
    expect(tapped(locked, 12, 13)).toBeNull();
    // Released in its third lap, it plays that lap to its end.
    const ending = tapped(locked, 34, 35)!;
    expect(loopEnd(ending)).toBe(40);
    expect(loopState(ending, 35)).toBe('repeat');
    expect(replayOf(ending, 39)).toBe(15);
    expect(replayOf(ending, 40)).toBeNull();
  });

  it('is off, and can go, once the bar the loop put off is composed', () => {
    const once = repeatSection(8, 1);
    for (const next of range(40)) {
      expect(loopState(once, next)).toBe(next > 24 ? 'off' : 'repeat');
      expect(loopPast(once, next)).toBe(next > 24);
    }
    expect(loopPast(repeatSection(8, null), 1000)).toBe(false);
    expect(loopState(null, 3)).toBe('off');
    // A tap on a loop that is past arms a new one.
    expect(tapped(once, 30, 31)).toEqual(repeatSection(24, 1));
  });
});
