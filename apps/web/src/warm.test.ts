import { describe, expect, it } from 'vitest';
import { type IdlePeriod, RESERVE, warmAtIdle } from './warm.ts';

/** A clock that steps take time on, and idle periods of 50 ms that run when asked. */
function rig(stepMs: number, count: number) {
  let t = 0;
  const now = () => t;
  const pending: ((p: IdlePeriod) => void)[] = [];
  function* steps() {
    for (let i = 0; i < count; i++) {
      t += stepMs;
      yield;
    }
  }
  const runIdle = () => {
    const slice = pending.shift()!;
    const end = t + 50;
    slice({ timeRemaining: () => Math.max(0, end - t) });
  };
  return {
    now,
    steps,
    pending,
    runIdle,
    schedule: (s: (p: IdlePeriod) => void) => void pending.push(s),
  };
}

describe('warming ahead at idle (#397)', () => {
  it('runs nothing until the thread is idle, then a slice at a time, until the steps end', () => {
    const r = rig(10, 7);
    const warming = warmAtIdle(r.steps(), r.schedule, r.now);
    expect(warming.steps).toBe(0);
    r.runIdle();
    // 50 ms of idle: a step starts while more than RESERVE remain, so 3 steps (at 50, 40 and 30 left).
    expect([warming.steps, warming.slices, warming.finished]).toEqual([3, 1, null]);
    r.runIdle();
    r.runIdle();
    expect([warming.steps, warming.slices, warming.finished]).toEqual([7, 3, 70]);
    expect(r.pending).toEqual([]);
  });

  it('keeps a slice within the idle period where no step is longer than the reserve', () => {
    const r = rig(RESERVE, 20);
    const warming = warmAtIdle(r.steps(), r.schedule, r.now);
    while (r.pending.length) r.runIdle();
    expect(warming.steps).toBe(20);
    expect(warming.longestSlice).toBeLessThanOrEqual(50);
    expect(warming.longestStep).toBe(RESERVE);
  });
});
