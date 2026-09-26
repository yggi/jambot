import { describe, expect, it } from 'vitest';
import { type Machine, type Script, lawBreaks } from './machine.ts';
import { keyedRandom } from './random.ts';

interface Env {
  seed: number;
  bar: number;
}

/**
 * A lawful machine: a line that walks from its last note. The walk is read
 * from the seed and the bar, the last note is carried, and a nudge is heard.
 */
const walk: Machine<Env, { last: number }, { nudge: number }, number[]> = {
  initial: { last: 60 },
  advance(env, carried, input) {
    const by = Math.floor(keyedRandom(env.seed, env.bar) * 5) - 2 + input.nudge;
    const note = carried.last + by;
    return { carried: { last: note }, output: [carried.last, note] };
  },
};

const script: Script<Env, { nudge: number }> = [0, 1, 2, 3, 4, 5, 6, 7].map((bar) => ({
  env: { seed: 42, bar },
  input: { nudge: bar % 3 === 0 ? 1 : 0 },
}));

describe('lawBreaks', () => {
  it('finds none in a machine that reads, carries and writes in the open', () => {
    expect(lawBreaks(walk, script)).toEqual([]);
  });

  it('finds a machine that keeps state out of sight', () => {
    // Reported once per law, at the first advance that breaks it.
    let calls = 0;
    const hidden: Machine<Env, null, unknown, number> = {
      initial: null,
      advance: () => ({ carried: null, output: calls++ }),
    };
    expect(lawBreaks(hidden, script)).toEqual([
      'advance 0: the same inputs gave another output',
      'advance 0: advancing from a snapshot of the carried state gave another output',
    ]);
  });

  it('finds a machine whose randomness is not keyed', () => {
    const loose: Machine<Env, null, unknown, number> = {
      initial: null,
      advance: () => ({ carried: null, output: Math.random() }),
    };
    expect(lawBreaks(loose, script)).toContain('advance 0: the same inputs gave another output');
  });

  it('finds carried state that does not survive JSON', () => {
    const cases: [string, unknown][] = [
      ['a Map', new Map([[1, 2]])],
      ['an undefined field', { last: undefined }],
      ['NaN', { last: NaN }],
      ['−0', [-0]],
    ];
    for (const [what, carried] of cases) {
      const opaque: Machine<Env, unknown, unknown, null> = {
        initial: carried,
        advance: () => ({ carried, output: null }),
      };
      expect(lawBreaks(opaque, script), what).toContain(
        'before advance 0: the carried state does not survive JSON',
      );
    }
  });

  it('finds an output that is not plain data, and does not mistake it for hidden state', () => {
    // A Set is the same Set every run, but it is not data a snapshot, the
    // wire or a reader can take.
    const sets: Machine<Env, null, unknown, Set<number>> = {
      initial: null,
      advance: (env) => ({ carried: null, output: new Set([env.bar]) }),
    };
    expect(lawBreaks(sets, script)).toEqual(['advance 0: the output does not survive JSON']);
  });

  it('finds an environment or an input that is not plain data', () => {
    const reader: Machine<unknown, null, unknown, null> = {
      initial: null,
      advance: () => ({ carried: null, output: null }),
    };
    expect(lawBreaks(reader, [{ env: { lookup: new Map() }, input: null }])).toEqual([
      'advance 0: the environment does not survive JSON',
    ]);
    expect(lawBreaks(reader, [{ env: null, input: { at: new Date(0) } }])).toEqual([
      'advance 0: the input does not survive JSON',
    ]);
  });

  it('finds a machine that changes what it was given', () => {
    const inPlace: Machine<Env, { last: number }, unknown, null> = {
      initial: { last: 60 },
      advance(_env, carried) {
        carried.last++;
        return { carried, output: null };
      },
    };
    expect(lawBreaks(inPlace, script)).toContain('advance 0: advancing changed what it was given');
    const envWriter: Machine<Env, null, unknown, null> = {
      initial: null,
      advance(env) {
        env.bar = 99;
        return { carried: null, output: null };
      },
    };
    expect(
      lawBreaks(
        envWriter,
        script.map((s) => ({ ...s, env: { ...s.env } })),
      ),
    ).toContain('advance 0: advancing changed what it was given');
  });
});
