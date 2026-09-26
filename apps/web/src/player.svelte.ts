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
 * Starting waits for the audio clock, which a browser starts only after a
 * gesture. While it waits the player is starting: another start does
 * nothing, and a stop cancels it.
 */

import {
  INITIAL_STYLE,
  type Key,
  type KeyWish,
  LOOKAHEAD,
  PRESETS,
  type SectionType,
  type StyleTrack,
  type TransportCarried,
  chordName,
  holding,
  transport,
} from '@jambot/engine';
import { type Output, webAudioOutput } from './audio/output.ts';
import { type Intent, conduct, stopAt, wishAfter } from './conductor.ts';
import { Heard } from './heard.ts';
import { startTicker } from './ticker.ts';

/** Where the music is, as heard. */
export interface Position {
  readonly bar: number;
  readonly beat: number;
  readonly section: SectionType;
  readonly key: Key;
  /** The chord sounding, as a lead sheet names it. */
  readonly chord: string;
}

export type Status = 'stopped' | 'starting' | 'playing';

/** What the player runs on; a test can stand in for each. */
export interface Surroundings {
  output(): Output;
  ticker(tick: () => void): () => void;
  frame(follow: () => void): () => void;
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
};

export class Player {
  status: Status = $state('stopped');
  track: StyleTrack = $state.raw(holding(INITIAL_STYLE));
  wish: KeyWish = $state.raw({ tonic: null, mode: PRESETS[0]!.mode });
  position: Position | null = $state.raw(null);

  #surroundings: Surroundings;
  #output: Output | null = null;
  #carried: TransportCarried | null = null;
  #seed = 0;
  #start = 0;
  #stopTicker: (() => void) | null = null;
  #stopFrames: (() => void) | null = null;
  #heard = new Heard<Position>();

  constructor(surroundings: Surroundings = browser) {
    this.#surroundings = surroundings;
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
  }

  async start() {
    if (this.status !== 'stopped') return;
    this.status = 'starting';
    const output = (this.#output ??= this.#surroundings.output());
    await output.resume();
    if (this.status !== 'starting') return;
    this.status = 'playing';
    this.#seed = Math.floor(Math.random() * 2 ** 32);
    this.#start = output.currentTime + 0.1;
    this.#carried = null;
    this.#heard.clear();
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
    this.position = null;
    this.#output?.silence();
  }

  #tick() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    const now = output.currentTime;
    const { carried, output: scheduled } = transport.advance(
      { seed: this.#seed, start: this.#start, track: this.track, wish: this.wish },
      this.#carried,
      { now, until: now + LOOKAHEAD },
    );
    this.#carried = carried;
    for (const { event, seconds, duration, sound } of scheduled.events)
      output.play(event.part, event.note, event.velocity, seconds, duration, sound);
    for (const { step, section, key, chord, seconds } of scheduled.steps)
      this.#heard.push(seconds, {
        bar: Math.floor(step / 16),
        beat: Math.floor((step % 16) / 4),
        section: section.type,
        key,
        chord: chordName(chord, key),
      });
    this.#heard.drop(now - 1);
  }

  #follow() {
    const output = this.#output;
    if (this.status !== 'playing' || !output) return;
    const latest = this.#heard.take(output.currentTime - output.latency);
    if (latest) this.position = latest;
  }
}
