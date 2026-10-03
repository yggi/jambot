/**
 * A client's session: the player following a host.
 *
 * It joins a session by name and pings the host from the start. The pings
 * set the player's clock by the host's: the network's offset between the
 * page clocks (`hostClock`), plus the host's output's offset from its page
 * clock, less this output's (`skewOf`), so a note sounds here as it
 * sounds at the host, whatever each output's latency. A song waits until the clock is trusted, then plays from the bars
 * the host sent. Everything else the host says goes to the player as it
 * comes: bars, the style, the bars ahead and the Muse. What the player's
 * ear judged goes to the host, its sources named by this player's name.
 *
 * It leaves when asked, when the host closes or refuses it, when the host
 * is too far away for playing together (`CLOCK.tooFar`), and when no
 * welcome comes within `WELCOME_WAIT`.
 *
 * A link that drops is no leaving. The player keeps playing what it has,
 * and the client joins again with the token its welcome gave, so the host
 * seats it as the same player (`roster.ts`), trying as `reconnect.ts` says.
 * A page that wakes from the background (`wake`) joins again at once if its
 * link has said nothing since it slept. A host that is away, its link
 * dropped while the lobby holds its session, is waited for; when it is back
 * the client joins again over the same link. What it needs to come back
 * after the app was closed is kept as it changes (`ClientKeep`).
 */

import type { ForecastBar } from '@jambot/engine';
import {
  type ClientMessage,
  type HostMessage,
  PROTOCOL,
  type SentBar,
  type Song,
  applyForecast,
  type ClientResume,
  type ClockReading,
  EMPTY_SPREAD,
  type Outage,
  type Spread,
  failed,
  hostClock,
  outage,
  retry,
  skewOf,
  spreadWith,
  stale,
  woken,
} from '@jambot/session';
import type { Player } from '../player.svelte.ts';
import type { DeviceClocks } from './clocks.ts';
import type { ClientLink, Lobby } from './lobby.ts';

/** How long, in milliseconds, a client waits for a host to welcome it. */
export const WELCOME_WAIT = 2000;

/** How often, in milliseconds, a client pings: quickly until its clock is trusted, then steadily. */
export const PING_EVERY = { settling: 50, steady: 250 } as const;

/** How long, in seconds, a joined client's link may say nothing before it is taken for lost. */
export const HOST_SILENT = 3;

export type ClientStatus = 'idle' | 'joining' | 'joined' | 'reconnecting';

/** Where a client keeps what it needs to come back after its app was closed. */
export interface ClientKeep {
  save(resume: ClientResume): void;
  clear(): void;
}

export interface ClientOptions {
  /** The time, in seconds, that outages and silences are measured by: the page's, which never jumps. */
  readonly wallNow?: () => number;
  /** The time, in seconds since the epoch, that a kept record is dated by. */
  readonly epoch?: () => number;
  readonly keep?: ClientKeep;
}

/** A client's counters of its clock set by the host's (#27). */
export interface NetworkTiming {
  /** Every ping's round trip, in milliseconds. */
  readonly trips: Spread;
  /** The clock as read now: its best round trip, the jumps it followed. */
  readonly reading: ClockReading | null;
  /** The host's heard moment less this output's, in seconds, once every clock is trusted. */
  readonly skew: number | null;
}

export class ClientSession {
  status: ClientStatus = $state('idle');
  /** The session joined, and this player's name in it. */
  session: string | null = $state(null);
  name: string | null = $state(null);
  /** Whether the host is playing a song. */
  hostPlaying = $state(false);
  /** The shortest round trip to the host lately, in milliseconds, once measured. */
  trip: number | null = $state(null);
  /** Why the session ended, if it ended on its own. */
  ended: string | null = $state(null);
  /** Whether the host's link dropped and the lobby holds the session for it to come back. */
  hostAway = $state(false);

  #player: Player;
  #clocks: DeviceClocks;
  #link: ClientLink | null = null;
  #clock = hostClock.initial;
  #reading: ClockReading | null = null;
  #trips: Spread = EMPTY_SPREAD;
  #pinging: ReturnType<typeof setTimeout> | null = null;
  #welcomeWait: ReturnType<typeof setTimeout> | null = null;
  #held: ForecastBar[] = [];
  /** A song the host plays, waiting for the clock to be trusted. */
  #pending: { song: Song; bars: SentBar[] } | null = null;
  #lobby: Lobby | null = null;
  /** The address of the lobby, to keep with the token. */
  #lobbyUrl: string | null = null;
  /** What the host's welcome gave to come back as the same player. */
  #token: string | null = null;
  #outage: Outage | null = null;
  #retrying: ReturnType<typeof setTimeout> | null = null;
  /** Counts the links made, so a late word from a dropped one is ignored. */
  #generation = 0;
  /** Counts the joins begun, so one that was left meanwhile does not go on. */
  #joins = 0;
  /** When the host was last heard from, by `#wallNow`. */
  #lastHeard: number | null = null;
  #wallNow: () => number;
  #epoch: () => number;
  #keep: ClientKeep | null;

  constructor(
    player: Player,
    clocks: DeviceClocks,
    {
      wallNow = () => performance.now() / 1000,
      epoch = () => Date.now() / 1000,
      keep,
    }: ClientOptions = {},
  ) {
    this.#player = player;
    this.#clocks = clocks;
    this.#wallNow = wallNow;
    this.#epoch = epoch;
    this.#keep = keep ?? null;
  }

  /** The counters of this session's clock, while joined or joining. */
  get timing(): NetworkTiming | null {
    if (this.status === 'idle') return null;
    return { trips: this.#trips, reading: this.#reading, skew: this.#skew() };
  }

  /**
   * Join a session by name. Given the token of a session this client was in
   * (`resume`), and the lobby's address to keep with it, it comes back as the
   * same player.
   */
  async join(
    lobby: Lobby,
    session: string,
    name: string,
    { resume, lobbyUrl }: { resume?: string; lobbyUrl?: string } = {},
  ) {
    this.leave();
    const attempt = ++this.#joins;
    this.ended = null;
    this.status = 'joining';
    this.session = session.trim();
    this.name = name.trim();
    this.#lobby = lobby;
    this.#lobbyUrl = lobbyUrl ?? null;
    this.#token = resume ?? null;
    await this.#player.prepareWithin();
    // Left, or joined again, while the output was awaited.
    if (attempt !== this.#joins || this.status !== 'joining') return;
    this.#player.follow({
      judged: (judged) => {
        for (const { bar, judgement } of judged) this.#send({ kind: 'judged', bar, judgement });
      },
      forget: () => this.#send({ kind: 'forget' }),
      skew: () => this.#skew(),
    });
    try {
      await this.#connect(lobby);
    } catch (e) {
      if (attempt !== this.#joins || this.status !== 'joining') return;
      return this.#end(e instanceof Error ? e.message : String(e));
    }
    if (attempt !== this.#joins || this.status !== 'joining') return;
    this.#welcomeWait = setTimeout(
      () => this.#end(`No session named “${this.session}” answered.`),
      WELCOME_WAIT,
    );
    this.#sendJoin();
  }

  /** Open a link to the session, one whose words this client hears while it is the latest. */
  async #connect(lobby: Lobby) {
    const generation = ++this.#generation;
    const link = await lobby.join(
      this.session ?? '',
      (message) => {
        if (generation === this.#generation) this.#hear(message);
      },
      (why) => {
        if (generation === this.#generation) this.#dropped(why);
      },
    );
    if (generation !== this.#generation) return void link.close();
    this.#link = link;
  }

  #sendJoin() {
    this.#send({
      kind: 'join',
      protocol: PROTOCOL,
      name: this.name ?? '',
      ...(this.#token === null ? {} : { resume: this.#token }),
    });
  }

  leave() {
    if (this.status === 'idle') return;
    this.#send({ kind: 'leave' });
    this.#end(null);
  }

  /**
   * The page woke from the background, or came back to the foreground:
   * where it was trying again, it tries now, and where it was joined and its
   * link has said nothing since it slept, it takes the link for dead and
   * joins again.
   */
  wake() {
    if (this.status === 'reconnecting') {
      this.#outage = woken(this.#wallNow());
      return this.#tryNow();
    }
    if (this.status === 'joined' && !this.hostAway && stale(this.#lastHeard, this.#wallNow()))
      this.#dropped('The link went quiet.');
  }

  /**
   * The link is gone without the host saying so. A client that was seated
   * keeps playing what it has and tries to come back; one that never was
   * ends.
   */
  #dropped(why: string) {
    if (this.status !== 'joined' || this.#token === null || !this.#lobby) return this.#end(why);
    this.#generation++;
    this.#link?.close();
    this.#link = null;
    if (this.#pinging) clearTimeout(this.#pinging);
    this.#pinging = null;
    this.status = 'reconnecting';
    this.hostAway = false;
    this.#outage = outage(this.#wallNow());
    this.#schedule();
  }

  #schedule() {
    if (this.#retrying) clearTimeout(this.#retrying);
    this.#retrying = null;
    if (!this.#outage) return;
    const next = retry(this.#outage, this.#wallNow());
    if (next.kind === 'give-up') return this.#end(`Lost the connection to ${this.session}.`);
    this.#retrying = setTimeout(() => void this.#attempt(), next.seconds * 1000);
  }

  #tryNow() {
    if (this.#retrying) clearTimeout(this.#retrying);
    this.#retrying = null;
    void this.#attempt();
  }

  async #attempt() {
    this.#retrying = null;
    const lobby = this.#lobby;
    if (this.status !== 'reconnecting' || !lobby) return;
    try {
      await this.#connect(lobby);
    } catch {
      return this.#failed();
    }
    if (this.status !== 'reconnecting') return;
    this.#welcomeWait = setTimeout(() => this.#failed(), WELCOME_WAIT);
    this.#sendJoin();
  }

  /** A try that ended without a welcome: the link is dropped, and the next try is waited for. */
  #failed() {
    if (this.status !== 'reconnecting' || !this.#outage) return;
    this.#generation++;
    this.#link?.close();
    this.#link = null;
    if (this.#welcomeWait) clearTimeout(this.#welcomeWait);
    this.#welcomeWait = null;
    this.#outage = failed(this.#outage);
    this.#schedule();
  }

  #end(why: string | null) {
    this.#generation++;
    this.#link?.close();
    this.#link = null;
    if (this.#pinging) clearTimeout(this.#pinging);
    if (this.#welcomeWait) clearTimeout(this.#welcomeWait);
    if (this.#retrying) clearTimeout(this.#retrying);
    this.#pinging = this.#welcomeWait = this.#retrying = null;
    this.#outage = null;
    this.#lobby = null;
    this.#token = null;
    this.#keep?.clear();
    this.#reset();
    this.#player.unfollow();
    this.status = 'idle';
    this.hostPlaying = false;
    this.hostAway = false;
    this.trip = null;
    this.ended = why;
  }

  /** The clock and what waits for it start over. */
  #reset() {
    this.#clock = hostClock.initial;
    this.#reading = null;
    this.#trips = EMPTY_SPREAD;
    this.#pending = null;
    this.#held = [];
    this.#lastHeard = null;
  }

  #send(message: ClientMessage) {
    this.#link?.send(message);
  }

  #ping() {
    if (
      !this.hostAway &&
      this.#lastHeard !== null &&
      this.#wallNow() - this.#lastHeard > HOST_SILENT
    )
      return this.#dropped('The host went quiet.');
    this.#send({ kind: 'ping', sent: this.#clocks.page() });
    const every = this.#skew() === null ? PING_EVERY.settling : PING_EVERY.steady;
    this.#pinging = setTimeout(() => this.#ping(), every);
  }

  #hear(message: HostMessage) {
    switch (message.kind) {
      case 'welcome':
        if (this.#welcomeWait) clearTimeout(this.#welcomeWait);
        this.#welcomeWait = null;
        if (this.#retrying) clearTimeout(this.#retrying);
        this.#retrying = null;
        this.#outage = null;
        // The host's page clock may be another (it reloaded): read it afresh.
        this.#reset();
        this.#lastHeard = this.#wallNow();
        this.status = 'joined';
        this.hostAway = false;
        this.#token = message.resume;
        this.#remember();
        this.#forecast(message.forecast);
        this.#player.followMuse(message.muse);
        if (message.song) this.#play(message.song, message.song.bars);
        else if (this.hostPlaying) this.#stopped();
        if (this.#pinging) clearTimeout(this.#pinging);
        this.#ping();
        return;
      case 'refused':
        return this.#end(message.reason);
      case 'closed':
        return this.#end('The host closed the session.');
      case 'pong':
        return this.#pong(message.sent, message.host, message.heard);
      case 'start':
        return this.#play(message.song, []);
      case 'bar':
        if (this.#pending) this.#pending.bars.push(message.sent);
        else this.#player.followBar(message.sent);
        return;
      case 'track':
        return this.#player.followTrack(message.track);
      case 'forecast':
        return this.#forecast(message.forecast);
      case 'muse':
        return this.#player.followMuse(message.muse);
      case 'finale':
        return this.#player.followEnds(message.bar);
      case 'stop':
        return this.#stopped();
      case 'away':
        this.hostAway = true;
        return;
      case 'back':
        this.hostAway = false;
        if (this.status === 'joined') this.#sendJoin();
        return;
    }
  }

  #stopped() {
    this.hostPlaying = false;
    this.#pending = null;
    this.#player.halt();
  }

  #remember() {
    if (!this.#keep || this.#lobbyUrl === null || this.#token === null) return;
    this.#keep.save({
      version: 1,
      savedAt: this.#epoch(),
      session: this.session ?? '',
      name: this.name ?? '',
      token: this.#token,
      lobby: this.#lobbyUrl,
    });
  }

  #forecast(delta: Parameters<typeof applyForecast>[1]) {
    this.#held = applyForecast(this.#held, delta);
    this.#player.followForecast(this.#held);
  }

  #play(song: Song, bars: readonly SentBar[]) {
    this.hostPlaying = true;
    this.#pending = { song, bars: [...bars] };
    this.#startWhenReady();
  }

  #startWhenReady() {
    const pending = this.#pending;
    const skew = this.#skew();
    if (!pending || skew === null) return;
    this.#pending = null;
    this.#player.skew = skew;
    void this.#player.followSong(pending.song, pending.bars);
  }

  /** The host's heard moment less this output's, once every clock is trusted. */
  #skew(): number | null {
    return this.#reading && skewOf(this.#reading, this.#clocks.heardOffset());
  }

  #pong(sent: number, host: number, heard: number | null) {
    this.#lastHeard = this.#wallNow();
    const received = this.#clocks.page();
    const { carried, output } = hostClock.advance(null, this.#clock, {
      sent,
      received,
      host,
      heard,
    });
    this.#clock = carried;
    this.#reading = output;
    this.#trips = spreadWith(this.#trips, (received - sent) * 1000);
    if (output.trip !== null) this.trip = Math.round(output.trip * 1000);
    if (output.tooFar)
      return this.#end(
        `The host is ${this.trip} ms away and back: too far to play together. Jambot is played in one room.`,
      );
    this.#startWhenReady();
  }
}
