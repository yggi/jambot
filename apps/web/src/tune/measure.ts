/**
 * What a live correction costs on a device, measured by rendering a probe
 * through its worklet off-line (`LiveCorrection.measure`): how long a sound
 * takes to come out, and where its pitch comes out. `probeSignal` makes the
 * probe and `assess` reads what came back; the rendering is the browser's.
 */

import { estimatePitch } from '@jambot/spectrum';

export interface Probe {
  signal: Float32Array<ArrayBuffer>;
  /** How many samples of silence come first: the sound starts here. */
  silence: number;
}

/** A quarter of a second of silence, and then a sine at `hz` to the end, at 0.5. */
export function probeSignal({
  sampleRate,
  seconds,
  hz,
}: {
  sampleRate: number;
  seconds: number;
  hz: number;
}): Probe {
  const length = Math.round(seconds * sampleRate);
  const silence = Math.round(sampleRate / 4);
  const signal = new Float32Array(length);
  for (let i = silence; i < length; i++)
    signal[i] = 0.5 * Math.sin((2 * Math.PI * hz * (i - silence)) / sampleRate);
  return { signal, silence };
}

export interface Assessment {
  /** How late the sound starts, in milliseconds; null where nothing comes out. */
  delayMs: number | null;
  /** The pitch it settles at, in Hz; null where there is none. */
  heardHz: number | null;
  /** How far that is from the target, in cents; null where there is no pitch. */
  errorCents: number | null;
}

/** Read what a probe came back as: when it started, and the pitch it settled at, over a stretch from a second in to a third of a second on. */
export function assess(
  rendered: Float32Array,
  { sampleRate, silence, targetHz }: { sampleRate: number; silence: number; targetHz: number },
): Assessment {
  let onset = -1;
  for (let i = 0; i < rendered.length; i++)
    if (Math.abs(rendered[i]!) > 0.1) {
      onset = i;
      break;
    }
  const from = Math.round(silence + sampleRate);
  const found =
    rendered.length >= from + 8192
      ? estimatePitch(rendered.subarray(from, from + 8192), sampleRate)
      : undefined;
  return {
    delayMs: onset < 0 ? null : ((onset - silence) / sampleRate) * 1000,
    heardHz: found?.hz ?? null,
    errorCents: found ? 1200 * Math.log2(found.hz / targetHz) : null,
  };
}
