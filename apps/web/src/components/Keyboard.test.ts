import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Keyboard from './Keyboard.svelte';

describe('the on-screen keyboard', () => {
  it('offers every key from C4 to E5, named', () => {
    render(Keyboard, { down: new Set<number>(), onnote: () => {} });
    expect(screen.getByRole('button', { name: 'C4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'D♯4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'E5' })).toBeInTheDocument();
  });

  it('sounds a note on pointer down, and releases it on pointer up', async () => {
    const onnote = vi.fn();
    render(Keyboard, { down: new Set<number>(), onnote });
    const c4 = screen.getByRole('button', { name: 'C4' });
    await fireEvent.pointerDown(c4);
    expect(onnote).toHaveBeenCalledWith(60, 100, true);
    await fireEvent.pointerUp(c4);
    expect(onnote).toHaveBeenCalledWith(60, 0, false);
  });

  it('releases on a cancelled pointer too, such as a palm rejection', async () => {
    const onnote = vi.fn();
    render(Keyboard, { down: new Set<number>(), onnote });
    const c4 = screen.getByRole('button', { name: 'C4' });
    await fireEvent.pointerDown(c4);
    await fireEvent.pointerCancel(c4);
    expect(onnote).toHaveBeenLastCalledWith(60, 0, false);
  });

  it('lights a key that is held, from any source', () => {
    render(Keyboard, { down: new Set([60]), onnote: () => {} });
    expect(screen.getByRole('button', { name: 'C4' }).className).toContain('down');
    expect(screen.getByRole('button', { name: 'D4' }).className).not.toContain('down');
  });

  it('marks the notes of the scale it is given, and no others', () => {
    render(Keyboard, { down: new Set<number>(), scale: [0, 2, 4, 5, 7, 9, 11], onnote: () => {} });
    expect(screen.getByRole('button', { name: 'C4' })).toHaveClass('in-scale');
    expect(screen.getByRole('button', { name: 'C♯4' })).not.toHaveClass('in-scale');
  });

  it('flashes a note the band’s own lead is heard sounding', () => {
    render(Keyboard, { down: new Set<number>(), sounding: [64], onnote: () => {} });
    expect(screen.getByRole('button', { name: 'E4' })).toHaveClass('sounding');
    expect(screen.getByRole('button', { name: 'C4' })).not.toHaveClass('sounding');
  });
});
