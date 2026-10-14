/**
 * What the session tests share: a device whose clocks the test moves, and a
 * lobby in memory. Only tests import it.
 */

import { type ClientMessage, type HostMessage } from '@jambot/session';
import type { Output } from '../audio/output.ts';
import { Player, type Surroundings } from '../player.svelte.ts';
import { type HostLink, type Lobby, sessionKey } from './lobby.ts';

/**
 * A device: an output whose clock the test moves, the ticks it runs, and
 * its output's offset from its page clock, which reads the output's clock:
 * a buffer the output drops moves the offset.
 */
export function device(clockAt: number) {
  const world = {
    currentTime: clockAt,
    heardOffset: 0,
    /** How many times the output was asked to let its clock run. */
    resumed: 0,
    /** Whether the output's clock stays still and its `resume` never answers, as a browser's does before a click. */
    suspended: false,
    plays: [] as { part: string; note: number; seconds: number }[],
    tickers: [] as (() => void)[],
  };
  const output: Output = {
    get currentTime() {
      return world.currentTime;
    },
    latency: 0,
    resume: () => {
      world.resumed++;
      return world.suspended ? new Promise<void>(() => {}) : Promise.resolve();
    },
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
    page: () => world.currentTime,
  };
  return {
    world,
    player: new Player(surroundings),
    clocks: { page: () => world.currentTime, heardOffset: () => world.heardOffset },
  };
}

/** A lobby in memory: every message delivered at once, as a local link nearly is. */
export function memoryLobby(): Lobby & {
  /** Every client's link of a session drops, as its sockets do: each is told, and the host hears it lost. */
  cut(session: string): void;
  /** Whether new joins are refused, as by a lobby whose host is away. */
  refusing: string | null;
} {
  const hosts = new Map<string, (message: ClientMessage, from: string) => void>();
  const clients = new Map<
    string,
    Map<string, { hear: (message: HostMessage) => void; lost: ((why: string) => void) | undefined }>
  >();
  const names = new Map<string, string>();
  let made = 0;
  const lobby = {
    refusing: null as string | null,
    cut(session: string) {
      const key = sessionKey(session);
      for (const [id, { lost }] of [...clients.get(key)!]) {
        clients.get(key)!.delete(id);
        hosts.get(key)?.({ kind: 'lost' }, id);
        lost?.('Lost the lobby.');
      }
    },
    sessions: async () =>
      [...hosts.keys()].map((key) => ({
        name: names.get(key)!,
        players: 1 + (clients.get(key)?.size ?? 0),
      })),
    async host(session, hear) {
      const key = sessionKey(session);
      if (hosts.has(key)) throw new Error('taken');
      hosts.set(key, hear);
      names.set(key, session.trim());
      clients.set(key, new Map());
      return {
        reclaim: null,
        send(message, to) {
          for (const [id, { hear }] of clients.get(key)!)
            if (to === undefined || to === id) hear(structuredClone(message));
        },
        close: () => void hosts.delete(key),
      } satisfies HostLink;
    },
    async join(session, hear, lost) {
      const key = sessionKey(session);
      if (lobby.refusing !== null) throw new Error(lobby.refusing);
      if (!hosts.has(key)) throw new Error(`No session named “${session.trim()}” is open.`);
      const id = `client-${made++}`;
      clients.get(key)?.set(id, { hear, lost });
      return {
        send: (message) => hosts.get(key)?.(structuredClone(message), id),
        close: () => void clients.get(key)?.delete(id),
      };
    },
  } satisfies Lobby & { cut(session: string): void; refusing: string | null };
  return lobby;
}
