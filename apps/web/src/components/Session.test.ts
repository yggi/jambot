import { fireEvent, render, screen, within } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Session from './Session.svelte';

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

type Props = ComponentProps<typeof Session>;

const props = (more: Partial<Props> = {}): Props => ({
  mode: 'host',
  hosting: nobody,
  following,
  players: {},
  playerId: null,
  bar: null,
  onend: () => {},
  ...more,
});

/** Unfold the card, where the way out and the players are. */
const unfold = () => fireEvent.click(screen.getByLabelText('Session').querySelector('summary')!);

describe('the session card', () => {
  it('names the session, and says its state, over its network', () => {
    const { container } = render(
      Session,
      props({ hosting: { ...nobody, guests: [{ id: 'c0', name: 'Ada' }] } }),
    );
    expect(container.querySelector('summary .title')).toHaveTextContent('Session');
    expect(container.querySelector('summary .main')).toHaveTextContent('Garage');
    expect(container.querySelector('summary .sub')).toHaveTextContent('Hosting · 1 joined');
    expect(container.querySelectorAll('summary svg.glyph circle.node')).toHaveLength(2);
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('names a solo band Solo', () => {
    const { container } = render(Session, props({ mode: 'solo' }));
    expect(container.querySelector('summary .main')).toHaveTextContent('Solo');
  });

  describe('the players, in its details', () => {
    it('lists a host and those who joined it, each with a colour', async () => {
      render(
        Session,
        props({
          hosting: {
            session: 'Garage',
            guests: [
              { id: 'c0', name: 'Ada' },
              { id: 'c1', name: 'Bo' },
            ],
          },
          players: { host: 'Cy', c0: 'Ada', c1: 'Bo' },
          playerId: 'host',
        }),
      );
      await unfold();
      const list = within(screen.getByRole('list', { name: 'Players' }));
      expect(list.getAllByRole('listitem').map((li) => li.textContent?.trim())).toEqual([
        'You (host)',
        'Ada',
        'Bo',
      ]);
    });

    it('says nobody has joined yet, in the list, as the summary does', async () => {
      render(Session, props());
      await unfold();
      expect(screen.getByRole('list', { name: 'Players' })).toHaveTextContent('You (host)');
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('gives a client its name, its round trip and the bars that came too late', async () => {
      render(Session, props({ mode: 'client', following: { ...following, trip: 12, lacked: 3 } }));
      await unfold();
      expect(screen.getByText('Playing as')).toBeInTheDocument();
      expect(screen.getByText('Bo')).toBeInTheDocument();
      expect(screen.getByText('12 ms')).toBeInTheDocument();
      expect(screen.getByText('3 bars')).toBeInTheDocument();
    });

    it('says what a client’s link is doing when it is lost, or the host is away', async () => {
      const { rerender } = render(
        Session,
        props({ mode: 'client', following: { ...following, status: 'reconnecting' } }),
      );
      await unfold();
      expect(screen.getByText(/The link was lost/)).toBeInTheDocument();
      await rerender({ following: { ...following, hostAway: true } });
      expect(
        screen.getByText(/The host lost its link and may be back in a moment/),
      ).toBeInTheDocument();
    });
  });

  describe('the way out', () => {
    it('lets a host close its session only after asking, and says how many are playing in it', async () => {
      const onend = vi.fn();
      render(
        Session,
        props({
          hosting: {
            session: 'Garage',
            guests: [
              { id: 'c0', name: 'Ada' },
              { id: 'c1', name: 'Bo' },
            ],
          },
          onend,
        }),
      );
      await unfold();
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
      render(Session, props());
      await unfold();
      await fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
      expect(screen.getByRole('alertdialog')).toHaveTextContent(
        'Close Garage? Nobody else is in it.',
      );
    });

    it('lets a client leave only after asking', async () => {
      const onend = vi.fn();
      render(Session, props({ mode: 'client', onend }));
      await unfold();
      await fireEvent.click(screen.getByRole('button', { name: 'Leave session' }));
      expect(onend).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Leave Garage?');
      await fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Leave session' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Yes, leave' }));
      expect(onend).toHaveBeenCalledOnce();
    });

    it('goes back to the lobby from solo at once: nothing is shared to ask about', async () => {
      const onend = vi.fn();
      render(Session, props({ mode: 'solo', onend }));
      await unfold();
      await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
      expect(onend).toHaveBeenCalledOnce();
    });
  });
});
