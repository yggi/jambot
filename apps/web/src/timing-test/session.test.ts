import { DRUM_NOTES } from '@jambot/engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEARD_OFFSET, LATENCY, setup, surroundings } from './fixtures.ts';
import { TEST_BARS, planTest, testEnd } from './pattern.ts';
import { TimingRuns } from './runs.ts';
import { LEAD_SECONDS, TICK_MS, TimingTest } from './session.svelte.ts';

describe('the timing test', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('starting', () => {
    it('schedules the count-in hats and every hit of every bar on the audio clock, ahead, none at once', async () => {
      const { test, plays, base } = setup();
      const before = base.currentTime;
      await test.start();
      const plan = planTest('quarters', 100);
      const hats = plays.filter((p) => p.note === DRUM_NOTES.closedHat);
      const hits = plays.filter((p) => p.note !== DRUM_NOTES.closedHat);
      expect(plays.every((p) => p.part === 'drums')).toBe(true);
      expect(hats).toHaveLength(4);
      expect(hits).toHaveLength(plan.expected.length);
      const zero = before + LEAD_SECONDS + plan.barSeconds;
      hits.forEach((h, i) => {
        expect(h.seconds).toBeCloseTo(zero + plan.expected[i]!.at, 9);
        expect(h.note).toBe(plan.expected[i]!.note);
      });
      hats.forEach((h, k) => expect(h.seconds).toBeCloseTo(zero + plan.countIn[k]!, 9));
      expect(Math.min(...plays.map((p) => p.seconds))).toBeGreaterThan(
        before + LEAD_SECONDS - 1e-9,
      );
      test.stop();
    });

    it('plays the pattern and tempo chosen', async () => {
      const { test, plays } = setup();
      test.pattern = 'syncopated';
      test.bpm = 120;
      await test.start();
      expect(test.plan).toMatchObject({ bpm: 120, pattern: { id: 'syncopated' } });
      expect(plays.filter((p) => p.note !== DRUM_NOTES.closedHat)).toHaveLength(6 * TEST_BARS);
      test.stop();
    });

    it('starts once: a second press while it plays changes nothing', async () => {
      const { test, plays } = setup();
      await test.start();
      const count = plays.length;
      await test.start();
      expect(plays).toHaveLength(count);
      test.stop();
    });

    it('knows where it is on the pattern, negative in the count-in, and nowhere before and after', async () => {
      const { test, run } = setup();
      expect(test.position()).toBeNull();
      await test.start();
      const at = test.position()!;
      expect(at).toBeLessThan(-planTest('quarters', 100).barSeconds);
      run(1000);
      expect(test.position()!).toBeCloseTo(at + 1, 6);
      test.stop();
      expect(test.position()).toBeNull();
    });
  });

  describe('a tap', () => {
    it('is matched at once to the hit it answers, with how far off it was, late positive', async () => {
      const { test, heardMs } = setup();
      await test.start();
      test.tap({
        source: 'the computer keys',
        kind: 'keys',
        note: 60,
        key: 'a',
        velocity: 100,
        eventMs: heardMs(1) + 42,
      });
      expect(test.last).toMatchObject({ verdict: 'late', sound: 'snare', bar: 0, step: 4 });
      expect(test.last!.offsetMs).toBeCloseTo(42, 6);
      test.tap({ source: 'the computer keys', kind: 'keys', eventMs: heardMs(2) - 10 });
      expect(test.last).toMatchObject({ verdict: 'on time', sound: 'kick', step: 8 });
      expect(test.last!.offsetMs).toBeCloseTo(-10, 6);
      test.stop();
    });

    it('answers a hit once: of two taps for one hit the second answers none', async () => {
      const { test, heardMs } = setup();
      await test.start();
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(0) + 5 });
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(0) + 6 });
      expect(test.taps[0]!.hit).toBe(0);
      expect(test.taps[1]!.hit).toBeNull();
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(0) - 1000 });
      expect(test.last).toMatchObject({ verdict: 'no hit', offsetMs: null, sound: null });
      test.stop();
    });

    it('keeps everything the event and the page knew: the event’s time, when the page handled it, the audio clock, where it fell', async () => {
      const { test, heardMs, state, run } = setup();
      await test.start();
      run(3000);
      const eventMs = state.page - 30;
      test.tap({ source: 'Keys', kind: 'midi', note: 64, velocity: 88, eventMs });
      const t = test.taps[0]!;
      expect(t).toMatchObject({
        index: 0,
        source: 'Keys',
        kind: 'midi',
        note: 64,
        velocity: 88,
        key: null,
        eventMs,
        handledMs: state.page,
      });
      expect(t.audioTime).toBeCloseTo(state.page / 1000 + HEARD_OFFSET + LATENCY, 9);
      expect(t.heardAt).toBeCloseTo((eventMs - heardMs(0)) / 1000 + test.plan!.expected[0]!.at, 6);
      test.stop();
    });

    it('is told the phase of by where it falls: before the hits, among them or after them', async () => {
      const { test, heardMs } = setup();
      await test.start();
      const plan = test.plan!;
      const window = test.windowMs;
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(0) - window - 200 });
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(0) });
      test.tap({
        source: 's',
        kind: 'tap',
        eventMs: heardMs(plan.expected.length - 1) + window + 200,
      });
      expect(test.taps.map((t) => t.phase)).toEqual(['count-in', 'test', 'tail']);
      test.stop();
    });

    it('is heard as a soft click, so the player knows it registered', async () => {
      const { test, clicks, heardMs } = setup();
      await test.start();
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(0) });
      expect(clicks).toHaveLength(1);
      test.stop();
    });

    it('is ignored before the test starts and after it stops', async () => {
      const { test } = setup();
      test.tap({ source: 's', kind: 'tap', eventMs: 1 });
      expect(test.taps).toEqual([]);
      await test.start();
      test.stop();
      test.tap({ source: 's', kind: 'tap', eventMs: 1 });
      expect(test.taps).toEqual([]);
    });

    it('adds up as it goes: the taps so far, their mean and how many were on time', async () => {
      const { test, heardMs } = setup();
      await test.start();
      for (const [i, off] of [
        [0, 10],
        [1, 30],
        [2, -20],
      ] as const)
        test.tap({ source: 's', kind: 'tap', eventMs: heardMs(i) + off });
      expect(test.stats.count).toBe(3);
      expect(test.stats.mean).toBeCloseTo(20 / 3, 6);
      expect(test.stats.onTime).toBeCloseTo(2 / 3, 9);
      test.stop();
    });
  });

  describe('the inputs', () => {
    it('take a note struck on MIDI at the message’s own time, and not one released', async () => {
      const { test, heardMs } = setup();
      await test.start();
      test.midi({ on: false, note: 60, velocity: 0, channel: 0 }, 'Keys', heardMs(0));
      expect(test.taps).toEqual([]);
      test.midi({ on: true, note: 60, velocity: 90, channel: 9 }, 'Pads', heardMs(0) + 12);
      expect(test.taps[0]).toMatchObject({ source: 'Pads', kind: 'midi', note: 60, velocity: 90 });
      expect(test.taps[0]!.offsetMs).toBeCloseTo(12, 6);
    });

    it('take a MIDI note with no timestamp at the page’s own time', async () => {
      const { test, state } = setup();
      await test.start();
      test.midi({ on: true, note: 60, velocity: 90, channel: 0 }, 'Keys', undefined);
      expect(test.taps[0]!.eventMs).toBe(state.page);
      test.stop();
    });

    it('take the computer’s keys, by the event’s time stamp, and no other key', async () => {
      const { test, heardMs } = setup();
      const stop = test.listen();
      await test.start();
      const press = (key: string, timeStamp: number, over: KeyboardEventInit = {}) => {
        const e = new KeyboardEvent('keydown', { key, ...over });
        Object.defineProperty(e, 'timeStamp', { value: timeStamp });
        window.dispatchEvent(e);
      };
      press('a', heardMs(0) + 7);
      press('3', heardMs(1) + 9);
      press('z', heardMs(2));
      press('Enter', heardMs(2));
      press('a', heardMs(2), { repeat: true });
      press('a', heardMs(2), { ctrlKey: true });
      expect(test.taps.map((t) => [t.key, t.note, t.kind, t.source])).toEqual([
        ['a', 60, 'keys', 'the computer keys'],
        ['3', 42, 'keys', 'the computer keys'],
      ]);
      expect(test.taps[0]!.eventMs).toBe(heardMs(0) + 7);
      stop();
      press('a', heardMs(3));
      expect(test.taps).toHaveLength(2);
      test.stop();
    });
  });

  describe('finishing', () => {
    it('keeps the run when the last bar and its tail are over: every hit and tap, the clock, the device, the figures', async () => {
      const { test, run, heardMs, storage, runs } = setup();
      await test.start();
      const plan = test.plan!;
      for (const e of plan.expected.slice(0, 5))
        test.tap({
          source: 'the computer keys',
          kind: 'keys',
          key: 'a',
          note: 60,
          eventMs: heardMs(e.index) + 20,
        });
      expect(test.phase).toBe('playing');
      run((LEAD_SECONDS + plan.barSeconds + testEnd(plan)) * 1000 + 200);
      expect(test.phase).toBe('done');
      const kept = test.finished!;
      expect(runs.list()).toEqual([kept]);
      expect(new TimingRuns(storage).list()).toEqual([kept]);
      expect(test.saved).toEqual([kept]);
      expect(kept).toMatchObject({
        format: 'jambot timing test',
        version: 1,
        pattern: 'quarters',
        bpm: 100,
        bars: TEST_BARS,
      });
      expect(kept.expected).toHaveLength(plan.expected.length);
      kept.expected.forEach((e, i) => {
        expect(e.heardMs).toBeCloseTo(heardMs(i), 6);
        expect(e.scheduled).toBeCloseTo(kept.expected[0]!.scheduled + plan.expected[i]!.at, 9);
      });
      expect(kept.taps).toHaveLength(5);
      expect(kept.summary).toMatchObject({
        hits: plan.expected.length,
        answered: 5,
        missed: plan.expected.length - 5,
        extra: 0,
      });
      expect(kept.summary.offsets.mean).toBeCloseTo(20, 6);
      expect(kept.environment).toMatchObject({
        userAgent: 'a test browser',
        sampleRate: 48000,
        outputLatency: LATENCY,
        midiInputs: ['Keys'],
      });
      expect(kept.windowMs).toBeCloseTo(test.windowMs, 9);
      expect(kept.clock.length).toBeGreaterThan(10);
      expect(kept.clock[0]).toMatchObject({ latency: LATENCY, offset: HEARD_OFFSET });
      expect(kept.clock.map((c) => c.pageMs)).toEqual(
        [...kept.clock.map((c) => c.pageMs)].sort((a, b) => a - b),
      );
    });

    it('keeps each run under its own name, and adds them up', async () => {
      const { test, run } = setup();
      for (let n = 0; n < 2; n++) {
        await test.start();
        run((LEAD_SECONDS + (60 / 100) * 4 + testEnd(test.plan!)) * 1000 + 200);
      }
      expect(test.saved).toHaveLength(2);
      expect(new Set(test.saved.map((r) => r.id)).size).toBe(2);
    });

    it('says so when the browser wouldn’t keep it, and still shows the run', async () => {
      const world = surroundings();
      const runs = new TimingRuns(null);
      const test = new TimingTest({
        audio: () => ({ base: world.base, offset: world.offset }),
        now: () => world.state.page,
        environment: () => ({
          userAgent: '',
          language: '',
          hardwareConcurrency: null,
          sampleRate: null,
          baseLatency: null,
          outputLatency: null,
          midiInputs: [],
          timeOrigin: 0,
        }),
        runs,
        taken: () => '2026-09-29T21:00:00.000Z',
      });
      await test.start();
      for (let t = 0; t < 40_000; t += TICK_MS) {
        world.state.page += TICK_MS;
        vi.advanceTimersByTime(TICK_MS);
      }
      expect(test.phase).toBe('done');
      expect(test.finished).not.toBeNull();
      expect(test.notice).toMatch(/download/i);
    });

    it('can go again after a run, with no taps or feedback left from the last', async () => {
      const { test, run, heardMs } = setup();
      await test.start();
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(0) });
      run((LEAD_SECONDS + 4 * 0.6 + testEnd(test.plan!)) * 1000 + 200);
      expect(test.phase).toBe('done');
      await test.start();
      expect(test.phase).toBe('playing');
      expect(test.taps).toEqual([]);
      expect(test.last).toBeNull();
      expect(test.finished).toBeNull();
      test.stop();
    });
  });

  describe('stopping', () => {
    it('silences what is scheduled, keeps nothing and says so', async () => {
      const { test, silenced, runs, heardMs } = setup();
      await test.start();
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(0) });
      test.stop();
      expect(silenced.count).toBe(1);
      expect(test.phase).toBe('idle');
      expect(runs.list()).toEqual([]);
      expect(test.notice).toMatch(/nothing was kept/i);
    });

    it('does nothing when nothing plays', () => {
      const { test, silenced } = setup();
      test.stop();
      expect(silenced.count).toBe(0);
      expect(test.notice).toBeNull();
    });

    it('no longer finishes: the clock running on saves nothing', async () => {
      const { test, run, runs } = setup();
      await test.start();
      test.stop();
      run(60_000);
      expect(runs.list()).toEqual([]);
      expect(test.phase).toBe('idle');
    });
  });

  describe('the runs kept', () => {
    it('can be cleared or dropped one at a time', async () => {
      const { test, run, runs } = setup();
      for (let n = 0; n < 2; n++) {
        await test.start();
        run((LEAD_SECONDS + 4 * 0.6 + testEnd(test.plan!)) * 1000 + 200);
      }
      const [first, second] = test.saved;
      test.removeRun(first!.id);
      expect(test.saved.map((r) => r.id)).toEqual([second!.id]);
      test.clearRuns();
      expect(test.saved).toEqual([]);
      expect(runs.list()).toEqual([]);
    });

    it('are those already kept, when the page opens', async () => {
      const first = setup();
      await first.test.start();
      first.run((LEAD_SECONDS + 4 * 0.6 + testEnd(first.test.plan!)) * 1000 + 200);
      const world = surroundings();
      const reopened = new TimingTest({
        audio: () => ({ base: world.base, offset: world.offset }),
        now: () => 0,
        environment: () => first.test.finished!.environment,
        runs: new TimingRuns(first.storage),
        taken: () => '',
      });
      expect(reopened.saved).toEqual([first.test.finished]);
    });
  });
});
