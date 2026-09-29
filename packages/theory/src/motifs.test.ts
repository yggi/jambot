import { describe, expect, it } from 'vitest';
import { type Helix, gaps, heightOf, mirror, positions, shift, wrap } from './helix.ts';
import { mode } from './modes.ts';
import {
  type Motif,
  type MotifOp,
  NOOP,
  applyOp,
  canonicalOp,
  cellsOf,
  head,
  joinBars,
  motifProblems,
  motion,
  opsBetween,
  orderText,
  recognise,
  rhythmOf,
  splitBars,
  stabilizer,
  thenOp,
  undo,
} from './motifs.ts';
import { alteredHeight, chromaticStep } from './numerals.ts';

const range = (n: number) => [...Array(n).keys()];
const text = (m: Motif) =>
  `${m.onsets.join()}|${m.degrees.join()}|${m.accidentals.join()}|${m.accents?.join() ?? ''}`;

/** A note or rest: a degree and its accidental, or null for a rest. */
type Value = readonly [number, number] | null;

/** Every motif of a cycle whose onsets are any set of its steps, each one of `values`. */
function motifsOf(cycle: number, values: readonly Value[]): Motif[] {
  return range(2 ** cycle)
    .slice(1)
    .flatMap((mask) => {
      const onsets = range(cycle).filter((s) => mask & (1 << s));
      let rows: Value[][] = [[]];
      for (let n = 0; n < onsets.length; n++)
        rows = rows.flatMap((r) => values.map((v) => [...r, v]));
      return rows.map((row) => ({
        cycle,
        onsets,
        degrees: row.map((v) => (v === null ? null : v[0])),
        accidentals: row.map((v) => (v === null ? 0 : v[1])),
      }));
    })
    .filter((m) => motifProblems(m).length === 0);
}

/** Every motif of a 4-step cycle whose notes are degree 0, 1 or ♭1, with rests. */
const SPAN = 4;
const motifs = motifsOf(SPAN, [null, [0, 0], [1, 0], [1, -1]]);
/** The same motifs with each note accented differently, so an accent shows where its note went. */
const accented: Motif[] = motifs.map((m) => ({
  ...m,
  accents: m.degrees.map((d, i) => (d === null ? 0 : 5 * (i + 1))),
}));
const both = [...motifs, ...accented];

/** Every operator with a sequence of −1, 0 or 2, either mirror, any displacement, either reversal. */
const ops: MotifOp[] = [-1, 0, 2].flatMap((strans) =>
  [false, true].flatMap((mirror) =>
    range(SPAN).flatMap((late) => [false, true].map((rev) => ({ strans, mirror, late, rev }))),
  ),
);

/** A motif written plainly: notes as [step, degree], a degree of null a rest. */
const motif = (cycle: number, notes: [number, number | null, number?][]): Motif => ({
  cycle,
  onsets: notes.map((n) => n[0]),
  degrees: notes.map((n) => n[1]),
  accidentals: notes.map((n) => n[2] ?? 0),
});

describe('a motif', () => {
  it('has rising onsets within its cycle, a note, no rest after a rest and no rest altered (U4)', () => {
    expect(
      motifProblems(
        motif(16, [
          [0, 0],
          [4, null],
          [8, 2, -1],
        ]),
      ),
    ).toEqual([]);
    expect(
      motifProblems(
        motif(16, [
          [4, 0],
          [4, 1],
        ]),
      ),
    ).toEqual(['the onsets do not rise within the cycle']);
    expect(
      motifProblems(
        motif(16, [
          [0, 0],
          [16, 1],
        ]),
      ),
    ).toEqual(['the onsets do not rise within the cycle']);
    expect(motifProblems(motif(16, [[0, null]]))).toEqual([
      'there is no note',
      'two rests follow each other',
    ]);
    // Round the cycle, the last rest runs into the first.
    expect(
      motifProblems(
        motif(16, [
          [0, null],
          [4, 1],
          [8, null],
        ]),
      ),
    ).toEqual(['two rests follow each other']);
    expect(
      motifProblems(
        motif(16, [
          [0, 0],
          [4, null, 1],
        ]),
      ),
    ).toEqual(['a rest is altered']);
    expect(motifProblems({ ...motif(16, [[0, 0]]), accidentals: [] })).toEqual([
      'onsets, degrees and accidentals differ in length',
    ]);
    const two = motif(16, [
      [0, 0],
      [4, null],
    ]);
    expect(motifProblems({ ...two, accents: [12, 0] })).toEqual([]);
    expect(motifProblems({ ...two, accents: [12] })).toEqual(['the accents differ in length']);
    expect(motifProblems({ ...two, accents: [1.5, 0] })).toEqual([
      'an accent is not a whole number',
    ]);
    expect(motifProblems({ ...two, accents: [12, 3] })).toEqual(['a rest is accented']);
    expect(motifProblems({ ...two, accents: [0, 0] })).toEqual([
      'the accents are all 0, and are left out',
    ]);
    expect(accented.every((m) => motifProblems(m).length === 0)).toBe(true);
    // Per set of k onsets, 3 values a note, and rests never next to each
    // other round the cycle: 3, 15, 54 and 207 motifs for k = 1 to 4.
    expect(motifs).toHaveLength(4 * 3 + 6 * 15 + 4 * 54 + 207);
  });

  it("shows its edges: the rhythm's gaps, and the motion from note to note, the last to the first (U5)", () => {
    const m = motif(16, [
      [0, 0],
      [3, 2],
      [6, null],
      [8, 4],
      [12, 1],
    ]);
    expect(gaps(rhythmOf(m))).toEqual([3, 3, 2, 4, 4]);
    expect(motion(m)).toEqual([2, 2, -3, -1]);
  });
});

describe('motif operators', () => {
  // A million cases take a few seconds: compared as text rather than with
  // toEqual, a fifth of the time.
  it(
    'act on every motif of a bar, rests, alterations and accents too, as a group does: two operators are their composition, and the identity changes nothing (Q5c)',
    { timeout: 30_000 },
    () => {
      expect(ops).toHaveLength(48);
      const wrong: string[] = [];
      for (const m of both) {
        if (text(applyOp(NOOP, m)) !== text(m)) wrong.push(`identity on ${text(m)}`);
        for (const a of ops) {
          const once = applyOp(a, m);
          for (const b of ops)
            if (text(applyOp(thenOp(a, b), m)) !== text(applyOp(b, once)))
              wrong.push(`${JSON.stringify(a)} then ${JSON.stringify(b)} on ${text(m)}`);
        }
      }
      expect(wrong.slice(0, 5)).toEqual([]);
    },
  );

  it('keep the laws: R∘R = id, I∘I = id, R∘I = I∘R, Tₐ∘T_b = Tₐ₊_b, and each is undone (Q5c)', () => {
    const r = { ...NOOP, rev: true };
    const i = { ...NOOP, mirror: true };
    const strans = (n: number) => ({ ...NOOP, strans: n });
    const late = (n: number) => ({ ...NOOP, late: n });
    for (const m of both) {
      expect(applyOp(thenOp(r, r), m)).toEqual(m);
      expect(applyOp(thenOp(i, i), m)).toEqual(m);
      expect(applyOp(thenOp(r, i), m)).toEqual(applyOp(thenOp(i, r), m));
      for (const a of [-3, -1, 0, 2])
        for (const b of [-2, 0, 1, 5]) {
          expect(applyOp(thenOp(strans(a), strans(b)), m)).toEqual(applyOp(strans(a + b), m));
          // Displacement goes round the cycle: late_a ∘ late_b = late_(a+b mod cycle).
          expect(applyOp(thenOp(late(a), late(b)), m)).toEqual(applyOp(late(a + b), m));
        }
      for (const op of ops) {
        expect(applyOp(thenOp(op, undo(op)), m)).toEqual(m);
        expect(applyOp(thenOp(undo(op), op), m)).toEqual(m);
      }
    }
    // Mirror and strans don't commute: I ∘ Tₐ = T₋ₐ ∘ I, as in a dihedral group.
    const m = motif(SPAN, [
      [0, 0],
      [2, 1],
    ]);
    expect(applyOp(thenOp(strans(1), i), m)).toEqual(applyOp(thenOp(i, strans(-1)), m));
    expect(applyOp(thenOp(strans(1), i), m)).not.toEqual(applyOp(thenOp(i, strans(1)), m));
  });

  it("move the rhythm as the theory moves a helix: late is `shift`, rev is `mirror` about the cycle's start (Q5c)", () => {
    const cycle = 16;
    const rhythm = { cycle, heights: [0, 3, 6, 8, 11, 14] };
    const m: Motif = {
      ...motif(cycle, []),
      onsets: rhythm.heights,
      degrees: [0, 2, null, 4, 3, 0],
      accidentals: [0, 0, 0, -1, 0, 0],
    };
    for (const d of range(cycle))
      expect(applyOp({ ...NOOP, late: d }, m).onsets).toEqual(positions(shift(rhythm, d)));
    // mirror reflects about degree 0, the first onset; rev about the cycle's start.
    expect(applyOp({ ...NOOP, rev: true }, m).onsets).toEqual(
      positions(shift(mirror(rhythm), -2 * rhythm.heights[0]!)),
    );
    // A note is held to the next onset, so rev puts it where the next one ends:
    // the first note, held to step 3, sounds last, from 13 to the cycle's end,
    // and the rest from 6 to 8 is a rest from 8 to 10.
    const back = applyOp({ ...NOOP, rev: true }, m);
    expect(back.degrees.at(-1)).toBe(0);
    expect(back.onsets.at(-1)).toBe(13);
    expect(back.onsets[back.degrees.indexOf(null)]).toBe(8);
  });

  it('turn the edges as they turn the motif: strans and late keep them round the cycle, mirror negates the motion, rev runs both backwards and negates the motion (U5)', () => {
    /** Whether `b` is `a` turned round by some number of places. */
    const rotated = (a: readonly unknown[], b: readonly unknown[]) =>
      a.length === b.length &&
      range(a.length || 1).some((r) => [...a.slice(r), ...a.slice(0, r)].join() === b.join());
    for (const m of motifs)
      for (const op of ops) {
        const moved = applyOp(op, m);
        let g = gaps(rhythmOf(m));
        let mo = motion(m);
        if (op.mirror) mo = mo.map((x) => 0 - x);
        if (op.rev) {
          g = [...g].reverse();
          mo = [...mo].reverse().map((x) => 0 - x);
        }
        expect(rotated(g, gaps(rhythmOf(moved)))).toBe(true);
        expect(rotated(mo, motion(moved))).toBe(true);
      }
  });

  it('are told apart by the edges alone: two motifs have the same edges round the cycle exactly when strans and late take one to the other (U5)', () => {
    // Each onset's gap, whether it is a rest, its accidental and its motion
    // to the next note, as a necklace, read from its least turn.
    const edges = (m: Motif) => {
      const notes = m.degrees.flatMap((d, i) => (d === null ? [] : [i]));
      const steps = motion(m);
      const g = gaps(rhythmOf(m));
      const beads = m.onsets.map((_, i) => {
        const j = notes.indexOf(i);
        return `${g[i]}:${j === -1 ? 'rest' : `${m.accidentals[i]}:${steps[j]}`}`;
      });
      return range(beads.length)
        .map((r) => [...beads.slice(r), ...beads.slice(0, r)].join(' '))
        .sort()[0]!;
    };
    // The orbit under strans and late, read from its least member with its first note at degree 0.
    const orbit = (m: Motif) =>
      range(m.cycle)
        .map((late) => {
          const moved = applyOp({ ...NOOP, late }, m);
          const first = moved.degrees.find((d) => d !== null)!;
          return text(applyOp({ ...NOOP, strans: -first }, moved));
        })
        .sort()[0]!;
    const byEdges = new Map<string, Set<string>>();
    const byOrbit = new Map<string, Set<string>>();
    for (const m of motifs) {
      const e = edges(m);
      const o = orbit(m);
      byEdges.set(e, (byEdges.get(e) ?? new Set()).add(o));
      byOrbit.set(o, (byOrbit.get(o) ?? new Set()).add(e));
    }
    expect([...byEdges.values()].filter((s) => s.size > 1)).toEqual([]);
    expect([...byOrbit.values()].filter((s) => s.size > 1)).toEqual([]);
    expect(byOrbit.size).toBeLessThan(motifs.length);
  });
});

describe('an accent', () => {
  it('stays the same accent wherever late and rev move its note, as it is counted from a level, not from the beat, and strans and mirror leave it as it is (U4)', () => {
    // The lead's accent by the beat, as `perform` gives it: 100 on the beat, 82 off it.
    const beat = (step: number) => (step % 4 === 0 ? 100 : 82);
    const level = 90;
    let againstLevel = 0;
    let againstBeat = 0;
    for (const m of accented)
      for (const late of range(SPAN))
        for (const rev of [false, true]) {
          const moved = applyOp({ ...NOOP, late, rev }, m);
          m.onsets.forEach((start, i) => {
            if (m.degrees[i] === null) return;
            // Where the note goes: its arc moved, or reflected, round the cycle.
            const end = m.onsets[i + 1] ?? m.onsets[0]! + SPAN;
            const onset = wrap(rev ? late - end : late + start, SPAN);
            const j = moved.onsets.indexOf(onset);
            const accent = m.accents![i]!;
            expect(moved.accents![j]).toBe(accent);
            // Played: the level and the accent, or the beat and the accent.
            if (level + moved.accents![j]! !== level + accent) againstLevel++;
            if (beat(onset) + moved.accents![j]! !== beat(start) + accent) againstBeat++;
          });
        }
    expect(againstLevel).toBe(0);
    // An accent is loudness, not pitch: turning the contour over leaves it.
    for (const m of accented)
      for (const op of ops.filter((o) => o.late === 0 && !o.rev))
        expect(applyOp(op, m).accents).toEqual(m.accents);
    // Counted from the beat, an accent moved off the beat plays another velocity.
    expect(againstBeat).toBeGreaterThan(0);
  });
});

describe('the motif operators are the symmetries there are', () => {
  it('on time: every map of the cycle that keeps its steps next to each other is one late, or one late after rev (U5)', () => {
    for (const cycle of [3, 4, 5, 6, 7]) {
      // Every permutation of the steps, kept where each step's neighbours stay its neighbours.
      let perms: number[][] = [[]];
      for (let i = 0; i < cycle; i++)
        perms = perms.flatMap((p) =>
          range(cycle)
            .filter((x) => !p.includes(x))
            .map((x) => [...p, x]),
        );
      const next = (a: number, b: number) => wrap(a - b, cycle) === 1 || wrap(b - a, cycle) === 1;
      const symmetries = perms.filter((p) =>
        range(cycle).every((x) => next(p[x]!, p[(x + 1) % cycle]!)),
      );
      // Each step as an arc, from x to x + 1: late moves it by late, rev to late − 1 − x.
      const byOps = range(cycle).flatMap((late) =>
        [false, true].map((rev) =>
          range(cycle).map((x) => wrap(rev ? late - 1 - x : late + x, cycle)),
        ),
      );
      expect(new Set(byOps.map((p) => p.join())).size).toBe(2 * cycle);
      expect(new Set(symmetries.map((p) => p.join()))).toEqual(new Set(byOps.map((p) => p.join())));
      // And applyOp moves a note on every step exactly so.
      const full = motif(
        cycle,
        range(cycle).map((x) => [x, x]),
      );
      for (const late of range(cycle))
        for (const rev of [false, true]) {
          const moved = applyOp({ ...NOOP, late, rev }, full);
          for (const x of range(cycle))
            expect(moved.degrees[wrap(rev ? late - 1 - x : late + x, cycle)]).toBe(x);
        }
    }
  });

  it('on pitch: every map of the degrees that keeps their distances is one strans, or one strans after mirror (U5)', () => {
    const window = range(7).map((x) => x - 3);
    // Every map of the window whose neighbours stay a degree apart, from each start in −5..5.
    let maps: number[][] = range(11).map((s) => [s - 5]);
    for (let i = 1; i < window.length; i++)
      maps = maps.flatMap((f) => [-1, 1].map((step) => [...f, f.at(-1)! + step]));
    const isometries = maps.filter((f) =>
      window.every((x, i) => window.every((y, j) => Math.abs(f[i]! - f[j]!) === Math.abs(x - y))),
    );
    const byOps = range(11).flatMap((s) =>
      [false, true].map((m) =>
        window.map(
          (x) =>
            applyOp({ ...NOOP, strans: s - 5 - (m ? 3 : -3), mirror: m }, motif(4, [[0, x]]))
              .degrees[0]!,
        ),
      ),
    );
    expect(new Set(isometries.map((f) => f.join()))).toEqual(new Set(byOps.map((f) => f.join())));
    expect(isometries).toHaveLength(22);
  });

  it(
    'give one motif from several operators only where the motif has a symmetry, and write each result with one canonical operator, a fixed point (U5, F3)',
    { timeout: 30_000 },
    () => {
      // Every operator with a sequence of −2 to 2, and a wider set that holds every symmetry.
      const all = [-2, -1, 0, 1, 2].flatMap((strans) =>
        [false, true].flatMap((mirror) =>
          range(SPAN).flatMap((late) =>
            [false, true].map((rev) => ({ strans, mirror, late, rev })),
          ),
        ),
      );
      const wide = range(9).flatMap((s) =>
        [false, true].flatMap((mirror) =>
          range(SPAN).flatMap((late) =>
            [false, true].map((rev) => ({ strans: s - 4, mirror, late, rev })),
          ),
        ),
      );
      const key = (op: MotifOp) => JSON.stringify(op);
      let symmetric = 0;
      for (const m of both) {
        // What every operator of the wide set makes of the motif, made once for both checks.
        const made = new Map(wide.map((op) => [key(op), text(applyOp(op, m))]));
        const symmetries = stabilizer(m);
        const found = symmetries.map(key).sort();
        expect(found).toEqual(
          wide
            .filter((op) => made.get(key(op)) === text(m))
            .map(key)
            .sort(),
        );
        if (found.length > 1 && !m.accents) symmetric++;
        // The operators giving each result, and the canonical operator of each.
        const results = new Map<string, Set<string>>();
        for (const op of all) {
          const result = made.get(key(op))!;
          const canonical = canonicalOp(op, m, symmetries);
          expect(text(applyOp(canonical, m))).toBe(result);
          expect(canonicalOp(canonical, m, symmetries)).toEqual(canonical);
          results.set(result, (results.get(result) ?? new Set()).add(key(canonical)));
        }
        // One canonical operator per result, and no two results share one.
        expect([...results.values()].every((s) => s.size === 1)).toBe(true);
        const canonicals = [...results.values()].map((s) => [...s][0]);
        expect(new Set(canonicals).size).toBe(results.size);
      }
      // A motif with no symmetry tells every operator apart. On a cycle this
      // short, more than half have one.
      expect(symmetric).toBe(285);
      const plain = motif(SPAN, [
        [0, 0],
        [1, 1],
        [3, 1, -1],
      ]);
      expect(stabilizer(plain)).toEqual([NOOP]);
      expect(new Set(all.map((op) => text(applyOp(op, plain)))).size).toBe(all.length);
    },
  );
});

describe('head', () => {
  it('forms a monoid beside the group: heads of heads are the shorter, pitch commutes with them, and two motifs can share one (Q5c)', () => {
    for (const m of both) {
      const notes = m.degrees.filter((d) => d !== null).length;
      for (const a of range(notes).map((i) => i + 1)) {
        expect(motifProblems(head(m, a))).toEqual([]);
        for (const b of range(notes).map((i) => i + 1))
          expect(head(head(m, a), b)).toEqual(head(m, Math.min(a, b)));
        for (const op of ops.filter((o) => o.late === 0 && !o.rev))
          expect(applyOp(op, head(m, a))).toEqual(head(applyOp(op, m), a));
      }
      expect(head(m, notes)).toEqual(m);
    }
    // Dropping the last note loses it: no operator gives it back.
    const one = motif(SPAN, [
      [0, 0],
      [2, 1],
    ]);
    const other = motif(SPAN, [
      [0, 0],
      [2, -1],
    ]);
    expect(head(one, 1)).toEqual(head(other, 1));
    expect(head(one, 1)).toEqual(
      motif(SPAN, [
        [0, 0],
        [2, null],
      ]),
    );
  });

  it('leaves a rest where it drops notes, so rev turns it into the last notes, wherever no note is held over the start of the cycle (U4)', () => {
    /** The last `count` notes, and a rest from the first onset for the notes dropped. */
    const last = (m: Motif, count: number): Motif => {
      const notes = m.degrees.flatMap((d, i) => (d === null ? [] : [i]));
      if (count >= notes.length) return m;
      const from = notes[notes.length - count]!;
      // The rest joins a rest that ends the motif, which runs on into it.
      const rest = m.degrees.at(-1) === null ? 0 : 1;
      return {
        cycle: m.cycle,
        onsets: [...m.onsets.slice(0, rest), ...m.onsets.slice(from)],
        degrees: [...Array<null>(rest).fill(null), ...m.degrees.slice(from)],
        accidentals: [...Array<number>(rest).fill(0), ...m.accidentals.slice(from)],
        ...(m.accents && {
          accents: [...Array<number>(rest).fill(0), ...m.accents.slice(from)],
        }),
      };
    };
    const rev = { ...NOOP, rev: true };
    let held = 0;
    for (const m of both) {
      // A note held over the start: the first onset is late, and the last is a note.
      const over = m.onsets[0] !== 0 && m.degrees.at(-1) !== null;
      const notes = m.degrees.filter((d) => d !== null).length;
      for (const count of range(notes).map((i) => i + 1)) {
        const mirrored = applyOp(rev, head(applyOp(rev, m), count));
        if (!over) expect(text(mirrored)).toBe(text(last(m, count)));
        else if (text(mirrored) !== text(last(m, count))) held++;
      }
    }
    // Where a note is held over the start, rev counts it last on both sides, so the rule needs the start.
    expect(held).toBeGreaterThan(0);
  });
});

describe('an altered degree', () => {
  /** The chain-of-fifths tunings, each by its fifth. */
  const FIFTHS: Record<number, number> = { 12: 7, 17: 10, 19: 11, 22: 13, 31: 18, 53: 31 };
  /** The ionian of a tuning: C D E F G A B as places on the line of fifths. */
  const ionian = (n: number): Helix => ({
    cycle: n,
    heights: [0, 2, 4, -1, 1, 3, 5].map((p) => wrap(p * FIFTHS[n]!, n)).sort((a, b) => a - b),
  });
  const heightOfNote = (key: Helix, degree: number, accidental: number) =>
    heightOf(key, degree) + accidental * chromaticStep(key);

  it("mirrors as the key's helix mirrors, in the mode that is its own mirror, only when mirror turns its accidental over too (U4)", () => {
    for (const n of Object.keys(FIFTHS).map(Number)) {
      // Dorian reads the same both ways, so mirror keeps its notes.
      const dorian = mode(ionian(n), 1);
      expect(positions(mirror(dorian))).toEqual(positions(dorian));
      const tonic = dorian.heights[0]!;
      let keptWrong = 0;
      for (const degree of range(15).map((d) => d - 7))
        for (const accidental of [-1, 0, 1]) {
          const mirrored = applyOp({ ...NOOP, mirror: true }, motif(16, [[0, degree, accidental]]));
          const [d, a] = [mirrored.degrees[0]!, mirrored.accidentals[0]!];
          expect(heightOfNote(dorian, d, a)).toBe(
            2 * tonic - heightOfNote(dorian, degree, accidental),
          );
          // Keeping the accidental, the other choice, misses every altered note.
          if (
            heightOfNote(dorian, d, accidental) !==
            2 * tonic - heightOfNote(dorian, degree, accidental)
          )
            keptWrong++;
        }
      expect(keptWrong).toBe(30);
    }
  });

  it('reaches every pitch of 12, 17 and 19 with one b or #, in every key, but not of 22, 31 or 53, whose chromatic step is more than one step of the cycle (U4)', () => {
    const reached: Record<number, boolean> = {};
    for (const n of Object.keys(FIFTHS).map(Number)) {
      let all = true;
      for (const d of range(7))
        for (const tonic of range(n)) {
          const key = shift(mode(ionian(n), d), tonic);
          const heard = new Set(
            range(7).flatMap((degree) =>
              [-1, 0, 1].map((a) => wrap(heightOfNote(key, degree, a), n)),
            ),
          );
          if (heard.size !== n) all = false;
        }
      reached[n] = all;
    }
    expect(reached).toEqual({ 12: true, 17: true, 19: true, 22: false, 31: false, 53: false });
  });

  it("gives the minor third the line of fifths spells (place −3 from the tonic) in every cycle P5 names; one step of the grid, the pitch tower's other candidate, gives it only in 12 and 19, where the chromatic step is already 1 (#125)", () => {
    const minorThird = (n: number) => wrap(-3 * FIFTHS[n]!, n);
    const chromatic: Record<number, number> = {};
    const gridStep: Record<number, number> = {};
    for (const n of Object.keys(FIFTHS).map(Number)) {
      const key = ionian(n);
      chromatic[n] = wrap(alteredHeight(key, 2, -1) - key.heights[0]!, n);
      gridStep[n] = wrap(alteredHeight(key, 2, -1, 1) - key.heights[0]!, n);
    }
    const oracle = Object.fromEntries(
      Object.keys(FIFTHS)
        .map(Number)
        .map((n) => [n, minorThird(n)]),
    );
    expect(chromatic).toEqual(oracle);
    expect(gridStep).toEqual({ 12: 3, 17: 5, 19: 5, 22: 7, 31: 9, 53: 17 });
    // Only where the chromatic step already is 1 does the grid step agree.
    expect(
      Object.keys(FIFTHS)
        .map(Number)
        .filter((n) => gridStep[n] === oracle[n]),
    ).toEqual([12, 19]);
  });
});

describe('a phrase across bars', () => {
  /** A bar that joins: one that does not begin inside its own last note. */
  const joins = (m: Motif) => m.onsets[0] === 0 || m.degrees.at(-1) === null;
  /** Every 4-step bar that joins, with notes on degree 0 or ♭1, and rests. */
  const bars = motifsOf(SPAN, [null, [0, 0], [1, -1]]).filter(joins);
  /** Every pair of them. */
  const pairs = bars.flatMap((a) => bars.map((b) => [a, b]));
  const strans = (n: number) => ({ ...NOOP, strans: n });

  it('joins bars into one motif on the cycle of the bars together, and splits it back into the same bars (finite: every pair of 4-step bars that join) (T15)', () => {
    expect(bars.length).toBeGreaterThan(40);
    for (const [a, b] of pairs) {
      const phrase = joinBars([a!, b!])!;
      expect(motifProblems(phrase)).toEqual([]);
      expect(phrase.cycle).toBe(2 * SPAN);
      expect(splitBars(phrase, [SPAN, SPAN])).toEqual([a, b]);
    }
  });

  it('holds a note across a bar line, which bars on their own cannot: such a phrase does not split, and a bar that begins inside its own last note does not join (T15)', () => {
    // The first bar's last note holds on over the line to the second bar's rest.
    const tied = motif(2 * SPAN, [
      [0, 0],
      [3, 1],
      [6, null],
    ]);
    expect(motifProblems(tied)).toEqual([]);
    expect(splitBars(tied, [SPAN, SPAN])).toBeUndefined();
    // On its own, a bar whose first onset is late begins inside its last note.
    const late = motif(SPAN, [
      [1, 0],
      [3, 1],
    ]);
    expect(joinBars([late, late])).toBeUndefined();
    expect(motifs.filter((m) => !joins(m)).length).toBeGreaterThan(0);
    expect(pairs.length).toBe(bars.length ** 2);
  });

  it('is moved by the operators as its bars are: strans and mirror move each bar, late by a bar turns them round, and rev reverses their order and each bar (finite: every pair of 4-step bars that join) (T15, Q5c)', () => {
    const mirrorOp = { ...NOOP, mirror: true };
    const byBar = { ...NOOP, late: SPAN };
    const rev = { ...NOOP, rev: true };
    for (const [a, b] of pairs) {
      const phrase = joinBars([a!, b!])!;
      for (const op of [strans(-1), strans(2), mirrorOp])
        expect(applyOp(op, phrase)).toEqual(joinBars([applyOp(op, a!), applyOp(op, b!)]));
      expect(applyOp(byBar, phrase)).toEqual(joinBars([b!, a!]));
      expect(applyOp(rev, phrase)).toEqual(joinBars([applyOp(rev, b!), applyOp(rev, a!)]));
    }
  });

  it('keeps the group’s laws on a cycle of whole bars: two operators are their composition, and each is undone (finite: every operator of the 8-step cycle on a sample of two-bar phrases) (T15, Q5c)', () => {
    const phraseOps: MotifOp[] = [-1, 0, 2].flatMap((s) =>
      [false, true].flatMap((mirror) =>
        range(2 * SPAN).flatMap((late) =>
          [false, true].map((rev) => ({ strans: s, mirror, late, rev })),
        ),
      ),
    );
    const step = Math.floor(pairs.length / 30);
    const sample = pairs.filter((_, i) => i % step === 0).map(([a, b]) => joinBars([a!, b!])!);
    expect(sample.length).toBeGreaterThan(20);
    for (const m of sample)
      for (const x of phraseOps) {
        expect(applyOp(thenOp(x, undo(x)), m)).toEqual(m);
        for (const y of phraseOps.filter((_, i) => i % 7 === 0))
          expect(applyOp(thenOp(x, y), m)).toEqual(applyOp(y, applyOp(x, m)));
      }
  });

  it('turns a repeated bar into a symmetry: late by a bar leaves the phrase as it is, and the canonical operator writes it as no operator at all (finite: every bar that joins) (T15, U5, F3, Q12)', () => {
    const byBar = { ...NOOP, late: SPAN };
    for (const a of bars) {
      const twice = joinBars([a, a])!;
      expect(stabilizer(twice)).toContainEqual(byBar);
      expect(canonicalOp(byBar, twice)).toEqual(NOOP);
    }
  });
});

describe('recognition: a motif heard as a remembered one under an operator (Q12)', () => {
  const key = (op: MotifOp) => JSON.stringify(op);
  const plain = (m: Motif): Motif => ({
    cycle: m.cycle,
    onsets: m.onsets,
    degrees: m.degrees,
    accidentals: m.accidentals,
  });

  it('finds every operator from one motif to another as the coset of the first’s symmetries (finite: every motif and operator) (Q5c, Q12)', () => {
    for (const m of both) {
      expect(opsBetween(m, m).map(key).sort()).toEqual(stabilizer(m).map(key).sort());
      for (const op of ops) {
        const found = opsBetween(m, applyOp(op, m)).map((o) => key({ ...o, late: o.late }));
        const coset = stabilizer(m).map((s) => {
          const o = thenOp(s, op);
          return key({ ...o, late: ((o.late % SPAN) + SPAN) % SPAN });
        });
        expect(found.sort()).toEqual(coset.sort());
      }
    }
  });

  it('hears a motif played again under any operator as the remembered one, and writes it with the canonical operator, a repeat with none (finite: every motif and operator) (Q12)', () => {
    for (const m of both) {
      expect(recognise(m, m)).toEqual(NOOP);
      for (const op of ops) {
        const heard = applyOp(op, m);
        const found = recognise(heard, m)!;
        expect(found).toEqual(canonicalOp(op, plain(m)));
        expect(text(plain(applyOp(found, m)))).toBe(text(plain(heard)));
      }
    }
  });

  it('hears accents as how a motif was played, not as what it is', () => {
    const [m, loud] = [motifs[40]!, accented[40]!];
    expect(recognise(loud, m)).toEqual(NOOP);
    expect(recognise(m, loud)).toEqual(NOOP);
  });

  it('hears nothing where no operator takes one motif to the other, or their cycles differ (Q12)', () => {
    const sample = motifs.filter((_, i) => i % 9 === 0);
    let strangers = 0;
    for (const a of sample)
      for (const b of motifs) {
        const found = recognise(b, a);
        if (found === null) strangers++;
        else expect(text(applyOp(found, a))).toBe(text(b));
      }
    expect(strangers).toBeGreaterThan(sample.length * motifs.length * 0.9);
    const bar = motif(16, [
      [0, 0],
      [4, 1],
    ]);
    expect(recognise(bar, { ...bar, cycle: 8 })).toBeNull();
  });
});

describe('the cells of a phrase and their order, #207 M1 (#207, Q12)', () => {
  const joins = (m: Motif) => m.onsets[0] === 0 || m.degrees.at(-1) === null;
  const bars = motifsOf(SPAN, [null, [0, 0], [1, -1]]).filter(joins);
  const cyclesOf = (n: number) => range(n).map(() => SPAN);

  it('reads a bar that repeats the one before under an operator as the same cell, and writes the operator (finite: every bar that joins, and every operator) (Q12)', () => {
    for (const a of bars)
      for (const op of ops) {
        const b = applyOp(op, a);
        if (!joins(b)) continue;
        const phrase = joinBars([a, b])!;
        const read = cellsOf(phrase, cyclesOf(2))!;
        expect(read.cells).toEqual([a]);
        expect(read.order).toEqual([
          { cell: 0, op: NOOP },
          { cell: 0, op: canonicalOp(op, a) },
        ]);
      }
  });

  it('keeps a bar that repeats nothing before it as a cell of its own, and rebuilds the phrase from its cells (finite: every pair of bars that join) (Q12)', () => {
    for (const a of bars)
      for (const b of bars) {
        const phrase = joinBars([a, b])!;
        const read = cellsOf(phrase, cyclesOf(2))!;
        expect(read.cells.length).toBe(recognise(b, a) === null ? 2 : 1);
        const rebuilt = joinBars(read.order.map(({ cell, op }) => applyOp(op, read.cells[cell]!)));
        expect(rebuilt).toEqual(phrase);
      }
  });

  it(
    'gives a phrase moved on pitch the same order of cells, so the phrase heard again confirms its order (a sample of three bars A, A under an operator, B) (Q12)',
    { timeout: 30_000 },
    () => {
      const pitchOps = [-1, 2].flatMap((strans) =>
        [false, true].map((mirror) => ({ ...NOOP, strans, mirror })),
      );
      const sample = bars.filter((_, i) => i % 5 === 0);
      expect(sample.length).toBeGreaterThan(8);
      for (const a of sample)
        for (const b of sample) {
          const phrase = joinBars([a, applyOp({ ...NOOP, strans: 1 }, a), b])!;
          const order = cellsOf(phrase, cyclesOf(3))!.order.map((o) => o.cell);
          for (const op of pitchOps) {
            const moved = cellsOf(applyOp(op, phrase), cyclesOf(3))!;
            expect(moved.order.map((o) => o.cell)).toEqual(order);
            expect(recognise(applyOp(op, phrase), phrase)).toEqual(canonicalOp(op, phrase));
          }
        }
    },
  );

  it('writes the order as letters, a mark on each cell heard under an operator, and nothing for a phrase that does not split', () => {
    const a = motif(SPAN, [
      [0, 0],
      [1, 1],
      [3, null],
    ]);
    const b = motif(SPAN, [
      [0, 1],
      [2, 0],
    ]);
    const up = applyOp({ ...NOOP, strans: 2 }, a);
    const read = cellsOf(joinBars([a, a, b, up])!, cyclesOf(4))!;
    expect(orderText(read.order)).toBe("A A B A'");
    const tied = motif(2 * SPAN, [
      [0, 0],
      [3, 1],
      [6, null],
    ]);
    expect(cellsOf(tied, cyclesOf(2))).toBeUndefined();
  });
});
