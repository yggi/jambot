import { describe, expect, it } from 'vitest';
import { fakeAudioContext } from './fake-context.ts';
import { PEAK, voices } from './voices.ts';

/** The built-in synth's voices on a fake context, playing into its destination. */
function synth() {
  const fake = fakeAudioContext();
  const out = fake.context.destination;
  return {
    fake,
    voices: voices(fake.context as unknown as BaseAudioContext, out as unknown as AudioNode),
  };
}

describe('a voice’s own sound in the built-in synth (#497)', () => {
  const sound = {
    wave: 'square',
    lpf: 2400,
    lpq: 3,
    hpf: 80,
    env: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.15 },
    bends: [
      { at: 0.02, cents: 12 },
      { at: 0.04, cents: -12 },
    ],
  } as const;

  it('plays one oscillator of its waveform through its filters, low-pass then high-pass, bent where it bends', () => {
    const { fake, voices: v } = synth();
    v.play('lead', 69, 127, 1, 0.5, { sound });
    expect(fake.oscillators.map((o) => [o.type, o.frequency.value, o.started])).toEqual([
      ['square', 440, 1],
    ]);
    expect(fake.oscillators[0]!.detune.events).toEqual([
      ['setValueAtTime', 12, 1.02],
      ['setValueAtTime', -12, 1.04],
    ]);
    expect(fake.filters.map((f) => [f.type, f.frequency.value, f.Q.value])).toEqual([
      ['highpass', 80, 1],
      ['lowpass', 2400, 3],
    ]);
    // (the oscillator into the low-pass, the low-pass into the high-pass, the high-pass into the note's gain)
    const [high, low] = fake.filters;
    expect(fake.oscillators[0]!.connections).toEqual([low]);
    expect(low!.connections).toEqual([high]);
    expect(high!.connections).toEqual([fake.gains.at(-1)]);
  });

  it('rises to its part’s peak over the attack, falls to the sustain over the decay, holds, and releases', () => {
    const { fake, voices: v } = synth();
    v.play('lead', 69, 127, 1, 0.5, { sound });
    const gain = fake.gains.at(-1)!;
    const peak = PEAK.lead;
    expect(gain.gain.events).toEqual([
      ['setValueAtTime', 0, 1],
      ['linearRampToValueAtTime', peak, 1.02],
      ['linearRampToValueAtTime', peak * 0.7, 1.22],
      ['setValueAtTime', peak * 0.7, 1.5],
      ['linearRampToValueAtTime', 0, 1.65],
    ]);
  });

  it('plays the style’s colour where no sound is given: the lead’s square and triangle', () => {
    const { fake, voices: v } = synth();
    v.play('lead', 69, 127, 1, 0.5, { triangle: 1, square: 0.5, cutoff: 2000, attack: 0.01 });
    expect(fake.oscillators.map((o) => o.type)).toEqual(['square', 'triangle']);
  });
});
