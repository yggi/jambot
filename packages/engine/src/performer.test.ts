import { stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandBar, band } from './band.ts';
import type { BarEnv } from './bar.ts';
import { DRUM_NOTES } from './drums.ts';
import { baseLengthOf, baseVelocityOf } from './dynamics.ts';
import { type DrumRole, PARTS, type WrittenNote, writtenProblems } from './events.ts';
import type { SectionType } from './form.ts';
import { feelOf } from './licence.ts';
import { LEAD_LEVEL, type StatedNote, composedLevel, perform, performStated } from './performer.ts';
import { presetSwing } from './repository.ts';
import { timbreOf } from './sound.ts';
import { PRESETS, type Style } from './style.ts';
import { type MeterSwing, STRAIGHT, shareOfLean } from './swing.ts';

/** A style and the swing of its meter. */
type Swung = Style & { readonly swing: MeterSwing };
/** Swings that weigh half and all (`swingWeight`): a 16th triplet, and an 8th one. */
const HALF: MeterSwing = { level: '16n', share: 2 / 3 };
const FULL: MeterSwing = { level: '8n', share: 2 / 3 };

const range = (n: number) => [...Array(n).keys()];

/** A tour of the presets, a new one every 8 bars, with entropy rising. */
const tour = (seed: number, bars = 96): BandBar[] => {
  let carried = band.initial;
  return range(bars).map((bar) => {
    const preset = PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
    const style = { ...preset.style, entropy: (bar % 32) / 32 };
    // The level is asked a bar ahead: a section's plan takes it on the bar before (#360).
    const ahead = presetSwing(PRESETS[Math.floor((bar + 1) / 8) % PRESETS.length]!)!.level;
    const swing = { level: ahead, share: presetSwing(preset)!.share };
    const next = band.advance(
      {
        seed,
        bar,
        style,
        swing,
        wish: { tonic: null, mode: preset.mode, melodic: null },
        offer: null,
      },
      carried,
      null,
    );
    carried = next.carried;
    return next.output;
  });
};

const bars = [1, 2, 3].flatMap((seed) => tour(seed));

/**
 * A bar of the tour, in another section, at an energy and a style: held
 * still, at feel 0 (straight, entropy 0, articulation 1), unless the style
 * given loosens it.
 */
const barOf = (type: SectionType, energy: number, given: Partial<Swung> = {}): BarEnv => {
  const b = bars[40]!;
  const { swing = STRAIGHT, ...style } = given;
  return {
    ...b,
    plan: { ...b.plan, section: { ...b.plan.section, type }, swing: swing.level },
    barEnergy: energy,
    style: { ...b.style, entropy: 0, artic: 1, ...style },
    swing,
  };
};

/**
 * A written note's base, velocity and length, as the performer plays it at
 * feel 0: where the articulation is below 1 the feel is never 0, so the
 * prototype's literals for articulation are the base's (`dynamics.ts`, T19).
 */
const baseOf = (env: BarEnv, written: WrittenNote) => ({
  velocity: Math.max(1, Math.min(127, Math.round(baseVelocityOf(env, written)))),
  length: baseLengthOf(env, written),
});

const hit = (role: DrumRole, step: number): WrittenNote => ({
  part: 'drums',
  role,
  step,
  note: DRUM_NOTES.snare,
  length: 1,
});

describe('the performer', () => {
  it('plays every note the band writes, each on the grid and with no notation of its own (T4, L2)', () => {
    let notes = 0;
    for (const b of bars) {
      for (const note of b.written) expect(writtenProblems(note)).toEqual([]);
      expect(b.dough).toEqual(b.written.map((note) => perform(b, note)));
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

  it('plays a lead note with an accent on the lead’s level, in place of the beat’s accent (T4, U4)', () => {
    expect(LEAD_LEVEL).toBe(91);
    const at = (step: number, accent?: number) =>
      perform(barOf('groove', 0.5), {
        part: 'lead',
        step,
        note: 72,
        length: 2,
        ...(accent === undefined ? {} : { accent }),
      }).velocity;
    expect([at(0, 0), at(2, 0), at(0, 12), at(2, -30)]).toEqual([91, 91, 103, 61]);
    expect([at(0, 60), at(2, -120)]).toEqual([127, 1]);
    expect([at(0), at(2)]).toEqual([100, 82]);
  });

  it('adds every other part’s written accent on top of what it would have played, never in place of it (#107)', () => {
    const env = barOf('groove', 0.7, {});
    const notes: WrittenNote[] = [
      { part: 'bass', step: 2, note: 48, length: 2 },
      { part: 'pad', step: 2, note: 60, length: 2 },
      { part: 'stab', step: 2, note: 60, length: 2 },
    ];
    for (const written of notes) {
      const plain = perform(env, written).velocity;
      for (const accent of [-30, -1, 0, 1, 30, 90])
        expect(perform(env, { ...written, accent }).velocity).toBe(
          Math.max(1, Math.min(127, plain + accent)),
        );
    }
    const drumHit = hit('kick', 2);
    const plainKick = perform(env, drumHit).velocity;
    for (const accent of [-30, 0, 30])
      expect(perform(env, { ...drumHit, accent }).velocity).toBe(
        Math.max(1, Math.min(127, plainKick + accent)),
      );
  });

  it('pads the softer the more the articulation leans to stabs, and stabs louder with energy (T4)', () => {
    const chord = (part: 'pad' | 'stab', env: BarEnv) =>
      baseOf(env, { part, step: 0, note: 60, length: 1 }).velocity;
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
            baseOf(barOf('groove', 1, { artic }), { part, step: 0, note: 60, length }).length,
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
      expect(baseOf(env, { part: 'pad', step: 0, note: 60, length: 8 }).length).toBe(8);
      expect(baseOf(env, hit('kick', 0)).length).toBe(1);
      const breakdown = barOf('breakdown', 1, { artic });
      expect(baseOf(breakdown, { part: 'bass', step: 0, note: 40, length: 8 }).length).toBeCloseTo(
        7.7,
        9,
      );
    }
    const stab = (artic: number) =>
      baseOf(barOf('groove', 1, { artic }), {
        part: 'stab',
        step: 0,
        note: 60,
        length: 1,
      }).length;
    expect(stab(0)).toBe(2.5);
    expect(stab(1)).toBeCloseTo(0.45, 9);
  });

  it('gives every dough note its part’s timbre, the way `timbreOf` colours it', () => {
    const env = barOf('groove', 0.7, {
      artic: 0.4,
      swing: { level: '8n', share: shareOfLean(0.2) },
    });
    expect(perform(env, { part: 'lead', step: 0, note: 64, length: 4 })).toMatchObject(
      timbreOf('lead', env.style, env.swing, env.barEnergy),
    );
    expect(perform(env, { part: 'bass', step: 0, note: 40, length: 4 })).toMatchObject(
      timbreOf('bass', env.style, env.swing, env.barEnergy),
    );
    expect(perform(env, { part: 'pad', step: 0, note: 60, length: 4 })).toMatchObject(
      timbreOf('pad', env.style, env.swing, env.barEnergy),
    );
    expect(perform(env, hit('kick', 0))).toMatchObject(
      timbreOf('drums', env.style, env.swing, env.barEnergy),
    );
  });

  it('carries a drum hit’s role and a lead note’s accent through to the dough note, unchanged (L7)', () => {
    const env = barOf('groove', 1, {});
    for (const role of ['kick', 'backbeat', 'ghost', 'hat', 'pedal', 'euclid', 'fill'] as const)
      expect(perform(env, hit(role, 4)).role).toBe(role);
    expect(perform(env, { part: 'lead', step: 0, note: 64, length: 4, accent: 6 }).accent).toBe(6);
    expect(perform(env, { part: 'lead', step: 0, note: 64, length: 4 }).accent).toBeUndefined();
    expect('role' in perform(env, { part: 'lead', step: 0, note: 64, length: 4 })).toBe(false);
  });

  it('gives the synth gain velocity over 127, the MIDI velocity kept as its own key (#129)', () => {
    const env = barOf('groove', 1, {});
    const note = perform(env, { part: 'lead', step: 0, note: 64, length: 4 });
    expect(note.gain).toBeCloseTo(note.velocity / 127, 9);
  });

  it('gives every part a licence, velocity and length alike, that widens with the feel and holds still at 0 (#107, #147, T17)', () => {
    // The same written note, over every bar of a tour (each licence
    // stream's only key besides step and note), held still and at the
    // loosest feel: a spread of 0 is no licence, and every part has one.
    const still: Partial<Swung> = { swing: STRAIGHT, entropy: 0, artic: 1 };
    const loosest: Partial<Swung> = { swing: FULL, entropy: 1, artic: 0 };
    const envAt = (bar: number, style: Partial<Swung>): BarEnv => ({
      ...barOf('groove', 0.7, style),
      bar,
    });
    const spreadOf = (values: readonly number[]) => Math.max(...values) - Math.min(...values);
    const spreadAt = (written: WrittenNote, style: Partial<Swung>, field: 'velocity' | 'length') =>
      spreadOf(range(64).map((bar) => perform(envAt(bar, style), written)[field]));

    const notes: WrittenNote[] = [
      { part: 'bass', step: 4, note: 60, length: 2 },
      { part: 'pad', step: 4, note: 60, length: 2 },
      { part: 'stab', step: 4, note: 60, length: 2 },
      { part: 'lead', step: 4, note: 60, length: 2 },
    ];
    const drumHit = hit('hat', 4);
    for (const written of [...notes, drumHit])
      for (const field of ['velocity', 'length'] as const) {
        expect(spreadAt(written, still, field)).toBe(0);
        // Each axis the feel reads loosens it alone, from the still corner.
        for (const loose of [{ swing: FULL }, { entropy: 1 }, { artic: 0 }])
          expect(spreadAt(written, { ...still, ...loose }, field)).toBeGreaterThan(0);
        expect(spreadAt(written, loosest, field)).toBeGreaterThan(0);
      }

    // Over every note of the tour, the licence's width is the feel's: velocity
    // within 12 × feel of the base and its accent, widened by the own accent
    // (14 × feel down, 10 × feel up, #170); length within 15 % × feel under
    // the base.
    for (const b of bars) {
      const feel = feelOf(b.style, b.swing);
      for (const written of b.written) {
        const { velocity, length } = perform(b, written);
        const accent = written.accent ?? 0;
        const base =
          written.part === 'lead' && written.accent !== undefined
            ? LEAD_LEVEL + accent
            : baseVelocityOf(b, written) + accent;
        const clamped = (v: number) => Math.max(1, Math.min(127, v));
        expect(velocity).toBeGreaterThanOrEqual(Math.floor(clamped(base - 26 * feel)));
        expect(velocity).toBeLessThanOrEqual(Math.ceil(clamped(base + 22 * feel)));
        const gated = baseLengthOf(b, written);
        expect(length).toBeLessThanOrEqual(gated);
        expect(length).toBeGreaterThanOrEqual(gated * (1 - 0.15 * feel) - 1e-12);
      }
    }

    // Length only ever gates a little shorter: it never exceeds what the
    // base already set, for any part, however loose the feel.
    for (const style of [loosest, { ...still, artic: 0 }, { ...still, swing: FULL }])
      for (const written of [...notes, drumHit])
        for (const bar of range(64)) {
          const env = envAt(bar, style);
          expect(perform(env, written).length).toBeLessThanOrEqual(baseLengthOf(env, written));
        }
  });

  it('draws its own accent within the licence: still at feel 0, wider as the feel rises, ghosts off the 16th and a push on the off-8th, in any register (#170, T17)', () => {
    const still: Partial<Swung> = { swing: STRAIGHT, entropy: 0, artic: 1 };
    const envAt = (bar: number, style: Partial<Swung>): BarEnv => ({
      ...barOf('groove', 0.7, style),
      bar,
    });
    const deltas = (part: 'bass' | 'lead', step: number, style: Partial<Swung>, note = 48) =>
      range(64).map((bar) => {
        const env = envAt(bar, style);
        const written: WrittenNote = { part, step, note, length: 2 };
        return perform(env, written).velocity - Math.round(baseVelocityOf(env, written));
      });
    const spread = (v: number[]) => Math.max(...v) - Math.min(...v);
    // Still at feel 0; the licence's and the own accent's spread together grows with it.
    for (const step of [0, 1, 2, 3]) {
      expect(deltas('bass', step, still)).toEqual(range(64).map(() => 0));
      const half = spread(deltas('bass', step, { ...still, swing: HALF }));
      const full = spread(deltas('bass', step, { ...still, swing: FULL }));
      expect(full).toBeGreaterThan(half);
    }
    // Ghosts fall and pushes rise, beyond the symmetric licence's reach.
    const loose: Partial<Swung> = { swing: FULL, entropy: 1, artic: 1 };
    const looseBar = barOf('groove', 1, loose);
    const feel = feelOf(looseBar.style, looseBar.swing);
    expect(Math.min(...deltas('bass', 1, loose))).toBeLessThan(-12 * feel);
    expect(Math.max(...deltas('bass', 2, loose))).toBeGreaterThan(12 * feel);
    // Invariant under register (S2, S3): a pitched note's accent ignores its pitch.
    for (const part of ['bass', 'lead'] as const)
      for (const step of range(16))
        expect(deltas(part, step, loose, 36)).toEqual(deltas(part, step, loose, 84));
    // A written accent is never lost (T18): it moves the note by exactly itself.
    const env = envAt(5, loose);
    const written: WrittenNote = { part: 'bass', step: 6, note: 48, length: 2 };
    const plain = perform(env, written).velocity;
    for (const accent of [-20, 0, 15])
      expect(perform(env, { ...written, accent }).velocity).toBe(
        Math.max(1, Math.min(127, plain + accent)),
      );
  });

  it('plays a note as a text states it as it plays the note written: the same velocity and length, every note of the tour, accented past MIDI’s 1 to 127 too, and every motif’s accent on the lead’s level (#405, #433, decision 037)', () => {
    const clamp = (v: number) => Math.max(1, Math.min(127, Math.round(v)));
    /** A written note as a text states it: its line, step, pitch and role, its velocity at feel 0 as MIDI says it, and its sounding length at feel 0. */
    const stated = (env: BarEnv, w: WrittenNote): StatedNote => ({
      part: w.part,
      step: w.step,
      note: w.note,
      ...(w.role !== undefined && { role: w.role }),
      velocity: clamp(composedLevel(env, w)),
      length: baseLengthOf(env, w),
    });
    // A written accent is in the level stated, not carried apart: the band's dough note carries it.
    const played = (env: BarEnv, w: WrittenNote) => {
      const { accent, ...rest } = perform(env, w);
      expect(accent).toBe(w.accent);
      return rest;
    };
    let notes = 0;
    let loose = 0;
    let past = 0;
    for (const b of bars) {
      // Every note the band writes, the same written far past either end of MIDI's velocities (a part's base keeps its
      // fraction there), and a motif's lead note on every step at accents from past the lead's level's floor to past its ceiling.
      const pushed = b.written.flatMap((w) =>
        [-200, 200].map((by): WrittenNote => ({ ...w, accent: (w.accent ?? 0) + by })),
      );
      const motif = range(stepsOf(b.meter)).flatMap((step) =>
        [-120, -91, -90, -60, -31, -9, -1, 0, 1, 9, 17, 36, 37, 48, 60].map(
          (accent): WrittenNote => ({
            part: 'lead',
            step,
            note: 64 + (step % 12),
            length: 2,
            accent,
          }),
        ),
      );
      for (const w of [...b.written, ...pushed, ...motif]) {
        expect(performStated(b, stated(b, w))).toEqual(played(b, w));
        if (w.accent !== undefined && (w.accent > 36 || w.accent < -90)) past++;
        if (perform(b, w).velocity !== clamp(composedLevel(b, w))) loose++;
        notes++;
      }
    }
    expect(notes).toBeGreaterThan(8_000);
    expect(past).toBeGreaterThan(8_000);
    // The feel is played, not lost: most velocities part from the level stated at feel 0.
    expect(loose / notes).toBeGreaterThan(0.5);
  });

  it('composes a note’s level as the performer plays it at feel 0: its base and its written accent, a motif’s on the lead’s level (U4, #405)', () => {
    const still = barOf('groove', 0.6);
    expect(feelOf(still.style, still.swing)).toBe(0);
    for (const w of [
      hit('kick', 0),
      hit('ghost', 3),
      { part: 'bass', step: 2, note: 48, length: 2 },
      { part: 'pad', step: 0, note: 60, length: 16, accent: 5 },
      { part: 'lead', step: 0, note: 72, length: 2 },
      { part: 'lead', step: 2, note: 72, length: 2, accent: 12 },
      { part: 'lead', step: 0, note: 72, length: 2, accent: -30 },
    ] as WrittenNote[])
      expect(perform(still, w).velocity).toBe(
        Math.max(1, Math.min(127, Math.round(composedLevel(still, w)))),
      );
    expect(composedLevel(still, { part: 'lead', step: 2, note: 72, length: 2, accent: 12 })).toBe(
      LEAD_LEVEL + 12,
    );
  });

  it('composes a level past MIDI’s 1 to 127 clamped to it, before the feel: a motif’s accent on the lead’s level, and a part’s base with its fraction kept (#433)', () => {
    const lead = (accent: number): WrittenNote => ({
      part: 'lead',
      step: 1,
      note: 72,
      length: 2,
      accent,
    });
    const still = barOf('groove', 0.7);
    expect([36, 37, 60, -90, -91, -200].map((a) => composedLevel(still, lead(a)))).toEqual([
      127, 127, 127, 1, 1, 1,
    ]);
    // a part's base as the bar gives it, its whole velocity clamped and its fraction kept, which MIDI's rounding takes
    const bass: WrittenNote = { part: 'bass', step: 1, note: 48, length: 2 };
    const base = baseVelocityOf(still, bass);
    const fraction = base - Math.round(base);
    expect(fraction).not.toBe(0);
    expect(composedLevel(still, { ...bass, accent: 200 })).toBeCloseTo(127 + fraction, 12);
    expect(composedLevel(still, { ...bass, accent: -200 })).toBeCloseTo(1 + fraction, 12);
    // so a motif's note past 127 breathes with the feel, as every other note does, instead of sticking at 127
    const loose = (bar: number) => ({
      ...barOf('groove', 0.7, { swing: FULL, entropy: 1, artic: 0 }),
      bar,
    });
    const velocities = range(32).map((bar) => perform(loose(bar), lead(60)).velocity);
    expect(Math.min(...velocities)).toBeLessThan(127 - 10);
    expect(velocities).toEqual(range(32).map((bar) => perform(loose(bar), lead(36)).velocity));
  });
});
