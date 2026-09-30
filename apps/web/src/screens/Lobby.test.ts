import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Lobby from './Lobby.svelte';

const props = () => ({
  name: 'Jolly Otter',
  onname: vi.fn(),
  onsettle: vi.fn(),
  onregenerate: vi.fn(),
  suggest: vi.fn(() => 'Bright Attic'),
  found: { sessions: [], problem: null },
  joining: false,
  notice: null,
  onsolo: vi.fn(),
  ontiming: vi.fn(),
  onmeter: vi.fn(),
  ontune: vi.fn(),
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

  it('makes up another name on request', async () => {
    const p = props();
    render(Lobby, p);
    await fireEvent.click(screen.getByRole('button', { name: 'Regenerate name' }));
    expect(p.onregenerate).toHaveBeenCalledOnce();
  });

  it('plays with the band alone', async () => {
    const p = props();
    render(Lobby, p);
    await fireEvent.click(screen.getByRole('button', { name: 'Solo' }));
    expect(p.onsolo).toHaveBeenCalledOnce();
  });

  it('opens the timing test, and not while a join is under way', async () => {
    const p = props();
    const { unmount } = render(Lobby, p);
    await fireEvent.click(screen.getByText('Extras'));
    await fireEvent.click(screen.getByRole('button', { name: 'Timing test' }));
    expect(p.ontiming).toHaveBeenCalledOnce();
    unmount();
    render(Lobby, { ...p, joining: true });
    expect(screen.getByRole('button', { name: 'Timing test' })).toBeDisabled();
  });

  it('opens the metronome, and not while a join is under way', async () => {
    const p = props();
    const { unmount } = render(Lobby, p);
    await fireEvent.click(screen.getByText('Extras'));
    await fireEvent.click(screen.getByRole('button', { name: 'Metronome' }));
    expect(p.onmeter).toHaveBeenCalledOnce();
    unmount();
    render(Lobby, { ...p, joining: true });
    expect(screen.getByRole('button', { name: 'Metronome' })).toBeDisabled();
  });

  it('opens the tuner, and not while a join is under way', async () => {
    const p = props();
    const { unmount } = render(Lobby, p);
    await fireEvent.click(screen.getByText('Extras'));
    await fireEvent.click(screen.getByRole('button', { name: 'Tuner' }));
    expect(p.ontune).toHaveBeenCalledOnce();
    unmount();
    render(Lobby, { ...p, joining: true });
    expect(screen.getByRole('button', { name: 'Tuner' })).toBeDisabled();
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
    expect(screen.getByText('Looking…')).toBeInTheDocument();
    await rerender({ found: { sessions: [], problem: null } });
    expect(screen.getByText('None open yet')).toBeInTheDocument();
    await rerender({ found: { sessions: [], problem: "Can't reach the lobby at wss://x." } });
    expect(screen.getByText("Can't reach the lobby at wss://x.")).toBeInTheDocument();
  });

  it('starts with a made-up session name, and another on request', async () => {
    const p = props();
    p.suggest.mockReturnValueOnce('Bright Attic').mockReturnValueOnce('Swingy Workshop');
    render(Lobby, p);
    const field = screen.getByLabelText('Session name');
    expect(field).toHaveValue('Bright Attic');
    await fireEvent.click(screen.getByRole('button', { name: 'Regenerate session name' }));
    expect(field).toHaveValue('Swingy Workshop');
  });

  it('hosts locally or globally under a session name, and only once it has one', async () => {
    const p = props();
    render(Lobby, p);
    const host = screen.getByRole('button', { name: 'Host' });
    const field = screen.getByLabelText('Session name');
    expect(host).toBeEnabled();
    await fireEvent.input(field, { target: { value: '  ' } });
    expect(host).toBeDisabled();
    await fireEvent.input(field, { target: { value: ' Garage ' } });
    expect(screen.getByRole('radio', { name: /Local/ })).toHaveAttribute('aria-checked', 'true');
    await fireEvent.click(host);
    expect(p.onhost).toHaveBeenLastCalledWith('local', ' Garage ');
    await fireEvent.click(screen.getByRole('radio', { name: /Global/ }));
    await fireEvent.click(host);
    expect(p.onhost).toHaveBeenLastCalledWith('global', ' Garage ');
  });

  it('explains where a session will be, and draws local and global each with a glyph', async () => {
    render(Lobby, props());
    expect(screen.getByText(/In this browser/)).toBeInTheDocument();
    const global = screen.getByRole('radio', { name: /Global/ });
    expect(global.querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('radio', { name: /Local/ }).querySelector('svg')).not.toBeNull();
    await fireEvent.click(global);
    expect(screen.getByText(/others can join/)).toBeInTheDocument();
  });

  it('says why a host was refused', async () => {
    const p = {
      ...props(),
      onhost: vi.fn(() => Promise.reject(new Error('A session named “Garage” is already open.'))),
    };
    render(Lobby, p);
    await fireEvent.input(screen.getByLabelText('Session name'), { target: { value: 'Garage' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Host' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'A session named “Garage” is already open.',
    );
  });

  it('is busy while a join is under way, and says what ended the last session', () => {
    const p = props();
    const { rerender } = render(Lobby, {
      ...p,
      joining: true,
      found: { sessions: [{ name: 'Garage', players: 2, where: 'local' }], problem: null },
    });
    expect(screen.getByRole('button', { name: /Garage/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Solo' })).toBeDisabled();
    expect(screen.getByText('Joining…')).toBeInTheDocument();
    void rerender({ joining: false, notice: 'The host closed the session.' });
    expect(screen.getByRole('status')).toHaveTextContent('The host closed the session.');
  });
});
