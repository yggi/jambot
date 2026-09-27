import { type HeardNote, type Key, judgeBar } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { EAR, EAR_AFTER, earListen } from './ear.ts';

const A_MINOR: Key = { tonic: 9, mode: 'aeolian' };
const keys = (bars: number[]) => (bar: number) => (bars.includes(bar) ? A_MINOR : undefined);

/** Three notes in `bar`, on its steps 0, 4 and 8, each a little late. */
const phrase = (bar: number, source = 'the computer keys'): HeardNote[] =>
  [69, 72, 76].map((note, i) => ({
    note,
    velocity: 100,
    source,
    position: 16 * bar + 4 * i + 0.3,
    end: null,
  }));

describe("a client's ear", () => {
  it('judges a bar a beat after it ends, as the host would judge it', () => {
    const notes = [...phrase(2), ...phrase(2, 'a MIDI port')];
    const early = earListen(EAR, notes, 3 * 16 + EAR_AFTER - 0.01, keys([2]));
    expect(early.judged).toEqual([]);
    const due = earListen(early.carried, [], 3 * 16 + EAR_AFTER, keys([2]));
    expect(due.judged).toEqual(
      judgeBar(notes, 2, A_MINOR).map((judgement) => ({ bar: 2, judgement })),
    );
    expect(due.judged).toHaveLength(2);
    // Judged once: nothing more comes of it.
    expect(earListen(due.carried, [], 10 * 16, keys([2])).judged).toEqual([]);
  });

  it('judges a note played just before a bar in that bar, where it is heard', () => {
    const late: HeardNote = { ...phrase(4)[0]!, position: 16 * 4 - 0.3 };
    const { judged } = earListen(
      EAR,
      [late, ...phrase(4).slice(1), phrase(4)[0]!],
      6 * 16,
      keys([3, 4]),
    );
    expect(judged.map((j) => j.bar)).toEqual([4]);
  });

  it('judges each bar in turn, and none it has no key for', () => {
    const notes = [...phrase(1), ...phrase(2), ...phrase(3)];
    const { judged } = earListen(EAR, notes, 5 * 16, keys([1, 3]));
    expect(judged.map((j) => j.bar)).toEqual([1, 3]);
  });
});
