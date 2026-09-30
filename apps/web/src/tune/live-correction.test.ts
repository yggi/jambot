import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { correctionWorld as browser } from './fixtures.ts';
import { MicDenied } from './mic.ts';
import { LiveCorrection } from './live-correction.svelte.ts';

beforeEach(() => vi.stubGlobal('AudioWorkletNode', undefined));
afterEach(() => vi.unstubAllGlobals());

describe('the live correction', () => {
  it('is off until started, and then runs: the input opened, the worklet made in its context, and the sound wired through it to the speakers', async () => {
    const w = browser();
    const correction = new LiveCorrection({ mic: w.micSource, moduleUrl: '/correct.js' });
    expect(correction.status).toBe('off');
    expect(correction.outputTap()).toBeUndefined();
    await correction.start();
    expect(correction.status).toBe('running');
    expect(w.opened).toEqual([undefined]);
    expect(w.log.modules).toEqual(['/correct.js']);
    const node = w.log.nodes[0]!;
    expect(node.name).toBe('jambot-correct');
    expect(node.options).toMatchObject({
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    expect(w.source.connected).toEqual([node]);
    expect(node.connected).toHaveLength(1);
    expect(w.log.gains[0]!.connected).toEqual([
      (w.context as unknown as { destination: unknown }).destination,
    ]);
    expect(correction.outputTap()).toEqual({ context: w.context, node });
  });

  it('keeps what it plays quiet until the person asks to hear it, since a microphone that hears its own output feeds back', async () => {
    const w = browser();
    const correction = new LiveCorrection({ mic: w.micSource, moduleUrl: '/correct.js' });
    await correction.start();
    expect(w.log.gains[0]!.gain.value).toBe(0);
    correction.monitor = true;
    correction.apply();
    expect(w.log.gains[0]!.gain.value).toBe(1);
  });

  it('tells the worklet what to do: the scale on its root, how fast to retune, and how far it may move a sound', async () => {
    const w = browser();
    const correction = new LiveCorrection({ mic: w.micSource, moduleUrl: '/correct.js' });
    correction.root = 9;
    correction.scaleId = 'aeolian';
    correction.retuneSeconds = 0.05;
    correction.limitCents = 200;
    correction.reference = 432;
    await correction.start();
    expect(w.log.nodes[0]!.port.posted.at(-1)).toEqual({
      enabled: true,
      scale: [0, 2, 4, 5, 7, 9, 11],
      retuneSeconds: 0.05,
      limitCents: 200,
      reference: 432,
    });
    correction.root = 0;
    correction.scaleId = 'major pentatonic';
    correction.apply();
    expect(w.log.nodes[0]!.port.posted.at(-1)).toMatchObject({ scale: [0, 2, 4, 7, 9] });
  });

  it('shows what the worklet says: the pitch heard, how far the sound is moved, and how late it comes, in ms', async () => {
    const w = browser();
    const correction = new LiveCorrection({ mic: w.micSource, moduleUrl: '/correct.js' });
    await correction.start();
    w.log.nodes[0]!.port.onmessage!({ data: { heard: 110.5, offsetCents: -20.25, latency: 2400 } });
    expect(correction.heard).toBe(110.5);
    expect(correction.offsetCents).toBe(-20.25);
    expect(correction.latencyMs).toBeCloseTo(50, 6);
    w.log.nodes[0]!.port.onmessage!({ data: { heard: null, offsetCents: 0, latency: 2400 } });
    expect(correction.heard).toBeNull();
  });

  it('shows how hard the audio thread works, where the browser says', async () => {
    const w = browser();
    const correction = new LiveCorrection({ mic: w.micSource, moduleUrl: '/correct.js' });
    await correction.start();
    expect(w.log.capacity.started).toBe(1);
    w.log.capacity.onupdate!({ averageLoad: 0.03, peakLoad: 0.11, underrunRatio: 0 });
    expect(correction.load).toEqual({ average: 0.03, peak: 0.11, underruns: 0 });
    correction.stop();
    expect(w.log.capacity.stopped).toBe(1);
  });

  it('loads the worklet once for a context, however many times it starts', async () => {
    const w = browser();
    const correction = new LiveCorrection({ mic: w.micSource, moduleUrl: '/correct.js' });
    await correction.start();
    correction.stop();
    await correction.start();
    expect(w.log.modules).toHaveLength(1);
    expect(w.log.nodes).toHaveLength(2);
  });

  it('stops: the worklet and the input let go, and nothing left to hear', async () => {
    const w = browser();
    const correction = new LiveCorrection({ mic: w.micSource, moduleUrl: '/correct.js' });
    await correction.start();
    correction.stop();
    expect(correction.status).toBe('off');
    expect(w.log.nodes[0]!.disconnected).toBeGreaterThan(0);
    expect(w.stopped.count).toBe(1);
    expect(correction.outputTap()).toBeUndefined();
    expect(correction.heard).toBeNull();
  });

  it('opens the input the person chose, and starts once however many presses', async () => {
    const w = browser();
    const correction = new LiveCorrection({ mic: w.micSource, moduleUrl: '/correct.js' });
    correction.inputId = 'synth';
    await Promise.all([correction.start(), correction.start()]);
    await correction.start();
    expect(w.opened).toEqual(['synth']);
  });

  it('says so when the input cannot be routed, the microphone is blocked, or the worklet will not load', async () => {
    const w = browser();
    const unroutable = new LiveCorrection({
      mic: {
        ...w.micSource,
        // An input with nowhere in the graph to take its sound from.
        open: () =>
          Promise.resolve({
            sampleRate: 48000,
            label: 'Bare',
            latest: () => new Float32Array(1),
            stop: () => {},
          }),
      },
      moduleUrl: '/c.js',
    });
    await unroutable.start();
    expect(unroutable.status).toBe('failed');
    expect(unroutable.message).toMatch(/cannot be corrected/);
    const blocked = new LiveCorrection({
      mic: { ...w.micSource, open: () => Promise.reject(new MicDenied()) },
      moduleUrl: '/c.js',
    });
    await blocked.start();
    expect(blocked.message).toMatch(/blocked/);
    const x = browser();
    (
      x.context as unknown as { audioWorklet: { addModule: () => Promise<void> } }
    ).audioWorklet.addModule = () => Promise.reject(new Error('no such module'));
    const broken = new LiveCorrection({ mic: x.micSource, moduleUrl: '/c.js' });
    await broken.start();
    expect(broken.status).toBe('failed');
    expect(broken.message).toContain('no such module');
    expect(x.stopped.count).toBe(1);
  });
});
