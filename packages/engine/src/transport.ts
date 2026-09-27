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
 * It also listens (#79). Notes players played arrive as input, where they
 * were heard, and wait. As the band composes a bar, the Muse judges the bar
 * before the one before it, in its key, and what the Muse offers is what the
 * band composes the bar from. So a motif heard in bar k plays from bar
 * k + 2, and nothing a player plays reaches a bar sooner: the loop from
 * players back to players passes through a delay (F7). A forget waits for
 * the next bar judged.
 *
 * Its bars come from a source (`BarSource`): the band (`bandSource`), or
 * bars a host composed and sent. It is the same transport either way, so
 * playing alone is a host nobody joined. A source may lack a bar; the
 * transport then passes it as it passes a bar a stall passed.
 *
 * Time is absolute and the clock never waits. A step is laid where the step
 * before it ends, whenever the tick comes; if the clock has stalled past an
 * event, that event is dropped rather than played late. A bar the clock has
 * wholly passed is not composed; the form still moves on through it, at
 * most `CATCH_UP` bars an advance, so every advance is bounded work.
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
import {
  type HeardNote,
  type Judgement,
  type MuseCarried,
  type MuseOutput,
  type Offer,
  admissible,
  barOf,
  judgeBar,
  muse,
} from './muse.ts';
import type { Sound } from './sound.ts';
import { type StyleTrack, styleAt, valueAt, writtenStyle } from './style.ts';
import { swingMap, swingOf } from './swing.ts';
import { type Anchor, stepSeconds, tempoMap } from './tempo.ts';

/** How far ahead of the clock steps are scheduled, in seconds. */
export const LOOKAHEAD = 0.12;

/**
 * The most bars one advance passes. Passing a bar walks the form, the key
 * and the chords through it, some microseconds a bar, so after a long
 * stall (a laptop shut overnight) one advance that walked every bar passed
 * would outlast its own lookahead on a slow machine, and play late. Each
 * advance passes at most this many and schedules nothing, and the ticks
 * after carry on from the clock as it is then: after a day, some 30,000
 * bars at 84 bpm, the band is silent for about three seconds of ticks.
 */
export const CATCH_UP = 256;

/**
 * How many steps before a bar starts it is composed: a beat. That is at
 * least 333 ms even at 180 bpm, nearly three lookaheads.
 */
export const COMPOSE_AHEAD = 4;

/** How many bars after a bar is heard what it offers is played: it is judged as the bar after next is composed. */
export const LISTEN_DELAY = 2;

export interface TransportEnv {
  readonly seed: number;
  /** The clock time step 0 starts at, in seconds. */
  readonly start: number;
  /** The style: tempo and swing per step, and what the band composes from. */
  readonly track: StyleTrack;
  /** The key the players wish for, which the band moves toward at a section boundary. */
  readonly wish: KeyWish;
}

/** A bar a player's notes were judged in elsewhere, such as on a client, and the judgement. */
export interface BarJudgement {
  readonly bar: number;
  readonly judgement: Judgement;
}

/**
 * A bar judged elsewhere that the Muse did not hear, and why: it came after
 * the Muse heard the bar, or before the bar was composed, or it is nothing
 * an ear would have judged in the bar's key (`admissible`).
 */
export interface DroppedJudgement extends BarJudgement {
  readonly why: 'late' | 'ahead' | 'inadmissible';
}

export interface TransportInput<Arrived = never> {
  /** The clock now. Nothing is scheduled before it. */
  readonly now: number;
  /** Every step that starts before this is scheduled: now plus the lookahead. */
  readonly until: number;
  /** Notes players played since the tick before, where they were heard. */
  readonly heard?: readonly HeardNote[];
  /**
   * Bars judged elsewhere since the tick before. Each joins the judgements
   * of its bar, after those of the notes heard here. One for a bar the Muse
   * has already heard is too late, one for a bar not yet composed can't be
   * of anything played, and one no ear would have judged is refused: each
   * is dropped, and says so (`dropped`).
   */
  readonly judged?: readonly BarJudgement[];
  /** Whether someone asked the Muse to forget what it offers. */
  readonly forget?: boolean;
  /** What reached the bar source since the tick before, such as bars a host sent. */
  readonly arrived?: readonly Arrived[];
}

/**
 * Where the transport's bars come from. It carries its own state, takes in
 * what arrives for it, and gives each bar as the transport reaches it, or
 * none. `ahead` is how many steps before a bar starts it is asked for.
 */
export interface BarSource<Carried, Arrived = never> {
  readonly initial: Carried;
  readonly ahead: number;
  /** The source with what arrived since the tick before. */
  receive(carried: Carried, arrived: readonly Arrived[]): Carried;
  /**
   * The bar `env.bar`, or null for none, which the transport passes. With
   * a bar, the source may say when on the clock the bar starts (`start`),
   * which the transport lays its first step at: a host knows where its
   * bars fall, and a client that lays them follows it.
   */
  compose(
    env: BandEnv,
    carried: Carried,
  ): { readonly carried: Carried; readonly bar: BandBar | null; readonly start?: number };
  /** The source past a bar the clock has wholly passed. */
  pass(env: BandEnv, carried: Carried): Carried;
}

/** The band as a source of bars: it composes each on the last beat of the bar before. */
export const bandSource: BarSource<BandCarried> = {
  initial: band.initial,
  ahead: COMPOSE_AHEAD,
  receive: (carried) => carried,
  compose(env, carried) {
    const { carried: next, output } = band.advance(env, carried, null);
    return { carried: next, bar: output };
  },
  pass: passBar,
};

/** What the transport carries for the Muse: its state, and what waits to be judged. */
export interface Listening {
  readonly muse: MuseCarried;
  /** Notes heard in bars not judged yet. */
  readonly pending: readonly HeardNote[];
  /** Bars judged elsewhere that the Muse hasn't heard yet. */
  readonly remote: readonly BarJudgement[];
  /** Whether a forget waits for the next bar judged. */
  readonly forget: boolean;
  /** The bars composed and not judged yet, each with its key. */
  readonly unjudged: readonly { readonly bar: number; readonly key: Key }[];
}

const LISTENING: Listening = {
  muse: muse.initial,
  pending: [],
  remote: [],
  forget: false,
  unjudged: [],
};

export interface TransportCarried<Source = BandCarried> {
  /** The next step to schedule, and when it starts. */
  readonly head: Anchor;
  /** The bar source's carried state; the band's is its plans and the bar it decided next. */
  readonly source: Source;
  /** The composed bars from the head's bar on. */
  readonly bars: readonly BandBar[];
  /** The next bar the band composes. */
  readonly nextBar: number;
  /** The beat being scheduled and the swing it plays with, once it has started. */
  readonly beat: { readonly index: number; readonly swing: number } | null;
  readonly listening: Listening;
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
  /** The swing its beat plays with, held from where the beat starts. */
  readonly swing: number;
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
  /** The bars the Muse judged on this tick: its log. */
  readonly judged: readonly MuseOutput[];
  /** The bars judged elsewhere that arrived on this tick and were dropped. */
  readonly dropped: readonly DroppedJudgement[];
}

/** What the band reads for a bar: the style where the bar starts, on the track, and what the Muse offers. */
export function bandEnvAt(
  { seed, track, wish }: TransportEnv,
  bar: number,
  offer: Offer | null,
): BandEnv {
  return { seed, bar, style: styleAt(track, bar * 16), wish, offer };
}

/**
 * The Muse hears every bar composed up to `last`, in order: the notes heard
 * here judged in the bar's key, then the bars judged elsewhere. It forgets
 * the notes and judgements it heard, and those of bars already past.
 */
function listen(listening: Listening, last: number, judged: MuseOutput[]): Listening {
  let { muse: carried, pending, remote, forget, unjudged } = listening;
  while (unjudged.length > 0 && unjudged[0]!.bar <= last) {
    const { bar, key } = unjudged[0]!;
    const judgements = [
      ...judgeBar(pending, bar, key),
      ...remote.filter((r) => r.bar === bar).map((r) => r.judgement),
    ];
    const next = muse.advance({ bar }, carried, { judgements, forget });
    carried = next.carried;
    judged.push(next.output);
    forget = false;
    pending = pending.filter((n) => barOf(n) > bar);
    remote = remote.filter((r) => r.bar > bar);
    unjudged = unjudged.slice(1);
  }
  return { muse: carried, pending, remote, forget, unjudged };
}

/** A bar decided ahead, the energy it plays at, and the motif the lead plays in it. */
export interface ForecastBar extends DecidedBar {
  readonly barEnergy: number;
  /** A composed bar's own offer; for a bar ahead, the one standing now, which it plays unless another comes. */
  readonly offer: Offer | null;
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
    .map(({ bar, plan, chords, barEnergy, offer }) => ({ bar, plan, chords, barEnergy, offer }));
  const offer = carried?.listening.muse.offer ?? null;
  const ahead = lookAhead(
    carried?.source ?? band.initial,
    (bar) => bandEnvAt(env, bar, offer),
    count - composed.length,
  ).map((decided) => ({
    ...decided,
    offer,
    barEnergy: barEnergy(
      writtenStyle(styleAt(env.track, decided.bar * 16)).energy,
      decided.plan.section.type,
      decided.bar % SECTION_BARS,
    ),
  }));
  return [...composed, ...ahead];
}

/**
 * Where a moment on the clock is written: the inverse of how the steps
 * were laid, for a note a player plays along with the band. Each step lies
 * where the step before it ends and lasts its own length, so a moment falls
 * in one step, the tempo inside it is undone linearly, and the swing its
 * beat was held at is undone after. That is exactly how the transport
 * played its events, whatever the style track holds by now: the track keeps
 * only its latest glide per axis, and the steps as laid keep the rest.
 * Null for a moment outside the steps given, such as before the first,
 * after the last, or in steps a stall dropped.
 */
export function writtenAt(laid: readonly ScheduledStep[], seconds: number): number | null {
  for (let i = laid.length - 1; i >= 0; i--) {
    const step = laid[i]!;
    if (seconds >= step.seconds + step.length) return null;
    if (seconds >= step.seconds) {
      const played = step.step + (seconds - step.seconds) / step.length;
      return swingMap(step.swing).written(played);
    }
  }
  return null;
}

/** The transport over a source of bars. */
export function transportOver<Source, Arrived = never>(
  source: BarSource<Source, Arrived>,
): Machine<
  TransportEnv,
  TransportCarried<Source> | null,
  TransportInput<Arrived>,
  TransportOutput
> {
  return {
    initial: null,
    advance(
      env,
      carried,
      { now, until, heard = [], judged: remote = [], forget = false, arrived = [] },
    ) {
      const { start, track } = env;
      let head = carried?.head ?? { step: 0, seconds: start };
      let playing = source.receive(carried?.source ?? source.initial, arrived);
      let bars = [...(carried?.bars ?? [])];
      let nextBar = carried?.nextBar ?? 0;
      let beat = carried?.beat ?? null;
      let listening = carried?.listening ?? LISTENING;
      // What arrives from elsewhere is heard if its bar is composed and not
      // yet heard, and it passes the gates in the bar's key; it is dropped
      // otherwise.
      const unheard = listening.unjudged[0]?.bar ?? nextBar;
      const dropped: DroppedJudgement[] = [];
      const kept = remote.filter((r) => {
        const key = listening.unjudged.find((u) => u.bar === r.bar)?.key;
        const why =
          r.bar < unheard
            ? 'late'
            : r.bar >= nextBar
              ? 'ahead'
              : !key || !admissible(r.judgement, key)
                ? 'inadmissible'
                : null;
        if (why) dropped.push({ ...r, why });
        return why === null;
      });
      if (heard.length > 0 || kept.length > 0 || forget)
        listening = {
          ...listening,
          pending: [...listening.pending, ...heard],
          remote: [...listening.remote, ...kept],
          forget: listening.forget || forget,
        };
      const judged: MuseOutput[] = [];
      const steps: ScheduledStep[] = [];
      const events: TimedEvent[] = [];
      const composed: BandBar[] = [];
      let missed = 0;
      let passed = 0;
      const swing = swingOf(track);

      while (head.seconds < until) {
        const bar = Math.floor(head.step / 16);

        // Steps the clock has passed are not scheduled, and a bar it has
        // wholly passed is not composed: the source passes it, the band
        // deciding the bar after as it would have.
        if (head.step % 16 === 0 && nextBar === bar) {
          const end = tempoMap(track, head).played(head.step + 16);
          if (end <= now) {
            // Enough walking for one advance: the next carries on.
            if (passed === CATCH_UP) break;
            passed++;
            playing = source.pass(bandEnvAt(env, bar, listening.muse.offer), playing);
            nextBar++;
            missed += 16;
            head = { step: head.step + 16, seconds: end };
            continue;
          }
        }
        const length = stepSeconds(valueAt('bpm', track.bpm, head.step));
        if (head.seconds + length <= now) {
          missed++;
          head = { step: head.step + 1, seconds: head.seconds + length };
          continue;
        }

        // Compose each bar `ahead` steps before it starts: the band on the
        // last beat of the bar before.
        for (; nextBar <= Math.floor((head.step + source.ahead) / 16); nextBar++) {
          listening = listen(listening, nextBar - LISTEN_DELAY, judged);
          const made = source.compose(bandEnvAt(env, nextBar, listening.muse.offer), playing);
          playing = made.carried;
          if (!made.bar) continue;
          const key = made.bar.plan.key;
          listening = { ...listening, unjudged: [...listening.unjudged, { bar: nextBar, key }] };
          bars.push(made.bar);
          composed.push(made.bar);
          if (made.start !== undefined && head.step === nextBar * 16)
            head = { step: head.step, seconds: made.start };
        }
        bars = bars.filter((b) => b.bar >= bar);
        const current = bars[0];
        if (current?.bar !== bar || head.seconds + length <= now) {
          missed++;
          head = { step: head.step + 1, seconds: head.seconds + length };
          continue;
        }
        const {
          plan: { section, key },
          chords,
        } = current;
        const chord = chordAt(chords, head.step % 16);

        // The beat's swing is read as the beat starts, and kept.
        const index = Math.floor(head.step / 4);
        if (beat?.index !== index) beat = { index, swing: styleAt(track, index * 4).swing };
        const held = beat;
        steps.push({
          step: head.step,
          section,
          key,
          chord,
          seconds: head.seconds,
          length,
          swing: held.swing,
        });
        const swung = (x: number) =>
          Math.floor(x / 4) === held.index ? swingMap(held.swing).played(x) : swing.played(x);
        const tempo = tempoMap(track, head);
        const clock = (x: number) => tempo.played(swung(x));

        for (const event of current.events) {
          if (event.step !== head.step % 16) continue;
          const seconds = clock(head.step);
          if (seconds < now) continue;
          events.push({
            bar,
            event,
            sound: current.sound,
            seconds,
            duration: clock(head.step + event.length) - seconds,
          });
        }
        head = { step: head.step + 1, seconds: head.seconds + length };
      }
      return {
        carried: { head, source: playing, bars, nextBar, beat, listening },
        output: { steps, events, composed, missed, judged, dropped },
      };
    },
  };
}

/** The transport over the band: Jambot on its own, and a host. */
export const transport = transportOver(bandSource);
