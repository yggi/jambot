/**
 * Motifs and the operators on them (Q5c; #7's decision (d), open).
 *
 * A motif is a rhythm and a contour: the steps of a bar its notes start on,
 * and each note's degree of the key, counted from the motif's reference. A
 * note is held to the next, and the last to the first of the next time the
 * motif sounds, so the notes go round the bar as arcs.
 *
 * The operators are the theory's own, `shift` (T) and `mirror` (I), on two
 * axes:
 *
 * - on pitch, T is a sequence, the contour moved by some degrees, and I an
 *   inversion about the reference;
 * - on time, T is a displacement, the arcs moved round the bar, and I the
 *   retrograde, the arcs reflected about the bar's start.
 *
 * On each axis they make an affine map, x ↦ a ± x, so any chain of them is
 * one operator, `{ seq, inv, shift, retro }`: a sequence of an inversion on
 * pitch, and a displacement of a retrograde on time. They form a group, the
 * infinite dihedral group on pitch times the dihedral group of the bar, and
 * the operator record is each element's one written form. A fragment, the
 * first notes of a motif, loses the rest, so fragments form a monoid beside
 * the group.
 */

import { mod } from './helix.ts';

export interface Motif {
  /** The steps of a bar: 16. */
  readonly span: number;
  /** The step each note starts on, rising, within the bar. */
  readonly steps: readonly number[];
  /** Each note's degree of the key, counted from the motif's reference. */
  readonly degrees: readonly number[];
}

/**
 * An operator: on pitch, degree d goes to `seq ± d` (minus if `inv`); on
 * time, the arc from step s to step e goes to `shift + s` to `shift + e`,
 * or, if `retro`, to `shift − e` to `shift − s`, round the bar.
 */
export interface MotifOp {
  readonly seq: number;
  readonly inv: boolean;
  readonly shift: number;
  readonly retro: boolean;
}

export const IDENTITY: MotifOp = { seq: 0, inv: false, shift: 0, retro: false };

/** A sequence: the contour moved by `degrees`. */
export const seq = (degrees: number): MotifOp => ({ ...IDENTITY, seq: degrees });
/** An inversion about the motif's reference. */
export const inv = (): MotifOp => ({ ...IDENTITY, inv: true });
/** A displacement: the notes moved round the bar by `steps`. */
export const displace = (steps: number): MotifOp => ({ ...IDENTITY, shift: steps });
/** The retrograde: the notes reflected about the bar's start, so they run backwards. */
export const retro = (): MotifOp => ({ ...IDENTITY, retro: true });

/** A motif under an operator. */
export function applyOp(op: MotifOp, motif: Motif): Motif {
  const { span, steps, degrees } = motif;
  const notes = steps.map((start, i) => {
    const end = steps[i + 1] ?? steps[0]! + span;
    const onset = op.retro ? op.shift - end : op.shift + start;
    return {
      step: mod(onset, span),
      degree: op.seq + (op.inv ? -degrees[i]! : degrees[i]!),
    };
  });
  notes.sort((a, b) => a.step - b.step);
  return { span, steps: notes.map((n) => n.step), degrees: notes.map((n) => n.degree) };
}

/** One operator for `first` and then `second`. */
export function thenOp(first: MotifOp, second: MotifOp): MotifOp {
  const pitch = second.inv ? -1 : 1;
  const time = second.retro ? -1 : 1;
  return {
    seq: second.seq + pitch * first.seq,
    inv: first.inv !== second.inv,
    shift: second.shift + time * first.shift,
    retro: first.retro !== second.retro,
  };
}

/** The operator that undoes `op` on a bar of `span` steps. */
export function inverseOp(op: MotifOp, span: number): MotifOp {
  return {
    seq: op.inv ? op.seq : -op.seq,
    inv: op.inv,
    shift: mod(op.retro ? op.shift : -op.shift, span),
    retro: op.retro,
  };
}

/** The first `count` notes of a motif. */
export function fragment(motif: Motif, count: number): Motif {
  return {
    span: motif.span,
    steps: motif.steps.slice(0, count),
    degrees: motif.degrees.slice(0, count),
  };
}
