import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Drawer from './Drawer.svelte';

const inside = createRawSnippet(() => ({ render: () => '<p>Ports and channels</p>' }));

describe('a settings drawer', () => {
  it('starts folded, naming what it holds and what it is set to', () => {
    const { container } = render(Drawer, {
      name: 'MIDI and sound',
      status: 'Built-in synth',
      children: inside,
    });
    const drawer = container.querySelector('details')!;
    expect(drawer.open).toBe(false);
    expect(screen.getByText('MIDI and sound')).toBeInTheDocument();
    expect(screen.getByText('Built-in synth')).toBeInTheDocument();
  });

  it('opens on its summary to what it holds', async () => {
    const { container } = render(Drawer, { name: 'Connection', children: inside });
    await fireEvent.click(screen.getByText('Connection'));
    expect(container.querySelector('details')!.open).toBe(true);
    expect(screen.getByText('Ports and channels')).toBeInTheDocument();
  });
});
