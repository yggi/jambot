import {
  INITIAL_STYLE,
  LOOKAHEAD,
  type TransportCarried,
  type TransportEnv,
  type TransportOutput,
  holding,
  keyedRandom,
  transport,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_SPREAD,
  SPREAD_MS,
  type TransportTiming,
  TRANSPORT_TIMING,
  quantile,
  spreadWith,
  summaryOf,
  timedTick,
} from './timing.ts';

const spreadOf = (values: readonly number[]) => values.reduce(spreadWith, EMPTY_SPREAD);

/** The nearest-rank quantile, read from every value kept. */
const exact = (values: readonly number[], q: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(1, Math.ceil(q * sorted.length)) - 1]!;
};

describe('a spread of durations (#27)', () => {
  it('reads each quantile to within half a millisecond of the true one below a second, and the most beyond', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const values = Array.from(
        { length: 1 + Math.floor(keyedRandom(seed, 0) * 500) },
        (_, i) => keyedRandom(seed, i, 1) ** 3 * 1200,
      );
      const spread = spreadOf(values);
      expect(spread.count).toBe(values.length);
      expect(spread.least).toBe(Math.min(...values));
      expect(spread.most).toBe(Math.max(...values));
      for (const q of [0, 0.01, 0.25, 0.5, 0.9, 0.99, 1]) {
        const truth = exact(values, q);
        const read = quantile(spread, q)!;
        if (truth < SPREAD_MS) {
          expect(Math.abs(read - truth)).toBeLessThanOrEqual(0.5);
        } else expect(read).toBe(spread.most);
      }
    }
  });

  it('keeps the same whatever order the durations came in, and nothing of a duration that is no number', () => {
    const values = [25, 24.2, 80, 26.9, 0.4, 1500, 25];
    const spread = spreadOf(values);
    expect(spreadOf([...values].reverse())).toEqual(spread);
    expect(spreadWith(spread, NaN)).toBe(spread);
    expect(summaryOf(spread)).toEqual({ count: 7, least: 0.4, p50: 25.5, p99: 1500, most: 1500 });
  });

  it('reads nothing of an empty spread', () => {
    expect(summaryOf(EMPTY_SPREAD)).toEqual({
      count: 0,
      least: null,
      p50: null,
      p99: null,
      most: null,
    });
  });
});

const env: TransportEnv = {
  seed: 3,
  start: 0.1,
  track: holding({ ...INITIAL_STYLE, energy: 1 }),
  wish: { tonic: null, mode: 'aeolian' },
};

/** The transport ticking at each clock time given, and its counters. */
function counted(times: readonly number[], from: TransportTiming = TRANSPORT_TIMING) {
  let carried: TransportCarried | null = null;
  let timing = from;
  const outputs: TransportOutput[] = [];
  for (const now of times) {
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
    carried = next.carried;
    outputs.push(next.output);
    timing = timedTick(timing, { at: now, now, scheduled: next.output });
  }
  return { timing, outputs };
}

const every = (from: number, to: number, step = 0.025) =>
  Array.from({ length: Math.round((to - from) / step) }, (_, i) => from + i * step);

describe("the transport's counters (#27)", () => {
  it('count the ticks, how far apart they came, and every event and how far ahead it was scheduled', () => {
    const times = every(0, 10);
    const { timing, outputs } = counted(times);
    expect(timing.ticks.count).toBe(times.length - 1);
    expect(Math.abs(summaryOf(timing.ticks).p50! - 25)).toBeLessThanOrEqual(0.5);
    expect(timing.margins.count).toBe(outputs.flatMap((o) => o.events).length);
    expect(timing.laid).toBe(outputs.flatMap((o) => o.steps).length);
    expect(timing.missed).toBe(0);
    // On time, every event is scheduled at least a lookahead less a tick ahead.
    expect(timing.margins.least!).toBeGreaterThan((LOOKAHEAD - 0.025) * 1000 - 1e-6);
    expect(timing.margins.most!).toBeLessThanOrEqual(LOOKAHEAD * 1000 + 1e-6);
  });

  it('see a stall: a long tick, the steps it missed, and an event scheduled close to its time', () => {
    // The page wakes 5 ms before an event it would have played in time.
    const due = counted(every(0, 10))
      .outputs.flatMap((o) => o.events)
      .find((e) => e.seconds > 5.4)!;
    const woke = due.seconds - 0.005;
    const { timing, outputs } = counted([...every(0, 5), ...every(woke, 10)]);
    expect(timing.ticks.most).toBeCloseTo((woke - 4.975) * 1000, 6);
    expect(timing.missed).toBe(outputs.reduce((sum, o) => sum + o.missed, 0));
    expect(timing.missed).toBeGreaterThan(0);
    expect(timing.margins.least).toBeCloseTo(5, 6);
  });

  it('miss no step before the first is laid: that is where a client joined', () => {
    const { timing, outputs } = counted(every(60, 70));
    expect(outputs[0]!.missed).toBeGreaterThan(0);
    expect(timing.missed).toBe(0);
    expect(timing.laid).toBeGreaterThan(0);
  });

  it('count the judgements dropped, by why', () => {
    const scheduled: TransportOutput = {
      steps: [],
      events: [],
      composed: [],
      missed: 0,
      judged: [],
      dropped: (['late', 'late', 'ahead', 'inadmissible'] as const).map((why) => ({
        bar: 1,
        judgement: { kind: 'too few', source: 'x', count: 1 },
        why,
      })),
    };
    const timing = timedTick(TRANSPORT_TIMING, { at: 0, now: 0, scheduled });
    expect(timing.dropped).toEqual({ late: 2, ahead: 1, inadmissible: 1 });
    expect(TRANSPORT_TIMING.dropped).toEqual({ late: 0, ahead: 0, inadmissible: 0 });
  });
});
