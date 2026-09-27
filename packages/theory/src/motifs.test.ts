import { describe, expect, it } from 'vitest';
import { mirror, positions, shift } from './helix.ts';
import {
  IDENTITY,
  type Motif,
  type MotifOp,
  applyOp,
  displace,
  fragment,
  inv,
  inverseOp,
  retro,
  seq,
  thenOp,
} from './motifs.ts';

const range = (n: number) => [...Array(n).keys()];

/** Every motif of a bar of 4 steps: each set of onsets, each degree in −1..1. */
const SPAN = 4;
const motifs: Motif[] = range(2 ** SPAN)
  .slice(1)
  .flatMap((mask) => {
    const steps = range(SPAN).filter((s) => mask & (1 << s));
    let contours: number[][] = [[]];
    for (let n = 0; n < steps.length; n++)
      contours = contours.flatMap((c) => [-1, 0, 1].map((d) => [...c, d]));
    return contours.map((degrees) => ({ span: SPAN, steps, degrees }));
  });

/** Every operator with a sequence of −2 to 2, either inversion, any displacement, either retrograde. */
const ops: MotifOp[] = [-2, -1, 0, 1, 2].flatMap((s) =>
  [false, true].flatMap((i) =>
    range(SPAN).flatMap((d) => [false, true].map((r) => ({ seq: s, inv: i, shift: d, retro: r }))),
  ),
);

describe('motif operators', () => {
  // 1.6 million cases take a few seconds: compared as text rather than with
  // toEqual, a fifth of the time.
  it(
    'act on every motif of a bar as a group does: two operators are their composition, and the identity changes nothing (Q5c)',
    { timeout: 30_000 },
    () => {
      expect(motifs).toHaveLength(255);
      expect(ops).toHaveLength(80);
      const text = (m: Motif) => `${m.steps.join()}|${m.degrees.join()}`;
      const wrong: string[] = [];
      for (const m of motifs) {
        if (text(applyOp(IDENTITY, m)) !== text(m)) wrong.push(`identity on ${text(m)}`);
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

  it('keep the laws: R∘R = id, I∘I = id, R∘I = I∘R, Tₐ∘T_b = Tₐ₊_b, and each is undone by its inverse (Q5c)', () => {
    const r = retro();
    const i = inv();
    for (const m of motifs) {
      expect(applyOp(thenOp(r, r), m)).toEqual(m);
      expect(applyOp(thenOp(i, i), m)).toEqual(m);
      expect(applyOp(thenOp(r, i), m)).toEqual(applyOp(thenOp(i, r), m));
      for (const a of [-3, -1, 0, 2])
        for (const b of [-2, 0, 1, 5]) {
          expect(applyOp(thenOp(seq(a), seq(b)), m)).toEqual(applyOp(seq(a + b), m));
          // Displacement goes round the bar: D_a ∘ D_b = D_(a+b mod span).
          expect(applyOp(thenOp(displace(a), displace(b)), m)).toEqual(applyOp(displace(a + b), m));
        }
      for (const op of ops) expect(applyOp(thenOp(op, inverseOp(op, SPAN)), m)).toEqual(m);
    }
    // Inversion and sequence don't commute: I ∘ Tₐ = T₋ₐ ∘ I, as in a dihedral group.
    const m: Motif = { span: SPAN, steps: [0, 2], degrees: [0, 1] };
    expect(applyOp(thenOp(seq(1), i), m)).toEqual(applyOp(thenOp(i, seq(-1)), m));
    expect(applyOp(thenOp(seq(1), i), m)).not.toEqual(applyOp(thenOp(i, seq(1)), m));
  });

  it("move the rhythm as the theory moves a helix: displacement is `shift`, retrograde is `mirror` about the bar's start (Q5c)", () => {
    const span = 16;
    const rhythm = { cycle: span, heights: [0, 3, 6, 8, 11, 14] };
    const m: Motif = { span, steps: rhythm.heights, degrees: [0, 2, 1, 4, 3, 0] };
    for (const d of range(span))
      expect(applyOp(displace(d), m).steps).toEqual(positions(shift(rhythm, d)));
    // mirror reflects about degree 0, the first onset; retrograde about the bar's start.
    expect(applyOp(retro(), m).steps).toEqual(
      positions(shift(mirror(rhythm), -2 * rhythm.heights[0]!)),
    );
    // A note is held to the next, so retrograde puts it where the next one ends: the
    // bar's first note, held to step 3, sounds last, from 13 to the bar's end.
    const back = applyOp(retro(), m);
    expect(back.degrees.at(-1)).toBe(0);
    expect(back.steps.at(-1)).toBe(13);
  });

  it('take a fragment as a monoid, not a group: fragments of fragments are the shorter, and two motifs can share one (Q5c)', () => {
    for (const m of motifs)
      for (const a of range(m.steps.length + 1).slice(1)) {
        for (const b of range(m.steps.length + 1).slice(1))
          expect(fragment(fragment(m, a), b)).toEqual(fragment(m, Math.min(a, b)));
        // A fragment commutes with every operator on pitch.
        for (const op of ops.filter((o) => o.shift === 0 && !o.retro))
          expect(applyOp(op, fragment(m, a))).toEqual(fragment(applyOp(op, m), a));
      }
    // Dropping the last note loses it: no operator gives it back.
    const one: Motif = { span: SPAN, steps: [0, 2], degrees: [0, 1] };
    const other: Motif = { span: SPAN, steps: [0, 2], degrees: [0, -1] };
    expect(fragment(one, 1)).toEqual(fragment(other, 1));
  });
});
