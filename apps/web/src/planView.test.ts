import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import type { BarView, ChordView, SectionView } from './hud.ts';
import { blockName, cueOf, beatsToNext, nextChord } from './planView.ts';

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

describe('a section’s name', () => {
  it('is its section, and the key where it changes', () => {
    expect(blockName(section(1))).toBe('Groove');
    expect(blockName(section(2, { key: 'D dorian', newKey: true }))).toBe('Groove, D dorian');
  });
});

describe('the beats until the next chord', () => {
  const beatSteps = [0, 4, 8, 12];
  const span = 16;
  const one = bar(9);
  const two = bar(9, { chords: [chord('Dm', 0), chord('E7', 8)] });
  const hudAt = (here: BarView, beat: number | null, sounding = 0, next = [bar(10)]) => ({
    bar: here,
    beat,
    chord: here.chords[sounding]!,
    next,
  });

  it('counts down 4, 3, 2, 1 to the next bar from a bar of one chord (finite: every beat)', () => {
    expect([0, 1, 2, 3].map((beat) => beatsToNext(hudAt(one, beat), beatSteps, span))).toEqual([
      4, 3, 2, 1,
    ]);
  });

  it('counts to the next chord in the bar while there is one, and to the bar after it', () => {
    expect([0, 1].map((beat) => beatsToNext(hudAt(two, beat), beatSteps, span))).toEqual([2, 1]);
    expect([2, 3].map((beat) => beatsToNext(hudAt(two, beat, 1), beatSteps, span))).toEqual([2, 1]);
  });

  it('is never below 1, and none before anything is heard or past what is decided', () => {
    for (const beat of [0, 1, 2, 3])
      expect(beatsToNext(hudAt(one, beat), beatSteps, span)!).toBeGreaterThanOrEqual(1);
    expect(beatsToNext(hudAt(one, null), beatSteps, span)).toBeNull();
    expect(beatsToNext(hudAt(one, 1, 0, []), beatSteps, span)).toBeNull();
  });

  it('counts to the beat a chord starts on or after, for a chord between beats', () => {
    const off = bar(9, { chords: [chord('Dm', 0), chord('E7', 6)] });
    expect(beatsToNext(hudAt(off, 0), beatSteps, span)).toBe(2);
  });
});
