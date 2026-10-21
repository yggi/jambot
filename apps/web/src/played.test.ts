// @vitest-environment node
import type { TimedEvent } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { PLAYED_KEPT, type PlayedEvent, PlayedLog, compareSession } from './played.ts';

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

const NONE = { missing: 0, extra: 0, velocity: 0, length: 0, onset: 0, duration: 0 };

describe('a host’s events against a client’s (#446)', () => {
  it('finds none apart where the client plays the host’s, over the bars both played whole', () => {
    const compared = compareSession(song(0, 9), song(2, 11));
    expect(compared.bars).toEqual({ from: 3, to: 8 });
    expect(compared.events).toBe(6 * 4);
    expect(compared.mismatched).toEqual(NONE);
    expect(compared.differing).toEqual([]);
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
    const { mismatched, differing, largest } = compareSession(song(0, 9), client);
    expect(mismatched).toEqual({
      missing: 1,
      extra: 1,
      velocity: 1,
      length: 1,
      onset: 1,
      duration: 1,
    });
    expect(differing).toHaveLength(6);
    expect(largest.onset).toBeCloseTo(0.0011, 9);
    // Within 1 ms is the bound: 0.9 ms apart is none.
    const close = song(0, 9).map(changed(5, 2, { seconds: 2 * 5 + 1 + 0.0009 }));
    expect(compareSession(song(0, 9), close).mismatched).toEqual(NONE);
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
    expect(log.since(first.next)).toEqual({ events: barOf(2), next: 12 });
    // Past what it keeps, the oldest go: a reader asking from before them gets what is left.
    const many = Array.from({ length: PLAYED_KEPT }, () => timed(barOf(3)[0]!));
    log.push(many);
    const left = log.since(0);
    expect(left.events).toHaveLength(PLAYED_KEPT);
    expect(left.next).toBe(12 + PLAYED_KEPT);
  });
});
