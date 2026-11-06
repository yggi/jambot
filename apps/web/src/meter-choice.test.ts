import { clockOf, sameMeter } from '@jambot/engine';
import { METERS, type MeterName, gaps, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { METER_CHOICES, meterLabel, meterNudged } from './meter-choice.ts';

describe('the meters on offer', () => {
  it('holds every named meter, in order, and names it as it is named', () => {
    const named = METER_CHOICES.filter((c) =>
      Object.values(METERS).some((m) => sameMeter(m, c.meter)),
    );
    expect(named.map((c) => c.text)).toEqual(Object.keys(METERS));
    for (const name of Object.keys(METERS) as MeterName[])
      expect(meterLabel(METERS[name])).toBe(name);
  });

  it('offers the other groupings of 5/8 and 7/8, and of no equal-pulsed meter', () => {
    const texts = METER_CHOICES.map((c) => c.text);
    expect(texts).toContain('5/8 2+3');
    expect(texts).toContain('7/8 2+2+3');
    expect(texts).toContain('7/8 2+3+2');
    expect(texts.filter((t) => t.startsWith('7/8'))).toHaveLength(3);
    expect(texts.filter((t) => t.startsWith('5/8'))).toHaveLength(2);
    expect(texts.filter((t) => /^(3\/4|4\/4|5\/4|6\/8|9\/8|12\/8|10\/8)\s/.test(t))).toEqual([]);
  });

  it('is a set of distinct meters, each a bar the clock reads from its downbeat (finite: every choice)', () => {
    expect(new Set(METER_CHOICES.map((c) => c.text)).size).toBe(METER_CHOICES.length);
    for (const { text, meter } of METER_CHOICES) {
      expect([text, meter.heights[0]]).toEqual([text, 0]);
      const clock = clockOf([{ bar: 0, meter }]);
      expect([text, clock.barSteps(0), clock.barSteps(3)]).toEqual([
        text,
        stepsOf(meter),
        stepsOf(meter),
      ]);
    }
    for (const [i, a] of METER_CHOICES.entries())
      for (const b of METER_CHOICES.slice(i + 1)) expect(sameMeter(a.meter, b.meter)).toBe(false);
  });

  it('regroups a bar without changing its length or its pulses’ number: the same eighths, the pulses’ gaps rotated', () => {
    const seven = METER_CHOICES.filter((c) => c.text.startsWith('7/8')).map((c) =>
      gaps(c.meter).join('+'),
    );
    expect(seven.toSorted()).toEqual(['2+2+3', '2+3+2', '3+2+2']);
    for (const c of METER_CHOICES.filter((c) => c.text.startsWith('7/8')))
      expect(c.meter.cycle).toBe(7);
  });
});

describe('a meter nudged a beat a bar (session contract minor 6)', () => {
  it('adds the last pulse again, or takes the last off, where the bar that makes is a choice: every choice, both ways', () => {
    const step = (text: string, by: 1 | -1) => {
      const choice = METER_CHOICES.find((c) => c.text === text)!;
      const next = meterNudged(choice.meter, by);
      return next === null ? null : meterLabel(next);
    };
    const table = Object.fromEntries(
      METER_CHOICES.map((c) => [c.text, [step(c.text, -1), step(c.text, 1)]]),
    );
    expect(table).toEqual({
      // No 2/4 is offered (the meter contract records it), so 3/4 takes no beat off.
      '3/4': [null, '4/4'],
      '4/4': ['3/4', '5/4'],
      '5/4': ['4/4', null],
      '5/8': [null, '7/8'],
      '5/8 2+3': [null, null],
      '6/8': [null, '9/8'],
      '7/8': ['5/8', null],
      '7/8 2+2+3': [null, null],
      '7/8 2+3+2': ['5/8 2+3', null],
      '9/8': ['6/8', '12/8'],
      '10/8': [null, null],
      '12/8': ['9/8', null],
    });
  });

  it('keeps the pulses it keeps where they were: a beat more is the last again, at the end of the bar', () => {
    const more = meterNudged(METERS['3/4'], 1)!;
    expect(gaps(more)).toEqual([2, 2, 2, 2]);
    expect(more.heights.slice(0, 3)).toEqual(METERS['3/4'].heights);
  });
});
