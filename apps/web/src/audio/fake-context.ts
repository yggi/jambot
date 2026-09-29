/**
 * Just enough of Web Audio for the built-in synth to run without throwing:
 * every method `webAudioOutput`, `drumKit` and `voices` call, doing nothing
 * but keep what was set on each gain, and what each node was connected to.
 * Only tests import it.
 */

export interface FakeParam {
  value: number;
  /** What was scheduled on it, in order: the method and its arguments. */
  readonly events: [string, ...number[]][];
}

export interface FakeNode {
  readonly connections: unknown[];
  connect(to: unknown): unknown;
  disconnect(): void;
}

export function fakeAudioContext() {
  const gains: (FakeNode & { gain: FakeParam })[] = [];
  const compressors: FakeNode[] = [];
  const param = (): FakeParam & Record<string, unknown> => {
    const events: FakeParam['events'] = [];
    const record =
      (name: string) =>
      (...args: number[]) =>
        void events.push([name, ...args]);
    return {
      value: 0,
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
    createBiquadFilter: () => ({ ...node(), type: '', Q: param(), frequency: param() }),
    createOscillator: () => ({ ...node(), type: '', frequency: param(), start() {}, stop() {} }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(1) }),
    createBufferSource: () => ({ ...node(), buffer: null, start() {}, stop() {} }),
    resume: () => Promise.resolve(),
  };
  return { context, gains, compressors };
}
