/**
 * Motifs and the operators on them (Q5c, U4, U5; #7's decision (d)).
 *
 * A motif is a rhythm and a contour on its own cycle: the onsets of its
 * notes and rests, and each note's degree of the key, counted from the
 * motif's origin and altered by a number of chromatic steps, as `b3` is
 * (U2). Each note or rest is held to the next onset, and the last to the
 * first of the next time the motif sounds, so the onsets go round the
 * cycle as arcs. A rest is an arc of silence, which is how a motif holds a
 * staccato or a note dropped. A motif may carry accents: each note's
 * velocity less its player's level in the bar, played back on the band's
 * own level, so an accent is the same accent wherever the operators move
 * its note.
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
  /**
   * Each note's accent: its velocity less its player's level in the bar,
   * which the band adds to its own level for the part and bar; 0 for a
   * rest. Left out when every accent is 0, so a motif has one form.
   */
  readonly accents?: readonly number[];
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
  const { cycle, onsets, degrees, accidentals, accents } = motif;
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
  if (accents) {
    if (accents.length !== onsets.length) problems.push('the accents differ in length');
    if (accents.some((x) => !Number.isInteger(x))) problems.push('an accent is not a whole number');
    if (degrees.some((d, i) => d === null && (accents[i] ?? 0) !== 0))
      problems.push('a rest is accented');
    if (accents.every((x) => x === 0)) problems.push('the accents are all 0, and are left out');
  }
  return problems;
}

/** A motif under an operator. An accent moves with its note and stays as it is. */
export function applyOp(op: MotifOp, motif: Motif): Motif {
  const { cycle, onsets, degrees, accidentals, accents } = motif;
  const arcs = onsets.map((start, i) => {
    const end = onsets[i + 1] ?? onsets[0]! + cycle;
    const degree = degrees[i]!;
    return {
      onset: mod(op.rev ? op.late - end : op.late + start, cycle),
      degree: degree === null ? null : op.strans + (op.mirror ? -degree : degree),
      // 0 − a, not −a: a natural stays 0, never −0.
      accidental: op.mirror ? 0 - accidentals[i]! : accidentals[i]!,
      accent: accents?.[i] ?? 0,
    };
  });
  arcs.sort((a, b) => a.onset - b.onset);
  return withAccents(
    {
      cycle,
      onsets: arcs.map((a) => a.onset),
      degrees: arcs.map((a) => a.degree),
      accidentals: arcs.map((a) => a.accidental),
    },
    accents && arcs.map((a) => a.accent),
  );
}

/** A motif with these accents, left out if there are none or all are 0. */
function withAccents(motif: Motif, accents: readonly number[] | undefined): Motif {
  return accents?.some((x) => x !== 0) ? { ...motif, accents } : motif;
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
  const { cycle, onsets, degrees, accidentals, accents } = motif;
  let notes = 0;
  const kept = onsets.findIndex((_, i) => degrees[i] !== null && ++notes === count);
  if (kept === -1 || kept === onsets.length - 1) return motif;
  const take = kept + 1;
  let o = [...onsets.slice(0, take), onsets[take]!];
  let d: (number | null)[] = [...degrees.slice(0, take), null];
  let a = [...accidentals.slice(0, take), 0];
  let x = accents && [...accents.slice(0, take), 0];
  // The rest now runs on into the next time round, so a rest at the start joins it.
  if (d[0] === null) {
    o = o.slice(1);
    d = d.slice(1);
    a = a.slice(1);
    x = x?.slice(1);
  }
  return withAccents({ cycle, onsets: o, degrees: d, accidentals: a }, x);
}

/** One note or rest of a motif, and where it starts. */
interface Element {
  readonly onset: number;
  readonly degree: number | null;
  readonly accidental: number;
  readonly accent: number;
}

/** A motif from its elements, rising: a rest after a rest joins it, round the cycle too. */
function fromElements(cycle: number, elements: readonly Element[], accented: boolean): Motif {
  let kept = elements.filter((e, i) => e.degree !== null || elements[i - 1]?.degree !== null);
  if (kept.length > 1 && kept[0]!.degree === null && kept.at(-1)!.degree === null)
    kept = kept.slice(1);
  return withAccents(
    {
      cycle,
      onsets: kept.map((e) => e.onset),
      degrees: kept.map((e) => e.degree),
      accidentals: kept.map((e) => e.accidental),
    },
    accented ? kept.map((e) => e.accent) : undefined,
  );
}

const elementsOf = (motif: Motif, at = 0): Element[] =>
  motif.onsets.map((onset, i) => ({
    onset: at + onset,
    degree: motif.degrees[i]!,
    accidental: motif.accidentals[i]!,
    accent: motif.accents?.[i] ?? 0,
  }));

/**
 * Bars in a row as one motif, a phrase on the cycle of the bars together
 * (T15). A bar reads round its own cycle, so what sounds before its first
 * onset is its own last note or rest: a rest runs on into the next bar's
 * start as it did into its own, but a note would be held from a bar that
 * isn't there. Undefined when a bar begins inside its own last note.
 */
export function joinBars(bars: readonly Motif[]): Motif | undefined {
  const elements: Element[] = [];
  let at = 0;
  for (const bar of bars) {
    if (bar.onsets[0] !== 0) {
      if (bar.degrees.at(-1) !== null) return undefined;
      elements.push({ onset: at, degree: null, accidental: 0, accent: 0 });
    }
    elements.push(...elementsOf(bar, at));
    at += bar.cycle;
  }
  return fromElements(
    at,
    elements,
    bars.some((b) => b.accents),
  );
}

/**
 * A phrase back into bars of these cycles: `joinBars` undone. Undefined
 * where a note is held over a bar line, which bars on their own cannot
 * write, or where a bar would hold no note.
 */
export function splitBars(phrase: Motif, cycles: readonly number[]): Motif[] | undefined {
  if (cycles.reduce((a, b) => a + b, 0) !== phrase.cycle)
    throw new Error(
      `splitBars: bars of ${cycles.join('+')} steps do not make a cycle of ${phrase.cycle}`,
    );
  const elements = elementsOf(phrase);
  const bars: Motif[] = [];
  let start = 0;
  for (const cycle of cycles) {
    const within = elements
      .filter((e) => e.onset >= start && e.onset < start + cycle)
      .map((e) => ({ ...e, onset: e.onset - start }));
    if (within[0]?.onset !== 0) {
      const sounding = elements.filter((e) => e.onset < start).at(-1) ?? elements.at(-1)!;
      if (sounding.degree !== null) return undefined;
      within.unshift({ onset: 0, degree: null, accidental: 0, accent: 0 });
    }
    const bar = fromElements(cycle, within, phrase.accents !== undefined);
    if (!bar.degrees.some((d) => d !== null)) return undefined;
    bars.push(bar);
    start += cycle;
  }
  return bars;
}

/**
 * Every operator that takes `from` to `to`: none where their rhythms, rests,
 * alterations or accents can't be made to agree, and otherwise the coset
 * of `from`'s symmetries that does. Finite, as a motif has a note.
 */
export function opsBetween(from: Motif, to: Motif): MotifOp[] {
  const found: MotifOp[] = [];
  if (from.cycle !== to.cycle) return found;
  const text = (m: Motif) =>
    `${m.onsets}|${m.degrees.map((d) => d !== null)}|${m.accidentals}|${m.accents ?? ''}`;
  const target = text(to);
  const note = to.degrees.findIndex((d) => d !== null);
  for (const rev of [false, true])
    for (const mirror of [false, true])
      for (let late = 0; late < from.cycle; late++) {
        const moved = applyOp({ strans: 0, mirror, late, rev }, from);
        if (text(moved) !== target) continue;
        // The onsets and rests agree, so the degrees must differ by one sequence.
        const strans = to.degrees[note]! - moved.degrees[note]!;
        if (moved.degrees.every((d, i) => d === null || d + strans === to.degrees[i]))
          found.push({ strans, mirror, late, rev });
      }
  return found;
}

/** The operators that leave the motif as it is: finite, as the motif has a note. */
export function stabilizer(motif: Motif): MotifOp[] {
  return opsBetween(motif, motif);
}

/**
 * The operator that writes what `op` makes of `motif`: of all operators that
 * give the same motif, the one with the least `rev`, then `mirror`, then
 * `late` round the cycle. Those operators are `op` after the motif's
 * symmetries, and no two of them share all three, so the choice is one
 * operator, and choosing again changes nothing.
 * `symmetries` is the motif's `stabilizer`, for a caller that chooses for
 * many operators and would otherwise find it again for each.
 */
export function canonicalOp(
  op: MotifOp,
  motif: Motif,
  symmetries: readonly MotifOp[] = stabilizer(motif),
): MotifOp {
  const rank = (o: MotifOp) => (Number(o.rev) * 2 + Number(o.mirror)) * motif.cycle + o.late;
  let best: MotifOp | undefined;
  for (const symmetry of symmetries) {
    const same = thenOp(symmetry, op);
    const reduced = { ...same, late: mod(same.late, motif.cycle) };
    if (!best || rank(reduced) < rank(best)) best = reduced;
  }
  return best!;
}

/** A motif without its accents: what was played, apart from how loudly. */
function unaccented(motif: Motif): Motif {
  const { cycle, onsets, degrees, accidentals } = motif;
  return { cycle, onsets, degrees, accidentals };
}

/**
 * A motif heard as a remembered one (Q12): the canonical operator that takes
 * `remembered` to `heard`, `NOOP` for a repeat, or null where none does.
 * Accents are how a motif was played, not what it is, so they are left out.
 */
export function recognise(heard: Motif, remembered: Motif): MotifOp | null {
  const from = unaccented(remembered);
  const [op] = opsBetween(from, unaccented(heard));
  return op === undefined ? null : canonicalOp(op, from);
}

/** A phrase as cells and their order: which cell each bar plays, under which operator. */
export interface Cells {
  /** Each cell as it was first heard, in the order first heard. */
  readonly cells: readonly Motif[];
  readonly order: readonly { readonly cell: number; readonly op: MotifOp }[];
}

/**
 * A phrase's cells and their order (#207 M1): its bars of these cycles, each
 * heard as the first earlier cell it repeats under an operator, or as a new
 * cell. Undefined where the phrase doesn't split into its bars (`splitBars`).
 * It is recognition done against the phrase's own bars, so a phrase heard
 * again under an operator on pitch has the same order, which confirms it.
 */
export function cellsOf(phrase: Motif, cycles: readonly number[]): Cells | undefined {
  const bars = splitBars(phrase, cycles);
  if (!bars) return undefined;
  const cells: Motif[] = [];
  const order: { cell: number; op: MotifOp }[] = [];
  for (const bar of bars) {
    let cell = -1;
    let op: MotifOp | null = null;
    while (op === null && ++cell < cells.length) op = recognise(bar, cells[cell]!);
    if (op === null) cells.push(bar);
    order.push({ cell, op: op ?? NOOP });
  }
  return { cells, order };
}

/** An order written as letters, `A A B A'`: a mark on each cell heard under an operator. */
export function orderText(order: Cells['order']): string {
  const same = (op: MotifOp) => op.strans === 0 && !op.mirror && op.late === 0 && !op.rev;
  return order
    .map(({ cell, op }) => String.fromCharCode(65 + cell) + (same(op) ? '' : "'"))
    .join(' ');
}
