import { describe, expect, it } from 'vitest';
import { normaliseTracks, type RawTrack } from './tracks.ts';

const note = (midi: number, ticks: number) => ({ midi, ticks, durationTicks: 100, velocity: 80 });

describe('normaliseTracks', () => {
  it('drops a track with no notes, and counts it', () => {
    const tracks: RawTrack[] = [
      { channel: 0, notes: [note(60, 0)] },
      { channel: 1, notes: [] },
    ];
    const result = normaliseTracks(tracks);
    expect(result.tracks).toHaveLength(1);
    expect(result.droppedEmpty).toBe(1);
    expect(result.droppedDuplicate).toBe(0);
  });

  it('drops a later track that exactly repeats an earlier one on the same channel, and counts it', () => {
    const shared = [note(60, 0), note(64, 100)];
    const tracks: RawTrack[] = [
      { channel: 0, notes: shared },
      { channel: 0, notes: [...shared] },
      { channel: 1, notes: shared },
    ];
    const result = normaliseTracks(tracks);
    expect(result.tracks).toHaveLength(2);
    expect(result.droppedDuplicate).toBe(1);
  });

  it('keeps two tracks with the same notes on different channels', () => {
    const shared = [note(60, 0)];
    const result = normaliseTracks([
      { channel: 0, notes: shared },
      { channel: 1, notes: shared },
    ]);
    expect(result.tracks).toHaveLength(2);
    expect(result.droppedDuplicate).toBe(0);
  });

  it('keeps every track when none is empty or a duplicate', () => {
    const tracks: RawTrack[] = [
      { channel: 0, notes: [note(60, 0)] },
      { channel: 1, notes: [note(40, 0)] },
    ];
    expect(normaliseTracks(tracks)).toEqual({
      tracks,
      droppedEmpty: 0,
      droppedDuplicate: 0,
    });
  });
});
