// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  CSV_COLUMNS,
  RUN_FORMAT,
  RUN_VERSION,
  type RunTap,
  type TimingRun,
  isRun,
  runsCsv,
  runsFile,
  summaryOf,
} from './run.ts';

const tap = (over: Partial<RunTap>): RunTap => ({
  index: 0,
  source: 'the computer keys',
  kind: 'keys',
  note: 60,
  velocity: 100,
  key: 'a',
  eventMs: 1000,
  handledMs: 1002.5,
  audioTime: 12.3,
  heardAt: 0.01,
  phase: 'test',
  hit: 0,
  offsetMs: 10,
  ...over,
});

const run = (taps: RunTap[] = [tap({})]): TimingRun => ({
  format: RUN_FORMAT,
  version: RUN_VERSION,
  id: 'r1',
  taken: '2026-09-29T21:00:00.000Z',
  pattern: 'quarters',
  bpm: 100,
  bars: 2,
  stepSeconds: 0.15,
  windowMs: 300,
  environment: {
    userAgent: 'Mozilla/5.0 (X11; Linux) "quoted", odd',
    language: 'en',
    hardwareConcurrency: 8,
    sampleRate: 48000,
    baseLatency: 0.01,
    outputLatency: 0.03,
    midiInputs: [],
    timeOrigin: 1e12,
  },
  clock: [],
  expected: [
    { index: 0, bar: 0, step: 0, sound: 'kick', note: 36, at: 0, scheduled: 12.5, heardMs: 900 },
    {
      index: 1,
      bar: 0,
      step: 4,
      sound: 'snare',
      note: 38,
      at: 0.6,
      scheduled: 13.1,
      heardMs: 1500,
    },
    { index: 2, bar: 1, step: 0, sound: 'kick', note: 36, at: 2.4, scheduled: 14.9, heardMs: 3300 },
  ],
  taps,
  summary: summaryOf([], [], 2),
});

describe('the figures of a run', () => {
  const expected = [
    { index: 0, bar: 0 },
    { index: 1, bar: 0 },
    { index: 2, bar: 1 },
    { index: 3, bar: 1 },
  ];

  it('count the hits answered and missed, the taps beyond the hits, and the offsets', () => {
    const s = summaryOf(
      expected,
      [
        { phase: 'test', hit: 0, offsetMs: 10 },
        { phase: 'test', hit: 2, offsetMs: 30 },
        { phase: 'test', hit: null, offsetMs: null },
        { phase: 'count-in', hit: null, offsetMs: null },
        { phase: 'tail', hit: null, offsetMs: null },
      ],
      2,
    );
    expect(s).toMatchObject({ hits: 4, answered: 2, missed: 2, extra: 1 });
    expect(s.offsets.mean).toBe(20);
    expect(s.perBar).toEqual([10, 30]);
  });

  it('are empty for a run of no taps, and give a bar nothing answered in as null', () => {
    const s = summaryOf(expected, [], 3);
    expect(s).toMatchObject({ hits: 4, answered: 0, missed: 4, extra: 0 });
    expect(s.offsets.mean).toBeNull();
    expect(s.perBar).toEqual([null, null, null]);
  });

  it('count a hit once when two taps claim it, the later one standing', () => {
    const s = summaryOf(
      expected,
      [
        { phase: 'test', hit: 1, offsetMs: 5 },
        { phase: 'test', hit: 1, offsetMs: 9 },
      ],
      2,
    );
    expect(s.answered).toBe(1);
    expect(s.offsets.mean).toBe(9);
  });
});

describe('what counts as a run', () => {
  it('is what this page wrote: its format and version, and the parts every reader needs', () => {
    expect(isRun(run())).toBe(true);
    for (const bad of [
      null,
      undefined,
      'a run',
      [],
      {},
      { ...run(), format: 'something else' },
      { ...run(), version: 2 },
      { ...run(), id: 7 },
      { ...run(), taps: 'none' },
      { ...run(), expected: null },
      { ...run(), summary: null },
    ])
      expect(isRun(bad), JSON.stringify(bad)?.slice(0, 40)).toBe(false);
  });
});

describe('the download of the runs', () => {
  it('is one JSON file naming its format, holding every run whole, named by when it was taken', () => {
    const runs = [run(), { ...run(), id: 'r2' }];
    const file = runsFile(runs, new Date('2026-09-29T21:30:15.123Z'));
    expect(file.name).toBe('jambot-timing-tests-2026-09-29T21-30-15-123Z.json');
    const parsed = JSON.parse(file.text);
    expect(parsed).toMatchObject({ format: RUN_FORMAT, version: RUN_VERSION });
    expect(parsed.runs).toEqual(JSON.parse(JSON.stringify(runs)));
    expect(file.text.endsWith('\n')).toBe(true);
  });

  it('is well formed with no runs', () => {
    expect(JSON.parse(runsFile([]).text).runs).toEqual([]);
  });
});

describe('the taps as a table', () => {
  const rows = (text: string) => text.trimEnd().split('\n');

  it('has a header, and a row for every tap of every run, with the hit it answered', () => {
    const csv = runsCsv([
      run([tap({}), tap({ index: 1, hit: null, offsetMs: null, phase: 'tail' })]),
      run([tap({ hit: 2, offsetMs: -7.5 })]),
    ]);
    const lines = rows(csv.text);
    expect(lines[0]).toBe(CSV_COLUMNS.join(','));
    expect(lines).toHaveLength(4);
    expect(csv.name).toBe('jambot-timing-taps.csv');
  });

  it('fills a tap’s hit columns from the hit it answered, and leaves them empty where it answered none', () => {
    const csv = runsCsv([
      run([tap({ hit: 1, offsetMs: 12 }), tap({ index: 1, hit: null, offsetMs: null })]),
    ]);
    const [, answered, unanswered] = rows(csv.text);
    const at = (line: string, column: (typeof CSV_COLUMNS)[number]) =>
      splitCsv(line)[CSV_COLUMNS.indexOf(column)];
    expect(at(answered!, 'hit')).toBe('1');
    expect(at(answered!, 'hit_bar')).toBe('0');
    expect(at(answered!, 'hit_step')).toBe('4');
    expect(at(answered!, 'hit_sound')).toBe('snare');
    expect(at(answered!, 'hit_at')).toBe('0.6');
    expect(at(answered!, 'offset_ms')).toBe('12');
    expect(at(unanswered!, 'hit')).toBe('');
    expect(at(unanswered!, 'offset_ms')).toBe('');
  });

  it('quotes what has a comma or a quote in it, so every row has as many cells as the header', () => {
    const csv = runsCsv([run([tap({ source: 'Keys, "Pro"' })])]);
    for (const line of rows(csv.text)) expect(splitCsv(line)).toHaveLength(CSV_COLUMNS.length);
    expect(splitCsv(rows(csv.text)[1]!)[CSV_COLUMNS.indexOf('source')]).toBe('Keys, "Pro"');
    expect(splitCsv(rows(csv.text)[1]!)[CSV_COLUMNS.indexOf('user_agent')]).toBe(
      'Mozilla/5.0 (X11; Linux) "quoted", odd',
    );
  });

  it('is only the header for no runs', () => {
    expect(rows(runsCsv([]).text)).toEqual([CSV_COLUMNS.join(',')]);
  });
});

/** A line of CSV as its cells, reading quotes as the writer wrote them. */
function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      cells.push(cell);
      cell = '';
    } else cell += c;
  }
  cells.push(cell);
  return cells;
}
