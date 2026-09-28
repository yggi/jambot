/**
 * The parser's own tempo map: a file's tempo events (ticks, bpm) turned
 * into a `TimeMap` between ticks and seconds, in the shape the engine's own
 * maps already use (`@jambot/engine`'s `TimeMap`, `tempo.ts`/`swing.ts`),
 * but built from a file's own tempo changes instead of a style track's
 * glide. `played` and `written` are exact inverses (A6).
 */
import type { TimeMap } from '@jambot/engine';

/** A tempo change: the tick it starts at, and the beats per minute from there. */
export interface TempoEvent {
  readonly ticks: number;
  readonly bpm: number;
}

const DEFAULT_BPM = 120;

interface Segment {
  readonly ticks: number;
  readonly seconds: number;
  readonly secondsPerTick: number;
}

/** The bpm of the tempo event with the smallest tick, or the default with none. */
function earliestBpm(tempos: readonly TempoEvent[]): number {
  if (tempos.length === 0) return DEFAULT_BPM;
  return tempos.reduce((earliest, event) => (event.ticks < earliest.ticks ? event : earliest)).bpm;
}

/** Tempo events, one per tick, anchored at tick 0, in order. */
function segments(ppq: number, tempos: readonly TempoEvent[]): Segment[] {
  const byTick = new Map<number, number>();
  for (const event of tempos) byTick.set(event.ticks, event.bpm);
  if (!byTick.has(0)) byTick.set(0, earliestBpm(tempos));
  const sorted = [...byTick.entries()].sort(([a], [b]) => a - b);
  const out: Segment[] = [];
  let seconds = 0;
  let previous: Segment | undefined;
  for (const [ticks, bpm] of sorted) {
    if (previous) seconds += (ticks - previous.ticks) * previous.secondsPerTick;
    const segment = { ticks, seconds, secondsPerTick: 60 / (bpm * ppq) };
    out.push(segment);
    previous = segment;
  }
  return out;
}

/** The last segment starting at or before `at`, read by `key`. */
function segmentAt(segs: readonly Segment[], key: 'ticks' | 'seconds', at: number): Segment {
  let found = segs[0]!;
  for (const segment of segs) {
    if (segment[key] > at) break;
    found = segment;
  }
  return found;
}

/** Ticks (the file's own written clock) to seconds, and back (A6). */
export function ticksTimeMap(ppq: number, tempos: readonly TempoEvent[]): TimeMap {
  const segs = segments(ppq, tempos);
  return {
    played: (ticks) => {
      const segment = segmentAt(segs, 'ticks', ticks);
      return segment.seconds + (ticks - segment.ticks) * segment.secondsPerTick;
    },
    written: (seconds) => {
      const segment = segmentAt(segs, 'seconds', seconds);
      return segment.ticks + (seconds - segment.seconds) / segment.secondsPerTick;
    },
  };
}
