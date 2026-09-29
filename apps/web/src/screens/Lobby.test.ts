import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Lobby from './Lobby.svelte';

const props = () => ({
  name: 'Jolly Otter',
  onname: vi.fn(),
  onsettle: vi.fn(),
  address: 'wss://lobby.example',
  onaddress: vi.fn(),
  found: { sessions: [], problem: null },
  joining: false,
  notice: null,
  onsolo: vi.fn(),
  ontiming: vi.fn(),
  onhost: vi.fn(() => Promise.resolve()),
  onjoin: vi.fn(),
});

describe('the lobby, the door to the band', () => {
  it('asks for a name first, made up already, and keeps what is typed', async () => {
    const p = props();
    render(Lobby, p);
    const field = screen.getByLabelText('Your name');
    expect(field).toHaveValue('Jolly Otter');
    await fireEvent.input(field, { target: { value: 'Ada' } });
    expect(p.onname).toHaveBeenLastCalledWith('Ada');
    await fireEvent.blur(field);
    expect(p.onsettle).toHaveBeenCalledOnce();
  });

  it('plays with the band alone', async () => {
    const p = props();
    render(Lobby, p);
    await fireEvent.click(screen.getByRole('button', { name: 'Play with the band' }));
    expect(p.onsolo).toHaveBeenCalledOnce();
  });

  it('opens the timing test, and not while a join is under way', async () => {
    const p = props();
    const { unmount } = render(Lobby, p);
    await fireEvent.click(screen.getByRole('button', { name: 'Timing test' }));
    expect(p.ontiming).toHaveBeenCalledOnce();
    unmount();
    render(Lobby, { ...p, joining: true });
    expect(screen.getByRole('button', { name: 'Timing test' })).toBeDisabled();
  });

  it('joins an open session by a click on it, local and global told apart by a tooltip', async () => {
    const p = props();
    render(Lobby, {
      ...p,
      found: {
        sessions: [
          { name: 'Garage', players: 3, where: 'local' },
          { name: 'Stage', players: 1, where: 'global' },
        ],
        problem: null,
      },
    });
    const garage = screen.getByRole('button', { name: /Garage/ });
    const stage = screen.getByRole('button', { name: /Stage/ });
    expect(garage).toHaveTextContent('3');
    expect(garage).toHaveAttribute('title', expect.stringMatching(/in this browser/i));
    expect(stage).toHaveAttribute('title', expect.stringMatching(/lobby server/i));
    expect(garage.className).not.toBe(stage.className);
    await fireEvent.click(stage);
    expect(p.onjoin).toHaveBeenCalledWith('global', 'Stage');
    await fireEvent.click(garage);
    expect(p.onjoin).toHaveBeenLastCalledWith('local', 'Garage');
  });

  it('says when no session is open, when it is still looking, and why a lobby couldn’t be listed', async () => {
    const p = props();
    const { rerender } = render(Lobby, { ...p, found: null });
    expect(screen.getByText('Looking for sessions…')).toBeInTheDocument();
    await rerender({ found: { sessions: [], problem: null } });
    expect(screen.getByText('No session is open yet.')).toBeInTheDocument();
    await rerender({ found: { sessions: [], problem: "Can't reach the lobby at wss://x." } });
    expect(screen.getByText("Can't reach the lobby at wss://x.")).toBeInTheDocument();
  });

  it('hosts locally or globally under a session name, and only once it has one', async () => {
    const p = props();
    render(Lobby, p);
    const local = screen.getByRole('button', { name: 'Local' });
    const global = screen.getByRole('button', { name: 'Global' });
    expect(local).toBeDisabled();
    expect(global).toBeDisabled();
    await fireEvent.input(screen.getByLabelText('Session name'), { target: { value: ' Garage ' } });
    await fireEvent.click(local);
    expect(p.onhost).toHaveBeenLastCalledWith('local', ' Garage ');
    await fireEvent.click(global);
    expect(p.onhost).toHaveBeenLastCalledWith('global', ' Garage ');
    expect(local).toHaveAttribute('title', expect.stringMatching(/this browser/i));
    expect(global).toHaveAttribute('title', expect.stringMatching(/lobby server/i));
  });

  it('says why a host was refused', async () => {
    const p = {
      ...props(),
      onhost: vi.fn(() => Promise.reject(new Error('A session named “Garage” is already open.'))),
    };
    render(Lobby, p);
    await fireEvent.input(screen.getByLabelText('Session name'), { target: { value: 'Garage' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Local' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'A session named “Garage” is already open.',
    );
  });

  it('keeps the lobby server’s address under Advanced, and gives it when the person is done typing', async () => {
    const p = props();
    const { container } = render(Lobby, p);
    const fold = container.querySelector('details.advanced')!;
    expect(fold).not.toHaveAttribute('open');
    const field = screen.getByLabelText('Lobby server');
    expect(field).toHaveValue('wss://lobby.example');
    await fireEvent.input(field, { target: { value: 'ws://192.168.0.5:8787' } });
    expect(p.onaddress).not.toHaveBeenCalled();
    await fireEvent.change(field);
    expect(p.onaddress).toHaveBeenCalledWith('ws://192.168.0.5:8787');
  });

  it('is busy while a join is under way, and says what ended the last session', () => {
    const p = props();
    const { rerender } = render(Lobby, {
      ...p,
      joining: true,
      found: { sessions: [{ name: 'Garage', players: 2, where: 'local' }], problem: null },
    });
    expect(screen.getByRole('button', { name: /Garage/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Play with the band' })).toBeDisabled();
    expect(screen.getByText('Joining…')).toBeInTheDocument();
    void rerender({ joining: false, notice: 'The host closed the session.' });
    expect(screen.getByRole('status')).toHaveTextContent('The host closed the session.');
  });
});
