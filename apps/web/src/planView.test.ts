import { describe, expect, it } from 'vitest';
import type { BarView, ChordView, SectionView } from './hud.ts';
import {
  CHORD_BARS,
  LARGE_TILES,
  NEAR_SECTIONS,
  blockName,
  chordTiles,
  cueOf,
  nextChord,
  planRows,
} from './planView.ts';

const chord = (symbol: string, step = 0): ChordView => ({ step, symbol, numeral: 'i' });
const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % 8,
  section: 'Groove',
  key: 'A minor',
  tonic: 9,
  scale: [0, 2, 4, 5, 7, 9, 11],
  melodic: [0, 2, 4, 5, 7, 9, 11],
  melodicName: 'plain',
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
  bars: Array.from({ length: 8 }, (_, i) => bar(index * 8 + i)),
  ...over,
});

describe('where a plan change is labelled', () => {
  it('names the section on the bar it starts, and the key on the bar it changes', () => {
    expect(cueOf(bar(8, { section: 'Drop' }), bar(7))).toBe('Drop');
    expect(cueOf(bar(9, { key: 'D dorian' }), bar(8))).toBe('D dorian');
    expect(cueOf(bar(16, { section: 'Bridge', key: 'C major' }), bar(15))).toBe('Bridge, C major');
  });

  it('labels nothing inside a section, in its key', () => {
    expect(cueOf(bar(9), bar(8))).toBe('');
  });

  it('labels the bar heard only if it starts a section, since nothing before it is shown', () => {
    expect(cueOf(bar(8, { section: 'Drop' }), null)).toBe('Drop');
    expect(cueOf(bar(9, { section: 'Drop' }), null)).toBe('');
  });
});

describe('the chords card’s bars', () => {
  const after = (n: number, count: number) =>
    Array.from({ length: count }, (_, i) => bar(n + 1 + i));

  it('are eight in all: the bar heard, then seven, the first two large', () => {
    expect(CHORD_BARS).toBe(8);
    expect(LARGE_TILES).toBe(2);
    const tiles = chordTiles(bar(9), after(9, 7));
    expect(tiles.map((t) => t.bar.bar)).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
    expect(tiles.map((t) => t.large)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('are as many as there are, none past what is decided', () => {
    expect(chordTiles(bar(9), after(9, 3))).toHaveLength(4);
    expect(chordTiles(bar(9), [])).toHaveLength(1);
    expect(chordTiles(null, after(9, 3))).toEqual([]);
  });

  it('never show more than eight, whatever they are given', () => {
    expect(chordTiles(bar(9), after(9, 15))).toHaveLength(8);
  });

  it('carry the label where a section or a key changes, at the bar it changes on', () => {
    const tiles = chordTiles(bar(6), [
      bar(7),
      bar(8, { section: 'Drop' }),
      bar(9, { section: 'Drop' }),
      bar(10, { section: 'Drop', key: 'D dorian' }),
    ]);
    expect(tiles.map((t) => t.cue)).toEqual(['', '', 'Drop', '', 'D dorian']);
  });

  it('label the bar heard when it starts a section', () => {
    expect(chordTiles(bar(8, { section: 'Drop' }), [bar(9, { section: 'Drop' })])[0]!.cue).toBe(
      'Drop',
    );
  });
});

describe('the chord that comes next', () => {
  const two = bar(9, { chords: [chord('Dm', 0), chord('E7', 8)] });

  it('is the next chord in the bar while the bar has one', () => {
    expect(nextChord({ bar: two, chord: two.chords[0]!, next: [bar(10)] })).toEqual(chord('E7', 8));
  });

  it('is the first chord of the next bar from the last chord of a bar', () => {
    expect(nextChord({ bar: two, chord: two.chords[1]!, next: [bar(10)] })).toEqual(chord('Am'));
    expect(
      nextChord({ bar: bar(9), chord: chord('Am'), next: [bar(10, { chords: [chord('F')] })] }),
    ).toEqual(chord('F'));
  });

  it('is none past what is decided, or before there is a bar', () => {
    expect(nextChord({ bar: bar(9), chord: chord('Am'), next: [] })).toBeNull();
    expect(nextChord({ bar: null, chord: null, next: [bar(10)] })).toBeNull();
  });
});

describe('the plan’s two rows', () => {
  it('put the section heard and the next in the first, the three after in the second', () => {
    expect(NEAR_SECTIONS).toBe(2);
    const rows = planRows([1, 2, 3, 4, 5].map((i) => section(i)));
    expect(rows.near.map((s) => s.index)).toEqual([1, 2]);
    expect(rows.far.map((s) => s.index)).toEqual([3, 4, 5]);
  });

  it('are as many as the bars reach', () => {
    expect(planRows([section(1)])).toEqual({ near: [section(1)], far: [] });
    expect(planRows([]).near).toEqual([]);
    expect(planRows([1, 2, 3].map((i) => section(i))).far.map((s) => s.index)).toEqual([3]);
  });

  it('name a block by its section, and the key where it changes', () => {
    expect(blockName(section(1))).toBe('Groove');
    expect(blockName(section(2, { key: 'D dorian', newKey: true }))).toBe('Groove, D dorian');
  });
});
