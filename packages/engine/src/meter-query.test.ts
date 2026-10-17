import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { SONG_METER } from './events.ts';
import {
  METER_HOLD,
  MISS_DISTANCE,
  type MeterFragment,
  type MeterRepository,
  composedMeter,
  stylePoint,
} from './meter-query.ts';
import { type SectionMeter, sectionMeter } from './plan.ts';
import { INITIAL_STYLE } from './style.ts';

const fragment = (id: string, share = 0.5): MeterFragment => ({
  id,
  meter: id === '7/8' ? METERS['7/8'] : SONG_METER,
  swing: { level: '16n', share },
});
const FRAGMENTS = [fragment('a'), fragment('b', 0.6), fragment('7/8')];

/** A repository that finds each fragment at the distance given. */
const at = (distances: Record<string, number>): MeterRepository => ({
  fragments: new Map(FRAGMENTS.map((f) => [f.id, f])),
  query: () =>
    Object.entries(distances)
      .map(([id, distance]) => ({ id, distance }))
      .sort((x, y) => x.distance - y.distance),
});

describe('the composer asks the repository for a meter (#375)', () => {
  it('asks on sync, harm, artic and energy: not on the tempo or the entropy', () => {
    expect(stylePoint(INITIAL_STYLE)).toEqual({
      sync: INITIAL_STYLE.sync,
      harm: INITIAL_STYLE.harm,
      artic: INITIAL_STYLE.artic,
      energy: INITIAL_STYLE.energy,
    });
  });

  it('takes the nearest fragment, and finds nothing past the miss distance', () => {
    expect(composedMeter(at({ a: 0.1, b: 0.2 }), INITIAL_STYLE, null)?.id).toBe('a');
    expect(composedMeter(at({ a: MISS_DISTANCE, b: 0.4 }), INITIAL_STYLE, null)?.id).toBe('a');
    expect(composedMeter(at({ a: MISS_DISTANCE + 1e-9 }), INITIAL_STYLE, null)).toBeNull();
  });

  it('holds the meter playing unless another is nearer by more than the margin', () => {
    const near = 0.1;
    const holds = (by: number) =>
      composedMeter(at({ b: near, a: near + by }), INITIAL_STYLE, 'a')?.id;
    expect([holds(METER_HOLD * 0.99), holds(METER_HOLD * 1.01)]).toEqual(['a', 'b']);
    // Not past the miss distance, though: a meter that misses gives way.
    expect(
      composedMeter(at({ b: MISS_DISTANCE - 0.01, a: MISS_DISTANCE + 0.005 }), INITIAL_STYLE, 'a')
        ?.id,
    ).toBe('b');
  });
});

describe("a section's meter (#375)", () => {
  const style = INITIAL_STYLE;
  const before: SectionMeter = { meter: SONG_METER, swing: '16n', share: 0.6, meterFragment: 'b' };

  it('takes the meter asked for, which wins over the repository', () => {
    expect(
      sectionMeter({ style, meter: METERS['7/8'], swing: '8n', repository: at({ a: 0 }) }, before),
    ).toEqual({
      meter: METERS['7/8'],
      swing: '8n',
    });
  });

  it("takes the repository's where none is asked for: its meter, its level, its share and its id", () => {
    expect(sectionMeter({ style, repository: at({ '7/8': 0 }) }, null)).toEqual({
      meter: METERS['7/8'],
      swing: '16n',
      share: 0.5,
      meterFragment: '7/8',
    });
  });

  it('keeps the meter playing on a miss, and plays the song’s 4/4 where there is nothing to keep', () => {
    expect(sectionMeter({ style, repository: at({ a: 0.9 }) }, before)).toEqual(before);
    expect(sectionMeter({ style, repository: at({ a: 0.9 }) }, null)).toEqual({
      meter: SONG_METER,
      swing: '16n',
    });
  });

  it("plays the song's 4/4 with no repository and nothing asked for, as before #375", () => {
    expect(sectionMeter({ style }, before)).toEqual({ meter: SONG_METER, swing: '16n' });
  });
});
