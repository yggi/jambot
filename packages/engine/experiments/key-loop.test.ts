import { describe, expect, it } from 'vitest';
import { HISTORY_DECAY, SECTION_BARS, timeConstant } from '../src/index.ts';
import { keyLoops } from './key-loop.ts';

/** E19 over 10 seeds of 33 sections: still, and where the key moves most. */
const still = keyLoops(0, 10);
const moving = keyLoops(1, 10);
const named = (name: string) => moving.find((m) => m.preset === name)!;

describe('the key’s loop, left alone (E19)', () => {
  it('remembers for about 6.7 bars, less than the section the key is held for (A4, C9)', () => {
    expect(timeConstant(HISTORY_DECAY)).toBeCloseTo(6.67, 2);
    expect(timeConstant(HISTORY_DECAY)).toBeLessThan(SECTION_BARS);
  });

  it('bounds each jump by the style’s reach, and moves at no entropy never (A4, C9)', () => {
    for (const m of moving) expect(m.widestJump, m.preset).toBeLessThanOrEqual(m.reach);
    for (const m of still) expect([m.preset, m.jumpRate, m.back]).toEqual([m.preset, 0, 1]);
  });

  it('has no key of its own to return to: where it moves, it ends as far from where it opened as a key drawn at random (Q11)', () => {
    // A key drawn evenly round the circle lies 3 fifths from any other on average.
    for (const m of moving.filter((m) => m.reach > 0)) {
      expect(m.drift.at(-1), m.preset).toBeGreaterThan(2);
      expect(m.back, m.preset).toBeLessThanOrEqual(0.1);
    }
  });

  it('brings the home to a new key in under 4 bars, but not by the section’s end where the harmony is thin (A4, C9)', () => {
    for (const m of moving.filter((m) => m.reach > 0)) {
      expect(m.homeLag, m.preset).toBeLessThan(4);
      expect(m.homeError, m.preset).toBeGreaterThan(0.2);
    }
    expect(named('Swing jazz').homeMissed).toBe(0);
    expect(named('Bossa nova').homeMissed).toBeLessThan(0.05);
    expect(named('Funk').homeMissed).toBeGreaterThan(0.2);
    expect(named('Ambient').homeMissed).toBeGreaterThan(0.4);
  });
});
