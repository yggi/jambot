import { NUDGED, STEPPED } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  NUDGE_FADE,
  NUDGE_LEAST,
  NO_NUDGES,
  type Nudges,
  nudged,
  releaseNudges,
} from './nudges.ts';

/** Every section's release of `nudges` until none is left, and how many sections that took. */
function drained(nudges: Nudges, most = 100) {
  const leans = [];
  let left = nudges;
  for (let i = 0; i < most && Object.keys(left).length > 0; i++) {
    const { lean, nudges: next } = releaseNudges(left);
    leans.push(lean);
    left = next;
  }
  return { leans, left };
}

describe("the players' nudges", () => {
  it('releases a lone player’s nudge as one step in all: half at the next section, then half of the rest', () => {
    for (const axis of NUDGED.filter((a) => !(STEPPED as readonly string[]).includes(a)))
      for (const by of [1, -1] as const) {
        const { leans, left } = drained(nudged(NO_NUDGES, axis, by, 1));
        expect(left).toEqual(NO_NUDGES);
        expect(leans[0]![axis]).toBe(by * (1 - NUDGE_FADE));
        expect(leans[1]![axis]).toBe(by * (1 - NUDGE_FADE) * NUDGE_FADE);
        expect(leans.reduce((sum, l) => sum + (l[axis] ?? 0), 0)).toBeCloseTo(by, 12);
        // It fades out within a bound: the last release is the rest, under NUDGE_LEAST once halved.
        expect(leans.length).toBe(Math.ceil(Math.log2(1 / NUDGE_LEAST)));
      }
  });

  it('weighs a nudge by the players present: one among four moves a quarter step, four the same way a whole one', () => {
    const one = drained(nudged(NO_NUDGES, 'energy', 1, 4)).leans;
    expect(one.reduce((sum, l) => sum + (l.energy ?? 0), 0)).toBeCloseTo(0.25, 12);
    let four = NO_NUDGES;
    for (let i = 0; i < 4; i++) four = nudged(four, 'energy', 1, 4);
    expect(drained(four).leans.reduce((sum, l) => sum + (l.energy ?? 0), 0)).toBeCloseTo(1, 12);
    // Two that pull apart cancel, and leave nothing to release.
    expect(nudged(nudged(NO_NUDGES, 'sync', 1, 2), 'sync', -1, 2)).toEqual(NO_NUDGES);
    // A session of nobody counts as one player, so a nudge is never more than a step.
    expect(nudged(NO_NUDGES, 'harm', 1, 0)).toEqual(nudged(NO_NUDGES, 'harm', 1, 1));
  });

  it('steps the key and the meter whole, once the nudges come to half a step: a lone player at once, one of three with a second (minor 6)', () => {
    for (const axis of STEPPED)
      for (const by of [1, -1] as const) {
        // A lone player: a whole step at the next section line, and nothing left.
        const alone = releaseNudges(nudged(NO_NUDGES, axis, by, 1));
        expect(alone.lean, `${axis} ${by}`).toEqual({ [axis]: by });
        expect(alone.nudges).toEqual(NO_NUDGES);
        // One of three: no step, and it fades out without one.
        const { leans, left } = drained(nudged(NO_NUDGES, axis, by, 3));
        expect(leans.every((l) => l[axis] === undefined)).toBe(true);
        expect(left).toEqual(NO_NUDGES);
        // Two of three the same way: a step, and the rest of it fades.
        const two = releaseNudges(nudged(nudged(NO_NUDGES, axis, by, 3), axis, by, 3));
        expect(two.lean[axis]).toBe(by);
        expect(two.nudges[axis]).toBeCloseTo(-by * (1 / 3) * NUDGE_FADE, 12);
      }
    // Three from a lone player are two steps, a section apart: the third fades with the rest.
    let three = NO_NUDGES;
    for (let i = 0; i < 3; i++) three = nudged(three, 'key', 1, 1);
    const steps = drained(three).leans.map((l) => l.key ?? 0);
    expect(steps.reduce((a, b) => a + b, 0)).toBe(2);
    expect(steps.slice(0, 2)).toEqual([1, 1]);
  });

  it('keeps each axis apart, and releases nothing where nobody nudged', () => {
    const both = nudged(nudged(NO_NUDGES, 'bpm', -1, 1), 'artic', 1, 2);
    const { lean } = releaseNudges(both);
    expect(lean).toEqual({ bpm: -(1 - NUDGE_FADE), artic: 0.5 * (1 - NUDGE_FADE) });
    expect(releaseNudges(NO_NUDGES)).toEqual({ lean: {}, nudges: NO_NUDGES });
  });
});
