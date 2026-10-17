import { METERS, type Meter, meterOnSteps, stepsOf, wrap } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandBar, band } from './band.ts';
import { BASS_RANGE, bass, bassBlend, patternsOn } from './bass.ts';
import { chordAt } from './chords.ts';
import { writtenProblems } from './events.ts';
import { type Script, lawBreaks } from './machine.ts';
import { PRESETS, type Style } from './style.ts';
import { type MeterSwing, STRAIGHT, shareOfLean } from './swing.ts';

const range = (n: number) => [...Array(n).keys()];

/** A tour of the presets, a new one every 8 bars, with entropy rising. */
const styleAt = (bar: number): Style => ({
  ...PRESETS[Math.floor(bar / 8) % PRESETS.length]!.style,
  entropy: (bar % 32) / 32,
});

const presetAt = (bar: number) => PRESETS[Math.floor(bar / 8) % PRESETS.length]!;

/** The bars a band plays over the tour: each is what the bass reads. */
const tour = (seed: number, bars = 128): BandBar[] => {
  let carried = band.initial;
  return range(bars).map((bar) => {
    const preset = presetAt(bar);
    const next = band.advance(
      {
        seed,
        bar,
        style: styleAt(bar),
        // The level is asked a bar ahead: a section's plan takes it on the bar before (#360).
        swing: { level: presetAt(bar + 1).swing.level, share: preset.swing.share },
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

/** The bass over bars in order, with the note it carried into each. */
const play = (over: readonly BandBar[]) => {
  let last = bass.initial;
  return over.map((bar) => {
    const before = last;
    const { carried, output } = bass.advance(bar, last, null);
    last = carried;
    return { bar, before, events: output };
  });
};
const played = [1, 2, 3].flatMap((seed) => play(tour(seed)));

const rootOf = (chord: { chord: { helix: { heights: readonly number[] } } }) =>
  wrap(chord.chord.helix.heights[0]!, 12);

describe('the bass', () => {
  it('keeps the machine laws over a tour of the presets (F1)', () => {
    for (const seed of [1, 2]) {
      const script: Script<BandBar, null> = tour(seed, 64).map((env) => ({ env, input: null }));
      expect(lawBreaks(bass, script)).toEqual([]);
    }
  });

  it('writes well-formed bass events, every note in 33–57', () => {
    expect(BASS_RANGE).toEqual([33, 57]);
    for (const { events } of played)
      for (const e of events) {
        expect(writtenProblems(e)).toEqual([]);
        expect(e.part).toBe('bass');
        expect(e.note).toBeGreaterThanOrEqual(33);
        expect(e.note).toBeLessThanOrEqual(57);
      }
  });

  it('plays the new root on every chord change, unless it pumps', () => {
    let checked = 0;
    for (const { bar, events } of played) {
      if (
        bassBlend(bar.style, bar.swing, bar.barEnergy).pump >= 0.45 &&
        bar.plan.section.type !== 'breakdown'
      )
        continue;
      for (const chord of bar.chords) {
        const there = events.find((e) => e.step === chord.slot.step);
        expect(there && wrap(there.note, 12)).toBe(rootOf(chord));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(300);
  });

  it('walks every beat, leading into a chord change by a semitone', () => {
    let walks = 0;
    let approaches = 0;
    for (const { bar, events } of played) {
      if (
        bar.plan.section.type === 'breakdown' ||
        bassBlend(bar.style, bar.swing, bar.barEnergy).walk <= 0.5
      )
        continue;
      walks++;
      for (const beat of [0, 4, 8, 12]) expect(events.some((e) => e.step === beat)).toBe(true);
      for (const beat of [0, 4, 8, 12]) {
        const change =
          beat === 12
            ? bar.next[0]!
            : bar.chords.find((c) => c.slot.step === beat + 4 && c.slot.step !== 0);
        if (!change || bar.chords.some((c) => c.slot.step === beat)) continue;
        const note = events.find((e) => e.step === beat)!.note;
        expect([1, 11]).toContain(wrap(note - rootOf(change), 12));
        approaches++;
      }
    }
    expect(walks).toBeGreaterThan(10);
    expect(approaches).toBeGreaterThan(10);
  });

  it('pumps offbeat eighths where the style asks for it', () => {
    let offbeats = 0;
    let downbeats = 0;
    for (const { bar, events } of played) {
      if (
        bar.plan.section.type === 'breakdown' ||
        bassBlend(bar.style, bar.swing, bar.barEnergy).pump < 0.6
      )
        continue;
      offbeats += events.filter((e) => e.step % 4 === 2).length;
      downbeats += events.filter((e) => e.step % 4 === 0).length;
    }
    expect(offbeats).toBeGreaterThan(downbeats);
    expect(downbeats).toBeGreaterThan(0);
  });

  it('goes to the nearest octave of each note, from the note before, or an octave above it', () => {
    for (const { before, events } of played) {
      let last = before;
      for (const e of events) {
        const nearest = range(20)
          .map((i) => 33 + i)
          .filter((n) => wrap(n - e.note, 12) === 0)
          .sort((a, b) => Math.abs(a - last) - Math.abs(b - last) || a - b)[0]!;
        expect([nearest, nearest + 12]).toContain(e.note);
        last = nearest;
      }
    }
  });

  it('holds each chord through a breakdown, one root per chord, written to the next', () => {
    let breakdowns = 0;
    for (const { bar, events } of played) {
      if (bar.plan.section.type !== 'breakdown') continue;
      breakdowns++;
      expect(events.map((e) => e.step)).toEqual(bar.chords.map((c) => c.slot.step));
      events.forEach((e, i) => {
        const end = bar.chords[i + 1]?.slot.step ?? 16;
        expect(e.length).toBe(end - e.step);
        expect(wrap(e.note, 12)).toBe(rootOf(chordAt(bar.chords, e.step)));
      });
    }
    expect(breakdowns).toBeGreaterThan(0);
  });

  it('forces the root on a chord change exactly while the pump is under 0.45, and every beat while the walk is over 0.5', () => {
    // The tour's bars, restyled to either side of each threshold.
    const grooves = bars.filter((b) => b.plan.section.type !== 'breakdown').slice(0, 300);
    const restyled = (over: Partial<Style>, swing: MeterSwing = STRAIGHT) =>
      grooves.map((b) => {
        const style = { ...b.style, ...over };
        return { ...b, style, swing, barEnergy: 0.5 };
      });
    const rootsHeld = (over: Partial<Style>) =>
      restyled(over).every((b) => {
        const events = bass.advance(b, 40, null).output;
        return b.chords.every((c) =>
          events.some((e) => e.step === c.slot.step && wrap(e.note, 12) === rootOf(c)),
        );
      });
    // pump = (1 − harm) · artic · (1 − eighth) · (1 − sync), straight: 0.44 and 0.46.
    const pump = (x: number): Partial<Style> => ({ harm: 0, sync: 0, artic: x });
    expect(bassBlend({ ...grooves[0]!.style, ...pump(0.44) }, STRAIGHT, 0.5).pump).toBeCloseTo(
      0.44,
      9,
    );
    expect(rootsHeld(pump(0.44))).toBe(true);
    expect(rootsHeld(pump(0.46))).toBe(false);
    const beatsHeld = (swing: MeterSwing) =>
      restyled(WALKING, swing).every((b) => {
        const steps = new Set(bass.advance(b, 40, null).output.map((e) => e.step));
        return [0, 4, 8, 12].every((beat) => steps.has(beat));
      });
    // walk = eighth · min(1, harm · 1.5), the eighth the 8ths' lean: 0.52 and 0.48.
    const WALKING: Partial<Style> = { harm: 1, sync: 0.5 };
    const walk = (x: number): MeterSwing => ({ level: '8n', share: shareOfLean(x) });
    expect(bassBlend({ ...grooves[0]!.style, ...WALKING }, walk(0.52), 0.5).walk).toBeCloseTo(
      0.52,
      9,
    );
    expect(beatsHeld(walk(0.52))).toBe(true);
    expect(beatsHeld(walk(0.48))).toBe(false);
    // On the 16ths the same share brings in no walk (the owner’s ruling on #360).
    expect(
      bassBlend({ ...grooves[0]!.style, ...WALKING }, { ...walk(1), level: '16n' }, 0.5).walk,
    ).toBe(0);
  });

  it('takes the lower octave where two are as near', () => {
    // From E2 (40), B♭ is 6 down (34) or 6 up (46).
    const breakdown = bars.find((b) => b.plan.section.type === 'breakdown')!;
    const bFlat = {
      ...breakdown.chords[0]!,
      chord: { helix: { cycle: 12, heights: [10, 14, 17] }, tensions: [] },
    };
    const env = { ...breakdown, chords: [bFlat] };
    expect(bass.advance(env, 40, null).output.map((e) => e.note)).toEqual([34]);
  });

  it('carries only the last note it played, so a bar replays from it', () => {
    for (const { bar, before, events } of played.slice(0, 64))
      expect(bass.advance(bar, before, null).output).toEqual(events);
    expect(bass.initial).toBe(40);
  });
});

describe('the bass on other meters (#260)', () => {
  const named = Object.entries(METERS) as [string, Meter][];
  const someBars = bars.filter((_, i) => i % 3 === 0);

  it('keeps 4/4’s five patterns as they were written (finite: each pattern, every step)', () => {
    const t = patternsOn(METERS['4/4']);
    expect(t.root).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 0, 0, 0]);
    expect(t.pump).toEqual([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]);
    expect(t.eight).toEqual([1, 0, 0.8, 0, 0.8, 0, 0.8, 0, 0.9, 0, 0.8, 0, 0.8, 0, 0.8, 0]);
    expect(t.funk).toEqual([1, 0, 0, 0.7, 0, 0, 0.8, 0.4, 0, 0, 0.7, 0.5, 0, 0.3, 0.8, 0]);
    expect(t.walk).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
  });

  it('writes every pattern over the meter’s steps, the downbeat on, the walk on the pulses and the pump between them (finite: every meter, every pattern)', () => {
    for (const [name, meter] of named) {
      const t = patternsOn(meter, 3);
      for (const pattern of Object.values(t))
        expect([name, pattern.length]).toEqual([name, stepsOf(meter)]);
      expect([name, t.root[0], t.eight[0], t.walk[0]]).toEqual([name, 1, 1, 1]);
      const walk = t.walk.flatMap((w, step) => (w > 0 ? [step] : []));
      expect([name, walk]).toEqual([name, meterOnSteps(meter).heights]);
      for (const s of t.pump.flatMap((w, i) => (w > 0 ? [i] : []))) expect(walk).not.toContain(s);
    }
  });

  it('writes a well formed line in every meter, every note within the bar, in range, bar after bar (finite: every meter, every 3rd bar of the tour)', () => {
    for (const [name, meter] of named) {
      const steps = stepsOf(meter);
      let last = bass.initial;
      for (const bar of someBars) {
        const out = bass.advance({ ...bar, meter }, last, null);
        last = out.carried;
        expect([name, out.output.length > 0]).toEqual([name, true]);
        let at = -1;
        for (const n of out.output) {
          expect([name, n.step, writtenProblems(n, steps)]).toEqual([name, n.step, []]);
          expect(n.step).toBeGreaterThan(at);
          at = n.step;
          expect(n.step + n.length).toBeLessThanOrEqual(steps);
          expect(n.note).toBeGreaterThanOrEqual(BASS_RANGE[0]);
          expect(n.note).toBeLessThanOrEqual(BASS_RANGE[1]);
        }
      }
    }
  });
});
