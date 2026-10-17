// @vitest-environment node
import { INITIAL_STYLE, PRESETS, SECTION_BARS, barStart, glideTo, holding } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { nowPlaying, stationLine } from './radioView.ts';

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

  it('says nothing before a position is heard, and the preset alone for a held track', () => {
    const held = holding(point(techno));
    expect(stationLine(held, null)).toBeNull();
    expect(stationLine(held, 0)).toBe('Techno');
    expect(stationLine(holding(INITIAL_STYLE), 40)).toBe('Synth-pop');
  });

  it('reads a glide off the track alone: it starts where it was and arrives where it heads', () => {
    const glide = barStart(SECTION_BARS);
    const track = glideTo(holding(point(techno)), point(ambient), 0, glide);
    expect(stationLine(track, 0)).toBe('Techno, drifting toward Ambient');
    expect(stationLine(track, glide / 2)).toMatch(/Ambient$/);
    expect(stationLine(track, glide)).toBe('Ambient');
  });
});
