import { describe, expect, it } from 'vitest';
import { HISTORY_DECAY, SECTION_BARS, timeConstant } from '../src/index.ts';
import { entropyWalks, radioWalk, SETTINGS, styleLoop } from './radio-walk.ts';

/** E30 at a few of its settings, over 2 seeds of every preset. */
const at = (entropy: number, energy: number, energyWalks = true) =>
  radioWalk(
    SETTINGS.find(
      (s) => s.entropy === entropy && s.energy === energy && s.energyWalks === energyWalks,
    )!,
    2,
  );
const [cool, hot, low, high] = [at(0.3, 0.5), at(1, 0.5), at(0.3, 0.2, false), at(0.3, 0.8, false)];

describe('the radio’s walk over hours of music (E30)', () => {
  it('glides no axis at more than a sixth of the fastest a preset glide moves it, even hot (E30)', () => {
    for (const walk of [cool, hot])
      for (const [axis, ratio] of Object.entries(walk.rateRatio))
        expect(ratio, axis).toBeLessThan(1 / 6);
  });

  it('moves the tempo slowly: at most 1 % a section, and at entropy 0.3 and energy 0.5 under 6 % an hour (E30)', () => {
    for (const walk of [cool, hot, low, high]) expect(walk.tempoStep).toBeLessThanOrEqual(0.0101);
    expect(hot.tempoStep).toBeGreaterThan(0.0095);
    expect(cool.tempoMoves[1]).toBeLessThan(0.06);
  });

  it('ends the tempo higher, the higher the energy held (E30)', () => {
    expect(high.tempoEnd[1]).toBeGreaterThan(1.2 * low.tempoEnd[1]);
  });

  it('changes its nearest preset sooner and more often, the higher the entropy (E30)', () => {
    expect(hot.firstChange).toBeLessThan(cool.firstChange / 2);
    expect(hot.changesPerHour).toBeGreaterThan(2 * cool.changesPerHour);
    expect(hot.visited).toBeGreaterThan(cool.visited);
  });

  it('would cool and freeze if entropy walked under its own temperature: its median below 0.1 within 12 hours (E30)', () => {
    const [, twelve] = entropyWalks([3, 12], 40);
    expect(twelve!.entropy[1]).toBeLessThan(0.1);
  });
  it('gives the style’s loop with nobody in it three numbers: at entropy 1, a time constant over 40 sections on every axis, over 40 times the key’s; a gain, the pull a section, under a tenth of a pull of 1/128; a bound, no step past the step and no value on an end (A4, E30)', () => {
    const loop = styleLoop(1, 2, 20_000);
    for (const [axis, sections] of Object.entries(loop.sections)) {
      expect(sections, axis).toBeGreaterThan(40);
      expect((sections * SECTION_BARS) / timeConstant(HISTORY_DECAY), axis).toBeGreaterThan(40);
    }
    expect(Math.abs(loop.pull)).toBeLessThan(1 / 128 / 10);
    for (const [axis, ratio] of Object.entries(loop.largestStep)) {
      expect(ratio, axis).toBeLessThanOrEqual(1 + 1e-4);
      expect(ratio, axis).toBeGreaterThan(0.99);
    }
    expect(loop.atEnd).toBe(0);
  });
});
