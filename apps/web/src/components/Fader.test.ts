import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Fader from './Fader.svelte';

describe('a fader', () => {
  it('shows its position as a percent and gives the new one, from 0 to 1, as it moves', async () => {
    const onchange = vi.fn();
    render(Fader, { label: 'Volume', value: 0.6, onchange });
    const fader = screen.getByRole('slider', { name: /Volume/ });
    expect(fader).toHaveValue('60');
    expect(screen.getByText('60 %')).toBeInTheDocument();
    await fireEvent.input(fader, { target: { value: '25' } });
    expect(onchange).toHaveBeenLastCalledWith(0.25);
    await fireEvent.input(fader, { target: { value: '0' } });
    expect(onchange).toHaveBeenLastCalledWith(0);
    await fireEvent.input(fader, { target: { value: '100' } });
    expect(onchange).toHaveBeenLastCalledWith(1);
  });

  it('follows the value it is given', async () => {
    const { rerender } = render(Fader, { label: 'Volume', value: 0.5, onchange: () => {} });
    await rerender({ value: 0.9 });
    expect(screen.getByRole('slider', { name: /Volume/ })).toHaveValue('90');
  });
});
