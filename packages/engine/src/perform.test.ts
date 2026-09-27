import { describe, expect, it } from 'vitest';
import { type BandBar, band } from './band.ts';
import type { BarEnv } from './bar.ts';
import { DRUM_NOTES } from './drums.ts';
import { type DrumRole, PARTS, type WrittenNote, writtenProblems } from './events.ts';
import type { SectionType } from './form.ts';
import { perform } from './perform.ts';
import { PRESETS, type Style } from './style.ts';

const range = (n: number) => [...Array(n).keys()];

/** A tour of the presets, a new one every 8 bars, with entropy rising. */
const tour = (seed: number, bars = 96): BandBar[] => {
  let carried = band.initial;
  return range(bars).map((bar) => {
    const preset = PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
    const style = { ...preset.style, entropy: (bar % 32) / 32 };
    const next = band.advance(
      { seed, bar, style, wish: { tonic: null, mode: preset.mode }, offer: null },
      carried,
      null,
    );
    carried = next.carried;
    return next.output;
  });
};

const bars = [1, 2, 3].flatMap((seed) => tour(seed));

/** A bar of the tour, in another section, at an energy and a style. */
const barOf = (type: SectionType, energy: number, style: Partial<Style> = {}): BarEnv => {
  const b = bars[40]!;
  return {
    ...b,
    plan: { ...b.plan, section: { ...b.plan.section, type } },
    barEnergy: energy,
    style: { ...b.style, swing: 0, ...style },
  };
};

const hit = (role: DrumRole, step: number): WrittenNote => ({
  part: 'drums',
  role,
  step,
  note: DRUM_NOTES.snare,
  length: 1,
});

describe('the performance', () => {
  it('plays every note the band writes, each on the grid and with no velocity of its own (T4, L2)', () => {
    let notes = 0;
    for (const b of bars) {
      for (const note of b.written) expect(writtenProblems(note)).toEqual([]);
      expect(b.events).toEqual(b.written.map((note) => perform(b, note)));
      notes += b.written.length;
    }
    expect(new Set(bars.flatMap((b) => b.written.map((n) => n.part)))).toEqual(new Set(PARTS));
    expect(notes).toBeGreaterThan(8_000);
  });

  it('accents each drum role as the prototype does, at full energy and straight (T4)', () => {
    const groove = barOf('groove', 1, { sync: 0.5 });
    const velocity = (env: BarEnv, role: DrumRole, step: number) =>
      perform(env, hit(role, step)).velocity;
    const accents: [DrumRole, number, number][] = [
      ['kick', 0, 112],
      ['kick', 8, 112],
      ['kick', 3, 92],
      ['backbeat', 4, 100],
      ['backbeat', 12, 106],
      ['ghost', 7, 39],
      ['hat', 0, 78],
      ['hat', 2, 66],
      ['hat', 1, 50],
      ['pedal', 4, 58],
      ['euclid', 5, 72],
      ['fill', 12, 50],
      ['fill', 15, 95],
    ];
    for (const [role, step, accent] of accents) expect(velocity(groove, role, step)).toBe(accent);
    // A build's fill rises through its last half bar, a breakdown's more gently.
    const build = barOf('build', 1);
    expect([8, 12, 15].map((s) => velocity(build, 'fill', s))).toEqual([50, 80, 103]);
    const breakdown = barOf('breakdown', 1);
    expect([8, 15].map((s) => velocity(breakdown, 'fill', s))).toEqual([45, 108]);
    expect(velocity(breakdown, 'hat', 2)).toBe(55);
  });

  it('scales the drums and the bass by the energy, and accents the beat in the bass and the lead (T4)', () => {
    const at = (energy: number, part: 'bass' | 'lead', step: number) =>
      perform(barOf('groove', energy), { part, step, note: 48, length: 2 }).velocity;
    expect([at(1, 'bass', 0), at(1, 'bass', 2), at(0, 'bass', 0), at(0, 'bass', 2)]).toEqual([
      100, 84, 75, 63,
    ]);
    expect([at(1, 'lead', 0), at(1, 'lead', 2), at(0, 'lead', 0)]).toEqual([100, 82, 100]);
    expect(
      perform(barOf('breakdown', 1), { part: 'bass', step: 0, note: 48, length: 4 }).velocity,
    ).toBe(70);
    expect(perform(barOf('groove', 0.5), hit('kick', 0)).velocity).toBe(92);
  });

  it('pads the softer the more the articulation leans to stabs, and stabs louder with energy (T4)', () => {
    const chord = (part: 'pad' | 'stab', env: BarEnv) =>
      perform(env, { part, step: 0, note: 60, length: 1 }).velocity;
    expect(chord('pad', barOf('groove', 1, { artic: 0 }))).toBe(78);
    expect(chord('pad', barOf('groove', 1, { artic: 0.5 }))).toBe(71);
    // A breakdown pads as if nearly legato, whatever the articulation.
    expect(chord('pad', barOf('breakdown', 1, { artic: 1 }))).toBe(76);
    expect([chord('stab', barOf('groove', 1)), chord('stab', barOf('groove', 0))]).toEqual([
      90, 70,
    ]);
  });

  it('holds a legato note for all it is written, and gates it shorter as the articulation rises (T4, L2)', () => {
    const artics = range(11).map((i) => i / 10);
    for (const part of ['bass', 'lead'] as const)
      for (const length of range(16).map((i) => i + 1)) {
        const played = artics.map(
          (artic) =>
            perform(barOf('groove', 1, { artic }), { part, step: 0, note: 60, length }).length,
        );
        expect(played[0]).toBe(length);
        played.forEach((p, i) => {
          expect(p).toBeLessThanOrEqual(length);
          if (i > 0) expect(p).toBeLessThanOrEqual(played[i - 1]!);
        });
      }
    // Staccato, a four-step note: the prototype's gates.
    const staccato = (part: 'bass' | 'lead') =>
      perform(barOf('groove', 1, { artic: 1 }), { part, step: 0, note: 60, length: 4 }).length;
    expect(staccato('bass')).toBeCloseTo(1.28, 9);
    expect(staccato('lead')).toBeCloseTo(1.2, 9);
  });

  it('holds a pad and a drum hit as written, sounds a stab from 2.5 steps to 0.45, and lets a breakdown bass go early (T4, L2)', () => {
    for (const artic of [0, 0.5, 1]) {
      const env = barOf('groove', 1, { artic });
      expect(perform(env, { part: 'pad', step: 0, note: 60, length: 8 }).length).toBe(8);
      expect(perform(env, hit('kick', 0)).length).toBe(1);
      const breakdown = barOf('breakdown', 1, { artic });
      expect(perform(breakdown, { part: 'bass', step: 0, note: 40, length: 8 }).length).toBeCloseTo(
        7.7,
        9,
      );
    }
    const stab = (artic: number) =>
      perform(barOf('groove', 1, { artic }), {
        part: 'stab',
        step: 0,
        note: 60,
        length: 1,
      }).length;
    expect(stab(0)).toBe(2.5);
    expect(stab(1)).toBeCloseTo(0.45, 9);
  });
});
