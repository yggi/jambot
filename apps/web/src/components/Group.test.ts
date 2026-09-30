import { createRawSnippet } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Group from './Group.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>inside</p>' }));

describe('a group', () => {
  it('is a region named by its heading, a level 3 one by default', () => {
    render(Group, { title: 'MIDI', children });
    expect(screen.getByRole('heading', { level: 3, name: 'MIDI' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'MIDI' })).toHaveTextContent('inside');
  });

  it('is a part of a section at level 4', () => {
    render(Group, { title: 'Output', level: 4, children });
    expect(screen.getByRole('heading', { level: 4, name: 'Output' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Output' })).toBeInTheDocument();
  });

  it('keeps two groups apart for a screen reader', () => {
    render(Group, { title: 'Input', level: 4, children });
    render(Group, { title: 'Output', level: 4, children });
    expect(screen.getByRole('region', { name: 'Input' })).not.toBe(
      screen.getByRole('region', { name: 'Output' }),
    );
  });
});
