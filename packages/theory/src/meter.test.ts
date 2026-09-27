import { describe, expect, it } from 'vitest';
import { isEven } from './even.ts';
import {
  METERS,
  type MeterName,
  type Weight,
  meterWeights,
  pulseHelix,
  pulseLengths,
} from './meter.ts';

/** Every named meter's weights, by hand: the ground truth `meterWeights` is checked against. */
const WEIGHTS: Record<MeterName, Weight[]> = {
  '3/4': ['downbeat', 'subdivision', 'pulse', 'subdivision', 'pulse', 'subdivision'],
  '4/4': [
    'downbeat',
    'subdivision',
    'pulse',
    'subdivision',
    'pulse',
    'subdivision',
    'pulse',
    'subdivision',
  ],
  '5/8': ['downbeat', 'subdivision', 'subdivision', 'pulse', 'subdivision'],
  '6/8': ['downbeat', 'subdivision', 'subdivision', 'pulse', 'subdivision', 'subdivision'],
  '7/8': ['downbeat', 'subdivision', 'subdivision', 'pulse', 'subdivision', 'pulse', 'subdivision'],
  '9/8': [
    'downbeat',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
  ],
  '12/8': [
    'downbeat',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
  ],
};

describe('meter', () => {
  it('gives every named meter its pulses and subdivisions', () => {
    expect(METERS).toEqual({
      '3/4': { pulses: 3, subdivisions: 6 },
      '4/4': { pulses: 4, subdivisions: 8 },
      '5/8': { pulses: 2, subdivisions: 5 },
      '6/8': { pulses: 2, subdivisions: 6 },
      '7/8': { pulses: 3, subdivisions: 7 },
      '9/8': { pulses: 3, subdivisions: 9 },
      '12/8': { pulses: 4, subdivisions: 12 },
    });
  });

  it('places every meter’s pulses as evenly as `even` can over its bar’s subdivisions (finite: every meter, every position)', () => {
    for (const meter of Object.values(METERS)) {
      const helix = pulseHelix(meter);
      expect(helix.cycle).toBe(meter.subdivisions);
      expect(helix.heights).toHaveLength(meter.pulses);
      expect(helix.heights[0]).toBe(0);
      expect(isEven(helix)).toBe(true);
    }
  });

  it('weighs every subdivision of every named meter, against its weights written out by hand (finite: every meter, every position)', () => {
    for (const [name, meter] of Object.entries(METERS) as [MeterName, (typeof METERS)[MeterName]][])
      expect(meterWeights(meter)).toEqual(WEIGHTS[name]);
  });

  it('marks position 0 the downbeat and no other position, in every meter', () => {
    for (const meter of Object.values(METERS)) {
      const weights = meterWeights(meter);
      expect(weights[0]).toBe('downbeat');
      expect(weights.slice(1)).not.toContain('downbeat');
    }
  });

  it('splits a bar’s pulses into equal lengths for a simple or compound meter (finite: 3/4, 4/4, 6/8, 9/8, 12/8)', () => {
    expect(pulseLengths(METERS['3/4'])).toEqual([2, 2, 2]);
    expect(pulseLengths(METERS['4/4'])).toEqual([2, 2, 2, 2]);
    expect(pulseLengths(METERS['6/8'])).toEqual([3, 3]);
    expect(pulseLengths(METERS['9/8'])).toEqual([3, 3, 3]);
    expect(pulseLengths(METERS['12/8'])).toEqual([3, 3, 3, 3]);
  });

  it('splits a bar’s pulses unequally for an additive meter, the same `even` that groups the bossa clave: 5/8 as 3+2, 7/8 as 3+2+2', () => {
    expect(pulseLengths(METERS['5/8'])).toEqual([3, 2]);
    expect(pulseLengths(METERS['7/8'])).toEqual([3, 2, 2]);
    for (const meter of Object.values(METERS))
      expect(pulseLengths(meter).reduce((a, b) => a + b, 0)).toBe(meter.subdivisions);
  });

  it('makes 3/4 and 6/8 sound different though both hold six subdivisions a bar: grouped in 2s or in 3s', () => {
    expect(METERS['3/4'].subdivisions).toBe(6);
    expect(METERS['6/8'].subdivisions).toBe(6);
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

  it('groups an additive meter without being told which pulse is which: 5/8 long-short, 7/8 long-short-short', () => {
    expect(pulseHelix(METERS['5/8']).heights).toEqual([0, 3]);
    expect(pulseHelix(METERS['7/8']).heights).toEqual([0, 3, 5]);
  });
});
