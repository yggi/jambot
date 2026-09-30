import { sine } from '@jambot/spectrum';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Processor = {
  port: { onmessage: ((event: { data: unknown }) => void) | null; posted: unknown[] };
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
};

const sampleRate = 48000;
let Registered: new () => Processor;

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal('sampleRate', sampleRate);
  vi.stubGlobal(
    'AudioWorkletProcessor',
    class {
      port = {
        onmessage: null as ((event: { data: unknown }) => void) | null,
        posted: [] as unknown[],
        postMessage(data: unknown) {
          this.posted.push(data);
        },
      };
    },
  );
  const registered: Record<string, new () => Processor> = {};
  vi.stubGlobal('registerProcessor', (name: string, processor: new () => Processor) => {
    registered[name] = processor;
  });
  await import('./correct.worklet.ts');
  Registered = registered['jambot-correct']!;
});
afterEach(() => vi.unstubAllGlobals());

/** Put a signal through a processor a block at a time, and give back what came out. */
function through(processor: Processor, x: Float32Array, channels = 1): Float32Array[] {
  const out = Array.from({ length: channels }, () => new Float32Array(x.length));
  for (let i = 0; i + 128 <= x.length; i += 128) {
    const outputs = [Array.from({ length: channels }, () => new Float32Array(128))];
    expect(processor.process([[x.subarray(i, i + 128)]], outputs)).toBe(true);
    outputs[0]!.forEach((channel, c) => out[c]!.set(channel, i));
  }
  return out;
}

describe('the correcting worklet', () => {
  it('registers as jambot-correct, and is a pass-through until it is told to correct', () => {
    const processor = new Registered();
    const x = Float32Array.from(sine(220, 4096, sampleRate, { amplitude: 0.5 }));
    const [out] = through(processor, x);
    expect([...out!]).toEqual([...x]);
  });

  it('writes the same sound to every channel of its output', () => {
    const processor = new Registered();
    const x = Float32Array.from(sine(220, 1024, sampleRate));
    const [left, right] = through(processor, x, 2);
    expect([...right!]).toEqual([...left!]);
  });

  it('moves the sound toward the scale it is told, late by the latency it reports', () => {
    const processor = new Registered();
    processor.port.onmessage!({
      data: {
        enabled: true,
        scale: [0, 2, 4, 5, 7, 9, 11],
        retuneSeconds: 0,
        limitCents: 300,
        reference: 440,
      },
    });
    const hz = 440 * 2 ** (25 / 1200);
    const x = Float32Array.from(sine(hz, sampleRate, sampleRate, { amplitude: 0.5 }));
    const [out] = through(processor, x);
    const posted = processor.port.posted.filter(
      (m): m is { offsetCents: number; latency: number } =>
        typeof m === 'object' && m !== null && 'latency' in m,
    );
    expect(posted.length).toBeGreaterThan(0);
    expect(posted.at(-1)!.offsetCents).toBeGreaterThan(-29);
    expect(posted.at(-1)!.offsetCents).toBeLessThan(-21);
    expect(posted.at(-1)!.latency).toBeGreaterThan(0);
    expect(out!.some((v) => Math.abs(v) > 0.2)).toBe(true);
    expect(out!.every(Number.isFinite)).toBe(true);
  });

  it('says what it hears: the pitch, how far it moves it, and its latency, now and then', () => {
    const processor = new Registered();
    processor.port.onmessage!({
      data: {
        enabled: true,
        scale: [0, 2, 4, 5, 7, 9, 11],
        retuneSeconds: 0.05,
        limitCents: 300,
        reference: 440,
      },
    });
    through(processor, Float32Array.from(sine(330, 0.5 * sampleRate, sampleRate)));
    const last = processor.port.posted.at(-1) as {
      heard: number | null;
      offsetCents: number;
      latency: number;
    };
    expect(last.heard).toBeCloseTo(330, -1);
    expect(Number.isFinite(last.offsetCents)).toBe(true);
    // Every few blocks, not every one.
    expect(processor.port.posted.length).toBeLessThan((0.5 * sampleRate) / 128);
  });

  it('goes back to a pass-through when it is turned off, and asks for another scale while it runs', () => {
    const processor = new Registered();
    processor.port.onmessage!({
      data: { enabled: true, scale: [0], retuneSeconds: 0, limitCents: 300, reference: 440 },
    });
    through(processor, Float32Array.from(sine(330, 4096, sampleRate)));
    processor.port.onmessage!({ data: { enabled: false } });
    const x = Float32Array.from(sine(220, 2048, sampleRate));
    expect([...through(processor, x)[0]!]).toEqual([...x]);
  });

  it('is silent when nothing is connected to it, and keeps running', () => {
    const processor = new Registered();
    const outputs = [[new Float32Array(128).fill(1)]];
    expect(processor.process([[]], outputs)).toBe(true);
    expect(outputs[0]![0]!.every((v) => v === 0)).toBe(true);
  });
});
