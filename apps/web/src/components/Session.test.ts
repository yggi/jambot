import { fireEvent, render, screen, within } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { CODE_LISTENS } from '@jambot/session';
import Session from './Session.svelte';

const following = {
  status: 'joined',
  session: 'Garage',
  name: 'Bo',
  hostPlaying: true,
  hostAway: false,
  role: 'player',
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
      props({
        hosting: { ...nobody, guests: [{ id: 'c0', name: 'Ada', role: 'player' as const }] },
      }),
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

  describe("a host's code (#461)", () => {
    it('is open, as every session was, until the host asks for a code, which it then shows', async () => {
      const onadmit = vi.fn();
      const { rerender } = render(Session, props({ onadmit }));
      await unfold();
      const byCode = screen.getByRole('checkbox', { name: 'Admit players by a code' });
      expect(byCode).not.toBeChecked();
      expect(screen.queryByLabelText('Code')).toBeNull();
      expect(screen.getByText(/Anyone who finds the session can join/)).toBeInTheDocument();
      await fireEvent.click(byCode);
      expect(onadmit).toHaveBeenLastCalledWith(true);
      await rerender({ hosting: { ...nobody, code: '042917' } });
      expect(byCode).toBeChecked();
      expect(screen.getByLabelText('Code')).toHaveTextContent('042917');
      await fireEvent.click(screen.getByRole('button', { name: 'Draw another code' }));
      expect(onadmit).toHaveBeenLastCalledWith(true);
      await fireEvent.click(byCode);
      expect(onadmit).toHaveBeenLastCalledWith(false);
    });

    it("is a host's only: a client and a band alone show none", async () => {
      for (const mode of ['client', 'solo'] as const) {
        const { unmount } = render(Session, props({ mode, onadmit: () => {} }));
        await unfold();
        expect(screen.queryByRole('checkbox', { name: 'Admit players by a code' })).toBeNull();
        unmount();
      }
    });
  });

  describe('the players, in its details', () => {
    it('lists a host and those who joined it, each with a colour', async () => {
      render(
        Session,
        props({
          hosting: {
            session: 'Garage',
            guests: [
              { id: 'c0', name: 'Ada', role: 'player' as const },
              { id: 'c1', name: 'Bo', role: 'player' as const },
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

    it('seats a player to listen and a listener to play, at the host’s word, and says who listens (#567)', async () => {
      const oncast = vi.fn();
      render(
        Session,
        props({
          hosting: {
            session: 'Garage',
            guests: [
              { id: 'c0', name: 'Ada', role: 'player' },
              { id: 'c1', name: 'Bo', role: 'listener' },
            ],
          },
          oncast,
        }),
      );
      await unfold();
      const items = within(screen.getByRole('list', { name: 'Players' })).getAllByRole('listitem');
      expect(items[1]).not.toHaveTextContent('listening');
      expect(items[2]).toHaveTextContent('listening');
      await fireEvent.click(screen.getByRole('button', { name: 'Make Ada listen' }));
      expect(oncast).toHaveBeenLastCalledWith('c0', 'listener');
      await fireEvent.click(screen.getByRole('button', { name: 'Let Bo play' }));
      expect(oncast).toHaveBeenLastCalledWith('c1', 'player');
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

    it('tells a listener it listens, and why, and a player nothing of it (#461)', async () => {
      const { rerender } = render(Session, props({ mode: 'client' }));
      await unfold();
      expect(screen.queryByText(CODE_LISTENS)).toBeNull();
      await rerender({ following: { ...following, role: 'listener' } });
      expect(screen.getByText('Listening as')).toBeInTheDocument();
      expect(screen.queryByText('Playing as')).toBeNull();
      expect(screen.getByText(CODE_LISTENS)).toBeInTheDocument();
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

  describe('the log (step 3)', () => {
    it('shows the session’s log, oldest first, each line by who said it, a player by name or a voice of the band, with its bar', async () => {
      render(
        Session,
        props({
          players: { host: 'Cy', c0: 'Ada' },
          log: [
            { bar: null, who: 'c0', what: 'joined', text: 'Ada joined, to play.' },
            { bar: 4, who: 'c0', what: 'nudged', text: 'Ada nudged energy up.' },
            { bar: 8, who: 'conductor', what: 'moved', text: 'From bar 9: energy 55 → 60 %.' },
            { bar: 8, who: 'muse', what: 'inspired', text: 'The Muse takes up a motif.' },
          ],
        }),
      );
      await unfold();
      const lines = within(screen.getByRole('list', { name: 'Session log' })).getAllByRole(
        'listitem',
      );
      expect(lines.map((l) => l.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        'Ada joined, to play.',
        'Ada nudged energy up. bar 5',
        'Conductor From bar 9: energy 55 → 60 %. bar 9',
        'The Muse takes up a motif. bar 9',
      ]);
    });

    it('says where the log will show before anything is said, for a client too, and has none alone', async () => {
      const { unmount } = render(Session, props({ mode: 'client' }));
      await unfold();
      expect(screen.getByText('What the players and the band say shows here.')).toBeInTheDocument();
      unmount();
      render(Session, props({ mode: 'solo' }));
      await unfold();
      expect(screen.queryByText('What the players and the band say shows here.')).toBeNull();
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
              { id: 'c0', name: 'Ada', role: 'player' as const },
              { id: 'c1', name: 'Bo', role: 'player' as const },
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
