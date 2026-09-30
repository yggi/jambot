/**
 * A microphone and a look at its sound, driven by hand, for the tuner's
 * tests and the screen's: the microphone hears whatever `heard.signal` is,
 * its newest samples last, and every look is kept. Only tests import it.
 */

import { analyse, sine } from '@jambot/spectrum';
import type { Analyse } from './analysis.ts';
import type { Mic, MicSource } from './mic.ts';

export const sampleRate = 48000;

/** A microphone that hears whatever `heard.signal` is, its newest samples last. */
export function world() {
  const heard = { signal: new Float64Array(16384) as ArrayLike<number> };
  const log = { opened: [] as (string | undefined)[], stopped: 0, asked: [] as number[] };
  const mic: Mic = {
    sampleRate,
    label: 'Test input',
    latest(count) {
      log.asked.push(count);
      return Float32Array.from(Array.prototype.slice.call(heard.signal, -count) as number[]);
    },
    stop: () => void log.stopped++,
  };
  const source: MicSource = {
    open: (id) => {
      log.opened.push(id);
      return Promise.resolve(mic);
    },
    devices: () => Promise.resolve([{ id: 'a', label: 'Built-in' }]),
  };
  const analysed: number[] = [];
  const analyseHere: Analyse = (samples, rate) => {
    analysed.push(samples.length);
    return Promise.resolve(analyse(samples, rate));
  };
  return { heard, log, source, analysed, analyseHere, mic };
}

/** A sine a little louder than a whisper, at `hz` and then `cents` sharp of it. */
export const tone = (hz: number, cents = 0) =>
  sine(hz * 2 ** (cents / 1200), 16384, sampleRate, { amplitude: 0.5 });
