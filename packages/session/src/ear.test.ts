import { type HeardNote, type Key, judgeBar } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { EAR, EAR_AFTER, earListen } from './ear.ts';
import { PLAYED_MOST } from './protocol.ts';

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

/** Kick and snare on the beats of `bar`, struck on the pads, each a little late. */
const beats = (bar: number, source = 'the drum pads'): HeardNote[] =>
  [36, 38, 36, 38].map((note, i) => ({
    note,
    velocity: 100,
    source,
    position: 16 * bar + 4 * i + 0.3,
    end: null,
  }));

describe("a client's ear for drums (#410)", () => {
  it('passes each bar’s drum notes on a beat after the bar ends, as heard, one bar a message', () => {
    const drums = [...beats(2), ...beats(3, 'a MIDI port')];
    const early = earListen(EAR, [], 3 * 16 + EAR_AFTER - 0.01, keys([]), undefined, drums);
    expect(early.played).toEqual([]);
    const due = earListen(early.carried, [], 4 * 16 + EAR_AFTER, keys([]));
    expect(due.played).toEqual([
      { part: 'drums', bar: 2, notes: beats(2) },
      { part: 'drums', bar: 3, notes: beats(3, 'a MIDI port') },
    ]);
    // Passed once: nothing more comes of them.
    expect(earListen(due.carried, [], 10 * 16, keys([])).played).toEqual([]);
  });

  it('passes a bar’s drums whether or not it judges the bar, and none for a bar nobody struck', () => {
    const { judged, played } = earListen(EAR, phrase(1), 6 * 16, keys([1]), undefined, [
      ...beats(1),
      ...beats(4),
    ]);
    expect(judged.map((j) => j.bar)).toEqual([1]);
    expect(played.map((p) => p.bar)).toEqual([1, 4]);
  });

  it(`passes at most ${PLAYED_MOST} notes of a bar, the earliest`, () => {
    const many: HeardNote[] = [...Array(PLAYED_MOST + 10).keys()].map((i) => ({
      note: 42,
      velocity: 60,
      source: 'the drum pads',
      position: 16 + i * (15 / (PLAYED_MOST + 10)),
      end: null,
    }));
    const { played } = earListen(EAR, [], 3 * 16, keys([]), undefined, many.toReversed());
    expect(played).toEqual([{ part: 'drums', bar: 1, notes: many.slice(0, PLAYED_MOST) }]);
  });

  it('drops a drum note heard for a bar it has passed on already', () => {
    const first = earListen(EAR, [], 3 * 16 + EAR_AFTER, keys([]), undefined, beats(2));
    expect(first.played.map((p) => p.bar)).toEqual([2]);
    const late = earListen(first.carried, [], 5 * 16 + EAR_AFTER, keys([]), undefined, [
      ...beats(2),
      ...beats(4),
    ]);
    expect(late.played).toEqual([{ part: 'drums', bar: 4, notes: beats(4) }]);
  });

  it('passes on, as the part bass, a bar its players played wholly in the bass’s register, whether or not it judges the bar (#423)', () => {
    const low = phrase(1).map((n) => ({ ...n, note: n.note - 36 }));
    const { played } = earListen(EAR, [...low, ...phrase(1, 'Bo')], 2 * 16 + EAR_AFTER, keys([]));
    expect(played).toEqual([{ part: 'bass', bar: 1, notes: low }]);
    // a source with a note above the bass's top passes nothing on as a bass
    const mixed = [...low.slice(0, 2), { ...low[2]!, note: 58 }];
    expect(earListen(EAR, mixed, 2 * 16 + EAR_AFTER, keys([1])).played).toEqual([]);
  });
});
