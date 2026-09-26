/**
 * Deterministic randomness.
 *
 * Every random choice in the engine draws from a generator keyed by the song
 * seed plus a path such as (part, section, step). The same key always gives
 * the same number, so a decision stays put while the style around it glides:
 * rhythms morph instead of reshuffling, and a song replays from its seed.
 */

export type Rng = () => number;

/** mulberry32: a small, fast 32-bit generator returning floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A generator for one key path. Keys are truncated to 32-bit integers. */
export function keyedRng(seed: number, ...keys: number[]): Rng {
  let h = seed >>> 0;
  for (const k of keys) h = Math.imul(h ^ (k | 0), 2654435761) >>> 0;
  return mulberry32(h);
}

/** The first draw of `keyedRng`, for one-off decisions. */
export function keyedRandom(seed: number, ...keys: number[]): number {
  return keyedRng(seed, ...keys)();
}

/**
 * The random streams. The first key of every draw names the decision it
 * makes, so no two decisions draw the same numbers by accident, and changing
 * how one decision draws leaves every other where it was. A new decision
 * gets a new stream here.
 */
export const STREAMS = {
  /** Which section follows, per section. */
  form: 1,
  /** Whether a drum sound plays on a step: fixed per section, so rhythms morph. */
  drumHit: 2,
  /** The variation of those thresholds on odd bars. */
  drumVariation: 3,
  /** The looseness of a drum hit's velocity. */
  drumVelocity: 4,
  /** The rotation of the Euclidean percussion, per section. */
  drumEuclid: 5,
  /** A theme's choices, in order, per section: vamp, degrees, secondaries. */
  theme: 6,
  /** Whether a returning theme is built anew all the same, per section. */
  themeRenewal: 7,
  /** Whether a chord takes its seventh, and its ninth, per theme, bar and slot. */
  chordColor: 8,
  /** Whether the bass plays on a step, and anticipates the next chord: fixed per section. */
  bassHit: 9,
  /** The variation of those thresholds on odd bars. */
  bassVariation: 10,
  /** Which note the bass plays: a walk's approach and tone, per bar; an octave or fifth, per section. */
  bassNote: 11,
} as const;

export type Stream = keyof typeof STREAMS;

/**
 * A draw in [0, 1) for one decision, keyed by the seed and its position. The
 * seed is mixed before the stream's id (a first key of 0), so two streams
 * only share their numbers across seeds that lie far apart at random, never
 * across neighbouring seeds as `seed ^ id` would.
 */
export function draw(seed: number, stream: Stream, ...keys: number[]): number {
  return keyedRandom(seed, 0, STREAMS[stream], ...keys);
}

/**
 * A part's draw for a step that holds for its whole section, so as the style
 * moves the part morphs rather than reshuffles (C4). On odd bars it moves a
 * little, the more the higher the entropy, so a groove is a loop with
 * variation. Kept inside (0, 1), so every p between 0 and 1 is heard.
 */
export function heldDraw(
  seed: number,
  [held, variation]: readonly [Stream, Stream],
  role: number,
  section: number,
  bar: number,
  step: number,
  entropy: number,
): number {
  let x = draw(seed, held, role, section, step);
  if (bar % 2 === 1) x += (draw(seed, variation, role, bar, step) - 0.5) * (0.12 + 0.4 * entropy);
  return Math.min(0.9999, Math.max(0.0001, x));
}

/**
 * The grid that probabilities and weights are rounded to before they meet a
 * draw. `+ − × ÷` give the same double on every JavaScript engine, but
 * `Math.pow`, `Math.sin` and their kin may differ in the last bit. Rounding to
 * this grid absorbs that difference, so the same seed composes the same music
 * on every device. The one exception is a value within the last bit of a
 * rounding boundary, which is rare but not impossible.
 */
export const QUANTUM = 2 ** -16;

/** x rounded to the nearest multiple of `QUANTUM`. */
export function quantize(x: number): number {
  return Math.round(x / QUANTUM) * QUANTUM;
}

/**
 * Whether a draw in [0, 1) falls below probability p. A p below 0 or above 1
 * is never or always; a p that is not a number is refused, since it would
 * silence a part without a word.
 */
export function chance(draw: number, p: number): boolean {
  if (!(draw >= 0 && draw < 1)) throw new Error(`chance: draw ${draw} is outside [0, 1)`);
  if (!Number.isFinite(p)) throw new Error(`chance: probability ${p} is not a finite number`);
  return draw < quantize(p);
}

/**
 * The index a draw in [0, 1) picks from weights: each index takes a share of
 * [0, 1) in proportion to its weight, in order. The weights are counted in
 * quanta first, so a weight below half a quantum is never picked.
 */
export function pick(draw: number, weights: readonly number[]): number {
  if (!(draw >= 0 && draw < 1)) throw new Error(`pick: draw ${draw} is outside [0, 1)`);
  const counts = weights.map((w) => {
    if (!(w >= 0 && Number.isFinite(w)))
      throw new Error(`pick: weight ${w} is negative or not finite`);
    return Math.round(w / QUANTUM);
  });
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) throw new Error('pick: the weights give nothing to pick');
  let left = Math.floor(draw * total);
  for (let i = 0; i < counts.length - 1; i++) {
    left -= counts[i]!;
    if (left < 0) return i;
  }
  return counts.length - 1;
}
