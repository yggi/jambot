/**
 * Where a page's late ticks come from (#462), for the session soak
 * (`soak.ts --session --profile`): a measurement of each page's main thread
 * while it plays, changing nothing it plays.
 *
 * Each page is watched from before its scripts run (`watchTicks`, an init
 * script): the gaps between the ticker's messages over 60 ms (the ticker's
 * worker posts every 25 ms), every task over 50 ms the browser reports
 * (`longtask`), where a 10 ms timer of the page came late by over 100 ms
 * (the main thread busy, or the page's timers clamped), whether the page was
 * hidden or lost focus, and each moment its count of events dropped late
 * grew. The browser's trace of the garbage collector (`GC_CATEGORIES`) is
 * set beside it by a mark each page leaves in the trace (`markPage`), which
 * also says which renderer process and thread runs each page.
 *
 * `lateTicks` then says, of each tick later than the lookahead and each
 * that dropped events late, what overlapped it: a long task, a collection on
 * the page's main thread, its timers stalled, the page hidden, or nothing the
 * page could see, on a clock both pages share.
 */

import type { Page } from '@playwright/test';

/** A moment on a page's clock (`performance.now()`, in milliseconds), and how long before it something lasted. */
interface Gap {
  readonly at: number;
  readonly gap: number;
}

/** What a page's watch kept. */
export interface TickWatch {
  readonly ticks: number;
  /** Ticks that came over 60 ms after the one before. */
  readonly slow: Gap[];
  /** Moments the 10 ms timer came over 100 ms late. */
  readonly stalls: Gap[];
  /** Tasks over 50 ms, as the browser reports them: where they started and how long they took. */
  readonly longtasks: { readonly at: number; readonly duration: number }[];
  /** Each change of the page's visibility and focus, and how it started. */
  readonly visibility: {
    readonly at: number;
    readonly hidden: boolean;
    readonly focused: boolean;
  }[];
  /** Each moment the count of events dropped late grew: by how many, and the slow tick before it. */
  readonly late: { readonly at: number; readonly events: number; readonly tick: Gap | null }[];
}

/** The init script: run in each page before its own, it keeps a `TickWatch` on `window.__tickWatch`. */
export function watchTicks() {
  const watch = {
    ticks: 0,
    slow: [] as { at: number; gap: number }[],
    stalls: [] as { at: number; gap: number }[],
    longtasks: [] as { at: number; duration: number }[],
    visibility: [] as { at: number; hidden: boolean; focused: boolean }[],
    late: [] as { at: number; events: number; tick: { at: number; gap: number } | null }[],
  };
  const w = window as unknown as {
    __tickWatch: typeof watch;
    Worker: typeof Worker;
    jambot?: { timing: { lateEvents: number } };
  };
  w.__tickWatch = watch;
  // The ticker's worker is made from a blob and posts 0 every 25 ms (`ticker.ts`).
  const Native = w.Worker;
  w.Worker = class extends Native {
    constructor(url: string | URL, options?: WorkerOptions) {
      super(url, options);
      if (!String(url).startsWith('blob:')) return;
      let last: number | null = null;
      this.addEventListener('message', (e) => {
        if (e.data !== 0) return;
        const now = performance.now();
        watch.ticks++;
        if (last !== null && now - last > 60) watch.slow.push({ at: now, gap: now - last });
        last = now;
      });
    }
  };
  const seen = () =>
    watch.visibility.push({
      at: performance.now(),
      hidden: document.hidden,
      focused: document.hasFocus(),
    });
  seen();
  document.addEventListener('visibilitychange', seen);
  window.addEventListener('focus', seen);
  window.addEventListener('blur', seen);
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        watch.longtasks.push({ at: e.startTime, duration: e.duration });
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    // No long tasks where the browser reports none.
  }
  let sampled = performance.now();
  let late = 0;
  setInterval(() => {
    const now = performance.now();
    if (now - sampled > 100) watch.stalls.push({ at: now, gap: now - sampled });
    sampled = now;
    const count = w.jambot?.timing.lateEvents ?? 0;
    if (count > late)
      watch.late.push({ at: now, events: count - late, tick: watch.slow.at(-1) ?? null });
    late = count;
  }, 10);
}

export const readWatch = (page: Page) =>
  page.evaluate(() => (window as unknown as { __tickWatch: TickWatch }).__tickWatch);

/** Leaves a mark named `name` in the browser's trace, and gives its time on the page's clock. */
export const markPage = (page: Page, name: string) =>
  page.evaluate((n) => performance.mark(n).startTime, name);

/** The trace's categories: the collector's events, and the marks that place each page in it. */
export const GC_CATEGORIES = ['disabled-by-default-v8.gc', 'v8.gc', 'blink.user_timing'];

interface TraceEvent {
  readonly name: string;
  readonly cat: string;
  readonly ph: string;
  readonly ts: number;
  readonly dur?: number;
  readonly pid: number;
  readonly tid: number;
}

/** A page's place in the trace: its renderer's process and main thread, and its clock's offset, in ms. */
export interface PagePlace {
  readonly pid: number;
  readonly tid: number;
  readonly offset: number;
}

/** Where the mark `name`, made at `at` on the page's clock, puts the page in the trace. */
export function placeOf(events: readonly TraceEvent[], name: string, at: number): PagePlace | null {
  const mark = events.find((e) => e.name === name);
  return mark ? { pid: mark.pid, tid: mark.tid, offset: mark.ts / 1000 - at } : null;
}

/** The collections on a page's main thread, on its clock: the outermost of each, which hold the thread. */
export function collections(events: readonly TraceEvent[], place: PagePlace) {
  const held = events
    .filter(
      (e) =>
        e.pid === place.pid &&
        e.tid === place.tid &&
        e.ph === 'X' &&
        e.dur !== undefined &&
        /^(V8\.GC_(SCAVENGER|MARK_COMPACTOR|MC_|MINOR_MC)|MinorGC|MajorGC|V8\.GCScavenger|V8\.GCFinalizeMC|V8\.GCIncrementalMarking)/.test(
          e.name,
        ),
    )
    .map((e) => ({ at: e.ts / 1000 - place.offset, duration: e.dur! / 1000, name: e.name }))
    .sort((a, b) => a.at - b.at);
  // Nested phases are inside their outermost: keep each outermost alone.
  const outer: typeof held = [];
  for (const c of held) {
    const last = outer.at(-1);
    if (last && c.at < last.at + last.duration) continue;
    outer.push(c);
  }
  return outer;
}

/** The lookahead (`LOOKAHEAD`, 120 ms): a tick later than it can drop events. */
const LATE_TICK = 120;

/**
 * Each tick later than the lookahead, and each that dropped events late,
 * with what overlapped it: the longest long task, the collector's time on
 * the main thread, whether the page's 10 ms timer stalled too, and whether
 * the page was hidden or unfocused. `toCommon` puts a time on a clock both
 * pages share (the trace's, from a mark), in seconds.
 */
export function lateTicks(
  watch: TickWatch,
  gc: readonly { at: number; duration: number; name: string }[] | null,
  toCommon: (at: number) => number,
) {
  const overlaps = (from: number, to: number, at: number, duration: number) =>
    at < to && at + duration > from;
  const seenAt = (t: number) => {
    const before = watch.visibility.filter((v) => v.at <= t).at(-1) ?? watch.visibility[0];
    return before ? { hidden: before.hidden, focused: before.focused } : null;
  };
  // The count grows at the first 10 ms sample after the tick that dropped them.
  const droppedBy = (tick: Gap) =>
    watch.late.filter((l) => l.tick?.at === tick.at).reduce((sum, l) => sum + l.events, 0);
  const late = watch.slow.filter((s) => s.gap > LATE_TICK || droppedBy(s) > 0);
  const unplaced = watch.late.filter((l) => !l.tick || !late.some((s) => s.at === l.tick!.at));
  const ticks = late.map((tick) => {
    const [from, to] = [tick.at - tick.gap, tick.at];
    const longest = Math.max(
      0,
      ...watch.longtasks.filter((l) => overlaps(from, to, l.at, l.duration)).map((l) => l.duration),
    );
    const gcMs = gc
      ? gc.filter((c) => overlaps(from, to, c.at, c.duration)).reduce((s, c) => s + c.duration, 0)
      : null;
    return {
      at: Math.round(toCommon(to) * 1000) / 1000,
      gap: Math.round(tick.gap),
      dropped: droppedBy(tick),
      longTask: Math.round(longest),
      gc: gcMs === null ? null : Math.round(gcMs),
      timerStalled: watch.stalls.some((s) => overlaps(from, to, s.at - s.gap, s.gap)),
      ...seenAt(to),
    };
  });
  const dropping = ticks.filter((t) => t.dropped > 0);
  const causes = {
    longTask: dropping.filter((t) => t.longTask > 0).length,
    gc: dropping.filter((t) => (t.gc ?? 0) > 0).length,
    timerStalled: dropping.filter((t) => t.timerStalled).length,
    hidden: dropping.filter((t) => t.hidden).length,
    unfocused: dropping.filter((t) => t.focused === false).length,
    none: dropping.filter((t) => t.longTask === 0 && !(t.gc ?? 0) && !t.timerStalled && !t.hidden)
      .length,
  };
  const spread = (xs: number[]) => {
    const sorted = [...xs].sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
    return {
      count: xs.length,
      p50: q(0.5) ?? null,
      p99: q(0.99) ?? null,
      most: sorted.at(-1) ?? null,
    };
  };
  const common = <T extends { at: number }>(xs: readonly T[]) =>
    xs.map((x) => ({ ...x, at: Math.round(toCommon(x.at) * 1000) / 1000 }));
  return {
    ticks: watch.ticks,
    slowTicks: spread(watch.slow.map((s) => Math.round(s.gap))),
    timerStalls: common(watch.stalls),
    longtasks: common(watch.longtasks.filter((l) => l.duration > 100)),
    gc: gc && {
      count: gc.length,
      over20: common(gc.filter((c) => c.duration > 20)),
      most: Math.round(Math.max(0, ...gc.map((c) => c.duration))),
    },
    visibility: watch.visibility,
    lateTicks: ticks,
    droppedUnplaced: unplaced.reduce((sum, l) => sum + l.events, 0),
    causes,
  };
}
