import { describe, expect, it } from 'vitest';
import {
  type ClientResume,
  type HostSnapshot,
  SAVED_MAX_AGE,
  readClientResume,
  readHostSnapshot,
} from './snapshot.ts';

const snapshot: HostSnapshot = {
  version: 2,
  savedAt: 1000,
  session: 'Friday Jam',
  lobby: 'wss://example',
  reclaim: 'secret',
  player: 'Bo',
  roster: [{ id: 'c0', name: 'Ada', token: 'token-0' }],
  players: { host: 'Bo', c0: 'Ada' },
  track: { energy: { from: 0.5, to: 0.5, at: 0, over: 0 } } as never,
  wish: { tonic: null, mode: 'aeolian', melodic: null },
  tempoNudge: 0.1,
};

const resume: ClientResume = {
  version: 1,
  savedAt: 1000,
  session: 'Friday Jam',
  name: 'Ada',
  token: 'token-0',
  lobby: 'wss://example',
};

describe('what a host keeps to come back from a reload', () => {
  it('reads what it wrote, through JSON', () => {
    expect(readHostSnapshot(JSON.parse(JSON.stringify(snapshot)), 1001)).toEqual(snapshot);
  });

  it('reads nothing that is not one, or of another version, or too old', () => {
    for (const junk of [
      null,
      'x',
      {},
      { ...snapshot, version: 3 },
      // Kept before the key wish named a melodic scale (#209): its wish would lack one.
      { ...snapshot, version: 1 },
      { ...snapshot, savedAt: 'now' },
      { ...snapshot, session: 3 },
      { ...snapshot, session: ' ' },
      { ...snapshot, lobby: undefined },
      { ...snapshot, reclaim: 4 },
      { ...snapshot, player: null },
      { ...snapshot, roster: 'Ada' },
      { ...snapshot, roster: [{ id: 'c0', name: 'Ada' }] },
      { ...snapshot, roster: [null] },
      { ...snapshot, players: [] },
      { ...snapshot, players: { c0: 3 } },
      { ...snapshot, track: null },
      { ...snapshot, wish: null },
      { ...snapshot, tempoNudge: 'up' },
      { ...snapshot, tempoNudge: Number.NaN },
    ])
      expect(readHostSnapshot(junk, 1001), JSON.stringify(junk)).toBeNull();
    expect(readHostSnapshot(snapshot, 1000 + SAVED_MAX_AGE)).toEqual(snapshot);
    expect(readHostSnapshot(snapshot, 1000 + SAVED_MAX_AGE + 1)).toBeNull();
    // A clock that ran backwards makes no snapshot from the future.
    expect(readHostSnapshot(snapshot, 500)).toBeNull();
  });

  it('may name the tabs of the browser, and no lobby server', () => {
    expect(readHostSnapshot({ ...snapshot, lobby: '' }, 1001)).toMatchObject({ lobby: '' });
    expect(readClientResume({ ...resume, lobby: '' }, 1001)).toMatchObject({ lobby: '' });
  });

  it('may hold no reclaim secret, where the lobby gave none', () => {
    expect(readHostSnapshot({ ...snapshot, reclaim: null }, 1001)).toMatchObject({ reclaim: null });
  });
});

describe('what a client keeps to come back from a closed app', () => {
  it('reads what it wrote, and nothing that is not one, or too old', () => {
    expect(readClientResume(JSON.parse(JSON.stringify(resume)), 1001)).toEqual(resume);
    for (const junk of [
      null,
      {},
      { ...resume, version: 0 },
      { ...resume, savedAt: null },
      { ...resume, session: '' },
      { ...resume, name: ' ' },
      { ...resume, token: 1 },
      { ...resume, lobby: undefined },
    ])
      expect(readClientResume(junk, 1001), JSON.stringify(junk)).toBeNull();
    expect(readClientResume(resume, 1000 + SAVED_MAX_AGE + 1)).toBeNull();
    expect(readClientResume(resume, 999)).toBeNull();
  });
});
