import { describe, expect, it } from 'vitest';
import { loadMidi, type RawMidi } from './load.ts';

const PPQ = 480;
const note = (midi: number, ticks: number) => ({
  midi,
  ticks,
  durationTicks: PPQ / 4,
  velocity: 80,
});

const straightBar = (channel: number): RawMidi['tracks'][number] => ({
  channel,
  notes: Array.from({ length: 16 }, (_, step) => note(60 + step, step * (PPQ / 4))),
});

describe('loadMidi', () => {
  it('quantises a 4/4 file with one track into one section, with no drops and no other meters', () => {
    const raw: RawMidi = {
      ppq: PPQ,
      tempos: [{ ticks: 0, bpm: 120 }],
      timeSignatures: [{ ticks: 0, numerator: 4, denominator: 4 }],
      tracks: [straightBar(0)],
    };
    const result = loadMidi(raw);
    expect(result.droppedEmptyTracks).toBe(0);
    expect(result.droppedDuplicateTracks).toBe(0);
    expect(result.otherMeters).toEqual([]);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.notes).toHaveLength(16);
    expect(result.log).toEqual([]);
  });

  it('drops an empty and a duplicate track, and logs both counts', () => {
    const raw: RawMidi = {
      ppq: PPQ,
      tempos: [],
      timeSignatures: [],
      tracks: [straightBar(0), straightBar(0), { channel: 1, notes: [] }],
    };
    const result = loadMidi(raw);
    expect(result.droppedEmptyTracks).toBe(1);
    expect(result.droppedDuplicateTracks).toBe(1);
    expect(result.log).toEqual(['dropped 1 empty track(s)', 'dropped 1 duplicate track(s)']);
  });

  it('reports notes in a non-4/4 span instead of quantising them, and never drops them', () => {
    const raw: RawMidi = {
      ppq: PPQ,
      tempos: [],
      timeSignatures: [
        { ticks: 0, numerator: 4, denominator: 4 },
        { ticks: 16 * (PPQ / 4), numerator: 7, denominator: 8 },
      ],
      tracks: [
        {
          channel: 0,
          notes: [...straightBar(0).notes, note(72, 16 * (PPQ / 4)), note(74, 17 * (PPQ / 4))],
        },
      ],
    };
    const result = loadMidi(raw);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.notes).toHaveLength(16);
    expect(result.otherMeters).toEqual([{ numerator: 7, denominator: 8, noteCount: 2 }]);
    expect(result.log).toEqual(['2 note(s) in a 7/8 span left unquantised (#122)']);
  });

  it('reports 0 confidence for a file with no notes anywhere', () => {
    const result = loadMidi({ ppq: PPQ, tempos: [], timeSignatures: [], tracks: [] });
    expect(result.sections).toEqual([]);
    expect(result.confidence).toBe(0);
  });
});
