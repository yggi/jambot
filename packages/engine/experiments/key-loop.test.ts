import { describe, expect, it } from 'vitest';
import { HISTORY_DECAY, SECTION_BARS, timeConstant } from '../src/index.ts';
import { keyLoops } from './key-loop.ts';

/** E19 over 10 seeds of 33 sections: still, and where the key moves most. */
const still = keyLoops(0, 10);
const moving = keyLoops(1, 10);
const named = (name: string) => moving.find((m) => m.preset === name)!;
/** The same under the radio's walk (#313 step 4): the style wanders, so the reach and the chance to move do. */
const wandering = keyLoops(1, 10, true);
const slow = keyLoops(0.3, 10, true);
const wanders = (name: string) => wandering.find((m) => m.preset === name)!;

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

  it('reads a key held a section or more back from the band’s chords where the harmony is rich, and not always where it is thin (F3, C9, Q12)', () => {
    const held = (name: string) => still.find((m) => m.preset === name)!.heldError;
    for (const name of ['Deep house', 'Bossa nova', 'Swing jazz']) expect(held(name), name).toBe(0);
    for (const name of ['Synth-pop', 'Lo-fi hip hop']) expect(held(name), name).toBeLessThan(0.01);
    for (const name of ['Techno', 'Ambient', 'Funk'])
      expect(held(name), name).toBeGreaterThan(0.01);
  });

  it('brings the history’s centre to a new key in under 4 bars, but not by the section’s end where the harmony is thin (A4, C9)', () => {
    for (const m of moving.filter((m) => m.reach > 0)) {
      expect(m.centreLag, m.preset).toBeLessThan(4);
      expect(m.centreError, m.preset).toBeGreaterThan(0.2);
    }
    expect(named('Swing jazz').centreMissed).toBe(0);
    expect(named('Bossa nova').centreMissed).toBeLessThan(0.05);
    expect(named('Funk').centreMissed).toBeGreaterThan(0.2);
    expect(named('Ambient').centreMissed).toBeGreaterThan(0.4);
  });

  it('still has no home under the radio’s walk: where the key moves it ends more than 1.5 fifths from where it opened (a random key lies 3), and is back on it in at most 1 run in 5 (Q11, #313)', () => {
    for (const m of wandering.filter((m) => m.reach > 0)) {
      expect(m.drift.at(-1), m.preset).toBeGreaterThan(1.5);
      expect(m.back, m.preset).toBeLessThanOrEqual(0.2);
    }
  });

  it('moves a key the preset holds still once the walk has raised its harmony, and then leaves it as wide a jump as the walk’s harmony reaches (#313)', () => {
    // Techno holds its key at every entropy (E19), and its reach is 0.
    expect(named('Techno').jumpRate).toBe(0);
    expect(wanders('Techno').jumpRate).toBeGreaterThan(0.4);
    expect(wanders('Techno').widestJump).toBeGreaterThan(wanders('Techno').reach);
    expect(slow.find((m) => m.preset === 'Techno')!.jumpRate).toBeGreaterThan(0);
    // The reach is the preset's at the opening only: the walk's harmony takes it past.
    expect(Math.max(...wandering.map((m) => m.widestJump - m.reach))).toBeGreaterThan(0);
  });

  it('keeps a station that opens with a thin harmony nearer its opening key at a low entropy, which the walk takes a long while to leave (#313)', () => {
    for (const name of ['Techno', 'Funk'])
      expect(slow.find((m) => m.preset === name)!.drift.at(-1), name).toBeLessThan(
        wandering.find((m) => m.preset === name)!.drift.at(-1)! + 1e-9,
      );
    expect(slow.find((m) => m.preset === 'Techno')!.back).toBeGreaterThan(0.5);
  });
});
