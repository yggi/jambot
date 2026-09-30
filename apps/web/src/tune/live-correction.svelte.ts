/**
 * The live correction (#298), on the page's side: it opens an input, builds
 * `correct.worklet.ts` in that input's audio context, wires the sound through
 * it to the speakers, and tells it what to do (a scale on a root, how fast to
 * retune, how far it may move a sound). What the worklet says back (the pitch
 * it hears, how far it moves the sound, its latency) and how hard the audio
 * thread works are kept for the screen. What it plays is quiet until the
 * person asks to hear it, since a microphone that hears its own output feeds
 * back; the corrected sound is also an input of the tuner (`withCorrected`),
 * which reads it whether it is heard or not.
 */

import { type InputDevice, type Tap, MicDenied, type Mic, type MicSource } from './mic.ts';
import { pitchClassesOf } from './scales.ts';

export type CorrectionStatus = 'off' | 'starting' | 'running' | 'failed';

export interface CorrectionDeps {
  mic: MicSource;
  /** Where the worklet's module is served from. */
  moduleUrl: string;
}

/** How hard the audio thread works, from the browser's render capacity: 0 to 1, and the share of blocks it missed. */
export interface Load {
  average: number;
  peak: number;
  underruns: number;
}

/** A context's render capacity, where the browser has it. */
interface RenderCapacity {
  start(options?: { updateInterval: number }): void;
  stop(): void;
  onupdate:
    ((event: { averageLoad: number; peakLoad: number; underrunRatio: number }) => void) | null;
}

/** The contexts the worklet's module has been added to. */
const loaded = new WeakSet<BaseAudioContext>();

export class LiveCorrection {
  #deps: CorrectionDeps;
  status: CorrectionStatus = $state('off');
  /** What the person is told when it did not start. */
  message = $state('');
  /** The input to take the sound from: `undefined` is the default. */
  inputId: string | undefined = $state(undefined);
  /** The inputs there are to take the sound from. */
  devices: InputDevice[] = $state.raw([]);
  /** The root of the scale, 0 (C) to 11. */
  root = $state(0);
  /** The scale, by the theory's id (`CORRECTION_SCALES`). */
  scaleId = $state('ionian');
  /** The time constant of the glide toward a note, in seconds: 0 is at once. */
  retuneSeconds = $state(0);
  /** The most a sound is moved, in cents either way. */
  limitCents = $state(300);
  /** The A4 of the notes, in Hz. */
  reference = $state(440);
  /** Whether the corrected sound is played to the speakers. */
  monitor = $state(false);
  /** The pitch the worklet hears, in Hz, or null where there is none. */
  heard: number | null = $state(null);
  /** How far it is moving the sound now, in cents. */
  offsetCents = $state(0);
  /** How late the sound comes out, in milliseconds, once the worklet has said. */
  latencyMs: number | null = $state(null);
  load: Load | null = $state.raw(null);

  #mic: Mic | null = null;
  #node: AudioWorkletNode | null = null;
  #gain: GainNode | null = null;
  #tap: Tap | undefined;
  #run = 0;

  constructor(deps: CorrectionDeps) {
    this.#deps = deps;
  }

  /** List the inputs, so one can be chosen before starting. */
  async loadDevices(): Promise<void> {
    try {
      this.devices = await this.#deps.mic.devices();
    } catch {
      // No list: the default input is still there.
    }
  }

  /** Start correcting. A press of the person's: a browser plays audio, and asks for the microphone, only after one. */
  async start(): Promise<void> {
    if (this.status === 'starting' || this.status === 'running') return;
    const run = ++this.#run;
    this.status = 'starting';
    this.message = '';
    let mic: Mic | null = null;
    try {
      mic = await this.#deps.mic.open(this.inputId);
      if (run !== this.#run) {
        mic.stop();
        return;
      }
      const source = mic.source;
      if (!source) throw new CannotRoute();
      const { context } = source;
      if (!loaded.has(context)) {
        await context.audioWorklet.addModule(this.#deps.moduleUrl);
        loaded.add(context);
      }
      if (run !== this.#run) {
        mic.stop();
        return;
      }
      const node = new AudioWorkletNode(context, 'jambot-correct', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      const gain = context.createGain();
      source.node.connect(node);
      node.connect(gain);
      gain.connect(context.destination);
      node.port.onmessage = ({ data }) => {
        const said = data as { heard: number | null; offsetCents: number; latency: number };
        this.heard = said.heard;
        this.offsetCents = said.offsetCents;
        this.latencyMs = (said.latency / context.sampleRate) * 1000;
      };
      const capacity = (context as unknown as { renderCapacity?: RenderCapacity }).renderCapacity;
      if (capacity) {
        capacity.onupdate = ({ averageLoad, peakLoad, underrunRatio }) => {
          this.load = { average: averageLoad, peak: peakLoad, underruns: underrunRatio };
        };
        capacity.start({ updateInterval: 0.5 });
      }
      this.#mic = mic;
      this.#node = node;
      this.#gain = gain;
      this.#tap = { context, node };
      this.status = 'running';
      this.apply();
    } catch (error) {
      mic?.stop();
      if (run !== this.#run) return;
      this.status = 'failed';
      this.message =
        error instanceof MicDenied
          ? 'The microphone is blocked. Allow it for this page in the browser’s site settings, then press Start.'
          : error instanceof CannotRoute
            ? 'That input cannot be corrected: it has no place in the audio graph to take the sound from.'
            : `The correction could not start: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /** Send the worklet what to do, and set whether it is heard: call again after changing any setting. */
  apply(): void {
    if (this.status !== 'running' || !this.#node || !this.#gain) return;
    this.#node.port.postMessage({
      enabled: true,
      scale: pitchClassesOf(this.scaleId, this.root),
      retuneSeconds: this.retuneSeconds,
      limitCents: this.limitCents,
      reference: this.reference,
    });
    this.#gain.gain.value = this.monitor ? 1 : 0;
  }

  /** Stop: the worklet and the input are let go of. */
  stop(): void {
    this.#run++;
    if (this.#node) {
      this.#node.port.postMessage({ enabled: false });
      this.#node.disconnect();
    }
    this.#gain?.disconnect();
    const capacity = (
      this.#tap?.context as unknown as { renderCapacity?: RenderCapacity } | undefined
    )?.renderCapacity;
    if (capacity) {
      capacity.stop();
      capacity.onupdate = null;
    }
    this.#mic?.stop();
    this.#mic = null;
    this.#node = null;
    this.#gain = null;
    this.#tap = undefined;
    this.status = 'off';
    this.heard = null;
    this.offsetCents = 0;
    this.latencyMs = null;
    this.load = null;
  }

  /** The corrected sound as a place to take it from, while it runs. */
  outputTap(): Tap | undefined {
    return this.status === 'running' ? this.#tap : undefined;
  }
}

/** The input has no node to take its sound from. */
class CannotRoute extends Error {}
