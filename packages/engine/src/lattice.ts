/**
 * Note values: the lattice a phrase's onsets sit on (#204, H2 and H3).
 *
 * A hand puts an onset a fraction of a step from where it meant, and the
 * nearest step is right only while the hand is within half a step. But a
 * phrase of eighth notes has no onsets on odd steps, and a hand that keeps
 * to that can be a whole step off and still be read right. So the reader
 * asks what note value the onsets sit on, a lattice `k·value` of a
 * sixteenth, an eighth, a quarter or a half, and snaps them to it.
 *
 * - **H2, the note value:** notes of about equal length are equal. The
 *   value of the phrase is the lattice its onsets fit at the least cost: a
 *   description of where each is (one of a bar's `16 / value` places, in
 *   nats) and how far it is from the place (the hand's looseness, a normal
 *   spread, the one looseness for every lattice). A finer lattice always
 *   fits closer and costs more places, so a coarser one is preferred
 *   whenever the onsets sit on it.
 * - **H3, the hierarchy:** several lengths show their order by their
 *   ratios, two eighths in a quarter. The lattices are nested, so every
 *   onset of a longer note is a place of the finer lattice that the
 *   shorter notes ask for: one lattice holds the hierarchy. Letting each
 *   beat take a lattice of its own, nested in the phrase's, was measured
 *   and made the reading worse, on phrases of one value and on beats that
 *   divide by themselves alike (E17), so it is not done.
 *
 * Every cost is a sum of constants and squares, so no transcendental
 * function decides a step (#45).
 */

/** Note values a lattice can be, in steps, coarse to fine: a half, a quarter, an eighth, a sixteenth. */
export const VALUES = [8, 4, 2, 1] as const;

/** How many halvings a value is from a bar of 16 steps: the bits of the place it names. */
const HALVINGS: Readonly<Record<number, number>> = { 8: 1, 4: 2, 2: 3, 1: 4 };

/** The least looseness of a hand, in steps: an exact hand is not exact to the step. */
export const LOOSENESS_FLOOR = 0.08;

/** The distance from a position to the lattice `k·value`, whose places are the bar's own: a bar starts on a place of every value. */
export function distance(x: number, value: number): number {
  return Math.abs(x - value * Math.round(x / value));
}

/**
 * How far apart two onsets are, in steps, at least, if they are two notes:
 * a lattice that puts two onsets that far apart on one place is not the
 * note value they were played in (a chord's notes are struck together, not
 * a step apart).
 */
export const MERGE_LIMIT = 0.75;

/**
 * What describing `xs` (in time order) on a lattice costs, in nats: a place
 * of the bar each, and how far each is from its place. Infinite where two
 * onsets `MERGE_LIMIT` apart or more would share a place.
 */
function cost(xs: readonly number[], value: number, looseness: number): number {
  let total = 0;
  xs.forEach((x, i) => {
    total += HALVINGS[value]! * Math.LN2 + distance(x, value) ** 2 / (2 * looseness ** 2);
    if (
      i > 0 &&
      Math.round(x / value) === Math.round(xs[i - 1]! / value) &&
      x - xs[i - 1]! >= MERGE_LIMIT
    )
      total = Infinity;
  });
  return total;
}

/**
 * The value of a phrase: the lattice its onsets fit at the least cost, the
 * coarser where two cost the same, and the finest where every one is ruled
 * out.
 */
export function valueOf(xs: readonly number[], looseness: number): number {
  let chosen: number = VALUES.at(-1)!;
  let least = Infinity;
  for (const value of VALUES) {
    const c = cost(xs, value, looseness);
    if (c < least) {
      chosen = value;
      least = c;
    }
  }
  return chosen;
}

/**
 * Where onsets sit on their lattice, in steps, for positions `xs` in time
 * order whose first is the phrase's start, which stays at `start`. Positions
 * are as the hand played them, less the phrase's offset; the first is not
 * weighed, since the phrase's start is decided elsewhere (the beat), and
 * may be off the lattice the rest sits on. A lattice's places are the
 * bar's own, since the player is aiming at the band's grid.
 */
export function snapToValues(xs: readonly number[], start: number, looseness: number): number[] {
  if (xs.length === 0) return [];
  const rest = xs.slice(1);
  const value = valueOf(rest, looseness);
  return [start, ...rest.map((x) => value * Math.round(x / value))];
}
