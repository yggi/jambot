/**
 * The helix: a spiral staircase of degrees.
 *
 * Its steps are the degrees, counted 0, 1, 2, … and on across turns, and each
 * stands at a height. k degrees up is one turn up, and one turn is `cycle`
 * heights. Seen from above the helix is the circle: every turn stands on the
 * same k positions (pitch classes, or steps of a bar). Seen from the side it is
 * a staircase that climbs without end (MIDI notes, or steps of a song).
 *
 * A helix is stored as one turn: the heights of degrees 0 to k − 1, rising,
 * with degree 0 wherever it stands. The circle loses which position is degree
 * 0, so the heights are what is stored and the positions are derived.
 */

export interface Helix {
  /** The height of one turn: 12 semitones, 16 steps. */
  readonly cycle: number;
  /** The heights of degrees 0 to k − 1, rising, within one turn. */
  readonly heights: readonly number[];
}

/** Where degree d stands, counted on across turns in both directions. */
export function heightOf(helix: Helix, degree: number): number {
  const k = helix.heights.length;
  return helix.cycle * Math.floor(degree / k) + helix.heights[mod(degree, k)]!;
}

/** The highest degree whose height is at most `height`. */
export function degreeBelow(helix: Helix, height: number): number {
  const { cycle, heights } = helix;
  const turn = Math.floor((height - heights[0]!) / cycle);
  const within = height - turn * cycle;
  return heights.length * turn + heights.filter((x) => x <= within).length - 1;
}

/** The lowest degree whose height is at least `height`. */
export function degreeAbove(helix: Helix, height: number): number {
  return degreeBelow(helix, height - 1) + 1;
}

/** The degree nearest to `height`: the one below or the one above, ties going down. */
export function snap(helix: Helix, height: number): number {
  const below = degreeBelow(helix, height);
  const above = degreeAbove(helix, height);
  return height - heightOf(helix, below) <= heightOf(helix, above) - height ? below : above;
}

/** A height's position on the circle: the height with its turn forgotten. */
export function wrap(height: number, cycle: number): number {
  return mod(height, cycle);
}

/**
 * The height with this position that is nearest to `near`, ties going down:
 * `wrap` undone by a choice of turn, as "the nearest octave" chooses.
 */
export function lift(position: number, cycle: number, near: number): number {
  const below = near - mod(near - position, cycle);
  return near - below <= below + cycle - near ? below : below + cycle;
}

/** The helix seen from above: its positions on the circle, sorted. */
export function positions(helix: Helix): number[] {
  return helix.heights.map((x) => wrap(x, helix.cycle)).sort((a, b) => a - b);
}

/** Every height moved by `by`, the degrees kept: a transposition. */
export function shift(helix: Helix, by: number): Helix {
  return { cycle: helix.cycle, heights: helix.heights.map((x) => x + by) };
}

/** The distance from each degree to the next, the last one wrapping to the next turn. */
export function gaps(helix: Helix): number[] {
  return helix.heights.map((_, d) => heightOf(helix, d + 1) - heightOf(helix, d));
}

/**
 * A helix on the degrees of another: inner degree e stands at the outer
 * helix's degree `heightOf(inner, e)`. A triad on a key, the beats on the
 * steps of a bar. The inner cycle must be the number of outer degrees.
 */
export function compose(inner: Helix, outer: Helix): Helix {
  if (inner.cycle !== outer.heights.length)
    throw new Error(
      `compose: the inner helix has cycle ${inner.cycle}, but the outer has ${outer.heights.length} degrees`,
    );
  return { cycle: outer.cycle, heights: inner.heights.map((e) => heightOf(outer, e)) };
}

/**
 * The helix reflected about `axis`, a height or halfway between two: every
 * height x goes to 2 · axis − x, and degree d stands where degree −d went, so
 * degree 0 stays degree 0 and the gaps come in reverse order. The axis is
 * degree 0 unless given: then ionian and phrygian are mirror images, and a
 * major triad mirrors to a minor one below it. About the tonic and its fifth,
 * `mirror(helix, tonic + 3.5)`, it is quintenzirkel's mirror: ionian and
 * aeolian, and a major triad and the minor one on the same root.
 */
export function mirror(helix: Helix, axis = helix.heights[0] ?? 0): Helix {
  if (!Number.isInteger(2 * axis))
    throw new Error(`mirror: the axis ${axis} is neither on a height nor halfway between two`);
  return {
    cycle: helix.cycle,
    heights: helix.heights.map((_, d) => 2 * axis - heightOf(helix, -d)),
  };
}

/**
 * The positions the helix leaves out, from its degree 0 upward. The black
 * keys are the complement of C major.
 */
export function complement(helix: Helix): Helix {
  const start = helix.heights[0] ?? 0;
  const taken = new Set(positions(helix));
  const heights: number[] = [];
  for (let x = start; x < start + helix.cycle; x++) {
    if (!taken.has(wrap(x, helix.cycle))) heights.push(x);
  }
  return { cycle: helix.cycle, heights };
}

/** x modulo n, never negative. */
export function mod(x: number, n: number): number {
  return ((x % n) + n) % n;
}
