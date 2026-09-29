import {
  type ClientMessage,
  HOST_PLAYER,
  type HostMessage,
  type HostSnapshot,
  PROTOCOL,
  RECONNECT,
  RESUME_WINDOW,
  playerSource,
} from '@jambot/session';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { broadcastLobby, CLAIM_WAIT } from './broadcast.ts';
import { ClientSession, WELCOME_WAIT } from './client.svelte.ts';
import { device, memoryLobby } from './fixtures.ts';
import type { Lobby } from './lobby.ts';
import { HostSession, SILENT } from './host.svelte.ts';

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

  it("follow a buffer the client's output drops at its next tick, and one the host's drops at the next answer", async () => {
    const lobby = memoryLobby();
    const host = device(105);
    const client = device(100);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'Jam');
    await host.player.start();
    const following = new ClientSession(client.player, client.clocks);
    await following.join(lobby, 'Jam', 'Ada');
    await run([host, client], 4);
    expect(client.player.skew).toBeCloseTo(5, 9);

    // The client's output loses a buffer: what it hears falls behind its page.
    const buffer = 512 / 48000;
    client.world.heardOffset -= buffer;
    await run([host, client], 0.025);
    expect(client.player.skew).toBeCloseTo(5 + buffer, 9);

    // The host's does: the client plays by it once the host has said so.
    host.world.heardOffset -= buffer;
    await run([host, client], 0.3);
    expect(client.player.skew).toBeCloseTo(5, 9);
    following.leave();
    hosting.close();
  });

  it("count a client's round trips and its clock while it is joined, and none once it leaves (#27)", async () => {
    const lobby = memoryLobby();
    const host = device(105);
    const client = device(100);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'Jam');
    const following = new ClientSession(client.player, client.clocks);
    expect(following.timing).toBeNull();
    await following.join(lobby, 'Jam', 'Ada');
    await run([host, client], 2);
    const timing = following.timing!;
    // Pings every 50 ms until the clock is trusted, then every 250 ms; each answered at once.
    expect(timing.trips.count).toBeGreaterThan(8);
    expect(timing.trips.most).toBe(0);
    expect(timing.reading?.trip).toBe(0);
    expect(timing.skew).toBeCloseTo(5, 9);
    following.leave();
    expect(following.timing).toBeNull();
    hosting.close();
  });

  it("welcome a client, set its clock by the host, and play the host's notes when the host plays them", async () => {
    const lobby = memoryLobby();
    // The host's output clock reads 5 s ahead of the client's.
    const host = device(105);
    const client = device(100);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'Jam');
    expect(host.player.mode).toBe('host');
    await host.player.start();

    const following = new ClientSession(client.player, client.clocks);
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

  it("pass what a client's player played to the host's Muse, by the client's id, read by its name (A3)", async () => {
    const lobby = memoryLobby();
    const host = device(10);
    const client = device(3);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'jam');
    await host.player.start();
    const following = new ClientSession(client.player, client.clocks);
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
    const [ada] = hosting.guests;
    const source = playerSource(ada!.id, 'the computer keys');
    expect(took.judgements).toMatchObject([{ kind: 'motif', source }]);
    expect(host.player.offer).toMatchObject({ bar, source });
    // The client shows the host's Muse, not one of its own, and both read it by name.
    expect(client.player.offer).toEqual(host.player.offer);
    for (const player of [host.player, client.player])
      expect(player.hud.muse.log[0]).toMatchObject({
        text: "Took a 3-note motif from Ada's computer keys.",
      });
  });

  it("name the host's own notes by its player, so a client never reads them as its own", async () => {
    const lobby = memoryLobby();
    const host = device(10);
    const client = device(3);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'jam', 'Bo');
    await host.player.start();
    const following = new ClientSession(client.player, client.clocks);
    await following.join(lobby, 'jam', 'Ada');
    await run([host, client], 3);
    const heard = () => host.player.writtenPosition(host.world.currentTime) ?? -1;
    const bar = Math.floor(heard() / 16) + 1;
    for (const [i, note] of [69, 72, 76].entries()) {
      while (heard() < bar * 16 + i * 4) await run([host, client], 0.025);
      host.player.humanNoteOn('lead', note, 100, 'the computer keys', host.world.currentTime);
    }
    await run([host, client], 6);
    const took = client.player.museLog.find((j) => j.bar === bar)!;
    const source = playerSource(HOST_PLAYER, 'the computer keys');
    expect(took.judgements).toMatchObject([{ kind: 'motif', source }]);
    expect(client.player.hud.muse.log[0]).toMatchObject({
      text: "Took a 3-note motif from Bo's computer keys.",
    });
    // Without a name, the host's notes are the host's.
    hosting.close();
    expect(host.player.playerId).toBeNull();
    await hosting.open(lobby, 'jam');
    expect(host.player.players).toEqual({ [HOST_PLAYER]: 'the host' });
  });

  it("refuse a name already in the session, the host's included, in any case (A3)", async () => {
    const lobby = memoryLobby();
    const host = device(0);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'jam', 'Bo');
    const heard: HostMessage[][] = [[], [], []];
    const links = await Promise.all(heard.map((h) => lobby.join('jam', (m) => h.push(m))));
    links[0]!.send({ kind: 'join', protocol: PROTOCOL, name: 'Ada' });
    links[1]!.send({ kind: 'join', protocol: PROTOCOL, name: 'ADA ' });
    links[2]!.send({ kind: 'join', protocol: PROTOCOL, name: 'bo' });
    expect(heard[0]![0]).toMatchObject({ kind: 'welcome' });
    for (const h of [heard[1]!, heard[2]!])
      expect(h.find((m) => m.kind === 'refused')).toMatchObject({
        reason: expect.stringMatching(/already in this session/),
      });
    expect(hosting.guests.map((g) => g.name)).toEqual(['Ada']);
    expect(host.player.players).toEqual({ [HOST_PLAYER]: 'Bo', [hosting.guests[0]!.id]: 'Ada' });
  });

  it('refuse a client of another version, and end a client that no host answers', async () => {
    const lobby = memoryLobby();
    const host = device(0);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'jam');
    const heard: HostMessage[] = [];
    const link = await lobby.join('jam', (m) => heard.push(m));
    link.send({ kind: 'join', protocol: PROTOCOL + 1, name: 'Old' });
    expect(heard[0]).toMatchObject({ kind: 'refused', reason: expect.stringMatching(/version/) });
    expect(hosting.guests).toEqual([]);

    const lonely = device(0);
    const following = new ClientSession(lonely.player, lonely.clocks);
    await following.join(lobby, 'nobody', 'Ada');
    await vi.advanceTimersByTimeAsync(WELCOME_WAIT);
    expect(following.status).toBe('idle');
    expect(following.ended).toMatch(/No session named “nobody”/);
    expect(lonely.player.mode).toBe('solo');
  });

  it('keep the host playing through what only claims to be a judgement, and say it dropped it (T1)', async () => {
    const lobby = memoryLobby();
    const host = device(0);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'jam');
    await host.player.start();
    const link = await lobby.join('jam', () => {});
    link.send({ kind: 'join', protocol: PROTOCOL, name: 'Mallory' });
    await run([host], 3);
    const bar = Math.floor(host.player.writtenPosition(host.world.currentTime)! / 16);
    // Its envelope reads as a judgement; what it says doesn't.
    const garbled = { kind: 'motif', source: 'the computer keys', level: 100 };
    link.send({ kind: 'judged', bar, judgement: garbled } as unknown as ClientMessage);
    const before = host.world.plays.length;
    await run([host], 3);
    expect(host.world.plays.length).toBeGreaterThan(before + 10);
    expect(host.player.dropped).toMatchObject([{ bar, why: 'inadmissible' }]);
  });

  it('drop a client that goes silent, and end every client when the host closes', async () => {
    const lobby = memoryLobby();
    const host = device(0);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime);
    await hosting.open(lobby, 'jam');
    const heard: HostMessage[] = [];
    const link = await lobby.join('jam', (m) => heard.push(m));
    link.send({ kind: 'join', protocol: PROTOCOL, name: 'Quiet' });
    expect(hosting.guests).toHaveLength(1);
    host.world.currentTime += SILENT + 1;
    await vi.advanceTimersByTimeAsync(1000);
    expect(hosting.guests).toEqual([]);

    const client = device(0);
    const following = new ClientSession(client.player, client.clocks);
    await following.join(lobby, 'jam', 'Ada');
    hosting.close();
    expect(following.status).toBe('idle');
    expect(following.ended).toBe('The host closed the session.');
    expect(host.player.mode).toBe('solo');
  });
});

/** A client's words to a host, and its welcome's token. */
async function joined(lobby: Lobby, session: string, name: string, resume?: string) {
  const heard: HostMessage[] = [];
  const link = await lobby.join(session, (m) => heard.push(m));
  link.send(
    resume === undefined
      ? { kind: 'join', protocol: PROTOCOL, name }
      : { kind: 'join', protocol: PROTOCOL, name, resume },
  );
  const welcome = heard.find((m) => m.kind === 'welcome');
  return { heard, link, token: welcome?.kind === 'welcome' ? welcome.resume : null };
}

describe('a client whose link drops', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  /** A host playing and a client joined, both a few seconds in. */
  async function playing(options: { keep?: HostSnapshot[] } = {}) {
    const lobby = memoryLobby();
    const host = device(105);
    const client = device(100);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime, {
      mint: (() => {
        let n = 0;
        return () => `token-${n++}`;
      })(),
      ...(options.keep && {
        keep: { save: (s: HostSnapshot) => void options.keep!.push(s), clear: () => {} },
      }),
    });
    await hosting.open(lobby, 'Jam', 'Bo');
    await host.player.start();
    const following = new ClientSession(client.player, client.clocks, {
      wallNow: () => client.world.currentTime,
    });
    await following.join(lobby, 'Jam', 'Ada');
    await run([host, client], 3);
    expect(following.status).toBe('joined');
    return { lobby, host, client, hosting, following };
  }

  it('keeps playing what it has, tries again, and is seated as the same player', async () => {
    const { lobby, host, client, hosting, following } = await playing();
    const [ada] = hosting.guests;
    lobby.cut('Jam');
    expect(following.status).toBe('reconnecting');
    expect(hosting.guests).toEqual([]);
    // Its seat and its name are kept for it.
    expect(host.player.players[ada!.id]).toBe('Ada');
    expect(client.player.mode).toBe('client');
    expect(client.player.status).toBe('playing');
    await run([host, client], 1);
    expect(following.status).toBe('joined');
    expect(hosting.guests).toEqual([ada]);
    expect(host.player.players).toEqual({ [HOST_PLAYER]: 'Bo', [ada!.id]: 'Ada' });
    expect(client.player.status).toBe('playing');
    // It sets its clock afresh, and follows the song again.
    await run([host, client], 2);
    expect(client.player.skew).toBeCloseTo(5, 9);
    following.leave();
    hosting.close();
  });

  it('is seated at once when a page wakes, where a link that dropped waits for its next try', async () => {
    const { lobby, host, client, hosting, following } = await playing();
    lobby.cut('Jam');
    following.wake();
    await vi.advanceTimersByTimeAsync(0);
    expect(following.status).toBe('joined');
    expect(hosting.guests).toHaveLength(1);
    following.leave();
    hosting.close();
    void host;
    void client;
  });

  it('takes a link that said nothing through a sleep for dead, and joins again over a new one', async () => {
    const { host, client, hosting, following } = await playing();
    const [ada] = hosting.guests;
    // The page slept: its clock ran on, and its timers and sockets did nothing.
    client.world.currentTime += 60;
    following.wake();
    expect(following.status).toBe('reconnecting');
    await run([host, client], 1);
    expect(following.status).toBe('joined');
    expect(hosting.guests).toEqual([ada]);
    // A link that has been heard on lately is not dropped by a wake.
    following.wake();
    expect(following.status).toBe('joined');
    following.leave();
    hosting.close();
  });

  it('gives up when it is not seated within the window, and says so', async () => {
    const { lobby, client, following } = await playing();
    lobby.cut('Jam');
    lobby.refusing = 'The host has lost its link.';
    await run([client], RECONNECT.window - 1);
    expect(following.status).toBe('reconnecting');
    await run([client], 2);
    expect(following.status).toBe('idle');
    expect(following.ended).toBe('Lost the connection to Jam.');
    expect(client.player.mode).toBe('solo');
  });

  it('is not retried when the host refuses it: a name taken while it was away is an answer, not an outage', async () => {
    const { lobby, host, client, following } = await playing();
    lobby.cut('Jam');
    const other = await joined(lobby, 'Jam', 'Ada');
    expect(other.token).not.toBeNull();
    await run([host, client], 1);
    expect(following.status).toBe('idle');
    expect(following.ended).toMatch(/already in this session/);
  });

  it('is not seated again once it left on purpose, or after the window it was kept for', async () => {
    const { lobby, host, client, hosting, following } = await playing();
    const token = (await joined(lobby, 'Jam', 'Ada2')).token!;
    void token;
    following.leave();
    expect(hosting.guests.map((g) => g.name)).toEqual(['Ada2']);
    // A client that dropped and stayed away past the window has no seat to come back to.
    const cy = await joined(lobby, 'Jam', 'Cy');
    lobby.cut('Jam');
    host.world.currentTime += RESUME_WINDOW + 1;
    await vi.advanceTimersByTimeAsync(1000);
    const back = await joined(lobby, 'Jam', 'Cy', cy.token!);
    // Its old id is not given back: it is a new player under a name that is free.
    expect(hosting.guests.map((g) => g.name)).toEqual(['Cy']);
    expect(back.heard[0]).toMatchObject({ kind: 'welcome' });
    void client;
  });
});

describe('a host that is reloaded', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('keeps what a reload needs as it changes, and takes its session up again with its players away until they come back', async () => {
    const saved: HostSnapshot[] = [];
    let cleared = 0;
    const lobby = memoryLobby();
    const first = device(0);
    const hosting = new HostSession(first.player, first.clocks, () => first.world.currentTime, {
      mint: () => 'token-ada',
      keep: { save: (s) => void saved.push(s), clear: () => void cleared++ },
      epoch: () => 5000,
    });
    await hosting.open(lobby, 'Friday Jam', 'Bo');
    const ada = await joined(lobby, 'Friday Jam', 'Ada');
    first.player.tempoNudge = 0.25;
    hosting.persist();
    const snapshot = JSON.parse(JSON.stringify(saved.at(-1)));
    expect(snapshot).toMatchObject({
      session: 'Friday Jam',
      player: 'Bo',
      roster: [{ id: expect.any(String), name: 'Ada', token: 'token-ada' }],
      tempoNudge: 0.25,
      savedAt: 5000,
    });
    expect(Object.values(snapshot.players).sort()).toEqual(['Ada', 'Bo']);

    // The page goes: nothing closes on purpose. A new page, a new lobby.
    const second = device(0);
    const again = new HostSession(second.player, second.clocks, () => second.world.currentTime, {
      mint: () => 'token-other',
      keep: { save: (s) => void saved.push(s), clear: () => void cleared++ },
    });
    const fresh = memoryLobby();
    await again.open(fresh, 'ignored', '', { restore: snapshot });
    expect(again.session).toBe('Friday Jam');
    expect(again.guests).toEqual([]);
    expect(second.player.players).toEqual(snapshot.players);
    expect(second.player.tempoNudge).toBe(0.25);

    const back = await joined(fresh, 'Friday Jam', 'Ada', 'token-ada');
    expect(back.heard[0]).toMatchObject({ kind: 'welcome', resume: 'token-ada' });
    expect(again.guests).toEqual([{ id: snapshot.roster[0].id, name: 'Ada' }]);
    // Nobody else gets Ada's name, or her token.
    const stranger = await joined(fresh, 'Friday Jam', 'ada', 'guess');
    expect(stranger.heard[0]).toMatchObject({ kind: 'refused' });
    void ada;

    // Closing on purpose keeps nothing to come back to.
    again.close();
    expect(cleared).toBe(1);
  });

  it('starts fresh when it is given nothing, and ends what it kept when it closes', async () => {
    const saved: HostSnapshot[] = [];
    let cleared = 0;
    const host = device(0);
    const hosting = new HostSession(host.player, host.clocks, () => host.world.currentTime, {
      keep: { save: (s) => void saved.push(s), clear: () => void cleared++ },
    });
    await hosting.open(memoryLobby(), 'jam');
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ session: 'jam', roster: [], player: 'the host' });
    hosting.close();
    expect(cleared).toBe(1);
    hosting.persist();
    expect(saved).toHaveLength(1);
  });
});

describe('the lobby between tabs', () => {
  it('refuses a name that is open, in any case, and carries messages each way', async () => {
    vi.useRealTimers();
    const lobby = broadcastLobby();
    const toHost: [ClientMessage, string][] = [];
    const host = await lobby.host('Tab Jam', (m, from) => toHost.push([m, from]));
    await expect(lobby.host(' tab jam', () => {})).rejects.toThrow(/already open/);
    expect(await lobby.sessions()).toEqual([{ name: 'Tab Jam', players: 1 }]);

    const toAda: HostMessage[] = [];
    const toBob: HostMessage[] = [];
    const ada = await lobby.join('tab jam', (m) => toAda.push(m));
    const bob = await lobby.join('TAB JAM', (m) => toBob.push(m));
    ada.send({ kind: 'join', protocol: PROTOCOL, name: 'Ada' });
    await new Promise((r) => setTimeout(r, 20));
    expect(toHost).toHaveLength(1);
    const [, adaId] = toHost[0]!;
    // The host and Ada, who said she joined; Bob has not.
    expect(await lobby.sessions()).toEqual([{ name: 'Tab Jam', players: 2 }]);
    ada.send({ kind: 'leave' });
    await new Promise((r) => setTimeout(r, 20));
    expect(await lobby.sessions()).toEqual([{ name: 'Tab Jam', players: 1 }]);
    ada.send({ kind: 'join', protocol: PROTOCOL, name: 'Ada' });
    await new Promise((r) => setTimeout(r, 20));
    host.send({ kind: 'stop' });
    host.send({ kind: 'refused', reason: 'only Ada' }, adaId);
    await new Promise((r) => setTimeout(r, 20));
    expect(toAda).toEqual([{ kind: 'stop' }, { kind: 'refused', reason: 'only Ada' }]);
    expect(toBob).toEqual([{ kind: 'stop' }]);
    for (const end of [host, ada, bob]) end.close();
    // Two tabs opening one name at once: one gets it.
    const opened = await Promise.allSettled([
      lobby.host('Both', () => {}),
      lobby.host('both', () => {}),
    ]);
    expect(opened.map((o) => o.status).sort()).toEqual(['fulfilled', 'rejected']);
    for (const o of opened) if (o.status === 'fulfilled') o.value.close();
    // Once closed, the name is free again.
    await new Promise((r) => setTimeout(r, CLAIM_WAIT));
    const again = await lobby.host('tab jam', () => {});
    again.close();
  });
});
