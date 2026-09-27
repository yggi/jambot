/**
 * Listening to the app in the browser: the sound sources it starts, the
 * Workers it runs, and what reaches the speakers.
 */

import type { Page } from '@playwright/test';

export interface Start {
  /** What started: an oscillator's type, or noise. */
  kind: string;
  /** An oscillator's frequency as it starts: 440 for a kick, whose pitch only glides. */
  frequency: number | null;
  when: number;
  /**
   * When it is heard, on the wall clock (`performance.timeOrigin` plus
   * `performance.now()`), in milliseconds: its audio time through the
   * context's own pairing of its clock with the page's. Pages in one
   * browser share this clock, so it compares what two pages sound.
   */
  heard: number | null;
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
    };
    w.starts = [];
    w.workers = { running: 0, made: 0 };
    // Buffer sources (the noise voices) have their own start.
    for (const source of [OscillatorNode, AudioBufferSourceNode]) {
      const start = source.prototype.start as (...args: number[]) => void;
      source.prototype.start = function (
        this: AudioScheduledSourceNode,
        when = 0,
        ...rest: number[]
      ) {
        const osc = this instanceof OscillatorNode ? this : null;
        const ts = (this.context as AudioContext).getOutputTimestamp?.();
        const paired = ts && ts.contextTime !== undefined && ts.performanceTime ? ts : null;
        w.starts.push({
          kind: osc?.type ?? 'noise',
          frequency: osc?.frequency.value ?? null,
          when,
          heard: paired
            ? performance.timeOrigin + paired.performanceTime! + (when - paired.contextTime!) * 1000
            : null,
        });
        return start.call(this, when, ...rest);
      };
    }
    const connect = AudioNode.prototype.connect as (...args: unknown[]) => unknown;
    AudioNode.prototype.connect = function (this: AudioNode, target: unknown, ...rest: unknown[]) {
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

export const starts = (page: Page) =>
  page.evaluate(() => (window as unknown as { starts: Start[] }).starts);

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
