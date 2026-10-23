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

/**
 * A key for a draw from a name: FNV-1a over its UTF-16 code units, a 32-bit
 * integer, so a decision about a fragment of the repository can be keyed by
 * its id (#414: which variation the composer makes of a seed rhythm).
 */
export function nameKey(name: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193);
  return h >>> 0;
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
  /** Whether the comp pads a chord or stabs on a step: fixed per section. */
  compHit: 12,
  /** The variation of those thresholds on odd bars. */
  compVariation: 13,
  /** Where a lead shape plays, per section, half and step. */
  leadRhythm: 14,
  /** A lead shape's contour and its steps, in order, per section and half. */
  leadShape: 15,
  /** How a lead shape is varied, in order, per bar. */
  leadVariation: 16,
  /** The looseness of a bass note's velocity. */
  bassVelocity: 17,
  /** The looseness of a pad note's velocity. */
  padVelocity: 18,
  /** The looseness of a stab's velocity. */
  stabVelocity: 19,
  /** The looseness of a lead note's velocity. */
  leadVelocity: 20,
  /** The looseness of a drum hit's length. */
  drumLength: 21,
  /** The looseness of a bass note's length. */
  bassLength: 22,
  /** The looseness of a pad note's length. */
  padLength: 23,
  /** The looseness of a stab's length. */
  stabLength: 24,
  /** The looseness of a lead note's length. */
  leadLength: 25,
  /** Whether the band moves the key itself, and where to, per section (#169). */
  keyJump: 26,
  /** The performer's own accent on a note, per part, bar and step (#170). */
  ownAccent: 27,
  /** Whether the lead varies an offer it plays once more, per bar (#237). */
  offerVariation: 28,
  /** The radio's walk: one step per section and axis (#313). */
  radio: 29,
  /** Which variation the composer makes of a rhythm it tires of, per rhythm: a groove filed by its place in the layer (#411), a seed rhythm by its id (#414, `nameKey`). */
  grooveVariation: 30,
  /** Which variation the composer makes of a bass line it tires of, per line: one filed by its place among the layer's lines, a seed line by its id (#423). */
  lineVariation: 31,
  /** Which variation the composer makes of a lead line it tires of, per line: by its place among the layer's lead lines (#424). */
  leadLineVariation: 32,
  /** Which variation the composer makes of a progression it tires of (#425): none drawn yet, since cells has no operators on a harmony (yggi/cells#208). */
  harmonyVariation: 33,
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
