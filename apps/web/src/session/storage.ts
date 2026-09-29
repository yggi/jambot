/**
 * Where a host and a client keep what they need to come back after the
 * page went away (`snapshot.ts`): the browser's `localStorage`, one record
 * for each. It survives a reload, and a phone closing an app in the
 * background. Storage can be missing or refuse (a private window), and
 * then a session simply doesn't come back: nothing else is lost.
 */

import {
  type ClientResume,
  type HostSnapshot,
  readClientResume,
  readHostSnapshot,
} from '@jambot/session';
import type { ClientKeep } from './client.svelte.ts';
import type { HostKeep } from './host.svelte.ts';

export const HOST_KEY = 'jambot:host-session';
export const CLIENT_KEY = 'jambot:client-session';

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The session runs; it just won't come back from a reload.
  }
};
const remove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // As above.
  }
};
const read = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
};

export const hostKeep: HostKeep = {
  save: (snapshot) => write(HOST_KEY, snapshot),
  clear: () => remove(HOST_KEY),
};

export const clientKeep: ClientKeep = {
  save: (resume) => write(CLIENT_KEY, resume),
  clear: () => remove(CLIENT_KEY),
};

/** The host session kept, if one is good at `now` (seconds since the epoch): else it is forgotten. */
export function keptHost(now: number): HostSnapshot | null {
  const snapshot = readHostSnapshot(read(HOST_KEY), now);
  if (!snapshot) remove(HOST_KEY);
  return snapshot;
}

/** The client session kept, if one is good at `now`: else it is forgotten. */
export function keptClient(now: number): ClientResume | null {
  const resume = readClientResume(read(CLIENT_KEY), now);
  if (!resume) remove(CLIENT_KEY);
  return resume;
}
