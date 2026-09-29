import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Nudge from './Nudge.svelte';

const between = createRawSnippet(() => ({ render: () => '<span>reaches far</span>' }));
const sides = {
  down: { name: 'Down', glyph: '−' },
  up: { name: 'Up', glyph: '+', title: 'A step up' },
};

describe('a nudge', () => {
  it('nudges a step down or up, and says what it reaches between the buttons', async () => {
    const onnudge = vi.fn();
    render(Nudge, { label: 'Nudge it', ...sides, onnudge, children: between });
    expect(screen.getByRole('group', { name: 'Nudge it' })).toBeInTheDocument();
    expect(screen.getByText('reaches far')).toBeVisible();
    await fireEvent.click(screen.getByRole('button', { name: 'Up' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Down' }));
    expect(onnudge.mock.calls).toEqual([[1], [-1]]);
  });

  it('titles a button by its name, or by what it says instead, and rests a side that is disabled', () => {
    render(Nudge, {
      label: 'Nudge it',
      down: { ...sides.down, disabled: true },
      up: sides.up,
      onnudge: () => {},
    });
    expect(screen.getByRole('button', { name: 'Down' })).toHaveAttribute('title', 'Down');
    expect(screen.getByRole('button', { name: 'Up' })).toHaveAttribute('title', 'A step up');
    expect(screen.getByRole('button', { name: 'Down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Up' })).toBeEnabled();
  });
});
