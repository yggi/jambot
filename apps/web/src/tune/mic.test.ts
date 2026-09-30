import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserMic, MicDenied } from './mic.ts';

/** A context, a stream and an analyser standing in for the browser's, which fill what they are asked with a ramp. */
function browser(options: { deny?: string } = {}) {
  const log = {
    constraints: null as MediaStreamConstraints | null,
    connected: [] as string[],
    stopped: 0,
    closed: 0,
    resumed: 0,
  };
  const track = { label: 'Line in', stop: () => void log.stopped++ };
  const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
  const analyser = {
    fftSize: 0,
    getFloatTimeDomainData(into: Float32Array) {
      for (let i = 0; i < into.length; i++) into[i] = i;
    },
  };
  class Context {
    sampleRate = 44100;
    state = 'suspended';
    createMediaStreamSource() {
      return {
        connect: (to: unknown) => void log.connected.push(to === analyser ? 'analyser' : 'other'),
      };
    }
    createAnalyser() {
      return analyser;
    }
    resume() {
      log.resumed++;
      return Promise.resolve();
    }
    close() {
      log.closed++;
      return Promise.resolve();
    }
    destination = {};
  }
  vi.stubGlobal('AudioContext', Context);
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: (constraints: MediaStreamConstraints) => {
        log.constraints = constraints;
        if (options.deny) return Promise.reject(new DOMException('no', options.deny));
        return Promise.resolve(stream);
      },
      enumerateDevices: () =>
        Promise.resolve([
          { kind: 'audioinput', deviceId: 'a', label: 'Built-in' },
          { kind: 'videoinput', deviceId: 'v', label: 'Camera' },
          { kind: 'audioinput', deviceId: 'b', label: '' },
          { kind: 'audiooutput', deviceId: 'o', label: 'Speakers' },
        ]),
    },
  });
  return { log, analyser };
}

afterEach(() => vi.unstubAllGlobals());

describe('browserMic', () => {
  it('asks for the sound as the instrument makes it: no echo cancelling, no noise suppression, no gain control', async () => {
    const { log } = browser();
    await browserMic().open();
    expect(log.constraints).toEqual({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    });
  });

  it('asks for the device chosen, exactly', async () => {
    const { log } = browser();
    await browserMic().open('b');
    expect(log.constraints!.audio).toMatchObject({ deviceId: { exact: 'b' } });
  });

  it('listens through an analyser and never plays what it hears, which would be feedback', async () => {
    const { log, analyser } = browser();
    await browserMic().open();
    expect(log.connected).toEqual(['analyser']);
    expect(analyser.fftSize).toBe(32768);
    expect(log.resumed).toBe(1);
  });

  it('reports the rate the context runs at, and the name of the device', async () => {
    browser();
    const mic = await browserMic().open();
    expect(mic.sampleRate).toBe(44100);
    expect(mic.label).toBe('Line in');
  });

  it('gives the newest samples, as many as asked for and no more than it holds', async () => {
    browser();
    const mic = await browserMic().open();
    expect([...mic.latest(4)]).toEqual([32764, 32765, 32766, 32767]);
    expect(mic.latest(100000)).toHaveLength(32768);
  });

  it('lets go of the device and the context when stopped, once', async () => {
    const { log } = browser();
    const mic = await browserMic().open();
    mic.stop();
    mic.stop();
    expect(log.stopped).toBe(1);
    expect(log.closed).toBe(1);
  });

  it('says the microphone is blocked when the person refused it, and passes any other failure on', async () => {
    browser({ deny: 'NotAllowedError' });
    await expect(browserMic().open()).rejects.toBeInstanceOf(MicDenied);
    browser({ deny: 'NotFoundError' });
    await expect(browserMic().open()).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('lists the inputs only, and names one that has no label yet', async () => {
    browser();
    expect(await browserMic().devices()).toEqual([
      { id: 'a', label: 'Built-in' },
      { id: 'b', label: 'Input 2' },
    ]);
  });
});
