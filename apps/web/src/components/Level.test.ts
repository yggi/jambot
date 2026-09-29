import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Level from './Level.svelte';

const aButton = createRawSnippet(() => ({ render: () => '<button type="button">Pick</button>' }));

describe('a level of the composition', () => {
  it('is named by a heading, and its controls work', () => {
    render(Level, { name: 'Key', children: aButton });
    expect(screen.getByRole('heading', { name: 'Key' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pick' })).toBeEnabled();
  });

  it('rests its controls for a client, and still shows them', () => {
    render(Level, { name: 'Key', resting: true, children: aButton });
    expect(screen.getByRole('button', { name: 'Pick' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pick' })).toBeVisible();
  });

  it('has no heading of its own where the card inside carries one', () => {
    render(Level, { children: aButton });
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
