import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Performers from './Performers.svelte';
import type { PerformerView } from '../performers.ts';

const performer = (over: Partial<PerformerView> = {}): PerformerView => ({
  performer: 'lead',
  label: 'Lead',
  status: 'Lead is improvising.',
  motif: null,
  sounding: [],
  pattern: [],
  ...over,
});

describe('the band’s performers', () => {
  it('shows exactly one row per performer given, in the order given', () => {
    render(Performers, {
      performers: [
        performer({ performer: 'drums', label: 'Drums', status: 'Playing Techno.' }),
        performer({ performer: 'bass', label: 'Bass', status: 'Playing Techno.' }),
        performer({ performer: 'comp', label: 'Chords', status: 'Playing Techno.' }),
        performer({ performer: 'lead', label: 'Lead', status: 'Lead is resting.' }),
      ],
    });
    const region = screen.getByRole('region', { name: 'Band performers' });
    expect(region.querySelectorAll('details')).toHaveLength(4);
    expect(region.textContent).toMatch(/Drums.*Bass.*Chords.*Lead/s);
  });
});
