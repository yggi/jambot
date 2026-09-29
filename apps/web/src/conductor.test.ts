// @vitest-environment node
import {
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  SLIDER_GLIDE,
  type Style,
  TEMPO_REACH,
  TEMPO_STEP,
  fifthsApart,
  glideTo,
  holding,
  INITIAL_KEY,
  MELODIC_SCALES,
  licenceOf,
  styleAt,
  tempoLicence,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  baseTempo,
  conduct,
  keyReachOf,
  melodicReachOf,
  nudgeAfter,
  stopAt,
  styleAfter,
  tempoView,
  wishAfter,
} from './conductor.ts';

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
    // G ionian, one sharp: within the reach of every style below.
    const wish = { tonic: 7, mode: 'ionian', melodic: 'pentatonic' } as const;
    const style = { ...INITIAL_STYLE, ...deepHouse.style };
    expect(wishAfter(wish, { kind: 'preset', preset: deepHouse }, style)).toEqual({
      tonic: null,
      mode: 'dorian',
      melodic: 'pentatonic',
    });
    const slider = { kind: 'axis', axis: 'harm', value: 0.5 } as const;
    expect(wishAfter(wish, slider, { ...INITIAL_STYLE, harm: 0.5 })).toBe(wish);
  });

  it('wishes for a key picked, tonic and mode, keeping the melodic scale wished', () => {
    const picked = { tonic: 2, mode: 'mixolydian' } as const;
    for (const melodic of [null, 'plain', 'pentatonic'] as const)
      expect(
        wishAfter(
          { tonic: null, mode: 'aeolian', melodic },
          { kind: 'key', wish: picked },
          INITIAL_STYLE,
        ),
      ).toEqual({ ...picked, melodic });
  });

  it('wishes for a melodic scale picked, keeping the key wished (#209)', () => {
    const rich = { ...INITIAL_STYLE, harm: 1 };
    for (const before of [
      { tonic: null, mode: 'aeolian', melodic: null },
      { tonic: 4, mode: 'dorian', melodic: 'blues' },
    ] as const)
      for (const melodic of MELODIC_SCALES)
        expect(wishAfter(before, { kind: 'key', wish: { melodic } }, rich)).toEqual({
          ...before,
          melodic,
        });
  });

  it('holds a melodic scale picked within the style’s reach, for every preset and scale (#209)', () => {
    for (const p of PRESETS) {
      const style: Style = { ...INITIAL_STYLE, ...p.style };
      const reach = licenceOf(style).melodic;
      for (const melodic of MELODIC_SCALES) {
        const before = { tonic: null, mode: p.mode, melodic: null } as const;
        const held = wishAfter(before, { kind: 'key', wish: { melodic } }, style).melodic;
        expect(held).toBe(reach.includes(melodic) ? melodic : reach.at(-1));
      }
    }
    // Techno reaches the plain scale alone.
    const techno = { ...INITIAL_STYLE, ...PRESETS.find((p) => p.name === 'Techno')!.style };
    const wish = { tonic: null, mode: 'aeolian', melodic: null } as const;
    expect(wishAfter(wish, { kind: 'key', wish: { melodic: 'blues' } }, techno).melodic).toBe(
      'plain',
    );
  });

  it('pulls a melodic scale back into a narrower reach when the harmony falls, and leaves the style’s default alone (#209)', () => {
    const wish = { tonic: null, mode: 'aeolian', melodic: 'blues' } as const;
    const lower = (value: number) => ({ kind: 'axis', axis: 'harm', value }) as const;
    const at = (harm: number) => wishAfter(wish, lower(harm), { ...INITIAL_STYLE, harm });
    expect(at(1)).toBe(wish);
    expect(at(0.5)).toEqual({ ...wish, melodic: 'pentatonic' });
    expect(at(0)).toEqual({ ...wish, melodic: 'plain' });
    const none = { ...wish, melodic: null };
    expect(wishAfter(none, lower(0), { ...INITIAL_STYLE, harm: 0 })).toBe(none);
  });

  it('shows the melodic scales the style reaches where the track is going, for every preset (#209)', () => {
    for (const p of PRESETS) {
      const intent = { kind: 'preset', preset: p } as const;
      const track = holding(INITIAL_STYLE);
      expect(melodicReachOf(conduct(track, intent, 40))).toEqual(
        licenceOf(styleAfter(track, intent, 0)).melodic,
      );
    }
  });

  it('keeps a key picked when a preset in the same mode follows, as the prototype does', () => {
    // Deep house is dorian: E dorian, picked, stays E dorian rather than
    // pivoting, two sharps within its reach of three.
    const deepHouse = PRESETS.find((p) => p.name === 'Deep house')!;
    const picked = { tonic: 4, mode: 'dorian', melodic: null } as const;
    const style = { ...INITIAL_STYLE, ...deepHouse.style };
    expect(wishAfter(picked, { kind: 'preset', preset: deepHouse }, style)).toBe(picked);
  });

  it('holds a key picked within the style’s reach of the home key, for every preset and tonic', () => {
    for (const p of PRESETS) {
      const style: Style = { ...INITIAL_STYLE, ...p.style };
      const { keyReach } = licenceOf(style);
      for (let tonic = 0; tonic < 12; tonic++) {
        const picked = { tonic, mode: p.mode };
        const before = { tonic: null, mode: 'aeolian', melodic: null } as const;
        const held = wishAfter(before, { kind: 'key', wish: picked }, style);
        const apart = Math.abs(fifthsApart(picked, INITIAL_KEY));
        expect(Math.abs(fifthsApart({ tonic: held.tonic!, mode: held.mode }, INITIAL_KEY))).toBe(
          Math.min(apart, keyReach),
        );
        expect(held.tonic === tonic).toBe(apart <= keyReach);
      }
    }
  });

  it('holds a key picked within reach of the home it is given, the harmonic history’s centre, for every home and tonic (#169, C8)', () => {
    const style: Style = { ...INITIAL_STYLE, harm: 1 / 6 };
    const { keyReach } = licenceOf(style);
    for (let home = 0; home < 12; home++)
      for (let tonic = 0; tonic < 12; tonic++) {
        const centre = { tonic: home, mode: 'aeolian' } as const;
        const picked = { tonic, mode: 'aeolian', melodic: null } as const;
        const held = wishAfter(picked, { kind: 'key', wish: picked }, style, centre);
        const apart = Math.abs(fifthsApart(picked, centre));
        expect(held.tonic === tonic).toBe(apart <= keyReach);
        expect(Math.abs(fifthsApart({ tonic: held.tonic!, mode: 'aeolian' }, centre))).toBe(
          Math.min(apart, keyReach),
        );
      }
  });

  it('shows the reach it holds a key to: the style’s where the track is going, for every preset', () => {
    for (const p of PRESETS) {
      const intent = { kind: 'preset', preset: p } as const;
      const track = holding(INITIAL_STYLE);
      const next = conduct(track, intent, 40);
      const style = styleAfter(track, intent, 0);
      expect(keyReachOf(next)).toBe(licenceOf(style).keyReach);
    }
    const reachOf = (name: string) =>
      keyReachOf(
        conduct(
          holding(INITIAL_STYLE),
          { kind: 'preset', preset: PRESETS.find((p) => p.name === name)! },
          null,
        ),
      );
    expect(reachOf('Techno')).toBe(1);
    expect(reachOf('Swing jazz')).toBe(6);
  });

  it('pulls a wish back into a narrower reach when the harmony falls', () => {
    // E ionian lies four sharps from A minor: within Swing jazz's six, beyond Techno's one.
    const wish = { tonic: 4, mode: 'ionian', melodic: null } as const;
    const jazz = { ...INITIAL_STYLE, harm: 1 };
    const techno = { ...INITIAL_STYLE, harm: 0 };
    const lower = { kind: 'axis', axis: 'harm', value: 0 } as const;
    expect(wishAfter(wish, lower, jazz)).toBe(wish);
    expect(wishAfter(wish, lower, techno)).toEqual({ tonic: 7, mode: 'ionian', melodic: null });
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
    const { high, low } = tempoLicence(INITIAL_STYLE);
    expect(nudgeAfter(0, step(100), INITIAL_STYLE)).toBe(high);
    expect(nudgeAfter(0, step(-100), INITIAL_STYLE)).toBe(low);
    const wide = { ...INITIAL_STYLE, entropy: 1 };
    expect(nudgeAfter(0, step(100), wide)).toBe(TEMPO_REACH);
    const far = conduct(holding(INITIAL_STYLE), step(100), null);
    expect(styleAt(far, 0).bpm).toBeCloseTo(108 * 2 ** high, 9);
  });

  it('narrows the licence as entropy falls, and takes the tempo played back within it', () => {
    const nudge = 8 * TEMPO_STEP;
    const wide = conduct(holding({ ...INITIAL_STYLE, entropy: 1 }), step(8), null);
    expect(styleAt(wide, 0).bpm).toBeCloseTo(108 * 2 ** nudge, 9);
    const intent = { kind: 'axis', axis: 'entropy', value: 0 } as const;
    const style = styleAfter(wide, intent, nudge);
    expect(style).toEqual({ ...INITIAL_STYLE, entropy: 0 });
    expect(nudgeAfter(nudge, intent, style)).toBeCloseTo(2 * TEMPO_STEP, 12);
    const next = conduct(wide, intent, null, nudge);
    expect(styleAt(next, 0).bpm).toBeCloseTo(108 * 2 ** (2 * TEMPO_STEP), 9);
    expect(tempoView(next, nudgeAfter(nudge, intent, style))).toMatchObject({
      base: 108,
      ...tempoLicence(style),
    });
  });

  it('carries the nudge to a preset’s tempo, and reads every preset’s own back exactly', () => {
    for (const p of PRESETS)
      for (let n = -8; n <= 8; n++) {
        const intent = { kind: 'preset', preset: p } as const;
        // A nudge past the tempo axis's end is held at it, as the player holds it.
        const nudge = nudgeAfter(n * TEMPO_STEP, intent, { ...INITIAL_STYLE, ...p.style });
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
