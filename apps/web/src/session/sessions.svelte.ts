/**
 * The sessions a page can be in: one place for opening, joining, ending and
 * taking up again, over a host's session and a client's, and the two lobbies
 * they are found in.
 *
 * A session is found `local`ly, between the tabs and windows of this
 * browser, or `global`ly, through the lobby server at the address given
 * (`address`, kept for next time). A page is in one session at a time: what
 * one keeps to come back to (`Kept`) is dropped when the other starts, and
 * ends with it.
 *
 * A session that ended on its own, a host closing or a link given up,
 * leaves its reason in `ended` until the next session starts or `dismiss`.
 * A page that reloads takes a kept session up again (`restore`), and says it
 * is `restoring` until it is, or gave up and said why: after `RESTORE_WAIT`,
 * or when a person `drop`s it.
 */

import type { ClientResume, HostSnapshot, OpenSession } from '@jambot/session';
import type { DeviceClocks } from './clocks.ts';
import { ClientSession, type ClientKeep } from './client.svelte.ts';
import { HostSession, type HostKeep } from './host.svelte.ts';
import type { Lobby } from './lobby.ts';
import type { Player } from '../player.svelte.ts';

/** Where a session is found: this browser's tabs, or the lobby server. */
export type Where = 'local' | 'global';

/** An open session, and where it is. */
export interface Listed extends OpenSession {
  readonly where: Where;
}

/** The sessions open, and why some couldn't be listed. */
export interface Found {
  readonly sessions: readonly Listed[];
  readonly problem: string | null;
}

/** What a page keeps to come back to a session after a reload. */
export interface Kept {
  readonly hostKeep: HostKeep;
  readonly clientKeep: ClientKeep;
  /** The host session kept, if one is good at `now`, in seconds since the epoch. */
  keptHost(now: number): HostSnapshot | null;
  keptClient(now: number): ClientResume | null;
}

export interface SessionsOptions {
  /** The lobby between this browser's tabs. */
  readonly tabs: Lobby;
  /** A lobby server by its address. */
  readonly server: (url: string) => Lobby;
  /** The lobby server's address to offer when none was given before. */
  readonly address?: string;
  readonly kept: Kept;
  /** The time, in seconds, that silences are measured by. */
  readonly wallNow?: () => number;
}

/** How long, in milliseconds, taking a kept session up again may take before it is given up. */
export const RESTORE_WAIT = 10_000;

const ADDRESS_KEY = 'jambot:lobby';
const NO_SERVER = 'No lobby server is given: open Advanced to set one.';

const why = (e: unknown) => (e instanceof Error ? e.message : String(e));

const storedAddress = (): string | null => {
  try {
    return localStorage.getItem(ADDRESS_KEY);
  } catch {
    return null;
  }
};

export class Sessions {
  readonly asHost: HostSession;
  readonly asClient: ClientSession;

  #address = $state('');
  #restoringHost = $state(false);
  /**
   * Whether the client's join under way is a kept session taken up again.
   * It can't be reset once `restore` returns: a join returns as it is sent,
   * and the host answers later, so `restoring` reads it with the join's
   * status, and a join a person starts clears it.
   */
  #restoringClient = $state(false);
  /** Counts the restores begun, so one dropped or given up does not go on. */
  #restores = 0;
  #tabs: Lobby;
  #server: (url: string) => Lobby;
  #kept: Kept;

  constructor(
    player: Player,
    clocks: DeviceClocks,
    { tabs, server, address = '', kept, wallNow }: SessionsOptions,
  ) {
    this.#tabs = tabs;
    this.#server = server;
    this.#kept = kept;
    this.#address = storedAddress() ?? address;
    this.asHost = new HostSession(player, clocks, wallNow, { keep: kept.hostKeep });
    this.asClient = new ClientSession(player, clocks, {
      keep: kept.clientKeep,
      ...(wallNow ? { wallNow } : {}),
    });
  }

  /** The global lobby's address; empty for none. Kept for next time. */
  get address(): string {
    return this.#address;
  }

  set address(url: string) {
    this.#address = url;
    try {
      localStorage.setItem(ADDRESS_KEY, url);
    } catch {
      // Nothing is lost but an address to retype.
    }
  }

  /** A session kept from before is being taken up again. */
  get restoring(): boolean {
    return this.#restoringHost || (this.#restoringClient && this.asClient.status === 'joining');
  }

  /** Why the last session ended on its own, or a join or restore failed. */
  get ended(): string | null {
    return this.asHost.ended ?? this.asClient.ended;
  }

  dismiss() {
    this.asHost.ended = null;
    this.asClient.ended = null;
  }

  /**
   * Let go of a session being taken up again, or any session: what a reload
   * would come back to is forgotten, the page is at the door, and the reason
   * left is none. For a restore that hangs, and a person who won't wait.
   */
  drop() {
    this.#restores++;
    this.#restoringHost = false;
    this.#restoringClient = false;
    this.forget();
    this.end();
    this.dismiss();
  }

  /** The lobby a kept record names: the tabs for none, else the server at that address. */
  #lobbyAt(url: string): Lobby {
    return url === '' ? this.#tabs : this.#server(url);
  }

  #urlOf(where: Where): string {
    const url = where === 'local' ? '' : this.#address.trim();
    if (where === 'global' && url === '') throw new Error(NO_SERVER);
    return url;
  }

  /** Open a session under a name, the host's own notes going by `player`. Throws if it can't. */
  async host(where: Where, session: string, player: string) {
    const url = this.#urlOf(where);
    this.#kept.clientKeep.clear();
    this.dismiss();
    await this.asHost.open(this.#lobbyAt(url), session, player, { lobbyUrl: url });
  }

  /** Join the session under a name; a join that fails leaves its reason in `ended`. */
  async join(where: Where, session: string, name: string) {
    this.#restoringClient = false;
    this.#kept.hostKeep.clear();
    this.dismiss();
    let url: string;
    try {
      url = this.#urlOf(where);
    } catch (e) {
      this.asClient.ended = why(e);
      return;
    }
    let lobby: Lobby;
    try {
      lobby = this.#lobbyAt(url);
    } catch (e) {
      this.asClient.ended = why(e);
      return;
    }
    await this.asClient.join(lobby, session, name, { lobbyUrl: url });
  }

  /** Forget what a page keeps to come back to a session: a reload after this finds none. */
  forget() {
    this.#kept.hostKeep.clear();
    this.#kept.clientKeep.clear();
  }

  /** Close the session if hosting it, leave it if playing in it. */
  end() {
    if (this.asHost.session !== null) this.asHost.close();
    else this.asClient.leave();
  }

  /** The sessions open in both lobbies, and why either couldn't be listed. */
  async list(): Promise<Found> {
    const sessions: Listed[] = [];
    let problem: string | null = null;
    const from = async (where: Where, lobby: () => Lobby) => {
      try {
        for (const open of await lobby().sessions()) sessions.push({ ...open, where });
      } catch (e) {
        problem = why(e);
      }
    };
    await Promise.all([
      from('local', () => this.#tabs),
      this.#address.trim() === ''
        ? undefined
        : from('global', () => this.#server(this.#address.trim())),
    ]);
    return { sessions, problem };
  }

  /**
   * Take up the session kept, if there is one: a host reopens it by the
   * secret the lobby gave, a client joins again as the player it was. One
   * that can't is forgotten, and its reason left in `ended`.
   */
  async restore(now: number) {
    const host = this.#kept.keptHost(now);
    const client = host ? null : this.#kept.keptClient(now);
    if (!host && !client) return;
    const attempt = ++this.#restores;
    const current = () => attempt === this.#restores;
    // A lobby that takes the connection and never answers is given up, not waited for.
    const patience = setTimeout(() => {
      if (!current()) return;
      this.drop();
      this.asHost.ended = 'Taking up your session again took too long, so it was let go.';
    }, RESTORE_WAIT);
    try {
      if (host) {
        this.#restoringHost = true;
        try {
          await this.asHost.open(this.#lobbyAt(host.lobby), host.session, host.player, {
            restore: host,
            lobbyUrl: host.lobby,
          });
          // Dropped or given up meanwhile: it opened too late to be wanted.
          if (!current()) this.asHost.close();
        } catch (e) {
          if (!current()) return;
          this.#kept.hostKeep.clear();
          this.asHost.ended = why(e);
        } finally {
          if (current()) this.#restoringHost = false;
        }
      } else if (client) {
        this.#restoringClient = true;
        try {
          await this.asClient.join(this.#lobbyAt(client.lobby), client.session, client.name, {
            resume: client.token,
            lobbyUrl: client.lobby,
          });
        } catch (e) {
          if (!current()) return;
          this.#kept.clientKeep.clear();
          this.asClient.ended = why(e);
        }
      }
    } finally {
      clearTimeout(patience);
    }
  }
}
