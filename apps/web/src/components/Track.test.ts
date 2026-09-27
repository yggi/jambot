import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Track from './Track.svelte';
import type { TrackView } from '../tracks.ts';

const view = (over: Partial<TrackView> = {}): TrackView => ({
  part: 'lead',
  label: 'Lead',
  status: 'Lead is improvising.',
  source: null,
  sounding: [],
  pattern: [],
  ...over,
});

describe('a track', () => {
  it('shows its label and status collapsed', () => {
    render(Track, { track: view() });
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Lead is improvising.')).toBeInTheDocument();
  });

  it('says it is silent, expanded, with no source given', () => {
    render(Track, { track: view() });
    expect(screen.getByText('Silent.')).toBeInTheDocument();
    expect(screen.queryByText(/^From /)).not.toBeInTheDocument();
  });

  it('counts the notes sounding on it, expanded', () => {
    render(Track, { track: view({ sounding: [60, 64, 67] }) });
    expect(screen.getByText('3 notes sounding.')).toBeInTheDocument();
    const one = render(Track, { track: view({ sounding: [60] }) });
    expect(one.getByText('1 note sounding.')).toBeInTheDocument();
  });

  it('names the motif’s source only when it is given one', () => {
    render(Track, {
      track: view({ status: 'Lead is playing the motif heard in bar 7.', source: 'Ada’s keys' }),
    });
    expect(screen.getByText('From Ada’s keys.')).toBeInTheDocument();
  });

  it('says nothing played in the last bar when its pattern is empty', () => {
    render(Track, { track: view({ pattern: [] }) });
    expect(screen.getByText('Nothing played in the last bar yet.')).toBeInTheDocument();
  });

  it('draws its last bar as a piano roll when it has one', () => {
    render(Track, { track: view({ pattern: [{ step: 0, note: 60, length: 4 }] }) });
    expect(screen.getByRole('img', { name: 'Pattern of 1 notes' })).toBeInTheDocument();
  });
});
