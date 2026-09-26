import {
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  SLIDER_GLIDE,
  glideTo,
  holding,
  styleAt,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { conduct, stopAt, wishAfter } from './conductor.ts';

const funk = PRESETS.find((p) => p.name === 'Funk')!;

describe('conduct', () => {
  it('glides a preset over eight bars from the next step to be scheduled', () => {
    const track = holding(INITIAL_STYLE);
    const at = 100;
    const next = conduct(track, { kind: 'preset', preset: funk }, at);
    expect(styleAt(next, at)).toEqual(styleAt(track, at));
    expect(styleAt(next, at + PRESET_GLIDE)).toEqual({
      ...funk.style,
      entropy: INITIAL_STYLE.entropy,
    });
    expect(styleAt(next, at + PRESET_GLIDE / 2).sync).toBeCloseTo(
      (INITIAL_STYLE.sync + funk.style.sync) / 2,
      12,
    );
  });

  it('glides a slider over one bar, and never out of its axis', () => {
    const track = holding(INITIAL_STYLE);
    const next = conduct(track, { kind: 'axis', axis: 'energy', value: 1 }, 40);
    expect(styleAt(next, 40)).toEqual(INITIAL_STYLE);
    expect(styleAt(next, 40 + SLIDER_GLIDE).energy).toBe(1);
    const fast = conduct(track, { kind: 'axis', axis: 'bpm', value: 999 }, 40);
    expect(styleAt(fast, 40 + SLIDER_GLIDE).bpm).toBe(180);
  });

  it('sets a change at once while the band is stopped', () => {
    const next = conduct(holding(INITIAL_STYLE), { kind: 'preset', preset: funk }, null);
    expect(styleAt(next, 0)).toEqual({ ...funk.style, entropy: INITIAL_STYLE.entropy });
  });
});

describe('stopAt', () => {
  it('keeps where the style was going, so a preset chosen before a stop is the one that plays', () => {
    // Stopping one bar into an eight-bar glide to Funk: the next start plays
    // Funk, as the page shows, not the style one bar in.
    const gliding = glideTo(holding(INITIAL_STYLE), funk.style, 0, PRESET_GLIDE);
    const stopped = stopAt(gliding);
    expect(styleAt(stopped, 0)).toEqual({ ...funk.style, entropy: INITIAL_STYLE.entropy });
    expect(styleAt(stopped, 1000)).toEqual(styleAt(stopped, 0));
    expect(styleAt(gliding, 16)).not.toEqual(styleAt(stopped, 0));
  });
});

describe('wishAfter', () => {
  it("wishes for a preset's mode, from any tonic, and leaves the wish to a slider", () => {
    const deepHouse = PRESETS.find((p) => p.name === 'Deep house')!;
    const wish = { tonic: 4, mode: 'ionian' } as const;
    expect(wishAfter(wish, { kind: 'preset', preset: deepHouse })).toEqual({
      tonic: null,
      mode: 'dorian',
    });
    expect(wishAfter(wish, { kind: 'axis', axis: 'harm', value: 0.2 })).toBe(wish);
  });
});
