/**
 * Work done ahead at idle, a step at a time (#397, the review of #407):
 * the rhythm repository's fits, which cost a compile each the first time a
 * section asks, are tested before any is asked, so no section start pays it
 * while the band plays (time is absolute).
 *
 * Each slice runs in the browser's idle time (`requestIdleCallback`), never
 * inside the transport's tick, and starts a step only while more than
 * `RESERVE` ms of its idle period remain: a step is a fit, a union or a read
 * (the longest 21.7 ms in Chromium over the 838 steps of every bench, #407),
 * so a slice stays under the 50 ms the browser gives an idle period at most. Where there is no `requestIdleCallback`
 * (Safari before 18), a slice runs from a zero timeout with a budget of
 * `FALLBACK_BUDGET` ms instead.
 */

/** How much of an idle period must remain to start a step: more than the longest step. */
export const RESERVE = 25;

/** A slice's budget where the browser gives no idle period, in ms. */
export const FALLBACK_BUDGET = 16;

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
      const end = now() + FALLBACK_BUDGET;
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
    while (period.timeRemaining() > RESERVE) {
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
