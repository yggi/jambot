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
      [false, true].flatMap((soloChosen) =>
        [false, true].flatMap((timingChosen) =>
          [false, true].flatMap((meterChosen) =>
            [false, true].map((tuneChosen) => ({
              mode,
              clientStatus,
              restoring,
              soloChosen,
              timingChosen,
              meterChosen,
              tuneChosen,
            })),
          ),
        ),
      ),
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
      timingChosen: false,
      meterChosen: false,
      tuneChosen: false,
    } as const;
    expect(screenOf(cold)).toBe('door');
    expect(screenOf({ ...cold, soloChosen: true })).toBe('band');
  });

  it('says a session is being taken up again, whatever else is so, so the door does not flash', () => {
    for (const state of all.filter((s) => s.restoring)) expect(screenOf(state)).toBe('restoring');
  });

  it('is the band for a host, and for a client once it has joined, or lost its link and is trying again', () => {
    for (const state of all.filter(
      (s) =>
        !s.restoring && !((s.timingChosen || s.meterChosen || s.tuneChosen) && s.mode === 'solo'),
    )) {
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
      timingChosen: false,
      meterChosen: false,
      tuneChosen: false,
    } as const;
    expect(screenOf(joining)).toBe('door');
    expect(screenOf({ ...joining, mode: 'solo', clientStatus: 'idle' })).toBe('door');
  });

  it('is the timing test for a person on their own who chose it, and a session takes its place', () => {
    for (const state of all.filter((s) => !s.restoring && s.timingChosen)) {
      expect(screenOf(state), JSON.stringify(state)).toBe(
        state.mode === 'solo' ? 'timing' : screenOf({ ...state, timingChosen: false }),
      );
    }
  });

  it('is the metronome for a person on their own who chose it, the timing test before it, and a session takes its place', () => {
    for (const state of all.filter((s) => !s.restoring && s.meterChosen && !s.timingChosen)) {
      expect(screenOf(state), JSON.stringify(state)).toBe(
        state.mode === 'solo' ? 'meter' : screenOf({ ...state, meterChosen: false }),
      );
    }
    for (const state of all.filter((s) => !s.restoring && s.meterChosen && s.timingChosen))
      expect(screenOf(state)).toBe(
        state.mode === 'solo'
          ? 'timing'
          : screenOf({ ...state, timingChosen: false, meterChosen: false }),
      );
  });

  it('is the tuner for a person on their own who chose it, after the timing test and the metronome, and a session takes its place', () => {
    for (const state of all.filter(
      (s) => !s.restoring && s.tuneChosen && !s.timingChosen && !s.meterChosen,
    ))
      expect(screenOf(state), JSON.stringify(state)).toBe(
        state.mode === 'solo' ? 'tune' : screenOf({ ...state, tuneChosen: false }),
      );
    for (const state of all.filter(
      (s) => !s.restoring && s.tuneChosen && s.meterChosen && !s.timingChosen,
    ))
      expect(screenOf(state)).toBe(
        state.mode === 'solo'
          ? 'meter'
          : screenOf({ ...state, meterChosen: false, tuneChosen: false }),
      );
    for (const state of all.filter((s) => !s.restoring && s.tuneChosen && s.timingChosen))
      expect(screenOf(state)).toBe(
        state.mode === 'solo'
          ? 'timing'
          : screenOf({ ...state, timingChosen: false, meterChosen: false, tuneChosen: false }),
      );
  });

  it('gives way to a session being taken up again, so the door does not flash', () => {
    const state = {
      mode: 'solo',
      clientStatus: 'idle',
      restoring: true,
      soloChosen: false,
      timingChosen: true,
      meterChosen: false,
      tuneChosen: false,
    } as const;
    expect(screenOf(state)).toBe('restoring');
  });
});
