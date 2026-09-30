/**
 * Sounds inside the page as inputs of the tuner: what the built-in synth
 * plays (`withSynth`) and what a live correction gives back (`withCorrected`),
 * each read before it reaches the speakers, the way a microphone is. They
 * close loops the tuner can measure: a note sent to the synth is heard at a
 * frequency the tuner knows exactly, so its own error shows (#269), and a
 * sound corrected toward a scale is heard at the note it was moved to (#298).
 */

import { listenThrough, type InputDevice, type Mic, type MicSource, type Tap } from './mic.ts';

/** The input id that is this device's synth. */
export const SYNTH_INPUT = 'synth';

/** The input id that is the sound a live correction gives back. */
export const CORRECTED_INPUT = 'corrected';

interface Inside {
  device: InputDevice;
  /** What the input calls itself once open. */
  label: string;
  /** Where the sound can be taken from, or undefined where there is none to take. */
  tap: () => Tap | undefined;
  /** What to tell the person when there is none. */
  missing: string;
}

/**
 * The inputs of `mic`, and one more that is a sound inside the page. The
 * page's audio context is made only when it is chosen, so listing the inputs
 * starts no audio.
 */
function withInside(mic: MicSource, inside: Inside): MicSource {
  return {
    async open(deviceId): Promise<Mic> {
      if (deviceId !== inside.device.id) return mic.open(deviceId);
      const tap = inside.tap();
      if (!tap) throw new Error(inside.missing);
      const analyser = tap.context.createAnalyser();
      tap.node.connect(analyser);
      await tap.context.resume();
      return listenThrough(analyser, tap.context.sampleRate, inside.label, () =>
        tap.node.disconnect(analyser),
      );
    },
    async devices() {
      return [...(await mic.devices()), inside.device];
    },
  };
}

/** The inputs of `mic`, and the synth as one more. */
export function withSynth(mic: MicSource, tap: () => Tap | undefined): MicSource {
  return withInside(mic, {
    device: { id: SYNTH_INPUT, label: 'This device’s synth (what it plays)' },
    label: 'This device’s synth',
    tap,
    missing: 'the synth has nothing to listen to',
  });
}

/** The inputs of `mic`, and the corrected sound as one more, there once a correction runs. */
export function withCorrected(mic: MicSource, tap: () => Tap | undefined): MicSource {
  return withInside(mic, {
    device: { id: CORRECTED_INPUT, label: 'The corrected sound (from the correction below)' },
    label: 'The corrected sound',
    tap,
    missing: 'nothing is being corrected yet: start the correction first',
  });
}
