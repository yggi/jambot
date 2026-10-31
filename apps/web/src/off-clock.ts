/**
 * Work done off the clock, in a worker of its own (#406, #495): the page
 * sends a job and is answered between ticks, so the clock never waits on it
 * (the spirit: time is absolute). A section's text is built so
 * (`section-texts.ts`), and a bar is heard so (`ear.ts`), each in its own
 * worker, so neither waits behind the other.
 *
 * `WorkerJobs` is the page's side of one worker: made as a song starts
 * (`begin`) and warmed then, each answer matched to its job by an id, and
 * ended with the song (`end`), as the ticker's is. A job with no worker
 * makes one. Where no worker starts, or one fails, the job runs on this
 * thread, as the ticker falls back to an interval (`ticker.ts`): the jobs
 * waiting on it then, and every one after.
 */

/** The part of a `Worker` this needs, so a test can stand in for one: what it is sent, and what it answers, each under an id. */
export interface JobWorker<
  Message extends { readonly id: number },
  Reply extends { readonly id: number },
> {
  addEventListener(type: 'message', listener: (event: { data: Reply }) => void): void;
  addEventListener(type: 'error', listener: () => void): void;
  postMessage(message: Message): void;
  terminate(): void;
}

/** One worker's jobs, each answered once with its result, which `resultOf` reads from the worker's reply (none to a warm-up). */
export class WorkerJobs<
  Message extends { readonly id: number },
  Reply extends { readonly id: number },
  Result,
> {
  #make: () => JobWorker<Message, Reply>;
  #resultOf: (reply: Reply) => Result | null;
  #worker: JobWorker<Message, Reply> | null = null;
  #failed = false;
  #waiting = new Map<number, { job: () => Result; answer: (result: Result) => void }>();
  #next = 1;

  constructor(make: () => JobWorker<Message, Reply>, resultOf: (reply: Reply) => Result | null) {
    this.#make = make;
    this.#resultOf = resultOf;
  }

  /** A song starts: the worker is made, once, and sent its warm-up. */
  begin(warm: (id: number) => Message): void {
    if (this.#worker) return;
    this.#open()?.postMessage(warm(this.#next++));
  }

  /** A job sent to the worker, `answer` called with its result once; with no worker, `job` run on this thread at once. */
  post(message: (id: number) => Message, job: () => Result, answer: (result: Result) => void) {
    const worker = this.#worker ?? this.#open();
    if (!worker) return answer(job());
    const id = this.#next++;
    this.#waiting.set(id, { job, answer });
    worker.postMessage(message(id));
  }

  /** The song ended: nothing sent is answered any more. */
  end(): void {
    this.#worker?.terminate();
    this.#worker = null;
    this.#waiting.clear();
  }

  #open(): JobWorker<Message, Reply> | null {
    if (this.#failed) return null;
    let worker: JobWorker<Message, Reply>;
    try {
      worker = this.#make();
    } catch {
      this.#failed = true;
      return null;
    }
    worker.addEventListener('message', ({ data }) => {
      const waiting = this.#waiting.get(data.id);
      this.#waiting.delete(data.id);
      const result = this.#resultOf(data);
      if (waiting && result !== null) waiting.answer(result);
    });
    worker.addEventListener('error', () => {
      this.#failed = true;
      const waiting = [...this.#waiting.values()];
      this.end();
      for (const { job, answer } of waiting) answer(job());
    });
    this.#worker = worker;
    return worker;
  }
}
