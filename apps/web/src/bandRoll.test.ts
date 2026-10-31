// @vitest-environment node
import { CLAVES_NOTE, DRUM_NOTES } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { DRUM_ROWS, SHAPES, bandRoll, drumRow } from './bandRoll.ts';
import { PERFORMERS, type Performer } from './sounding.ts';
import type { BarFrame, PerformerView, PlayerView, TracksView } from './tracks.ts';

const framed = (bars: number): BarFrame[] =>
  Array.from({ length: bars }, (_, i) => ({
    start: i * 16,
    steps: 16,
    pulses: [0, 4, 8, 12].map((p) => i * 16 + p),
  }));

const performer = (p: Performer, over: Partial<PerformerView> = {}): PerformerView => ({
  performer: p,
  label: p,
  status: '',
  sounding: [],
  notes: [],
  motifs: [],
  muted: false,
  soloed: false,
  sounds: true,
  level: 1,
  ...over,
});

const tracks = (over: Partial<TracksView> = {}): TracksView => ({
  first: 0,
  frame: framed(5),
  span: 80,
  playhead: 40,
  performers: [
    performer('drums', {
      notes: [
        { step: 0, note: 36, length: 1 },
        { step: 4, note: 38, length: 1 },
      ],
    }),
    performer('bass', { notes: [{ step: 0, note: 45, length: 4 }] }),
    performer('comp', {
      notes: [
        { step: 0, note: 57, length: 16 },
        { step: 0, note: 64, length: 16 },
      ],
    }),
    performer('lead', { notes: [{ step: 44, note: 72, length: 2 }] }),
  ],
  players: [],
  ...over,
});

const player = (over: Partial<PlayerView> = {}): PlayerView => ({
  part: 'lead',
  source: 'k',
  name: 'Ada',
  colour: 2,
  heardAs: false,
  local: false,
  notes: [{ step: 50, note: 76, length: 2 }],
  taken: null,
  ...over,
});

describe('the band’s roll: every voice on one grid', () => {
  it('gives each performer its own shape, every one, and none twice', () => {
    expect(new Set(PERFORMERS.map((p) => SHAPES[p])).size).toBe(PERFORMERS.length);
    const roll = bandRoll(tracks());
    for (const p of PERFORMERS)
      for (const mark of roll.marks.filter((m) => m.voice === p))
        expect(mark.shape).toBe(SHAPES[p]);
  });

  it('outlines the band’s notes in their voice’s colour and a player’s in theirs, keeping the shape of the part they play', () => {
    const roll = bandRoll(
      tracks({
        players: [player(), player({ part: 'drums', notes: [{ step: 8, note: 42, length: 1 }] })],
      }),
    );
    for (const p of PERFORMERS)
      for (const mark of roll.marks.filter((m) => m.voice === p && m.player === null))
        expect(mark.who).toBe(`var(--voice-${p})`);
    const ada = roll.marks.filter((m) => m.player === 'k');
    expect(ada.map((m) => [m.shape, m.who])).toEqual([
      ['chevron', 'var(--source-2)'],
      ['square', 'var(--source-2)'],
    ]);
  });

  it('outlines the lead’s notes in a bar that played a motif in that motif’s player’s colour', () => {
    const credit = { source: 'k', name: 'Ada', colour: 3, bar: 1 };
    const lead = performer('lead', {
      notes: [
        { step: 4, note: 72, length: 2 },
        { step: 20, note: 74, length: 2 },
      ],
      motifs: [{ at: 1, credit }],
    });
    const roll = bandRoll(tracks({ performers: [lead] }));
    expect(roll.marks.map((m) => m.who)).toEqual(['var(--voice-lead)', 'var(--source-3)']);
  });

  it('lays the drums in their strip by row, every drum the band strikes, kick lowest, hats and cymbals on top', () => {
    expect(drumRow(DRUM_NOTES.kick)).toBe(0);
    for (const sound of ['rim', 'snare', 'clap'] as const)
      expect(drumRow(DRUM_NOTES[sound])).toBe(1);
    for (const sound of ['closedHat', 'pedalHat', 'openHat', 'ride'] as const)
      expect(drumRow(DRUM_NOTES[sound])).toBe(2);
    expect(drumRow(CLAVES_NOTE)).toBe(2);
    expect(DRUM_ROWS).toBe(3);
    const drums = bandRoll(tracks()).marks.filter((m) => m.voice === 'drums');
    expect(drums.map((m) => [m.pitch, m.row])).toEqual([
      [null, 0],
      [null, 1],
    ]);
  });

  it('spans the pitches every voice plays, a whole note’s room around them, two octaves at least', () => {
    const roll = bandRoll(tracks());
    expect(roll.low).toBeLessThanOrEqual(44);
    expect(roll.high).toBeGreaterThanOrEqual(73);
    for (const mark of roll.marks.filter((m) => m.pitch !== null)) {
      expect(mark.y).toBeGreaterThanOrEqual(0);
      expect(mark.y + mark.h).toBeLessThanOrEqual(1);
    }
    const narrow = bandRoll(
      tracks({ performers: [performer('lead', { notes: [{ step: 0, note: 60, length: 1 }] })] }),
    );
    expect(narrow.high - narrow.low).toBeGreaterThanOrEqual(24);
    // higher is further up
    const [bass, , , lead] = ['bass', 'comp', 'comp', 'lead'].map((v) =>
      roll.marks.find((m) => m.voice === v)!,
    );
    expect(lead!.y).toBeLessThan(bass!.y);
  });

  it('places each note across the bars shown, and says which are played and which still to come', () => {
    const roll = bandRoll(tracks());
    const bass = roll.marks.find((m) => m.voice === 'bass')!;
    expect([bass.x, bass.w]).toEqual([0, 4 / 80]);
    expect(bass.past).toBe(true);
    expect(roll.marks.find((m) => m.voice === 'lead')!.past).toBe(false);
    expect(roll.playhead).toBe(0.5);
    expect(roll.bars).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
    expect(bandRoll(tracks({ playhead: null })).marks.every((m) => !m.past)).toBe(true);
  });

  it('dims a voice that doesn’t sound here', () => {
    const roll = bandRoll(
      tracks({
        performers: [
          performer('bass', { sounds: false, notes: [{ step: 0, note: 45, length: 4 }] }),
        ],
      }),
    );
    expect(roll.marks[0]!.sounds).toBe(false);
  });

  it('leaves out a cell the Muse heard from a player: its rows are degrees, not pitches', () => {
    const roll = bandRoll(tracks({ players: [player({ heardAs: true })] }));
    expect(roll.marks.some((m) => m.player === 'k')).toBe(false);
  });

  it('marks the bar the Muse took a motif from, in its player’s colour', () => {
    const roll = bandRoll(tracks({ players: [player({ taken: 2 })] }));
    expect(roll.taken).toEqual([{ x: 0.4, w: 0.2, who: 'var(--source-2)' }]);
    expect(bandRoll(tracks({ players: [player()] })).taken).toEqual([]);
  });
});
