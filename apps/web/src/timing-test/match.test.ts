// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ON_TIME_MS, describeOffset, matchTap, matchWindow, statsOf, verdictOf } from './match.ts';
import { TEMPOS, TEST_PATTERNS, planTest } from './pattern.ts';

describe('the window a tap answers a hit in', () => {
  it('is half the least gap between two hits, for every pattern at every tempo', () => {
    for (const { id } of TEST_PATTERNS)
      for (const bpm of TEMPOS) {
        const plan = planTest(id, bpm);
        const gaps = plan.expected.slice(1).map((e, i) => e.at - plan.expected[i]!.at);
        expect(matchWindow(plan)).toBeCloseTo(Math.min(...gaps) / 2, 12);
      }
  });

  it('is half a bar for a pattern of one hit, and never infinite', () => {
    const plan = planTest('quarters', 100, 1);
    const one = { ...plan, expected: [plan.expected[0]!] };
    expect(matchWindow(one)).toBe(plan.barSeconds / 2);
  });
});

describe('matching a tap to a hit', () => {
  const plan = planTest('eighths', 120);
  const window = matchWindow(plan);

  it('takes the nearest hit within the window, late positive', () => {
    const second = plan.expected[1]!;
    const late = matchTap(plan.expected, new Set(), second.at + 0.03, window)!;
    expect(late.hit.index).toBe(1);
    expect(late.offsetMs).toBeCloseTo(30, 9);
    const early = matchTap(plan.expected, new Set(), second.at - 0.02, window)!;
    expect(early.offsetMs).toBeCloseTo(-20, 9);
  });

  it('answers no hit beyond the window, and none of those already answered', () => {
    const first = plan.expected[0]!;
    expect(matchTap(plan.expected, new Set(), first.at - window - 0.001, window)).toBeNull();
    const again = matchTap(plan.expected, new Set([0]), first.at, window);
    expect(again?.hit.index).not.toBe(0);
  });

  it('finds, for a player exactly on time, each hit in turn, over every hit of every pattern and tempo', () => {
    for (const { id } of TEST_PATTERNS)
      for (const bpm of TEMPOS) {
        const p = planTest(id, bpm);
        const claimed = new Set<number>();
        for (const e of p.expected) {
          const m = matchTap(p.expected, claimed, e.at, matchWindow(p))!;
          expect(m.hit.index).toBe(e.index);
          expect(m.offsetMs).toBeCloseTo(0, 9);
          claimed.add(m.hit.index);
        }
      }
  });

  it('finds each hit for a player within a third of the window, early or late', () => {
    for (const { id } of TEST_PATTERNS) {
      const p = planTest(id, 100);
      const w = matchWindow(p);
      for (const sign of [-1, 1]) {
        const claimed = new Set<number>();
        for (const e of p.expected) {
          const m = matchTap(p.expected, claimed, e.at + (sign * w) / 3, w)!;
          expect(m.hit.index).toBe(e.index);
          claimed.add(m.hit.index);
        }
      }
    }
  });

  it('takes the earlier of two equally near hits', () => {
    const a = plan.expected[0]!;
    const b = plan.expected[1]!;
    const wide = Math.max(window, (b.at - a.at) / 2 + 1);
    expect(matchTap(plan.expected, new Set(), (a.at + b.at) / 2, wide)!.hit.index).toBe(0);
  });

  it('matches nothing to an empty pattern', () => {
    expect(matchTap([], new Set(), 0, 1)).toBeNull();
  });
});

describe('what an offset is called', () => {
  it('is on time within ON_TIME_MS either way, early or late beyond', () => {
    expect(verdictOf(0)).toBe('on time');
    expect(verdictOf(ON_TIME_MS)).toBe('on time');
    expect(verdictOf(-ON_TIME_MS)).toBe('on time');
    expect(verdictOf(ON_TIME_MS + 0.1)).toBe('late');
    expect(verdictOf(-ON_TIME_MS - 0.1)).toBe('early');
  });

  it('says it in words, to the millisecond', () => {
    expect(describeOffset(41.6)).toBe('42 ms late');
    expect(describeOffset(-63)).toBe('63 ms early');
    expect(describeOffset(3)).toBe('on time (3 ms late)');
    expect(describeOffset(-3)).toBe('on time (3 ms early)');
  });
});

describe('the figures of a run of offsets', () => {
  it('are none for none', () => {
    expect(statsOf([])).toEqual({ count: 0, mean: null, sd: null, median: null, onTime: null });
  });

  it('are the mean, spread, median and share on time', () => {
    const s = statsOf([-10, 10, 30, 50]);
    expect(s.count).toBe(4);
    expect(s.mean).toBe(20);
    expect(s.sd).toBeCloseTo(Math.sqrt(500), 9);
    expect(s.median).toBe(20);
    expect(s.onTime).toBe(0.5);
    expect(statsOf([1, 5, 9]).median).toBe(5);
  });
});
