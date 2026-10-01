import { clockOf, sameMeter } from '@jambot/engine';
import { METERS, type MeterName, gaps, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { METER_CHOICES, meterLabel } from './meter-choice.ts';

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
