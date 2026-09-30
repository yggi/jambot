/**
 * Pitch-synchronous overlap-add, a block at a time (#298): the sound moved
 * up or down by a ratio without changing its speed, by repeating or dropping
 * whole periods of it. It is given the period of the sound (from a tracker,
 * `tracker.ts`) and the ratio to move it by, and returns as much as it was
 * given, late by its `latency`.
 *
 * Marks are laid a period apart on the input, each pulled to where the
 * surroundings look most like the last mark's; each output period is the
 * Hann-windowed two periods around the nearest mark, laid a period over the
 * ratio after the last, and the sum is divided by the ratio. The latency is
 * what makes it live: output is final only once no later pulse can reach it,
 * which is a period and a half of the lowest note on after the marks have
 * caught up, so `latency` is 3.25 periods of `minHz` and a block. In return, the ratio
 * a pulse uses is the one said of that very sound: the tracker and the
 * corrector say of each block what sound it is about (`lag`), and a pulse
 * finds what was said of its own moment, which the delay has let them reach.
 */

export interface PsolaOptions {
  sampleRate: number;
  /** The lowest pitch it is asked to take, in Hz: 70 by default. The latency grows as it falls. */
  minHz?: number;
  /** The highest, in Hz: 1000 by default. */
  maxHz?: number;
  /** The longest block it will be given, in samples: 128 by default, an audio worklet's. Part of the latency. */
  block?: number;
}

const RING = 16384;

export class PsolaShifter {
  /** How many samples late the output is. */
  readonly latency: number;
  readonly #minPeriod: number;
  readonly #maxPeriod: number;
  readonly #input = new Float64Array(RING);
  readonly #output = new Float64Array(RING);
  #n = 0;
  #emitted = 0;
  /** The marks, as absolute sample indices, and the period each was laid with. */
  #marks: number[] = [];
  #periods: number[] = [];
  #pointer = 0;
  #due = 0;
  #from = 0;
  #synthesis = Number.NaN;
  /** What the tracker and the corrector have said, each with the moment of sound it is about: the period and the ratio there. */
  #history: { at: number; period: number; ratio: number }[] = [];
  #default: number;

  constructor({ sampleRate, minHz = 70, maxHz = 1000, block = 128 }: PsolaOptions) {
    this.#maxPeriod = sampleRate / minHz;
    this.#minPeriod = sampleRate / maxHz;
    this.latency = Math.ceil(3.25 * this.#maxPeriod) + block;
    this.#default = sampleRate / 200;
  }

  /**
   * Take in a block of the input, with the period of the sound now (in
   * samples, NaN where there is none: the last is kept) and the ratio to move
   * it by, and give back a block of the same length: what went in, shifted,
   * `latency` samples ago.
   */
  process(block: ArrayLike<number>, period: number, ratio: number, lag = 0): Float64Array {
    for (let i = 0; i < block.length; i++) this.#input[(this.#n + i) % RING] = block[i]!;
    this.#n += block.length;
    const before = this.#history[this.#history.length - 1];
    this.#history.push({
      at: this.#n - lag,
      period:
        period > 0
          ? Math.min(this.#maxPeriod, Math.max(this.#minPeriod, period))
          : (before?.period ?? this.#default),
      ratio: ratio > 0 ? ratio : 1,
    });
    if (this.#history.length > 4096) this.#history.splice(0, 2048);
    this.#placeMarks();
    this.#synthesise();
    return this.#emit(block.length);
  }

  /** What was said about the sound at a moment: the newest of it that is not about a later one. */
  #said(time: number): { period: number; ratio: number } {
    const history = this.#history;
    let lo = 0;
    let hi = history.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (history[mid]!.at <= time) lo = mid;
      else hi = mid - 1;
    }
    return history[lo] ?? { period: this.#default, ratio: 1 };
  }

  #at(index: number): number {
    return this.#input[((index % RING) + RING) % RING]!;
  }

  /**
   * Lay every mark there are samples enough to place. The first is the largest
   * sample of the first period; each next is found by laying the last mark's
   * surroundings against the sound a period on, and is where they look most
   * alike, to a fraction of a sample (a parabola through the likeness of the
   * three nearest whole samples). So the spacing of the marks is the period
   * of the sound itself, whatever the tracker's estimate of it is, and the
   * estimate only says where to look.
   */
  #placeMarks(): void {
    for (;;) {
      const estimate = this.#said(this.#marks.length === 0 ? this.#from : this.#due).period;
      const half = Math.max(2, Math.round(estimate / 2));
      if (this.#marks.length === 0) {
        if (this.#n < this.#from + Math.ceil(1.25 * estimate)) return;
        let best = this.#from;
        for (let i = this.#from; i < this.#from + Math.round(estimate); i++)
          if (this.#at(i) > this.#at(best)) best = i;
        this.#push(best, estimate);
        this.#due = best;
        this.#synthesis = best;
        continue;
      }
      const reach = Math.max(2, Math.floor(estimate / 4));
      const last = this.#marks[this.#marks.length - 1]!;
      const reference = Math.round(last);
      const centre = Math.round(last + estimate);
      if (this.#n <= centre + reach + half + 1) return;
      const score = (i: number) => {
        let dot = 0;
        let own = 1e-12;
        let other = 1e-12;
        for (let k = -half; k <= half; k++) {
          const a = this.#at(reference + k);
          const b = this.#at(i + k);
          dot += a * b;
          own += a * a;
          other += b * b;
        }
        return dot / Math.sqrt(own * other);
      };
      let best = centre;
      let bestScore = -Infinity;
      const scores = new Map<number, number>();
      for (let i = centre - reach; i <= centre + reach; i++) {
        const value = score(i);
        scores.set(i, value);
        if (value > bestScore) [bestScore, best] = [value, i];
      }
      const before = scores.get(best - 1);
      const after = scores.get(best + 1);
      let refined = best;
      if (before !== undefined && after !== undefined) {
        const curve = before - 2 * bestScore + after;
        if (curve < 0)
          refined = best + Math.max(-0.5, Math.min(0.5, (0.5 * (before - after)) / curve));
      }
      const period = refined - reference;
      this.#push(last + period, period);
    }
  }

  #push(mark: number, period: number): void {
    this.#marks.push(mark);
    this.#periods.push(period);
    if (this.#marks.length > 512) {
      this.#marks.splice(0, 256);
      this.#periods.splice(0, 256);
      this.#pointer = Math.max(0, this.#pointer - 256);
    }
  }

  /** The input at a place between samples, by linear interpolation. */
  #between(position: number): number {
    const whole = Math.floor(position);
    const fraction = position - whole;
    return (1 - fraction) * this.#at(whole) + fraction * this.#at(whole + 1);
  }

  /** Lay every pulse that can still reach sound that is not yet final. */
  #synthesise(): void {
    if (this.#marks.length === 0) return;
    const horizon = this.#n - this.latency;
    for (;;) {
      const ts = this.#synthesis;
      const last = this.#marks[this.#marks.length - 1]!;
      // The nearest mark, once the marks reach half a period past where the pulse goes.
      while (
        this.#pointer + 1 < this.#marks.length &&
        Math.abs(this.#marks[this.#pointer + 1]! - ts) <= Math.abs(this.#marks[this.#pointer]! - ts)
      )
        this.#pointer++;
      const mark = this.#marks[this.#pointer]!;
      const period = this.#periods[this.#pointer]!;
      if (ts > horizon + period || last < ts + period / 2 || mark + period + 1 >= this.#n) return;
      const ratio = this.#said(ts).ratio;
      const width = Math.max(3, period);
      // Every output sample the pulse reaches takes the sound at the same distance from the mark
      // as it is from the pulse, between samples, and the window's weight at that distance.
      for (let target = Math.ceil(ts - width); target <= Math.floor(ts + width); target++) {
        if (target < this.#emitted) continue;
        const distance = target - ts;
        const window = 0.5 + 0.5 * Math.cos((Math.PI * distance) / width);
        this.#output[((target % RING) + RING) % RING]! +=
          (this.#between(mark + distance) * window) / ratio;
      }
      this.#synthesis += period / ratio;
    }
  }

  /** The next `length` samples that are final. */
  #emit(length: number): Float64Array {
    const out = new Float64Array(length);
    const from = this.#n - length - this.latency;
    for (let i = 0; i < length; i++) {
      const at = from + i;
      if (at < 0) continue;
      const slot = ((at % RING) + RING) % RING;
      out[i] = this.#output[slot]!;
      this.#output[slot] = 0;
    }
    this.#emitted = this.#n - this.latency;
    return out;
  }
}
