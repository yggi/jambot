/**
 * The family's swing and feel contracts (yggi/music-commons
 * `contracts/swing` and `contracts/feel`, version 1) run against the time
 * maps and the performer: each hub `vectors.json` is copied into
 * `fixtures/contracts/` with a first field, `lifted`, naming the hub and the
 * commit it came from, and the hub's `README.md` for each contract is the
 * rule. The hub's own `lifted` of the feel, what it lifted from this
 * repository, is kept in the copy as `hubLifted`, its one change.
 *
 * A swing vector is a grouping in eighths, its levels and shares, and where
 * each of its steps plays: `leanMap` over the grouping, a lean a level
 * (`leanOfShare`). A feel vector is a bar's frame, the fields of a host's
 * `bar` the performer reads, cells' events in it, and each as played:
 * `performStated` on a bar made of the frame, its velocity and length.
 *
 * Every vector runs, and Jambot meets each: the feel's are its own
 * performer's playing, lifted.
 */
import { describe, expect, it } from 'vitest';
import feelHub from '../fixtures/contracts/feel.json';
import swingHub from '../fixtures/contracts/swing.json';
import type { BarEnv } from './bar.ts';
import type { DrumRole, Part } from './events.ts';
import { performStated } from './performer.ts';
import { PRESETS } from './style.ts';
import { type SwingLevel, leanMap, leanOfShare } from './swing.ts';

interface SwingVector {
  readonly name: string;
  readonly groups: readonly number[];
  readonly swing: readonly { readonly level: SwingLevel; readonly share: number }[];
  readonly onsets: readonly number[];
}

interface FeelVector {
  readonly preset: string;
  readonly meter: string;
  readonly frame: {
    readonly seed: number;
    readonly bar: number;
    readonly groups: readonly number[];
    readonly section: string;
    readonly style: { readonly entropy: number; readonly artic: number; readonly sync: number };
    readonly swing: { readonly level: SwingLevel; readonly share: number };
    readonly energy: number;
  };
  readonly events: readonly {
    readonly part: Part;
    readonly role?: DrumRole;
    readonly step: number;
    readonly note: number;
    readonly velocity: number;
    readonly length: number;
    readonly onset: number;
  }[];
  readonly played: readonly { readonly velocity: number; readonly length: number }[];
}

interface Contract<V> {
  readonly lifted: string;
  readonly contract: string;
  readonly version: number;
  readonly vectors: readonly V[];
}
const swing = swingHub as unknown as Contract<SwingVector>;
const feel = feelHub as unknown as Contract<FeelVector> & { readonly hubLifted: string };

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
/** A grouping as a meter: its eighths, each group's first a pulse. */
const meterOf = (groups: readonly number[]) => ({
  cycle: sum(groups),
  heights: groups.map((_, i) => sum(groups.slice(0, i))),
});
const shareAt = (v: SwingVector, level: SwingLevel) =>
  v.swing.find((s) => s.level === level)?.share ?? 0.5;

/**
 * A bar made of a feel vector's frame: what the performer reads of it, the
 * rest of the style the preset's (the timbre reads it, which the contract
 * doesn't fix).
 */
function barOf({ preset, frame }: FeelVector): BarEnv {
  const style = PRESETS.find((p) => p.name === preset)!.style;
  return {
    seed: frame.seed,
    bar: frame.bar,
    meter: meterOf(frame.groups),
    plan: { section: { type: frame.section } },
    style: { ...style, ...frame.style },
    swing: frame.swing,
    barEnergy: frame.energy,
  } as unknown as BarEnv;
}

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

describe('the feel contract (yggi/music-commons contracts/feel, version 1)', () => {
  it('is the version Jambot passes, lifted with its source named, and the hub’s lift of this repository kept', () => {
    expect(feel.lifted).toMatch(
      /^Lifted from yggi\/music-commons contracts\/feel\/vectors\.json @ [0-9a-f]{7,40}$/,
    );
    expect(feel.hubLifted).toMatch(/^Lifted from yggi\/jambot @ [0-9a-f]{7}/);
    expect([feel.contract, feel.version]).toEqual(['feel', 1]);
    expect(feel.vectors).toHaveLength(256);
  });

  it('performStated plays every event of every bar at the vector’s velocity and length, equal', () => {
    let events = 0;
    for (const v of feel.vectors) {
      const bar = barOf(v);
      // (the onset is cells', which the feel never moves: the performer reads no onset)
      const played = v.events.map((event) => {
        const { velocity, length } = performStated(bar, event);
        return { velocity, length };
      });
      expect(played, `${v.preset} ${v.meter} seed ${v.frame.seed} bar ${v.frame.bar}`).toEqual(
        v.played,
      );
      events += played.length;
    }
    expect(events).toBe(7140);
  });
});
