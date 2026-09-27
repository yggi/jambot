/**
 * A host's session: the player hosting, and the clients who joined it.
 *
 * It opens the session in a lobby, admits a client of the same protocol
 * with a name, and welcomes it with where the song stands: the song, the
 * bars composed and not yet played, the bars ahead and the Muse. From then
 * on it tells every client what the player does (`Hosting`), answers each
 * ping with the moment its output is heard, and passes what clients judged
 * to the player's Muse. A client silent for `SILENT` seconds is gone.
 */

import type { ForecastBar } from '@jambot/engine';
import {
  type ClientMessage,
  type HostMessage,
  type MuseState,
  PROTOCOL,
  forecastDelta,
  refusal,
  HOST_PLAYER,
  playerSource,
} from '@jambot/session';
import type { Hosting, Player } from '../player.svelte.ts';
import type { HostLink, Lobby } from './lobby.ts';

/** How long, in seconds, a client may be silent before it is taken to have gone. */
export const SILENT = 3;

export interface Guest {
  readonly id: string;
  readonly name: string;
}

export class HostSession {
  /** The session's name, while it is open. */
  session: string | null = $state(null);
  guests: readonly Guest[] = $state.raw([]);

  #player: Player;
  #heardNow: () => number | null;
  #wallNow: () => number;
  #link: HostLink | null = null;
  /** When each client was last heard, by its id. */
  #lastHeard: Record<string, number> = {};
  #forecast: readonly ForecastBar[] = [];
  #muse: MuseState = { offer: null, log: [], dropped: [], players: {} };
  #sweep: ReturnType<typeof setInterval> | null = null;

  /**
   * `heardNow` is the moment the output is heard now, on its clock, which
   * clients set their clocks by; `wallNow`, in seconds, times their silence.
   */
  constructor(
    player: Player,
    heardNow: () => number | null,
    wallNow: () => number = () => performance.now() / 1000,
  ) {
    this.#player = player;
    this.#heardNow = heardNow;
    this.#wallNow = wallNow;
  }

  /**
   * Open the session under a name, the host's own notes going by its
   * player's name, or by "the host" without one. Throws if the lobby
   * refuses it.
   */
  async open(lobby: Lobby, session: string, player = '') {
    await this.#player.prepare();
    this.#link = await lobby.host(session, (message, from) => this.#hear(message, from));
    this.session = session.trim();
    this.#player.mode = 'host';
    this.#player.playerId = HOST_PLAYER;
    this.#player.players = {};
    this.#forecast = this.#player.ahead;
    this.#muse = {
      offer: this.#player.offer,
      log: this.#player.museLog,
      dropped: this.#player.dropped,
      players: {},
    };
    this.#name(HOST_PLAYER, player.trim() || 'the host');
    this.#player.hosting = this.#hosting();
    this.#sweep = setInterval(() => this.#dropSilent(), 1000);
  }

  close() {
    this.#link?.send({ kind: 'closed' });
    this.#link?.close();
    this.#link = null;
    if (this.#sweep) clearInterval(this.#sweep);
    this.#sweep = null;
    this.#player.hosting = null;
    this.#player.playerId = null;
    this.#player.players = {};
    this.#player.mode = 'solo';
    this.session = null;
    this.guests = [];
    this.#lastHeard = {};
  }

  #send(message: HostMessage, to?: string) {
    this.#link?.send(message, to);
  }

  #hosting(): Hosting {
    return {
      started: (song) => this.#send({ kind: 'start', song }),
      stopped: () => this.#send({ kind: 'stop' }),
      composed: (bars) => {
        for (const sent of bars) this.#send({ kind: 'bar', sent });
      },
      decided: (bars) => {
        this.#send({ kind: 'forecast', forecast: forecastDelta(this.#forecast, bars) });
        this.#forecast = bars;
      },
      track: (track) => this.#send({ kind: 'track', track }),
      muse: (muse) => {
        this.#muse = muse;
        this.#send({ kind: 'muse', muse });
      },
    };
  }

  #hear(message: ClientMessage, from: string) {
    const guest = this.guests.find((g) => g.id === from);
    if (message.kind === 'join') return this.#admit(message, from);
    if (!guest) return;
    this.#lastHeard[from] = this.#wallNow();
    switch (message.kind) {
      case 'ping': {
        // Unanswered until the output's clock can say what it is hearing.
        const host = this.#heardNow();
        if (host !== null) this.#send({ kind: 'pong', sent: message.sent, host }, from);
        return;
      }
      case 'judged': {
        // A client's source goes by the id of its link, which it can't choose.
        const judgement = {
          ...message.judgement,
          source: playerSource(from, message.judgement.source),
        };
        this.#player.judgedElsewhere([{ bar: message.bar, judgement }]);
        return;
      }
      case 'forget':
        return this.#player.forgetMotif();
      case 'leave':
        return this.#drop(from);
    }
  }

  #admit(join: ClientMessage & { kind: 'join' }, from: string) {
    const others = this.guests.filter((g) => g.id !== from);
    const inUse = [this.#player.players[HOST_PLAYER] ?? '', ...others.map((g) => g.name)];
    const refused = refusal(join, inUse);
    if (refused) return this.#send({ kind: 'refused', reason: refused }, from);
    const name = join.name.trim();
    this.guests = [...others, { id: from, name }];
    this.#name(from, name, false);
    this.#lastHeard[from] = this.#wallNow();
    this.#send(
      {
        kind: 'welcome',
        protocol: PROTOCOL,
        session: this.session ?? '',
        song: this.#player.hosted
          ? { ...this.#player.hosted.song, bars: this.#player.hosted.bars }
          : null,
        forecast: forecastDelta([], this.#forecast),
        muse: this.#muse,
      },
      from,
    );
    // Everyone else learns the new player's name.
    this.#send({ kind: 'muse', muse: this.#muse });
  }

  /**
   * Name a player: its sources read by this name on the host and every
   * client, kept after it leaves, so the log still says who played.
   */
  #name(id: string, name: string, tell = true) {
    this.#player.players = { ...this.#player.players, [id]: name };
    this.#muse = { ...this.#muse, players: this.#player.players };
    if (tell) this.#send({ kind: 'muse', muse: this.#muse });
  }

  #drop(id: string) {
    this.guests = this.guests.filter((g) => g.id !== id);
    delete this.#lastHeard[id];
  }

  #dropSilent() {
    const now = this.#wallNow();
    for (const [id, heard] of Object.entries(this.#lastHeard))
      if (now - heard > SILENT) this.#drop(id);
  }
}
