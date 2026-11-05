/**
 * The family's feel contract (yggi/music-commons `contracts/feel`, version 1,
 * minor 1), its copy the engine's (`packages/engine/fixtures/contracts/feel.json`)
 * with a first field, `lifted`, naming the hub and the commit it came from;
 * the hub's own `lifted`, what it lifted from this repository, is kept in the
 * copy as `hubLifted`, its one change.
 *
 * A feel vector is a bar's frame, the fields of a host's `bar` the performer
 * reads, cells' events in it, and each as played: `performCells` on a bar
 * made of the frame, its velocity and length. Cells' default performer is the
 * rule, and cells meets the same vectors itself (its `feel.test.ts`); this
 * holds Jambot's use of it, the frame read off a bar (`frameOf`).
 *
 * The minor 1 is the reading of a host's section text, which part and drum
 * role each of cells' events is, off the output cells names it by. Jambot's
 * reader is `lineOf` (`section-play.ts`); the vectors are the copy's `reading`.
 *
 * Every reading runs. One Jambot doesn't meet is recorded below with its
 * reason, and its run then shows it still differs, so a record that has gone
 * stale fails as surely as a reading newly missed.
 */
import { type BarEnv, type DrumRole, PRESETS, type SwingLevel } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import feelHub from '../../engine/fixtures/contracts/feel.json';
import { performCells } from './perform.ts';
import type { PitchedName } from './section-text.ts';
import { lineOf } from './section-play.ts';

interface Reading {
  readonly output: string;
  readonly reads: { readonly part: string; readonly role?: string } | null;
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
    readonly part: PitchedName | 'drums';
    readonly role?: DrumRole;
    readonly step: number;
    readonly note: number;
    readonly velocity: number;
    readonly length: number;
    readonly onset: number;
  }[];
  readonly played: readonly { readonly velocity: number; readonly length: number }[];
}
const feel = feelHub as unknown as {
  readonly lifted: string;
  readonly hubLifted: string;
  readonly contract: string;
  readonly version: number;
  readonly minor: number;
  readonly vectors: readonly FeelVector[];
  readonly reading: readonly Reading[];
};

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

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
    meter: {
      cycle: sum(frame.groups),
      heights: frame.groups.map((_, i) => sum(frame.groups.slice(0, i))),
    },
    plan: { section: { type: frame.section } },
    style: { ...style, ...frame.style },
    swing: frame.swing,
    barEnergy: frame.energy,
  } as unknown as BarEnv;
}

describe('the feel contract (yggi/music-commons contracts/feel, version 2: the own accent by the meter, yggi/music-commons#46)', () => {
  it('is the version Jambot passes, lifted with its source named, and the hub’s lift of this repository kept', () => {
    expect(feel.lifted).toMatch(
      /^Lifted from yggi\/music-commons contracts\/feel\/vectors\.json @ [0-9a-f]{7,40}$/,
    );
    expect(feel.hubLifted).toMatch(/^Lifted from yggi\/jambot @ [0-9a-f]{7}/);
    expect(feel.vectors).toHaveLength(256);
  });

  it('performCells plays every event of every bar at the vector’s velocity and length, equal', () => {
    let events = 0;
    for (const v of feel.vectors) {
      const bar = barOf(v);
      // (the onset is cells', which the feel never moves: the performer reads no onset)
      const played = v.events.map((event) => {
        const { velocity, length } = performCells(bar, event);
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

/** What `lineOf` reads an output as, in the contract's words: a part, and a drum's role. */
const read = (output: string) => {
  const { line, role } = lineOf(output);
  return line === 'drums' ? { part: line, role } : { part: line };
};

/**
 * The readings Jambot doesn't meet, each with why: the contract reads an
 * output that names no part of the feel's, or a drum role not among the
 * eight, as not the feel's (`null`), and `lineOf` reads every output as some
 * line. A host's text writes none of these (the contract, "A host's text …
 * writes none"), so no event Jambot plays meets one (#506).
 */
const RECORDED: Readonly<Record<string, string>> = {
  'kit:voices:shaker:12:1': 'lineOf reads any kit member as a drum, its role unchecked',
  'leadV:melo:9:1': 'lineOf reads any line a voice plays as a part, its name unchecked',
  'compV:compV:30:1': 'lineOf reads any line a voice plays as a part, its name unchecked',
  'drums:drums:14:1': 'lineOf reads the second field as the part, so the mix reads as the drums',
  bassV: 'lineOf reads an output with no line as a part named nothing',
};

describe('the feel contract’s reading (yggi/music-commons contracts/feel, version 1 minor 1’s, unchanged in version 2)', () => {
  it('is the minor the engine’s copy holds: 12 outputs the feel’s, 5 not', () => {
    expect([feel.contract, feel.version, feel.minor]).toEqual(['feel', 2, 0]);
    expect(feel.reading).toHaveLength(17);
    expect(feel.reading.filter((r) => r.reads === null)).toHaveLength(5);
  });

  it('lineOf reads every output as the contract does, but those recorded, which still differ', () => {
    for (const { output, reads } of feel.reading) {
      if (output in RECORDED) expect(read(output), output).not.toEqual(reads);
      else expect(read(output), output).toEqual(reads);
    }
    expect(Object.keys(RECORDED).filter((o) => !feel.reading.some((r) => r.output === o))).toEqual(
      [],
    );
  });
});
