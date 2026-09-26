import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Transport from './Transport.svelte';

describe('the transport controls', () => {
  it('start the band, or stop it while it plays', async () => {
    const ontoggle = vi.fn();
    const { rerender } = render(Transport, {
      playing: false,
      bpm: 108,
      ontoggle,
      onintent: () => {},
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Start the band' }));
    expect(ontoggle).toHaveBeenCalledTimes(1);
    await rerender({ playing: true });
    await fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(ontoggle).toHaveBeenCalledTimes(2);
  });

  it('show the tempo, and nudge it by 2 BPM as an intent', async () => {
    const onintent = vi.fn();
    render(Transport, { playing: false, bpm: 108, ontoggle: () => {}, onintent });
    expect(screen.getByLabelText('Tempo')).toHaveTextContent('108 BPM');
    await fireEvent.click(screen.getByRole('button', { name: 'Faster' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Slower' }));
    expect(onintent.mock.calls).toEqual([
      [{ kind: 'axis', axis: 'bpm', value: 110 }],
      [{ kind: 'axis', axis: 'bpm', value: 106 }],
    ]);
  });
});
