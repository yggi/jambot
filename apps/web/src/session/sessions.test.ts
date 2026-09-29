import type { ClientResume, HostSnapshot } from '@jambot/session';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { device, memoryLobby } from './fixtures.ts';
import type { Lobby } from './lobby.ts';
import { type Kept, Sessions } from './sessions.svelte.ts';

/** What a page keeps, in memory. */
function memoryKept(): Kept & { host: HostSnapshot | null; client: ClientResume | null } {
  const kept = {
    host: null as HostSnapshot | null,
    client: null as ClientResume | null,
    hostKeep: {
      save: (s: HostSnapshot) => void (kept.host = s),
      clear: () => void (kept.host = null),
    },
    clientKeep: {
      save: (r: ClientResume) => void (kept.client = r),
      clear: () => void (kept.client = null),
    },
    keptHost: () => kept.host,
    keptClient: () => kept.client,
  };
  return kept;
}

/** A page: its own device and sessions, on the lobbies given. */
function page(tabs: Lobby, servers: Record<string, Lobby> = {}, address = 'ws://server') {
  const d = device(0);
  const kept = memoryKept();
  const sessions = new Sessions(d.player, d.clocks, {
    tabs,
    server: (url) => {
      const lobby = servers[url];
      if (!lobby) throw new Error(`Can't reach the lobby at ${url}.`);
      return lobby;
    },
    address,
    kept,
    wallNow: () => d.world.currentTime,
  });
  return { d, kept, sessions };
}

const until = async (done: () => boolean) => {
  for (let i = 0; i < 200 && !done(); i++) await vi.advanceTimersByTimeAsync(25);
  expect(done()).toBe(true);
};

describe('the sessions a page can be in', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('hosts locally in the tabs lobby, and globally in the server, each listed as where it is', async () => {
    const tabs = memoryLobby();
    const server = memoryLobby();
    const a = page(tabs, { 'ws://server': server });
    await a.sessions.host('local', 'Garage', 'Ada');
    expect(a.d.player.mode).toBe('host');
    expect(a.sessions.asHost.session).toBe('Garage');
    const b = page(tabs, { 'ws://server': server });
    expect(await b.sessions.list()).toEqual({
      sessions: [{ name: 'Garage', players: 1, where: 'local' }],
      problem: null,
    });
    a.sessions.end();
    await b.sessions.host('global', 'Stage', 'Bo');
    expect(await a.sessions.list()).toEqual({
      sessions: [{ name: 'Stage', players: 1, where: 'global' }],
      problem: null,
    });
    expect(a.kept.host).toBeNull();
    expect(b.kept.host).toMatchObject({ session: 'Stage', lobby: 'ws://server' });
  });

  it('lists the local sessions when the global lobby can’t be reached, and says why', async () => {
    const tabs = memoryLobby();
    const a = page(tabs);
    await a.sessions.host('local', 'Garage', 'Ada');
    const b = page(tabs);
    expect(await b.sessions.list()).toEqual({
      sessions: [{ name: 'Garage', players: 1, where: 'local' }],
      problem: "Can't reach the lobby at ws://server.",
    });
  });

  it('has no global lobby without an address, and says so rather than list or host in it', async () => {
    const a = page(memoryLobby(), {}, ' ');
    expect(await a.sessions.list()).toEqual({ sessions: [], problem: null });
    await expect(a.sessions.host('global', 'Stage', 'Ada')).rejects.toThrow(/no lobby server/i);
    expect(a.d.player.mode).toBe('solo');
  });

  it('joins a session where it is listed, and the host closing drops the client with the reason', async () => {
    const tabs = memoryLobby();
    const a = page(tabs);
    await a.sessions.host('local', 'Garage', 'Ada');
    const b = page(tabs);
    await b.sessions.join('local', 'garage', 'Bo');
    await until(() => b.sessions.asClient.status === 'joined');
    expect(b.d.player.mode).toBe('client');
    expect(b.kept.client).not.toBeNull();
    a.sessions.end();
    await until(() => b.d.player.mode === 'solo');
    expect(b.sessions.ended).toBe('The host closed the session.');
    expect(b.kept.client).toBeNull();
  });

  it('ends whichever session it is in, and forgets what it kept to come back to', async () => {
    const tabs = memoryLobby();
    const a = page(tabs);
    await a.sessions.host('local', 'Garage', 'Ada');
    expect(a.kept.host).not.toBeNull();
    a.sessions.end();
    expect(a.d.player.mode).toBe('solo');
    expect(a.kept.host).toBeNull();
    const b = page(tabs);
    await b.sessions.host('local', 'Garage', 'Bo');
    const c = page(tabs);
    await c.sessions.join('local', 'Garage', 'Cy');
    await until(() => c.sessions.asClient.status === 'joined');
    expect(c.kept.client).not.toBeNull();
    c.sessions.end();
    expect(c.d.player.mode).toBe('solo');
    expect(c.kept.client).toBeNull();
  });

  it('gives a join that is refused as its reason, and stays out of a session', async () => {
    const a = page(memoryLobby());
    await a.sessions.join('local', 'Nowhere', 'Bo');
    expect(a.sessions.ended).toBe('No session named “Nowhere” is open.');
    expect(a.d.player.mode).toBe('solo');
  });

  it('takes a kept host session up again, saying so meanwhile, and a kept client session as the player it was', async () => {
    const tabs = memoryLobby();
    const first = page(tabs);
    await first.sessions.host('local', 'Garage', 'Ada');
    const snapshot = first.kept.host!;
    first.sessions.end();

    const again = page(tabs);
    again.kept.host = snapshot;
    const restored = again.sessions.restore(0);
    expect(again.sessions.restoring).toBe(true);
    await restored;
    expect(again.sessions.restoring).toBe(false);
    expect(again.d.player.mode).toBe('host');
    expect(again.sessions.asHost.session).toBe('Garage');

    const guest = page(tabs);
    await guest.sessions.join('local', 'Garage', 'Bo');
    await until(() => guest.sessions.asClient.status === 'joined');
    const resume = guest.kept.client!;
    guest.sessions.asClient.leave();
    guest.kept.client = resume;
    const back = page(tabs);
    back.kept.client = resume;
    void back.sessions.restore(0);
    expect(back.sessions.restoring).toBe(true);
    await until(() => back.sessions.asClient.status === 'joined');
    expect(back.sessions.restoring).toBe(false);
    expect(back.sessions.asClient.name).toBe('Bo');
  });

  it('gives up a kept host session it can’t open again, forgets it, and says why', async () => {
    const tabs = memoryLobby();
    const holder = page(tabs);
    await holder.sessions.host('local', 'Garage', 'Ada');
    const a = page(tabs);
    a.kept.host = { ...holder.kept.host!, reclaim: null };
    await a.sessions.restore(0);
    expect(a.sessions.restoring).toBe(false);
    expect(a.d.player.mode).toBe('solo');
    expect(a.kept.host).toBeNull();
    expect(a.sessions.ended).toBe('taken');
  });

  it('gives a kept client session that gets no answer up too, and says why', async () => {
    const a = page(memoryLobby());
    a.kept.client = {
      version: 1,
      savedAt: 0,
      session: 'Gone',
      name: 'Bo',
      token: 't',
      lobby: '',
    };
    void a.sessions.restore(0);
    await until(() => !a.sessions.restoring);
    expect(a.sessions.ended).toBe('No session named “Gone” is open.');
    expect(a.kept.client).toBeNull();
  });

  it('remembers the global lobby’s address a person gave', async () => {
    localStorage.clear();
    const a = page(memoryLobby());
    expect(a.sessions.address).toBe('ws://server');
    a.sessions.address = 'wss://elsewhere';
    expect(page(memoryLobby()).sessions.address).toBe('wss://elsewhere');
    localStorage.clear();
  });
});
