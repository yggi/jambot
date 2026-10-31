import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import type { BarView, ChordView, SectionView } from './hud.ts';
import { SONG_SECTIONS, chordsOf, overThis, songSections } from './songView.ts';

const chord = (symbol: string, step = 0, numeral = 'i'): ChordView => ({
  step,
  symbol,
  numeral,
  notes: [],
});
const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % 8,
  sectionIndex: Math.floor(n / 8),
  fragments: { meter: null, rhythm: null, clave: null },
  section: 'Groove',
  key: 'A minor',
  tonic: 9,
  scale: [0, 2, 4, 5, 7, 9, 11],
  melodic: [0, 2, 4, 5, 7, 9, 11],
  melodicName: 'plain',
  meter: METERS['4/4'],
  meterName: '4/4',
  swingLevel: '16n',
  swingShare: null,
  chords: [chord('Am')],
  energy: 0.5,
  lead: 'improvising',
  motif: null,
  ...over,
});
const section = (index: number, over: Partial<SectionView> = {}): SectionView => ({
  index,
  section: 'Groove',
  key: 'A minor',
  newKey: false,
  meterName: '4/4',
  newMeter: false,
  bars: Array.from({ length: 8 }, (_, i) => bar(index * 8 + i)),
  ...over,
});
const credit = { source: 'p1', bar: 9, name: 'Ada', colour: 1 } as const;

describe('songSections', () => {
  it('gives the sections from the one heard on, bar by bar: those played, the one heard, those ahead', () => {
    const shown = songSections([section(1), section(2)], 10);
    expect(shown.map((s) => s.index)).toEqual([1, 2]);
    expect(shown[0]!.bars.map((b) => b.state)).toEqual([
      'played',
      'played',
      'heard',
      'ahead',
      'ahead',
      'ahead',
      'ahead',
      'ahead',
    ]);
    expect(shown[1]!.bars.every((b) => b.state === 'ahead')).toBe(true);
  });

  it('shows as many as are decided, to four', () => {
    expect(SONG_SECTIONS).toBe(4);
    const five = [1, 2, 3, 4, 5].map((i) => section(i));
    expect(songSections(five, 8).map((s) => s.index)).toEqual([1, 2, 3, 4]);
    expect(songSections([section(1)], 8)).toHaveLength(1);
    expect(songSections([], null)).toEqual([]);
  });

  it('is all ahead before anything is heard: the song from where it opens', () => {
    expect(songSections([section(0)], null)[0]!.bars.every((b) => b.state === 'ahead')).toBe(true);
  });

  it('names a section by what changes in it: a new key, a new meter, or nothing', () => {
    const later = section(2, { newKey: true, key: 'D dorian', newMeter: true, meterName: '7/8' });
    const shown = songSections(
      [section(1), later, section(3, { newKey: true, key: 'C major' })],
      8,
    );
    expect(shown.map((s) => s.change)).toEqual(['', 'D dorian, 7/8', 'C major']);
  });

  it('credits the motif a bar plays', () => {
    const own = section(1, {
      bars: section(1).bars.map((b, i) => (i === 1 ? { ...b, motif: credit } : b)),
    });
    expect(songSections([own], 8)[0]!.bars.map((b) => b.motif)).toEqual([
      null,
      credit,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

describe('chordsOf', () => {
  it('gives each chord of a bar the share of it it holds, from where it starts', () => {
    expect(chordsOf(bar(0, { chords: [chord('Am', 0), chord('G', 8, 'VII')] }))).toEqual([
      { symbol: 'Am', numeral: 'i', share: 0.5, notes: [] },
      { symbol: 'G', numeral: 'VII', share: 0.5, notes: [] },
    ]);
    expect(chordsOf(bar(0, { chords: [chord('Am', 0), chord('E7', 12, 'V7')] }))).toEqual([
      { symbol: 'Am', numeral: 'i', share: 0.75, notes: [] },
      { symbol: 'E7', numeral: 'V7', share: 0.25, notes: [] },
    ]);
  });

  it('carries each chord’s notes, spelled in its key', () => {
    const am = {
      ...chord('Am'),
      notes: [
        { name: 'A', pitchClass: 9 },
        { name: 'C', pitchClass: 0 },
        { name: 'E', pitchClass: 4 },
      ],
    };
    expect(chordsOf(bar(0, { chords: [am] }))[0]!.notes).toEqual(am.notes);
  });

  it('reads the bar in its own meter: a bar of 7/8 has 14 steps', () => {
    const seven = bar(0, { meter: METERS['7/8'], chords: [chord('Am', 0), chord('G', 6)] });
    expect(chordsOf(seven).map((c) => c.share)).toEqual([6 / 14, 8 / 14]);
  });

  it('fills the bar: the shares of every bar add up to one', () => {
    for (const steps of [[0], [0, 4], [0, 8, 12], [0, 2, 6, 10, 14]]) {
      const shares = chordsOf(bar(0, { chords: steps.map((s) => chord('C', s)) })).map(
        (c) => c.share,
      );
      expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    }
  });
});

describe('overThis', () => {
  it('spells the notes a person may play over the bar heard, in its key, and names the scale where it isn’t plain', () => {
    const said = (over: ReturnType<typeof overThis>) =>
      [over.notes.map((n) => n.name).join(' '), over.scale].filter(Boolean).join(' · ');
    expect(said(overThis(bar(0)))).toBe('A B C D E F G');
    expect(overThis(bar(0)).notes.map((n) => n.pitchClass)).toEqual([9, 11, 0, 2, 4, 5, 7]);
    expect(said(overThis(bar(0, { melodic: [9, 0, 2, 4, 7], melodicName: 'pentatonic' })))).toBe(
      'A C D E G · pentatonic',
    );
  });

  it('says nothing before the plan holds a bar', () => {
    expect(overThis(null)).toEqual({ notes: [], scale: null });
  });
});
