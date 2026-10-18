/**
 * The built-in drum kit: the General MIDI drum notes the band plays, as Web
 * Audio voices. Kick and snare are synthesised; rim, hats and ride are
 * filtered noise. These are the prototype's voices; the claves (75, #397)
 * are noise too, a narrow band, short and woody.
 */

export interface DrumKit {
  /** Strike a General MIDI drum note at a time on the context's clock. */
  play(note: number, velocity: number, seconds: number): void;
}

export function drumKit(ctx: BaseAudioContext, out: AudioNode): DrumKit {
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  /** A percussive envelope: up in `attack` seconds, then down over `decay`. */
  const envelope = (gain: GainNode, t: number, peak: number, attack: number, decay: number) => {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };
  const noiseFrom = (t: number, duration: number) => {
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.start(t, Math.random() * 0.5);
    source.stop(t + duration);
    return source;
  };

  const kick = (t: number, v: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    envelope(gain, t, 0.9 * v, 0.003, 0.32);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + 0.4);
  };
  const snare = (t: number, v: number) => {
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
    envelope(gain, t, 0.5 * v, 0.002, 0.18);
    noiseFrom(t, 0.25).connect(filter).connect(gain).connect(out);
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'triangle';
    body.frequency.value = 185;
    envelope(bodyGain, t, 0.3 * v, 0.002, 0.08);
    body.connect(bodyGain).connect(out);
    body.start(t);
    body.stop(t + 0.15);
  };
  /** Filtered noise: band-passed when a Q is given, else high-passed. */
  const metal = (t: number, v: number, frequency: number, decay: number, q?: number) => {
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = q ? 'bandpass' : 'highpass';
    filter.frequency.value = frequency;
    if (q) filter.Q.value = q;
    envelope(gain, t, v, 0.001, decay);
    noiseFrom(t, decay + 0.05)
      .connect(filter)
      .connect(gain)
      .connect(out);
  };

  return {
    play(note, velocity, t) {
      const v = velocity / 127;
      if (note === 36) kick(t, v);
      else if (note === 38) snare(t, v);
      else if (note === 37) metal(t, 0.35 * v, 2600, 0.035, 4);
      else if (note === 75) metal(t, 0.4 * v, 2100, 0.025, 14);
      else if (note === 51) metal(t, 0.13 * v, 5200, 0.45, 1.2);
      else if (note === 44) metal(t, 0.1 * v, 7500, 0.03);
      else metal(t, 0.22 * v, 7000, note === 46 ? 0.3 : 0.045);
    },
  };
}
