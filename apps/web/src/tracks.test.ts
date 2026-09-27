import { describe, expect, it } from 'vitest';
import type { BarView, Hud } from './hud.ts';
import { tracksOf } from './tracks.ts';

const none = { drums: [], bass: [], comp: [], lead: [] };

const barView = (over: Partial<BarView> = {}): BarView => ({
  bar: 9,
  barInSection: 1,
  section: 'Groove',
  key: 'A aeolian',
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

describe('the stage’s tracks', () => {
  it('names all four band members in one order, drums, bass, chords, lead', () => {
    expect(tracksOf(hud(), none, none).map((t) => t.part)).toEqual([
      'drums',
      'bass',
      'comp',
      'lead',
    ]);
    expect(tracksOf(hud(), none, none).map((t) => t.label)).toEqual([
      'Drums',
      'Bass',
      'Chords',
      'Lead',
    ]);
  });

  it('gives the lead its own status, and the style’s to every other track', () => {
    const tracks = tracksOf(hud({ bar: barView({ lead: 'resting' }) }), none, none);
    expect(tracks.find((t) => t.part === 'lead')!.status).toBe('Lead is resting.');
    for (const part of ['drums', 'bass', 'comp'] as const)
      expect(tracks.find((t) => t.part === part)!.status).toBe('Playing Techno.');
  });

  it('names the lead’s source only while it plays a motif, and no other track’s', () => {
    const playing = hud({
      bar: barView({ lead: 'motif', motif: 6 }),
      muse: { motif: { source: 'Ada’s computer keys', bar: 6, rows: 1, notes: [] }, log: [] },
    });
    const tracks = tracksOf(playing, none, none);
    expect(tracks.find((t) => t.part === 'lead')!.source).toBe('Ada’s computer keys');
    for (const part of ['drums', 'bass', 'comp'] as const)
      expect(tracks.find((t) => t.part === part)!.source).toBeNull();
    const resting = tracksOf(hud({ bar: barView({ lead: 'resting' }) }), none, none);
    expect(resting.find((t) => t.part === 'lead')!.source).toBeNull();
  });

  it('gives each track the notes sounding on it, and only those', () => {
    const sounding = { drums: [36], bass: [33], comp: [48, 55], lead: [64] };
    const tracks = tracksOf(hud(), sounding, none);
    for (const part of ['drums', 'bass', 'comp', 'lead'] as const)
      expect(tracks.find((t) => t.part === part)!.sounding).toEqual(sounding[part]);
  });

  it('gives each track the pattern of the bar it last finished, and only that one', () => {
    const pattern = {
      drums: [{ step: 0, note: 36, length: 1 }],
      bass: [{ step: 0, note: 33, length: 4 }],
      comp: [],
      lead: [{ step: 4, note: 64, length: 2 }],
    };
    const tracks = tracksOf(hud(), none, pattern);
    for (const part of ['drums', 'bass', 'comp', 'lead'] as const)
      expect(tracks.find((t) => t.part === part)!.pattern).toEqual(pattern[part]);
  });
});
