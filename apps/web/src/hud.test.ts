// @vitest-environment node
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
  leadRests,
  MELODIC_SCALES,
  melodicHelix,
} from '@jambot/engine';
import { positions } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  NEXT_BARS,
  SECTIONS,
  axesOf,
  hudOf,
  leadStatus,
  presetOf,
  styleName,
  styleStatus,
  styleSub,
  styleWords,
} from './hud.ts';
import { CHORD_BARS } from './planView.ts';
import type { BarView } from './hud.ts';
import { keyName } from './noteNames.ts';

const techno = PRESETS.find((p) => p.name === 'Techno')!;
const funk = PRESETS.find((p) => p.name === 'Funk')!;
// At entropy 0 the band never moves the key itself (#169), so a test that moves it does so by hand.
const track = holding({ ...INITIAL_STYLE, entropy: 0 });
const env: TransportEnv = {
  seed: 5,
  start: 0,
  track,
  wish: { tonic: null, mode: 'aeolian', melodic: null },
};
const bars = forecast(env, null, 40);

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
    expect(hud.bar!.key).toBe('A minor');
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

  it('shows the bars after the one heard, seven at most, as far as the forecast reaches (finite: every bar of the forecast)', () => {
    const upTo = (from: number, to: number) =>
      Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
    expect(NEXT_BARS).toBe(7);
    expect(NEXT_BARS).toBe(CHORD_BARS - 1);
    for (const here of bars) {
      expect(hudOf({ heard: here.bar * 16 + 5, bars, track }).next.map((b) => b.bar)).toEqual(
        upTo(here.bar + 1, Math.min(here.bar + 1 + NEXT_BARS, bars.length)),
      );
    }
    expect(hudOf({ heard: null, bars, track }).next.map((b) => b.bar)).toEqual(upTo(1, 8));
    expect(hudOf({ heard: 16 * 3 + 5, bars, track }).next.map((b) => b.bar)).toEqual(upTo(4, 11));
    expect(hudOf({ heard: 16 * 37, bars, track }).next.map((b) => b.bar)).toEqual([38, 39]);
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

  it('shows the melodic scale of the bar’s own plan, its notes and its name, beside the key’s own notes (#209)', () => {
    for (const melodic of MELODIC_SCALES) {
      const moved = bars.map((b) => (b.bar >= 16 ? { ...b, plan: { ...b.plan, melodic } } : b));
      const at = hudOf({ heard: 16 * 16, bars: moved, track }).bar!;
      const { key } = moved[16]!.plan;
      expect(at.melodic).toEqual(positions(melodicHelix(key, melodic)));
      expect(at.melodicName).toBe(melodic);
      expect(at.scale).toEqual([0, 2, 4, 5, 7, 9, 11]);
      const before = hudOf({ heard: 0, bars: moved, track }).bar!;
      expect([before.melodic, before.melodicName]).toEqual([[0, 2, 4, 5, 7, 9, 11], 'plain']);
    }
    // A minor's pentatonic: A C D E G.
    const penta = bars.map((b) => ({ ...b, plan: { ...b.plan, melodic: 'pentatonic' as const } }));
    expect(hudOf({ heard: 0, bars: penta, track }).bar!.melodic).toEqual([0, 2, 4, 7, 9]);
  });

  it('gives the melodic scale the band is heading for: the last bar decided’s (#209)', () => {
    const moving = bars.map((b) =>
      b.bar >= 16 ? { ...b, plan: { ...b.plan, melodic: 'blues' as const } } : b,
    );
    expect(hudOf({ heard: 16 * 3, bars: moving, track }).headingMelodic).toBe('blues');
    expect(hudOf({ heard: null, bars, track }).headingMelodic).toBe('plain');
    expect(hudOf({ heard: null, bars: [], track }).headingMelodic).toBeNull();
  });

  it('gives the bar’s own tonic, not another', () => {
    const d = { tonic: 0, mode: 'dorian' } as const;
    const moved = bars.map((b) => (b.bar >= 16 ? { ...b, plan: { ...b.plan, key: d } } : b));
    expect(hudOf({ heard: 16 * 16, bars: moved, track }).bar!.tonic).toBe(0);
    expect(hudOf({ heard: 0, bars: moved, track }).bar!.tonic).toBe(9);
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
  const long = forecast(env, null, 64);

  it('shows five whole sections from the one heard, each with its eight bars', () => {
    expect(SECTIONS).toBe(5);
    const hud = hudOf({ heard: 16 * 10 + 3, bars: long, track });
    expect(hud.sections.map((s) => s.index)).toEqual([1, 2, 3, 4, 5]);
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

  it('opens on the song’s first five sections before anything is heard', () => {
    const hud = hudOf({ heard: null, bars, track });
    expect(hud.sections.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);
    expect(hud.sections[0]!.section).toBe('Intro');
  });

  it('leaves out a section the bars do not reach in full', () => {
    const hud = hudOf({ heard: 16 * 10, bars, track });
    expect(hud.sections.map((s) => s.index)).toEqual([1, 2, 3, 4]);
  });

  it('marks a section whose key differs from the one before it, but never the one heard', () => {
    const d = { tonic: 2, mode: 'dorian' } as const;
    const moved = long.map((b) => (b.bar >= 16 ? { ...b, plan: { ...b.plan, key: d } } : b));
    const hud = hudOf({ heard: 16 * 9, bars: moved, track });
    expect(hud.sections.map((s) => [s.key, s.newKey])).toEqual([
      ['A minor', false],
      ['D dorian', true],
      ['D dorian', false],
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
    expect(hudOf({ heard: 32, bars, track: moving }).style).toMatchObject({
      preset: 'Funk',
      glide: { from: 'Techno', bar: 1, bars: 8 },
    });
    expect(hudOf({ heard: 32 + 16 * 2 + 3, bars, track: moving }).style.glide).toEqual({
      from: 'Techno',
      bar: 3,
      bars: 8,
    });
    expect(hudOf({ heard: 32 + 16 * 8 - 1, bars, track: moving }).style.glide!.bar).toBe(8);
    expect(hudOf({ heard: 32 + 16 * 8, bars, track: moving }).style).toMatchObject({
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
    expect(hudOf({ heard: 40, bars, track: sliding }).style).toMatchObject({
      preset: null,
      glide: { from: 'Synth-pop', bar: 1, bars: 1 },
    });
  });

  it('is no glide where the style stays where it is, as when the same preset is chosen again', () => {
    const again = glideTo(glideTo(track, techno.style, 0, 0), techno.style, 32, PRESET_GLIDE);
    expect(hudOf({ heard: 40, bars, track: again }).style).toMatchObject({
      preset: 'Techno',
      glide: null,
    });
  });

  it('ignores energy riding within a genre', () => {
    const ridden = glideTo(track, { energy: 1 }, 32, SLIDER_GLIDE);
    expect(hudOf({ heard: 40, bars, track: ridden }).style).toMatchObject({
      preset: 'Synth-pop',
      glide: null,
    });
  });
});

describe('the lead status line, reused by the stage and its tracks', () => {
  const barView = (over: Partial<BarView> = {}): BarView => ({
    bar: 9,
    barInSection: 1,
    section: 'Groove',
    key: 'A minor',
    tonic: 9,
    scale: [0, 2, 4, 5, 7, 9, 11],
    melodic: [0, 2, 4, 5, 7, 9, 11],
    melodicName: 'plain',
    chords: [{ step: 0, symbol: 'Am7', numeral: 'i7' }],
    energy: 0.6,
    lead: 'improvising',
    motif: null,
    ...over,
  });

  it('says the band plays on its own before anything is heard', () => {
    expect(leadStatus({ bar: barView(), beat: null })).toBe(
      'The band plays on its own once started.',
    );
    expect(leadStatus({ bar: null, beat: 0 })).toBe('The band plays on its own once started.');
  });

  it('says the lead is resting, improvising, or playing a motif, whose and heard in which bar, counted from 1', () => {
    expect(leadStatus({ bar: barView({ lead: 'resting' }), beat: 0 })).toBe('Lead is resting.');
    expect(leadStatus({ bar: barView({ lead: 'improvising' }), beat: 0 })).toBe(
      'Lead is improvising.',
    );
    const motif = { source: '@p1/keys', name: 'Ada’s keys', colour: 1, bar: 6 };
    expect(leadStatus({ bar: barView({ lead: 'motif', motif }), beat: 0 })).toBe(
      'Lead is playing the motif from Ada’s keys, heard in bar 7.',
    );
  });
});

const axes = axesOf(INITIAL_STYLE);

describe('the style status line, reused by the tracks', () => {
  it('says a preset plays, a glide moves between two, or the style is custom', () => {
    expect(styleStatus({ preset: 'Techno', glide: null, axes })).toBe('Playing Techno.');
    expect(styleStatus({ preset: 'Funk', glide: { from: 'Techno', bar: 3, bars: 8 }, axes })).toBe(
      'Moving from Techno to Funk, bar 3 of 8.',
    );
    expect(styleStatus({ preset: 'Funk', glide: { from: null, bar: 1, bars: 8 }, axes })).toBe(
      'Moving from Custom to Funk, bar 1 of 8.',
    );
    expect(styleStatus({ preset: null, glide: { from: 'Techno', bar: 1, bars: 1 }, axes })).toBe(
      'Custom style. Pick a preset to glide somewhere named.',
    );
  });
});

describe('the view of the Muse', () => {
  const motif = {
    cycle: 16,
    onsets: [0, 4, 6, 8],
    degrees: [0, 2, null, -1],
    accidentals: [0, -1, 0, 0],
  };
  const offer = { motif, source: 'the computer keys', bar: 5, level: 90 };
  const offered = bars.map((b) => ({ ...b, offer: b.bar >= 7 ? offer : null }));

  it('says the lead plays the motif, whose and from which bar, where a bar has one on offer', () => {
    expect(hudOf({ heard: 16 * 6, bars: offered, track }).bar).toMatchObject({
      lead: leadRests(offered[6]!.plan.section.type, offered[6]!.barEnergy)
        ? 'resting'
        : 'improvising',
      motif: null,
    });
    expect(hudOf({ heard: 16 * 7, bars: offered, track }).bar).toMatchObject({
      lead: 'motif',
      motif: { source: 'the computer keys', name: 'the computer keys', colour: 0, bar: 5 },
    });
  });

  it('credits each bar’s motif to its player in a session, by name and colour, the bars ahead and the song map’s alike', () => {
    const ada = { ...offer, source: '@p1/the computer keys' };
    const session = bars.map((b) => ({ ...b, offer: b.bar >= 7 ? ada : null }));
    const hud = hudOf({
      heard: 16 * 6,
      bars: session,
      track,
      muse: { offer: ada, log: [], players: { host: 'Bo', p1: 'Ada' } },
    });
    const named = {
      source: '@p1/the computer keys',
      name: "Ada's computer keys",
      colour: 1,
      bar: 5,
    };
    expect(hud.bar!.motif).toBeNull();
    expect(hud.next[0]).toMatchObject({ bar: 7, lead: 'motif', motif: named });
    expect(hud.sections[0]!.bars[7]).toMatchObject({ bar: 7, motif: named });
  });

  it('draws the motif on offer: each note’s step, length and row from its lowest, a rest left out', () => {
    const hud = hudOf({ heard: 0, bars, track, muse: { offer, log: [] } });
    expect(hud.muse.motif).toEqual({
      source: 'the computer keys',
      name: 'the computer keys',
      colour: 0,
      bar: 5,
      rows: 4,
      notes: [
        { step: 0, length: 4, row: 1, altered: false },
        { step: 4, length: 2, row: 3, altered: true },
        { step: 8, length: 8, row: 0, altered: false },
      ],
    });
    expect(hudOf({ heard: 0, bars, track }).muse).toEqual({ motif: null, log: [] });
  });

  it('writes the log as the prototype does, the latest first, what was taken marked', () => {
    const judged = (
      bar: number,
      judgements: unknown[],
      taken: boolean,
      forgot: string | null = null,
    ) => ({ bar, judgements, offer: taken ? { ...offer, bar } : null, forgot }) as never;
    const log = [
      judged(1, [{ kind: 'too few', source: 's', count: 1 }], false),
      judged(2, [{ kind: 'too few', source: 's', count: 2 }], false),
      judged(3, [{ kind: 'mashing', source: 's', count: 14 }], false),
      judged(4, [{ kind: 'too wide', source: 's', range: 21 }], false),
      judged(5, [{ kind: 'motif', source: 'the computer keys', motif }], true),
      judged(9, [], false, 'asked'),
      judged(30, [], false, 'silence'),
    ];
    expect(hudOf({ heard: 0, bars, track, muse: { offer: null, log } }).muse.log).toEqual([
      { bar: 30, text: 'Nobody has played for 16 bars. Back to improvising.', taken: false },
      { bar: 9, text: 'Forgot the motif, as asked.', taken: false },
      { bar: 5, text: 'Took a 3-note motif from the computer keys.', taken: true },
      { bar: 4, text: 'The leaps span 21 semitones, too wide to reuse.', taken: false },
      { bar: 3, text: '14 notes in one bar reads as mashing. Ignored.', taken: false },
      { bar: 2, text: 'Heard 2 notes. A motif needs at least 3.', taken: false },
      { bar: 1, text: 'Heard 1 note. A motif needs at least 3.', taken: false },
    ]);
  });

  it("says, in the log among the bars, why the Muse didn't hear what a client sent", () => {
    const judgement = { kind: 'motif', source: "Ada's computer keys", motif } as never;
    const log = [{ bar: 4, judgements: [], offer: null, forgot: 'asked' }] as never;
    const dropped = [
      { bar: 3, judgement, why: 'late' },
      { bar: 7, judgement, why: 'ahead' },
      { bar: 5, judgement, why: 'inadmissible' },
    ] as const;
    expect(hudOf({ heard: 0, bars, track, muse: { offer: null, log, dropped } }).muse.log).toEqual([
      { bar: 7, text: "Ada's computer keys sent a bar not yet played. Ignored.", taken: false },
      {
        bar: 5,
        text: "Ada's computer keys sent what no ear would have judged. Ignored.",
        taken: false,
      },
      { bar: 4, text: 'Forgot the motif, as asked.', taken: false },
      {
        bar: 3,
        text: "What Ada's computer keys played came too late to be heard.",
        taken: false,
      },
    ]);
  });
});

describe('the style card’s words', () => {
  const view = (over: Partial<Parameters<typeof styleSub>[0]> = {}) => ({
    preset: 'Synth-pop' as string | null,
    glide: null,
    axes,
    ...over,
  });

  it('names the closest style, and Custom where no preset matches', () => {
    expect(styleName(view())).toBe('Synth-pop');
    expect(styleName(view({ preset: null }))).toBe('Custom');
  });

  it('says a preset playing, a glide under way to a preset, and a custom style by its two most telling axes', () => {
    expect(styleSub(view())).toBe('Playing Synth-pop');
    expect(styleSub(view({ preset: 'Ambient', glide: { from: 'Funk', bar: 2, bars: 8 } }))).toBe(
      'Gliding to Ambient',
    );
    const swungSparse = { ...axes, swing: 0.9, energy: 0.1, sync: 0.5, harm: 0.5, artic: 0.5 };
    expect(styleSub(view({ preset: null, axes: swungSparse }))).toBe('Custom · swung, sparse');
  });

  it('says a client that the host sets it', () => {
    expect(styleSub(view(), true)).toBe('Playing Synth-pop · the host sets it');
  });

  it('gives a word to each end of each axis, the two furthest from the middle, in axis order', () => {
    const middle = { swing: 0.5, sync: 0.5, harm: 0.5, artic: 0.5, energy: 0.5, entropy: 0.5 };
    expect(styleWords(middle)).toEqual([]);
    const ends = {
      swing: ['straight', 'swung'],
      sync: ['on the beat', 'syncopated'],
      harm: ['static', 'rich'],
      artic: ['legato', 'staccato'],
      energy: ['sparse', 'dense'],
      entropy: ['predictable', 'surprising'],
    } as const;
    for (const [axis, [low, high]] of Object.entries(ends)) {
      expect(styleWords({ ...middle, [axis]: 0 })).toEqual([low]);
      expect(styleWords({ ...middle, [axis]: 1 })).toEqual([high]);
    }
    expect(styleWords({ ...middle, artic: 1, entropy: 0.9, swing: 0.8 })).toEqual([
      'staccato',
      'surprising',
    ]);
  });
});

describe('the axes of the style heard', () => {
  it('follow a glide, so an intermediate step reads an intermediate value', () => {
    const settled = glideTo(track, { swing: 0 }, 0, 0);
    const moving = glideTo(settled, { swing: 1 }, 32, PRESET_GLIDE);
    const swingAt = (heard: number) => hudOf({ heard, bars, track: moving }).style.axes.swing;
    expect(swingAt(32)).toBe(0);
    expect(swingAt(32 + 16 * 4)).toBeGreaterThan(0);
    expect(swingAt(32 + 16 * 4)).toBeLessThan(1);
    expect(swingAt(32 + 16 * 8)).toBe(1);
  });
});
