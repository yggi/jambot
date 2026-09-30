// @vitest-environment node
import { playerSource } from '@jambot/session';
import { describe, expect, it } from 'vitest';
import type { BarView, Hud, MotifView } from './hud.ts';
import { EVEN_MIX } from './mix.ts';
import { EMPTY_PATTERN, PATTERN_BARS, type PatternBar } from './pattern.ts';
import type { HumanNote } from './player.svelte.ts';
import { type TracksInput, tracksOf } from './tracks.ts';

const none = { drums: [], bass: [], comp: [], lead: [] };

const barView = (over: Partial<BarView> = {}): BarView => ({
  bar: 9,
  barInSection: 1,
  section: 'Groove',
  key: 'A aeolian',
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

const hud = (over: Partial<Hud> = {}): Hud => ({
  bar: barView(),
  beat: 2,
  chord: barView().chords[0]!,
  next: [],
  sections: [],
  style: {
    preset: 'Techno',
    glide: null,
    axes: { swing: 0, sync: 0, harm: 0, artic: 0, energy: 0, entropy: 0 },
  },
  heading: { tonic: 9, mode: 'aeolian' },
  headingMelodic: 'plain',
  muse: { motif: null, log: [] },
  ...over,
});

/** Bars `from` to `to`, each with a kick on its first step and a lead note on step 4, a note higher each bar. */
const bars = (from: number, to: number, over: Partial<PatternBar> = {}): PatternBar[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    bar: from + i,
    parts: {
      ...EMPTY_PATTERN,
      drums: [{ step: 0, note: 36, length: 1 }],
      lead: [{ step: 4, note: 60 + i, length: 2 }],
    },
    motif: null,
    ...over,
  }));

const input = (over: Partial<TracksInput> = {}): TracksInput => ({
  hud: hud(),
  sounding: none,
  pattern: [],
  heard: null,
  humanNotes: [],
  playerId: null,
  players: {},
  mix: EVEN_MIX,
  ...over,
});

const human = (source: string, position: number, note = 64, part: 'lead' | 'drums' = 'lead') =>
  ({ part, note, velocity: 100, source, position, end: position + 2 }) satisfies HumanNote;

describe('the tracks', () => {
  it('has a row for each band performer, drums, bass, chords, lead, in that order', () => {
    const tracks = tracksOf(input());
    expect(tracks.performers.map((p) => [p.performer, p.label])).toEqual([
      ['drums', 'Drums'],
      ['bass', 'Bass'],
      ['comp', 'Chords'],
      ['lead', 'Lead'],
    ]);
  });

  it('gives the lead its own status, and the style’s to every other performer', () => {
    const tracks = tracksOf(input({ hud: hud({ bar: barView({ lead: 'resting' }) }) }));
    expect(tracks.performers.map((p) => p.status)).toEqual([
      'Playing Techno.',
      'Playing Techno.',
      'Playing Techno.',
      'Lead is resting.',
    ]);
  });

  it('shows the bars of one phrase, the bar heard last, each note on its step from the first bar shown', () => {
    const heard = 16 * 9 + 5;
    const tracks = tracksOf(input({ pattern: bars(5, 10), heard }));
    expect(tracks.first).toBe(9 - PATTERN_BARS + 1);
    expect(tracks.performers[0]!.notes).toEqual(
      [0, 1, 2, 3].map((i) => ({ step: 16 * i, note: 36, length: 1 })),
    );
    // Bar 10, scheduled but not yet heard, is left out; so is bar 5, before the phrase.
    expect(tracks.performers[3]!.notes.map((n) => n.note)).toEqual([61, 62, 63, 64]);
  });

  it('fills the phrase from its first bar until a phrase has been heard', () => {
    expect(tracksOf(input()).first).toBe(0);
    expect(tracksOf(input({ pattern: bars(0, 1), heard: 16 + 3 })).first).toBe(0);
    expect(tracksOf(input({ pattern: bars(0, 1), heard: 16 + 3 })).performers[0]!.notes).toEqual([
      { step: 0, note: 36, length: 1 },
      { step: 16, note: 36, length: 1 },
    ]);
  });

  it('puts the playhead on the step heard, counted from the first bar shown, and none before', () => {
    expect(tracksOf(input()).playhead).toBeNull();
    for (let heard = 0; heard < 16 * 12; heard++) {
      const { first, playhead } = tracksOf(input({ heard }));
      expect(playhead).toBe(heard - 16 * first);
      expect(playhead).toBeGreaterThanOrEqual(0);
      expect(playhead).toBeLessThan(16 * PATTERN_BARS);
    }
  });

  it('credits the lead’s bars that played a motif, by name and colour, and no other performer’s', () => {
    const players = { host: 'Bo', c1: 'Ada' };
    const source = playerSource('c1', 'the computer keys');
    const pattern = [...bars(6, 7), ...bars(8, 9, { motif: { source, bar: 6 } })];
    const tracks = tracksOf(input({ pattern, heard: 16 * 9, players }));
    const credit = { source, name: "Ada's computer keys", colour: 1, bar: 6 };
    expect(tracks.performers[3]!.motifs).toEqual([
      { at: 2, credit },
      { at: 3, credit },
    ]);
    for (const performer of tracks.performers.slice(0, 3)) expect(performer.motifs).toEqual([]);
  });

  it('says which performers are muted, soloed, and sound on this device', () => {
    const tracks = tracksOf(input({ mix: { muted: ['drums', 'bass'], soloed: ['bass', 'lead'] } }));
    expect(tracks.performers.map((p) => [p.muted, p.soloed, p.sounds])).toEqual([
      [true, false, false],
      [true, true, true],
      [false, false, false],
      [false, true, true],
    ]);
  });
});

describe('the players’ lanes', () => {
  it('gives each source on this device a lane for each part it plays, in the order they first played', () => {
    const humanNotes = [
      human('the on-screen keys', 16 * 8 + 4.2, 67),
      human('the drum pads', 16 * 8 + 1, 38, 'drums'),
      human('the computer keys', 16 * 9 + 0, 60),
      human('the computer keys', 16 * 9 + 8, 36, 'drums'),
      human('the on-screen keys', 16 * 3, 70),
    ];
    const tracks = tracksOf(input({ humanNotes, heard: 16 * 9 + 9 }));
    expect(tracks.players.map((p) => [p.part, p.source, p.name, p.colour])).toEqual([
      ['drums', 'the drum pads', 'the drum pads', 0],
      ['lead', 'the on-screen keys', 'the on-screen keys', 0],
      ['lead', 'the computer keys', 'the computer keys', 0],
      ['drums', 'the computer keys', 'the computer keys', 0],
    ]);
    expect(tracks.players[1]!.notes).toEqual([{ step: 16 * 2 + 4, note: 67, length: 2 }]);
    expect(tracks.players[3]!.notes).toEqual([{ step: 16 * 3 + 8, note: 36, length: 2 }]);
    expect(tracks.players.every((p) => !p.heardAs)).toBe(true);
  });

  it('reads a session’s source as the Muse hears it: under the player’s id, named, in the player’s colour', () => {
    const tracks = tracksOf(
      input({
        humanNotes: [human('the computer keys', 16 * 9)],
        heard: 16 * 9 + 2,
        playerId: 'c1',
        players: { host: 'Bo', c1: 'Ada' },
      }),
    );
    expect(tracks.players).toMatchObject([
      {
        source: playerSource('c1', 'the computer keys'),
        name: "Ada's computer keys",
        colour: 1,
      },
    ]);
  });

  const taken = (source: string, bar: number): MotifView => ({
    source,
    name: 'the computer keys',
    colour: 0,
    bar,
    rows: 3,
    notes: [
      { step: 0, length: 4, row: 0, altered: false },
      { step: 4, length: 4, row: 2, altered: false },
      { step: 8, length: 8, row: 1, altered: true },
    ],
  });

  it('marks the bar the Muse took from a source’s lane, and none on another source’s', () => {
    const humanNotes = [human('the computer keys', 16 * 8), human('LK Mini/1', 16 * 8 + 4)];
    const tracks = tracksOf(
      input({
        humanNotes,
        heard: 16 * 10,
        hud: hud({ muse: { motif: taken('the computer keys', 8), log: [] } }),
      }),
    );
    expect(tracks.players.map((p) => [p.source, p.taken])).toEqual([
      ['the computer keys', 1],
      ['LK Mini/1', null],
    ]);
  });

  it('draws a cell taken from a source with no notes here as the Muse heard it, while its bar is shown', () => {
    const players = { host: 'Bo', c1: 'Ada' };
    const source = playerSource('c1', 'the computer keys');
    const motif = { ...taken(source, 8), name: "Ada's computer keys", colour: 1 };
    const at = (heard: number) =>
      tracksOf(input({ heard, players, playerId: 'host', hud: hud({ muse: { motif, log: [] } }) }))
        .players;
    expect(at(16 * 10)).toEqual([
      {
        part: 'lead',
        source,
        name: "Ada's computer keys, as the Muse heard it",
        colour: 1,
        heardAs: true,
        taken: 1,
        notes: [
          { step: 16, note: 0, length: 4 },
          { step: 20, note: 2, length: 4 },
          { step: 24, note: 1, length: 8 },
        ],
      },
    ]);
    expect(at(16 * 12)).toEqual([]);
  });
});
