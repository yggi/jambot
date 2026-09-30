import { describe, expect, it, vi } from 'vitest';
import type { Mic, MicSource } from './mic.ts';
import { SYNTH_INPUT, withSynth } from './loopback.ts';

/** A synth's context and output node, and the analyser the tuner makes on them. */
function synth() {
  const log = { connected: 0, disconnected: 0, resumed: 0, analysers: 0 };
  const analyser = {
    fftSize: 0,
    getFloatTimeDomainData(into: Float32Array) {
      for (let i = 0; i < into.length; i++) into[i] = i;
    },
  };
  const node = {
    connect: (to: unknown) => {
      expect(to).toBe(analyser);
      log.connected++;
    },
    disconnect: (from: unknown) => {
      expect(from).toBe(analyser);
      log.disconnected++;
    },
  };
  const context = {
    sampleRate: 44100,
    createAnalyser: () => (log.analysers++, analyser),
    resume: () => (log.resumed++, Promise.resolve()),
  };
  return {
    log,
    tap: { context: context as unknown as AudioContext, node: node as unknown as AudioNode },
  };
}

const microphone = (): MicSource & { opened: (string | undefined)[] } => {
  const opened: (string | undefined)[] = [];
  const mic: Mic = {
    sampleRate: 48000,
    label: 'Mic',
    latest: () => new Float32Array(1),
    stop: () => {},
  };
  return {
    opened,
    open: (id) => (opened.push(id), Promise.resolve(mic)),
    devices: () => Promise.resolve([{ id: 'm', label: 'Mic' }]),
  };
};

describe('withSynth', () => {
  it('adds the synth to the inputs there are, last, without making the synth’s context to list them', async () => {
    const tap = vi.fn();
    const inputs = await withSynth(microphone(), tap).devices();
    expect(inputs).toEqual([
      { id: 'm', label: 'Mic' },
      { id: SYNTH_INPUT, label: 'This device’s synth (what it plays)' },
    ]);
    expect(tap).not.toHaveBeenCalled();
  });

  it('opens the microphones as before, the default one too', async () => {
    const mic = microphone();
    const source = withSynth(mic, () => undefined);
    await source.open();
    await source.open('m');
    expect(mic.opened).toEqual([undefined, 'm']);
  });

  it('listens to what the synth plays: an analyser on its output, at its rate, and never on to the speakers', async () => {
    const { log, tap } = synth();
    const mic = await withSynth(microphone(), () => tap).open(SYNTH_INPUT);
    expect(log).toMatchObject({ analysers: 1, connected: 1, resumed: 1 });
    expect(mic.sampleRate).toBe(44100);
    expect(mic.label).toBe('This device’s synth');
    expect([...mic.latest(3)]).toEqual([32765, 32766, 32767]);
    mic.stop();
    mic.stop();
    expect(log.disconnected).toBe(1);
  });

  it('says so when the synth has nothing to listen to', async () => {
    await expect(withSynth(microphone(), () => undefined).open(SYNTH_INPUT)).rejects.toThrow(
      /synth/,
    );
  });
});
