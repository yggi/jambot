import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Tracks from './Tracks.svelte';
import type { TrackView } from '../tracks.ts';

const track = (over: Partial<TrackView> = {}): TrackView => ({
  part: 'lead',
  label: 'Lead',
  status: 'Lead is improvising.',
  source: null,
  sounding: [],
  ...over,
});

describe('the tracks', () => {
  it('shows one row per track given, in the order given', () => {
    render(Tracks, {
      tracks: [
        track({ part: 'drums', label: 'Drums', status: 'Playing Techno.' }),
        track({ part: 'bass', label: 'Bass', status: 'Playing Techno.' }),
        track({ part: 'comp', label: 'Chords', status: 'Playing Techno.' }),
        track({ part: 'lead', label: 'Lead', status: 'Lead is resting.' }),
      ],
    });
    const region = screen.getByRole('region', { name: 'Tracks' });
    expect(region.textContent).toMatch(/Drums.*Bass.*Chords.*Lead/s);
  });
});
