/**
 * Motifs and the operators on them (Q5c, U4, U5; #7's decision (d)).
 *
 * A motif is a rhythm and a contour on its own cycle: the onsets of its
 * notes and rests, and each note's degree of the key, counted from the
 * motif's origin and altered by a number of chromatic steps, as `b3` is
 * (U2). Each note or rest is held to the next onset, and the last to the
 * first of the next time the motif sounds, so the onsets go round the
 * cycle as arcs. A rest is an arc of silence, which is how a motif holds a
 * staccato or a note dropped.
 *
 * The operators are the theory's own `shift` (T) and `mirror` (I), on two
 * axes:
 *
 * - on pitch, T is `strans`, the contour moved by some degrees, and I is
 *   `mirror`, the contour reflected about the origin, its alterations too;
 * - on time, T is `late`, the arcs moved round the cycle, and I is `rev`,
 *   the arcs reflected about the origin, so the motif runs backwards.
 *
 * `strans`, `late` and `rev` are Strudel's names for the same operations
 * (`scaleTranspose`, `late` and `rev`). On each axis they make an affine
 * map, x ↦ a ± x, so any chain of them is one operator,
 * `{ strans, mirror, late, rev }`: an element of the infinite dihedral group
 * on pitch times the dihedral group of the cycle. `head` keeps the first
 * notes and leaves a rest for the others, so heads form a monoid beside the
 * group, and the last notes are its mirror image under `rev`.
 *
 * Where a motif has a symmetry, several operators give one result.
 * `canonicalOp` writes each result with one of them, the least, so an
 * operator read back from what it made is a fixed point (F3).
 */

import { type Helix, mod } from './helix.ts';

export interface Motif {
  /** The steps of the cycle: 16 for a bar. */
  readonly cycle: number;
  /** The step each note or rest starts on, rising, within the cycle. */
  readonly onsets: readonly number[];
  /** Each note's degree of the key, counted from the origin; `null` for a rest. */
  readonly degrees: readonly (number | null)[];
  /** Each note's alteration, in chromatic steps of the key (U2): −1 for `b`, 0 for a rest. */
  readonly accidentals: readonly number[];
}

/**
 * An operator: on pitch, degree d goes to `strans ± d` and its accidental
 * a to `±a` (minus if `mirror`); on time, the arc from step s to step e
 * goes to `late + s` to `late + e`, or, if `rev`, to `late − e` to
 * `late − s`, round the cycle.
 */
export interface MotifOp {
  readonly strans: number;
  readonly mirror: boolean;
  readonly late: number;
  readonly rev: boolean;
}

/** The operator that changes nothing. */
export const NOOP: MotifOp = { strans: 0, mirror: false, late: 0, rev: false };

/** The motif's onsets as a helix of its cycle, whose `gaps` are its arcs' lengths. */
export function rhythmOf(motif: Motif): Helix {
  return { cycle: motif.cycle, heights: motif.onsets };
}

/** The steps from each note's degree to the next note's, the last to the first: the contour as edges. */
export function motion(motif: Motif): number[] {
  const notes = motif.degrees.filter((d) => d !== null);
  return notes.map((d, j) => notes[(j + 1) % notes.length]! - d);
}

/** What is wrong with a motif, if anything. */
export function motifProblems(motif: Motif): string[] {
  const { cycle, onsets, degrees, accidentals } = motif;
  const problems: string[] = [];
  if (onsets.length !== degrees.length || onsets.length !== accidentals.length)
    problems.push('onsets, degrees and accidentals differ in length');
  if (onsets.some((s, i) => s < 0 || s >= cycle || (i > 0 && s <= onsets[i - 1]!)))
    problems.push('the onsets do not rise within the cycle');
  if (!degrees.some((d) => d !== null)) problems.push('there is no note');
  if (degrees.some((d, i) => d === null && degrees[(i + 1) % degrees.length] === null))
    problems.push('two rests follow each other');
  if (degrees.some((d, i) => d === null && accidentals[i] !== 0))
    problems.push('a rest is altered');
  return problems;
}

/** A motif under an operator. */
export function applyOp(op: MotifOp, motif: Motif): Motif {
  const { cycle, onsets, degrees, accidentals } = motif;
  const arcs = onsets.map((start, i) => {
    const end = onsets[i + 1] ?? onsets[0]! + cycle;
    const degree = degrees[i]!;
    return {
      onset: mod(op.rev ? op.late - end : op.late + start, cycle),
      degree: degree === null ? null : op.strans + (op.mirror ? -degree : degree),
      // 0 − a, not −a: a natural stays 0, never −0.
      accidental: op.mirror ? 0 - accidentals[i]! : accidentals[i]!,
    };
  });
  arcs.sort((a, b) => a.onset - b.onset);
  return {
    cycle,
    onsets: arcs.map((a) => a.onset),
    degrees: arcs.map((a) => a.degree),
    accidentals: arcs.map((a) => a.accidental),
  };
}

/** One operator for `first`, then `second`. */
export function thenOp(first: MotifOp, second: MotifOp): MotifOp {
  const pitch = second.mirror ? -1 : 1;
  const time = second.rev ? -1 : 1;
  return {
    strans: second.strans + pitch * first.strans,
    mirror: first.mirror !== second.mirror,
    late: second.late + time * first.late,
    rev: first.rev !== second.rev,
  };
}

/** The operator that undoes `op`. */
export function undo(op: MotifOp): MotifOp {
  return {
    strans: op.mirror ? op.strans : 0 - op.strans,
    mirror: op.mirror,
    late: op.rev ? op.late : 0 - op.late,
    rev: op.rev,
  };
}

/**
 * The first `count` notes of a motif, and a rest from the next onset to the
 * end of the cycle for the notes dropped. A rest that follows another joins
 * it, round the cycle.
 */
export function head(motif: Motif, count: number): Motif {
  if (count < 1) throw new Error('head: a motif keeps at least one note');
  const { cycle, onsets, degrees, accidentals } = motif;
  let notes = 0;
  const kept = onsets.findIndex((_, i) => degrees[i] !== null && ++notes === count);
  if (kept === -1 || kept === onsets.length - 1) return motif;
  const take = kept + 1;
  let o = [...onsets.slice(0, take), onsets[take]!];
  let d: (number | null)[] = [...degrees.slice(0, take), null];
  let a = [...accidentals.slice(0, take), 0];
  // The rest now runs on into the next time round, so a rest at the start joins it.
  if (d[0] === null) {
    o = o.slice(1);
    d = d.slice(1);
    a = a.slice(1);
  }
  return { cycle, onsets: o, degrees: d, accidentals: a };
}

/** The operators that leave the motif as it is: finite, as the motif has a note. */
export function stabilizer(motif: Motif): MotifOp[] {
  const found: MotifOp[] = [];
  const text = (m: Motif) => `${m.onsets}|${m.degrees.map((d) => d !== null)}|${m.accidentals}`;
  const { degrees } = motif;
  const note = degrees.findIndex((d) => d !== null);
  for (const rev of [false, true])
    for (const mirror of [false, true])
      for (let late = 0; late < motif.cycle; late++) {
        const moved = applyOp({ strans: 0, mirror, late, rev }, motif);
        if (text(moved) !== text(motif)) continue;
        // The onsets and rests agree, so the degrees must differ by one sequence.
        const strans = degrees[note]! - moved.degrees[note]!;
        if (moved.degrees.every((d, i) => d === null || d + strans === degrees[i]))
          found.push({ strans, mirror, late, rev });
      }
  return found;
}

/**
 * The operator that writes what `op` makes of `motif`: of all operators that
 * give the same motif, the one with the least `rev`, then `mirror`, then
 * `late` round the cycle. Those operators are `op` after the motif's
 * symmetries, and no two of them share all three, so the choice is one
 * operator, and choosing again changes nothing.
 */
export function canonicalOp(op: MotifOp, motif: Motif): MotifOp {
  const rank = (o: MotifOp) => (Number(o.rev) * 2 + Number(o.mirror)) * motif.cycle + o.late;
  let best: MotifOp | undefined;
  for (const symmetry of stabilizer(motif)) {
    const same = thenOp(symmetry, op);
    const reduced = { ...same, late: mod(same.late, motif.cycle) };
    if (!best || rank(reduced) < rank(best)) best = reduced;
  }
  return best!;
}
