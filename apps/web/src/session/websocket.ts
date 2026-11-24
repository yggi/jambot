/**
 * A lobby through a lobby server (`apps/lobby`), over a WebSocket: on a
 * laptop at the event as `ws://…`, or hosted as `wss://…`.
 *
 * Each part a page plays gets a socket of its own: one to list the
 * sessions, one to host, one to join. The server relays the session's
 * messages; this end reads each as the session protocol says
 * (`readHostMessage`, `readClientMessage`), and turns what the server says
 * itself into what a session hears: a client that left leaves, a host gone
 * closes; a host whose link dropped, that the lobby holds the session for,
 * is away, and back. A socket that closes under a session is a lost lobby.
 *
 * A page served over `https://` can reach only a `wss://` lobby, or one on
 * `localhost`; a browser refuses the rest before a byte is sent.
 */

import {
  type FromLobby,
  type ToLobby,
  readClientMessage,
  readFromLobby,
  readHostMessage,
} from '@jambot/session';
import type { ClientLink, HostLink, Lobby, Lost } from './lobby.ts';

/** How long, in milliseconds, reaching the server and its first answer may take. */
export const LOBBY_WAIT = 4000;

/** A socket to the server, open, with what it says next and everything it says after. */
async function reach(
  url: string,
  first: ToLobby,
  after: (message: FromLobby) => void,
  lost: () => void,
): Promise<{ socket: WebSocket; answer: FromLobby }> {
  if (!/^wss?:\/\/./.test(url))
    throw new Error(`“${url}” is no lobby address: it starts ws:// or wss://.`);
  let socket: WebSocket;
  try {
    socket = new WebSocket(url);
  } catch {
    throw new Error(
      url.startsWith('ws://') && globalThis.location?.protocol === 'https:'
        ? `This page is served over https, so it can reach a wss:// lobby only, or one on localhost: not ${url}.`
        : `“${url}” is no lobby address.`,
    );
  }
  return new Promise((resolve, reject) => {
    let answered = false;
    const fail = (why: string) => {
      if (answered) return;
      answered = true;
      socket.close();
      reject(new Error(why));
    };
    const timer = setTimeout(() => fail(`The lobby at ${url} did not answer.`), LOBBY_WAIT);
    socket.onopen = () => socket.send(JSON.stringify(first));
    socket.onerror = () => fail(`Can't reach the lobby at ${url}.`);
    socket.onclose = () => {
      clearTimeout(timer);
      if (answered) lost();
      else fail(`Can't reach the lobby at ${url}.`);
    };
    socket.onmessage = ({ data }: MessageEvent<string>) => {
      let message: FromLobby | null;
      try {
        message = readFromLobby(JSON.parse(data));
      } catch {
        return;
      }
      if (!message) return;
      if (answered) return after(message);
      answered = true;
      clearTimeout(timer);
      resolve({ socket, answer: message });
    };
  });
}

const refusedOr = <T>(
  answer: FromLobby,
  op: FromLobby['op'],
  socket: WebSocket,
  done: () => T,
): T => {
  if (answer.op === op) return done();
  // Refused: closed quietly, as no session was lost.
  socket.onclose = null;
  socket.close();
  throw new Error(answer.op === 'refused' ? answer.reason : `The lobby answered ${answer.op}.`);
};

export function websocketLobby(url: string): Lobby {
  const lostLobby = (lost?: Lost) => () => lost?.(`Lost the lobby at ${url}.`);
  return {
    async sessions() {
      const { socket, answer } = await reach(
        url,
        { op: 'list' },
        () => {},
        () => {},
      );
      socket.onclose = null;
      socket.close();
      // An older server's answer has no `sessions`: it lists none rather than fail.
      return answer.op === 'sessions' && Array.isArray(answer.sessions)
        ? [...answer.sessions].sort((a, b) => a.name.localeCompare(b.name))
        : [];
    },

    async host(session, hear, lost, reclaim) {
      let closing = false;
      const { socket, answer } = await reach(
        url,
        reclaim === undefined ? { op: 'host', session } : { op: 'host', session, reclaim },
        (said) => {
          if (said.op === 'heard') {
            const message = readClientMessage(said.message);
            if (message) hear(message, said.from);
          } else if (said.op === 'left') hear({ kind: 'lost' }, said.from);
        },
        () => closing || lostLobby(lost)(),
      );
      const send = (request: ToLobby) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(request));
      };
      return refusedOr(
        answer,
        'hosting',
        socket,
        () =>
          ({
            reclaim: answer.op === 'hosting' ? answer.reclaim : null,
            send: (message, to) =>
              send(to === undefined ? { op: 'send', message } : { op: 'send', to, message }),
            close() {
              closing = true;
              send({ op: 'end' });
              socket.close();
            },
          }) satisfies HostLink,
      );
    },

    async join(session, hear, lost) {
      let closing = false;
      const { socket, answer } = await reach(
        url,
        { op: 'join', session },
        (said) => {
          if (said.op === 'said') {
            const message = readHostMessage(said.message);
            if (message) hear(message);
          } else if (said.op === 'away') hear({ kind: 'away' });
          else if (said.op === 'back') hear({ kind: 'back' });
          else if (said.op === 'gone') {
            closing = true;
            hear({ kind: 'closed' });
          }
        },
        () => closing || lostLobby(lost)(),
      );
      return refusedOr(
        answer,
        'joined',
        socket,
        () =>
          ({
            send(message) {
              if (socket.readyState === WebSocket.OPEN)
                socket.send(JSON.stringify({ op: 'tell', message } satisfies ToLobby));
            },
            close() {
              closing = true;
              socket.close();
            },
          }) satisfies ClientLink,
      );
    },
  };
}
