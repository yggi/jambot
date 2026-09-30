import { analyse, noise, sum } from '@jambot/spectrum';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Analyse } from './analysis.ts';
import { tone, world } from './fixtures.ts';
import { type Mic, MicDenied } from './mic.ts';
import { HOLD_TICKS, TICK_MS, Tuner } from './tuner.svelte.ts';

/** Start, and let `ticks` looks go by. */
async function listen(w: ReturnType<typeof world>, ticks = 1) {
  const tuner = new Tuner({ mic: w.source, analyse: w.analyseHere });
  await tuner.start();
  await vi.advanceTimersByTimeAsync(TICK_MS * ticks);
  return tuner;
}

beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
afterEach(() => vi.useRealTimers());

describe('the tuner', () => {
  it('is idle until started, and then listening on the default input', async () => {
    const w = world();
    const tuner = new Tuner({ mic: w.source, analyse: w.analyseHere });
    expect(tuner.status).toBe('idle');
    await tuner.start();
    expect(tuner.status).toBe('listening');
    expect(w.log.opened).toEqual([undefined]);
    expect(tuner.inputName).toBe('Test input');
    expect(tuner.devices).toEqual([{ id: 'a', label: 'Built-in' }]);
  });

  it('reads the note heard: its name, how many cents and Hz off, and how loud', async () => {
    const w = world();
    w.heard.signal = tone(440, 12);
    const tuner = await listen(w);
    const reading = tuner.reading!;
    expect(reading.name).toBe('A4');
    expect(reading.midi).toBe(69);
    expect(reading.cents).toBeCloseTo(12, 0);
    expect(reading.hz).toBeCloseTo(440 * 2 ** (12 / 1200), 1);
    expect(reading.offsetHz).toBeCloseTo(reading.hz - 440, 9);
    expect(reading.nearestHz).toBe(440);
    expect(tuner.analysis!.level.db).toBeCloseTo(-9, 0);
    expect(tuner.analysis!.bands.length).toBe(175); // a quarter tone a band, A0 to C8
  });

  it('reads a low note from a long frame and a high one from a short one, asking the microphone for the most it may need', async () => {
    const w = world();
    w.heard.signal = tone(82.41);
    let tuner = await listen(w);
    expect(tuner.analysis!.frame).toBe(16384);
    expect(tuner.reading!.name).toBe('E2');
    tuner.stop();
    const v = world();
    v.heard.signal = tone(880);
    tuner = await listen(v);
    expect(tuner.analysis!.frame).toBe(4096);
    expect(v.log.asked.every((n) => n === 16384)).toBe(true);
  });

  it('measures against the reference pitch chosen, and follows a change of it at once', async () => {
    const w = world();
    w.heard.signal = tone(432);
    const tuner = await listen(w);
    expect(tuner.reading!.name).toBe('A4');
    expect(tuner.reading!.cents).toBeCloseTo(-31.8, 0);
    tuner.reference = 432;
    expect(tuner.reading!.cents).toBeCloseTo(0, 0);
    expect(tuner.reading!.nearestHz).toBe(432);
  });

  it('holds a note through a short gap, and lets it go after a while of silence', async () => {
    const w = world();
    w.heard.signal = tone(440);
    const tuner = await listen(w);
    expect(tuner.reading).not.toBeNull();
    w.heard.signal = new Float64Array(16384);
    await vi.advanceTimersByTimeAsync(TICK_MS * HOLD_TICKS);
    expect(tuner.reading).not.toBeNull();
    await vi.advanceTimersByTimeAsync(TICK_MS);
    expect(tuner.reading).toBeNull();
    expect(tuner.analysis!.level.db).toBe(-Infinity);
  });

  it('moves to the next note when it changes, and reads no pitch in noise', async () => {
    const w = world();
    w.heard.signal = tone(440);
    const tuner = await listen(w);
    w.heard.signal = tone(523.25);
    await vi.advanceTimersByTimeAsync(TICK_MS);
    expect(tuner.reading!.name).toBe('C5');
    w.heard.signal = sum([noise(16384, 3, 0.4)]);
    await vi.advanceTimersByTimeAsync(TICK_MS * (HOLD_TICKS + 1));
    expect(tuner.reading).toBeNull();
  });

  it('skips a look when the last has not come back, and never queues them', async () => {
    const w = world();
    w.heard.signal = tone(440);
    let release: () => void = () => {};
    let started = 0;
    const slow: Analyse = (samples, rate) => {
      started++;
      return new Promise((resolve) => (release = () => resolve(analyse(samples, rate))));
    };
    const tuner = new Tuner({ mic: w.source, analyse: slow });
    await tuner.start();
    await vi.advanceTimersByTimeAsync(TICK_MS * 5);
    expect(started).toBe(1);
    expect(tuner.skipped).toBe(4);
    release();
    await vi.advanceTimersByTimeAsync(TICK_MS);
    expect(started).toBe(2);
    release();
  });

  it('stops: the input is let go, the looks end and what was shown is cleared', async () => {
    const w = world();
    w.heard.signal = tone(440);
    const tuner = await listen(w);
    tuner.stop();
    expect(tuner.status).toBe('idle');
    expect(tuner.reading).toBeNull();
    expect(tuner.analysis).toBeNull();
    expect(w.log.stopped).toBe(1);
    const looks = w.analysed.length;
    await vi.advanceTimersByTimeAsync(TICK_MS * 4);
    expect(w.analysed.length).toBe(looks);
  });

  it('opens the input chosen, and moves to it without a stop by the person', async () => {
    const w = world();
    const tuner = await listen(w);
    await tuner.choose('a');
    expect(w.log.opened).toEqual([undefined, 'a']);
    expect(w.log.stopped).toBe(1);
    expect(tuner.deviceId).toBe('a');
    expect(tuner.status).toBe('listening');
  });

  it('says the microphone is blocked, and how to allow it, when the person refused', async () => {
    const tuner = new Tuner({
      mic: { open: () => Promise.reject(new MicDenied()), devices: () => Promise.resolve([]) },
      analyse: world().analyseHere,
    });
    await tuner.start();
    expect(tuner.status).toBe('denied');
    expect(tuner.message).toMatch(/blocked/);
    expect(tuner.message).toMatch(/site settings/);
  });

  it('says so when there is no input, or it failed, and can be started again', async () => {
    const w = world();
    let fail: Error | null = new DOMException('none', 'NotFoundError');
    const tuner = new Tuner({
      mic: { ...w.source, open: (id) => (fail ? Promise.reject(fail) : w.source.open(id)) },
      analyse: w.analyseHere,
    });
    await tuner.start();
    expect(tuner.status).toBe('failed');
    expect(tuner.message).toMatch(/No microphone/);
    fail = new Error('the device is busy');
    await tuner.start();
    expect(tuner.message).toContain('the device is busy');
    fail = null;
    await tuner.start();
    expect(tuner.status).toBe('listening');
    expect(tuner.message).toBe('');
  });

  it('starts once, however many presses', async () => {
    const w = world();
    const tuner = new Tuner({ mic: w.source, analyse: w.analyseHere });
    await Promise.all([tuner.start(), tuner.start()]);
    await tuner.start();
    expect(w.log.opened).toHaveLength(1);
  });

  it('may be stopped while it is still starting, and then holds the input no longer', async () => {
    const w = world();
    let open: (mic: Mic) => void = () => {};
    const tuner = new Tuner({
      mic: { ...w.source, open: () => new Promise((resolve) => (open = resolve)) },
      analyse: w.analyseHere,
    });
    const starting = tuner.start();
    expect(tuner.status).toBe('starting');
    tuner.stop();
    open(w.mic);
    await starting;
    expect(tuner.status).toBe('idle');
    expect(w.log.stopped).toBe(1);
  });
});
