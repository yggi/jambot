/**
 * The worklet that corrects a live sound toward a scale (#298), in the audio
 * thread: `jambot-correct`. It is a pass-through until it is told to correct,
 * and then each block goes through `@jambot/spectrum`'s `LiveCorrector` (a
 * tracker, a corrector and PSOLA), late by its latency. Settings arrive as
 * messages (`enabled`, `scale`, `retuneSeconds`, `limitCents`, `reference`),
 * and every few blocks it says what it hears, how far it moves the sound and
 * how late it is. It builds the corrector at the first block it corrects, for
 * the block length the browser gives it.
 *
 * The audio worklet's scope has its own globals, which the DOM types do not
 * declare; what this uses of them is named below.
 */

import { LiveCorrector } from '@jambot/spectrum';

interface Settings {
  enabled: boolean;
  scale: readonly number[];
  retuneSeconds: number;
  limitCents: number;
  reference: number;
}

/** What `process` is given and gives back: one array of channels for each input and output. */
type Channels = Float32Array[][];

declare const sampleRate: number;
declare const registerProcessor: (name: string, processor: new () => unknown) => void;
declare const AudioWorkletProcessor: new () => {
  readonly port: {
    onmessage: ((event: { data: Partial<Settings> }) => void) | null;
    postMessage(data: unknown): void;
  };
};

/** How many blocks between reports. A block is 128 samples, 2.7 ms: 16 of them is about 43 ms. */
const REPORT_EVERY = 16;

class Correct extends AudioWorkletProcessor {
  #settings: Settings = {
    enabled: false,
    scale: [0, 2, 4, 5, 7, 9, 11],
    retuneSeconds: 0,
    limitCents: 300,
    reference: 440,
  };
  #live: LiveCorrector | null = null;
  #blocks = 0;

  constructor() {
    super();
    this.port.onmessage = ({ data }) => {
      const before = this.#settings.enabled;
      this.#settings = { ...this.#settings, ...data };
      if (!this.#settings.enabled && before) this.#live = null;
      const live = this.#live;
      if (live) {
        live.corrector.scale = this.#settings.scale;
        live.corrector.retuneSeconds = this.#settings.retuneSeconds;
        live.corrector.limitCents = this.#settings.limitCents;
        live.corrector.reference = this.#settings.reference;
      }
    };
  }

  process(inputs: Channels, outputs: Channels): boolean {
    const input = inputs[0]?.[0];
    const output = outputs[0];
    if (!output) return true;
    if (!input) {
      for (const channel of output) channel.fill(0);
      return true;
    }
    let sound: ArrayLike<number> = input;
    if (this.#settings.enabled) {
      this.#live ??= new LiveCorrector({
        sampleRate,
        block: input.length,
        scale: this.#settings.scale,
        retuneSeconds: this.#settings.retuneSeconds,
        limitCents: this.#settings.limitCents,
        reference: this.#settings.reference,
      });
      sound = this.#live.process(input);
      if (++this.#blocks % REPORT_EVERY === 0)
        this.port.postMessage({
          heard: this.#live.heard ?? null,
          offsetCents: this.#live.offsetCents,
          latency: this.#live.latency,
        });
    }
    for (const channel of output) for (let i = 0; i < channel.length; i++) channel[i] = sound[i]!;
    return true;
  }
}

registerProcessor('jambot-correct', Correct);
