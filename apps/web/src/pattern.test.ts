// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { INITIAL_STYLE, band, barStart, heardInBar, heardStep } from '@jambot/engine';
import {
  EMPTY_PATTERN,
  PATTERN_BARS,
  Pattern,
  type PatternNote,
  patternBarOf,
  playedIn,
} from './pattern.ts';
import { performerOf } from './sounding.ts';

describe('the pattern of the last bars', () => {
  const at = (pattern: Pattern, bar: number) => pattern.get().find((b) => b.bar === bar);

  it('shows nothing before any note', () => {
    expect(new Pattern().get()).toEqual([]);
  });

  it('fills in the bar now building, as its notes are scheduled', () => {
    const pattern = new Pattern();
    pattern.push('drums', 0, { step: 0, note: 36, length: 1 });
    pattern.push('lead', 0, { step: 4, note: 64, length: 2 });
    expect(pattern.get()).toEqual([
      {
        bar: 0,
        parts: {
          ...EMPTY_PATTERN,
          drums: [{ step: 0, note: 36, length: 1 }],
          lead: [{ step: 4, note: 64, length: 2 }],
        },
        motif: null,
      },
    ]);
  });

  it('keeps the last bars in order, each whole across every track, the one building last', () => {
    const pattern = new Pattern();
    for (let bar = 0; bar < 9; bar++) {
      pattern.push('drums', bar, { step: 0, note: 36, length: 1 });
      pattern.push('bass', bar, { step: 0, note: 33 + bar, length: 4 });
      pattern.push('drums', bar, { step: 8, note: 38, length: 1 });
    }
    const bars = pattern.get();
    expect(bars.map((b) => b.bar)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(bars).toHaveLength(PATTERN_BARS + 1);
    for (const b of bars)
      expect(b.parts).toEqual({
        ...EMPTY_PATTERN,
        drums: [
          { step: 0, note: 36, length: 1 },
          { step: 8, note: 38, length: 1 },
        ],
        bass: [{ step: 0, note: 33 + b.bar, length: 4 }],
      });
  });

  it('keeps a bar only while it is one of the last, however many bars were silent', () => {
    const pattern = new Pattern();
    pattern.push('drums', 3, { step: 0, note: 36, length: 1 });
    pattern.push('drums', 5, { step: 0, note: 36, length: 1 });
    expect(pattern.get().map((b) => b.bar)).toEqual([3, 5]);
    pattern.push('drums', 3 + PATTERN_BARS + 1, { step: 0, note: 36, length: 1 });
    expect(pattern.get().map((b) => b.bar)).toEqual([5, 3 + PATTERN_BARS + 1]);
  });

  it('ignores a note of a bar earlier than the one building, arrived out of order', () => {
    const pattern = new Pattern();
    pattern.push('drums', 5, { step: 0, note: 36, length: 1 });
    pattern.push('drums', 4, { step: 8, note: 40, length: 1 });
    expect(pattern.get()).toEqual([
      {
        bar: 5,
        parts: { ...EMPTY_PATTERN, drums: [{ step: 0, note: 36, length: 1 }] },
        motif: null,
      },
    ]);
  });

  it('keeps the motif the lead played in each bar: its source and the bar it was heard in', () => {
    const pattern = new Pattern();
    const offer = { source: 'the computer keys', bar: 1, motif: 'left behind', level: 90 };
    // A bar is composed a beat before its notes are scheduled.
    pattern.offered(3, offer);
    pattern.push('lead', 3, { step: 0, note: 69, length: 4 });
    expect(at(pattern, 3)!.motif).toEqual({ source: 'the computer keys', bar: 1 });
    pattern.offered(4, null);
    pattern.push('lead', 4, { step: 0, note: 72, length: 4 });
    expect(pattern.get().map((b) => b.motif)).toEqual([
      { source: 'the computer keys', bar: 1 },
      null,
    ]);
  });

  it('keeps a bar’s own motif, not one offered for a bar after it', () => {
    const pattern = new Pattern();
    pattern.offered(3, { source: 'a', bar: 1 });
    pattern.offered(4, { source: 'b', bar: 2 });
    pattern.push('lead', 3, { step: 0, note: 69, length: 4 });
    pattern.push('lead', 4, { step: 0, note: 69, length: 4 });
    expect(pattern.get().map((b) => b.motif)).toEqual([
      { source: 'a', bar: 1 },
      { source: 'b', bar: 2 },
    ]);
  });

  it('gives no motif for a bar none was offered for, such as one passed in a stall', () => {
    const pattern = new Pattern();
    pattern.push('lead', 3, { step: 0, note: 69, length: 4 });
    expect(at(pattern, 3)!.motif).toBeNull();
  });

  it('forgets everything once cleared', () => {
    const pattern = new Pattern();
    pattern.offered(0, { source: 'the computer keys', bar: 0 });
    pattern.push('lead', 0, { step: 0, note: 60, length: 1 });
    pattern.clear();
    expect(pattern.get()).toEqual([]);
    pattern.push('lead', 0, { step: 0, note: 60, length: 1 });
    expect(at(pattern, 0)!.motif).toBeNull();
  });
});

describe('what the players played in a bar', () => {
  const note = (source: string, position: number, end: number | null, n = 60) => ({
    part: 'lead' as const,
    note: n,
    velocity: 100,
    source,
    position,
    end,
  });

  it('gives each source a row of its notes in the bar, on the step the Muse reads them on, and as long as she reads them', () => {
    const played = playedIn(
      [
        note('the computer keys', 32.4, 35.6, 69),
        note('a MIDI port', 36.2, 40, 64),
        note('the computer keys', 39.5, 44, 72),
      ],
      2,
    );
    expect(played).toEqual({
      'the computer keys': [
        { step: 0, note: 69, length: 8 },
        { step: 8, note: 72, length: 8 },
      ],
      'a MIDI port': [{ step: 4, note: 64, length: 4 }],
    });
  });

  it('counts a note in the bar the Muse reads it into', () => {
    expect(playedIn([note('keys', 47.6, 49)], 2)).toEqual({});
    expect(playedIn([note('keys', 47.6, 49)], 3)).toEqual({
      keys: [{ step: 0, note: 60, length: 1 }],
    });
    expect(playedIn([note('keys', 31.4, 33)], 2)).toEqual({});
    expect(playedIn([note('keys', 31.4, 33)], 1)).toEqual({
      keys: [{ step: 15, note: 60, length: 1 }],
    });
  });

  it('shows what the Muse judges: every note of a lane is a note of the motif she takes from it', () => {
    let x = 11;
    const draw = () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 2 ** 32;
    for (let trial = 0; trial < 80; trial++) {
      const notes = Array.from({ length: 4 + Math.floor(draw() * 6) }, () =>
        note(
          draw() < 0.6 ? 'a' : 'b',
          30 + draw() * 40,
          draw() < 0.5 ? null : 30 + draw() * 40,
          60 + Math.floor(draw() * 12),
        ),
      );
      const bar = 2;
      const rows = playedIn(notes, bar);
      const heard = heardInBar(notes, bar);
      expect(Object.keys(rows).sort()).toEqual(heard.map((h) => h.source).sort());
      for (const { source, notes: read } of heard)
        expect(rows[source]!.map((n) => n.step)).toEqual(
          read.map((n) => heardStep(n) - barStart(bar)),
        );
    }
  });

  it('holds a note still sounding, or released on the step it struck, for one step', () => {
    expect(playedIn([note('keys', 32, null), note('keys', 36, 36.2)], 2)).toEqual({
      keys: [
        { step: 0, note: 60, length: 1 },
        { step: 4, note: 60, length: 1 },
      ],
    });
  });
});

describe('a bar composed, drawn as the tracks draw it', () => {
  it('puts each note under its performer, on its step, and names the motif the lead plays', () => {
    const composed = band.advance(
      {
        seed: 3,
        bar: 0,
        style: INITIAL_STYLE,
        wish: { tonic: null, mode: 'aeolian', melodic: null },
        offer: null,
      },
      band.initial,
      null,
    ).output;
    const bar = patternBarOf(composed);
    expect(bar.bar).toBe(0);
    expect(bar.motif).toBeNull();
    const count = (Object.values(bar.parts) as PatternNote[][]).reduce(
      (n, notes) => n + notes.length,
      0,
    );
    expect(count).toBe(composed.dough.length);
    for (const note of composed.dough)
      expect(bar.parts[performerOf(note.part)]).toContainEqual({
        step: note.step,
        note: note.note,
        length: note.length,
      });
  });
});
