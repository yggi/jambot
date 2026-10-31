// @vitest-environment node
import { PRESETS } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { nowPlaying } from './radioView.ts';

const [techno, ambient] = [PRESETS[1]!, PRESETS[3]!];
const point = (preset: (typeof PRESETS)[number]) => ({ ...preset.style, entropy: 0.3 });

describe('where the station is, and where it heads (#313)', () => {
  it('names the preset a style is nearest, and none it heads for while it stays near it', () => {
    for (const preset of PRESETS)
      expect(nowPlaying(point(preset), point(preset))).toEqual({ at: preset.name, toward: null });
  });

  it('names where it heads once that is nearer another preset', () => {
    expect(nowPlaying(point(techno), point(ambient))).toEqual({
      at: techno.name,
      toward: ambient.name,
    });
  });
});
