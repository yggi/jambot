// @vitest-environment node
// Node's own WebSocket, against the real lobby server.

import { type Lobby as Server, startLobby } from '@jambot/lobby';
import { type ClientMessage, type HostMessage, PROTOCOL } from '@jambot/session';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

/** When the test's devices began: one origin, so their clocks are apart by exactly what they're given. */
const began = performance.now();

/** A device whose output clock reads real time from `at`, and whose ticks the test runs. */
function device(at: number) {
  const now = () => at + (performance.now() - began) / 1000;
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
  };
  return { player: new Player(surroundings), heardNow: now, tickers };
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
    expect(await lobby.sessions()).toEqual(['Friday Jam']);
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
    expect(toHost[1]).toEqual([{ kind: 'leave' }, id]);

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

  it('carries a host and a client session: the client joins, sets its clock and follows the song', async () => {
    const lobby = websocketLobby(url);
    const host = device(40);
    const client = device(7);
    const hosting = new HostSession(host.player, host.heardNow);
    await hosting.open(lobby, 'jam');
    await host.player.start();
    const following = new ClientSession(client.player, client.heardNow);
    await following.join(lobby, 'jam', 'Ada');
    await until(() => following.status === 'joined');
    expect(hosting.guests.map((g) => g.name)).toEqual(['Ada']);
    await until(() => client.player.status === 'playing');
    // The clocks read 33 s apart.
    // Within what the clock promises: half its best round trip, which a
    // loaded machine lengthens, and a millisecond for the rounding and the slew.
    expect(following.trip).toBeLessThan(100);
    expect(Math.abs(client.player.skew - 33)).toBeLessThanOrEqual(
      (following.trip! + 1) / 2000 + 0.001,
    );

    hosting.close();
    await until(() => following.status === 'idle');
    expect(following.ended).toBe('The host closed the session.');
    expect(client.player.mode).toBe('solo');
    host.player.stop();
  });
});
