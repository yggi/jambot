/**
 * E13: do the motif operators cover the lead? (Q5c, U5, S2; #7's decision (d))
 *
 * The lead plays four-bar phrases: a shape, a variation of it, the shape
 * again, another variation (`lead.ts`). A shape is a motif, a rhythm and a
 * contour in degrees of the key. Written, a variation turns the shape over
 * (an inversion), lifts it by two degrees (a sequence), bends its last note
 * or drops it (a fragment), and at some entropy nudges one degree. Played,
 * the lead fits it to the chords: a note on the half bar or on a chord's
 * start goes to the nearest chord tone, the phrase's second bar ends on the
 * third or fifth and its fourth on the root, and a note out of range folds
 * by an octave.
 *
 * This runs the band over E1's shape (5 seeds, each preset held and the
 * tour, 64 bars each), reads every lead bar back as key degrees, and finds
 * the operator and head (`motifs.ts`) whose notes start where the bar's do
 * and whose contour, at the best `strans`, differs from the bar's in the
 * fewest notes. A head leaves a rest where it drops notes, and the lead
 * holds its last note over it to the end of the bar, so only the notes'
 * onsets are compared. It asks:
 *
 * 1. of a shape bar (the phrase's first and third), how often fitting it to
 *    the chords changed a degree;
 * 2. of a variation bar, whether it is the shape under an operator exactly,
 *    or but for its last note, which the phrase's close sets, or but for one
 *    other note, or not;
 * 3. of a phrase, whether each bar is the shape under an operator, and how
 *    many tokens it takes as notes against as a named cell and references;
 * 4. how many of the lead's shapes have a symmetry, so that several
 *    operators give one bar and `canonicalOp` has to choose.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/motifs.ts
 */

import { degreeBelow, heightOf } from '@jambot/theory';
import {
  type Motif,
  type MotifOp,
  NOOP,
  applyOp,
  head,
  stabilizer,
} from '../../theory/src/motifs.ts';
import { type BandCarried, type KeyWish, PRESETS, band, keyHelix } from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5);
const BARS = 64;
const runs: ((bar: number) => (typeof PRESETS)[number])[] = [
  ...PRESETS.map((preset) => () => preset),
  (bar) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!,
];

/** Every operator but a `strans`, which the best offset below stands for. */
const OPS: { name: string; op: MotifOp }[] = [false, true].flatMap((mirror) =>
  [false, true].flatMap((rev) =>
    range(16).map((late) => ({
      name: [mirror && 'mirror', rev && 'rev', late && 'late'].filter(Boolean).join('+') || 'same',
      op: { ...NOOP, mirror, rev, late },
    })),
  ),
);

/** A lead bar or shape as a motif: its notes held to the next, the last to the bar's end. */
const asMotif = (steps: readonly number[], degrees: readonly number[]): Motif => {
  const rest = steps[0]! > 0 ? 1 : 0;
  return {
    cycle: 16,
    onsets: [...(rest ? [0] : []), ...steps],
    degrees: [...(rest ? [null] : []), ...degrees],
    accidentals: [...(rest ? [0] : []), ...degrees.map(() => 0)],
  };
};
/** A motif's notes: their onsets and degrees, the rests left out. */
const notesOf = (m: Motif) => {
  const at = m.degrees.flatMap((d, i) => (d === null ? [] : [i]));
  return { onsets: at.map((i) => m.onsets[i]!), degrees: at.map((i) => m.degrees[i]!) };
};

interface Match {
  /** The operator, `head` first if the bar is a head. */
  name: string;
  /** Which of the bar's notes differ in degree from the operator's. */
  off: number[];
}

/** The operator and head nearest the bar: the same onsets, the fewest notes off. */
function closest(shape: Motif, heard: Motif): Match | null {
  let best: Match | null = null;
  const bar = notesOf(heard);
  const count = notesOf(shape).onsets.length;
  for (let keep = count; keep >= 1; keep--)
    for (const { name, op } of OPS) {
      const m = notesOf(applyOp(op, head(shape, keep)));
      if (m.onsets.join() !== bar.onsets.join()) continue;
      // Heard degrees are the key's, counted from its tonic; try a strans
      // around the one the first notes suggest.
      const base = bar.degrees[0]! - m.degrees[0]!;
      for (let offset = base - 7; offset <= base + 7; offset++) {
        const off = bar.degrees.flatMap((d, i) => (d === m.degrees[i]! + offset ? [] : [i]));
        if (!best || off.length < best.off.length)
          best = { name: keep < count ? `head+${name}` : name, off };
      }
    }
  return best;
}

const tally = new Map<string, number>();
const count = (key: string, by = 1) => tally.set(key, (tally.get(key) ?? 0) + by);
const byOperator = new Map<string, number>();
/** The lead's distinct shapes, and those with a symmetry. */
const shapes = new Set<string>();
const symmetric = new Set<string>();
let notesTokens = 0;
let cellTokens = 0;

for (const seed of SEEDS)
  for (const presetAt of runs) {
    let carried: BandCarried = band.initial;
    /** The phrase's bars so far: each one's match, and its number of notes. */
    let phrase: ({ match: Match | null; notes: number; closes: boolean } | null)[] = [];
    let shapeNotes = 0;
    for (const bar of range(BARS)) {
      const preset = presetAt(bar);
      const { output, carried: after } = band.advance(
        {
          seed,
          bar,
          style: { ...preset.style, entropy: (bar % 32) / 32 },
          wish: { tonic: null, mode: preset.mode } as KeyWish,
        },
        carried,
        null,
      );
      carried = after;
      const notes = output.written.filter((n) => n.part === 'lead');
      const shape = after.parts.lead.phrase;
      const phase = output.barInSection % 4;
      if (!notes.length || !shape) {
        phrase = [];
        continue;
      }
      const scale = keyHelix(output.plan.key);
      const degrees = notes.map((n) => {
        const d = degreeBelow(scale, n.note);
        return heightOf(scale, d) === n.note ? d : null;
      });
      if (phase === 0) {
        phrase = [];
        shapeNotes = shape.steps.length;
      }
      if (degrees.some((d) => d === null)) {
        count('bars with a note off the key');
        phrase.push(null);
        continue;
      }
      const heard = asMotif(
        notes.map((n) => n.step),
        degrees as number[],
      );
      const written = asMotif(shape.steps, shape.degrees);
      const id = JSON.stringify(written);
      shapes.add(id);
      if (stabilizer(written).length > 1) symmetric.add(id);
      const match = closest(written, heard);
      phrase.push({ match, notes: notes.length, closes: phase % 2 === 1 });
      const last = notes.length - 1;
      if (phase === 0 || phase === 2) {
        count('shape bars');
        count('shape notes', notes.length);
        count('shape notes fitted to another degree', match?.off.length ?? notes.length);
        if (match?.off.length) count('shape bars with a note fitted to another degree');
      } else {
        count('variation bars');
        const kind = !match
          ? 'no operator gives its rhythm'
          : match.off.length === 0
            ? 'the shape under an operator, exactly'
            : match.off.length === 1 && match.off[0] === last
              ? 'exactly but its last note, which the close sets'
              : match.off.length === 1 || (match.off.length === 2 && match.off.includes(last))
                ? 'but for one other note (and the close)'
                : 'two notes or more off';
        count(kind);
        if (match && match.off.filter((i) => i !== last).length <= 1)
          byOperator.set(match.name, (byOperator.get(match.name) ?? 0) + 1);
      }
      if (phase === 3 && phrase.length === 4) {
        count('phrases');
        /** A bar's notes off, but for the last of a bar the close sets. */
        const offButClose = (b: { match: Match | null; notes: number; closes: boolean }) =>
          b.match ? b.match.off.filter((i) => !(b.closes && i === b.notes - 1)).length : b.notes;
        if (phrase.every((b) => b?.match && b.match.off.length === 0))
          count('phrases, every bar exact');
        if (phrase.every((b) => b && offButClose(b) === 0))
          count('phrases, every bar but the close');
        if (phrase.every((b) => b && offButClose(b) <= 1))
          count('phrases, every bar but the close and one note');
        // As notes, a step and a degree for each. As a cell, its notes once,
        // then per bar a reference and an operator, and a degree for each
        // note the operator doesn't give, the close aside.
        for (const b of phrase) {
          notesTokens += 2 * (b?.notes ?? 0);
          cellTokens += 2 + 2 * (b ? offButClose(b) : 0);
        }
        cellTokens += 2 * shapeNotes;
      }
    }
  }

const get = (key: string) => tally.get(key) ?? 0;
const pct = (a: number, b: number) => `${a} of ${b} (${((100 * a) / b).toFixed(1)}%)`;
console.log('E13 the lead against the motif operators (5 seeds × 9 runs × 64 bars)\n');
console.log('E13.1 shape bars: does the lead play its shape as written?');
console.table({
  'bars with a note fitted to another degree': pct(
    get('shape bars with a note fitted to another degree'),
    get('shape bars'),
  ),
  'notes fitted to another degree': pct(
    get('shape notes fitted to another degree'),
    get('shape notes'),
  ),
  'bars with a note off the key': get('bars with a note off the key'),
});
console.log('\nE13.2 variation bars: the shape under an operator?');
const kinds = [
  'the shape under an operator, exactly',
  'exactly but its last note, which the close sets',
  'but for one other note (and the close)',
  'two notes or more off',
  'no operator gives its rhythm',
];
console.table(Object.fromEntries(kinds.map((k) => [k, pct(get(k), get('variation bars'))])));
console.log('the operators, where one explains the bar but for the close and one note:');
console.table(
  Object.fromEntries(
    [...byOperator].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, pct(v, get('variation bars'))]),
  ),
);
console.log('\nE13.3 phrases');
console.table({
  'every bar the shape under an operator, exactly': pct(
    get('phrases, every bar exact'),
    get('phrases'),
  ),
  'every bar but the close': pct(get('phrases, every bar but the close'), get('phrases')),
  'every bar but the close and one note': pct(
    get('phrases, every bar but the close and one note'),
    get('phrases'),
  ),
});
console.log(
  `as notes, ${notesTokens} tokens; as a cell and references, ${cellTokens} (${((100 * cellTokens) / notesTokens).toFixed(0)}%)`,
);
console.log('\nE13.4 symmetries: shapes that several operators give');
console.table({ 'shapes with a symmetry': pct(symmetric.size, shapes.size) });
