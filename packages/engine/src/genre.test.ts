import { describe, expect, it } from 'vitest';
import {
  PRESET_LANDMARKS,
  bpmUnit,
  energyOf,
  genreOf,
  readingAxes,
  styleDistance,
} from './genre.ts';
import { PRESETS } from './style.ts';

const presetPoint = (name: string) => PRESET_LANDMARKS.find((p) => p.name === name)!.at;

describe('genre probabilities: nearness to the presets', () => {
  it('turns the density onto the energy axis: 0 to 1, clamped', () => {
    expect(energyOf(0)).toBe(0);
    expect(energyOf(10)).toBe(1);
    expect(energyOf(0.94)).toBeGreaterThan(energyOf(0.5));
  });

  it('carries the axes a reading has, and none it lacks', () => {
    expect(readingAxes({ density: 0 })).toEqual({ energy: 0 });
    expect(Object.keys(readingAxes({ density: 1, sync: 0.2, artic: 0.3 })).sort()).toEqual([
      'artic',
      'energy',
      'sync',
    ]);
    expect(readingAxes({ density: 1, bpm: 120, harm: 0.4 })).toMatchObject({
      harm: 0.4,
      bpm: bpmUnit(120),
    });
  });

  it('measures a distance over the axes read alone, as a root mean square', () => {
    const style = presetPoint('Techno');
    expect(styleDistance({ sync: style.sync, artic: style.artic }, style)).toBe(0);
    expect(styleDistance({ sync: style.sync + 0.2 }, style)).toBeCloseTo(0.2, 12);
    expect(styleDistance({ sync: style.sync + 0.2, artic: style.artic + 0.2 }, style)).toBeCloseTo(
      0.2,
      12,
    );
    expect(styleDistance({}, style)).toBe(0);
  });

  it('puts the tempo on its own axis’s scale, log between its ends: 0 at 60 bpm, 1 at 180 (E24)', () => {
    expect(bpmUnit(60)).toBeCloseTo(0, 12);
    expect(bpmUnit(180)).toBeCloseTo(1, 12);
    expect(bpmUnit(Math.sqrt(60 * 180))).toBeCloseTo(0.5, 12);
  });

  it('gives probabilities that sum to 1, one per preset, in the presets’ order', () => {
    const genres = genreOf({ sync: 0.4, artic: 0.5, energy: 0.5 });
    expect(genres.map((g) => g.name)).toEqual(PRESETS.map((p) => p.name));
    expect(genres.reduce((sum, g) => sum + g.p, 0)).toBeCloseTo(1, 12);
  });

  it('puts most on a preset’s own point, for every preset at a low temperature', () => {
    for (const preset of PRESETS) {
      const top = genreOf(presetPoint(preset.name), 0.05).sort((a, b) => b.p - a.p)[0]!;
      expect(top.name).toBe(preset.name);
    }
  });

  it('spreads towards even as the temperature rises, and reads no axis as even', () => {
    const near = genreOf(presetPoint('Techno'), 0.02)[1]!.p;
    const warm = genreOf(presetPoint('Techno'), 10)[1]!.p;
    expect(near).toBeGreaterThan(0.99);
    expect(warm).toBeCloseTo(1 / PRESETS.length, 1);
    for (const g of genreOf({}, 0.1)) expect(g.p).toBeCloseTo(1 / PRESETS.length, 12);
  });
});
