import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import TitleCard from './TitleCard.svelte';

const props = () => ({
  theme: 'system' as const,
  ontheme: vi.fn(),
  address: '',
  onaddress: vi.fn(),
});

describe('the title card', () => {
  it('names the page, says what it is for and is folded', () => {
    const { container } = render(TitleCard, props());
    expect(container.querySelector('summary .main')).toHaveTextContent('Jambot');
    expect(container.querySelector('summary .sub')).toHaveTextContent('play together');
    expect(container.querySelector('summary .glyph')).not.toBeNull();
    expect(screen.getByLabelText('Jambot')).not.toHaveAttribute('open');
  });

  it('offers the theme as system, dark or light, the one chosen pressed', async () => {
    const p = { ...props(), theme: 'dark' as const };
    render(TitleCard, p);
    const group = screen.getByRole('radiogroup', { name: 'Theme' });
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /dark/i })).toHaveAttribute('aria-checked', 'true');
    await fireEvent.click(screen.getByRole('radio', { name: /light/i }));
    expect(p.ontheme).toHaveBeenCalledWith('light');
  });

  it('gives the lobby server’s address once the field is left', async () => {
    const p = props();
    render(TitleCard, p);
    const field = screen.getByLabelText('Lobby server');
    await fireEvent.input(field, { target: { value: 'ws://x' } });
    expect(p.onaddress).not.toHaveBeenCalled();
    await fireEvent.change(field);
    expect(p.onaddress).toHaveBeenCalledWith('ws://x');
  });
});
