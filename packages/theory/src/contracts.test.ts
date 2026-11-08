/**
 * The family's meter, euclid and notes contracts (yggi/music-commons
 * `contracts/meter` version 2, `contracts/euclid` and `contracts/notes`
 * version 1) run against the accents and the named meters, `even` and the note
 * reader and tuning: each of the hub's `vectors.json` is copied into
 * `fixtures/contracts/<name>.json` with a first field, `lifted`, naming the
 * hub and the commit it came from, and the hub's `README.md` for the
 * contract is the rule.
 *
 * A meter vector is a grouping in eighths, of 2s, 3s, 4s and 6s (version 2),
 * and each of its steps' levels and grades at 2 steps to the eighth;
 * `accentsOf` grades the eighths, with the contract's symbols, and a step
 * that starts no eighth is the contract's finest grade, `,`, below what it
 * grades. The names are the signatures the contract fixes, each to one
 * grouping, by rule since version 2.
 *
 * Every vector runs. One Jambot doesn't meet is recorded below with its
 * reason, and its run then shows it still differs, so a record that has gone
 * stale fails as surely as a vector newly missed.
 */
import { describe, expect, it } from 'vitest';
import euclidHub from '../fixtures/contracts/euclid.json';
import hub from '../fixtures/contracts/meter.json';
import notesHub from '../fixtures/contracts/notes.json';
import { accentLine, accentsOf } from './accents.ts';
import { even } from './even.ts';
import { type Meter, METERS, type MeterName } from './meter.ts';
import { parseNote } from './notes.ts';
import { frequencyOf } from './tuning.ts';

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

/** Whether a grouping is of 2s and 3s alone: a meter Jambot can be (T6: every pulse spans 2 or 3 eighths). */
const ofTwosAndThrees = (groups: readonly number[]) => groups.every((g) => g === 2 || g === 3);

/**
 * The groupings Jambot doesn't meet, by why: a group of 4 or 6 eighths (version 2) is two or three quarters, which
 * the contract grades with a tier of its own inside the group. Jambot's meters group eighths in 2s and 3s only (T6,
 * `meter.ts`), so `accentsOf` has no such tier, and no preset or meter query plays such a meter.
 */
const RECORDED_GROUPING =
  'a group of 4 or 6 eighths: Jambot groups eighths in 2s and 3s (T6), so its accents have no tier for the quarters inside one';

/**
 * A grouping of 2s and 3s deep enough for a fifth tier: seven groups, halved 4+3, the four halved again and each two
 * flat, so the contract marks those groups' starts `:`. `accentsOf` grades four tiers (`ACCENT_GRADES`), enough for
 * every meter Jambot names (at most five pulses), and gives them `.`; seven pulses is 7/4, a meter Jambot doesn't name.
 */
const RECORDED_DEEP: Readonly<Record<string, string>> = {
  '2+2+2+2+2+2+2':
    'seven pulses need a fifth tier, and accentsOf grades four: 7/4, which Jambot does not name',
};

/** The names Jambot doesn't have, by why: a meter it doesn't name (`MeterName`) is one no preset or meter query plays. */
const RECORDED_NAME = 'not a meter Jambot names (`MeterName`): no preset or meter query plays it';

describe('the meter contract (yggi/music-commons contracts/meter, version 2)', () => {
  it('is the version Jambot passes, lifted with its source named: every grouping to 12 eighths and each name past it', () => {
    expect(contract.lifted).toMatch(
      /^Lifted from yggi\/music-commons contracts\/meter\/vectors\.json @ [0-9a-f]{7,40}$/,
    );
    expect([contract.contract, contract.version, contract.stepsPerEighth]).toEqual(['meter', 2, 2]);
    expect(contract.vectors).toHaveLength(149);
  });

  it('accentsOf grades every eighth of every grouping of 2s and 3s as the contract does', () => {
    const met = contract.vectors.filter((v) => ofTwosAndThrees(v.groups));
    expect(met).toHaveLength(52);
    for (const v of met) {
      const grades = accentLine(meterOf(v.groups));
      if (v.groups.join('+') in RECORDED_DEEP)
        expect(grades, v.groups.join('+')).not.toBe(byEighth(v));
      else expect(grades, v.groups.join('+')).toBe(byEighth(v));
    }
  });

  it('…and a step between two eighths is the finest grade, below every one accentsOf gives', () => {
    for (const v of contract.vectors) {
      expect(
        [...v.grades].filter((_, s) => s % 2 === 1).every((g) => g === ','),
        v.groups.join('+'),
      ).toBe(true);
      expect(accentsOf(meterOf(v.groups))).toHaveLength(sum(v.groups));
    }
  });

  it(`a grouping with a 4 or a 6 is recorded (${RECORDED_GROUPING}), and still differs`, () => {
    const recorded = contract.vectors.filter((v) => !ofTwosAndThrees(v.groups));
    expect(recorded).toHaveLength(97);
    // (a record that has gone stale fails: each still grades otherwise, the quarters inside its group unmarked)
    for (const v of recorded)
      expect(accentLine(meterOf(v.groups)), v.groups.join('+')).not.toBe(byEighth(v));
  });

  it(`every name Jambot has is the grouping the contract names; the others are recorded (${RECORDED_NAME})`, () => {
    for (const [name, groups] of Object.entries(contract.names)) {
      const meter = METERS[name as MeterName] as Meter | undefined;
      if (meter) expect(groupsOf(meter), name).toEqual(groups);
    }
    expect(Object.keys(METERS).filter((name) => !(name in contract.names))).toEqual([]);
    expect(Object.keys(contract.names).filter((name) => !(name in METERS))).toEqual([
      '2/4',
      '6/4',
      '7/4',
      '9/4',
      '12/4',
      '2/2',
      '3/2',
      '4/2',
      '2/8',
      '3/8',
      '4/8',
      '8/8',
      '11/8',
      '13/8',
      '14/8',
      '15/8',
      '16/8',
    ]);
  });
});

interface Lifted<V> {
  readonly lifted: string;
  readonly contract: string;
  readonly version: number;
  readonly vectors: readonly V[];
}
const liftedFrom = (name: string) =>
  new RegExp(`^Lifted from yggi/music-commons contracts/${name}/vectors\\.json @ [0-9a-f]{7,40}$`);

const euclid = euclidHub as unknown as Lifted<{
  readonly k: number;
  readonly n: number;
  readonly even: readonly number[];
  readonly bjorklund: readonly number[];
  readonly offset: number;
}>;
/** A set's onsets, each within the bar, in order. */
const onsets = (k: number, n: number, turn = 0) =>
  even(k, n, turn)
    .heights.map((h) => ((h % n) + n) % n)
    .sort((a, b) => a - b);

describe('the euclid contract (yggi/music-commons contracts/euclid, version 1)', () => {
  it('is the version Jambot passes, lifted with its source named, every k ≤ n ≤ 16', () => {
    expect(euclid.lifted).toMatch(liftedFrom('euclid'));
    expect([euclid.contract, euclid.version]).toEqual(['euclid', 1]);
    expect(euclid.vectors).toHaveLength(152);
  });

  it('even(k, n) is the canonical set of every vector', () => {
    for (const v of euclid.vectors) expect(onsets(v.k, v.n), `${v.k} of ${v.n}`).toEqual(v.even);
  });

  it('a turn by t moves each onset j to (j + t) mod n, every turn of every vector', () => {
    for (const v of euclid.vectors)
      for (let t = 0; t < v.n; t++)
        expect(onsets(v.k, v.n, t), `${v.k} of ${v.n}, turned ${t}`).toEqual(
          v.even.map((j) => (j + t) % v.n).sort((a, b) => a - b),
        );
  });

  it('turned by its offset, even(k, n) is Bjorklund’s set: cells’ euclid(k, n, r) is even(k, n, r + offset)', () => {
    for (const v of euclid.vectors)
      expect(onsets(v.k, v.n, v.offset), `${v.k} of ${v.n}`).toEqual(v.bjorklund);
  });
});

const notes = notesHub as unknown as Lifted<{
  readonly midi: number;
  readonly pc: number;
  readonly octave: number;
  readonly sharp: string;
  readonly flat: string;
  readonly hz: number;
}>;

describe('the notes contract (yggi/music-commons contracts/notes, version 1)', () => {
  it('is the version Jambot passes, lifted with its source named, all 128 note numbers', () => {
    expect(notes.lifted).toMatch(liftedFrom('notes'));
    expect([notes.contract, notes.version]).toEqual(['notes', 1]);
    expect(notes.vectors).toHaveLength(128);
  });

  it('parseNote reads each plain name, sharp and flat, as its note number, pitch class and octave (C4 = 60)', () => {
    for (const v of notes.vectors)
      for (const name of [v.sharp, v.flat])
        expect(parseNote(name), name).toMatchObject({
          midi: v.midi,
          pitchClass: v.pc,
          octave: v.octave,
        });
  });

  it('frequencyOf gives each note number’s frequency at A4 = 440, within 0.001 Hz', () => {
    for (const v of notes.vectors)
      expect(Math.abs(frequencyOf(v.midi) - v.hz), String(v.midi)).toBeLessThan(0.001);
  });
});
