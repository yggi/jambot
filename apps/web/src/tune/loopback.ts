/**
 * The synth as an input of the tuner: what the built-in synth plays, read
 * before it reaches the speakers, the way a microphone is. It closes a loop
 * the tuner can measure: a note sent to the synth is heard by the tuner at
 * a frequency it knows exactly, so the tuner's own error shows (#269).
 */

import { listenThrough, type Mic, type MicSource } from './mic.ts';
import type { InputDevice } from './mic.ts';

/** The input id that is this device's synth. */
export const SYNTH_INPUT = 'synth';

/** The synth's context and the node its sound leaves by (`Output.tap`). */
export interface Tap {
  readonly context: AudioContext;
  readonly node: AudioNode;
}

const SYNTH_DEVICE: InputDevice = { id: SYNTH_INPUT, label: 'This device’s synth (what it plays)' };

/**
 * The inputs of `mic`, and the synth as one more. The synth's context is made
 * only when it is chosen, so listing the inputs starts no audio.
 */
export function withSynth(mic: MicSource, tap: () => Tap | undefined): MicSource {
  return {
    async open(deviceId): Promise<Mic> {
      if (deviceId !== SYNTH_INPUT) return mic.open(deviceId);
      const synth = tap();
      if (!synth) throw new Error('the synth has nothing to listen to');
      const analyser = synth.context.createAnalyser();
      synth.node.connect(analyser);
      await synth.context.resume();
      return listenThrough(analyser, synth.context.sampleRate, 'This device’s synth', () =>
        synth.node.disconnect(analyser),
      );
    },
    async devices() {
      return [...(await mic.devices()), SYNTH_DEVICE];
    },
  };
}
