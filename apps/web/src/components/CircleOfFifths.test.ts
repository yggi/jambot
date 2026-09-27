import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CircleOfFifths from './CircleOfFifths.svelte';

const A_AEOLIAN = [0, 2, 4, 5, 7, 9, 11];

describe('the circle of fifths', () => {
  it('shows all twelve pitch classes, named as the prototype names them', () => {
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN });
    const group = screen.getByRole('group', { name: 'Circle of fifths' });
    expect(group.textContent?.replace(/\s+/g, '')).toBe('CC♯DE♭EFF♯GA♭AB♭B');
  });

  it('has no buttons when read-only', () => {
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN });
    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('has no buttons when onintent is given without a mode', () => {
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN, onintent: () => {} });
    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('is a button per pitch class when interactive, marking the tonic pressed', () => {
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN, mode: 'aeolian', onintent: () => {} });
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'C' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('wishes for the pitch class clicked as tonic, keeping the mode', async () => {
    const onintent = vi.fn();
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN, mode: 'dorian', onintent });
    await fireEvent.click(screen.getByRole('button', { name: 'D' }));
    expect(onintent).toHaveBeenCalledWith({ kind: 'key', wish: { tonic: 2, mode: 'dorian' } });
  });
});
