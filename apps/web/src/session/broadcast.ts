/**
 * A lobby between the tabs and windows of one browser, on a
 * BroadcastChannel per session. It needs no server, so host mode runs on
 * one machine as it will across machines: for trying it out, and for the
 * end-to-end check that measures how close two clients sound.
 *
 * Everyone on a session's channel hears everything, so each post says who
 * sent it and, from the host, to whom. A host that opens a name first
 * claims it and waits: a host that holds it answers, and of two claims
 * that cross, the one with the smaller id wins, so two tabs opening one
 * name at once never both get it. Every host also answers on one
 * directory channel when asked which sessions are open.
 */

import {
  type ClientMessage,
  type HostMessage,
  readClientMessage,
  readHostMessage,
} from '@jambot/session';
import { type ClientLink, type HostLink, type Lobby, sessionKey } from './lobby.ts';

type Post =
  | { readonly kind: 'claim'; readonly id: string }
  | { readonly kind: 'held' }
  | { readonly kind: 'host'; readonly to?: string; readonly message: HostMessage }
  | { readonly kind: 'client'; readonly from: string; readonly message: ClientMessage };

/** How long, in milliseconds, a host waits to hear whether a name is held, and a list for answers. */
export const CLAIM_WAIT = 150;

type Directory =
  | { readonly kind: 'who' }
  | { readonly kind: 'here'; readonly name: string; readonly players: number };
const DIRECTORY = 'jambot:sessions';

const channelOf = (session: string) => `jambot:session:${sessionKey(session)}`;

let made = 0;
const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${made++}`;

export function broadcastLobby(): Lobby {
  return {
    async sessions() {
      const directory = new BroadcastChannel(DIRECTORY);
      const found = new Map<string, number>();
      directory.onmessage = ({ data }: MessageEvent<Directory>) => {
        if (data?.kind === 'here') found.set(data.name, data.players);
      };
      directory.postMessage({ kind: 'who' } satisfies Directory);
      await new Promise((resolve) => setTimeout(resolve, CLAIM_WAIT));
      directory.close();
      return [...found]
        .map(([name, players]) => ({ name, players }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async host(session, hear) {
      const channel = new BroadcastChannel(channelOf(session));
      const id = newId();
      let held = false;
      // Of two claims that cross, the smaller id wins: the larger hears it
      // is held, whichever of the two heard the other's claim.
      channel.onmessage = ({ data }: MessageEvent<Post>) => {
        if (data?.kind === 'held') held = true;
        if (data?.kind !== 'claim') return;
        if (data.id < id) held = true;
        else channel.postMessage({ kind: 'held' } satisfies Post);
      };
      channel.postMessage({ kind: 'claim', id } satisfies Post);
      await new Promise((resolve) => setTimeout(resolve, CLAIM_WAIT));
      if (held) {
        channel.close();
        throw new Error(`A session named “${session.trim()}” is already open.`);
      }
      const name = session.trim();
      const directory = new BroadcastChannel(DIRECTORY);
      // Who has joined, by what each said: a tab that closes without leaving is still counted.
      const joined = new Set<string>();
      directory.onmessage = ({ data }: MessageEvent<Directory>) => {
        if (data?.kind === 'who')
          directory.postMessage({
            kind: 'here',
            name,
            players: 1 + joined.size,
          } satisfies Directory);
      };
      channel.onmessage = ({ data }: MessageEvent<Post>) => {
        if (data?.kind === 'claim') channel.postMessage({ kind: 'held' } satisfies Post);
        if (data?.kind !== 'client') return;
        const message = readClientMessage(data.message);
        if (!message) return;
        if (message.kind === 'join') joined.add(data.from);
        else if (message.kind === 'leave') joined.delete(data.from);
        hear(message, data.from);
      };
      return {
        reclaim: null,
        send(message, to) {
          channel.postMessage(
            (to === undefined
              ? { kind: 'host', message }
              : { kind: 'host', to, message }) satisfies Post,
          );
        },
        close: () => {
          channel.close();
          directory.close();
        },
      } satisfies HostLink;
    },

    async join(session, hear) {
      const channel = new BroadcastChannel(channelOf(session));
      const id = newId();
      channel.onmessage = ({ data }: MessageEvent<Post>) => {
        if (data?.kind !== 'host' || (data.to !== undefined && data.to !== id)) return;
        const message = readHostMessage(data.message);
        if (message) hear(message);
      };
      return {
        send: (message) =>
          channel.postMessage({ kind: 'client', from: id, message } satisfies Post),
        close: () => channel.close(),
      } satisfies ClientLink;
    },
  };
}
