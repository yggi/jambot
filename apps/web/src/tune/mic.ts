/**
 * The microphone, or a line in: the page's way to the sound for the tuner.
 * It asks the browser for the signal as the instrument makes it (no echo
 * cancelling, no noise suppression, no gain control, each of which would
 * change the pitch or the level it is there to read), and listens through an
 * analyser that feeds nothing, so what it hears is never played back.
 * The newest samples are read when they are wanted, never queued. Its input
 * latency is not measured, so it serves pitch and never timing.
 */

/** An open input. */
export interface Mic {
  /** The samples a second the input runs at. */
  readonly sampleRate: number;
  /** What the device calls itself. */
  readonly label: string;
  /** The newest `count` samples, oldest first, at most what it holds. */
  latest(count: number): Float32Array;
  /** Let go of the device. */
  stop(): void;
}

/** An input device the person can choose. */
export interface InputDevice {
  id: string;
  label: string;
}

/** Where the inputs come from: the browser's, or a stand-in in a test. */
export interface MicSource {
  /** Open an input, the default one or the device with this id. A browser asks the person first. */
  open(deviceId?: string): Promise<Mic>;
  /** The inputs there are. A browser names them only once the person has allowed one. */
  devices(): Promise<InputDevice[]>;
}

/** The person (or their browser) said no to the microphone. */
export class MicDenied extends Error {
  constructor() {
    super('the microphone is blocked');
    this.name = 'MicDenied';
  }
}

/** The longest stretch an analyser keeps: 32768 samples, 0.68 s at 48 kHz. */
const HELD = 32768;

export function browserMic(): MicSource {
  return {
    async open(deviceId) {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
            ...(deviceId === undefined ? {} : { deviceId: { exact: deviceId } }),
          },
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotAllowedError')
          throw new MicDenied();
        throw error;
      }
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = HELD;
      context.createMediaStreamSource(stream).connect(analyser);
      await context.resume();
      const held = new Float32Array(HELD);
      let open = true;
      return {
        sampleRate: context.sampleRate,
        label: stream.getAudioTracks()[0]?.label ?? '',
        latest(count) {
          analyser.getFloatTimeDomainData(held);
          return held.slice(HELD - Math.min(count, HELD));
        },
        stop() {
          if (!open) return;
          open = false;
          for (const track of stream.getTracks()) track.stop();
          void context.close();
        },
      };
    },

    async devices() {
      const all = await navigator.mediaDevices.enumerateDevices();
      return all
        .filter((device) => device.kind === 'audioinput')
        .map((device, i) => ({ id: device.deviceId, label: device.label || `Input ${i + 1}` }));
    },
  };
}
