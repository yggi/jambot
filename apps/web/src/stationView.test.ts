import { describe, expect, it } from 'vitest';
import { planner, type PlanCarried } from '@jambot/engine';
import { SONGS_KEPT, nowPlaying, songsAfter } from './stationView.ts';

/** The plans as of a section planned in a song, by id, or in none. */
const plansAt = (index: number, song: number | null): Pick<PlanCarried, 'before' | 'song'> => ({
  before: { ...planner.initial.before!, section: { type: 'verse', index } } as never,
  song,
});

describe('now playing (#547 rung 5): the song each section plays in, as the host plans it', () => {
  it('names the song a section plays in, its mix the original until mixes come (step 2)', () => {
    const songs = songsAfter(new Map(), plansAt(3, 2));
    expect(nowPlaying(songs, 3)).toBe('Song 2 · original');
  });

  it('names nothing for a section the chain plays, or one not planned yet', () => {
    const songs = songsAfter(new Map(), plansAt(3, null));
    expect([nowPlaying(songs, 3), nowPlaying(songs, 4), nowPlaying(songs, undefined)]).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('keeps the last sections planned, enough for the one heard behind the ones planned ahead', () => {
    let songs: ReadonlyMap<number, string> = new Map();
    for (let index = 0; index < 40; index++) songs = songsAfter(songs, plansAt(index, 1));
    expect(songs.size).toBe(SONGS_KEPT);
    expect(nowPlaying(songs, 39)).toBe('Song 1 · original');
    expect(nowPlaying(songs, 39 - SONGS_KEPT)).toBeNull();
  });

  it('is the same map where the plans planned nothing new', () => {
    const songs = songsAfter(new Map(), plansAt(3, 2));
    expect(songsAfter(songs, plansAt(3, 2))).toBe(songs);
    expect(songsAfter(songs, { before: null, song: null })).toBe(songs);
  });
});
