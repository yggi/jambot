import { INITIAL_STYLE, NUDGED, SECTION_TYPES } from '@jambot/engine';
import { playerSource, readHostMessage } from '@jambot/session';
import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  VOICE_NAMES,
  castLine,
  composedLine,
  joinedLine,
  leftLine,
  movedLine,
  museLines,
  nudgedLine,
  speakerOf,
} from './log-lines.ts';

const players = { host: 'Cy', c0: 'Ada', c1: 'Bo' };

describe("the session's log, worded", () => {
  it('says who joined, to play or to listen, who came back, who left and who lost the link', () => {
    expect(joinedLine(null, 'c0', 'Ada', 'player').text).toBe('Ada joined, to play.');
    expect(joinedLine(3, 'c1', 'Bo', 'listener').text).toBe('Bo joined, to listen.');
    expect(joinedLine(3, 'c0', 'Ada', 'player', true)).toEqual({
      bar: 3,
      who: 'c0',
      what: 'back',
      text: 'Ada is back.',
    });
    expect(leftLine(5, 'c0', 'Ada').text).toBe('Ada left.');
    expect(leftLine(5, 'c0', 'Ada', true).text).toBe(
      'Ada lost the link; the seat is kept for a while.',
    );
    expect(castLine(7, 'Cy', 'Bo', 'player')).toEqual({
      bar: 7,
      who: 'host',
      what: 'cast',
      text: 'Cy let Bo play.',
    });
    expect(castLine(7, 'Cy', 'Bo', 'listener').text).toBe('Cy made Bo listen.');
  });

  it('says every nudge, each target both ways, by the player who made it', () => {
    const said = Object.fromEntries(
      NUDGED.flatMap((t) =>
        ([1, -1] as const).map((by) => [`${t} ${by}`, nudgedLine(4, 'c0', 'Ada', t, by).text]),
      ),
    );
    expect(said).toEqual({
      'sync 1': 'Ada nudged syncopation up.',
      'sync -1': 'Ada nudged syncopation down.',
      'harm 1': 'Ada nudged harmony up.',
      'harm -1': 'Ada nudged harmony down.',
      'artic 1': 'Ada nudged articulation up.',
      'artic -1': 'Ada nudged articulation down.',
      'energy 1': 'Ada nudged energy up.',
      'energy -1': 'Ada nudged energy down.',
      'bpm 1': 'Ada nudged the tempo faster.',
      'bpm -1': 'Ada nudged the tempo slower.',
      'key 1': 'Ada nudged the key a fifth up.',
      'key -1': 'Ada nudged the key a fifth down.',
      'meter 1': 'Ada nudged the meter a beat more.',
      'meter -1': 'Ada nudged the meter a beat fewer.',
    });
    expect(nudgedLine(4, 'c0', 'Ada', 'sync', 1)).toMatchObject({
      who: 'c0',
      what: 'nudged',
      bar: 4,
    });
  });

  it('says what a section line moved, as people read it, and nothing where nothing they read changed', () => {
    const after = { ...INITIAL_STYLE, energy: INITIAL_STYLE.energy + 0.05, bpm: 117 };
    const moved = movedLine(16, { ...INITIAL_STYLE, bpm: 120 }, after, 1, {
      from: METERS['4/4'],
      to: METERS['5/4'],
    })!;
    expect(moved).toEqual({
      bar: 16,
      who: 'conductor',
      what: 'moved',
      text: `From bar 17: energy ${Math.round(INITIAL_STYLE.energy * 100)} → ${Math.round(after.energy * 100)} %, tempo 120 → 117 bpm, the key a fifth up, 4/4 → 5/4.`,
    });
    // A move under a percent, or a tempo under a bpm, isn't read: nothing to say.
    expect(
      movedLine(16, INITIAL_STYLE, { ...INITIAL_STYLE, sync: INITIAL_STYLE.sync + 0.001 }),
    ).toBeNull();
  });

  it('says each section the composer planned, every type, its key and its meter', () => {
    for (const type of SECTION_TYPES) {
      const said = composedLine(24, type, { tonic: 4, mode: 'aeolian' }, METERS['7/8']);
      expect(said.who).toBe('composer');
      expect(said.text).toBe(
        `${type[0]!.toUpperCase()}${type.slice(1)} from bar 25: E minor, 7/8.`,
      );
    }
  });

  it('says what the Muse takes up, once, whom she hears play a motif again, and what she forgets', () => {
    const ada = playerSource('c0', 'the computer keys');
    const offer = { motif: {} as never, source: ada, bar: 8, level: 0.5 };
    const output = {
      bar: 9,
      judgements: [],
      offer,
      forgot: null,
      recognised: [
        { source: playerSource('c1', 'pads'), of: { source: ada, bar: 8 }, op: {} as never },
      ],
    };
    expect(museLines(output, players, null).map((l) => l.text)).toEqual([
      "The Muse takes up Ada's motif from bar 9, and offers it to the band.",
      'The Muse hears Bo play a motif again.',
    ]);
    // The offer that already stood isn't said again.
    expect(museLines(output, players, { source: ada, bar: 8 }).map((l) => l.what)).toEqual([
      'heard',
    ]);
    expect(
      museLines({ ...output, offer: null, recognised: [], forgot: 'silence' }, players, null)[0]!
        .text,
    ).toBe('The Muse lets go: nobody has played for a while.');
  });

  it('names a line’s speaker beside it only where the line doesn’t already', () => {
    const shown = (l: ReturnType<typeof joinedLine>) => speakerOf(l, players);
    expect(shown(joinedLine(0, 'c0', 'Ada', 'player'))).toBeNull();
    expect(shown(nudgedLine(0, 'c0', 'Ada', 'bpm', 1))).toBeNull();
    expect(shown(castLine(0, 'Cy', 'Bo', 'player'))).toBeNull();
    expect(shown(composedLine(8, 'drop', { tonic: 0, mode: 'ionian' }, METERS['4/4']))).toBe(
      'Composer',
    );
    expect(shown(movedLine(8, INITIAL_STYLE, { ...INITIAL_STYLE, harm: 0.9 })!)).toBe('Conductor');
    const muse = { bar: 9, judgements: [], offer: null, forgot: 'asked' as const, recognised: [] };
    expect(shown(museLines(muse, players, null)[0]!)).toBeNull();
    // A line that doesn't name its player gets the name; one by nobody known, none.
    expect(speakerOf({ bar: 1, who: 'c1', what: 'reacted', text: '🥳' }, players)).toBe('Bo');
    expect(speakerOf({ bar: 1, who: 'c9', what: 'reacted', text: '🥳' }, players)).toBeNull();
  });

  it('words every line a host may send, which a client reads, and names the band’s voices', () => {
    const lines = [
      joinedLine(null, 'c0', 'Ada', 'player'),
      leftLine(1, 'c0', 'Ada'),
      castLine(2, 'Cy', 'Ada', 'listener'),
      nudgedLine(3, 'c0', 'Ada', 'meter', 1),
      movedLine(8, INITIAL_STYLE, { ...INITIAL_STYLE, harm: 0.9 })!,
      composedLine(8, 'drop', { tonic: 0, mode: 'ionian' }, METERS['4/4']),
    ];
    for (const l of lines) expect(readHostMessage({ kind: 'event', ...l }), l.text).not.toBeNull();
    expect(Object.keys(VOICE_NAMES)).toEqual(['conductor', 'composer', 'muse']);
  });
});
