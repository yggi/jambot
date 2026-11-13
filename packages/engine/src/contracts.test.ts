/**
 * The family's swing contract (yggi/music-commons `contracts/swing`,
 * version 1) run against the time maps: the hub's `vectors.json` is copied
 * into `fixtures/contracts/` with a first field, `lifted`, naming the hub and
 * the commit it came from, and the hub's `README.md` is the rule.
 *
 * A swing vector is a grouping in eighths, its levels and shares, and where
 * each of its steps plays: `leanMap` over the grouping, a lean a level
 * (`leanOfShare`). Every vector runs, and Jambot meets each.
 *
 * The feel contract's copy sits beside it (`fixtures/contracts/feel.json`,
 * version 3), and `packages/score/src/contracts.test.ts` runs it: cells'
 * default performer plays each of cells' events (`performCells`, #552), and
 * `lineOf` reads each case's lines.
 */
import { describe, expect, it } from 'vitest';
import swingHub from '../fixtures/contracts/swing.json';
import { type SwingLevel, leanMap, leanOfShare } from './swing.ts';

interface SwingVector {
  readonly name: string;
  readonly groups: readonly number[];
  readonly swing: readonly { readonly level: SwingLevel; readonly share: number }[];
  readonly onsets: readonly number[];
}

interface Contract<V> {
  readonly lifted: string;
  readonly contract: string;
  readonly version: number;
  readonly vectors: readonly V[];
}
const swing = swingHub as unknown as Contract<SwingVector>;

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
/** A grouping as a meter: its eighths, each group's first a pulse. */
const meterOf = (groups: readonly number[]) => ({
  cycle: sum(groups),
  heights: groups.map((_, i) => sum(groups.slice(0, i))),
});
const shareAt = (v: SwingVector, level: SwingLevel) =>
  v.swing.find((s) => s.level === level)?.share ?? 0.5;

describe('the swing contract (yggi/music-commons contracts/swing, version 1)', () => {
  it('is the version Jambot passes, lifted with its source named', () => {
    expect(swing.lifted).toMatch(
      /^Lifted from yggi\/music-commons contracts\/swing\/vectors\.json @ [0-9a-f]{7,40}$/,
    );
    expect([swing.contract, swing.version]).toEqual(['swing', 1]);
    expect(swing.vectors).toHaveLength(131);
  });

  it('leanMap places every step of every vector within 1e-9 of its onset', () => {
    for (const v of swing.vectors) {
      const map = leanMap(
        { sixteenth: leanOfShare(shareAt(v, '16n')), eighth: leanOfShare(shareAt(v, '8n')) },
        meterOf(v.groups),
      );
      const off = v.onsets.map((x, s) => Math.abs(map.played(s) - x));
      expect(Math.max(...off), `${v.name} ${JSON.stringify(v.swing)}`).toBeLessThan(1e-9);
    }
  });
});
