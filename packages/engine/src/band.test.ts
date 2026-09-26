import { describe, expect, it } from 'vitest';
import { type BandEnv, band, passBar } from './band.ts';
import { bass } from './bass.ts';
import { barChords } from './chords.ts';
import { drums } from './drums.ts';
import { SECTION_BARS, barEnergy } from './form.ts';
import type { KeyWish } from './key.ts';
import { type Script, lawBreaks } from './machine.ts';
import { planner } from './plan.ts';
import { INITIAL_STYLE, PRESETS, type Style } from './style.ts';

const range = (n: number) => [...Array(n).keys()];

/**
 * A tour: a new preset every 8 bars, with entropy rising, wishing for each
 * preset's mode from its fourth bar on.
 */
const presetAt = (bar: number) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
const styleAt = (bar: number): Style => ({ ...presetAt(bar).style, entropy: (bar % 32) / 32 });
const wishAt = (bar: number): KeyWish => ({
  tonic: null,
  mode: presetAt(Math.max(0, bar - 3)).mode,
});
const script = (seed: number, bars = 64): Script<BandEnv, null> =>
  range(bars).map((bar) => ({
    env: { seed, bar, style: styleAt(bar), wish: wishAt(bar) },
    input: null,
  }));

const run = (seed: number, bars = 64) => {
  let carried = band.initial;
  return script(seed, bars).map(({ env, input }) => {
    const next = band.advance(env, carried, input);
    carried = next.carried;
    return next.output;
  });
};

describe('the band', () => {
  it('keeps the machine laws over a tour of the presets (F1, Q4a)', () => {
    for (const seed of [1, 2, 3]) expect(lawBreaks(band, script(seed))).toEqual([]);
  });

  it('holds each section for its eight bars (C3)', () => {
    const bars = run(7);
    bars.forEach((b, bar) => {
      expect(b.bar).toBe(bar);
      expect(b.barInSection).toBe(bar % SECTION_BARS);
      expect(b.plan.section.index).toBe(Math.floor(bar / SECTION_BARS));
      if (bar % SECTION_BARS) expect(b.plan.section).toEqual(bars[bar - 1]!.plan.section);
    });
    expect(bars[0]!.plan.section.type).toBe('intro');
  });

  it("plays each section's plan and its theme's chords, each decided when the bar before it is composed (C3)", () => {
    // The style and wish a decision reads are those of the bar composed
    // then: the bar before, or bar 0 for itself.
    const before = (bar: number) => Math.max(0, bar - 1);
    for (const seed of [1, 2, 3]) {
      const bars = run(seed);
      let carried = planner.initial;
      for (const index of range(bars.length / SECTION_BARS)) {
        const first = index * SECTION_BARS;
        const next = planner.advance(
          { seed, index, style: styleAt(before(first)), wish: wishAt(before(first)) },
          carried,
          null,
        );
        carried = next.carried;
        for (const b of range(SECTION_BARS)) {
          const bar = bars[first + b]!;
          expect(bar.plan).toEqual(next.output);
          expect(bar.chords).toEqual(
            barChords({
              seed,
              barInSection: b,
              key: next.output.key,
              theme: next.output.theme,
              harm: styleAt(before(first + b)).harm,
            }),
          );
        }
      }
      // The wish changes mid-section, and the key follows at the boundary.
      expect(new Set(bars.map((b) => b.plan.key.mode)).size).toBeGreaterThan(1);
    }
  });

  it('passes bars without playing them, and plans and decides them as if it had', () => {
    for (const seed of [1, 2, 3]) {
      const whole = run(seed, 40);
      let carried = band.initial;
      for (const { env } of script(seed, 40)) {
        if (env.bar < 21) {
          const passed = passBar(env, carried);
          // A bar passed is not played: the parts carry on from where they were.
          expect(passed.parts).toEqual(carried.parts);
          carried = passed;
        } else {
          const played = band.advance(env, carried, null);
          expect(played.output).toMatchObject({
            plan: whole[env.bar]!.plan,
            chords: whole[env.bar]!.chords,
          });
          carried = played.carried;
        }
      }
    }
  });

  it('plays the drums and the bass of each bar, at the energy its section shapes, and reads them the next bar decided', () => {
    let carried = band.initial;
    for (const { env } of script(9)) {
      const { output, carried: after } = band.advance(env, carried, null);
      const { events, ...bar } = output;
      expect(bar).toMatchObject({ seed: 9, bar: env.bar, style: env.style });
      expect(bar.barEnergy).toBe(
        barEnergy(env.style.energy, bar.plan.section.type, bar.barInSection),
      );
      expect(bar.next).toEqual(after.next!.chords);
      expect(events.filter((e) => e.part === 'drums')).toEqual(drums(bar));
      const bassline = bass.advance(bar, carried.parts.bass, null);
      expect(events.filter((e) => e.part === 'bass')).toEqual(bassline.output);
      expect(after.parts.bass).toBe(bassline.carried);
      carried = after;
    }
  });

  it('refuses to play any bar but the one it decided next, or to start past bar 0', () => {
    const env = {
      seed: 1,
      bar: 3,
      style: INITIAL_STYLE,
      wish: { tonic: null, mode: 'aeolian' },
    } as const;
    expect(() => band.advance(env, band.initial, null)).toThrow(
      /bar 3, but the song starts at bar 0/,
    );
    const first = band.advance({ ...env, bar: 0 }, band.initial, null).carried;
    expect(() => band.advance({ ...env, bar: 2 }, first, null)).toThrow(
      /bar 2, but the band decided bar 1 next/,
    );
    expect(() => passBar({ ...env, bar: 5 }, first)).toThrow(
      /bar 5, but the band decided bar 1 next/,
    );
  });
});
