import { describe, expect, it } from 'vitest';
import { AXIS_NAMES, RADIO } from '../src/index.ts';
import { HOURS, radioWalk } from './radio-walk.ts';

/** E30 for the default walk, over 3 seeds of every preset. */
const walk = radioWalk('default', RADIO, 3);

describe('the radio’s walk over hours of music (E30)', () => {
  it('glides no axis at more than a third of the fastest a preset glide moves it (E30)', () => {
    for (const axis of AXIS_NAMES) expect(walk.rateRatio[axis], axis).toBeLessThan(1 / 3);
  });

  it('keeps the tip about 0.06 from the anchor, while the anchor strays farther by an hour and settles there (E30)', () => {
    expect(walk.tipOff).toBeGreaterThan(0.045);
    expect(walk.tipOff).toBeLessThan(0.07);
    const [tenMinutes, hour, end] = walk.anchorOff as [number, number, number];
    expect(tenMinutes).toBeLessThan(hour);
    expect(hour).toBeGreaterThan(2 * walk.tipOff);
    expect(Math.abs(end - hour)).toBeLessThan(0.3 * hour);
  });

  it('plays near the preset it was tuned in at most of the time, and leaves it within the hours walked (E30)', () => {
    expect(walk.atHome).toBeGreaterThan(0.7);
    expect(walk.atHome).toBeLessThan(0.98);
    expect(walk.visited).toBeGreaterThan(2);
    expect(walk.firstChange).toBeLessThan(HOURS * 60);
  });
});
