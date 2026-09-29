// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { EMPTY_PATTERN, Pattern, playedIn } from './pattern.ts';

describe('the pattern of the bar last finished', () => {
  it('shows nothing before any note', () => {
    expect(new Pattern().get()).toEqual({ bar: null, parts: EMPTY_PATTERN, motif: null });
  });

  it('fills in the bar now building before any bar has finished', () => {
    const pattern = new Pattern();
    pattern.push('drums', 0, { step: 0, note: 36, length: 1 });
    pattern.push('lead', 0, { step: 4, note: 64, length: 2 });
    expect(pattern.get().parts).toEqual({
      ...EMPTY_PATTERN,
      drums: [{ step: 0, note: 36, length: 1 }],
      lead: [{ step: 4, note: 64, length: 2 }],
    });
  });

  it('keeps a bar whole, across every track, once the next bar’s first note arrives', () => {
    const pattern = new Pattern();
    pattern.push('drums', 3, { step: 0, note: 36, length: 1 });
    pattern.push('bass', 3, { step: 0, note: 33, length: 4 });
    pattern.push('drums', 4, { step: 0, note: 38, length: 1 });
    expect(pattern.get().parts).toEqual({
      ...EMPTY_PATTERN,
      drums: [{ step: 0, note: 36, length: 1 }],
      bass: [{ step: 0, note: 33, length: 4 }],
    });
  });

  it('keeps every note of a bar, in the order given', () => {
    const pattern = new Pattern();
    pattern.push('lead', 0, { step: 0, note: 60, length: 4 });
    pattern.push('lead', 0, { step: 4, note: 64, length: 4 });
    pattern.push('lead', 1, { step: 0, note: 67, length: 4 });
    expect(pattern.get().parts.lead).toEqual([
      { step: 0, note: 60, length: 4 },
      { step: 4, note: 64, length: 4 },
    ]);
  });

  it('ignores a note of a bar earlier than the one building, arrived out of order', () => {
    const pattern = new Pattern();
    pattern.push('drums', 5, { step: 0, note: 36, length: 1 });
    pattern.push('drums', 4, { step: 8, note: 40, length: 1 });
    expect(pattern.get().parts.drums).toEqual([{ step: 0, note: 36, length: 1 }]);
  });

  it('names the bar it shows, counted from the song’s start', () => {
    const pattern = new Pattern();
    pattern.push('drums', 3, { step: 0, note: 36, length: 1 });
    expect(pattern.get().bar).toBe(3);
    pattern.push('drums', 4, { step: 0, note: 36, length: 1 });
    expect(pattern.get().bar).toBe(3);
    pattern.push('drums', 5, { step: 0, note: 36, length: 1 });
    expect(pattern.get().bar).toBe(4);
  });

  it('keeps the motif the lead played in the bar it shows: its source and the bar it was heard in', () => {
    const pattern = new Pattern();
    const offer = { source: 'the computer keys', bar: 1, motif: 'left behind', level: 90 };
    // A bar is composed a beat before its notes are scheduled.
    pattern.offered(3, offer);
    pattern.push('lead', 3, { step: 0, note: 69, length: 4 });
    expect(pattern.get().motif).toEqual({ source: 'the computer keys', bar: 1 });
    pattern.offered(4, null);
    pattern.push('lead', 4, { step: 0, note: 72, length: 4 });
    expect(pattern.get()).toMatchObject({ bar: 3, motif: { source: 'the computer keys', bar: 1 } });
    pattern.push('lead', 5, { step: 0, note: 72, length: 4 });
    expect(pattern.get()).toMatchObject({ bar: 4, motif: null });
  });

  it('keeps a bar’s own motif, not one offered for a bar after it', () => {
    const pattern = new Pattern();
    pattern.offered(3, { source: 'a', bar: 1 });
    pattern.offered(4, { source: 'b', bar: 2 });
    pattern.push('lead', 3, { step: 0, note: 69, length: 4 });
    pattern.push('lead', 4, { step: 0, note: 69, length: 4 });
    expect(pattern.get().motif).toEqual({ source: 'a', bar: 1 });
  });

  it('gives no motif for a bar none was offered for, such as one passed in a stall', () => {
    const pattern = new Pattern();
    pattern.push('lead', 3, { step: 0, note: 69, length: 4 });
    pattern.push('lead', 4, { step: 0, note: 69, length: 4 });
    expect(pattern.get().motif).toBeNull();
  });

  it('forgets everything once cleared', () => {
    const pattern = new Pattern();
    pattern.offered(0, { source: 'the computer keys', bar: 0 });
    pattern.push('lead', 0, { step: 0, note: 60, length: 1 });
    pattern.clear();
    expect(pattern.get()).toEqual({ bar: null, parts: EMPTY_PATTERN, motif: null });
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

  it('gives each source a row of its notes in the bar, on the step the Muse rounds them to', () => {
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
        { step: 0, note: 69, length: 4 },
        { step: 8, note: 72, length: 4 },
      ],
      'a MIDI port': [{ step: 4, note: 64, length: 4 }],
    });
  });

  it('counts a note in the bar its nearest step is in, as the Muse does', () => {
    const played = playedIn([note('keys', 47.6, 49), note('keys', 31.4, 33)], 2);
    expect(played).toEqual({});
    expect(playedIn([note('keys', 47.6, 49)], 3)).toEqual({
      keys: [{ step: 0, note: 60, length: 1 }],
    });
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
