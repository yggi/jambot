import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Member from './Member.svelte';
import type { MemberView } from '../members.ts';

const view = (over: Partial<MemberView> = {}): MemberView => ({
  member: 'lead',
  label: 'Lead',
  status: 'Lead is improvising.',
  source: null,
  sounding: [],
  pattern: [],
  ...over,
});

/** Opens the rendered `<details>`, so its detail is what a person expanding it would see. */
function opened(container: HTMLElement) {
  const details = container.querySelector('details')!;
  details.open = true;
  return details;
}

describe('a band member', () => {
  it('shows its label and status collapsed', () => {
    render(Member, { member: view() });
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Lead is improvising.')).toBeInTheDocument();
  });

  it('says it is silent, once expanded, with no source given', () => {
    const { container } = render(Member, { member: view() });
    opened(container);
    expect(screen.getByText('Silent.')).toBeInTheDocument();
    expect(screen.queryByText(/^From /)).not.toBeInTheDocument();
  });

  it('counts the notes sounding on it, once expanded', () => {
    const many = render(Member, { member: view({ sounding: [60, 64, 67] }) });
    opened(many.container);
    expect(screen.getByText('3 notes sounding.')).toBeInTheDocument();
    const one = render(Member, { member: view({ sounding: [60] }) });
    opened(one.container);
    expect(one.getByText('1 note sounding.')).toBeInTheDocument();
  });

  it('names the motif’s source only when it is given one, once expanded', () => {
    const { container } = render(Member, {
      member: view({ status: 'Lead is playing the motif heard in bar 7.', source: 'Ada’s keys' }),
    });
    opened(container);
    expect(screen.getByText('From Ada’s keys.')).toBeInTheDocument();
  });

  it('says nothing played in the last bar when its pattern is empty, once expanded', () => {
    const { container } = render(Member, { member: view({ pattern: [] }) });
    opened(container);
    expect(screen.getByText('Nothing played in the last bar yet.')).toBeInTheDocument();
  });

  it('draws its last bar as a piano roll when it has one, once expanded', () => {
    const { container } = render(Member, {
      member: view({ pattern: [{ step: 0, note: 60, length: 4 }] }),
    });
    opened(container);
    expect(screen.getByRole('img', { name: 'Pattern of 1 notes' })).toBeInTheDocument();
  });
});
