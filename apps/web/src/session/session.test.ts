import { PROTOCOL, type ClientMessage, type HostMessage } from '@jambot/session';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Output } from '../audio/output.ts';
import { Player, type Surroundings } from '../player.svelte.ts';
import { broadcastLobby, CLAIM_WAIT } from './broadcast.ts';
import { ClientSession, WELCOME_WAIT } from './client.svelte.ts';
import { HostSession, SILENT } from './host.svelte.ts';
import { type HostLink, type Lobby, sessionKey } from './lobby.ts';

/** A device: an output whose clock the test moves, and the ticks it runs. */
function device(clockAt: number) {
  const world = {
    currentTime: clockAt,
    plays: [] as { part: string; note: number; seconds: number }[],
    tickers: [] as (() => void)[],
  };
  const output: Output = {
    get currentTime() {
      return world.currentTime;
    },
    latency: 0,
    resume: () => Promise.resolve(),
    play: (part, note, _velocity, seconds) => void world.plays.push({ part, note, seconds }),
    silence: () => {},
  };
  const surroundings: Surroundings = {
    output: () => output,
    ticker(tick) {
      world.tickers.push(tick);
      return () => void world.tickers.splice(world.tickers.indexOf(tick), 1);
    },
    frame: () => () => {},
    seed: () => 42,
  };
  return { world, player: new Player(surroundings), heardNow: () => world.currentTime };
}

/** A lobby in memory: every message delivered at once, as a local link nearly is. */
function memoryLobby(): Lobby {
  const hosts = new Map<string, (message: ClientMessage, from: string) => void>();
  const clients = new Map<string, Map<string, (message: HostMessage) => void>>();
  let made = 0;
  return {
    async host(session, hear) {
      const key = sessionKey(session);
      if (hosts.has(key)) throw new Error('taken');
      hosts.set(key, hear);
      clients.set(key, new Map());
      return {
        send(message, to) {
          for (const [id, deliver] of clients.get(key)!)
            if (to === undefined || to === id) deliver(structuredClone(message));
        },
        close: () => void hosts.delete(key),
      } satisfies HostLink;
    },
    async join(session, hear) {
      const key = sessionKey(session);
      const id = `client-${made++}`;
      clients.get(key)?.set(id, hear);
      return {
        send: (message) => hosts.get(key)?.(structuredClone(message), id),
        close: () => void clients.get(key)?.delete(id),
      };
    },
  };
}

/** Both devices a tick on, every 25 ms, for `seconds`. */
async function run(devices: ReturnType<typeof device>[], seconds: number) {
  for (let t = 0; t < seconds; t += 0.025) {
    for (const d of devices) {
      d.world.currentTime += 0.025;
      for (const tick of [...d.world.tickers]) tick();
    }
    await vi.advanceTimersByTimeAsync(25);
  }
}

describe('a host and a client session', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it("welcome a client, set its clock by the host, and play the host's notes when the host plays them", async () => {
    const lobby = memoryLobby();
    // The host's output clock reads 5 s ahead of the client's.
    const host = device(105);
    const client = device(100);
    const hosting = new HostSession(host.player, host.heardNow, () => host.world.currentTime);
    await hosting.open(lobby, 'Jam');
    expect(host.player.mode).toBe('host');
    await host.player.start();

    const following = new ClientSession(client.player, client.heardNow);
    await following.join(lobby, ' jam ', 'Ada');
    expect(following.status).toBe('joined');
    expect(hosting.guests.map((g) => g.name)).toEqual(['Ada']);
    expect(client.player.mode).toBe('client');
    expect(following.hostPlaying).toBe(true);

    await run([host, client], 12);
    expect(client.player.status).toBe('playing');
    expect(client.player.skew).toBeCloseTo(5, 9);
    expect(following.trip).toBe(0);
    // Every note the client played, the host played 5 s later on its clock.
    const hostPlayed = new Set(
      host.world.plays.map((p) => `${p.part} ${p.note} ${p.seconds.toFixed(6)}`),
    );
    const followed = client.world.plays.map(
      (p) => `${p.part} ${p.note} ${(p.seconds + 5).toFixed(6)}`,
    );
    expect(followed.length).toBeGreaterThan(20);
    for (const p of followed) expect(hostPlayed).toContain(p);
    // And the client shows the host's bars ahead, as the host decided them.
    expect(client.player.hud.next).toEqual(host.player.hud.next);
    expect(client.player.lacked).toBe(0);

    // A client's controls do nothing: the host leads.
    const track = client.player.track;
    client.player.apply({ kind: 'axis', axis: 'energy', value: 0.1 });
    expect(client.player.track).toBe(track);

    // The host's style reaches the client.
    host.player.apply({ kind: 'axis', axis: 'energy', value: 0.2 });
    expect(client.player.track).toEqual(host.player.track);

    following.leave();
    expect(hosting.guests).toEqual([]);
    expect(client.player.mode).toBe('solo');
    expect(client.player.status).toBe('stopped');
  });

  it("pass what a client's player played to the host's Muse, named by its player", async () => {
    const lobby = memoryLobby();
    const host = device(10);
    const client = device(3);
    const hosting = new HostSession(host.player, host.heardNow, () => host.world.currentTime);
    await hosting.open(lobby, 'jam');
    await host.player.start();
    const following = new ClientSession(client.player, client.heardNow);
    await following.join(lobby, 'jam', 'Ada');
    await run([host, client], 3);
    const heard = () => client.player.writtenPosition(client.world.currentTime) ?? -1;
    // Three notes four steps apart in the next bar, each played as it is heard.
    const bar = Math.floor(heard() / 16) + 1;
    for (const [i, note] of [69, 72, 76].entries()) {
      while (heard() < bar * 16 + i * 4) await run([host, client], 0.025);
      client.player.humanNoteOn('lead', note, 100, 'the computer keys', client.world.currentTime);
    }
    await run([host, client], 6);
    const took = host.player.museLog.find((j) => j.bar === bar)!;
    expect(took.judgements).toMatchObject([{ kind: 'motif', source: "Ada's computer keys" }]);
    expect(host.player.offer).toMatchObject({ bar, source: "Ada's computer keys" });
    // The client shows the host's Muse, not one of its own.
    expect(client.player.offer).toEqual(host.player.offer);
  });

  it('refuse a client of another version, and end a client that no host answers', async () => {
    const lobby = memoryLobby();
    const host = device(0);
    const hosting = new HostSession(host.player, host.heardNow, () => host.world.currentTime);
    await hosting.open(lobby, 'jam');
    const heard: HostMessage[] = [];
    const link = await lobby.join('jam', (m) => heard.push(m));
    link.send({ kind: 'join', protocol: PROTOCOL + 1, name: 'Old' });
    expect(heard[0]).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/version/) });
    expect(hosting.guests).toEqual([]);

    const lonely = device(0);
    const following = new ClientSession(lonely.player, lonely.heardNow);
    await following.join(lobby, 'nobody', 'Ada');
    await vi.advanceTimersByTimeAsync(WELCOME_WAIT);
    expect(following.status).toBe('idle');
    expect(following.ended).toMatch(/No session named “nobody”/);
    expect(lonely.player.mode).toBe('solo');
  });

  it('drop a client that goes silent, and end every client when the host closes', async () => {
    const lobby = memoryLobby();
    const host = device(0);
    const hosting = new HostSession(host.player, host.heardNow, () => host.world.currentTime);
    await hosting.open(lobby, 'jam');
    const heard: HostMessage[] = [];
    const link = await lobby.join('jam', (m) => heard.push(m));
    link.send({ kind: 'join', protocol: PROTOCOL, name: 'Quiet' });
    expect(hosting.guests).toHaveLength(1);
    host.world.currentTime += SILENT + 1;
    await vi.advanceTimersByTimeAsync(1000);
    expect(hosting.guests).toEqual([]);

    const client = device(0);
    const following = new ClientSession(client.player, client.heardNow);
    await following.join(lobby, 'jam', 'Ada');
    hosting.close();
    expect(following.status).toBe('idle');
    expect(following.ended).toBe('The host closed the session.');
    expect(host.player.mode).toBe('solo');
  });
});

describe('the lobby between tabs', () => {
  it('refuses a name that is open, in any case, and carries messages each way', async () => {
    vi.useRealTimers();
    const lobby = broadcastLobby();
    const toHost: [ClientMessage, string][] = [];
    const host = await lobby.host('Tab Jam', (m, from) => toHost.push([m, from]));
    await expect(lobby.host(' tab jam', () => {})).rejects.toThrow(/already open/);

    const toAda: HostMessage[] = [];
    const toBob: HostMessage[] = [];
    const ada = await lobby.join('tab jam', (m) => toAda.push(m));
    const bob = await lobby.join('TAB JAM', (m) => toBob.push(m));
    ada.send({ kind: 'join', protocol: PROTOCOL, name: 'Ada' });
    await new Promise((r) => setTimeout(r, 20));
    expect(toHost).toHaveLength(1);
    const [, adaId] = toHost[0]!;
    host.send({ kind: 'stop' });
    host.send({ kind: 'refused', reason: 'only Ada' }, adaId);
    await new Promise((r) => setTimeout(r, 20));
    expect(toAda).toEqual([{ kind: 'stop' }, { kind: 'refused', reason: 'only Ada' }]);
    expect(toBob).toEqual([{ kind: 'stop' }]);
    for (const end of [host, ada, bob]) end.close();
    // Once closed, the name is free again.
    await new Promise((r) => setTimeout(r, CLAIM_WAIT));
    const again = await lobby.host('tab jam', () => {});
    again.close();
  });
});
