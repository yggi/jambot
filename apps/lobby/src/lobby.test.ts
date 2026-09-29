import type { FromLobby, ToLobby } from '@jambot/session';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOBBY, type Lobby, startLobby } from './lobby.ts';

/** A socket to the lobby that keeps what it hears, and waits for what comes next. */
async function connect(port: number) {
  const socket = new WebSocket(`ws://localhost:${port}`);
  const heard: FromLobby[] = [];
  const waiting: ((m: FromLobby) => void)[] = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(String(data)) as FromLobby;
    const next = waiting.shift();
    if (next) next(message);
    else heard.push(message);
  };
  const closed = new Promise<void>((resolve) => (socket.onclose = () => resolve()));
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  return {
    send: (request: ToLobby | string) =>
      socket.send(typeof request === 'string' ? request : JSON.stringify(request)),
    next: () =>
      new Promise<FromLobby>((resolve) => {
        const m = heard.shift();
        if (m) resolve(m);
        else waiting.push(resolve);
      }),
    heard,
    closed,
    close: () => socket.close(),
  };
}

const settle = () => new Promise((r) => setTimeout(r, 30));

/** A raw TCP socket, upgraded to a WebSocket, that says what it is told and reads only when asked. */
async function rawSocket(port: number) {
  const { connect: tcp } = await import('node:net');
  const socket = tcp(port, '127.0.0.1');
  await new Promise((resolve) => socket.once('connect', resolve));
  socket.write(
    'GET / HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
      'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n',
  );
  await new Promise((resolve) => socket.once('data', resolve));
  /** A short text frame, masked as a client's must be. */
  const say = (text: string) => {
    const body = Buffer.from(text);
    const mask = Buffer.from([1, 2, 3, 4]);
    const masked = body.map((b, i) => b ^ mask[i % 4]!);
    socket.write(Buffer.concat([Buffer.from([0x81, 0x80 | body.length]), mask, masked]));
  };
  const closed = new Promise((resolve) => socket.once('close', resolve));
  return { socket, say, closed };
}

describe('the lobby', () => {
  let lobby: Lobby;
  beforeEach(async () => void (lobby = await startLobby({ port: 0, host: '127.0.0.1' })));
  afterEach(() => lobby.close());

  it('opens a session by name once, in any case, and lists it', async () => {
    const host = await connect(lobby.port);
    host.send({ op: 'host', session: ' Friday Jam ' });
    expect(await host.next()).toEqual({
      op: 'hosting',
      session: 'Friday Jam',
      reclaim: expect.any(String),
    });
    const other = await connect(lobby.port);
    other.send({ op: 'host', session: 'friday jam' });
    expect(await other.next()).toEqual({
      op: 'refused',
      reason: 'A session named “friday jam” is already open.',
    });
    other.send({ op: 'list' });
    expect(await other.next()).toEqual({ op: 'sessions', names: ['Friday Jam'] });
    for (const name of ['  ', 'x'.repeat(41)]) {
      other.send({ op: 'host', session: name });
      expect(await other.next()).toMatchObject({ op: 'refused' });
    }
  });

  it("relays a host's messages to one client or all, and a client's to its host with its id", async () => {
    const host = await connect(lobby.port);
    host.send({ op: 'host', session: 'jam' });
    await host.next();
    const ada = await connect(lobby.port);
    const bob = await connect(lobby.port);
    for (const c of [ada, bob]) {
      c.send({ op: 'join', session: 'JAM' });
      expect(await c.next()).toEqual({ op: 'joined', session: 'jam' });
    }
    ada.send({ op: 'tell', message: { kind: 'join', protocol: 1, name: 'Ada' } });
    const heard = await host.next();
    expect(heard).toMatchObject({ op: 'heard', message: { kind: 'join', name: 'Ada' } });
    const adaId = (heard as FromLobby & { op: 'heard' }).from;

    host.send({ op: 'send', message: { kind: 'stop' } });
    host.send({ op: 'send', to: adaId, message: { kind: 'refused', reason: 'only Ada' } });
    expect(await ada.next()).toEqual({ op: 'said', message: { kind: 'stop' } });
    expect(await ada.next()).toEqual({
      op: 'said',
      message: { kind: 'refused', reason: 'only Ada' },
    });
    expect(await bob.next()).toEqual({ op: 'said', message: { kind: 'stop' } });
    await settle();
    expect(bob.heard).toEqual([]);
  });

  it('refuses a join to a session that is not open', async () => {
    const lonely = await connect(lobby.port);
    lonely.send({ op: 'join', session: 'nobody' });
    expect(await lonely.next()).toEqual({
      op: 'refused',
      reason: 'No session named “nobody” is open.',
    });
  });

  it('tells a host when a client leaves, and its clients when it goes for good, and frees the name', async () => {
    await lobby.close();
    lobby = await startLobby({ port: 0, host: '127.0.0.1', hostGrace: 50 });
    const host = await connect(lobby.port);
    host.send({ op: 'host', session: 'jam' });
    await host.next();
    const ada = await connect(lobby.port);
    const bob = await connect(lobby.port);
    for (const c of [ada, bob]) {
      c.send({ op: 'join', session: 'jam' });
      await c.next();
    }
    ada.close();
    expect(await host.next()).toMatchObject({ op: 'left' });
    host.close();
    expect(await bob.next()).toEqual({ op: 'away' });
    expect(await bob.next()).toEqual({ op: 'gone' });
    await bob.closed;
    const again = await connect(lobby.port);
    again.send({ op: 'host', session: 'jam' });
    expect(await again.next()).toMatchObject({ op: 'hosting', session: 'jam' });
  });

  describe('a host whose link drops', () => {
    /** A session with a host and two clients joined, and the host's reclaim secret. */
    async function session(options: { hostGrace?: number } = {}) {
      await lobby.close();
      lobby = await startLobby({ port: 0, host: '127.0.0.1', ...options });
      const host = await connect(lobby.port);
      host.send({ op: 'host', session: 'jam' });
      const hosting = (await host.next()) as FromLobby & { op: 'hosting' };
      const ada = await connect(lobby.port);
      const bob = await connect(lobby.port);
      for (const c of [ada, bob]) {
        c.send({ op: 'join', session: 'jam' });
        await c.next();
      }
      return { host, ada, bob, reclaim: hosting.reclaim };
    }

    it('keeps its session for its clients, who hear it is away, and hands it back by its secret', async () => {
      const { host, ada, bob, reclaim } = await session();
      host.close();
      expect(await ada.next()).toEqual({ op: 'away' });
      expect(await bob.next()).toEqual({ op: 'away' });
      expect(lobby.counts()).toEqual({ sessions: 1, sockets: 2 });

      const again = await connect(lobby.port);
      again.send({ op: 'host', session: 'JAM', reclaim });
      expect(await again.next()).toEqual({ op: 'hosting', session: 'jam', reclaim });
      expect(await ada.next()).toEqual({ op: 'back' });
      expect(await bob.next()).toEqual({ op: 'back' });
      // The relay runs as before, each way, by the ids the clients kept.
      ada.send({ op: 'tell', message: { kind: 'join', protocol: 3, name: 'Ada' } });
      const heard = (await again.next()) as FromLobby & { op: 'heard' };
      expect(heard).toMatchObject({ op: 'heard', message: { kind: 'join', name: 'Ada' } });
      again.send({ op: 'send', to: heard.from, message: { kind: 'stop' } });
      expect(await ada.next()).toEqual({ op: 'said', message: { kind: 'stop' } });
      // The old link's close, late, ended nothing.
      await settle();
      expect(lobby.counts()).toEqual({ sessions: 1, sockets: 3 });
    });

    it('drops what a client tells it while it is away, and refuses a join until it is back', async () => {
      const { host, ada, reclaim } = await session();
      host.close();
      await ada.next();
      ada.send({ op: 'tell', message: { kind: 'ping', sent: 1 } });
      const late = await connect(lobby.port);
      late.send({ op: 'join', session: 'jam' });
      expect(await late.next()).toEqual({
        op: 'refused',
        reason: 'The host of “jam” has lost its link and may be back in a moment.',
      });
      const again = await connect(lobby.port);
      again.send({ op: 'host', session: 'jam', reclaim });
      await again.next();
      await settle();
      // The ping was dropped, not held for the host that came back.
      expect(again.heard).toEqual([]);
    });

    it('is not told a client left while away, and hears no more of one that did', async () => {
      const { host, ada, reclaim } = await session();
      host.close();
      await ada.next();
      ada.close();
      await settle();
      const again = await connect(lobby.port);
      again.send({ op: 'host', session: 'jam', reclaim });
      await again.next();
      await settle();
      expect(again.heard).toEqual([]);
    });

    it('ends the session at once when its host says so, and frees the name', async () => {
      const { host, ada } = await session();
      host.send({ op: 'end' });
      expect(await ada.next()).toEqual({ op: 'gone' });
      host.close();
      await ada.closed;
      await settle();
      expect(lobby.counts()).toEqual({ sessions: 0, sockets: 0 });
      const again = await connect(lobby.port);
      again.send({ op: 'host', session: 'jam' });
      expect(await again.next()).toMatchObject({ op: 'hosting' });
    });

    it('holds the name against another host, and against a wrong secret', async () => {
      const { host } = await session();
      host.close();
      await settle();
      for (const request of [
        { op: 'host', session: 'jam' } as const,
        { op: 'host', session: 'jam', reclaim: 'guess' } as const,
      ]) {
        const other = await connect(lobby.port);
        other.send(request);
        expect(await other.next()).toEqual({
          op: 'refused',
          reason: 'A session named “jam” is already open.',
        });
      }
    });

    it('ends the session for its clients when it is not back within the grace', async () => {
      const { host, ada, bob, reclaim } = await session({ hostGrace: 60 });
      host.close();
      expect(await ada.next()).toEqual({ op: 'away' });
      expect(await bob.next()).toEqual({ op: 'away' });
      expect(await ada.next()).toEqual({ op: 'gone' });
      expect(await bob.next()).toEqual({ op: 'gone' });
      await Promise.all([ada.closed, bob.closed]);
      await settle();
      expect(lobby.counts()).toEqual({ sessions: 0, sockets: 0 });
      // The secret of a session that is gone opens a new one, as after a restart.
      const again = await connect(lobby.port);
      again.send({ op: 'host', session: 'jam', reclaim });
      const reopened = (await again.next()) as FromLobby & { op: 'hosting' };
      expect(reopened).toMatchObject({ op: 'hosting', session: 'jam' });
      expect(reopened.reclaim).not.toBe(reclaim);
    });

    it('takes the session over from a link the lobby has not yet seen close, and the old one ends nothing later', async () => {
      const { host, ada, reclaim } = await session();
      const reloaded = await connect(lobby.port);
      reloaded.send({ op: 'host', session: 'jam', reclaim });
      expect(await reloaded.next()).toEqual({ op: 'hosting', session: 'jam', reclaim });
      expect(await ada.next()).toEqual({ op: 'back' });
      await host.closed;
      await settle();
      expect(ada.heard).toEqual([]);
      expect(lobby.counts()).toEqual({ sessions: 1, sockets: 3 });
      // The session is the reloaded host's: a wrong secret takes nothing.
      const thief = await connect(lobby.port);
      thief.send({ op: 'host', session: 'jam', reclaim: 'guess' });
      expect(await thief.next()).toMatchObject({ op: 'refused' });
    });
  });

  it("ignores what isn't a request, and a request out of its part", async () => {
    const socket = await connect(lobby.port);
    socket.send('not json');
    socket.send({ op: 'send', message: { kind: 'stop' } } as ToLobby);
    socket.send(JSON.stringify({ op: 'host' }));
    socket.send(JSON.stringify({ op: 'shout' }));
    await settle();
    expect(socket.heard).toEqual([]);
    socket.send({ op: 'list' });
    expect(await socket.next()).toEqual({ op: 'sessions', names: [] });
    expect(lobby.counts()).toEqual({ sessions: 0, sockets: 1 });
  });

  it('says it is up, and how much it holds', async () => {
    const host = await connect(lobby.port);
    host.send({ op: 'host', session: 'jam' });
    await host.next();
    const health = await (await fetch(`http://127.0.0.1:${lobby.port}/health`)).json();
    expect(health).toEqual({ ok: true, sessions: 1, sockets: 1 });
  });

  it('closes a socket that stops answering pings', async () => {
    await lobby.close();
    lobby = await startLobby({ port: 0, host: '127.0.0.1', heartbeat: 50 });
    const answering = await connect(lobby.port);
    // A raw socket never answers a ping: a WebSocket client would.
    const quiet = await rawSocket(lobby.port);
    expect(lobby.counts().sockets).toBe(2);
    await quiet.closed;
    // The one that answers outlives several beats.
    await new Promise((r) => setTimeout(r, 200));
    expect(lobby.counts().sockets).toBe(1);
    answering.close();
    expect(LOBBY.heartbeat).toBeGreaterThan(1000);
  });

  it('closes a client that falls too far behind, and its host plays on', async () => {
    await lobby.close();
    lobby = await startLobby({ port: 0, host: '127.0.0.1', backlog: 64 * 1024 });
    const host = await connect(lobby.port);
    host.send({ op: 'host', session: 'jam' });
    await host.next();
    const stalled = await rawSocket(lobby.port);
    stalled.say(JSON.stringify({ op: 'join', session: 'jam' }));
    stalled.socket.pause();
    await settle();
    expect(lobby.counts().sockets).toBe(2);
    // Bars keep coming, 100 KB each, until the socket's buffers are full.
    const bar = { kind: 'refused', reason: 'x'.repeat(100_000) } as const;
    for (let i = 0; i < 400 && lobby.counts().sockets > 1; i++) {
      host.send({ op: 'send', message: bar });
      await new Promise((r) => setTimeout(r, 5));
    }
    // The stalled socket reads nothing, so it never hears that it closed.
    await settle();
    expect(lobby.counts()).toEqual({ sessions: 1, sockets: 1 });
    stalled.socket.destroy();
  });

  it('is deployed as it runs: the port and the health check agree across fly.toml and the Dockerfile', async () => {
    const { readFileSync } = await import('node:fs');
    const at = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const fly = at('fly.toml');
    const docker = at('Dockerfile');
    const port = fly.match(/internal_port = (\d+)/)?.[1];
    expect(port).toBeDefined();
    expect(fly).toContain(`PORT = "${port}"`);
    expect(docker).toContain(`ENV PORT=${port}`);
    expect(docker).toContain(`EXPOSE ${port}`);
    // One machine, never stopped: a session lives in its memory.
    expect(fly).toMatch(/auto_stop_machines = "off"/);
    expect(fly).toMatch(/min_machines_running = 1/);
    const path = fly.match(/path = "([^"]+)"/)?.[1];
    const health = await fetch(`http://127.0.0.1:${lobby.port}${path}`);
    expect(health.status).toBe(200);
  });
});
