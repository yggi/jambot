import {
  EMPTY_LAYER,
  type LearnedLayer,
  type RhythmBench,
  type RhythmRepository,
} from '@jambot/engine';
import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type IdlePeriod, SLICE_BUDGET, browserIdle, warmAtIdle, warmedOnFiling } from './warm.ts';

/** A clock that steps take time on, and idle periods of `periodMs` (50, the most a browser gives) that run when asked. */
function rig(stepMs: number, count: number, periodMs = 50) {
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
    const end = t + periodMs;
    slice({ timeRemaining: () => Math.max(0, end - t) });
  };
  /** Every slice until none is pending, or 10,000 of them: a warming that never moves on runs no more. */
  const runAll = () => {
    for (let i = 0; i < 10_000 && pending.length; i++) runIdle();
  };
  return {
    now,
    steps,
    pending,
    runIdle,
    runAll,
    schedule: (s: (p: IdlePeriod) => void) => void pending.push(s),
  };
}

describe('warming ahead at idle (#397)', () => {
  it('runs nothing until the thread is idle, then a slice at a time, until the steps end', () => {
    const r = rig(10, 7);
    const warming = warmAtIdle(r.steps(), r.schedule, r.now);
    expect(warming.steps).toBe(0);
    r.runIdle();
    // 50 ms of idle: a step starts within the slice's first SLICE_BUDGET ms, so 3 steps (at 0, 10 and 20 ms in).
    expect([warming.steps, warming.slices, warming.finished]).toEqual([3, 1, null]);
    r.runIdle();
    r.runIdle();
    expect([warming.steps, warming.slices, warming.finished]).toEqual([7, 3, 70]);
    expect(r.pending).toEqual([]);
  });

  it('keeps a slice within the idle period where no step is longer than the budget', () => {
    const r = rig(SLICE_BUDGET, 20);
    const warming = warmAtIdle(r.steps(), r.schedule, r.now);
    r.runAll();
    expect(warming.steps).toBe(20);
    expect(warming.longestSlice).toBeLessThanOrEqual(50);
    expect(warming.longestStep).toBe(SLICE_BUDGET);
  });

  it('moves on in the short idle periods a browser gives while it draws every frame, as while the band plays (#408)', () => {
    // A frame's idle period at 60 Hz, 16 ms at most: a step starts while the period lasts.
    const r = rig(5, 10, 16);
    const warming = warmAtIdle(r.steps(), r.schedule, r.now);
    r.runIdle();
    // Steps start at 16, 11, 6 and 1 ms left.
    expect([warming.steps, warming.slices]).toEqual([4, 1]);
    r.runAll();
    expect([warming.steps, warming.slices, warming.finished]).toEqual([10, 3, 50]);
  });

  it('finishes in every idle period from 1 to 50 ms, every slice under 50 ms where no step is longer than 24 ms (#408)', () => {
    for (let period = 1; period <= 50; period++)
      for (let step = 1; step <= 24; step++) {
        const r = rig(step, 40, period);
        const warming = warmAtIdle(r.steps(), r.schedule, r.now);
        r.runAll();
        expect([period, step, warming.steps, warming.finished !== null]).toEqual([
          period,
          step,
          40,
          true,
        ]);
        expect(warming.longestSlice).toBeLessThan(50);
      }
  });

  it('warms from zero timeouts where the browser has no idle callback, 16 ms a slice', async () => {
    const idle = (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback;
    expect(idle).toBeUndefined();
    let t = 0;
    const now = () => t;
    function* steps() {
      for (let i = 0; i < 6; i++) {
        t += 5;
        yield;
      }
    }
    const warming = warmAtIdle(steps(), browserIdle(now), now);
    for (let i = 0; i < 100 && warming.finished === null; i++)
      await new Promise((r) => setTimeout(r, 0));
    // Steps start at 16, 11, 6 and 1 ms left of each 16 ms slice.
    expect([warming.steps, warming.slices]).toEqual([6, 2]);
  });
});

describe('a groove warmed once it is filed (#412)', () => {
  const FIVE: RhythmBench = { meter: METERS['5/4'], meterFragment: '5/4' };
  const BENCHES: readonly RhythmBench[] = [{ meter: METERS['4/4'] }, { meter: METERS['7/8'] }];
  const POINT = { sync: 0.5, harm: 0.5, artic: 0.5, energy: 0.5 };
  /** A repository that files each text as told (held or new) and records each warming it is asked for. */
  function rig(held: (text: string) => boolean) {
    const warmed: { benches: readonly RhythmBench[]; layer: LearnedLayer | undefined }[] = [];
    const repository: RhythmRepository = {
      query: () => [],
      layered: () => [],
      read: () => null,
      file(layer, { hits, source }) {
        const text = hits.map((h) => `${h.role}${h.step}`).join(' ');
        const id = `${source} ${text}`;
        const fragment = {
          id,
          text,
          association: [{ point: POINT, weight: 0.1, facet: 'rhythm' }],
        };
        return held(text)
          ? { layer, id, held: true }
          : {
              layer: { ...layer, filed: [...layer.filed, { fragment, meta: {}, prose: '' }] },
              id,
              held: false,
            };
      },
      warm(benches, layer) {
        warmed.push({ benches, layer });
        return [];
      },
    };
    const ran: Iterable<void>[] = [];
    const filing = warmedOnFiling(repository, BENCHES, (steps) => {
      ran.push(steps);
      for (const step of steps) void step;
    });
    const file = (role: string, layer: LearnedLayer = EMPTY_LAYER) =>
      filing.file!(layer, {
        hits: [{ role, note: 36, step: 0, velocity: 100 }],
        bench: FIVE,
        point: POINT,
        source: 'drummer',
        created: 'song 1, bar 0',
        tags: ['groove'],
      });
    return { warmed, ran, file };
  }

  it('warms a groove filed with the layer it is filed in, on the bench it was played on first', () => {
    const r = rig(() => false);
    const filed = r.file('kick');
    expect(r.warmed).toEqual([{ benches: [FIVE, ...BENCHES], layer: filed.layer }]);
  });

  it('warms a text once however often it is filed, as each forecast files it again, and none held already', () => {
    const r = rig((text) => text === 'snare0');
    r.file('kick');
    r.file('kick');
    r.file('kick', r.file('kick').layer);
    r.file('snare');
    expect(r.warmed).toHaveLength(1);
    expect(r.ran).toHaveLength(1);
  });

  it('is the repository as it is where it files or warms nothing', () => {
    const plain: RhythmRepository = { query: () => [], layered: () => [], read: () => null };
    expect(warmedOnFiling(plain, BENCHES, () => {})).toBe(plain);
  });
});
