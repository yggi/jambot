/**
 * The family's meter contract (yggi/music-commons `contracts/meter`, version
 * 1) run against the accents and the named meters: the hub's `vectors.json`
 * is copied into `fixtures/contracts/meter.json` with a first field,
 * `lifted`, naming the hub and the commit it came from, and the hub's
 * `README.md` for the contract is the rule.
 *
 * A vector is a grouping of 2s and 3s in eighths and each of its steps'
 * levels at 2 steps to the eighth; `accentsOf` grades the eighths, with the
 * contract's symbols for levels 0 to 3 (a step that starts no eighth, level
 * 4, is below what it grades). The names are the signatures the contract
 * fixes, each to one grouping.
 *
 * Every vector runs. One Jambot doesn't meet is recorded below with its
 * reason, and its run then shows it still differs, so a record that has gone
 * stale fails as surely as a vector newly missed.
 */
import { describe, expect, it } from 'vitest';
import hub from '../fixtures/contracts/meter.json';
import { accentLine, accentsOf } from './accents.ts';
import { type Meter, METERS, type MeterName } from './meter.ts';

interface Vector {
  readonly groups: readonly number[];
  readonly levels: readonly number[];
  readonly grades: string;
}

const contract = hub as unknown as {
  readonly lifted: string;
  readonly contract: string;
  readonly version: number;
  readonly stepsPerEighth: number;
  readonly names: Readonly<Record<string, readonly number[]>>;
  readonly vectors: readonly Vector[];
};

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
/** A grouping as a meter: its eighths, each group's first a pulse. */
const meterOf = (groups: readonly number[]): Meter => ({
  cycle: sum(groups),
  heights: groups.map((_, i) => sum(groups.slice(0, i))),
});
/** A meter's grouping: the spans between its pulses. */
const groupsOf = ({ cycle, heights }: Meter) =>
  heights.map((h, i) => (heights[i + 1] ?? cycle) - h);
/** A vector's grades an eighth at a time, spaced, as `accentLine` writes them. */
const byEighth = (v: Vector) => [...v.grades].filter((_, s) => s % 2 === 0).join(' ');

/** The names Jambot doesn't meet, each with why. */
const RECORDED: Readonly<Record<string, string>> = {
  '2/4': 'not a meter Jambot names (`MeterName`): no preset or meter query plays it',
};

describe('the meter contract (yggi/music-commons contracts/meter, version 1)', () => {
  it('is the version Jambot passes, lifted with its source named, every grouping from 2 to 12 eighths', () => {
    expect(contract.lifted).toMatch(
      /^Lifted from yggi\/music-commons contracts\/meter\/vectors\.json @ [0-9a-f]{7,40}$/,
    );
    expect([contract.contract, contract.version, contract.stepsPerEighth]).toEqual(['meter', 1, 2]);
    expect(contract.vectors).toHaveLength(47);
  });

  it('accentsOf grades every eighth of every grouping as the contract does', () => {
    for (const v of contract.vectors)
      expect(accentLine(meterOf(v.groups)), v.groups.join('+')).toBe(byEighth(v));
  });

  it('…and a step between two eighths is below every grade: the contract gives it level 4', () => {
    for (const v of contract.vectors) {
      expect(v.levels.filter((_, s) => s % 2 === 1).every((l) => l === 4)).toBe(true);
      expect(accentsOf(meterOf(v.groups))).toHaveLength(sum(v.groups));
    }
  });

  it('every name Jambot has is the grouping the contract names', () => {
    for (const [name, groups] of Object.entries(contract.names)) {
      const meter = METERS[name as MeterName] as Meter | undefined;
      if (name in RECORDED) expect(meter, name).toBeUndefined();
      else expect(meter && groupsOf(meter), name).toEqual(groups);
    }
    expect(Object.keys(METERS).filter((name) => !(name in contract.names))).toEqual([]);
  });
});
