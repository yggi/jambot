import { describe, expect, it } from 'vitest';
import { ticksTimeMap, type TempoEvent } from './tempo.ts';

const PPQ = 480;

describe('ticksTimeMap', () => {
  it('written and played are exact inverses over every tempo segment (A6)', () => {
    const tempos: TempoEvent[] = [
      { ticks: 0, bpm: 120 },
      { ticks: 4 * PPQ, bpm: 90 },
      { ticks: 10 * PPQ, bpm: 150 },
    ];
    const map = ticksTimeMap(PPQ, tempos);
    for (let tick = 0; tick <= 20 * PPQ; tick += 37) {
      expect(map.written(map.played(tick))).toBeCloseTo(tick, 6);
    }
    for (let seconds = 0; seconds < 30; seconds += 0.7) {
      expect(map.played(map.written(seconds))).toBeCloseTo(seconds, 6);
    }
  });

  it('defaults to 120 bpm at tick 0 when the file states no tempo', () => {
    const map = ticksTimeMap(PPQ, []);
    expect(map.played(PPQ)).toBeCloseTo(0.5, 9);
  });

  it('anchors at tick 0 with the first event’s own bpm, where the file states none there', () => {
    const map = ticksTimeMap(PPQ, [{ ticks: 2 * PPQ, bpm: 60 }]);
    expect(map.played(2 * PPQ)).toBeCloseTo(2, 9);
    expect(map.played(3 * PPQ)).toBeCloseTo(3, 9);
  });

  it('keeps a later tempo at a repeated tick', () => {
    const map = ticksTimeMap(PPQ, [
      { ticks: 0, bpm: 120 },
      { ticks: 0, bpm: 60 },
    ]);
    expect(map.played(PPQ)).toBeCloseTo(1, 9);
  });
});
