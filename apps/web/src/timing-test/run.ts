/**
 * A timing test's record (#204, A7): everything the test saw, in a plain
 * object that is saved in the browser and downloaded for analysis elsewhere.
 *
 * It keeps what a later matching or a different model of the player would
 * need, not only the offsets this page computed: every hit with the moment
 * it was scheduled on the audio clock and when it was estimated to be
 * heard on the page's; every tap with the event's own timestamp, the moment
 * the page handled it, and the audio clock then; the samples of the two
 * clocks' pairing that the estimate came from; and the device (its output's
 * latency, its sample rate, the MIDI inputs). Times in seconds are on the
 * audio clock unless a name says `Ms`, which are milliseconds on the page's
 * clock (`performance.now()`); `heardAt` and `at` are seconds from the
 * start of the test's first bar.
 */

import { type OffsetStats, statsOf } from './match.ts';
import type { PatternId, TestSound } from './pattern.ts';

export const RUN_FORMAT = 'jambot timing test';
export const RUN_VERSION = 1;

/** The sources the page names its own inputs by; a MIDI input is named by its port. */
export const KEYS_SOURCE = 'the computer keys';
export const TAP_SOURCE = 'the on-screen tap';

/** What a tap came from: the computer's keys, the on-screen tap, an on-screen pad or a MIDI input. */
export type TapKind = 'keys' | 'tap' | 'midi';

export type TapPhase = 'count-in' | 'test' | 'tail';

export interface RunEnvironment {
  readonly userAgent: string;
  readonly language: string;
  readonly hardwareConcurrency: number | null;
  readonly sampleRate: number | null;
  /** The audio context's own figures, seconds. */
  readonly baseLatency: number | null;
  readonly outputLatency: number | null;
  /** The names of the MIDI inputs plugged in, where MIDI is connected. */
  readonly midiInputs: readonly string[];
  /** `performance.timeOrigin`, so a page time is a wall time. */
  readonly timeOrigin: number;
}

/** One reading of the output's clock against the page's. */
export interface ClockSample {
  /** `performance.now()` when it was read, milliseconds. */
  readonly pageMs: number;
  readonly contextTime: number;
  /** The output timestamp's pairing on the page's clock, milliseconds, where the platform gives one. */
  readonly pairedMs: number | null;
  /** The output's stated latency, seconds. */
  readonly latency: number;
  /** The estimate of the moment heard less the page's clock, seconds, once it is trusted. */
  readonly offset: number | null;
}

export interface RunExpected {
  readonly index: number;
  readonly bar: number;
  readonly step: number;
  readonly sound: TestSound;
  readonly note: number;
  /** Seconds from the start of the test's first bar. */
  readonly at: number;
  /** When it was scheduled on the audio clock, seconds. */
  readonly scheduled: number;
  /** When it was estimated to be heard on the page's clock, milliseconds, by the estimate at the end of the test. */
  readonly heardMs: number;
}

export interface RunTap {
  readonly index: number;
  /** The input: `the computer keys`, `the on-screen tap` or a MIDI port's name. */
  readonly source: string;
  readonly kind: TapKind;
  readonly note: number | null;
  readonly velocity: number | null;
  /** The key pressed, for the computer's keys. */
  readonly key: string | null;
  /** The event's own timestamp, milliseconds on the page's clock. */
  readonly eventMs: number;
  /** The page's clock when the page handled it, milliseconds: the difference is the page's own delay. */
  readonly handledMs: number;
  /** The audio clock when the page handled it, seconds. */
  readonly audioTime: number;
  /** Seconds from the start of the test's first bar, as the player heard the pattern: `eventMs` on the audio clock, less the latency. */
  readonly heardAt: number;
  readonly phase: TapPhase;
  /** The hit it answered, or null. */
  readonly hit: number | null;
  /** Milliseconds, late positive; null where it answered no hit. */
  readonly offsetMs: number | null;
}

export interface RunSummary {
  /** The hits of the pattern, and how many were answered. */
  readonly hits: number;
  readonly answered: number;
  readonly missed: number;
  /** Taps that answered no hit, within the test. */
  readonly extra: number;
  readonly offsets: OffsetStats;
  /** The mean offset of each bar of the test, milliseconds, null for a bar nothing answered in. */
  readonly perBar: readonly (number | null)[];
}

export interface TimingRun {
  readonly format: typeof RUN_FORMAT;
  readonly version: typeof RUN_VERSION;
  /** A name unique in this browser: the time it was taken, and a counter. */
  readonly id: string;
  /** ISO date. */
  readonly taken: string;
  readonly pattern: PatternId;
  readonly bpm: number;
  readonly bars: number;
  readonly stepSeconds: number;
  /** The window a tap answers a hit in, milliseconds. */
  readonly windowMs: number;
  readonly environment: RunEnvironment;
  readonly clock: readonly ClockSample[];
  readonly expected: readonly RunExpected[];
  readonly taps: readonly RunTap[];
  readonly summary: RunSummary;
}

/** The run's figures from its hits and taps. */
export function summaryOf(
  expected: readonly Pick<RunExpected, 'index' | 'bar'>[],
  taps: readonly Pick<RunTap, 'phase' | 'hit' | 'offsetMs'>[],
  bars: number,
): RunSummary {
  const answered = new Map<number, number>();
  for (const t of taps) if (t.hit !== null && t.offsetMs !== null) answered.set(t.hit, t.offsetMs);
  const perBar = Array.from({ length: bars }, (_, bar) => {
    const offsets = expected
      .filter((e) => e.bar === bar && answered.has(e.index))
      .map((e) => answered.get(e.index)!);
    return offsets.length === 0 ? null : offsets.reduce((a, b) => a + b, 0) / offsets.length;
  });
  return {
    hits: expected.length,
    answered: answered.size,
    missed: expected.length - answered.size,
    extra: taps.filter((t) => t.phase === 'test' && t.hit === null).length,
    offsets: statsOf([...answered.values()]),
    perBar,
  };
}

/** Whether something read back is a run this page can show: the format and its version, and the parts every reader needs. */
export function isRun(value: unknown): value is TimingRun {
  const r = value as Partial<TimingRun> | null;
  return (
    typeof r === 'object' &&
    r !== null &&
    r.format === RUN_FORMAT &&
    r.version === RUN_VERSION &&
    typeof r.id === 'string' &&
    typeof r.taken === 'string' &&
    Array.isArray(r.expected) &&
    Array.isArray(r.taps) &&
    typeof r.summary === 'object' &&
    r.summary !== null
  );
}

/** The runs as one file: its name and its text, JSON with every detail. */
export function runsFile(
  runs: readonly TimingRun[],
  taken = new Date(),
): { name: string; text: string } {
  const stamp = taken.toISOString().replace(/[:.]/g, '-');
  const file = { format: RUN_FORMAT, version: RUN_VERSION, exported: taken.toISOString(), runs };
  return { name: `jambot-timing-tests-${stamp}.json`, text: `${JSON.stringify(file, null, 2)}\n` };
}

/** The columns of the taps file, in order. */
export const CSV_COLUMNS = [
  'run',
  'taken',
  'pattern',
  'bpm',
  'tap',
  'phase',
  'source',
  'kind',
  'key',
  'note',
  'velocity',
  'event_ms',
  'handled_ms',
  'audio_time',
  'heard_at',
  'hit',
  'hit_bar',
  'hit_step',
  'hit_sound',
  'hit_at',
  'offset_ms',
  'output_latency',
  'sample_rate',
  'user_agent',
] as const;

const cell = (value: string | number | null): string => {
  if (value === null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Every tap of every run, one row each, with the hit it answered and the run's own figures: for a spreadsheet or a data frame. */
export function runsCsv(runs: readonly TimingRun[]): { name: string; text: string } {
  const rows = runs.flatMap((run) =>
    run.taps.map((tap) => {
      const hit = tap.hit === null ? null : run.expected[tap.hit];
      return [
        run.id,
        run.taken,
        run.pattern,
        run.bpm,
        tap.index,
        tap.phase,
        tap.source,
        tap.kind,
        tap.key,
        tap.note,
        tap.velocity,
        tap.eventMs,
        tap.handledMs,
        tap.audioTime,
        tap.heardAt,
        tap.hit,
        hit?.bar ?? null,
        hit?.step ?? null,
        hit?.sound ?? null,
        hit?.at ?? null,
        tap.offsetMs,
        run.environment.outputLatency,
        run.environment.sampleRate,
        run.environment.userAgent,
      ]
        .map(cell)
        .join(',');
    }),
  );
  return {
    name: 'jambot-timing-taps.csv',
    text: `${[CSV_COLUMNS.join(','), ...rows].join('\n')}\n`,
  };
}
