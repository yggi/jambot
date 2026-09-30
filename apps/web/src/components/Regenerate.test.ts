import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Regenerate from './Regenerate.svelte';

describe('a regenerate button', () => {
  it('is named for what it makes up again, and asks for another when pressed', async () => {
    const onclick = vi.fn();
    render(Regenerate, { label: 'Regenerate name', onclick });
    const button = screen.getByRole('button', { name: 'Regenerate name' });
    expect(button).toHaveAttribute('title', 'Regenerate name');
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('rests while disabled', () => {
    render(Regenerate, { label: 'Regenerate name', disabled: true, onclick: () => {} });
    expect(screen.getByRole('button', { name: 'Regenerate name' })).toBeDisabled();
  });
});
