/**
 * A fading memory (#210): weights over an alphabet, faded each time a
 * reading is folded in, and a lean toward where they weigh most.
 *
 * It is the remember and lean of the loop every level may run (hold, fill,
 * read, remember, lean; C9). The harmonic history (`history.ts`) is its
 * first instance: pitch classes are the alphabet, a bar's chords the
 * readings. A reading held every fold settles at the reading times the time
 * constant, 1 / (1 − decay), and a memory left alone fades to nothing.
 * It also forgets where it started: fed the same readings, two memories
 * draw together by the decay each fold, so one folded from a late start
 * needs no snapshot to come to the other.
 *
 * The lean comes in two forms, and both are here: the centre, the candidate
 * that weighs most (where the band has been), and a
 * draw by weight to a power (the band's own drift, `bandWish`). The centre
 * is the draw's limit as the power grows. `timeConstant` also reads a
 * series that keeps a share of itself a step later as a memory of that
 * decay: E30 reads the radio's walk so (`radio.ts`, #313), which has no
 * memory of its own.
 */

/** One weight per letter of the alphabet; never negative. */
export type Weights = readonly number[];

/** A reading: a letter, by its index, and how much it adds. */
type Reading = readonly [index: number, amount: number];

/** How many folds a memory remembers: a reading held every fold settles at it times this. */
export function timeConstant(decay: number): number {
  return 1 / (1 - decay);
}

/** The memory a fold later: every weight faded by `decay`, then each reading added, in order. */
export function fold(memory: Weights, decay: number, readings: Iterable<Reading>): Weights {
  const weights = memory.map((w) => w * decay);
  for (const [index, amount] of readings) weights[index]! += amount;
  return weights;
}

/** The first of `candidates` that weighs most. */
export function centreOf<T>(candidates: readonly T[], weigh: (candidate: T) => number): T {
  let best = candidates[0] as T;
  let most = weigh(best);
  for (const candidate of candidates.slice(1)) {
    const weight = weigh(candidate);
    if (weight > most) [best, most] = [candidate, weight];
  }
  return best;
}

/**
 * Each weight against the most, to the power `sharpness`: the odds of a
 * draw that leans toward the centre, evenly at 0 and ever more sharply
 * above it. Where nothing weighs, every candidate is as likely.
 */
export function leaning(weights: Weights, sharpness: number): number[] {
  const most = Math.max(...weights);
  return most > 0 ? weights.map((w) => (w / most) ** sharpness) : weights.map(() => 1);
}
