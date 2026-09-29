// @vitest-environment node
import {
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  SLIDER_GLIDE,
  TEMPO_REACH,
  TEMPO_STEP,
  glideTo,
  holding,
  styleAt,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { baseTempo, conduct, nudgeAfter, stopAt, tempoView, wishAfter } from './conductor.ts';

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

  it('wishes for a key picked, tonic and mode', () => {
    const picked = { tonic: 2, mode: 'mixolydian' } as const;
    expect(wishAfter({ tonic: null, mode: 'aeolian' }, { kind: 'key', wish: picked })).toBe(picked);
  });

  it('keeps a key picked when a preset in the same mode follows, as the prototype does', () => {
    // Funk is dorian: E dorian, picked, stays E dorian rather than pivoting.
    const picked = { tonic: 4, mode: 'dorian' } as const;
    expect(wishAfter(picked, { kind: 'preset', preset: funk })).toBe(picked);
  });
});

describe('conduct, for a key', () => {
  it('leaves the style as it is', () => {
    const track = holding(INITIAL_STYLE);
    const wish = { tonic: 2, mode: 'dorian' } as const;
    expect(conduct(track, { kind: 'key', wish }, 40)).toBe(track);
    expect(conduct(track, { kind: 'key', wish }, null)).toBe(track);
  });
});

describe('conduct, for the tempo', () => {
  const step = (n: number) => ({ kind: 'tempo', nudge: n * TEMPO_STEP }) as const;

  it('plays the style’s tempo times the players’ nudge, as a ratio', () => {
    const track = holding(INITIAL_STYLE);
    const next = conduct(track, step(2), 40);
    expect(styleAt(next, 40)).toEqual(INITIAL_STYLE);
    expect(styleAt(next, 40 + SLIDER_GLIDE).bpm).toBeCloseTo(108 * 2 ** (1 / 12), 9);
    expect(baseTempo(next, 2 * TEMPO_STEP)).toBe(108);
  });

  it('holds the nudge within the licence', () => {
    expect(nudgeAfter(0, step(100), 108)).toBe(TEMPO_REACH);
    expect(nudgeAfter(0, step(-100), 108)).toBe(-TEMPO_REACH);
    const far = conduct(holding(INITIAL_STYLE), step(100), null);
    expect(styleAt(far, 0).bpm).toBeCloseTo(108 * 2 ** TEMPO_REACH, 9);
  });

  it('carries the nudge to a preset’s tempo, and reads every preset’s own back exactly', () => {
    for (const p of PRESETS)
      for (let n = -8; n <= 8; n++) {
        const intent = { kind: 'preset', preset: p } as const;
        // A nudge past the tempo axis's end is held at it, as the player holds it.
        const nudge = nudgeAfter(n * TEMPO_STEP, intent, p.style.bpm);
        const next = conduct(holding(INITIAL_STYLE), intent, null, nudge);
        expect(baseTempo(next, nudge)).toBe(p.style.bpm);
        expect(tempoView(next, nudge)).toMatchObject({ base: p.style.bpm, nudge });
      }
  });

  it('leaves a tempo glide under way to a slider on another axis', () => {
    const gliding = conduct(holding(INITIAL_STYLE), { kind: 'preset', preset: funk }, 0, 0);
    const next = conduct(gliding, { kind: 'axis', axis: 'energy', value: 1 }, 32, 0);
    expect(next.bpm).toBe(gliding.bpm);
    expect(next.energy).not.toBe(gliding.energy);
  });

  it('sets the style’s own tempo by its axis, and keeps the nudge on it', () => {
    const next = conduct(
      holding(INITIAL_STYLE),
      { kind: 'axis', axis: 'bpm', value: 120 },
      null,
      TEMPO_STEP,
    );
    expect(styleAt(next, 0).bpm).toBeCloseTo(120 * 2 ** TEMPO_STEP, 9);
  });
});
