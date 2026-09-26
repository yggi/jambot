/**
 * The player: the band on this device's clock.
 *
 * It runs the transport on the audio clock, a tick every 25 ms, and plays
 * the events it schedules on an output, the built-in synth by default. What
 * is on screen follows what is heard: scheduled steps wait until the audio
 * clock reaches them, and those older than a second, which can no longer be
 * shown, are dropped on every tick, so a hidden tab builds up no backlog.
 * The style track and the key wished for live here, and intents go through
 * the conductor.
 *
 * The player also keeps the bars decided ahead (`forecast`), from the one
 * heard on, and shows everything through one snapshot, `hud` (`hudOf`).
 * The forecast is renewed once a bar and whenever a control moves, so it
 * is what will play. The seed of the next song is drawn while the band is
 * stopped, so even the bar it opens on is shown truly before the start.
 *
 * Starting waits for the audio clock, which a browser starts only after a
 * gesture. While it waits the player is starting: another start does
 * nothing, and a stop cancels it.
 */

import {
  type ForecastBar,
  INITIAL_STYLE,
  type KeyWish,
  LOOKAHEAD,
  PRESETS,
  type StyleTrack,
  type TransportCarried,
  type TransportEnv,
  forecast,
  holding,
  transport,
} from '@jambot/engine';
import { type Output, webAudioOutput } from './audio/output.ts';
import { type Intent, conduct, stopAt, wishAfter } from './conductor.ts';
import { Heard } from './heard.ts';
import { type Hud, hudOf } from './hud.ts';
import { startTicker } from './ticker.ts';

/** How many bars ahead the player keeps decided. */
export const FORECAST_BARS = 32;

export type Status = 'stopped' | 'starting' | 'playing';

/** What the player runs on; a test can stand in for each. */
export interface Surroundings {
  output(): Output;
  ticker(tick: () => void): () => void;
  frame(follow: () => void): () => void;
  /** A seed for the next song. */
  seed(): number;
}

const browser: Surroundings = {
  output: webAudioOutput,
  ticker: startTicker,
  frame(follow) {
    let id = requestAnimationFrame(function loop() {
      follow();
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  },
  seed: () => Math.floor(Math.random() * 2 ** 32),
};

export class Player {
  status: Status = $state('stopped');
  track: StyleTrack = $state.raw(holding(INITIAL_STYLE));
  wish: KeyWish = $state.raw({ tonic: null, mode: PRESETS[0]!.mode });
  /** The step heard, or null before anything is. */
  heard: number | null = $state(null);

  #surroundings: Surroundings;
  #output: Output | null = null;
  #carried: TransportCarried | null = null;
  #seed = 0;
  #start = 0;
  #stopTicker: (() => void) | null = null;
  #stopFrames: (() => void) | null = null;
  #heard = new Heard<number>();
  /** The bars decided, from the one heard on. */
  #bars: readonly ForecastBar[] = $state.raw([]);
  /** The bar the transport composes next, when the bars were last decided. */
  #decidedAt = -1;

  /** What the screen shows. */
  readonly hud: Hud = $derived(hudOf({ heard: this.heard, bars: this.#bars, track: this.track }));

  constructor(surroundings: Surroundings = browser) {
    this.#surroundings = surroundings;
    this.#seed = surroundings.seed();
    this.#decide();
  }

  /** Whether the band is playing or about to: the start button reads Stop. */
  get playing(): boolean {
    return this.status !== 'stopped';
  }

  /** How many scheduled positions wait to be heard. */
  get backlog(): number {
    return this.#heard.size;
  }

  apply(intent: Intent) {
    const at = this.status === 'playing' ? (this.#carried?.head.step ?? 0) : null;
    this.track = conduct(this.track, intent, at);
    this.wish = wishAfter(this.wish, intent);
    this.#decide();
  }

  async start() {
    if (this.status !== 'stopped') return;
    this.status = 'starting';
    const output = (this.#output ??= this.#surroundings.output());
    await output.resume();
    if (this.status !== 'starting') return;
    this.status = 'playing';
    this.#start = output.currentTime + 0.1;
    this.#carried = null;
    this.#heard.clear();
    this.#decide();
    this.#tick();
    this.#stopTicker = this.#surroundings.ticker(() => this.#tick());
    this.#stopFrames = this.#surroundings.frame(() => this.#follow());
  }

  stop() {
    if (this.status === 'stopped') return;
    const wasPlaying = this.status === 'playing';
    this.status = 'stopped';
    if (!wasPlaying) return;
    this.#stopTicker?.();
    this.#stopFrames?.();
    this.#stopTicker = this.#stopFrames = null;
    this.track = stopAt(this.track);
    this.heard = null;
    this.#seed = this.#surroundings.seed();
    this.#decide();
    this.#output?.silence();
  }

  get #env(): TransportEnv {
    return { seed: this.#seed, start: this.#start, track: this.track, wish: this.wish };
  }

  /**
   * Decide the bars ahead again: from the transport while it plays, and from
   * the song's start while it doesn't. The bar before the first composed
   * one is kept, as it may still be heard.
   */
  #decide() {
    const carried = this.status === 'playing' ? this.#carried : null;
    const fresh = forecast(this.#env, carried, FORECAST_BARS);
    const first = fresh[0]?.bar ?? 0;
    const kept = carried ? this.#bars.filter((b) => b.bar === first - 1) : [];
    this.#bars = [...kept, ...fresh];
    this.#decidedAt = carried?.nextBar ?? -1;
  }

  #tick() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    const now = output.currentTime;
    const { carried, output: scheduled } = transport.advance(this.#env, this.#carried, {
      now,
      until: now + LOOKAHEAD,
    });
    this.#carried = carried;
    for (const { event, seconds, duration, sound } of scheduled.events)
      output.play(event.part, event.note, event.velocity, seconds, duration, sound);
    for (const { step, seconds } of scheduled.steps) this.#heard.push(seconds, step);
    this.#heard.drop(now - 1);
    if (carried?.nextBar !== this.#decidedAt) this.#decide();
  }

  #follow() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    const latest = this.#heard.take(output.currentTime - output.latency);
    if (latest !== undefined) this.heard = latest;
  }
}
