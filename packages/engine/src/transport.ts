/**
 * The transport: the machine at tick rate, which owns time.
 *
 * On each tick the clock says what time it is now, and the transport
 * schedules every step that starts before now plus the lookahead. It keeps
 * the band composing a bar ahead, so a bar is never composed as it is about
 * to play. Each event's time is its written position mapped through swing,
 * then tempo (`swingOf`, `tempoMap`): both ends of a note go through the
 * map, so a legato line stays legato under swing.
 *
 * Time is absolute and the clock never waits. A step is laid where the step
 * before it ends, whenever the tick comes; if the clock has stalled past an
 * event, that event is dropped rather than played late.
 */

import { type BandBar, band } from './band.ts';
import type { NoteEvent } from './events.ts';
import type { Section } from './form.ts';
import type { Machine } from './machine.ts';
import { type StyleTrack, styleAt } from './style.ts';
import { composeTimeMaps, swingOf } from './swing.ts';
import { type Anchor, stepSeconds, tempoMap } from './tempo.ts';

/** How far ahead of the clock steps are scheduled, in seconds. */
export const LOOKAHEAD = 0.12;

export interface TransportEnv {
  readonly seed: number;
  /** The clock time step 0 starts at, in seconds. */
  readonly start: number;
  /** The style: tempo and swing per step, and what the band composes from. */
  readonly track: StyleTrack;
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
  /** The section the band is in. */
  readonly section: Section | null;
  /** The composed bars from the head's bar on. */
  readonly bars: readonly BandBar[];
}

export interface ScheduledStep {
  readonly step: number;
  /** The section the step's bar is in. */
  readonly section: Section;
  readonly seconds: number;
  /** How long the step lasts, in seconds. */
  readonly length: number;
}

export interface TimedEvent {
  readonly bar: number;
  readonly event: NoteEvent;
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
}

export const transport: Machine<
  TransportEnv,
  TransportCarried | null,
  TransportInput,
  TransportOutput
> = {
  initial: null,
  advance({ seed, start, track }, carried, { now, until }) {
    let head = carried?.head ?? { step: 0, seconds: start };
    let section = carried?.section ?? null;
    let bars = [...(carried?.bars ?? [])];
    const steps: ScheduledStep[] = [];
    const events: TimedEvent[] = [];
    const composed: BandBar[] = [];
    const swing = swingOf(track);

    /** Compose up to and including `bar`. */
    const composeThrough = (bar: number) => {
      for (let next = (bars.at(-1)?.bar ?? -1) + 1; next <= bar; next++) {
        const played = band.advance(
          { seed, bar: next, style: styleAt(track, next * 16) },
          section,
          null,
        );
        section = played.carried;
        bars.push(played.output);
        composed.push(played.output);
      }
    };

    while (head.seconds < until) {
      const bar = Math.floor(head.step / 16);
      composeThrough(bar + 1);
      bars = bars.filter((b) => b.bar >= bar);
      const length = stepSeconds(styleAt(track, head.step).bpm);
      steps.push({ step: head.step, section: bars[0]!.section, seconds: head.seconds, length });
      const clock = composeTimeMaps(swing, tempoMap(track, head));
      for (const event of bars[0]!.events) {
        if (event.step !== head.step % 16) continue;
        const seconds = clock.played(head.step);
        if (seconds < now) continue;
        events.push({
          bar,
          event,
          seconds,
          duration: clock.played(head.step + event.length) - seconds,
        });
      }
      head = { step: head.step + 1, seconds: head.seconds + length };
    }
    return { carried: { head, section, bars }, output: { steps, events, composed } };
  },
};
