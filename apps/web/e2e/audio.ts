/**
 * Listening to the app in the browser: the sound sources it starts, the
 * Workers it runs, what reaches the speakers, and each audio context's
 * pairing of its clock with the page's, sampled every few milliseconds.
 */

import type { Page } from '@playwright/test';

export interface Start {
  /** What started: an oscillator's type, or noise. */
  kind: string;
  /** An oscillator's frequency as it starts: 440 for a kick, whose pitch only glides. */
  frequency: number | null;
  when: number;
  /** Which of the page's audio contexts started it, in the order they were made. */
  context: number;
}

/** A span, on the wall clock in milliseconds, in which a page's main thread did nothing. */
export interface Stall {
  from: number;
  to: number;
}

/**
 * What the master level was asked to do, at `at` on the page clock, in
 * milliseconds: to be `value` at once (`set`), or to glide to it on a time
 * constant, in seconds (`target`). The master is the gain that feeds the
 * compressor before the speakers.
 */
export interface MasterCall {
  at: number;
  kind: 'set' | 'target';
  value: number;
  timeConstant: number;
}

/** A sample of an audio context's pairing (`getOutputTimestamp`), with the wall clock it was read on. */
interface PairingSample {
  context: number;
  contextTime: number;
  /** `performance.timeOrigin` plus the pairing's `performanceTime`, in milliseconds. */
  wall: number;
}

/**
 * Listens to the app: every sound source it starts, with its kind and time;
 * every Worker it runs; and a tap on everything that reaches the speakers.
 */
export async function listen(page: Page, path = '/') {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    const w = window as unknown as {
      starts: Start[];
      workers: { running: number; made: number };
      tap?: AnalyserNode;
      contexts: AudioContext[];
      pairings: PairingSample[];
      stalls: Stall[];
      master: MasterCall[];
    };
    w.starts = [];
    w.workers = { running: 0, made: 0 };
    w.contexts = [];
    w.pairings = [];
    w.stalls = [];
    w.master = [];
    // The master's own level: the gain that feeds the compressor. What it is
    // asked to do, at once or on a time constant, is a mute and a fade.
    const masters = new WeakSet<AudioParam>();
    const set = AudioParam.prototype.setValueAtTime;
    AudioParam.prototype.setValueAtTime = function (this: AudioParam, value: number, at: number) {
      if (masters.has(this))
        w.master.push({ at: performance.now(), kind: 'set', value, timeConstant: 0 });
      return set.call(this, value, at);
    };
    const setTarget = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function (
      this: AudioParam,
      target: number,
      startTime: number,
      timeConstant: number,
    ) {
      if (masters.has(this))
        w.master.push({ at: performance.now(), kind: 'target', value: target, timeConstant });
      return setTarget.call(this, target, startTime, timeConstant);
    };
    const Context = AudioContext;
    window.AudioContext = class extends Context {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        w.contexts.push(this);
      }
    };
    // Every 5 ms, each context's pairing; and where the interval came late,
    // by more than 50 ms, the page stalled.
    let last = performance.timeOrigin + performance.now();
    setInterval(() => {
      const now = performance.timeOrigin + performance.now();
      if (now - last > 50) w.stalls.push({ from: last, to: now });
      last = now;
      w.contexts.forEach((ctx, context) => {
        const ts = ctx.getOutputTimestamp?.();
        if (ts?.contextTime && ts.performanceTime)
          w.pairings.push({
            context,
            contextTime: ts.contextTime,
            wall: performance.timeOrigin + ts.performanceTime,
          });
      });
    }, 5);
    // Buffer sources (the noise voices) have their own start.
    for (const source of [OscillatorNode, AudioBufferSourceNode]) {
      const start = source.prototype.start as (...args: number[]) => void;
      source.prototype.start = function (
        this: AudioScheduledSourceNode,
        when = 0,
        ...rest: number[]
      ) {
        const osc = this instanceof OscillatorNode ? this : null;
        w.starts.push({
          kind: osc?.type ?? 'noise',
          frequency: osc?.frequency.value ?? null,
          when,
          context: w.contexts.indexOf(this.context as AudioContext),
        });
        return start.call(this, when, ...rest);
      };
    }
    const connect = AudioNode.prototype.connect as (...args: unknown[]) => unknown;
    AudioNode.prototype.connect = function (this: AudioNode, target: unknown, ...rest: unknown[]) {
      if (this instanceof GainNode && target instanceof DynamicsCompressorNode)
        masters.add(this.gain);
      if (target instanceof AudioDestinationNode) {
        w.tap ??= target.context.createAnalyser();
        connect.call(this, w.tap);
      }
      return connect.call(this, target, ...rest);
    } as typeof AudioNode.prototype.connect;
    const Base = Worker;
    window.Worker = class extends Base {
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args);
        w.workers.made++;
        w.workers.running++;
      }
      override terminate() {
        w.workers.running--;
        super.terminate();
      }
    };
  });
  await page.goto(path);
  return errors;
}

/** Through the lobby's door into the band, playing alone. */
export const solo = (page: Page) => page.getByRole('button', { name: 'Solo', exact: true }).click();

export const starts = (page: Page) =>
  page.evaluate(() => (window as unknown as { starts: Start[] }).starts);

/**
 * Whether a source is the metronome's click, which tells its weights apart
 * by pitch: a square at 1800 Hz, a triangle at 1200, a sine at 800. No MIDI
 * note is any of them. The count-in clicks whether the click is on or not.
 */
export const isClick = (s: Start) =>
  (s.kind === 'square' && s.frequency === 1800) ||
  (s.kind === 'triangle' && s.frequency === 1200) ||
  (s.kind === 'sine' && s.frequency === 800);

/** The distinct times sources were started at, in seconds on the audio clock. */
export const onsets = async (page: Page) =>
  [...new Set((await starts(page)).map((s) => s.when))].sort((a, b) => a - b);

/** The loudest sample the speakers are getting now. */
export const level = (page: Page) =>
  page.evaluate(() => {
    const tap = (window as unknown as { tap: AnalyserNode }).tap;
    const data = new Float32Array(tap.fftSize);
    tap.getFloatTimeDomainData(data);
    return Math.max(...data.map(Math.abs));
  });

export const workers = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { workers: { running: number; made: number } }).workers,
  );

/** A sound source started, and when it was heard. */
export interface Heard extends Start {
  /**
   * When it was heard, on the wall clock (`performance.timeOrigin` plus
   * `performance.now()`), in milliseconds: its audio time through its
   * context's pairing as it sounded, so a jump of the clock between
   * scheduling and sounding is read. A single reading of the pairing can
   * blip by a few milliseconds on a busy machine and the next takes it
   * back, so it is read through the median of the five samples from the
   * first at or after it. Pages in one browser share the wall clock, so it
   * compares what two pages sound. Null where no samples were taken after.
   */
  heard: number | null;
}

/** Every sound source the page started, each with when it was heard. */
export async function heard(page: Page): Promise<Heard[]> {
  const [all, pairings] = await Promise.all([
    starts(page),
    page.evaluate(() => (window as unknown as { pairings: PairingSample[] }).pairings),
  ]);
  const byContext = new Map<number, PairingSample[]>();
  for (const p of pairings) byContext.set(p.context, [...(byContext.get(p.context) ?? []), p]);
  return all.map((start) => {
    const own = byContext.get(start.context) ?? [];
    const first = own.findIndex((p) => p.contextTime >= start.when);
    const samples = first < 0 ? [] : own.slice(first, first + 5);
    if (samples.length < 5) return { ...start, heard: null };
    const readings = samples
      .map((p) => p.wall + (start.when - p.contextTime) * 1000)
      .sort((a, b) => a - b);
    return { ...start, heard: readings[2]! };
  });
}

/** A jump of a page's audio clock: where, on the wall clock, and by how many milliseconds its pairing moved. */
export interface ClockJump {
  at: number;
  by: number;
}

/**
 * Where a page's audio clock jumped: where the median of five samples of
 * its pairing moved from the median of the five before by more than `by`
 * milliseconds, as an output's does when it drops a buffer, is held, or
 * settles after starting. A blip, which the next sample takes back, moves
 * no median.
 */
export async function clockJumps(page: Page, by = 1): Promise<ClockJump[]> {
  const pairings = await page.evaluate(
    () => (window as unknown as { pairings: PairingSample[] }).pairings,
  );
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
  const jumps: ClockJump[] = [];
  for (const context of new Set(pairings.map((p) => p.context))) {
    const own = pairings.filter((p) => p.context === context);
    const gap = own.map((p) => p.wall - p.contextTime * 1000);
    for (let i = 5; i + 5 <= own.length; i++) {
      const moved = median(gap.slice(i, i + 5)) - median(gap.slice(i - 5, i));
      if (Math.abs(moved) > by) {
        jumps.push({ at: own[i]!.wall, by: moved });
        i += 4;
      }
    }
  }
  return jumps.sort((a, b) => a.at - b.at);
}

/**
 * Hold a page's audio for `ms` milliseconds, as a device whose output drops
 * buffers does: every audio context's clock stands still, and what is
 * scheduled on it sounds that much later from then on.
 */
export const holdAudio = (page: Page, ms: number) =>
  page.evaluate(async (ms) => {
    const { contexts } = window as unknown as { contexts: AudioContext[] };
    await Promise.all(contexts.map((ctx) => ctx.suspend()));
    await new Promise((resolve) => setTimeout(resolve, ms));
    await Promise.all(contexts.map((ctx) => ctx.resume()));
  }, ms);

/**
 * Where a page's main thread stalled, on the wall clock: where its 5 ms
 * sampler came more than 50 ms late. Its transport ticks there too, so what
 * the stall passed it dropped rather than played late (T1).
 */
export const stalls = (page: Page) =>
  page.evaluate(() => (window as unknown as { stalls: Stall[] }).stalls);

/** Unfold a card by its title, where it is folded. */
export async function openCard(page: Page, title: string) {
  const card = page.locator(`details[aria-label="${title}"]`);
  if (!(await card.evaluate((details) => (details as HTMLDetailsElement).open)))
    await card.locator('summary .title').click();
}

/** Unfold the style card, where it is folded: its presets and sliders are in its details. */
export const openStyle = (page: Page) => openCard(page, 'Style');

/** What the page asked of the master level, in order. */
export const masterCalls = (page: Page) =>
  page.evaluate(() => (window as unknown as { master: MasterCall[] }).master);
