import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Members from './Members.svelte';
import type { MemberView } from '../members.ts';

const member = (over: Partial<MemberView> = {}): MemberView => ({
  member: 'lead',
  label: 'Lead',
  status: 'Lead is improvising.',
  source: null,
  sounding: [],
  ...over,
});

describe('the band’s members', () => {
  it('shows exactly one row per member given, in the order given', () => {
    render(Members, {
      members: [
        member({ member: 'drums', label: 'Drums', status: 'Playing Techno.' }),
        member({ member: 'bass', label: 'Bass', status: 'Playing Techno.' }),
        member({ member: 'comp', label: 'Chords', status: 'Playing Techno.' }),
        member({ member: 'lead', label: 'Lead', status: 'Lead is resting.' }),
      ],
    });
    const region = screen.getByRole('region', { name: 'Band members' });
    expect(region.querySelectorAll('details')).toHaveLength(4);
    expect(region.textContent).toMatch(/Drums.*Bass.*Chords.*Lead/s);
  });
});
