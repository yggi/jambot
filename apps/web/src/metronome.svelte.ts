/**
 * The metronome: the band's own steps, clicked. It has no clock, no audio
 * context and no ticker of its own: the player, on each tick, hands it the
 * steps the transport laid (`lay`), and it reads them into clicks on the
 * song's meter, through the swing (`clicksOf`) and plays them on the
 * player's output. So it clicks while the band plays, on its beats, and
 * rests while it is stopped: there is one clock. It is client-only: the
 * click sounds on this device's synth and never goes to MIDI out or a
 * session, and a client clicks its host's steps on its own output.
 *
 * Its volume is saved to `localStorage`, as `MidiSettings` does; whether it
 * is on is not, since a reload should never surprise the ear.
 */

import { SONG_METER, type ScheduledStep, clicksOf } from '@jambot/engine';
import type { Weight } from '@jambot/theory';
import type { Output } from './audio/output.ts';
import { Heard } from './heard.ts';

const STORAGE_KEY = 'jambot-metronome-v1';

interface StoredPrefs {
  readonly volume: number;
}

const DEFAULTS: StoredPrefs = { volume: 0.7 };

function load(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const { volume } = JSON.parse(raw) as Partial<StoredPrefs>;
    return { volume: typeof volume === 'number' ? volume : DEFAULTS.volume };
  } catch {
    return DEFAULTS;
  }
}

export class Metronome {
  on = $state(false);
  #volume = $state(load().volume);
  /** The pulse heard now, from 0, or null while off, stopped or before anything is heard. */
  pulse: number | null = $state(null);
  /** Whether the pulse heard now is the bar's downbeat. */
  downbeat = $state(false);

  #heard = new Heard<{ pulse: number; downbeat: boolean }>();

  get volume(): number {
    return this.#volume;
  }
  set volume(value: number) {
    this.#volume = value;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: value } satisfies StoredPrefs));
    } catch {
      // Storage can be unavailable (private browsing, quota); it just won't persist.
    }
  }

  /** Pulses in the song's bar: what the pulse counter counts to. */
  get pulses(): number {
    return SONG_METER.heights.length;
  }

  /**
   * Click the steps just laid, at `seconds - skew` on the output's clock,
   * except any that clock has already passed. The player calls this every
   * tick, so it does nothing while off.
   */
  lay(output: Output, steps: readonly ScheduledStep[], skew: number) {
    if (!this.on || !output.click) return;
    const now = output.currentTime;
    for (const click of clicksOf(steps)) {
      const seconds = click.seconds - skew;
      if (seconds < now) continue;
      output.click(click.weight, seconds, this.#volume);
      this.#heard.push(seconds, {
        pulse: click.pulse,
        downbeat: click.weight === 'downbeat',
      });
    }
    this.#heard.drop(now - 1);
  }

  /**
   * Click the count-in before a song, at each of its clicks' seconds on the
   * output's clock: on whether the click is or not, since a count-in that
   * isn't heard is no count-in. It is the same click, at the same volume.
   */
  countIn(output: Output, clicks: readonly { seconds: number; weight: Weight; beat: number }[]) {
    if (!output.click) return;
    for (const { seconds, weight, beat } of clicks) {
      output.click(weight, seconds, this.#volume);
      this.#heard.push(seconds, { pulse: beat, downbeat: weight === 'downbeat' });
    }
  }

  /** Show the pulse heard by `seconds` on the output's clock. */
  follow(seconds: number) {
    const latest = this.#heard.take(seconds);
    if (latest === undefined) return;
    this.pulse = latest.pulse;
    this.downbeat = latest.downbeat;
  }

  /** The band stopped: nothing is heard. It stays on, for the next song. */
  rest() {
    this.#heard.clear();
    this.pulse = null;
    this.downbeat = false;
  }
}
