/**
 * How loud a frame is: its rms, its peak and its level in decibels below full
 * scale (a sample of 1), for a meter and to tell sound from silence.
 */

/** A frame's loudness. */
export interface Level {
  rms: number;
  /** The largest absolute sample. */
  peak: number;
  /** 20 · log10(rms): 0 for a full-scale square, −Infinity for silence. */
  db: number;
}

/** The root mean square of a signal, 0 for none. */
export function rms(signal: ArrayLike<number>): number {
  if (signal.length === 0) return 0;
  let squares = 0;
  for (let i = 0; i < signal.length; i++) squares += signal[i]! * signal[i]!;
  return Math.sqrt(squares / signal.length);
}

export function levelOf(signal: ArrayLike<number>): Level {
  let peak = 0;
  for (let i = 0; i < signal.length; i++) peak = Math.max(peak, Math.abs(signal[i]!));
  const r = rms(signal);
  return { rms: r, peak, db: r > 0 ? 20 * Math.log10(r) : -Infinity };
}
