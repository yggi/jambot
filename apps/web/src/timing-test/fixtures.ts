/**
 * A page and its audio, driven by hand, for the timing test's tests: the
 * page's clock is `state.page` in milliseconds, the audio clock reads a
 * fixed pairing of it, and every note the test schedules is kept. Only
 * tests import it.
 */

import { DRUM_NOTES } from '@jambot/engine';
import { vi } from 'vitest';
import type { ClockOffset } from '@yggi/webmidi/core';
import type { Output } from '../audio/output.ts';
import { type KeptStorage, TimingRuns } from './runs.ts';
import { TICK_MS, TimingTest } from './session.svelte.ts';

/** How far the moment heard is ahead of the page's clock, seconds: the pairing the fake output reports. */
export const HEARD_OFFSET = 100;
export const LATENCY = 0.03;

/**
 * A page and its audio, driven by hand: the page's clock is `page`, in
 * milliseconds, the audio clock reads a fixed pairing of it, and every note
 * the test schedules is kept.
 */
export function surroundings() {
  const state = { page: 5000 };
  const plays: { part: string; note: number; velocity: number; seconds: number }[] = [];
  const clicks: number[] = [];
  const silenced = { count: 0 };
  const base: Output = {
    get currentTime() {
      return state.page / 1000 + HEARD_OFFSET + LATENCY;
    },
    latency: LATENCY,
    resume: () => Promise.resolve(),
    play: (part, note, velocity, seconds) => void plays.push({ part, note, velocity, seconds }),
    click: (_weight, seconds) => void clicks.push(seconds),
    silence: () => void silenced.count++,
    info: () => ({ sampleRate: 48000, baseLatency: 0.01, outputLatency: LATENCY }),
    outputTimestamp: () => ({
      contextTime: state.page / 1000 + HEARD_OFFSET + LATENCY,
      performanceTime: state.page,
    }),
  };
  const offset: ClockOffset = {
    update: () => {},
    heardOffset: () => HEARD_OFFSET,
    heard: () => state.page / 1000 + HEARD_OFFSET,
    toDeviceMs: (seconds) => (seconds - HEARD_OFFSET) * 1000,
    fromDeviceMs: (ms) => ms / 1000 + HEARD_OFFSET,
    paired: true,
  };
  return { state, plays, clicks, silenced, base, offset };
}

export function memory(): KeptStorage & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (k) => items.get(k) ?? null,
    setItem: (k, v) => void items.set(k, v),
    removeItem: (k) => void items.delete(k),
  };
}

export function setup() {
  const world = surroundings();
  const storage = memory();
  const runs = new TimingRuns(storage);
  const test = new TimingTest({
    audio: () => ({ base: world.base, offset: world.offset }),
    now: () => world.state.page,
    environment: (info) => ({
      userAgent: 'a test browser',
      language: 'en',
      hardwareConcurrency: 4,
      sampleRate: info?.sampleRate ?? null,
      baseLatency: info?.baseLatency ?? null,
      outputLatency: info?.outputLatency ?? null,
      midiInputs: ['Keys'],
      timeOrigin: 1e12,
    }),
    runs,
    taken: () => '2026-09-29T21:00:00.000Z',
  });
  /** Let the page's clock run on `ms`, a tick at a time. */
  const run = (ms: number) => {
    for (let t = 0; t < ms; t += TICK_MS) {
      world.state.page += TICK_MS;
      vi.advanceTimersByTime(TICK_MS);
    }
  };
  /** The page's time, milliseconds, at which hit `index` of the plan is heard, given the zero the test chose. */
  const heardMs = (index: number) => {
    const zero =
      world.plays.find((p) => p.note === DRUM_NOTES.closedHat)!.seconds + 4 * (60 / test.bpm);
    return (zero + test.plan!.expected[index]!.at - HEARD_OFFSET) * 1000;
  };
  return { ...world, storage, runs, test, run, heardMs };
}
