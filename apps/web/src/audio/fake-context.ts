/**
 * Just enough of Web Audio for the built-in synth to run: every method
 * `webAudioOutput`, `drumKit` and `voices` call, doing nothing but keep what
 * was set on each gain, what each node was connected to, and each
 * oscillator started. A value that is not a finite number throws, as it does
 * in Chromium (Web IDL's `float`), so a voice asked for one is heard nowhere
 * here either. Only tests import it.
 */

export interface FakeParam {
  value: number;
  /** What was scheduled on it, in order: the method and its arguments. */
  readonly events: [string, ...number[]][];
}

/** An oscillator, its type, frequency and detune as set, and when it was started, if it was. */
export interface FakeOscillator extends FakeNode {
  type: string;
  readonly frequency: FakeParam;
  readonly detune: FakeParam;
  started: number | null;
}

/** A filter, its type, cutoff and Q as set. */
export interface FakeFilter extends FakeNode {
  type: string;
  readonly frequency: FakeParam;
  readonly Q: FakeParam;
}

export interface FakeNode {
  readonly connections: unknown[];
  connect(to: unknown): unknown;
  disconnect(): void;
}

export function fakeAudioContext() {
  const gains: (FakeNode & { gain: FakeParam })[] = [];
  const compressors: FakeNode[] = [];
  const oscillators: FakeOscillator[] = [];
  const filters: FakeFilter[] = [];
  const finite = (where: string, ...args: number[]) => {
    if (!args.every(Number.isFinite))
      throw new TypeError(`${where}: the provided float value is non-finite.`);
  };
  const param = (): FakeParam & Record<string, unknown> => {
    const events: FakeParam['events'] = [];
    let value = 0;
    const record =
      (name: string) =>
      (...args: number[]) => {
        finite(name, ...args);
        events.push([name, ...args]);
      };
    return {
      get value() {
        return value;
      },
      set value(v: number) {
        finite('value', v);
        value = v;
      },
      events,
      setValueAtTime: record('setValueAtTime'),
      exponentialRampToValueAtTime: record('exponentialRampToValueAtTime'),
      linearRampToValueAtTime: record('linearRampToValueAtTime'),
      setTargetAtTime: record('setTargetAtTime'),
    };
  };
  const node = (): FakeNode => {
    const connections: unknown[] = [];
    return {
      connections,
      connect(to: unknown) {
        connections.push(to);
        return to;
      },
      disconnect() {},
    };
  };
  const context = {
    sampleRate: 44100,
    currentTime: 0,
    outputLatency: 0,
    baseLatency: 0,
    destination: node(),
    createDynamicsCompressor: () => {
      const compressor = node();
      compressors.push(compressor);
      return compressor;
    },
    createGain: () => {
      const gain = { ...node(), gain: param() as FakeParam };
      gains.push(gain);
      return gain;
    },
    createBiquadFilter: () => {
      const filter: FakeFilter = { ...node(), type: '', Q: param(), frequency: param() };
      filters.push(filter);
      return filter;
    },
    createOscillator: () => {
      const oscillator: FakeOscillator & { start(t: number): void; stop(t: number): void } = {
        ...node(),
        type: '',
        frequency: param(),
        detune: param(),
        started: null,
        start(t: number) {
          finite('start', t);
          oscillator.started = t;
        },
        stop: (t: number) => finite('stop', t),
      };
      oscillators.push(oscillator);
      return oscillator;
    },
    createBuffer: () => ({ getChannelData: () => new Float32Array(1) }),
    createBufferSource: () => ({ ...node(), buffer: null, start() {}, stop() {} }),
    resume: () => Promise.resolve(),
  };
  return { context, gains, compressors, oscillators, filters };
}
