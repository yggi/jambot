import { METERS, type Meter, even, positions, stepsOf as stepsInBar } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import type { BarEnv } from './bar.ts';
import { DRUM_NOTES, backbeatOf, drums } from './drums.ts';
import {
  DRUM_ROLES,
  type DrumRole,
  SONG_METER,
  type WrittenNote,
  doughProblems,
  writtenProblems,
} from './events.ts';
import { SECTION_BARS, SECTION_TYPES, type SectionType, barEnergy } from './form.ts';
import { INITIAL_KEY } from './key.ts';
import { perform } from './performer.ts';
import { INITIAL_STYLE, PRESETS, type Style } from './style.ts';
import { buildTheme, themeKind } from './themes.ts';

const range = (n: number) => [...Array(n).keys()];
const grid = range(11).map((i) => i / 10);

/** The axes that hold the performer still, at feel 0 (`licenceOf`, T17). */
const STILL = { swing: 0, entropy: 0, artic: 1 } as const;

const envOf = (
  seed: number,
  type: SectionType,
  barInSection: number,
  style: Style,
  energy = barEnergy(style.energy, type, barInSection),
  index = 3,
  meter: Meter = SONG_METER,
): BarEnv => ({
  seed,
  bar: index * SECTION_BARS + barInSection,
  meter,
  plan: {
    section: { type, index },
    meter,
    key: INITIAL_KEY,
    melodic: 'plain',
    theme: buildTheme({
      seed,
      index,
      kind: themeKind(type),
      key: INITIAL_KEY,
      harm: style.harm,
      entropy: style.entropy,
      a: null,
    }),
  },
  barInSection,
  style,
  barEnergy: energy,
  chords: [],
  next: [],
  offer: null,
});

/** The drums as they play: each written hit through the performance. */
const played = (env: BarEnv) => drums(env).map((hit) => perform(env, hit));

const styles = PRESETS.map((p) => ({ ...p.style, entropy: 0.3 }));

/** Every environment the tests sweep: presets, sections, bars, seeds. */
const sweep = styles.flatMap((style) =>
  SECTION_TYPES.flatMap((type) =>
    range(SECTION_BARS).flatMap((bar) => range(3).map((seed) => envOf(seed, type, bar, style))),
  ),
);

const stepsOf = (env: BarEnv, notes: readonly number[]) =>
  new Set(
    drums(env)
      .filter((e) => notes.includes(e.note))
      .map((e) => e.step),
  );

describe('drums', () => {
  it('play the General MIDI drum notes', () => {
    expect(DRUM_NOTES).toEqual({
      kick: 36,
      rim: 37,
      snare: 38,
      closedHat: 42,
      pedalHat: 44,
      openHat: 46,
      ride: 51,
    });
    const gm = new Set<number>(Object.values(DRUM_NOTES));
    for (const env of sweep) for (const e of drums(env)) expect(gm.has(e.note)).toBe(true);
  });

  it('give every sound its own note, so a played drum note names its sound (L7)', () => {
    const notes = Object.values(DRUM_NOTES);
    expect(new Set(notes).size).toBe(notes.length);
  });

  it('write well-formed drum hits, each with its role (T4)', () => {
    for (const env of sweep)
      for (const e of drums(env)) {
        expect(writtenProblems(e)).toEqual([]);
        expect(e.part).toBe('drums');
      }
  });

  it('strike each sound at most once per step, in order (F5)', () => {
    // Where two rules place the same hit, such as a fill over the backbeat,
    // it is one hit, and the louder one. The prototype sends both.
    for (const env of sweep) {
      const events = drums(env);
      const keys = events.map((e) => e.step * 128 + e.note);
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys).toEqual([...keys].sort((a, b) => a - b));
    }
  });

  it('write one hit where two roles meet on a sound and step, the one that plays louder (F5, T4)', () => {
    // Only the snare's roles meet: the backbeat and a fill on step 12, a
    // fill and a ghost on the fill's other steps, from 8 in a build and from
    // 12 elsewhere. The one listed first in DRUM_ROLES stays, and the
    // performance plays it at least as loud.
    const meet = (env: BarEnv): [DrumRole, DrumRole, number[]][] => {
      const from = env.plan.section.type === 'build' ? 8 : 12;
      const fill = range(16 - from).map((i) => from + i);
      return [
        ['backbeat', 'fill', [12]],
        ['fill', 'ghost', fill.filter((s) => s !== 12)],
      ];
    };
    const snare = (role: DrumRole, step: number): WrittenNote => ({
      part: 'drums',
      role,
      step,
      note: DRUM_NOTES.snare,
      length: 1,
    });
    for (const env of sweep.filter((e) => e.plan.section.type !== 'breakdown'))
      for (const [stronger, weaker, steps] of meet(env)) {
        expect(DRUM_ROLES.indexOf(stronger)).toBeLessThan(DRUM_ROLES.indexOf(weaker));
        for (const step of steps)
          expect(perform(env, snare(stronger, step)).velocity).toBeGreaterThanOrEqual(
            perform(env, snare(weaker, step)).velocity,
          );
      }
    // And they do meet: a build's fill runs over its backbeat, which stays.
    const build = envOf(0, 'build', SECTION_BARS - 1, { ...styles[0]!, energy: 1 });
    expect(drums(build).find((e) => e.step === 12 && e.note === DRUM_NOTES.snare)!.role).toBe(
      'backbeat',
    );
  });

  it('are a function of the bar: the same environment plays the same bar (T5)', () => {
    for (const env of sweep.slice(0, 200)) expect(drums({ ...env })).toEqual(drums(env));
  });

  it('play no kick in a breakdown', () => {
    for (const env of sweep.filter((e) => e.plan.section.type === 'breakdown'))
      expect(stepsOf(env, [DRUM_NOTES.kick]).size).toBe(0);
  });

  it('end a build with a snare fill through its last half bar', () => {
    for (const style of styles.map((s) => ({ ...s, ...STILL })))
      for (const seed of range(10)) {
        const env = envOf(seed, 'build', SECTION_BARS - 1, style);
        expect([...stepsOf(env, [DRUM_NOTES.snare])].filter((s) => s >= 8)).toEqual(
          range(8).map((i) => 8 + i),
        );
        // Where the fill meets the backbeat, the louder backbeat stays.
        const energy = barEnergy(style.energy, 'build', SECTION_BARS - 1);
        expect(
          played(env).find((e) => e.step === 12 && e.note === DRUM_NOTES.snare)!.velocity,
        ).toBe(Math.round(106 * (0.65 + 0.35 * energy)));
        // Away from the backbeat, the fill rises. (Held still, so no looseness.)
        const fill = played(env).filter((e) => e.note === DRUM_NOTES.snare && e.step > 12);
        fill.slice(1).forEach((e, i) => expect(e.velocity).toBeGreaterThan(fill[i]!.velocity));
      }
  });

  it('morph with energy: raising it adds kicks, snares and hats, and never takes one away (C4)', () => {
    // The thresholds stay fixed for a section, so as the energy rises notes
    // appear one at a time instead of reshuffling.
    const hats = [DRUM_NOTES.closedHat, DRUM_NOTES.openHat, DRUM_NOTES.ride];
    for (const style of styles)
      for (const type of SECTION_TYPES)
        for (const seed of range(4))
          for (const bar of [2, 5]) {
            let before = {
              kick: new Set<number>(),
              snare: new Set<number>(),
              hats: new Set<number>(),
            };
            for (const energy of grid) {
              const env = envOf(seed, type, bar, style, energy);
              const now = {
                kick: stepsOf(env, [DRUM_NOTES.kick]),
                snare: stepsOf(env, [DRUM_NOTES.snare]),
                hats: stepsOf(env, hats),
              };
              for (const k of ['kick', 'snare', 'hats'] as const)
                for (const step of before[k]) expect(now[k].has(step)).toBe(true);
              before = now;
            }
          }
  });

  it('switch the rim between Euclid patterns at energy ⅓ and ⅔, and otherwise only add to it (C4)', () => {
    // E(3,16), E(5,16) and E(7,16) are not nested, so the rim is the one
    // part that changes pattern as the energy rises: the prototype's choice.
    const fine = range(101).map((i) => i / 100);
    let switches = 0;
    for (const style of styles.map((s) => ({ ...s, sync: 0.9 })))
      for (const type of SECTION_TYPES.filter((t) => t !== 'breakdown'))
        for (const seed of range(6)) {
          let before = new Set<number>();
          let third = 0;
          for (const energy of fine) {
            const now = stepsOf(envOf(seed, type, 2, style, energy), [DRUM_NOTES.rim]);
            const nowThird = Math.min(2, Math.floor(energy * 3));
            const lost = [...before].some((s) => !now.has(s));
            if (nowThird === third) expect(lost).toBe(false);
            else if (lost) switches++;
            before = now;
            third = nowThird;
          }
        }
    expect(switches).toBeGreaterThan(0);
  });

  it('repeat on even bars and vary on odd ones: a groove is a loop', () => {
    for (const style of styles)
      for (const seed of range(5)) {
        const hits = (bar: number) =>
          drums(envOf(seed, 'groove', bar, style)).map((e) => `${e.step}:${e.note}`);
        expect(hits(2)).toEqual(hits(0));
        expect(hits(4)).toEqual(hits(0));
      }
    const varies = styles.some((style) =>
      range(5).some((seed) => {
        const hits = (bar: number) =>
          drums(envOf(seed, 'groove', bar, style)).map((e) => `${e.step}:${e.note}`);
        return hits(1).join() !== hits(0).join();
      }),
    );
    expect(varies).toBe(true);
  });

  it('play their Euclidean percussion from even(k, 16), rotated later', () => {
    // The prototype's euclidHit, for orientation: the same patterns (#8).
    const euclidHit = (s: number, k: number, rot: number) =>
      (((((s - rot) % 16) + 16) % 16) * k) % 16 < k;
    for (const k of range(17))
      for (const rot of range(16))
        expect(positions(even(k, 16, rot))).toEqual(range(16).filter((s) => euclidHit(s, k, rot)));
    // The rim plays one of these patterns whenever it plays.
    const patterns = [3, 5, 7].flatMap((k) =>
      range(4).map((rot) => positions(even(k, 16, rot)).join()),
    );
    for (const env of sweep) {
      const rim = [...stepsOf(env, [DRUM_NOTES.rim])];
      if (rim.length) expect(patterns).toContain(rim.join());
    }
  });

  it('play louder with energy', () => {
    const kick = (energy: number) =>
      played(envOf(1, 'groove', 0, { ...INITIAL_STYLE, ...STILL }, energy)).find(
        (e) => e.step === 0 && e.note === DRUM_NOTES.kick,
      )!;
    expect(kick(1).velocity).toBe(112);
    expect(kick(0.5).velocity).toBe(Math.round(112 * (0.65 + 0.35 * 0.5)));
  });

  it('loosen their velocities from bar to bar as the feel rises, and not when held still (T17)', () => {
    const velocities = (bar: number, style: Partial<Style>) =>
      played(envOf(2, 'groove', bar, { ...INITIAL_STYLE, ...STILL, ...style })).map(
        (e) => e.velocity,
      );
    expect(velocities(2, {})).toEqual(velocities(0, {}));
    for (const loose of [{ swing: 0.3 }, { entropy: 0.3 }, { artic: 0.7 }])
      expect(velocities(2, loose)).not.toEqual(velocities(0, loose));
  });
});

describe('the drums on other meters (#260)', () => {
  const named = Object.entries(METERS) as [string, Meter][];

  it('puts the backbeat on every pulse after the downbeat of a bar of two or three, and the odd ones from four (finite: every meter)', () => {
    const expected: Record<string, number[]> = {
      '3/4': [1, 2],
      '4/4': [1, 3],
      '5/4': [1, 3],
      '5/8': [1],
      '6/8': [1],
      '7/8': [1, 2],
      '9/8': [1, 2],
      '10/8': [1, 3],
      '12/8': [1, 3],
    };
    for (const [name, meter] of named)
      expect([name, backbeatOf(meter)]).toEqual([name, expected[name]]);
  });

  it('writes every hit on a step of the meter’s bar, well formed, in both readings of a pattern (finite: every meter, preset, section type, two bars, two seeds)', () => {
    for (const [name, meter] of named)
      for (const style of styles)
        for (const type of SECTION_TYPES)
          for (const barInSection of [0, SECTION_BARS - 1])
            for (const seed of [0, 1])
              for (const regroup of ['fold', 'cycle'] as const) {
                const env = envOf(seed, type, barInSection, style, undefined, 3, meter);
                for (const hit of drums(env, regroup))
                  expect([name, hit.step, writtenProblems(hit, stepsInBar(meter))]).toEqual([
                    name,
                    hit.step,
                    [],
                  ]);
              }
  });

  it('plays the backbeat snare on the backbeat’s pulse starts and nowhere else (finite: every meter)', () => {
    for (const [name, meter] of named) {
      const starts = new Set(backbeatOf(meter).map((pulse) => meter.heights[pulse]! * 2));
      const style = { ...PRESETS[1]!.style, entropy: 0 };
      const steps = new Set(
        range(3).flatMap((seed) =>
          drums(envOf(seed, 'groove', 2, style, 0.9, 3, meter))
            .filter((hit) => hit.role === 'backbeat')
            .map((hit) => hit.step),
        ),
      );
      expect(steps.size).toBeGreaterThan(0);
      for (const step of steps) expect([name, starts.has(step)]).toEqual([name, true]);
    }
  });

  it('reads the two readings differently in a bar that is not 4/4’s, and the same in 4/4', () => {
    const style = { ...PRESETS[5]!.style, sync: 1, entropy: 0 };
    const env = (meter: Meter, bar: number) => envOf(0, 'groove', bar, style, 0.9, 3, meter);
    expect(drums(env(SONG_METER, 1), 'cycle')).toEqual(drums(env(SONG_METER, 1), 'fold'));
    expect(drums(env(METERS['7/8'], 1), 'cycle')).not.toEqual(drums(env(METERS['7/8'], 1), 'fold'));
    // The default is the cycle, which the owner heard as the better.
    expect(drums(env(METERS['7/8'], 1))).toEqual(drums(env(METERS['7/8'], 1), 'cycle'));
  });

  it('ends a build on a fill that covers the bar’s second half with snares, and starts none before it (finite: every meter)', () => {
    const style = { ...PRESETS[1]!.style, entropy: 0 };
    for (const [name, meter] of named) {
      const steps = stepsInBar(meter);
      const half = 2 * Math.floor(steps / 4);
      const hits = drums(envOf(0, 'build', SECTION_BARS - 1, style, 0.9, 3, meter));
      const snares = new Set(hits.filter((h) => h.note === DRUM_NOTES.snare).map((h) => h.step));
      for (let step = half; step < steps; step++)
        expect([name, step, snares.has(step)]).toEqual([name, step, true]);
      expect([name, hits.filter((h) => h.role === 'fill' && h.step < half)]).toEqual([name, []]);
    }
    expect(2 * Math.floor(stepsInBar(SONG_METER) / 4)).toBe(8);
  });

  it('plays every hit of every meter: a dough note in the bar, well formed, loud between 1 and 127, the fill rising to the bar’s end (finite: every meter, preset, section type)', () => {
    for (const [name, meter] of named)
      for (const style of styles)
        for (const type of SECTION_TYPES) {
          const steps = stepsInBar(meter);
          const env = envOf(1, type, SECTION_BARS - 1, style, undefined, 3, meter);
          for (const hit of drums(env)) {
            const dough = perform(env, hit);
            expect([name, type, hit.step, doughProblems(dough, steps)]).toEqual([
              name,
              type,
              hit.step,
              [],
            ]);
          }
        }
  });
});
