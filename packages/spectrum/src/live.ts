/**
 * Live correction of a sound toward a scale (#298): a tracker that has only
 * the past reads its pitch, a corrector says how far to move it, and PSOLA
 * moves it. One call takes a block and gives a block, late by `latency`
 * samples, so an audio worklet is a few lines around it. Each part is
 * tested alone (`tracker.test.ts`, `corrector.test.ts`, `psola.test.ts`);
 * this is the chain, which `live.test.ts` runs on a wavering voice.
 */

import { Corrector, type CorrectorOptions } from './corrector.ts';
import { PsolaShifter } from './psola.ts';
import { PitchTracker } from './tracker.ts';

export interface LiveOptions extends Omit<CorrectorOptions, 'reference'> {
  sampleRate: number;
  /** The longest block it is given, in samples: 128 by default. */
  block?: number;
  /** The lowest pitch taken, in Hz: 70 by default. The latency grows as it falls. */
  minHz?: number;
  maxHz?: number;
  /** The samples the tracker reads its pitch from, and the samples between looks: 1024 and 256. */
  window?: number;
  hop?: number;
  reference?: number;
}

export class LiveCorrector {
  readonly corrector: Corrector;
  readonly #tracker: PitchTracker;
  readonly #shifter: PsolaShifter;
  readonly #sampleRate: number;
  /** The pitch the tracker last heard, in Hz, or undefined where there is none. */
  heard: number | undefined;

  constructor({
    sampleRate,
    block = 128,
    minHz = 70,
    maxHz = 1000,
    window,
    hop,
    ...correction
  }: LiveOptions) {
    this.#sampleRate = sampleRate;
    this.corrector = new Corrector(correction);
    this.#tracker = new PitchTracker({
      sampleRate,
      minHz,
      maxHz,
      ...(window === undefined ? {} : { window }),
      ...(hop === undefined ? {} : { hop }),
    });
    this.#shifter = new PsolaShifter({ sampleRate, minHz, maxHz, block });
  }

  /** How many samples late the sound comes out: the delay this adds to it. */
  get latency(): number {
    return this.#shifter.latency;
  }

  /** How far the sound is being moved, in cents. */
  get offsetCents(): number {
    return this.corrector.offset;
  }

  process(block: ArrayLike<number>): Float64Array {
    const estimate = this.#tracker.push(block);
    this.heard = estimate?.hz;
    const ratio = this.corrector.next(estimate?.hz, block.length / this.#sampleRate);
    // The estimate is of the sound half a window ago, and the shifter is told so.
    return this.#shifter.process(
      block,
      estimate ? this.#sampleRate / estimate.hz : Number.NaN,
      ratio,
      this.#tracker.window / 2,
    );
  }
}
