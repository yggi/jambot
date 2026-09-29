import type { ClientResume, HostSnapshot } from '@jambot/session';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLIENT_KEY, HOST_KEY, clientKeep, hostKeep, keptClient, keptHost } from './storage.ts';

const snapshot: HostSnapshot = {
  version: 1,
  savedAt: 100,
  session: 'jam',
  lobby: '',
  reclaim: null,
  player: 'Bo',
  roster: [],
  players: { host: 'Bo' },
  track: {} as never,
  wish: { tonic: null, mode: 'aeolian' },
  tempoNudge: 0,
};
const resume: ClientResume = {
  version: 1,
  savedAt: 100,
  session: 'jam',
  name: 'Ada',
  token: 't',
  lobby: 'wss://x',
};

describe('what a session keeps in the browser', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('gives back what was saved while it is good, and forgets it once cleared', () => {
    hostKeep.save(snapshot);
    clientKeep.save(resume);
    expect(keptHost(101)).toEqual(snapshot);
    expect(keptClient(101)).toEqual(resume);
    hostKeep.clear();
    clientKeep.clear();
    expect(keptHost(101)).toBeNull();
    expect(keptClient(101)).toBeNull();
  });

  it('forgets a record that is too old, or is not one, rather than keep offering it', () => {
    hostKeep.save(snapshot);
    expect(keptHost(100 + 10_000)).toBeNull();
    expect(localStorage.getItem(HOST_KEY)).toBeNull();
    localStorage.setItem(CLIENT_KEY, '{not json');
    expect(keptClient(101)).toBeNull();
    expect(localStorage.getItem(CLIENT_KEY)).toBeNull();
  });

  it('runs on where storage refuses: nothing comes back, nothing throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => hostKeep.save(snapshot)).not.toThrow();
    expect(() => clientKeep.clear()).not.toThrow();
    expect(keptHost(101)).toBeNull();
    expect(keptClient(101)).toBeNull();
  });
});
