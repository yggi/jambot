/**
 * A microphone and a look at its sound, driven by hand, for the tuner's
 * tests and the screen's: the microphone hears whatever `heard.signal` is,
 * its newest samples last, and every look is kept. Only tests import it.
 */

import { analyse, sine } from '@jambot/spectrum';
import type { Analyse } from './analysis.ts';
import { vi } from 'vitest';
import type { Mic, MicSource } from './mic.ts';

export const sampleRate = 48000;

/** A microphone that hears whatever `heard.signal` is, its newest samples last. */
export function world() {
  const heard = { signal: new Float64Array(16384) as ArrayLike<number> };
  const log = { opened: [] as (string | undefined)[], stopped: 0, asked: [] as number[] };
  const mic: Mic = {
    sampleRate,
    label: 'Test input',
    latest(count) {
      log.asked.push(count);
      return Float32Array.from(Array.prototype.slice.call(heard.signal, -count) as number[]);
    },
    stop: () => void log.stopped++,
  };
  const source: MicSource = {
    open: (id) => {
      log.opened.push(id);
      return Promise.resolve(mic);
    },
    devices: () => Promise.resolve([{ id: 'a', label: 'Built-in' }]),
  };
  const analysed: number[] = [];
  const analyseHere: Analyse = (samples, rate) => {
    analysed.push(samples.length);
    return Promise.resolve(analyse(samples, rate));
  };
  return { heard, log, source, analysed, analyseHere, mic };
}

/** A sine a little louder than a whisper, at `hz` and then `cents` sharp of it. */
export const tone = (hz: number, cents = 0) =>
  sine(hz * 2 ** (cents / 1200), 16384, sampleRate, { amplitude: 0.5 });

/** An audio context, the worklet node made in it and the graph wired between them, all kept for the test to look at. */
export function correctionWorld() {
  const log = {
    modules: [] as string[],
    nodes: [] as FakeNode[],
    gains: [] as { gain: { value: number }; connected: unknown[] }[],
    capacity: { started: 0, stopped: 0, onupdate: null as ((e: unknown) => void) | null },
  };
  class FakeNode {
    port = {
      posted: [] as unknown[],
      onmessage: null as ((e: { data: unknown }) => void) | null,
      postMessage: (d: unknown) => void this.port.posted.push(d),
    };
    connected: unknown[] = [];
    disconnected = 0;
    constructor(
      public context: unknown,
      public name: string,
      public options: unknown,
    ) {
      log.nodes.push(this);
    }
    connect(to: unknown) {
      this.connected.push(to);
      return to;
    }
    disconnect() {
      this.disconnected++;
    }
  }
  vi.stubGlobal('AudioWorkletNode', FakeNode);
  const destination = { name: 'destination' };
  const context = {
    sampleRate: 48000,
    destination,
    audioWorklet: { addModule: (url: string) => (log.modules.push(url), Promise.resolve()) },
    createGain() {
      const gain = {
        gain: { value: 1 },
        connected: [] as unknown[],
        connect(to: unknown) {
          this.connected.push(to);
          return to;
        },
        disconnect() {},
      };
      log.gains.push(gain);
      return gain;
    },
    renderCapacity: {
      start: () => void log.capacity.started++,
      stop: () => void log.capacity.stopped++,
      set onupdate(f: ((e: unknown) => void) | null) {
        log.capacity.onupdate = f;
      },
    },
  } as unknown as AudioContext;
  const source = {
    connected: [] as unknown[],
    connect(to: unknown) {
      this.connected.push(to);
      return to;
    },
    disconnect() {},
  };
  const stopped = { count: 0 };
  const mic: Mic = {
    sampleRate: 48000,
    label: 'Input',
    latest: () => new Float32Array(1),
    stop: () => void stopped.count++,
    source: { context, node: source as unknown as AudioNode },
  };
  const opened: (string | undefined)[] = [];
  const micSource: MicSource = {
    open: (id) => (opened.push(id), Promise.resolve(mic)),
    devices: () => Promise.resolve([]),
  };
  return { log, context, source, stopped, opened, micSource, mic };
}
