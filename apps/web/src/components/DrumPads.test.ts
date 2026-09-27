import { DRUM_NOTES } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import DrumPads from './DrumPads.svelte';

describe('the drum pads', () => {
  it('offers one pad per drum sound, kick to ride', () => {
    render(DrumPads, { down: new Set<number>(), onnote: () => {} });
    for (const label of ['Kick', 'Snare', 'Closed hat', 'Open hat', 'Pedal hat', 'Rim', 'Ride'])
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('sounds a note on pointer down, and releases it on pointer up', async () => {
    const onnote = vi.fn();
    render(DrumPads, { down: new Set<number>(), onnote });
    const kick = screen.getByRole('button', { name: 'Kick' });
    await fireEvent.pointerDown(kick);
    expect(onnote).toHaveBeenCalledWith(DRUM_NOTES.kick, 100, true);
    await fireEvent.pointerUp(kick);
    expect(onnote).toHaveBeenCalledWith(DRUM_NOTES.kick, 0, false);
  });

  it('releases on a cancelled pointer too, such as a palm rejection', async () => {
    const onnote = vi.fn();
    render(DrumPads, { down: new Set<number>(), onnote });
    const kick = screen.getByRole('button', { name: 'Kick' });
    await fireEvent.pointerDown(kick);
    await fireEvent.pointerCancel(kick);
    expect(onnote).toHaveBeenLastCalledWith(DRUM_NOTES.kick, 0, false);
  });

  it('lights a pad that is held, from any source', () => {
    render(DrumPads, { down: new Set([DRUM_NOTES.snare]), onnote: () => {} });
    expect(screen.getByRole('button', { name: 'Snare' }).className).toContain('down');
    expect(screen.getByRole('button', { name: 'Kick' }).className).not.toContain('down');
  });

  it('flashes a pad the band’s own drums are heard striking, showing the rhythm', () => {
    render(DrumPads, { down: new Set<number>(), sounding: [DRUM_NOTES.snare], onnote: () => {} });
    expect(screen.getByRole('button', { name: 'Snare' })).toHaveClass('sounding');
    expect(screen.getByRole('button', { name: 'Kick' })).not.toHaveClass('sounding');
  });
});
