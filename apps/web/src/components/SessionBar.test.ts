import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SessionBar from './SessionBar.svelte';

const following = {
  status: 'joined',
  session: 'Garage',
  name: 'Bo',
  hostPlaying: true,
  hostAway: false,
  trip: 12,
  lacked: 0,
} as const;
const nobody = { session: 'Garage', guests: [] };

describe('the way out of a session', () => {
  it('lets a host close its session only after asking, and says how many are playing in it', async () => {
    const onend = vi.fn();
    render(SessionBar, {
      mode: 'host',
      hosting: {
        session: 'Garage',
        guests: [
          { id: 'c0', name: 'Ada' },
          { id: 'c1', name: 'Bo' },
        ],
      },
      following,
      onend,
    });
    expect(screen.getByText(/2 joined: Ada, Bo/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
    expect(onend).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Close Garage for everyone? 2 others are playing in it.',
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Keep playing' }));
    expect(onend).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Close session' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Yes, close it' }));
    expect(onend).toHaveBeenCalledOnce();
  });

  it('says nobody is affected when a host closes a session nobody joined', async () => {
    render(SessionBar, { mode: 'host', hosting: nobody, following, onend: () => {} });
    expect(screen.getByText(/Nobody has joined yet\./)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Close Garage? Nobody else is in it.',
    );
  });

  it('lets a client leave only after asking', async () => {
    const onend = vi.fn();
    render(SessionBar, { mode: 'client', hosting: nobody, following, onend });
    expect(screen.getByText(/Playing in/)).toHaveTextContent('Playing in Garage as Bo.');
    await fireEvent.click(screen.getByRole('button', { name: 'Leave session' }));
    expect(onend).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Leave Garage?');
    await fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Leave session' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Yes, leave' }));
    expect(onend).toHaveBeenCalledOnce();
  });

  it('says what a client’s link is doing: trying again, the host away, a bar too late', () => {
    const { rerender } = render(SessionBar, {
      mode: 'client',
      hosting: nobody,
      following: { ...following, status: 'reconnecting' },
      onend: () => {},
    });
    expect(screen.getByText(/Reconnecting to/)).toBeInTheDocument();
    expect(screen.getByText(/The link was lost/)).toBeInTheDocument();
    void rerender({ following: { ...following, hostAway: true, lacked: 3 } });
  });

  it('goes back to the lobby from solo at once: nothing is shared to ask about', async () => {
    const onend = vi.fn();
    render(SessionBar, { mode: 'solo', hosting: nobody, following, onend });
    await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
    expect(onend).toHaveBeenCalledOnce();
  });
});
