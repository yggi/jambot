import { wrap } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandEnv, band, lookAhead, passBar } from './band.ts';
import { bass } from './bass.ts';
import { barChords } from './chords.ts';
import { comp } from './comp.ts';
import { lead } from './lead.ts';
import { drums } from './drums.ts';
import type { NoteEvent } from './events.ts';
import { SECTION_BARS, barEnergy } from './form.ts';
import type { KeyWish } from './key.ts';
import { type Script, lawBreaks } from './machine.ts';
import { perform } from './perform.ts';
import { planner } from './plan.ts';
import { soundOf } from './sound.ts';
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
const envAt =
  (seed: number) =>
  (bar: number): BandEnv => ({ seed, bar, style: styleAt(bar), wish: wishAt(bar) });
const script = (seed: number, bars = 64): Script<BandEnv, null> =>
  range(bars).map((bar) => ({ env: envAt(seed)(bar), input: null }));

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

  it('plays the drums, the bass, the comp and the lead of each bar, at the energy its section shapes, and reads them the next bar decided (Q5a, T4)', () => {
    let carried = band.initial;
    for (const { env } of script(9)) {
      const { output, carried: after } = band.advance(env, carried, null);
      const { events, sound, ...bar } = output;
      expect(sound).toEqual(soundOf(env.style, bar.barEnergy));
      expect(bar).toMatchObject({ seed: 9, bar: env.bar, style: env.style });
      expect(bar.barEnergy).toBe(
        barEnergy(env.style.energy, bar.plan.section.type, bar.barInSection),
      );
      expect(bar.next).toEqual(after.next!.chords);
      const { written, ...read } = bar;
      expect(written.filter((e) => e.part === 'drums')).toEqual(drums(read));
      const bassline = bass.advance(read, carried.parts.bass, null);
      expect(written.filter((e) => e.part === 'bass')).toEqual(bassline.output);
      expect(after.parts.bass).toBe(bassline.carried);
      const comping = comp.advance(read, carried.parts.comp, null);
      expect(written.filter((e) => e.part === 'chords')).toEqual(comping.output);
      expect(after.parts.comp).toEqual(comping.carried);
      const melody = lead.advance(read, carried.parts.lead, null);
      expect(written.filter((e) => e.part === 'lead')).toEqual(melody.output);
      expect(after.parts.lead).toEqual(melody.carried);
      expect(events).toEqual(written.map((note) => perform(read, note)));
      carried = after;
    }
  });

  it('plays each note at most once per step in every part, over a tour of the presets (F5)', () => {
    let bars = 0;
    for (const seed of range(5))
      for (const { events } of run(seed)) {
        const hits = events.map((e) => `${e.part}:${e.step}:${e.note}`);
        expect(new Set(hits).size).toBe(hits.length);
        bars++;
      }
    expect(bars).toBe(320);
  });

  it('carries register into the bass and the comp, but a phrase into the lead: what a resumed band loses (S2)', () => {
    // A band that passes 20 bars of every 40, as after a stall, against one
    // that plays them all: the first bar after each pass.
    const counts = { bass: 0, chords: 0, lead: 0, bars: 0 };
    for (const seed of range(8)) {
      const at = (bar: number): BandEnv => {
        const preset = PRESETS[Math.floor(bar / 16) % PRESETS.length]!;
        const style = { ...preset.style, energy: 0.8, entropy: 0.3 };
        return { seed, bar, style, wish: { tonic: null, mode: preset.mode } };
      };
      let whole = band.initial;
      let resumed = band.initial;
      for (const bar of range(400)) {
        const played = band.advance(at(bar), whole, null);
        whole = played.carried;
        if (bar % 40 < 20) {
          resumed = passBar(at(bar), resumed);
          continue;
        }
        const back = band.advance(at(bar), resumed, null);
        resumed = back.carried;
        if (bar % 40 !== 20) continue;
        counts.bars++;
        const heard = (events: readonly NoteEvent[], part: string) =>
          events
            .filter((e) => e.part === part)
            .map((e) => `${e.step}:${e.length}:${wrap(e.note, 12)}`)
            .sort()
            .join();
        for (const part of ['bass', 'chords', 'lead'] as const)
          if (heard(played.output.events, part) !== heard(back.output.events, part)) counts[part]++;
      }
    }
    // Bass and comp resume in another register only: the same rhythm and
    // pitch classes. The lead resumes from another phrase.
    expect(counts).toMatchObject({ bars: 80, bass: 0, chords: 0 });
    expect(counts.lead).toBeGreaterThan(40);
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

describe('the look-ahead', () => {
  it('forecasts the plan and chords of the bars the band then plays, from any bar, bar 0 included', () => {
    // The tour changes preset and wish as it goes, so the forecast has to
    // read each bar's style and wish, not only the first's.
    for (const seed of [1, 2, 3]) {
      const whole = run(seed, 96);
      let carried = band.initial;
      for (const { env } of script(seed, 64)) {
        const forecast = lookAhead(carried, envAt(seed), 32);
        expect(forecast).toEqual(
          whole
            .slice(env.bar, env.bar + 32)
            .map(({ bar, plan, chords }) => ({ bar, plan, chords })),
        );
        carried = band.advance(env, carried, null).carried;
      }
      expect(new Set(whole.map((b) => b.plan.key.mode)).size).toBeGreaterThan(1);
    }
  });

  it('forecasts without changing what it is given, and forecasts nothing for no bars', () => {
    const played = band.advance(envAt(4)(0), band.initial, null).carried;
    const given = JSON.parse(JSON.stringify(played)) as typeof played;
    lookAhead(played, envAt(4), 16);
    expect(played).toEqual(given);
    expect(lookAhead(played, envAt(4), 0)).toEqual([]);
  });
});
