import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Transport from './Transport.svelte';

describe('the transport controls', () => {
  it('start the band, or stop it while it plays', async () => {
    const ontoggle = vi.fn();
    const { rerender } = render(Transport, { playing: false, ontoggle });
    await fireEvent.click(screen.getByRole('button', { name: 'Start the band' }));
    expect(ontoggle).toHaveBeenCalledTimes(1);
    await rerender({ playing: true });
    await fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(ontoggle).toHaveBeenCalledTimes(2);
  });
});
