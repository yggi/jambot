import { describe, expect, it } from 'vitest';
import { EMPTY_HISTORY, HarmonicHistory } from './harmonicHistory.ts';

describe('HarmonicHistory', () => {
  it('starts silent', () => {
    expect(new HarmonicHistory().get()).toEqual(EMPTY_HISTORY);
  });

  it('weighs a note played by its pitch class, C = 0', () => {
    const history = new HarmonicHistory();
    history.push('lead', 0, 67); // G4
    const weights = history.get();
    expect(weights[7]).toBe(1);
    expect(weights.filter((w) => w !== 0)).toEqual([1]);
  });

  it('ignores the drums, which carry no pitch class worth reading as harmony', () => {
    const history = new HarmonicHistory();
    history.push('drums', 0, 36);
    expect(history.get()).toEqual(EMPTY_HISTORY);
  });

  it('sums repeats within the same bar, across performers', () => {
    const history = new HarmonicHistory();
    history.push('bass', 0, 60); // C
    history.push('comp', 0, 60); // C, another octave same pitch class
    history.push('lead', 0, 72); // C, another octave again
    expect(history.get()[0]).toBe(3);
  });

  it('decays every weight by the bars elapsed since the last note played', () => {
    const history = new HarmonicHistory();
    history.push('lead', 0, 60); // C, bar 0
    history.push('lead', 4, 67); // G, bar 4: C's weight decays by 4 bars
    const weights = history.get();
    expect(weights[0]).toBeCloseTo(0.85 ** 4);
    expect(weights[7]).toBe(1);
  });

  it('does not decay within the same bar', () => {
    const history = new HarmonicHistory();
    history.push('lead', 3, 60);
    history.push('bass', 3, 67);
    expect(history.get()[0]).toBe(1);
  });

  it('clears to silence', () => {
    const history = new HarmonicHistory();
    history.push('lead', 0, 60);
    history.clear();
    expect(history.get()).toEqual(EMPTY_HISTORY);
  });
});
