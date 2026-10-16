import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import type { BarView, ChordView, SectionView } from './hud.ts';
import { AHEAD_SECTIONS, overThis, sectionBars, sectionsAhead } from './songView.ts';

const chord = (symbol: string, step = 0, numeral = 'i'): ChordView => ({ step, symbol, numeral });
const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % 8,
  section: 'Groove',
  key: 'A minor',
  tonic: 9,
  scale: [0, 2, 4, 5, 7, 9, 11],
  melodic: [0, 2, 4, 5, 7, 9, 11],
  melodicName: 'plain',
  meter: METERS['4/4'],
  meterName: '4/4',
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

describe('sectionBars', () => {
  it('gives the section heard bar by bar: those played, the one heard, those ahead', () => {
    const bars = sectionBars([section(1)], 10);
    expect(bars.map((b) => b.state)).toEqual([
      'played',
      'played',
      'heard',
      'ahead',
      'ahead',
      'ahead',
      'ahead',
      'ahead',
    ]);
    expect(bars.map((b) => b.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('is all ahead before anything is heard: the section the song opens on', () => {
    expect(sectionBars([section(0)], null).every((b) => b.state === 'ahead')).toBe(true);
  });

  it('names a bar by its chords and the first one’s numeral, and credits the motif it plays', () => {
    const own = section(1, {
      bars: Array.from({ length: 8 }, (_, i) =>
        bar(8 + i, {
          chords: i === 1 ? [chord('Am'), chord('G', 8, 'VII')] : [chord('F', 0, 'VI')],
          motif: i === 1 ? credit : null,
        }),
      ),
    });
    const [first, second] = sectionBars([own], 8);
    expect(first).toMatchObject({ chords: 'F', numeral: 'VI', motif: null });
    expect(second).toMatchObject({ chords: 'Am G', numeral: 'i', motif: credit });
  });

  it('has nothing to show before the plan holds a section', () => {
    expect(sectionBars([], null)).toEqual([]);
  });
});

describe('sectionsAhead', () => {
  it('gives the sections after the one heard, each as its bars’ first chords', () => {
    const later = section(2, {
      section: 'Bridge',
      key: 'C major',
      newKey: true,
      bars: Array.from({ length: 8 }, (_, i) => bar(16 + i, { chords: [chord(`C${i}`)] })),
    });
    const ahead = sectionsAhead([section(1), later, section(3), section(4)]);
    expect(ahead).toHaveLength(AHEAD_SECTIONS);
    expect(ahead[0]).toEqual({
      index: 2,
      name: 'Bridge',
      change: 'C major',
      chords: ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    });
    expect(ahead[1]!.change).toBe('');
  });

  it('says a new meter where it comes, with a new key', () => {
    const later = section(2, { newKey: true, key: 'D dorian', newMeter: true, meterName: '7/8' });
    expect(sectionsAhead([section(1), later])[0]!.change).toBe('D dorian, 7/8');
  });
});

describe('overThis', () => {
  it('spells the notes a person may play over the bar heard, in its key, and names the scale where it isn’t plain', () => {
    expect(overThis(bar(0))).toBe('A B C D E F G');
    expect(overThis(bar(0, { melodic: [9, 0, 2, 4, 7], melodicName: 'pentatonic' }))).toBe(
      'A C D E G · pentatonic',
    );
  });

  it('says nothing before the plan holds a bar', () => {
    expect(overThis(null)).toBe('');
  });
});
