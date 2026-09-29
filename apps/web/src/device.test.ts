import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUS_GAIN } from './audio/output.ts';
import { fakeAudioContext } from './audio/fake-context.ts';
import { Device, FADE_IN, FADE_OUT, VOLUME_KEY, taper } from './device.svelte.ts';

/** A device on a fake audio context, and the gain that is its current bus. */
function device() {
  const fake = fakeAudioContext();
  const made = vi.fn(function () {
    return fake.context;
  });
  vi.stubGlobal('AudioContext', made);
  const bus = () => fake.gains.filter((g) => g.connections.includes(fake.compressors[0])).at(-1)!;
  return { fake, made, bus, device: new Device() };
}

describe('the device’s master volume', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('is a fader position from 0 to 1 that a quiet setting has room in: its square is the gain', () => {
    expect(taper(0)).toBe(0);
    expect(taper(1)).toBe(1);
    expect(taper(0.5)).toBe(0.25);
  });

  it('starts whole, and keeps what was set, for the next visit', () => {
    const { device: first } = device();
    expect(first.volume).toBe(1);
    first.volume = 0.4;
    expect(localStorage.getItem(VOLUME_KEY)).toBe('0.4');
    expect(device().device.volume).toBe(0.4);
  });

  it('ignores what was kept that is no fader position', () => {
    for (const kept of ['loud', '2', '-1', 'NaN', '']) {
      localStorage.setItem(VOLUME_KEY, kept);
      expect(device().device.volume, kept).toBe(1);
    }
  });

  it('opens no audio to set the volume, since a browser starts audio only after a gesture, and gives it to the synth once there is one', () => {
    const { device: d, made, bus } = device();
    d.volume = 0.5;
    expect(made).not.toHaveBeenCalled();
    d.clockOf();
    expect(made).toHaveBeenCalledOnce();
    expect(bus().gain.events.at(-1)).toEqual(['setValueAtTime', BUS_GAIN * 0.25, 0]);
  });

  it('glides what plays to a new volume, without a step to click on', () => {
    const { device: d, bus } = device();
    d.clockOf();
    d.volume = 0.5;
    const [name, target, , tau] = bus().gain.events.at(-1)!;
    expect([name, target]).toEqual(['setTargetAtTime', BUS_GAIN * 0.25]);
    expect(tau).toBeGreaterThan(0);
    expect(tau).toBeLessThan(0.05);
  });
});

describe('the fades in and out of a session', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('mutes at once, so a session joined is silent until it fades in, then rises to the volume', () => {
    const { device: d, bus } = device();
    d.volume = 0.5;
    d.mute();
    expect(bus().gain.events.at(-1)).toEqual(['setValueAtTime', 0, 0]);
    d.fadeIn();
    expect(bus().gain.events.at(-1)).toEqual(['setTargetAtTime', BUS_GAIN * 0.25, 0, FADE_IN / 4]);
  });

  it('fades out over its time before it says it is done, and puts the volume back for what plays next', async () => {
    const { device: d, bus } = device();
    d.clockOf();
    let done = false;
    const fading = d.fadeOut().then(() => (done = true));
    expect(bus().gain.events.at(-1)).toEqual(['setTargetAtTime', 0, 0, FADE_OUT / 4]);
    await vi.advanceTimersByTimeAsync(FADE_OUT * 1000 - 1);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await fading;
    expect(done).toBe(true);
    d.restore();
    expect(bus().gain.events.at(-1)).toEqual(['setValueAtTime', BUS_GAIN, 0]);
  });
});
