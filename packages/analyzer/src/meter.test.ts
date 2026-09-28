import { describe, expect, it } from 'vitest';
import { meterSpans } from './meter.ts';

describe('meterSpans', () => {
  it('defaults to 4/4 from tick 0 when the file states no time signature', () => {
    expect(meterSpans([], 1000)).toEqual([
      { startTicks: 0, endTicks: 1000, numerator: 4, denominator: 4, isFourFour: true },
    ]);
  });

  it('marks every span but 4/4 as not four-four, and reports its numerator and denominator', () => {
    const spans = meterSpans(
      [
        { ticks: 0, numerator: 4, denominator: 4 },
        { ticks: 400, numerator: 7, denominator: 8 },
      ],
      800,
    );
    expect(spans).toEqual([
      { startTicks: 0, endTicks: 400, numerator: 4, denominator: 4, isFourFour: true },
      { startTicks: 400, endTicks: 800, numerator: 7, denominator: 8, isFourFour: false },
    ]);
  });

  it('takes the later event where the file repeats a tick', () => {
    const spans = meterSpans(
      [
        { ticks: 0, numerator: 4, denominator: 4 },
        { ticks: 0, numerator: 3, denominator: 4 },
      ],
      100,
    );
    expect(spans).toEqual([
      { startTicks: 0, endTicks: 100, numerator: 3, denominator: 4, isFourFour: false },
    ]);
  });

  it('ends the last span at the file, even where no note reaches back to it', () => {
    const spans = meterSpans([{ ticks: 0, numerator: 4, denominator: 4 }], 0);
    expect(spans).toEqual([
      { startTicks: 0, endTicks: 0, numerator: 4, denominator: 4, isFourFour: true },
    ]);
  });
});
