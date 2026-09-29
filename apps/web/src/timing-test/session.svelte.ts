/**
 * The timing test, run (#204, A7): the page's container for it, as
 * `Instruments` is for the band.
 *
 * It plays the pattern on this device's own synth (never MIDI out), all
 * scheduled ahead on the audio clock so that nothing depends on a timer,
 * takes the taps of every input at the time the event itself says, matches
 * each to a hit as it comes so the player sees at once how it went, and
 * when the last bar and its tail are over keeps the whole run
 * (`TimingRuns`). A tap is placed on the pattern's clock by the output's
 * pairing with the page's (`ClockOffset`): the moment the tap's event
 * happened, on the audio clock, less the zero of the pattern. That is
 * where it falls against what the player heard, output latency included.
 */

import { DRUM_NOTES } from '@jambot/engine';
import { SvelteSet } from 'svelte/reactivity';
import type { Output } from '../audio/output.ts';
import type { ClockOffset } from '../audio/clock-offset.ts';
import {
  COMPUTER_KEY_MAP,
  DRUM_KEY_MAP,
  type ParsedNote,
  ignoreKeyEvent,
} from '../midi/surfaces.ts';
import {
  type Match,
  type OffsetStats,
  type Verdict,
  matchTap,
  matchWindow,
  statsOf,
  verdictOf,
} from './match.ts';
import {
  COUNT_IN_BARS,
  type PatternId,
  type Tempo,
  type TestPlan,
  type TestSound,
  lastHitAt,
  planTest,
  testEnd,
} from './pattern.ts';
import {
  KEYS_SOURCE,
  type ClockSample,
  type RunEnvironment,
  type RunExpected,
  type RunTap,
  type TapKind,
  type TapPhase,
  type TimingRun,
  RUN_FORMAT,
  RUN_VERSION,
  summaryOf,
} from './run.ts';
import { type TimingRuns, runId } from './runs.ts';

/** How long, in seconds, the test waits after its start before the count-in begins. */
export const LEAD_SECONDS = 0.6;

/** How often, in milliseconds, the test reads the clocks and looks for its end. */
export const TICK_MS = 40;

/** How often, in milliseconds, a reading of the clocks is kept in the run. */
export const SAMPLE_MS = 250;

export type TestPhase = 'idle' | 'playing' | 'done';

export interface TestDeps {
  /** The audio clock and its pairing with the page's, made on first use. */
  audio(): { base: Output; offset: ClockOffset };
  /** `performance.now()`. */
  now(): number;
  /** What the device says of itself, given what the output says of itself. */
  environment(info: ReturnType<NonNullable<Output['info']>> | null): RunEnvironment;
  readonly runs: TimingRuns;
  /** When it is, as an ISO date. */
  taken(): string;
}

/** A tap as an input gives it. */
export interface TapInput {
  readonly source: string;
  readonly kind: TapKind;
  readonly note?: number;
  readonly velocity?: number;
  readonly key?: string;
  /** The event's own timestamp, milliseconds on the page's clock. */
  readonly eventMs: number;
}

/** What a tap was, for the screen to show at once. */
export interface Feedback {
  readonly tap: number;
  /** Late positive, milliseconds; null where the tap answered no hit. */
  readonly offsetMs: number | null;
  readonly verdict: Verdict | 'no hit';
  readonly sound: TestSound | null;
  readonly bar: number | null;
  readonly step: number | null;
}

export class TimingTest {
  #deps: TestDeps;
  pattern: PatternId = $state('quarters');
  bpm: Tempo = $state(100);
  phase: TestPhase = $state('idle');
  /** The pattern being played or just played. */
  plan: TestPlan | null = $state.raw(null);
  taps: readonly RunTap[] = $state.raw([]);
  last: Feedback | null = $state.raw(null);
  /** The run just finished. */
  finished: TimingRun | null = $state.raw(null);
  /** Every run kept. */
  saved: readonly TimingRun[] = $state.raw([]);
  /** Something the person should know: the test was stopped, or the browser kept nothing. */
  notice: string | null = $state(null);

  #zero = 0;
  #window = 0;
  #claimed = new SvelteSet<number>();
  #samples: ClockSample[] = [];
  #sampledAt = -Infinity;
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor(deps: TestDeps) {
    this.#deps = deps;
    this.saved = deps.runs.list();
  }

  /** The window a tap may answer a hit in, milliseconds, of the pattern being played. */
  get windowMs(): number {
    return this.#window * 1000;
  }

  /** Where the taps so far sit against the beat. */
  get stats(): OffsetStats {
    return statsOf(this.taps.flatMap((t) => (t.offsetMs === null ? [] : [t.offsetMs])));
  }

  /**
   * The moment heard now, in seconds from the start of the pattern's first
   * bar (negative in the count-in), or null while nothing plays.
   */
  position(): number | null {
    if (this.phase !== 'playing') return null;
    return this.#deps.audio().offset.heard() - this.#zero;
  }

  /** Play the pattern and take the taps. A press of the person's, since a browser plays audio only after one. */
  async start(): Promise<void> {
    if (this.phase === 'playing') return;
    const { base, offset } = this.#deps.audio();
    await base.resume();
    const plan = planTest(this.pattern, this.bpm);
    const zero = base.currentTime + LEAD_SECONDS + COUNT_IN_BARS * plan.barSeconds;
    plan.countIn.forEach((at, k) => {
      const seconds = zero + at;
      base.play('drums', DRUM_NOTES.closedHat, k % 4 === 0 ? 118 : 96, seconds, 0.1, {});
    });
    for (const e of plan.expected) base.play('drums', e.note, 112, zero + e.at, 0.25, {});
    this.plan = plan;
    this.taps = [];
    this.last = null;
    this.finished = null;
    this.notice = null;
    this.#zero = zero;
    this.#window = matchWindow(plan);
    this.#claimed = new SvelteSet();
    this.#samples = [];
    this.#sampledAt = -Infinity;
    this.phase = 'playing';
    offset.update();
    this.#sample();
    this.#timer = setInterval(() => this.#tick(), TICK_MS);
  }

  /** Give the test up: what has played is silenced and nothing is kept. */
  stop(): void {
    if (this.phase !== 'playing') return;
    this.#halt();
    this.#deps.audio().base.silence();
    this.phase = 'idle';
    this.notice = 'Stopped: nothing was kept.';
  }

  /** A tap from any input: placed on the pattern, matched to a hit, and sounded softly so the player knows it registered. */
  tap(input: TapInput): void {
    const plan = this.plan;
    if (this.phase !== 'playing' || !plan) return;
    const { base, offset } = this.#deps.audio();
    offset.update();
    const handledMs = this.#deps.now();
    const audioTime = base.currentTime;
    const heardAt = offset.fromDeviceMs(input.eventMs) - this.#zero;
    const match: Match | null = matchTap(plan.expected, this.#claimed, heardAt, this.#window);
    if (match) this.#claimed.add(match.hit.index);
    const phase: TapPhase =
      heardAt < -this.#window
        ? 'count-in'
        : heardAt > lastHitAt(plan) + this.#window
          ? 'tail'
          : 'test';
    const tap: RunTap = {
      index: this.taps.length,
      source: input.source,
      kind: input.kind,
      note: input.note ?? null,
      velocity: input.velocity ?? null,
      key: input.key ?? null,
      eventMs: input.eventMs,
      handledMs,
      audioTime,
      heardAt,
      phase,
      hit: match?.hit.index ?? null,
      offsetMs: match?.offsetMs ?? null,
    };
    this.taps = [...this.taps, tap];
    this.last = {
      tap: tap.index,
      offsetMs: tap.offsetMs,
      verdict: match ? verdictOf(match.offsetMs) : 'no hit',
      sound: match?.hit.sound ?? null,
      bar: match?.hit.bar ?? null,
      step: match?.hit.step ?? null,
    };
    base.click?.('pulse', audioTime, 0.35);
  }

  /** A note from Web MIDI, its timestamp the message's own. Only a note struck counts. */
  midi(note: ParsedNote, source: string, eventMs: number | undefined): void {
    if (!note.on) return;
    this.tap({
      source,
      kind: 'midi',
      note: note.note,
      velocity: note.velocity,
      eventMs: eventMs ?? this.#deps.now(),
    });
  }

  /** Listen to the computer's keys, until the returned function is called. */
  listen(): () => void {
    const onKeyDown = (e: KeyboardEvent) => {
      if (ignoreKeyEvent(e.target, e.repeat, e.metaKey || e.ctrlKey || e.altKey)) return;
      const note = COMPUTER_KEY_MAP[e.key.toLowerCase()] ?? DRUM_KEY_MAP[e.key];
      if (note === undefined) return;
      this.tap({
        source: KEYS_SOURCE,
        kind: 'keys',
        note,
        key: e.key,
        velocity: 100,
        eventMs: e.timeStamp,
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }

  /** Forget every run kept. */
  clearRuns(): void {
    this.#deps.runs.clear();
    this.saved = this.#deps.runs.list();
    this.notice = null;
  }

  /** Forget one run. */
  removeRun(id: string): void {
    this.#deps.runs.remove(id);
    this.saved = this.#deps.runs.list();
  }

  #halt() {
    if (this.#timer !== null) clearInterval(this.#timer);
    this.#timer = null;
  }

  #sample() {
    const { base, offset } = this.#deps.audio();
    const pageMs = this.#deps.now();
    const paired = base.outputTimestamp?.();
    this.#samples.push({
      pageMs,
      contextTime: base.currentTime,
      pairedMs: paired?.performanceTime ?? null,
      latency: base.latency,
      offset: offset.heardOffset?.() ?? null,
    });
    this.#sampledAt = pageMs;
  }

  #tick() {
    const plan = this.plan;
    if (!plan) return;
    const { offset } = this.#deps.audio();
    offset.update();
    if (this.#deps.now() - this.#sampledAt >= SAMPLE_MS) this.#sample();
    const position = this.position();
    if (position !== null && position > testEnd(plan)) this.#finish(plan);
  }

  #finish(plan: TestPlan) {
    this.#halt();
    this.#sample();
    const { base, offset } = this.#deps.audio();
    const expected: RunExpected[] = plan.expected.map((e) => ({
      index: e.index,
      bar: e.bar,
      step: e.step,
      sound: e.sound,
      note: e.note,
      at: e.at,
      scheduled: this.#zero + e.at,
      heardMs: offset.toDeviceMs(this.#zero + e.at),
    }));
    const taken = this.#deps.taken();
    const run: TimingRun = {
      format: RUN_FORMAT,
      version: RUN_VERSION,
      id: runId(taken, this.#deps.runs.list()),
      taken,
      pattern: plan.pattern.id,
      bpm: plan.bpm,
      bars: plan.bars,
      stepSeconds: plan.stepSeconds,
      windowMs: this.#window * 1000,
      environment: this.#deps.environment(base.info?.() ?? null),
      clock: this.#samples,
      expected,
      taps: this.taps,
      summary: summaryOf(expected, this.taps, plan.bars),
    };
    const kept = this.#deps.runs.add(run);
    this.saved = this.#deps.runs.list();
    this.finished = run;
    this.notice = kept ? null : this.#deps.runs.problem;
    this.phase = 'done';
  }
}
