import { describe, expect, it } from 'vitest';
import { isEven } from './even.ts';
import { METERS, type Meter, type Weight, meterWeights, pulseHelix } from './meter.ts';

/** The weight of every subdivision, worked out directly: every meter here has one subdivision size throughout, so a pulse falls exactly where `position % subdivision === 0`. */
function expectedWeights({ pulses, subdivision }: Meter): Weight[] {
  return Array.from({ length: pulses * subdivision }, (_, position) =>
    position === 0 ? 'downbeat' : position % subdivision === 0 ? 'pulse' : 'subdivision',
  );
}

describe('meter', () => {
  it('gives every named meter its pulses and subdivision', () => {
    expect(METERS).toEqual({
      '3/4': { pulses: 3, subdivision: 2 },
      '4/4': { pulses: 4, subdivision: 2 },
      '6/8': { pulses: 2, subdivision: 3 },
      '12/8': { pulses: 4, subdivision: 3 },
    });
  });

  it('places every meter’s pulses evenly over its bar’s subdivisions (finite: every meter, every position)', () => {
    for (const meter of Object.values(METERS)) {
      const helix = pulseHelix(meter);
      expect(helix.cycle).toBe(meter.pulses * meter.subdivision);
      expect(helix.heights).toHaveLength(meter.pulses);
      expect(isEven(helix)).toBe(true);
    }
  });

  it('weighs every subdivision of every named meter, matching a direct reading (finite: every meter, every position)', () => {
    for (const meter of Object.values(METERS))
      expect(meterWeights(meter)).toEqual(expectedWeights(meter));
  });

  it('marks position 0 the downbeat and no other position, in every meter', () => {
    for (const meter of Object.values(METERS)) {
      const weights = meterWeights(meter);
      expect(weights[0]).toBe('downbeat');
      expect(weights.slice(1)).not.toContain('downbeat');
    }
  });

  it('makes 3/4 and 6/8 sound different though both hold six subdivisions a bar: grouped in 2s or in 3s', () => {
    expect(METERS['3/4'].pulses * METERS['3/4'].subdivision).toBe(6);
    expect(METERS['6/8'].pulses * METERS['6/8'].subdivision).toBe(6);
    expect(meterWeights(METERS['3/4'])).toEqual([
      'downbeat',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
    ]);
    expect(meterWeights(METERS['6/8'])).toEqual([
      'downbeat',
      'subdivision',
      'subdivision',
      'pulse',
      'subdivision',
      'subdivision',
    ]);
  });

  it('makes 6/8 and 12/8 sound different: both grouped in 3s, but the downbeat recurs every 2 or every 4 pulses', () => {
    expect(pulseHelix(METERS['6/8']).heights).toEqual([0, 3]);
    expect(pulseHelix(METERS['12/8']).heights).toEqual([0, 3, 6, 9]);
  });
});
