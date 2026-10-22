// @vitest-environment node
import type { TimedEvent } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  PLAYED_KEPT,
  type PlayedEvent,
  PlayedLog,
  compareSession,
  sessionBreaks,
} from './played.ts';

/** A bar of four events, a step apart, from `bar`'s start at 2 s a bar. */
const barOf = (bar: number): PlayedEvent[] =>
  [36, 42, 38, 42].map((note, i) => ({
    bar,
    part: 'drums',
    step: i * 4,
    note,
    velocity: 100 - i,
    length: 1,
    seconds: 2 * bar + i * 0.5,
    duration: 0.125,
  }));

const song = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => barOf(from + i)).flat();

const NONE = { velocity: 0, length: 0, onset: 0, duration: 0 };
const NONE_LACKED = { host: { events: 0, unexplained: 0 }, client: { events: 0, unexplained: 0 } };

describe('a host’s events against a client’s (#446)', () => {
  it('finds none apart where the client plays the host’s, over the bars both played whole', () => {
    const compared = compareSession(song(0, 9), song(2, 11));
    expect(compared.bars).toEqual({ from: 3, to: 8 });
    expect(compared.events).toBe(6 * 4);
    expect(compared.mismatched).toEqual(NONE);
    expect(compared.lacked).toEqual(NONE_LACKED);
    expect(compared.differing).toEqual([]);
    expect(sessionBreaks(compared)).toEqual([]);
  });

  it('finds what it checks: a velocity one louder, a length, an onset 1.1 ms late, a duration 1 ms longer, an event lacked and one extra', () => {
    const changed = (bar: number, i: number, edit: Partial<PlayedEvent>) => (e: PlayedEvent) =>
      e.bar === bar && e.step === i * 4 ? { ...e, ...edit } : e;
    const client = song(0, 9)
      .map(changed(3, 0, { velocity: 101 }))
      .map(changed(4, 1, { length: 1.5 }))
      .map(changed(5, 2, { seconds: 2 * 5 + 1 + 0.0011 }))
      .map(changed(6, 3, { duration: 0.126 }))
      .filter((e) => !(e.bar === 7 && e.step === 0))
      .concat([{ ...barOf(8)[0]!, note: 49 }]);
    const compared = compareSession(song(0, 9), client);
    const { mismatched, lacked, differing, largest } = compared;
    expect(mismatched).toEqual({ velocity: 1, length: 1, onset: 1, duration: 1 });
    expect(lacked).toEqual({
      host: { events: 1, unexplained: 1 },
      client: { events: 1, unexplained: 1 },
    });
    expect(differing).toHaveLength(6);
    expect(sessionBreaks(compared)).toEqual([
      '1 events both played differ in velocity',
      '1 events both played differ in length',
      '1 events both played differ in onset',
      '1 events both played differ in duration',
      "the host lacks 1 events it didn't drop late",
      "the client lacks 1 events it didn't drop late",
    ]);
    expect(largest.onset).toBeCloseTo(0.0011, 9);
    // Within 1 ms is the bound: 0.9 ms apart is none.
    const close = song(0, 9).map(changed(5, 2, { seconds: 2 * 5 + 1 + 0.0009 }));
    expect(compareSession(song(0, 9), close).mismatched).toEqual(NONE);
  });

  it('explains an event a page lacks by one it dropped late, each dropped once, and breaks the bound on one it didn’t (#462)', () => {
    const lacking = song(0, 9).filter((e) => !(e.bar === 5 && e.step <= 4));
    const dropped = barOf(5).filter((e) => e.step <= 4);
    const explained = compareSession(song(0, 9), lacking, { host: [], client: dropped });
    expect(explained.lacked).toEqual({ ...NONE_LACKED, client: { events: 2, unexplained: 0 } });
    expect(sessionBreaks(explained)).toEqual([]);
    // Dropped by the other page, or once where it lacks two alike, it explains nothing more.
    const elsewhere = compareSession(song(0, 9), lacking, { host: dropped, client: [] });
    expect(elsewhere.lacked.client).toEqual({ events: 2, unexplained: 2 });
    expect(sessionBreaks(elsewhere)).toEqual(["the client lacks 2 events it didn't drop late"]);
    const twice = [...song(0, 9), barOf(6)[0]!];
    const once = compareSession(song(0, 9), twice, { host: [barOf(6)[0]!], client: [] });
    expect(once.lacked.host).toEqual({ events: 1, unexplained: 0 });
    const short = compareSession([...twice, barOf(6)[0]!], song(0, 9), {
      host: [],
      client: [barOf(6)[0]!],
    });
    expect(short.lacked.client).toEqual({ events: 2, unexplained: 1 });
    // A page that dropped late what the other lacks too lacks nothing: both played the rest alike.
    const both = compareSession(lacking, lacking, { host: dropped, client: dropped });
    expect(both.lacked).toEqual(NONE_LACKED);
    expect(both.events).toBeGreaterThan(0);
  });

  it('keeps the latest events played, each numbered, so a reader takes those it hasn’t', () => {
    const log = new PlayedLog();
    const timed = (e: PlayedEvent): TimedEvent => ({
      bar: e.bar,
      seconds: e.seconds,
      duration: e.duration,
      event: {
        part: 'drums',
        step: e.step,
        note: e.note,
        velocity: e.velocity,
        length: e.length,
      } as TimedEvent['event'],
    });
    log.push(song(0, 1).map(timed));
    const first = log.since();
    expect(first.events).toEqual(song(0, 1));
    expect(first.next).toBe(8);
    log.push(barOf(2).map(timed));
    expect(log.since(first.next)).toEqual({ events: barOf(2), next: 12, late: [] });
    // And what was dropped late beside, every one kept, by which event it was.
    log.dropped([{ bar: 2, event: timed(barOf(2)[1]!).event }]);
    expect(log.since(12).late).toEqual([{ bar: 2, part: 'drums', step: 4, note: 42 }]);
    // Past what it keeps, the oldest go: a reader asking from before them gets what is left.
    const many = Array.from({ length: PLAYED_KEPT }, () => timed(barOf(3)[0]!));
    log.push(many);
    const left = log.since(0);
    expect(left.events).toHaveLength(PLAYED_KEPT);
    expect(left.next).toBe(12 + PLAYED_KEPT);
  });
});
