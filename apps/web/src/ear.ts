/**
 * The band heard off the clock (#495): each bar the band composed,
 * recognised among each member's library and what it played lately (cells'
 * recogniser, `recognisedBar` with `lately`, E45), in a worker of its own
 * (`ear.worker.ts`), so the clock never waits on the recogniser (the
 * spirit: time is absolute), nor a section's text behind it.
 *
 * `hearBar` is the whole job, and the same wherever it runs: plain data in
 * (the bar's texts, its bench, the layer as of the bar and what was played
 * lately), plain data out (whether each member was recognised, and what it
 * cost). What is kept between bars is the page's (`hearing.ts`), so a job
 * run on this thread, where the worker failed, answers as the worker would.
 * The worker keeps only its recogniser, warmed on every member's seeds as a
 * song starts (`warmedRecogniser`), which cells bounds (#277) and which
 * changes no answer.
 */

import {
  type BarRecognition,
  type BarTexts,
  type Bench,
  type Lately,
  type LearnedLayer,
  createRecogniser,
  recognisedBar,
  warmedRecogniser,
} from '@jambot/engine';
import { type JobWorker, WorkerJobs } from './off-clock.ts';

/** What the ear is asked of a bar: what each member played in it as cells text, its bench, the layer as of it, and what was played lately. */
export interface HearAsk {
  readonly bar: number;
  readonly texts: BarTexts;
  readonly bench: Bench;
  readonly layer: LearnedLayer | null;
  readonly lately: Lately;
}

/** What the ear heard in a bar: whether each member that played was recognised, and the recognition's cost where it ran, in ms. */
export interface Heard {
  readonly bar: number;
  readonly recognition: BarRecognition;
  readonly cost: number;
}

/** The recogniser's part this needs. */
type Recogniser = Parameters<typeof recognisedBar>[0];

/** The job: a bar's texts recognised, timed on `clock` (ms). */
export function hearBar(
  recogniser: Recogniser,
  { bar, texts, bench, layer, lately }: HearAsk,
  clock: () => number = () => performance.now(),
): Heard {
  const t0 = clock();
  const recognition = recognisedBar(recogniser, texts, bench, layer ?? undefined, 0, lately);
  return { bar, recognition, cost: clock() - t0 };
}

/** Where a bar is heard: the band's ear. */
export interface Ear {
  /** A song starts. */
  begin(): void;
  /** Hear a bar, and `answer` with what was heard, once. */
  hear(ask: HearAsk, answer: (heard: Heard) => void): void;
  /** The song ended: nothing asked is answered any more. */
  end(): void;
}

/** The job run on the thread that asks, with a cold recogniser of its own, the answer given before `hear` returns. */
export function inlineEar(): Ear {
  let recogniser: Recogniser | null = null;
  return {
    begin() {},
    hear: (ask, answer) => answer(hearBar((recogniser ??= createRecogniser()), ask)),
    end() {},
  };
}

/** What the page asks the worker: a bar to hear, or to warm up. */
export type EarAsk =
  { readonly id: number; readonly hear: HearAsk } | { readonly id: number; readonly warm: true };

/** What the worker answers, under the ask's id: what it heard, or nothing to a warm-up. */
export interface EarAnswer {
  readonly id: number;
  readonly heard: Heard | null;
}

/** The worker's side: one recogniser, warmed by the warm-up, hearing every bar after it. */
export function earWorker(): (ask: EarAsk) => EarAnswer {
  let recogniser: Recogniser | null = null;
  return (ask) => {
    if ('warm' in ask) {
      recogniser ??= warmedRecogniser();
      return { id: ask.id, heard: null };
    }
    return { id: ask.id, heard: hearBar((recogniser ??= createRecogniser()), ask.hear) };
  };
}

/** The part of a `Worker` this needs, so a test can stand in for one. */
export type EarWorker = JobWorker<EarAsk, EarAnswer>;

/**
 * The page's side of the worker (`ear.worker.ts`), off the clock as
 * `WorkerJobs` runs it: made as a song starts and its recogniser warmed
 * then, and ended with the song; where no worker starts, or one fails, a
 * bar is heard on this thread, with a cold recogniser.
 */
export class WorkerEar implements Ear {
  #jobs: WorkerJobs<EarAsk, EarAnswer, Heard>;
  #recogniser: Recogniser | null = null;

  constructor(make: () => EarWorker) {
    this.#jobs = new WorkerJobs(make, (answer) => answer.heard);
  }

  begin(): void {
    this.#jobs.begin((id) => ({ id, warm: true }));
  }

  hear(ask: HearAsk, answer: (heard: Heard) => void): void {
    this.#jobs.post(
      (id) => ({ id, hear: ask }),
      () => hearBar((this.#recogniser ??= createRecogniser()), ask),
      answer,
    );
  }

  end(): void {
    this.#jobs.end();
  }
}

/** The browser's: a worker of its own, made as a song starts. */
export const browserEar = (): Ear =>
  new WorkerEar(() => new Worker(new URL('./ear.worker.ts', import.meta.url), { type: 'module' }));
