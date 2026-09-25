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
