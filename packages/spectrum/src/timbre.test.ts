import { describe, expect, it } from 'vitest';
import { spectrumOf } from './fft.ts';
import { fingerprintDistance, fingerprintOf, harmonicProfile } from './timbre.ts';
import { harmonic, noise, sine, sum } from './signals.ts';

const sampleRate = 48000;
const frame = 16384;
const profileOf = (x: Float64Array, hz: number, options = {}) =>
  harmonicProfile(spectrumOf(x, sampleRate, frame * 2), hz, { frameSamples: frame, ...options });
const db = (amplitude: number) => 20 * Math.log10(amplitude);

describe('harmonicProfile', () => {
  it('reads each harmonic’s level in dB below the strongest, to within 1.5 dB, and where it is, to within 2 cents', () => {
    const amplitudes = [1, 0.5, 0.25, 0.125, 0.0625, 0.03];
    for (const hz of [110, 220, 330, 440]) {
      const profile = profileOf(harmonic(hz, amplitudes, frame, sampleRate), hz);
      amplitudes.forEach((a, i) => {
        const h = profile.harmonics[i]!;
        expect(h.number).toBe(i + 1);
        expect(h.db, `${hz} h${i + 1}`).toBeGreaterThan(db(a) - 1.5);
        expect(h.db, `${hz} h${i + 1}`).toBeLessThan(db(a) + 1.5);
        expect(Math.abs(h.cents!), `${hz} h${i + 1}`).toBeLessThan(2);
      });
    }
  });

  it('says a harmonic is missing where there is none: a clarinet has no even ones, and nothing above the highest is found', () => {
    const odd = [1, 0, 0.6, 0, 0.4, 0, 0.25];
    const profile = profileOf(harmonic(220, odd, frame, sampleRate), 220);
    expect(profile.harmonics.map((h) => h.db !== null)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('reads the stretch of a string’s partials, each partial sharp of its harmonic by the inharmonicity', () => {
    const b = 0.0004;
    const hz = 220;
    const partials = [1, 2, 3, 4, 5, 6, 7, 8].map((k) =>
      sine(hz * k * Math.sqrt(1 + b * k * k), frame, sampleRate, { amplitude: 1 / k }),
    );
    const profile = profileOf(sum(partials), hz, { toleranceCents: 80 });
    for (let k = 1; k <= 8; k++) {
      const expected = 1200 * Math.log2(Math.sqrt(1 + b * k * k));
      expect(Math.abs(profile.harmonics[k - 1]!.cents! - expected), `h${k}`).toBeLessThan(3);
    }
  });

  it('reads how wide the note is: nothing for a steady sine, more for a pitch that wavers, more for two strings a few Hz apart', () => {
    const hz = 220;
    const steady = profileOf(sine(hz, frame, sampleRate), hz).width;
    const vibrato = (cents: number) => {
      const x = new Float64Array(frame);
      let phase = 0;
      for (let i = 0; i < frame; i++) {
        phase +=
          (2 *
            Math.PI *
            hz *
            2 ** ((cents * Math.sin((2 * Math.PI * 5.5 * i) / sampleRate)) / 1200)) /
          sampleRate;
        x[i] = Math.sin(phase);
      }
      return profileOf(x, hz).width;
    };
    const pair = profileOf(
      sum([sine(hz, frame, sampleRate), sine(hz + 3, frame, sampleRate)]),
      hz + 1.5,
    ).width;
    expect(steady).toBeLessThan(2);
    // The spread of a pitch that wavers by ±a is a/√2, sidebands and all.
    expect(vibrato(20)).toBeGreaterThan(11);
    expect(vibrato(20)).toBeLessThan(17);
    expect(vibrato(50)).toBeGreaterThan(28);
    expect(vibrato(50)).toBeLessThan(40);
    expect(pair).toBeGreaterThan(17);
    expect(pair).toBeLessThan(27);
  });

  it('is no wider for a longer frame of the same steady sound', () => {
    for (const length of [4096, 8192, 16384]) {
      const x = sine(220, length, sampleRate);
      const p = harmonicProfile(spectrumOf(x, sampleRate, length * 2), 220, {
        frameSamples: length,
      });
      expect(p.width, `${length}`).toBeLessThan(2);
    }
  });

  it('gives no harmonic where there is only silence or noise', () => {
    const silent = profileOf(new Float64Array(frame), 220);
    expect(silent.harmonics.every((h) => h.db === null)).toBe(true);
  });

  it('counts as many harmonics as asked for, and stops at the top of the spectrum', () => {
    expect(profileOf(sine(220, frame, sampleRate), 220, { count: 5 }).harmonics).toHaveLength(5);
    expect(
      profileOf(sine(5000, frame, sampleRate), 5000, { count: 12 }).harmonics.filter(
        (h) => h.db !== null,
      ),
    ).toHaveLength(1);
  });
});

/** The synthetic instruments: each a fixed set of harmonic levels, the same at any pitch. */
const instruments: Record<string, number[]> = {
  saw: Array.from({ length: 12 }, (_, i) => 1 / (i + 1)),
  square: Array.from({ length: 12 }, (_, i) => ((i + 1) % 2 ? 1 / (i + 1) : 0)),
  triangle: Array.from({ length: 12 }, (_, i) => ((i + 1) % 2 ? 1 / (i + 1) ** 2 : 0)),
  organ: [1, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05, 0.03],
  clarinet: [1, 0.04, 0.75, 0.05, 0.5, 0.05, 0.3, 0.04, 0.15],
  flute: [1, 0.25, 0.06, 0.02],
  bright: [0.6, 0.8, 1, 1, 0.9, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
};

const fingerprintFor = (name: string, hz: number, gain = 1, snr?: number) => {
  let x = harmonic(
    hz,
    instruments[name]!.map((a) => a * gain),
    frame,
    sampleRate,
  );
  if (snr !== undefined) {
    const signal = Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
    x = sum([x, noise(frame, Math.round(hz), signal / 10 ** (snr / 20))]);
  }
  return fingerprintOf(profileOf(x, hz));
};

describe('fingerprint', () => {
  it('is the harmonic levels in dB below the strongest, a floor where one is missing, and always the same length', () => {
    const f = fingerprintFor('clarinet', 220);
    expect(f).toHaveLength(12);
    expect(Math.max(...f)).toBeCloseTo(0, 6);
    expect(f[1]!).toBeLessThan(-20);
    expect(Math.min(...f)).toBeGreaterThanOrEqual(-60);
  });

  it('is zero from itself, and the same both ways', () => {
    const a = fingerprintFor('organ', 220);
    const b = fingerprintFor('bright', 220);
    expect(fingerprintDistance(a, a)).toBe(0);
    expect(fingerprintDistance(a, b)).toBeCloseTo(fingerprintDistance(b, a), 9);
    expect(fingerprintDistance(a, b)).toBeGreaterThan(0);
  });

  it('holds still for an instrument across pitch and level: near itself at any note from A2 to A5 and any loudness', () => {
    for (const name of Object.keys(instruments)) {
      const reference = fingerprintFor(name, 220);
      for (const hz of [110, 165, 330, 440, 880])
        for (const gain of [1, 0.2])
          expect(
            fingerprintDistance(reference, fingerprintFor(name, hz, gain)),
            `${name} ${hz} ${gain}`,
          ).toBeLessThan(3);
    }
  });

  it('keeps instruments apart: every pair is farther from each other than any is from itself at another pitch', () => {
    const names = Object.keys(instruments);
    let closest = Infinity;
    for (const a of names)
      for (const b of names)
        if (a < b)
          closest = Math.min(
            closest,
            fingerprintDistance(fingerprintFor(a, 220), fingerprintFor(b, 330)),
          );
    expect(closest).toBeGreaterThan(6);
  });

  it('names the instrument of an unknown sound by the nearest of the known, every time, across pitch and level', () => {
    const names = Object.keys(instruments);
    const known = Object.fromEntries(names.map((n) => [n, fingerprintFor(n, 220)]));
    for (const name of names)
      for (const hz of [110, 147, 196, 262, 349, 523])
        for (const gain of [1, 0.1]) {
          const heard = fingerprintFor(name, hz, gain);
          const nearest = names.reduce((best, n) =>
            fingerprintDistance(heard, known[n]!) < fingerprintDistance(heard, known[best]!)
              ? n
              : best,
          );
          expect(nearest, `${name} ${hz} ${gain}`).toBe(name);
        }
  });

  it('still names them with noise 20 dB below the sound', () => {
    const names = Object.keys(instruments);
    const known = Object.fromEntries(names.map((n) => [n, fingerprintFor(n, 220)]));
    let right = 0;
    let total = 0;
    for (const name of names)
      for (const hz of [131, 196, 294, 440]) {
        const heard = fingerprintFor(name, hz, 1, 20);
        const nearest = names.reduce((best, n) =>
          fingerprintDistance(heard, known[n]!) < fingerprintDistance(heard, known[best]!)
            ? n
            : best,
        );
        total++;
        if (nearest === name) right++;
      }
    expect(right / total).toBeGreaterThanOrEqual(0.9);
  });

  it('does not hold for a vowel, whose formants keep to their frequencies as the pitch moves: the limit of the claim', () => {
    const formants = [
      { f: 700, bandwidth: 130, gain: 1 },
      { f: 1220, bandwidth: 90, gain: 0.7 },
      { f: 2600, bandwidth: 160, gain: 0.25 },
    ];
    const gain = (hz: number) =>
      formants.reduce(
        (sum, { f, bandwidth, gain }) => sum + gain / (1 + ((hz - f) / bandwidth) ** 2),
        0.02,
      );
    const vowel = (hz: number) =>
      fingerprintOf(
        profileOf(
          harmonic(
            hz,
            Array.from({ length: 12 }, (_, i) => gain((i + 1) * hz) / (i + 1)),
            frame,
            sampleRate,
          ),
          hz,
        ),
      );
    const moved = [110, 147, 196, 262, 330, 440].map((hz) =>
      fingerprintDistance(vowel(220), vowel(hz)),
    );
    expect(Math.min(...moved)).toBeGreaterThan(5);
    expect(Math.max(...moved)).toBeLessThan(20);
  });
});
