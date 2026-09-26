/**
 * The player: the band on this device's clock.
 *
 * It runs the transport on the audio clock, a tick every 25 ms, and plays
 * the events it schedules on the built-in drum kit. What is on screen
 * follows what is heard: steps wait in a queue until the audio clock
 * reaches them. The style track lives here, and intents go through the
 * conductor.
 */

import {
  INITIAL_STYLE,
  LOOKAHEAD,
  type SectionType,
  type StyleTrack,
  type TransportCarried,
  holding,
  transport,
} from '@jambot/engine';
import { type DrumKit, drumKit } from './audio/drums.ts';
import { type Intent, conduct, stopAt } from './conductor.ts';
import { startTicker } from './ticker.ts';

/** Where the music is, as heard. */
export interface Position {
  readonly bar: number;
  readonly beat: number;
  readonly section: SectionType;
}

interface Audio {
  readonly ctx: AudioContext;
  readonly out: AudioNode;
  bus: GainNode;
  kit: DrumKit;
}

export class Player {
  playing = $state(false);
  track: StyleTrack = $state.raw(holding(INITIAL_STYLE));
  position: Position | null = $state.raw(null);

  #audio: Audio | null = null;
  #carried: TransportCarried | null = null;
  #seed = 0;
  #start = 0;
  #stopTicker: (() => void) | null = null;
  #queue: { seconds: number; position: Position }[] = [];
  #frame = 0;

  apply(intent: Intent) {
    this.track = conduct(this.track, intent, this.playing ? (this.#carried?.head.step ?? 0) : null);
  }

  async start() {
    if (this.playing) return;
    const audio = this.#audio ?? this.#openAudio();
    await audio.ctx.resume();
    this.#seed = Math.floor(Math.random() * 2 ** 32);
    this.#start = audio.ctx.currentTime + 0.1;
    this.#carried = null;
    this.#queue = [];
    this.playing = true;
    this.#tick();
    this.#stopTicker = startTicker(() => this.#tick());
    this.#frame = requestAnimationFrame(() => this.#follow());
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    this.#stopTicker?.();
    cancelAnimationFrame(this.#frame);
    this.track = stopAt(this.track, this.#carried?.head.step ?? 0);
    this.position = null;
    const audio = this.#audio;
    if (audio) {
      // Fade out what is already scheduled, and play on from a fresh bus.
      const old = audio.bus;
      old.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.03);
      setTimeout(() => old.disconnect(), 400);
      audio.bus = this.#bus(audio.ctx, audio.out);
      audio.kit = drumKit(audio.ctx, audio.bus);
    }
  }

  #openAudio(): Audio {
    const ctx = new AudioContext();
    const out = ctx.createDynamicsCompressor();
    out.connect(ctx.destination);
    const bus = this.#bus(ctx, out);
    this.#audio = { ctx, out, bus, kit: drumKit(ctx, bus) };
    return this.#audio;
  }

  #bus(ctx: AudioContext, out: AudioNode): GainNode {
    const bus = ctx.createGain();
    bus.gain.value = 0.8;
    bus.connect(out);
    return bus;
  }

  #tick() {
    const audio = this.#audio;
    if (!this.playing || !audio) return;
    const now = audio.ctx.currentTime;
    const { carried, output } = transport.advance(
      { seed: this.#seed, start: this.#start, track: this.track },
      this.#carried,
      { now, until: now + LOOKAHEAD },
    );
    this.#carried = carried;
    for (const { event, seconds } of output.events)
      audio.kit.play(event.note, event.velocity, seconds);
    for (const { step, section, seconds } of output.steps)
      this.#queue.push({
        seconds,
        position: {
          bar: Math.floor(step / 16),
          beat: Math.floor((step % 16) / 4),
          section: section.type,
        },
      });
  }

  #follow() {
    const audio = this.#audio;
    if (!this.playing || !audio) return;
    const heard = audio.ctx.currentTime - (audio.ctx.outputLatency || audio.ctx.baseLatency || 0);
    let latest: Position | null = null;
    while (this.#queue.length && this.#queue[0]!.seconds <= heard)
      latest = this.#queue.shift()!.position;
    if (latest && latest !== this.position) this.position = latest;
    this.#frame = requestAnimationFrame(() => this.#follow());
  }
}
