import {
  INITIAL_STYLE,
  PRESETS,
  PRESET_GLIDE,
  SLIDER_GLIDE,
  type TransportEnv,
  chordAt,
  chordName,
  chordNumeral,
  forecast,
  glideTo,
  holding,
  keyName,
  leadRests,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { NEXT_BARS, SECTIONS, hudOf, presetOf } from './hud.ts';

const techno = PRESETS.find((p) => p.name === 'Techno')!;
const funk = PRESETS.find((p) => p.name === 'Funk')!;
const track = holding(INITIAL_STYLE);
const env: TransportEnv = {
  seed: 5,
  start: 0,
  track,
  wish: { tonic: null, mode: 'aeolian' },
};
const bars = forecast(env, null, 32);

describe('the view model', () => {
  it('shows the bar the band opens on, and its first chord, before anything is heard', () => {
    const hud = hudOf({ heard: null, bars, track });
    const first = bars[0]!;
    expect(hud.beat).toBeNull();
    expect(hud.bar).toMatchObject({
      bar: 0,
      barInSection: 0,
      section: 'Intro',
      key: keyName(first.plan.key),
      energy: first.barEnergy,
    });
    expect(hud.chord).toEqual({
      step: first.chords[0]!.slot.step,
      symbol: chordName(first.chords[0]!, first.plan.key),
      numeral: chordNumeral(first.chords[0]!, first.plan.key),
    });
    expect(hud.bar!.key).toBe('A aeolian');
    expect(hud.chord!.symbol).toMatch(/^Am/);
    expect(hud.chord!.numeral).toMatch(/^i/);
    // A aeolian is A minor's own notes: A B C D E F G.
    expect(hud.bar!.scale).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('shows the bar, beat and chord heard, every chord of the bar named and numbered in its key', () => {
    for (let step = 0; step < 16 * 12; step++) {
      const hud = hudOf({ heard: step, bars, track });
      const here = bars[Math.floor(step / 16)]!;
      expect(hud.beat).toBe(Math.floor((step % 16) / 4));
      expect(hud.bar!.bar).toBe(here.bar);
      expect(hud.bar!.barInSection).toBe(here.bar % 8);
      expect(hud.bar!.chords).toEqual(
        here.chords.map((c) => ({
          step: c.slot.step,
          symbol: chordName(c, here.plan.key),
          numeral: chordNumeral(c, here.plan.key),
        })),
      );
      const sounding = chordAt(here.chords, step % 16);
      expect(hud.chord!.symbol).toBe(chordName(sounding, here.plan.key));
    }
  });

  it('shows the next four bars after the one heard, as far as the forecast reaches', () => {
    expect(NEXT_BARS).toBe(4);
    expect(hudOf({ heard: 16 * 3 + 5, bars, track }).next.map((b) => b.bar)).toEqual([4, 5, 6, 7]);
    expect(hudOf({ heard: null, bars, track }).next.map((b) => b.bar)).toEqual([1, 2, 3, 4]);
    expect(hudOf({ heard: 16 * 30, bars, track }).next.map((b) => b.bar)).toEqual([31]);
  });

  it('names the sections as the page does', () => {
    const names = new Set(bars.map((_, i) => hudOf({ heard: i * 16, bars, track }).bar!.section));
    for (const name of names)
      expect(['Intro', 'Groove', 'Bridge', 'Build', 'Drop', 'Breakdown']).toContain(name);
    expect(names.size).toBeGreaterThan(1);
  });

  it('shows nothing it has not been given', () => {
    const hud = hudOf({ heard: 16 * 40, bars, track });
    expect(hud.bar).toBeNull();
    expect(hud.chord).toBeNull();
    expect(hud.next).toEqual([]);
  });
});

describe('the lead and the key ahead', () => {
  it('says of every bar whether the lead rests or improvises', () => {
    const seen = new Set<string>();
    for (const b of bars) {
      const view = hudOf({ heard: b.bar * 16, bars, track }).bar!;
      expect(view.lead).toBe(
        leadRests(b.plan.section.type, b.barEnergy) ? 'resting' : 'improvising',
      );
      seen.add(view.lead);
    }
    expect(seen).toEqual(new Set(['resting', 'improvising']));
  });

  it('shows the scale of the bar’s own key, not another', () => {
    const d = { tonic: 0, mode: 'dorian' } as const;
    const moved = bars.map((b) => (b.bar >= 16 ? { ...b, plan: { ...b.plan, key: d } } : b));
    // C dorian: C D E♭ F G A B♭.
    expect(hudOf({ heard: 16 * 16, bars: moved, track }).bar!.scale).toEqual([
      0, 2, 3, 5, 7, 9, 10,
    ]);
    // A aeolian, unchanged before bar 16: A B C D E F G.
    expect(hudOf({ heard: 0, bars: moved, track }).bar!.scale).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('gives the key the band is heading for: the key of the last bar decided', () => {
    const d = { tonic: 2, mode: 'dorian' } as const;
    const moving = bars.map((b) => (b.bar >= 16 ? { ...b, plan: { ...b.plan, key: d } } : b));
    expect(hudOf({ heard: 16 * 3, bars: moving, track }).heading).toEqual(d);
    expect(hudOf({ heard: null, bars, track }).heading).toEqual({ tonic: 9, mode: 'aeolian' });
    expect(hudOf({ heard: null, bars: [], track }).heading).toBeNull();
  });
});

describe('the song map', () => {
  const long = forecast(env, null, 48);

  it('shows four whole sections from the one heard, each with its eight bars', () => {
    expect(SECTIONS).toBe(4);
    const hud = hudOf({ heard: 16 * 10 + 3, bars: long, track });
    expect(hud.sections.map((s) => s.index)).toEqual([1, 2, 3, 4]);
    hud.sections.forEach((section, k) => {
      expect(section.bars.map((b) => b.bar)).toEqual(
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (k + 1) * 8 + i),
      );
      for (const b of section.bars) {
        expect(b.section).toBe(section.section);
        expect(b.key).toBe(section.key);
      }
    });
    // The section heard shows its bars already played.
    expect(hud.sections[0]!.bars[0]).toEqual(hudOf({ heard: 16 * 8, bars: long, track }).bar);
  });

  it('opens on the song’s first four sections before anything is heard', () => {
    const hud = hudOf({ heard: null, bars, track });
    expect(hud.sections.map((s) => s.index)).toEqual([0, 1, 2, 3]);
    expect(hud.sections[0]!.section).toBe('Intro');
  });

  it('leaves out a section the bars do not reach in full', () => {
    const hud = hudOf({ heard: 16 * 10, bars, track });
    expect(hud.sections.map((s) => s.index)).toEqual([1, 2, 3]);
  });

  it('marks a section whose key differs from the one before it, but never the one heard', () => {
    const d = { tonic: 2, mode: 'dorian' } as const;
    const moved = long.map((b) => (b.bar >= 16 ? { ...b, plan: { ...b.plan, key: d } } : b));
    const hud = hudOf({ heard: 16 * 9, bars: moved, track });
    expect(hud.sections.map((s) => [s.key, s.newKey])).toEqual([
      ['A aeolian', false],
      ['D dorian', true],
      ['D dorian', false],
      ['D dorian', false],
    ]);
    const later = hudOf({ heard: 16 * 16, bars: moved, track });
    expect(later.sections[0]!.newKey).toBe(false);
  });
});

describe('a style’s name', () => {
  it('is the preset it matches on every axis the preset sets, but energy', () => {
    for (const p of PRESETS) {
      expect(presetOf({ ...INITIAL_STYLE, ...p.style })).toBe(p.name);
      // Energy is ridden within a genre, and a preset sets no entropy.
      expect(presetOf({ ...INITIAL_STYLE, ...p.style, energy: 0.05, entropy: 0.95 })).toBe(p.name);
      for (const axis of ['swing', 'sync', 'harm', 'artic', 'bpm'] as const)
        expect(presetOf({ ...INITIAL_STYLE, ...p.style, [axis]: p.style[axis] + 0.01 })).toBeNull();
    }
  });

  it('is the preset the style heads for, so it names a preset chosen at once', () => {
    const chosen = glideTo(track, techno.style, 40, PRESET_GLIDE);
    expect(hudOf({ heard: 41, bars, track: chosen }).style.preset).toBe('Techno');
    const nudged = glideTo(chosen, { bpm: techno.style.bpm + 2 }, 60, SLIDER_GLIDE);
    expect(hudOf({ heard: 61, bars, track: nudged }).style.preset).toBeNull();
    const ridden = glideTo(chosen, { energy: 0.2, entropy: 0.9 }, 60, SLIDER_GLIDE);
    expect(hudOf({ heard: 61, bars, track: ridden }).style.preset).toBe('Techno');
  });
});

describe('a glide’s progress', () => {
  it('counts the bars of a preset glide heard, from the preset it left', () => {
    const settled = glideTo(track, techno.style, 0, 0);
    const moving = glideTo(settled, funk.style, 32, PRESET_GLIDE);
    expect(hudOf({ heard: 32, bars, track: moving }).style).toEqual({
      preset: 'Funk',
      glide: { from: 'Techno', bar: 1, bars: 8 },
    });
    expect(hudOf({ heard: 32 + 16 * 2 + 3, bars, track: moving }).style.glide).toEqual({
      from: 'Techno',
      bar: 3,
      bars: 8,
    });
    expect(hudOf({ heard: 32 + 16 * 8 - 1, bars, track: moving }).style.glide!.bar).toBe(8);
    expect(hudOf({ heard: 32 + 16 * 8, bars, track: moving }).style).toEqual({
      preset: 'Funk',
      glide: null,
    });
  });

  it('is under way from when it was chosen, though the step heard lags behind it', () => {
    const moving = glideTo(glideTo(track, techno.style, 0, 0), funk.style, 32, PRESET_GLIDE);
    expect(hudOf({ heard: 30, bars, track: moving }).style.glide).toEqual({
      from: 'Techno',
      bar: 1,
      bars: 8,
    });
  });

  it('leaves a custom style unnamed', () => {
    const custom = glideTo(track, { swing: 0.7 }, 0, 0);
    const moving = glideTo(custom, funk.style, 32, PRESET_GLIDE);
    expect(hudOf({ heard: 40, bars, track: moving }).style.glide!.from).toBeNull();
    const sliding = glideTo(track, { harm: 0.9 }, 32, SLIDER_GLIDE);
    expect(hudOf({ heard: 40, bars, track: sliding }).style).toEqual({
      preset: null,
      glide: { from: 'Synth-pop', bar: 1, bars: 1 },
    });
  });

  it('is no glide where the style stays where it is, as when the same preset is chosen again', () => {
    const again = glideTo(glideTo(track, techno.style, 0, 0), techno.style, 32, PRESET_GLIDE);
    expect(hudOf({ heard: 40, bars, track: again }).style).toEqual({
      preset: 'Techno',
      glide: null,
    });
  });

  it('ignores energy riding within a genre', () => {
    const ridden = glideTo(track, { energy: 1 }, 32, SLIDER_GLIDE);
    expect(hudOf({ heard: 40, bars, track: ridden }).style).toEqual({
      preset: 'Synth-pop',
      glide: null,
    });
  });
});
