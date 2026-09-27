/**
 * The metronome: a click track of its own, next to the band rather than
 * part of it. Client-only, so it never touches MIDI out or a session: every
 * device runs its own, on its own audio context, at whatever tempo it is
 * given. It reads the tempo live, the way `bandOutput` reads its settings,
 * so it follows a tempo change or glide without watching the style track
 * itself; its meter is its own, since the transport's bar is always 16
 * steps in 4/4 (`transport.ts`) and 3/4, 6/8 and 12/8 need a bar the
 * transport doesn't have.
 *
 * Volume and meter are saved to `localStorage`, as `MidiSettings` does;
 * whether it is on is not, since a browser starts audio only after a
 * gesture and a reload should never autoplay a click.
 */

import { LOOKAHEAD, type MetronomeCarried, type MetronomeEnv, metronome } from '@jambot/engine';
import { METERS, type MeterName } from '@jambot/theory';
import { type ClickOutput, webAudioClick } from './audio/metronome-click.ts';
import { Heard } from './heard.ts';
import { startTicker } from './ticker.ts';

const STORAGE_KEY = 'jambot-metronome-v1';

interface StoredPrefs {
  readonly volume: number;
  readonly meter: MeterName;
}

const DEFAULTS: StoredPrefs = { volume: 0.7, meter: '4/4' };

function load(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<StoredPrefs>) };
  } catch {
    return DEFAULTS;
  }
}

/** What the metronome runs on; a test can stand in for each. */
export interface MetronomeSurroundings {
  output(): ClickOutput;
  ticker(tick: () => void): () => void;
  frame(follow: () => void): () => void;
}

/** The real browser's ticker and frame, with its own audio context. */
export function browserMetronomeSurroundings(): MetronomeSurroundings {
  return {
    output: webAudioClick,
    ticker: startTicker,
    frame(follow) {
      let id = requestAnimationFrame(function loop() {
        follow();
        id = requestAnimationFrame(loop);
      });
      return () => cancelAnimationFrame(id);
    },
  };
}

const browser: MetronomeSurroundings = browserMetronomeSurroundings();

export class Metronome {
  on = $state(false);
  #volume = $state(DEFAULTS.volume);
  #meter: MeterName = $state(DEFAULTS.meter);
  /** The pulse heard now, from 0, or null while off or before anything is heard. */
  pulse: number | null = $state(null);
  /** Whether the pulse heard now is the bar's downbeat. */
  downbeat = $state(false);

  #pulsesPerMinute: () => number;
  #surroundings: MetronomeSurroundings;
  #output: ClickOutput | null = null;
  #carried: MetronomeCarried | null = null;
  #start = 0;
  #stopTicker: (() => void) | null = null;
  #stopFrames: (() => void) | null = null;
  #heard = new Heard<{ pulse: number; downbeat: boolean }>();

  constructor(pulsesPerMinute: () => number, surroundings: MetronomeSurroundings = browser) {
    this.#pulsesPerMinute = pulsesPerMinute;
    this.#surroundings = surroundings;
    const stored = load();
    this.#volume = stored.volume;
    this.#meter = stored.meter;
  }

  get volume(): number {
    return this.#volume;
  }
  set volume(value: number) {
    this.#volume = value;
    this.#save();
  }

  get meter(): MeterName {
    return this.#meter;
  }
  set meter(value: MeterName) {
    this.#meter = value;
    this.#carried = null; // a new meter starts fresh, from its own downbeat.
    this.pulse = null;
    this.downbeat = false;
    this.#save();
  }

  /** Pulses in the current meter's bar: what the steps-in-bar counter counts to. */
  get pulses(): number {
    return METERS[this.#meter].heights.length;
  }

  async start() {
    if (this.on) return;
    const output = (this.#output ??= this.#surroundings.output());
    await output.resume();
    if (this.on) return; // stopped while resuming
    this.on = true;
    this.#carried = null;
    this.#heard.clear();
    this.pulse = null;
    this.downbeat = false;
    this.#stopTicker = this.#surroundings.ticker(() => this.#tick());
    this.#stopFrames = this.#surroundings.frame(() => this.#followHeard());
  }

  stop() {
    if (!this.on) return;
    this.on = false;
    this.#stopTicker?.();
    this.#stopFrames?.();
    this.#stopTicker = this.#stopFrames = null;
    this.pulse = null;
    this.downbeat = false;
  }

  #tick() {
    const output = this.#output;
    if (!this.on || !output) return;
    const now = output.currentTime;
    if (this.#carried === null) this.#start = now + 0.05;
    const env: MetronomeEnv = {
      start: this.#start,
      pulsesPerMinute: this.#pulsesPerMinute(),
      meter: METERS[this.#meter],
    };
    const { carried, output: scheduled } = metronome.advance(env, this.#carried, {
      now,
      until: now + LOOKAHEAD,
    });
    this.#carried = carried;
    for (const click of scheduled.clicks) {
      output.click.play(click.weight, click.seconds, this.#volume);
      this.#heard.push(click.seconds, {
        pulse: click.pulse,
        downbeat: click.weight === 'downbeat',
      });
    }
    this.#heard.drop(now - 1);
  }

  #followHeard() {
    const output = this.#output;
    if (!this.on || !output) return;
    const latest = this.#heard.take(output.currentTime - output.latency);
    if (latest !== undefined) {
      this.pulse = latest.pulse;
      this.downbeat = latest.downbeat;
    }
  }

  #save() {
    const stored: StoredPrefs = { volume: this.#volume, meter: this.#meter };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage can be unavailable (private browsing, quota); it just won't persist.
    }
  }
}
