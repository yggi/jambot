import { describe, expect, it } from 'vitest';
import type { Mode } from './player.svelte.ts';
import type { ClientStatus } from './session/client.svelte.ts';
import { type ScreenState, screenOf } from './screen.ts';

const MODES: Mode[] = ['solo', 'host', 'client'];
const STATUSES: ClientStatus[] = ['idle', 'joining', 'joined', 'reconnecting'];

/** Every state the page can be in, the impossible ones too: none may name no screen. */
const all: ScreenState[] = MODES.flatMap((mode) =>
  STATUSES.flatMap((clientStatus) =>
    [false, true].flatMap((restoring) =>
      [false, true].map((soloChosen) => ({ mode, clientStatus, restoring, soloChosen })),
    ),
  ),
);

describe('the screen the page shows', () => {
  it('is the door on a cold start, and the band once solo is chosen', () => {
    const cold = {
      mode: 'solo',
      clientStatus: 'idle',
      restoring: false,
      soloChosen: false,
    } as const;
    expect(screenOf(cold)).toBe('door');
    expect(screenOf({ ...cold, soloChosen: true })).toBe('band');
  });

  it('says a session is being taken up again, whatever else is so, so the door does not flash', () => {
    for (const state of all.filter((s) => s.restoring)) expect(screenOf(state)).toBe('restoring');
  });

  it('is the band for a host, and for a client once it has joined, or lost its link and is trying again', () => {
    for (const state of all.filter((s) => !s.restoring)) {
      const band =
        state.mode === 'host' ||
        (state.mode === 'client' &&
          (state.clientStatus === 'joined' || state.clientStatus === 'reconnecting')) ||
        (state.mode === 'solo' && state.soloChosen);
      expect(screenOf(state), JSON.stringify(state)).toBe(band ? 'band' : 'door');
    }
  });

  it('keeps a client at the door while it is joining, and after a session ended on its own', () => {
    const joining = {
      mode: 'client',
      clientStatus: 'joining',
      restoring: false,
      soloChosen: false,
    } as const;
    expect(screenOf(joining)).toBe('door');
    expect(screenOf({ ...joining, mode: 'solo', clientStatus: 'idle' })).toBe('door');
  });
});
