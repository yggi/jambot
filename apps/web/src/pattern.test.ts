import { describe, expect, it } from 'vitest';
import { EMPTY_PATTERN, Pattern } from './pattern.ts';

describe('the pattern of the bar last finished', () => {
  it('shows nothing before any note', () => {
    expect(new Pattern().get()).toEqual(EMPTY_PATTERN);
  });

  it('fills in the bar now building before any bar has finished', () => {
    const pattern = new Pattern();
    pattern.push('drums', 0, { step: 0, note: 36, length: 1 });
    pattern.push('lead', 0, { step: 4, note: 64, length: 2 });
    expect(pattern.get()).toEqual({
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
    expect(pattern.get()).toEqual({
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
    expect(pattern.get().lead).toEqual([
      { step: 0, note: 60, length: 4 },
      { step: 4, note: 64, length: 4 },
    ]);
  });

  it('ignores a note of a bar earlier than the one building, arrived out of order', () => {
    const pattern = new Pattern();
    pattern.push('drums', 5, { step: 0, note: 36, length: 1 });
    pattern.push('drums', 4, { step: 8, note: 40, length: 1 });
    expect(pattern.get().drums).toEqual([{ step: 0, note: 36, length: 1 }]);
  });

  it('forgets everything once cleared', () => {
    const pattern = new Pattern();
    pattern.push('lead', 0, { step: 0, note: 60, length: 1 });
    pattern.clear();
    expect(pattern.get()).toEqual(EMPTY_PATTERN);
  });
});
