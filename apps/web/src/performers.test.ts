// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { BarView, Hud } from './hud.ts';
import type { PatternBar } from './pattern.ts';
import { performersOf } from './performers.ts';

const none = { drums: [], bass: [], comp: [], lead: [] };
const bar = (over: Partial<PatternBar> = {}): PatternBar => ({
  bar: 8,
  parts: none,
  motif: null,
  ...over,
});

const barView = (over: Partial<BarView> = {}): BarView => ({
  bar: 9,
  barInSection: 1,
  section: 'Groove',
  key: 'A aeolian',
  tonic: 9,
  scale: [0, 2, 4, 5, 7, 9, 11],
  chords: [{ step: 0, symbol: 'Am7', numeral: 'i7' }],
  energy: 0.6,
  lead: 'improvising',
  motif: null,
  ...over,
});

const hud = (over: Partial<Hud> = {}): Hud => ({
  bar: barView(),
  beat: 2,
  chord: barView().chords[0]!,
  next: [],
  sections: [],
  style: { preset: 'Techno', glide: null },
  heading: { tonic: 9, mode: 'aeolian' },
  muse: { motif: null, log: [] },
  ...over,
});

describe('the stage’s performers', () => {
  it('names all four band performers in one order, drums, bass, chords, lead', () => {
    expect(performersOf(hud(), none, bar()).map((p) => p.performer)).toEqual([
      'drums',
      'bass',
      'comp',
      'lead',
    ]);
    expect(performersOf(hud(), none, bar()).map((p) => p.label)).toEqual([
      'Drums',
      'Bass',
      'Chords',
      'Lead',
    ]);
  });

  it('gives the lead its own status, and the style’s to every other performer', () => {
    const performers = performersOf(hud({ bar: barView({ lead: 'resting' }) }), none, bar());
    expect(performers.find((p) => p.performer === 'lead')!.status).toBe('Lead is resting.');
    for (const performer of ['drums', 'bass', 'comp'] as const)
      expect(performers.find((p) => p.performer === performer)!.status).toBe('Playing Techno.');
  });

  it('names whose motif the lead played in the bar its pattern shows, and no other performer’s', () => {
    const played = bar({ motif: { source: 'the computer keys', bar: 6 } });
    const performers = performersOf(hud(), none, played);
    expect(performers.find((p) => p.performer === 'lead')!.motif).toEqual({
      source: 'the computer keys',
      bar: 6,
    });
    for (const performer of ['drums', 'bass', 'comp'] as const)
      expect(performers.find((p) => p.performer === performer)!.motif).toBeNull();
    expect(performersOf(hud(), none, bar()).find((p) => p.performer === 'lead')!.motif).toBeNull();
  });

  it('names a session’s source by its player', () => {
    const played = bar({ motif: { source: '@p1/the computer keys', bar: 6 } });
    const lead = performersOf(hud(), none, played, { p1: 'Ada' }).find(
      (p) => p.performer === 'lead',
    )!;
    expect(lead.motif).toEqual({ source: "Ada's computer keys", bar: 6 });
  });

  it('keeps the motif of the bar it shows, even once the Muse offers another', () => {
    // The pattern's bar played bar 5's motif; the Muse has since moved on to bar 6's.
    const movedOn = hud({
      bar: barView({ lead: 'motif', motif: { source: 'Bob’s MIDI keyboard', bar: 6 } }),
      muse: { motif: { source: 'Bob’s MIDI keyboard', bar: 6, rows: 1, notes: [] }, log: [] },
    });
    const played = bar({ motif: { source: 'the computer keys', bar: 5 } });
    expect(performersOf(movedOn, none, played).find((p) => p.performer === 'lead')!.motif).toEqual({
      source: 'the computer keys',
      bar: 5,
    });
  });

  it('gives each performer the notes sounding on it, and only those', () => {
    const sounding = { drums: [36], bass: [33], comp: [48, 55], lead: [64] };
    const performers = performersOf(hud(), sounding, bar());
    for (const performer of ['drums', 'bass', 'comp', 'lead'] as const)
      expect(performers.find((p) => p.performer === performer)!.sounding).toEqual(
        sounding[performer],
      );
  });

  it('gives each performer the pattern of the bar it last finished, and only that one', () => {
    const pattern = {
      drums: [{ step: 0, note: 36, length: 1 }],
      bass: [{ step: 0, note: 33, length: 4 }],
      comp: [],
      lead: [{ step: 4, note: 64, length: 2 }],
    };
    const performers = performersOf(hud(), none, bar({ parts: pattern }));
    for (const performer of ['drums', 'bass', 'comp', 'lead'] as const)
      expect(performers.find((p) => p.performer === performer)!.pattern).toEqual(
        pattern[performer],
      );
  });
});
