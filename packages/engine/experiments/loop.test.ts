import { describe, expect, it } from 'vitest';
import { BY_LICENCE, type Condition, type LoopMeasure, kendall, loopRun, loops } from './loop.ts';

// The numbers are literals, to be moved by the step that moves them.
/** E21 at entropy 0.3 over every preset, the narrowest licence first, one seed of 96 bars. */
const middle = loops(0.3, 1, 96);
/** The same at entropy 1, at the ends of the licence. */
const ENDS = [BY_LICENCE[0]!, BY_LICENCE.at(-1)!];
const wide = loops(1, 1, 96, ENDS);

const round = (x: number) => Math.round(x * 100) / 100;
/** A measure of every preset in one condition, as measured. */
const exactly = (rows: readonly LoopMeasure[], condition: Condition, of: keyof LoopMeasure) =>
  rows.filter((m) => m.condition === condition).map((m) => m[of] as number);
/** The same, to two decimals. */
const column = (rows: readonly LoopMeasure[], condition: Condition, of: keyof LoopMeasure) =>
  exactly(rows, condition, of).map(round);

describe('the loop closed with no players, the Muse hearing the band’s own lead, E21 (#237)', () => {
  it('orders the presets by their licence, Techno’s the narrowest and Swing jazz’s the widest (E21)', () => {
    expect(BY_LICENCE.map((p) => p.name)).toEqual([
      'Techno',
      'Funk',
      'Ambient',
      'Synth-pop',
      'Deep house',
      'Lo-fi hip hop',
      'Bossa nova',
      'Swing jazz',
    ]);
  });

  it('hears the lead’s notes on the grid by the nearest step as the transport’s phrase reading hears them (E21)', () => {
    for (const condition of ['deaf', 'hearing'] as const)
      expect(loopRun(ENDS[0]!, 1, 0.3, 24, condition, 'nearest'), condition).toEqual(
        loopRun(ENDS[0]!, 1, 0.3, 24, condition, 'phrases'),
      );
  });

  it('judges every bar it runs, and none after (E21)', () => {
    const run = loopRun(ENDS[0]!, 1, 0.3, 24, 'hearing');
    expect(run).toHaveLength(24);
    // The lead rests in the intro, so the Muse judges its first bars silent.
    expect(run.slice(0, 8).every((b) => b.motif === null && b.heardAs === null)).toBe(true);
    expect(run.slice(8).every((b) => b.motif !== null)).toBe(true);
  });

  it('recognises nearly every bar once it hears itself, where deaf it recognises about half, and hears a third as many new motifs (E21, Q7b, Q12)', () => {
    expect(column(middle, 'deaf', 'recognised')).toEqual([
      0.57, 0.63, 0.55, 0.52, 0.56, 0.51, 0.53, 0.63,
    ]);
    expect(column(middle, 'hearing', 'recognised')).toEqual([
      0.93, 0.91, 0.84, 0.86, 0.93, 0.89, 0.92, 0.84,
    ]);
    expect(column(middle, 'deaf', 'novelty')).toEqual([
      3.08, 2.75, 1.08, 3.42, 3.17, 3.42, 2.83, 2.75,
    ]);
    expect(column(middle, 'hearing', 'novelty')).toEqual([0.5, 0.67, 1, 1, 0.5, 0.83, 0.58, 1.17]);
  });

  it('hears what it recognises of itself mostly as exact repeats, as it does deaf (E21, Q7b, Q12)', () => {
    expect(column(middle, 'hearing', 'exact')).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(column(middle, 'deaf', 'exact')).toEqual([
      0.84, 0.87, 0.88, 0.87, 0.92, 0.95, 0.89, 0.93,
    ]);
  });

  it('doesn’t stall on one bar, but oscillates: the first motif it heard on every other bar, a few others between (E21, Q7b)', () => {
    expect(column(middle, 'hearing', 'longestAny')).toEqual([5, 5, 1, 7, 9, 7, 3, 5]);
    expect(column(middle, 'hearing', 'stalled')).toEqual([0, 0, 0, 0, 0.1, 0, 0, 0]);
    expect(column(middle, 'hearing', 'oscillating')).toEqual([
      0.62, 0.49, 0.65, 0.44, 0.44, 0.59, 0.49, 0.38,
    ]);
    expect(column(middle, 'deaf', 'oscillating')).toEqual([
      0.28, 0.37, 0.45, 0.36, 0.36, 0.38, 0.35, 0.38,
    ]);
    expect(column(middle, 'hearing', 'commonest')).toEqual([
      0.59, 0.66, 0.5, 0.58, 0.6, 0.55, 0.54, 0.64,
    ]);
    expect(column(middle, 'deaf', 'commonest')).toEqual([
      0.28, 0.4, 0.52, 0.1, 0.33, 0.11, 0.13, 0.36,
    ]);
    expect(column(middle, 'hearing', 'firstHeld')).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(column(middle, 'deaf', 'firstHeld')).toEqual([1, 1, 0, 0, 1, 0, 0, 1]);
    // Deaf, the lead's own phrase puts its shape on a phrase's first and third bars too.
    expect(column(middle, 'deaf', 'oneParity')).toEqual([
      0.88, 0.8, 0.8, 0.89, 0.97, 0.89, 0.89, 0.88,
    ]);
    expect(column(middle, 'hearing', 'oneParity')).toEqual([
      0.85, 0.76, 1, 0.86, 0.83, 0.92, 0.94, 0.79,
    ]);
  });

  it('doesn’t drift: once it hears itself, half or more of its last section is heard as its first, where deaf, in most presets, none of it is (E21, Q7b)', () => {
    expect(column(middle, 'hearing', 'returns')).toEqual([
      0.63, 0.88, 0.88, 0.75, 0.88, 0.5, 0.88, 0.63,
    ]);
    expect(column(middle, 'deaf', 'returns')).toEqual([0, 0, 0.5, 0, 0, 0, 0, 0]);
    expect(column(middle, 'hearing', 'distinct')).toEqual([6, 6, 10, 9, 6, 9, 6, 10]);
    expect(column(middle, 'deaf', 'distinct')).toEqual([37, 31, 14, 45, 32, 41, 37, 31]);
  });

  it('recognises less as the entropy rises, deaf, but not monotonically less as the licence widens (E21, Q7b)', () => {
    const licence = BY_LICENCE.map((p) => p.style.harm);
    expect(round(kendall(licence, exactly(middle, 'deaf', 'recognised')))).toBe(-0.18);
    expect(round(kendall(licence, exactly(middle, 'hearing', 'recognised')))).toBe(-0.18);
    const at = (rows: readonly LoopMeasure[], condition: Condition) => [
      round(rows.find((m) => m.condition === condition && m.preset === 'Techno')!.recognised),
      round(rows.find((m) => m.condition === condition && m.preset === 'Swing jazz')!.recognised),
    ];
    expect([at(middle, 'deaf'), at(wide, 'deaf')]).toEqual([
      [0.57, 0.63],
      [0.46, 0.49],
    ]);
    expect([at(middle, 'hearing'), at(wide, 'hearing')]).toEqual([
      [0.93, 0.84],
      [0.89, 0.83],
    ]);
  });
});

describe('Kendall’s tau (E21)', () => {
  it('is 1 for lists that rise together, -1 for one that falls as the other rises, and 0 for none (E21)', () => {
    expect(kendall([1, 2, 3], [4, 5, 9])).toBe(1);
    expect(kendall([1, 2, 3], [9, 5, 4])).toBe(-1);
    expect(kendall([1, 2, 3], [5, 4, 6])).toBeCloseTo(1 / 3);
    expect(kendall([1, 2, 3], [5, 5, 5])).toBe(0);
  });
});
