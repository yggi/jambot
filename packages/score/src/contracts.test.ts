/**
 * The family's feel contract (yggi/music-commons `contracts/feel`, version 3),
 * its copy the engine's (`packages/engine/fixtures/contracts/feel.json`)
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
 * Version 3 changes only the reading, which part and drum role each of
 * cells' events is: the `part=` and `role=` its text declares, never a name
 * (yggi/cells decision 075). Its cases are the copy's `reading`, each a cells
 * text and how each of its lines reads; Jambot's reader is `lineOf`
 * (`section-play.ts`), given the text compiled.
 *
 * Every reading runs, and Jambot meets each: a line whose text declares
 * none of the feel's parts or roles reads as none (#506).
 */
import { type BarEnv, type DrumRole, PRESETS, type SwingLevel } from '@jambot/engine';
import { planOf } from '@yggi/cells';
import { readerOf } from '@yggi/cells/engine/perform/feel';
import { resolveSeed } from '@yggi/cells/repository/library';
import { describe, expect, it } from 'vitest';
import feelHub from '../../engine/fixtures/contracts/feel.json';
import { performCells } from './perform.ts';
import type { PitchedName } from './section-text.ts';
import { type NoteLine, lineReader } from './section-play.ts';

interface Reading {
  readonly says: string;
  readonly text: readonly string[];
  readonly reads: Readonly<
    Record<string, { readonly part: string; readonly role?: string } | null>
  >;
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

describe('the feel contract (yggi/music-commons contracts/feel, version 3: version 2’s playing, the own accent by the meter, yggi/music-commons#46)', () => {
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

/** What `lineOf` reads an output as, in the contract's words: a part, and a drum's role; `null` where it is none of the feel's. */
const read = (line: NoteLine | null) =>
  line === null
    ? null
    : line.line === 'drums'
      ? { part: line.line, role: line.role }
      : { part: line.line };

/**
 * The line an output plays, as its id says: a kit's member its third field, else its second, the name before any
 * operator (`bassline^$-12`). The contract looks that line up as a cell; it names the case's line, not its part.
 */
const lineName = (id: string) => {
  const [first, second, third] = id.split(':');
  return first === 'kit' && second === 'voices'
    ? third
    : /^[A-Za-z_][A-Za-z0-9_]*/.exec(second ?? '')?.[0];
};

/**
 * Each line of each case as `lineOf` reads it, given the case's text compiled (`planOf`, as the host compiles a
 * section's), one reading per output the line plays, keyed `<says>: &<line>`.
 */
const readings = (reader: typeof lineReader = lineReader) =>
  feel.reading.flatMap(({ says, text, reads }) => {
    const plan = planOf(text.join('\n'), undefined, { resolve: resolveSeed });
    const lineAt = reader(plan.result);
    return Object.entries(reads).map(([line, expected]) => ({
      name: `${says}: &${line}`,
      diagnostics: plan.result.diagnostics.map((d) => d.message),
      read: plan.result.outputs
        .filter((o) => lineName(o.id) === line)
        .map((o) => read(lineAt(o.id))),
      expected,
    }));
  });

/**
 * `lineOf` as it read until #615's ruling (2026-11-13): what the text declares (`readerOf`), else the output by its
 * name, a kit's member the drums, its role the line's name, else the part the line's name.
 */
const byName: typeof lineReader = (result) => {
  const read = readerOf(result);
  return (output) => {
    const reading = read(output);
    if (reading) return { line: reading.part, ...(reading.role ? { role: reading.role } : {}) };
    const [first, second, third] = (output ?? '').split(':');
    if (first === 'kit') return { line: 'drums', role: third as DrumRole };
    return { line: second as PitchedName };
  };
};

describe('the feel contract’s reading (yggi/music-commons contracts/feel, version 3: by part= and role=, never a name, yggi/cells decision 075)', () => {
  it('is the version the engine’s copy holds: 10 cases, 11 lines, 5 read as not the feel’s', () => {
    expect([feel.contract, feel.version, feel.minor]).toEqual(['feel', 3, 0]);
    expect(feel.reading).toHaveLength(10);
    const all = feel.reading.flatMap((c) => Object.values(c.reads));
    expect(all).toHaveLength(11);
    expect(all.filter((r) => r === null)).toHaveLength(5);
  });

  it('lineOf reads every line of every case as the contract does: 11 of 11', () => {
    const all = readings();
    for (const { name, diagnostics, read, expected } of all) {
      expect(diagnostics, name).toEqual([]);
      expect(read.length, name).toBeGreaterThan(0);
      for (const r of read) expect(r, name).toEqual(expected);
    }
    expect(all).toHaveLength(11);
  });

  it('is shown firing: a reading turned over, or a line read by its name, is caught', () => {
    const all = readings();
    const named = (name: string) => all.find((r) => r.name === name)!;
    // (a met line read as another part would fail its expectation)
    const declared = named('a line declares its part: &low');
    expect(declared.read).toEqual([{ part: 'bass' }]);
    expect(declared.read).not.toContainEqual({ part: 'lead' });
    // (a line that declares nothing reads as none of the feel's: read by its name, as before #615's ruling, it would be a part)
    expect(named('a line named as a part declares none: no part: &bass').read).toEqual([null]);
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    const misread = readings(byName).filter((r) => r.read.some((x) => !same(x, r.expected)));
    expect(misread.map((r) => [r.name, r.read])).toEqual([
      ['a line named as a part declares none: no part: &bass', [{ part: 'bass' }]],
      ['a role cell named as a part declares none: no part: &line', [{ part: 'line' }]],
      [
        'a drum line named as a role declares none: no role: &kick',
        [{ part: 'drums', role: 'kick' }],
      ],
      ["a role not the feel's: &s", [{ part: 'drums', role: 's' }]],
      ["a pitched line's part=drums: the drums are read by a role: &low", [{ part: 'low' }]],
    ]);
  });
});
