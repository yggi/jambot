import { readPoint } from '@yggi/cells/engine/reading/point';
import { describe, expect, it } from 'vitest';
import {
  PRESET_LANDMARKS,
  bpmUnit,
  energyOf,
  genreOf,
  nearestPreset,
  readingAxes,
  styleDistance,
} from './genre.ts';
import { mulberry32 } from './random.ts';
import { PRESETS, type Style } from './style.ts';

const presetPoint = (name: string) => PRESET_LANDMARKS.find((p) => p.name === name)!.at;

describe('genre probabilities: nearness to the presets', () => {
  it('turns the density onto the energy axis: 0 to 1, clamped', () => {
    expect(energyOf(0)).toBe(0);
    expect(energyOf(10)).toBe(1);
    expect(energyOf(0.94)).toBeGreaterThan(energyOf(0.5));
  });

  it('carries the axes a reading has, and none it lacks', () => {
    expect(readingAxes({ density: 0 })).toEqual({ energy: 0 });
    // (a reading's bite is the style's artic: cells' name for the axis, Jambot's, `CELLS_AXIS`)
    expect(readingAxes({ density: 1, sync: 0.2, bite: 0.3 })).toEqual({
      energy: energyOf(1),
      sync: 0.2,
      artic: 0.3,
    });
    expect(readingAxes({ density: 1, bpm: 120, harm: 0.4 })).toMatchObject({
      harm: 0.4,
      bpm: bpmUnit(120),
    });
  });

  it('carries the mood cells reads from a span of bars’ notes, the mode they fit at the default tension (yggi/cells#541)', () => {
    const ionian = [0, 2, 4, 5, 7, 9, 11].map((x, i) => ({
      part: 'lead' as const,
      step: 2 * i,
      length: 2,
      note: 60 + x,
    }));
    const { point } = readPoint([ionian, [{ part: 'bass', step: 0, length: 16, note: 36 }]]);
    expect(point.mood).toBeDefined();
    expect(readingAxes({ density: 0, mood: point.mood! })).toEqual({
      energy: 0,
      mood: point.mood,
    });
    const at = presetPoint('Techno');
    expect(styleDistance({ mood: at.mood! + 0.2 }, at)).toBeCloseTo(0.2, 12);
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

  it('names the preset a style lies nearest: each preset’s own point names itself, at any entropy (#313)', () => {
    for (const preset of PRESETS)
      for (const entropy of [0, 0.3, 1])
        expect(nearestPreset({ ...preset.style, entropy })).toBe(preset.name);
  });

  it('names another preset once a style has moved nearer to it than to the one it left', () => {
    const [from, to] = [PRESETS[1]!, PRESETS[3]!];
    const between = (u: number) =>
      Object.fromEntries(
        Object.keys(from.style).map((axis) => {
          const a = axis as keyof typeof from.style;
          return [a, from.style[a] * (1 - u) + to.style[a] * u];
        }),
      ) as typeof from.style;
    expect(nearestPreset({ ...between(0.1), entropy: 0.3 })).toBe(from.name);
    expect(nearestPreset({ ...between(0.9), entropy: 0.3 })).toBe(to.name);
  });
});

describe('the nearest preset as cells ranks it (#596)', () => {
  // (the distance Jambot took before #596, its own: the root mean square over the axes a reading has)
  const ownDistance = (read: Record<string, number>, at: Record<string, number>) => {
    const axes = ['energy', 'sync', 'artic', 'bpm', 'harm', 'mood'].filter(
      (a) => read[a] !== undefined && at[a] !== undefined,
    );
    return Math.sqrt(axes.reduce((sum, a) => sum + (read[a]! - at[a]!) ** 2, 0) / axes.length);
  };
  const ownNearest = (style: Style) => {
    const read = { ...style, bpm: bpmUnit(style.bpm) };
    let best = PRESET_LANDMARKS[0]!;
    for (const l of PRESET_LANDMARKS.slice(1))
      if (ownDistance(read, l.at) < ownDistance(read, best.at)) best = l;
    return best.name;
  };
  // (1,000 seeded styles over the whole space: each axis uniform, the tempo uniform in log space)
  const styles: Style[] = Array.from({ length: 1000 }, (_, i) => {
    const r = mulberry32(596 * 1000 + i);
    return {
      sync: r(),
      harm: r(),
      artic: r(),
      energy: r(),
      entropy: r(),
      bpm: 60 * 3 ** r(),
      mood: r(),
    };
  });

  it('names the preset Jambot’s own distance named, at each of 1,000 seeded styles', () => {
    expect(styles.filter((s) => nearestPreset(s) !== ownNearest(s))).toEqual([]);
  });

  it('is the distance cells takes between two styles: styleDistance is pointDistance over the axes a reading has', () => {
    for (const s of styles.slice(0, 100)) {
      const read = { ...s, bpm: bpmUnit(s.bpm) };
      for (const l of PRESET_LANDMARKS)
        expect(styleDistance(read, l.at)).toBeCloseTo(ownDistance(read, l.at), 12);
    }
    expect(styleDistance({}, PRESET_LANDMARKS[0]!.at)).toBe(0);
  });
});
