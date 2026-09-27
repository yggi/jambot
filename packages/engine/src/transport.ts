/**
 * The transport: the machine at tick rate, which owns time.
 *
 * On each tick the clock says what time it is now, and the transport
 * schedules every step that starts before now plus the lookahead. The band
 * composes each bar on the last beat of the bar before: never as the bar is
 * about to play, and soon enough after a change that the drums hear it
 * within the rest of the bar and a beat. Each event's time is its written
 * position mapped through swing, then tempo (`swingOf`, `tempoMap`): both
 * ends of a note go through the map, so a legato line stays legato under
 * swing. Once a beat has started, its swing is kept, so a change can't move
 * the rest of it. A wish for another key is heard at the next section the
 * band plans, which it does a bar before the section starts.
 *
 * Time is absolute and the clock never waits. A step is laid where the step
 * before it ends, whenever the tick comes; if the clock has stalled past an
 * event, that event is dropped rather than played late. A bar the clock has
 * wholly passed is not composed; the form still moves on through it.
 */

import {
  type BandBar,
  type BandCarried,
  type BandEnv,
  type DecidedBar,
  band,
  lookAhead,
  passBar,
} from './band.ts';
import { type BarChord, chordAt } from './chords.ts';
import type { NoteEvent } from './events.ts';
import { SECTION_BARS, type Section, barEnergy } from './form.ts';
import type { Key, KeyWish } from './key.ts';
import type { Machine } from './machine.ts';
import type { Sound } from './sound.ts';
import { type StyleTrack, styleAt, valueAt, writtenStyle } from './style.ts';
import { swingMap, swingOf } from './swing.ts';
import { type Anchor, stepSeconds, tempoMap } from './tempo.ts';

/** How far ahead of the clock steps are scheduled, in seconds. */
export const LOOKAHEAD = 0.12;

/**
 * How many steps before a bar starts it is composed: a beat. That is at
 * least 333 ms even at 180 bpm, nearly three lookaheads.
 */
export const COMPOSE_AHEAD = 4;

export interface TransportEnv {
  readonly seed: number;
  /** The clock time step 0 starts at, in seconds. */
  readonly start: number;
  /** The style: tempo and swing per step, and what the band composes from. */
  readonly track: StyleTrack;
  /** The key the players wish for, which the band moves toward at a section boundary. */
  readonly wish: KeyWish;
}

export interface TransportInput {
  /** The clock now. Nothing is scheduled before it. */
  readonly now: number;
  /** Every step that starts before this is scheduled: now plus the lookahead. */
  readonly until: number;
}

export interface TransportCarried {
  /** The next step to schedule, and when it starts. */
  readonly head: Anchor;
  /** The band's carried state: its plans and the bar it decided next. */
  readonly band: BandCarried;
  /** The composed bars from the head's bar on. */
  readonly bars: readonly BandBar[];
  /** The next bar the band composes. */
  readonly nextBar: number;
  /** The beat being scheduled and the swing it plays with, once it has started. */
  readonly beat: { readonly index: number; readonly swing: number } | null;
}

export interface ScheduledStep {
  readonly step: number;
  /** The section the step's bar is in, its key, and the chord sounding. */
  readonly section: Section;
  readonly key: Key;
  readonly chord: BarChord;
  readonly seconds: number;
  /** How long the step lasts, in seconds. */
  readonly length: number;
}

export interface TimedEvent {
  readonly bar: number;
  readonly event: NoteEvent;
  /** How its bar sounds. */
  readonly sound: Sound;
  /** When it sounds, on the clock. */
  readonly seconds: number;
  /** How long it sounds, in seconds. */
  readonly duration: number;
}

export interface TransportOutput {
  readonly steps: readonly ScheduledStep[];
  readonly events: readonly TimedEvent[];
  /** The bars composed on this tick. */
  readonly composed: readonly BandBar[];
  /** How many steps the clock had passed before they could be scheduled. */
  readonly missed: number;
}

/** What the band reads for a bar: the style where the bar starts, on the track. */
export function bandEnvAt({ seed, track, wish }: TransportEnv, bar: number): BandEnv {
  return { seed, bar, style: styleAt(track, bar * 16), wish };
}

/** A bar decided ahead, and the energy it plays at. */
export interface ForecastBar extends DecidedBar {
  readonly barEnergy: number;
}

/**
 * The next `count` bars from the head's bar on, as they will play unless a
 * control moves: those composed, then those the band will decide
 * (`lookAhead`). Before the start (`carried` null) they are the song from
 * bar 0.
 */
export function forecast(
  env: TransportEnv,
  carried: TransportCarried | null,
  count: number,
): ForecastBar[] {
  const head = Math.floor((carried?.head.step ?? 0) / 16);
  const composed = (carried?.bars ?? [])
    .filter((b) => b.bar >= head)
    .slice(0, count)
    .map(({ bar, plan, chords, barEnergy }) => ({ bar, plan, chords, barEnergy }));
  const ahead = lookAhead(
    carried?.band ?? band.initial,
    (bar) => bandEnvAt(env, bar),
    count - composed.length,
  ).map((decided) => ({
    ...decided,
    barEnergy: barEnergy(
      writtenStyle(styleAt(env.track, decided.bar * 16)).energy,
      decided.plan.section.type,
      decided.bar % SECTION_BARS,
    ),
  }));
  return [...composed, ...ahead];
}

export const transport: Machine<
  TransportEnv,
  TransportCarried | null,
  TransportInput,
  TransportOutput
> = {
  initial: null,
  advance(env, carried, { now, until }) {
    const { start, track } = env;
    let head = carried?.head ?? { step: 0, seconds: start };
    let playing = carried?.band ?? band.initial;
    let bars = [...(carried?.bars ?? [])];
    let nextBar = carried?.nextBar ?? 0;
    let beat = carried?.beat ?? null;
    const steps: ScheduledStep[] = [];
    const events: TimedEvent[] = [];
    const composed: BandBar[] = [];
    let missed = 0;
    const swing = swingOf(track);

    while (head.seconds < until) {
      const bar = Math.floor(head.step / 16);
      const length = stepSeconds(valueAt('bpm', track.bpm, head.step));

      // Steps the clock has passed are not scheduled, and a bar it has wholly
      // passed is not composed: the band passes it, deciding the bar after
      // as it would have.
      if (head.step % 16 === 0 && nextBar === bar) {
        const end = tempoMap(track, head).played(head.step + 16);
        if (end <= now) {
          playing = passBar(bandEnvAt(env, bar), playing);
          nextBar++;
          missed += 16;
          head = { step: head.step + 16, seconds: end };
          continue;
        }
      }
      if (head.seconds + length <= now) {
        missed++;
        head = { step: head.step + 1, seconds: head.seconds + length };
        continue;
      }

      // Compose each bar on the last beat of the bar before.
      for (; nextBar <= Math.floor((head.step + COMPOSE_AHEAD) / 16); nextBar++) {
        const played = band.advance(bandEnvAt(env, nextBar), playing, null);
        playing = played.carried;
        bars.push(played.output);
        composed.push(played.output);
      }
      bars = bars.filter((b) => b.bar >= bar);
      const {
        plan: { section, key },
        chords,
      } = bars[0]!;
      const chord = chordAt(chords, head.step % 16);
      steps.push({ step: head.step, section, key, chord, seconds: head.seconds, length });

      // The beat's swing is read as the beat starts, and kept.
      const index = Math.floor(head.step / 4);
      if (beat?.index !== index) beat = { index, swing: styleAt(track, index * 4).swing };
      const held = beat;
      const swung = (x: number) =>
        Math.floor(x / 4) === held.index ? swingMap(held.swing).played(x) : swing.played(x);
      const tempo = tempoMap(track, head);
      const clock = (x: number) => tempo.played(swung(x));

      for (const event of bars[0]!.events) {
        if (event.step !== head.step % 16) continue;
        const seconds = clock(head.step);
        if (seconds < now) continue;
        events.push({
          bar,
          event,
          sound: bars[0]!.sound,
          seconds,
          duration: clock(head.step + event.length) - seconds,
        });
      }
      head = { step: head.step + 1, seconds: head.seconds + length };
    }
    return {
      carried: { head, band: playing, bars, nextBar, beat },
      output: { steps, events, composed, missed },
    };
  },
};
