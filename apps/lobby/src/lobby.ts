/**
 * The lobby server: sessions found by name, and a relay between each host
 * and its clients, over WebSockets.
 *
 * It holds nothing but who is where. A host's message goes to one client or
 * to all, serialised once however many there are; a client's goes to its
 * host with the client's id. When a client's socket closes its host hears
 * that it left, and when a host's closes its clients hear it is away, and
 * gone if it isn't back within `LOBBY.hostGrace`, by the secret it was given
 * when it opened the session, so a page that reloads doesn't end the
 * session for everyone in it. Meanwhile its list says the session is
 * `away`, and refuses a join to it. A
 * socket that doesn't answer a ping within `LOBBY.heartbeat`, or that falls
 * `LOBBY.backlog` bytes behind, is closed: Jambot is played live, and a
 * link that far behind is no link to play on. It also refuses beyond
 * `LOBBY.maxSessions` and `LOBBY.maxClients`, closes a socket sending faster
 * than `LOBBY.rate` (with a `LOBBY.burst`), and upgrades only pages from
 * `LOBBY.origins` or localhost.
 *
 * It runs the same on a laptop at an event, over plain `ws://`, and hosted
 * behind a proxy that gives it `wss://`. `GET /health` says it is up, with
 * how many sessions and sockets it holds.
 */

import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  type FromLobby,
  type ToLobby,
  nameRefusal,
  readToLobby,
  sessionKey,
} from '@jambot/session';
import { type WebSocket, WebSocketServer } from 'ws';

export const LOBBY = {
  /** The largest message taken, in bytes: a welcome with the whole forecast is about 50 KB. */
  maxPayload: 1024 * 1024,
  /** How often, in milliseconds, each socket is pinged, and how long it has to answer. */
  heartbeat: 15_000,
  /** How far, in bytes, a socket may fall behind before it is closed. */
  backlog: 512 * 1024,
  /** How long, in milliseconds, a session waits for a host whose link dropped. */
  hostGrace: 30_000,
  /** The most sessions open at once. */
  maxSessions: 200,
  /** The most clients in one session: the designed range is 2 to 16. */
  maxClients: 32,
  /** Messages a socket may send a second, on average, and in one burst: playing needs a few. */
  rate: 50,
  burst: 200,
  /** Pages allowed to open a socket, besides any on localhost; a request with no origin is not a page. */
  origins: ['https://yggi.github.io'] as readonly string[],
} as const;

interface Session {
  readonly name: string;
  /** The host's link, or null while it is away. */
  host: WebSocket | null;
  /** What takes the session back for a host whose link dropped. */
  readonly reclaim: string;
  readonly clients: Map<string, WebSocket>;
  /** Ends the session if its host doesn't come back in time. */
  grace: ReturnType<typeof setTimeout> | null;
}

type Part =
  | { readonly kind: 'none' }
  | { readonly kind: 'host'; readonly key: string }
  | { readonly kind: 'client'; readonly key: string; readonly id: string };

export interface Lobby {
  /** The port it listens on. */
  readonly port: number;
  /** How many sessions are open, and how many sockets it holds. */
  counts(): { sessions: number; sockets: number };
  close(): Promise<void>;
}

export interface LobbyOptions {
  /** 0 for any free port. */
  readonly port?: number;
  readonly host?: string;
  readonly heartbeat?: number;
  readonly backlog?: number;
  readonly hostGrace?: number;
  readonly maxSessions?: number;
  readonly maxClients?: number;
  readonly rate?: number;
  readonly burst?: number;
  /** The origins allowed to open a socket, besides localhost; `'*'` allows any. */
  readonly origins?: readonly string[];
}

/** Whether a page at `origin` may open a socket: no origin, localhost, or one listed. */
export function originAllowed(origin: string | undefined, allowed: readonly string[]): boolean {
  if (origin === undefined || allowed.includes('*') || allowed.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

export async function startLobby({
  port = 8787,
  host = '0.0.0.0',
  heartbeat = LOBBY.heartbeat,
  backlog = LOBBY.backlog,
  hostGrace = LOBBY.hostGrace,
  maxSessions = LOBBY.maxSessions,
  maxClients = LOBBY.maxClients,
  rate = LOBBY.rate,
  burst = LOBBY.burst,
  origins = LOBBY.origins,
}: LobbyOptions = {}): Promise<Lobby> {
  const sessions = new Map<string, Session>();
  const parts = new Map<WebSocket, Part>();
  const alive = new WeakSet<WebSocket>();
  /** Each socket's allowance of messages, refilled at `rate` a second up to `burst`. */
  const allowance = new WeakMap<WebSocket, { tokens: number; at: number }>();
  const allowed = (socket: WebSocket) => {
    const now = Date.now();
    const a = allowance.get(socket) ?? { tokens: burst, at: now };
    a.tokens = Math.min(burst, a.tokens + ((now - a.at) / 1000) * rate);
    a.at = now;
    allowance.set(socket, a);
    if (a.tokens < 1) return false;
    a.tokens -= 1;
    return true;
  };
  let made = 0;

  const http = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      });
      response.end(JSON.stringify({ ok: true, sessions: sessions.size, sockets: parts.size }));
      return;
    }
    response.writeHead(404).end();
  });
  const server = new WebSocketServer({
    server: http,
    maxPayload: LOBBY.maxPayload,
    verifyClient: ({ origin }: { origin?: string }) => originAllowed(origin, origins),
  });

  const sendRaw = (socket: WebSocket, data: string) => {
    if (socket.readyState !== socket.OPEN) return;
    if (socket.bufferedAmount > backlog) return void socket.terminate();
    socket.send(data);
  };
  const send = (socket: WebSocket, message: FromLobby) => sendRaw(socket, JSON.stringify(message));

  function hear(socket: WebSocket, request: ToLobby) {
    const part = parts.get(socket) ?? { kind: 'none' };
    switch (request.op) {
      case 'list':
        return send(socket, {
          op: 'sessions',
          sessions: [...sessions.values()].map((s) => ({
            name: s.name,
            players: 1 + s.clients.size,
            ...(s.host === null ? { away: true } : {}),
          })),
        });
      case 'host': {
        if (part.kind !== 'none') return;
        const refused = nameRefusal(request.session);
        const key = sessionKey(request.session);
        if (refused) return send(socket, { op: 'refused', reason: refused });
        const held = sessions.get(key);
        if (held) {
          if (request.reclaim === undefined || request.reclaim !== held.reclaim)
            return send(socket, {
              op: 'refused',
              reason: `A session named “${request.session.trim()}” is already open.`,
            });
          // Its host, come back: from a link that dropped, or one not yet seen to close.
          if (held.grace) clearTimeout(held.grace);
          held.grace = null;
          if (held.host) {
            parts.set(held.host, { kind: 'none' });
            held.host.terminate();
          }
          held.host = socket;
          parts.set(socket, { kind: 'host', key });
          send(socket, { op: 'hosting', session: held.name, reclaim: held.reclaim });
          for (const client of held.clients.values()) send(client, { op: 'back' });
          return;
        }
        if (sessions.size >= maxSessions)
          return send(socket, { op: 'refused', reason: 'The lobby is full: try again later.' });
        const name = request.session.trim();
        const reclaim = randomUUID();
        sessions.set(key, { name, host: socket, reclaim, clients: new Map(), grace: null });
        parts.set(socket, { kind: 'host', key });
        return send(socket, { op: 'hosting', session: name, reclaim });
      }
      case 'join': {
        if (part.kind !== 'none') return;
        const key = sessionKey(request.session);
        const session = sessions.get(key);
        if (!session)
          return send(socket, {
            op: 'refused',
            reason: `No session named “${request.session.trim()}” is open.`,
          });
        if (!session.host)
          return send(socket, {
            op: 'refused',
            reason: `The host of “${session.name}” has lost its link and may be back in a moment.`,
          });
        if (session.clients.size >= maxClients)
          return send(socket, { op: 'refused', reason: `“${session.name}” is full.` });
        const id = `c${(made++).toString(36)}`;
        session.clients.set(id, socket);
        parts.set(socket, { kind: 'client', key, id });
        return send(socket, { op: 'joined', session: session.name });
      }
      case 'send': {
        if (part.kind !== 'host') return;
        const session = sessions.get(part.key);
        if (!session) return;
        const data = JSON.stringify({ op: 'said', message: request.message } satisfies FromLobby);
        if (request.to === undefined)
          for (const client of session.clients.values()) sendRaw(client, data);
        else {
          const client = session.clients.get(request.to);
          if (client) sendRaw(client, data);
        }
        return;
      }
      case 'end': {
        if (part.kind !== 'host') return;
        const session = sessions.get(part.key);
        if (session?.host === socket) {
          if (session.grace) clearTimeout(session.grace);
          end(part.key, session);
        }
        return;
      }
      case 'tell': {
        if (part.kind !== 'client') return;
        const session = sessions.get(part.key);
        if (session?.host)
          send(session.host, { op: 'heard', from: part.id, message: request.message });
        return;
      }
    }
  }

  function leave(socket: WebSocket) {
    const part = parts.get(socket);
    parts.delete(socket);
    if (!part || part.kind === 'none') return;
    const session = sessions.get(part.key);
    if (!session) return;
    if (part.kind === 'client') {
      session.clients.delete(part.id);
      if (session.host) send(session.host, { op: 'left', from: part.id });
      return;
    }
    // A host taken over, closing late, has already lost its part.
    if (session.host !== socket) return;
    session.host = null;
    for (const client of session.clients.values()) send(client, { op: 'away' });
    session.grace = setTimeout(() => end(part.key, session), hostGrace);
  }

  /** The session is over: its clients hear it, and its name is free. */
  function end(key: string, session: Session) {
    if (sessions.get(key) !== session) return;
    sessions.delete(key);
    for (const client of session.clients.values()) {
      send(client, { op: 'gone' });
      parts.set(client, { kind: 'none' });
      client.close();
    }
  }

  server.on('connection', (socket) => {
    parts.set(socket, { kind: 'none' });
    alive.add(socket);
    socket.on('pong', () => alive.add(socket));
    socket.on('message', (data, binary) => {
      if (binary) return;
      if (!allowed(socket)) return void socket.close(1008, 'Too many messages.');
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return;
      }
      const request = readToLobby(parsed);
      if (request) hear(socket, request);
    });
    socket.on('close', () => leave(socket));
    socket.on('error', () => socket.terminate());
  });

  const beat = setInterval(() => {
    for (const socket of parts.keys()) {
      if (!alive.has(socket)) {
        socket.terminate();
        continue;
      }
      alive.delete(socket);
      socket.ping();
    }
  }, heartbeat);

  await new Promise<void>((resolve) => http.listen(port, host, resolve));
  return {
    port: (http.address() as AddressInfo).port,
    counts: () => ({ sessions: sessions.size, sockets: parts.size }),
    async close() {
      clearInterval(beat);
      for (const session of sessions.values()) if (session.grace) clearTimeout(session.grace);
      for (const socket of parts.keys()) socket.terminate();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await new Promise<void>((resolve) => http.close(() => resolve()));
    },
  };
}
