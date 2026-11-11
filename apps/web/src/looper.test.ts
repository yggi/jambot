import { BAR_LOOPS, SECTION_BARS, barLoop, loopEnd, repeatSection, replayOf } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { askedSection, barsLooped, loopPast, loopState, loopView, tappedBars } from './looper.ts';

const range = (n: number) => [...Array(n).keys()];

describe('the loop menu (#628, #629)', () => {
  it('repeats or locks the section heard where the bar after it is still to compose, else the next, for every bar heard', () => {
    for (const heard of range(4 * SECTION_BARS))
      for (const next of [heard + 1, heard + 2])
        for (const [ask, laps] of [
          ['repeat', 1],
          ['lock', null],
        ] as const) {
          const loop = askedSection(null, ask, heard, next)!;
          const section = Math.floor(heard / SECTION_BARS) * SECTION_BARS;
          const repeated = section + SECTION_BARS >= next ? section : section + SECTION_BARS;
          expect(loop, `${ask}, heard ${heard}, next ${next}`).toEqual(
            repeatSection(repeated, laps),
          );
          // No bar it plays again is composed yet.
          expect(loop.at).toBeGreaterThanOrEqual(next);
          expect(loopState(loop, next)).toBe(ask === 'repeat' ? 'repeat' : 'locked');
        }
  });

  it('turns a repeat into a lock, calls a repeat off before it starts, and lets a lock go at its lap’s end', () => {
    const once = askedSection(null, 'repeat', 10, 11)!;
    expect(loopState(once, 11)).toBe('repeat');
    // Asked again before it starts, a repeat is called off.
    expect(askedSection(once, 'repeat', 12, 13)).toBeNull();
    // Started, it plays its lap.
    expect(askedSection(once, 'repeat', 18, 19)).toBe(once);
    const locked = askedSection(once, 'lock', 10, 11)!;
    expect(loopState(locked, 11)).toBe('locked');
    expect(loopEnd(locked)).toBeNull();
    // Let go before it plays, it is none; by either choice.
    expect(askedSection(locked, 'lock', 12, 13)).toBeNull();
    expect(askedSection(locked, 'repeat', 12, 13)).toBeNull();
    // Let go in its third lap, it plays that lap to its end.
    const ending = askedSection(locked, 'lock', 34, 35)!;
    expect(askedSection(locked, 'repeat', 34, 35)).toEqual(ending);
    expect(loopEnd(ending)).toBe(40);
    expect(loopState(ending, 35)).toBe('repeat');
    // Bar 39 plays the bar a lap before it, 31, itself bar 15 played again.
    expect(replayOf(ending, 39)).toBe(31);
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
    // A choice on a loop that is past asks for a new one.
    expect(askedSection(once, 'repeat', 30, 31)).toEqual(repeatSection(24, 1));
  });

  it('loops the last bars from the next on a tap of the looper, for every window and every bar (#629)', () => {
    for (const bars of BAR_LOOPS)
      for (const next of range(20).map((n) => n + 4)) {
        const loop = tappedBars(null, bars, next)!;
        expect(loop).toEqual(barLoop(next, bars));
        expect(barsLooped(loop, next)).toBe(bars);
        // The section's choices say nothing of it, and leave it.
        expect(loopState(loop, next)).toBe('off');
        expect(askedSection(loop, 'repeat', next - 1, next)).toBe(loop);
        expect(askedSection(loop, 'lock', next - 1, next)).toBe(loop);
      }
  });

  it('lets the window go at the end of its lap on a second tap, and halves or doubles it from the bars heard on another', () => {
    const two = tappedBars(null, 2, 13)!;
    // Let go as bar 18 is next: the lap from 17 plays to its end, at 19.
    const gone = tappedBars(two, 2, 18)!;
    expect(loopEnd(gone)).toBe(19);
    expect(barsLooped(gone, 18)).toBe(2);
    expect(barsLooped(gone, 20)).toBeNull();
    // Halved as bar 16 is next: the last bar heard, 15 (itself 13 played again), from 16.
    const one = tappedBars(two, 1, 16)!;
    expect(one).toEqual(barLoop(16, 1));
    expect([16, 17, 18].map((bar) => replayOf(one, bar))).toEqual([15, 16, 17]);
    // Doubled: the last four bars heard, two laps of the two, from 16.
    const four = tappedBars(two, 4, 16)!;
    expect(four).toEqual(barLoop(16, 4));
    // Before that many bars have played, a tap does nothing.
    expect(tappedBars(null, 4, 3)).toBeNull();
    expect(tappedBars(null, 2, 2)).toEqual(barLoop(2, 2));
  });

  it('rests while a section plays again', () => {
    const section = repeatSection(8, null);
    expect(tappedBars(section, 2, 18)).toBe(section);
    expect(barsLooped(section, 18)).toBeNull();
  });

  it('says on its trigger what plays: loop, repeat, locked, or the looper’s window', () => {
    expect(loopView(null, 5)).toEqual({ state: 'off', bars: null, word: 'loop' });
    expect(loopView(repeatSection(8, 1), 12).word).toBe('repeat');
    expect(loopView(repeatSection(8, null), 12).word).toBe('locked');
    expect(loopView(barLoop(12, 1), 12)).toEqual({ state: 'off', bars: 1, word: '1 bar' });
    expect(loopView(barLoop(12, 4), 12).word).toBe('4 bars');
    expect(loopView(repeatSection(8, 1), 25).word).toBe('loop');
  });
});
