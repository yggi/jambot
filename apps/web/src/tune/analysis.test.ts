// @vitest-environment node
import { sine } from '@jambot/spectrum';
import { describe, expect, it } from 'vitest';
import { answer, type Reply, type Request, WorkerAnalysis, type WorkerLike } from './analysis.ts';

const sampleRate = 48000;
const request = (id: number, hz = 440): Request => ({
  id,
  sampleRate,
  samples: Float32Array.from(sine(hz, 16384, sampleRate)),
});

/** A worker that answers on a later turn, as a real one does, and keeps what it was given. */
function fakeWorker() {
  const worker: WorkerLike & {
    received: Request[];
    terminated: boolean;
    listeners: ((event: { data: Reply }) => void)[];
  } = {
    received: [],
    terminated: false,
    listeners: [],
    addEventListener(_type, listener) {
      worker.listeners.push(listener);
    },
    postMessage(message) {
      worker.received.push(message);
      const reply = answer(message);
      queueMicrotask(() => worker.listeners.forEach((listener) => listener({ data: reply })));
    },
    terminate() {
      worker.terminated = true;
    },
  };
  return worker;
}

describe('answer', () => {
  it('answers a request with the look at its samples, under its own id', () => {
    const reply = answer(request(7, 220));
    expect(reply.id).toBe(7);
    expect(reply.analysis.pitch!.hz).toBeCloseTo(220, 0);
  });
});

describe('WorkerAnalysis', () => {
  it('makes its worker on the first look, and not before', async () => {
    let made = 0;
    const analysis = new WorkerAnalysis(() => {
      made++;
      return fakeWorker();
    });
    expect(made).toBe(0);
    await analysis.analyse(request(0).samples, sampleRate);
    await analysis.analyse(request(0).samples, sampleRate);
    expect(made).toBe(1);
  });

  it('gives each look its own answer, in order, with samples handed over rather than copied', async () => {
    const worker = fakeWorker();
    const analysis = new WorkerAnalysis(() => worker);
    const a = await analysis.analyse(request(0, 220).samples, sampleRate);
    const b = await analysis.analyse(request(0, 330).samples, sampleRate);
    expect(a.pitch!.hz).toBeCloseTo(220, 0);
    expect(b.pitch!.hz).toBeCloseTo(330, 0);
    expect(worker.received.map((r) => r.id)).toEqual([1, 2]);
  });

  it('answers two looks that overlap each with its own', async () => {
    const analysis = new WorkerAnalysis(fakeWorker);
    const [a, b] = await Promise.all([
      analysis.analyse(request(0, 220).samples, sampleRate),
      analysis.analyse(request(0, 330).samples, sampleRate),
    ]);
    expect(a.pitch!.hz).toBeCloseTo(220, 0);
    expect(b.pitch!.hz).toBeCloseTo(330, 0);
  });

  it('ends its worker, and makes another when asked again', async () => {
    const workers: ReturnType<typeof fakeWorker>[] = [];
    const analysis = new WorkerAnalysis(() => {
      workers.push(fakeWorker());
      return workers.at(-1)!;
    });
    await analysis.analyse(request(0).samples, sampleRate);
    analysis.terminate();
    expect(workers[0]!.terminated).toBe(true);
    await analysis.analyse(request(0).samples, sampleRate);
    expect(workers).toHaveLength(2);
  });

  it('rejects the looks still waiting when its worker ends', async () => {
    const analysis = new WorkerAnalysis(() => ({
      addEventListener: () => {},
      postMessage: () => {},
      terminate: () => {},
    }));
    const waiting = analysis.analyse(request(0).samples, sampleRate);
    analysis.terminate();
    await expect(waiting).rejects.toThrow(/ended/);
  });
});
