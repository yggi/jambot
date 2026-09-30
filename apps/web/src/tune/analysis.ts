/**
 * The tuner's look at the sound, asked of a worker so that the analysis
 * never runs on the page's thread, where the clock lives. A request is some
 * samples and their rate, and the reply is what `@jambot/spectrum`'s `analyse`
 * found in them. `answer` is the worker's whole job, and `WorkerAnalysis` the
 * page's side: it makes the worker when first asked, matches each reply to its
 * request, and hands the samples over instead of copying them.
 */

import { type Analysis, analyse } from '@jambot/spectrum';

export interface Request {
  id: number;
  samples: Float32Array;
  sampleRate: number;
}

export interface Reply {
  id: number;
  analysis: Analysis;
}

/** What the worker does with a request. */
export function answer({ id, samples, sampleRate }: Request): Reply {
  return { id, analysis: analyse(samples, sampleRate) };
}

/** The part of a `Worker` this needs, so a test can stand in for one. */
export interface WorkerLike {
  addEventListener(type: 'message', listener: (event: { data: Reply }) => void): void;
  postMessage(message: Request, transfer?: Transferable[]): void;
  terminate(): void;
}

/** A look at some samples: the page's way of asking, whoever answers. */
export type Analyse = (samples: Float32Array, sampleRate: number) => Promise<Analysis>;

export class WorkerAnalysis {
  #make: () => WorkerLike;
  #worker: WorkerLike | null = null;
  #waiting = new Map<number, { resolve: (a: Analysis) => void; reject: (e: Error) => void }>();
  #next = 1;

  constructor(make: () => WorkerLike) {
    this.#make = make;
  }

  /** Look at `samples`, which are handed to the worker and so are empty afterwards. */
  analyse: Analyse = (samples, sampleRate) => {
    const worker = (this.#worker ??= this.#open());
    const id = this.#next++;
    return new Promise((resolve, reject) => {
      this.#waiting.set(id, { resolve, reject });
      worker.postMessage({ id, samples, sampleRate }, [samples.buffer]);
    });
  };

  #open(): WorkerLike {
    const worker = this.#make();
    worker.addEventListener('message', ({ data }) => {
      this.#waiting.get(data.id)?.resolve(data.analysis);
      this.#waiting.delete(data.id);
    });
    return worker;
  }

  /** End the worker; the looks still waiting are rejected, and a new look makes another. */
  terminate(): void {
    this.#worker?.terminate();
    this.#worker = null;
    for (const { reject } of this.#waiting.values()) reject(new Error('the analysis ended'));
    this.#waiting.clear();
  }
}
