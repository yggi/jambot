/**
 * The meter screen's player (#259): a bar of a meter, over and over, on this
 * device's own synth (never MIDI out), for hearing a meter, its swing and its
 * accents. Everything is scheduled ahead on the audio clock: a timer only
 * looks, every `TICK_MS`, whether the next bar starts within `LOOKAHEAD`
 * seconds and lays it if so, so nothing depends on the timer's own time. A
 * bar is laid with the settings as they are when it is laid, so a meter, a
 * tempo, a swing or a layer changed while it plays takes hold at the next
 * bar, and nothing jumps.
 *
 * Its tempo counts quarters, four steps each, in every meter: 6/8 and 3/4
 * at one tempo have one bar, so the hemiola regroups the same bar. Each
 * eighth heard is kept (`Heard`) until the moment heard reaches it, for the
 * bar's drawing to light.
 */

import { METERS, type MeterName } from '@jambot/theory';
import type { ClockOffset } from '../audio/clock-offset.ts';
import type { Output } from '../audio/output.ts';
import { STEPS_PER_EIGHTH } from '../bar.ts';
import { Heard } from '../heard.ts';
import { type Layer, barPlan } from './bar-plan.ts';
import { meterMap } from './ternary.ts';

/** How often, in milliseconds, the player looks for the next bar. */
export const TICK_MS = 25;

/** How far ahead, in seconds, a bar is laid. */
export const LOOKAHEAD = 0.25;

/** How long, in seconds, after a press the first bar begins. */
export const LEAD_SECONDS = 0.1;

export interface MeterDeps {
  /** The audio clock and its pairing with the page's, made on first use. */
  audio(): { base: Output; offset: ClockOffset };
}

/** The eighth heard, and the bar's meter it was of. */
export interface HeardEighth {
  readonly name: MeterName;
  /** From 0 in the bar. */
  readonly eighth: number;
}

export class MeterPlayer {
  #deps: MeterDeps;
  name: MeterName = $state('4/4');
  /** Quarters a minute. */
  bpm = $state(100);
  /** The swing, 0 to 1 (`swingMap`). */
  swing = $state(0);
  /** The swing of a pulse of three eighths, 0 to 1 (`ternaryMap`). */
  ternary = $state(0);
  /** How far the accent grades are spread, 0 to 1 (`gradeGain`). */
  grade = $state(1);
  layers: Record<Layer, boolean> = $state({ click: true, drums: false, bass: false });
  /** The bass takes the other meter's pulses, where there is one. */
  hemiola = $state(false);
  /** The click's level, 0 to 1. */
  volume = $state(0.7);
  playing = $state(false);
  /** The eighth heard now, or null before anything is heard. */
  heard: HeardEighth | null = $state.raw(null);

  #heard = new Heard<HeardEighth>();
  #next = 0;
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor(deps: MeterDeps) {
    this.#deps = deps;
  }

  /** Play, from the top of a bar. A press of the person's, since a browser plays audio only after one. */
  async start(): Promise<void> {
    if (this.playing) return;
    const { base } = this.#deps.audio();
    await base.resume();
    this.#next = base.currentTime + LEAD_SECONDS;
    this.playing = true;
    this.#lay();
    this.#timer = setInterval(() => this.#lay(), TICK_MS);
  }

  /** Stop: what is scheduled is silenced at once. */
  stop(): void {
    if (!this.playing) return;
    if (this.#timer !== null) clearInterval(this.#timer);
    this.#timer = null;
    this.#deps.audio().base.silence();
    this.#heard.clear();
    this.heard = null;
    this.playing = false;
  }

  /** Show the eighth heard now: the screen calls this as it draws. */
  follow(): void {
    if (!this.playing) return;
    const latest = this.#heard.take(this.#deps.audio().offset.heard());
    if (latest !== undefined) this.heard = latest;
  }

  /** Lay every bar that starts within the lookahead. */
  #lay(): void {
    const { base } = this.#deps.audio();
    while (this.#next < base.currentTime + LOOKAHEAD) this.#layBar(base);
    this.#heard.drop(base.currentTime - 1);
  }

  #layBar(base: Output): void {
    const { name, bpm, swing, ternary, grade, layers, hemiola, volume } = this;
    const meter = METERS[name];
    const stepSeconds = 60 / bpm / 4;
    const played = meterMap(meter, swing, ternary).played;
    const start = this.#next;
    const at = (step: number) => start + played(step) * stepSeconds;
    const plan = barPlan({ name, layers: { ...layers }, hemiola, grade });
    for (const onset of plan) {
      if (onset.layer === 'click') {
        base.click?.(onset.weight, at(onset.step), volume * onset.gain);
      } else if (onset.layer === 'drums') {
        base.play('drums', onset.note, onset.velocity, at(onset.step), 0.1, {});
      } else {
        const seconds = at(onset.step);
        const duration = at(onset.step + onset.length) - seconds;
        base.play('bass', onset.note, onset.velocity, seconds, duration * 0.9, {});
      }
    }
    for (let eighth = 0; eighth < meter.cycle; eighth++)
      this.#heard.push(at(eighth * STEPS_PER_EIGHTH), { name, eighth });
    this.#next = start + meter.cycle * STEPS_PER_EIGHTH * stepSeconds;
  }
}
