// @vitest-environment node
import { BAR_STEPS } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  COUNT_IN_BARS,
  SOUND_NOTES,
  TAIL_SECONDS,
  TEMPOS,
  TEST_BARS,
  TEST_PATTERNS,
  lastHitAt,
  patternById,
  planTest,
  testEnd,
} from './pattern.ts';

describe('the timing test’s patterns', () => {
  it('are a bar of two sounds, a kick and a snare, in order on the 16 steps, each with hits of both', () => {
    for (const { hits } of TEST_PATTERNS) {
      expect(new Set(hits.map((h) => h.sound))).toEqual(new Set(['kick', 'snare']));
      const steps = hits.map((h) => h.step);
      expect(steps).toEqual([...steps].sort((a, b) => a - b));
      expect(new Set(steps).size).toBe(steps.length);
      for (const step of steps) expect(step).toBeGreaterThanOrEqual(0);
      for (const step of steps) expect(step).toBeLessThan(BAR_STEPS);
    }
  });

  it('are named once each, and an unknown one gives the first', () => {
    const ids = TEST_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(patternById('nonsense' as never)).toBe(TEST_PATTERNS[0]);
  });

  it('get harder: the least gap between hits shrinks from pattern to pattern', () => {
    const least = (id: 'quarters' | 'eighths' | 'syncopated') => {
      const steps = patternById(id).hits.map((h) => h.step);
      return Math.min(...steps.slice(1).map((s, i) => s - steps[i]!));
    };
    expect([least('quarters'), least('eighths'), least('syncopated')]).toEqual([4, 2, 1]);
  });
});

describe('a planned test', () => {
  it.each(TEMPOS)('at %i bpm lays every hit of every bar at its step, on the clock', (bpm) => {
    for (const { id, hits } of TEST_PATTERNS) {
      const plan = planTest(id, bpm);
      const stepSeconds = 60 / bpm / 4;
      expect(plan.stepSeconds).toBeCloseTo(stepSeconds, 12);
      expect(plan.barSeconds).toBeCloseTo(stepSeconds * BAR_STEPS, 12);
      expect(plan.expected).toHaveLength(hits.length * TEST_BARS);
      plan.expected.forEach((e, i) => {
        expect(e.index).toBe(i);
        expect(e.at).toBeCloseTo((e.bar * BAR_STEPS + e.step) * stepSeconds, 12);
        expect(e.note).toBe(SOUND_NOTES[e.sound]);
      });
      const times = plan.expected.map((e) => e.at);
      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it('counts in with a bar of hats before the first hit, a beat apart, ending a beat before it', () => {
    const plan = planTest('quarters', 120);
    const beat = 0.5;
    expect(plan.countIn).toHaveLength(COUNT_IN_BARS * 4);
    expect(plan.countIn.map((t) => Math.round(t / beat))).toEqual([-4, -3, -2, -1]);
    expect(plan.expected[0]!.at).toBe(0);
  });

  it('ends after its last bar and a tail, and knows its last hit', () => {
    const plan = planTest('syncopated', 100);
    expect(testEnd(plan)).toBeCloseTo(TEST_BARS * plan.barSeconds + TAIL_SECONDS, 12);
    expect(lastHitAt(plan)).toBe(plan.expected.at(-1)!.at);
    expect(lastHitAt(plan)).toBeLessThan(testEnd(plan));
  });

  it('can be as long as asked', () => {
    expect(planTest('quarters', 100, 3).expected).toHaveLength(12);
    expect(planTest('quarters', 100, 0).expected).toEqual([]);
    expect(lastHitAt(planTest('quarters', 100, 0))).toBe(0);
  });
});
