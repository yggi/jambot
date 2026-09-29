import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeAudioContext } from './fake-context.ts';
import { BUS_GAIN, webAudioOutput } from './output.ts';

/** A synth on a fake context; its buses are the gains that feed the compressor, the newest last. */
function synth() {
  const fake = fakeAudioContext();
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function () {
      return fake.context;
    }),
  );
  const output = webAudioOutput();
  const buses = () => fake.gains.filter((g) => g.connections.includes(fake.compressors[0]));
  return { fake, output, buses };
}

describe('the built-in synth’s level', () => {
  afterEach(() => void vi.unstubAllGlobals());

  it('opens its bus at the bus gain, whole', () => {
    const { buses } = synth();
    expect(buses()).toHaveLength(1);
    expect(buses()[0]!.gain.value).toBe(BUS_GAIN);
  });

  it('sets the level of what plays now at once, or glides to it, and nothing else', () => {
    const { fake, output, buses } = synth();
    fake.context.currentTime = 3;
    output.level!(0.5, 0);
    expect(buses()[0]!.gain.events.at(-1)).toEqual(['setValueAtTime', BUS_GAIN * 0.5, 3]);
    output.level!(0.25, 2);
    // A glide of two seconds: a time constant of half a second reaches 98 % of the way.
    expect(buses()[0]!.gain.events.at(-1)).toEqual(['setTargetAtTime', BUS_GAIN * 0.25, 3, 0.5]);
    expect(buses()).toHaveLength(1);
  });

  it('opens each bus after a silence at the level last set, so what plays next is not left at zero', () => {
    const { output, buses } = synth();
    output.level!(0, 0);
    output.silence();
    expect(buses()).toHaveLength(2);
    expect(buses()[1]!.gain.value).toBe(0);
    output.level!(0.5, 0);
    expect(buses()[1]!.gain.events.at(-1)).toEqual(['setValueAtTime', BUS_GAIN * 0.5, 0]);
    output.silence();
    expect(buses()[2]!.gain.value).toBe(BUS_GAIN * 0.5);
    // The old bus is left to fade, and no level touches it again.
    expect(buses()[1]!.gain.events.at(-1)).toEqual(['setTargetAtTime', 0, 0, 0.03]);
  });
});
