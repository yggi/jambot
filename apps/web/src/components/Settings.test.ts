import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Settings from './Settings.svelte';

const props = () => ({
  theme: 'system' as const,
  ontheme: vi.fn(),
  address: '',
  onaddress: vi.fn(),
});

describe('the settings card', () => {
  it('says where sessions across machines go, under its name', () => {
    const { container, rerender } = render(Settings, props());
    expect(container.querySelector('summary .main')).toHaveTextContent('Settings');
    expect(container.querySelector('summary .sub')).toHaveTextContent('This browser only');
    void rerender({ address: 'wss://lobby.example' });
  });

  it('offers the theme as system, dark or light, the one chosen pressed', async () => {
    const p = { ...props(), theme: 'dark' as const };
    render(Settings, p);
    const group = screen.getByRole('radiogroup', { name: 'Theme' });
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /dark/i })).toHaveAttribute('aria-checked', 'true');
    await fireEvent.click(screen.getByRole('radio', { name: /light/i }));
    expect(p.ontheme).toHaveBeenCalledWith('light');
  });

  it('gives the lobby server’s address once the field is left', async () => {
    const p = props();
    render(Settings, p);
    const field = screen.getByLabelText('Lobby server');
    await fireEvent.input(field, { target: { value: 'ws://x' } });
    expect(p.onaddress).not.toHaveBeenCalled();
    await fireEvent.change(field);
    expect(p.onaddress).toHaveBeenCalledWith('ws://x');
  });
});
