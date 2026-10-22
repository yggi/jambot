// @vitest-environment node
// Node's own WebSocket, against the real lobby server.

import { type Lobby as Server, startLobby } from '@jambot/lobby';
import {
  CODE_WRONG,
  type ClientMessage,
  type HostMessage,
  type HostSnapshot,
  PROTOCOL,
} from '@jambot/session';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Output } from '../audio/output.ts';
import { Player, type Surroundings } from '../player.svelte.ts';
import { ClientSession } from './client.svelte.ts';
import { HostSession } from './host.svelte.ts';
import { websocketLobby } from './websocket.ts';

const until = async (done: () => boolean, ms = 3000) => {
  const end = Date.now() + ms;
  while (!done()) {
    if (Date.now() > end) throw new Error('timed out');
    await new Promise((r) => setTimeout(r, 10));
  }
};

/**
 * A device whose clocks read `at` and stand there: the test's, not the
 * machine's, so what it reads doesn't depend on how busy the machine is.
 * The clock under delay is the pure tests' (`faults.test.ts`); this one
 * carries the stamps over a real socket and composes them.
 */
function device(at: number, heardOffset: number) {
  const now = () => at;
  const tickers: (() => void)[] = [];
  const output: Output = {
    get currentTime() {
      return now();
    },
    latency: 0,
    resume: () => Promise.resolve(),
    play: () => {},
    silence: () => {},
  };
  const surroundings: Surroundings = {
    output: () => output,
    ticker(tick) {
      tickers.push(tick);
      return () => void tickers.splice(tickers.indexOf(tick), 1);
    },
    frame: () => () => {},
    seed: () => 1,
    page: now,
  };
  return {
    player: new Player(surroundings),
    clocks: { page: now, heardOffset: () => heardOffset },
    tickers,
  };
}

describe('the WebSocket lobby', () => {
  let server: Server;
  let url: string;
  beforeEach(async () => {
    server = await startLobby({ port: 0, host: '127.0.0.1' });
    url = `ws://127.0.0.1:${server.port}`;
  });
  afterEach(() => server.close());

  it('opens, lists, joins and relays each way, a client leaving and a host closing as a session hears them', async () => {
    const lobby = websocketLobby(url);
    const toHost: [ClientMessage, string][] = [];
    const host = await lobby.host('Friday Jam', (m, from) => toHost.push([m, from]));
    await expect(lobby.host('friday jam', () => {})).rejects.toThrow(/already open/);
    expect(await lobby.sessions()).toEqual([{ name: 'Friday Jam', players: 1 }]);
    const lostOnRefusal: string[] = [];
    await expect(
      lobby.join(
        'nobody',
        () => {},
        (why) => lostOnRefusal.push(why),
      ),
    ).rejects.toThrow(/No session named “nobody”/);

    const toAda: HostMessage[] = [];
    const ada = await lobby.join('FRIDAY JAM', (m) => toAda.push(m));
    // The host, and a client that has joined.
    expect(await lobby.sessions()).toEqual([{ name: 'Friday Jam', players: 2 }]);
    ada.send({ kind: 'join', protocol: PROTOCOL, name: 'Ada' });
    await until(() => toHost.length === 1);
    const [[join, id]] = toHost as [[ClientMessage, string]];
    expect(join).toEqual({ kind: 'join', protocol: PROTOCOL, name: 'Ada' });
    host.send({ kind: 'stop' });
    host.send({ kind: 'refused', reason: 'only you' }, id);
    await until(() => toAda.length === 2);
    expect(toAda).toEqual([{ kind: 'stop' }, { kind: 'refused', reason: 'only you' }]);

    ada.close();
    await until(() => toHost.length === 2);
    expect(toHost[1]).toEqual([{ kind: 'lost' }, id]);

    const toBob: HostMessage[] = [];
    await lobby.join('friday jam', (m) => toBob.push(m));
    host.close();
    await until(() => toBob.length === 1);
    expect(toBob).toEqual([{ kind: 'closed' }]);
    expect(await lobby.sessions()).toEqual([]);
    // A refusal is no lost lobby.
    expect(lostOnRefusal).toEqual([]);
  });

  it('says so when the lobby is lost, or not there at all', async () => {
    const lobby = websocketLobby(url);
    const lost: string[] = [];
    await lobby.host(
      'jam',
      () => {},
      (why) => lost.push(why),
    );
    await lobby.join(
      'jam',
      () => {},
      (why) => lost.push(why),
    );
    await server.close();
    await until(() => lost.length === 2);
    expect(lost).toEqual([`Lost the lobby at ${url}.`, `Lost the lobby at ${url}.`]);
    await expect(lobby.sessions()).rejects.toThrow(/Can't reach the lobby/);
    await expect(websocketLobby('http://nowhere').sessions()).rejects.toThrow(/no lobby address/);
    server = await startLobby({ port: 0, host: '127.0.0.1' });
  });

  it("carries a host's code in a join it never reads, so a host admits by a code over the lobby as it is (#461)", async () => {
    const lobby = websocketLobby(url);
    const host = device(40, 0);
    const hosting = new HostSession(host.player, host.clocks, undefined, { draw: () => '042917' });
    await hosting.open(lobby, 'jam');
    hosting.admitByCode(true);
    const refused = device(7, 0);
    const turnedAway = new ClientSession(refused.player, refused.clocks);
    await turnedAway.join(lobby, 'jam', 'Bo', { code: '111111' });
    await until(() => turnedAway.status === 'idle');
    expect(turnedAway.ended).toBe(CODE_WRONG);
    const client = device(7, 0);
    const following = new ClientSession(client.player, client.clocks);
    await following.join(lobby, 'jam', 'Ada', { code: '042917' });
    await until(() => following.status === 'joined');
    expect(hosting.guests.map((g) => g.name)).toEqual(['Ada']);
    following.leave();
    hosting.close();
  });

  it('carries a host and a client session: the client joins, sets its clock and follows the song', async () => {
    const lobby = websocketLobby(url);
    // Each output is heard some milliseconds from its page clock.
    const host = device(40, 0.03);
    const client = device(7, 0.05);
    const hosting = new HostSession(host.player, host.clocks);
    await hosting.open(lobby, 'jam');
    await host.player.start();
    const following = new ClientSession(client.player, client.clocks);
    await following.join(lobby, 'jam', 'Ada');
    await until(() => following.status === 'joined');
    expect(hosting.guests.map((g) => g.name)).toEqual(['Ada']);
    await until(() => client.player.status === 'playing');
    // The page clocks read 33 s apart, and stand still: every ping comes
    // back at once on them, so the client reads exactly that, and plays by
    // it with the host's output offset added and its own taken off.
    expect(following.trip).toBe(0);
    expect(client.player.skew).toBeCloseTo(33 + 0.03 - 0.05, 12);

    hosting.close();
    await until(() => following.status === 'idle');
    expect(following.ended).toBe('The host closed the session.');
    expect(client.player.mode).toBe('solo');
    host.player.halt();
  });

  describe('when a link is lost', () => {
    /** Every socket the page opens, to drop one as a phone's system does: no close frame, no word. */
    const sockets: WebSocket[] = [];
    beforeEach(() => {
      const Real = globalThis.WebSocket;
      vi.stubGlobal(
        'WebSocket',
        class extends Real {
          constructor(...args: ConstructorParameters<typeof Real>) {
            super(...args);
            sockets.push(this);
          }
        },
      );
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      sockets.length = 0;
    });

    it('seats a client whose socket dropped as the same player, over a new one, while the host plays on', async () => {
      const lobby = websocketLobby(url);
      const host = device(40, 0.03);
      const client = device(7, 0.05);
      const hosting = new HostSession(host.player, host.clocks);
      await hosting.open(lobby, 'jam');
      await host.player.start();
      const following = new ClientSession(client.player, client.clocks);
      const before = sockets.length;
      await following.join(lobby, 'jam', 'Ada');
      await until(() => following.status === 'joined' && client.player.status === 'playing');
      const [ada] = hosting.guests;
      expect(ada).toBeDefined();

      sockets[before]!.close();
      await until(() => following.status === 'reconnecting');
      expect(client.player.mode).toBe('client');
      await until(() => hosting.guests.length === 0);
      await until(() => following.status === 'joined' && hosting.guests.length === 1);
      expect(hosting.guests).toEqual([ada]);
      expect(host.player.players).toMatchObject({ [ada!.id]: 'Ada' });
      await until(() => client.player.status === 'playing');
      following.leave();
      hosting.close();
      host.player.halt();
    });

    it('carries a session through a host page that goes and comes back from what it kept: clients stay joined, and seat again', async () => {
      const lobby = websocketLobby(url);
      const kept: HostSnapshot[] = [];
      const host = device(40, 0.03);
      const client = device(7, 0.05);
      const first = new HostSession(host.player, host.clocks, undefined, {
        keep: { save: (s) => void kept.push(s), clear: () => {} },
      });
      const hostSockets = sockets.length;
      await first.open(lobby, 'Friday Jam', 'Bo');
      await host.player.start();
      const following = new ClientSession(client.player, client.clocks);
      await following.join(lobby, 'friday jam', 'Ada');
      await until(() => following.status === 'joined' && client.player.status === 'playing');
      const [ada] = first.guests;
      const snapshot = JSON.parse(JSON.stringify(kept.at(-1))) as HostSnapshot;
      expect(snapshot.reclaim).toEqual(expect.any(String));

      // The host's page goes: its socket with it, and nothing says goodbye.
      sockets[hostSockets]!.close();
      await until(() => following.hostAway);
      expect(following.status).toBe('joined');
      // The host away still counts, with the client that is seated.
      expect(await lobby.sessions()).toEqual([{ name: 'Friday Jam', players: 2 }]);

      // A new page, a new player, what was kept.
      const reloaded = device(90, 0.02);
      const second = new HostSession(reloaded.player, reloaded.clocks);
      await second.open(lobby, 'anything', '', { restore: snapshot });
      await until(() => !following.hostAway && second.guests.length === 1);
      expect(second.guests).toEqual([ada]);
      expect(reloaded.player.players).toEqual(snapshot.players);
      // The new host isn't playing yet, so the client stops with the old song…
      await until(() => client.player.status === 'stopped');
      expect(following.status).toBe('joined');
      // …and follows the new one when it starts.
      await reloaded.player.start();
      await until(() => client.player.status === 'playing');
      expect(client.player.skew).toBeCloseTo(90 + 0.02 - 7 - 0.05, 12);

      following.leave();
      second.close();
      reloaded.player.halt();
      host.player.halt();
    });
  });
});
