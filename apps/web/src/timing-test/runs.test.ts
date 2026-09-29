// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { RUN_FORMAT, RUN_VERSION, type TimingRun, summaryOf } from './run.ts';
import { type KeptStorage, RUNS_KEY, TimingRuns, runId } from './runs.ts';

const run = (id: string): TimingRun => ({
  format: RUN_FORMAT,
  version: RUN_VERSION,
  id,
  taken: '2026-09-29T21:00:00.000Z',
  pattern: 'quarters',
  bpm: 100,
  bars: 1,
  stepSeconds: 0.15,
  windowMs: 300,
  environment: {
    userAgent: 'test',
    language: 'en',
    hardwareConcurrency: null,
    sampleRate: null,
    baseLatency: null,
    outputLatency: null,
    midiInputs: [],
    timeOrigin: 0,
  },
  clock: [],
  expected: [],
  taps: [],
  summary: summaryOf([], [], 1),
});

/** A storage that keeps what it is given, and can be made to refuse. */
function memory(refuse = false) {
  const items = new Map<string, string>();
  const storage: KeptStorage = {
    getItem: (k) => items.get(k) ?? null,
    setItem: (k, v) => {
      if (refuse) throw new DOMException('full', 'QuotaExceededError');
      items.set(k, v);
    },
    removeItem: (k) => void items.delete(k),
  };
  return { storage, items };
}

describe('the runs kept in the browser', () => {
  it('start empty, keep each run as it is added, and hand them back oldest first to a new page', () => {
    const { storage } = memory();
    const runs = new TimingRuns(storage);
    expect(runs.list()).toEqual([]);
    expect(runs.add(run('a'))).toBe(true);
    expect(runs.add(run('b'))).toBe(true);
    expect(runs.list().map((r) => r.id)).toEqual(['a', 'b']);
    expect(new TimingRuns(storage).list().map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('keep a run whole, so what is downloaded is what was recorded', () => {
    const { storage } = memory();
    new TimingRuns(storage).add(run('a'));
    expect(new TimingRuns(storage).list()[0]).toEqual(run('a'));
  });

  it('drop what is not a run, and what is not JSON, without losing the runs beside it', () => {
    const { storage, items } = memory();
    items.set(RUNS_KEY, JSON.stringify([run('a'), { nonsense: true }, 7, null, run('b')]));
    expect(new TimingRuns(storage).list().map((r) => r.id)).toEqual(['a', 'b']);
    items.set(RUNS_KEY, '{not json');
    expect(new TimingRuns(storage).list()).toEqual([]);
    items.set(RUNS_KEY, '{"an":"object"}');
    expect(new TimingRuns(storage).list()).toEqual([]);
  });

  it('remove one, or clear them all, in the storage as well', () => {
    const { storage, items } = memory();
    const runs = new TimingRuns(storage);
    runs.add(run('a'));
    runs.add(run('b'));
    runs.remove('a');
    expect(new TimingRuns(storage).list().map((r) => r.id)).toEqual(['b']);
    runs.clear();
    expect(runs.list()).toEqual([]);
    expect(items.has(RUNS_KEY)).toBe(false);
  });

  it('hold a run for the page’s life when the browser refuses it, and say so', () => {
    const { storage } = memory(true);
    const runs = new TimingRuns(storage);
    expect(runs.add(run('a'))).toBe(false);
    expect(runs.list().map((r) => r.id)).toEqual(['a']);
    expect(runs.problem).toMatch(/download/);
  });

  it('hold them for the page’s life where there is no storage at all', () => {
    const runs = new TimingRuns(null);
    expect(runs.add(run('a'))).toBe(false);
    expect(runs.list()).toHaveLength(1);
    expect(runs.problem).toMatch(/keeps nothing/);
    runs.clear();
    expect(runs.problem).toBeNull();
  });

  it('forget the problem once a save works again', () => {
    const { storage } = memory();
    const runs = new TimingRuns(storage);
    runs.problem = 'stale';
    runs.add(run('a'));
    expect(runs.problem).toBeNull();
  });
});

describe('a run’s name', () => {
  it('is when it was taken, made safe for a file, and counted on where two share a second', () => {
    expect(runId('2026-09-29T21:00:00.123Z', [])).toBe('2026-09-29T21-00-00-123Z');
    const first = runId('2026-09-29T21:00:00.123Z', []);
    expect(runId('2026-09-29T21:00:00.123Z', [{ id: first }])).toBe(`${first}-2`);
    expect(runId('2026-09-29T21:00:00.123Z', [{ id: first }, { id: `${first}-2` }])).toBe(
      `${first}-3`,
    );
  });
});
