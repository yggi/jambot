/**
 * Work done ahead at idle, a step at a time (#397, the review of #407):
 * the rhythm repository's fits, which cost a compile each the first time a
 * section asks, are tested before any is asked, so no section start pays it
 * while the band plays (time is absolute).
 *
 * Each slice runs in the browser's idle time (`requestIdleCallback`), never
 * inside the transport's tick, and starts a step only within its first
 * `SLICE_BUDGET` ms and while its idle period lasts: a step is a fit, a union
 * or a read (the longest 21.7 ms in Chromium over the 838 steps of every
 * bench, #407), so a slice stays under the 50 ms the browser gives an idle
 * period at most.
 * The period is all a step needs to start, not room for it to end in: while
 * the band plays the page draws every frame, and Chromium's idle periods are
 * then what is left of a frame, 16 ms at most, so a step that had to fit in
 * one would never start, and the warm-up would wait for the song to stop
 * (#408: none of 838 steps in 30 s of play).
 * A step past the period's end delays the next frame by that step at most,
 * never the band, which the transport schedules `LOOKAHEAD` (120 ms) ahead.
 * Where there is no `requestIdleCallback` (Safari before 18), a slice runs
 * from a zero timeout, its period `FALLBACK_PERIOD` ms.
 *
 * A groove the Muse files (#401) is a rhythm the warm-up never saw: once it
 * is filed, its fits, reads and unions on every bench are warmed the same
 * way (`warmedOnFiling`, #412), so no bar after it compiles them.
 */

import type { Bench, FacetRepository } from '@jambot/engine';

/** How long into a slice a step may start, in ms: so a slice is at most this and its last step, under 50 ms. */
export const SLICE_BUDGET = 25;

/** A slice's idle period where the browser gives none, in ms. */
export const FALLBACK_PERIOD = 16;

/** What an idle period says: how long it has left, in ms. */
export interface IdlePeriod {
  timeRemaining(): number;
}

/** How a slice is scheduled: run it when the thread is next idle. */
export type IdleScheduler = (slice: (period: IdlePeriod) => void) => void;

/** What warming has done so far: its steps and slices, the longest of each, the work, and when it finished. */
export interface Warming {
  steps: number;
  slices: number;
  /** The longest slice, and the longest step, in ms. */
  longestSlice: number;
  longestStep: number;
  /** The time spent in steps, in ms. */
  work: number;
  /** When it started and finished, on `now`'s clock; null until it has. */
  readonly started: number;
  finished: number | null;
}

/** The browser's idle scheduler, or zero timeouts with a budget where it has none. */
export function browserIdle(now: () => number = () => performance.now()): IdleScheduler {
  const idle = (globalThis as { requestIdleCallback?: (run: (p: IdlePeriod) => void) => number })
    .requestIdleCallback;
  if (idle) return (slice) => void idle.call(globalThis, slice);
  return (slice) => {
    setTimeout(() => {
      const end = now() + FALLBACK_PERIOD;
      slice({ timeRemaining: () => Math.max(0, end - now()) });
    }, 0);
  };
}

/** Every warming started, the latest last: what a measurement reads. */
export const warmings: Warming[] = [];

/** Run `steps` at idle, a slice at a time, until they end; what it has done so far. */
export function warmAtIdle(
  steps: Iterable<void>,
  schedule: IdleScheduler = browserIdle(),
  now: () => number = () => performance.now(),
): Warming {
  const it = steps[Symbol.iterator]();
  const warming: Warming = {
    steps: 0,
    slices: 0,
    longestSlice: 0,
    longestStep: 0,
    work: 0,
    started: now(),
    finished: null,
  };
  warmings.push(warming);
  const slice = (period: IdlePeriod) => {
    const from = now();
    let done = false;
    while (period.timeRemaining() > 0 && now() - from < SLICE_BUDGET) {
      const at = now();
      done = it.next().done === true;
      const took = now() - at;
      if (done) break;
      warming.steps++;
      warming.work += took;
      warming.longestStep = Math.max(warming.longestStep, took);
    }
    warming.slices++;
    warming.longestSlice = Math.max(warming.longestSlice, now() - from);
    if (done) warming.finished = now();
    else schedule(slice);
  };
  schedule(slice);
  return warming;
}

/**
 * The repository, warming each fragment filed once it is filed (#412): on
 * the bench it was played on first, then on `benches`, with the layer it was
 * filed in, so the sections after it, which may take it (and a clave beside
 * a groove), compile nothing for it. A text is warmed once however often it
 * is filed (each forecast files ahead again, in a layer of its own), and one
 * held already, a fragment's text, is warm. The repository as it is where it
 * files or warms nothing. Any member's repository (`FacetRepository`): the
 * rhythms', the bass lines' (#423), the lead lines' (#424) and the
 * harmonies' (#425).
 */
export function warmedOnFiling<R extends FacetRepository<{ readonly bars: number }, object>>(
  repository: R,
  benches: readonly Bench[],
  warm: (steps: Iterable<void>) => void,
): R {
  const { file, warm: warmOn } = repository;
  if (!file || !warmOn) return repository;
  const warmedTexts = new Set<string>();
  return {
    ...repository,
    file(layer, filing) {
      const filed = file.call(repository, layer, filing);
      const text = filed.layer.filed.find((f) => f.fragment.id === filed.id)?.fragment.text;
      if (!filed.held && text !== undefined && !warmedTexts.has(text)) {
        warmedTexts.add(text);
        warm(warmOn.call(repository, [filing.bench, ...benches], filed.layer));
      }
      return filed;
    },
  };
}
