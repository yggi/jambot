import { compose, joinChord, wrap } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandBar, band } from './band.ts';
import type { BarChord } from './chords.ts';
import { COMP_RANGE, comp, voiceMotion, voicing } from './comp.ts';
import { writtenProblems } from './events.ts';
import { COMPOSER_MODES, keyHelix } from './key.ts';
import { type Script, lawBreaks } from './machine.ts';
import { PRESETS, type Style } from './style.ts';

const range = (n: number) => [...Array(n).keys()];

const styleAt = (bar: number): Style => ({
  ...PRESETS[Math.floor(bar / 8) % PRESETS.length]!.style,
  entropy: (bar % 32) / 32,
});

const tour = (seed: number, bars = 128): BandBar[] => {
  let carried = band.initial;
  return range(bars).map((bar) => {
    const preset = PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
    const next = band.advance(
      {
        seed,
        bar,
        style: styleAt(bar),
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

/** A chord as the composer writes it: a helix of stacked thirds, and maybe a ninth. */
const chordOf = (
  heights: readonly number[],
  tensions: readonly number[] = [],
): BarChord['chord'] => ({
  helix: { cycle: 12, heights },
  tensions,
});

/** Every triad, seventh and ninth on every degree of every key the composer plays. */
const chords: BarChord['chord'][] = COMPOSER_MODES.flatMap((mode) =>
  range(7).flatMap((d) => {
    const scale = keyHelix({ tonic: 0, mode });
    const triad = compose({ cycle: 7, heights: [d, d + 2, d + 4] }, scale).heights;
    const seventh = compose({ cycle: 7, heights: [d, d + 2, d + 4, d + 6] }, scale).heights;
    return [chordOf(triad), chordOf(seventh), chordOf(seventh, [seventh[0]! + 14])];
  }),
);

/** The pitch classes a voicing must hold: every tone, but the fifth of a five-tone chord. */
const heldClasses = (chord: BarChord['chord']) => {
  const tones = joinChord(chord);
  const kept = tones.length >= 5 ? tones.filter((_, i) => i !== 2) : tones;
  return new Set(kept.map((x) => wrap(x, 12)));
};

/** Every close voicing in range: each inversion, from each bottom note 50–63. */
const candidates = (chord: BarChord['chord']) => {
  const classes = [...heldClasses(chord)];
  const out: number[][] = [];
  for (let inversion = 0; inversion < classes.length; inversion++) {
    const order = [...classes.slice(inversion), ...classes.slice(0, inversion)];
    for (let bottom = 50; bottom <= 63; bottom++) {
      if (wrap(bottom, 12) !== order[0]) continue;
      const notes = [bottom];
      for (const pc of order.slice(1)) {
        let n = notes.at(-1)! + 1;
        while (wrap(n, 12) !== pc) n++;
        notes.push(n);
      }
      if (notes.at(-1)! <= 79) out.push(notes);
    }
  }
  return out;
};

describe('the comp', () => {
  it('keeps the machine laws over a tour of the presets (F1)', () => {
    for (const seed of [1, 2]) {
      const script: Script<BandBar, null> = tour(seed, 64).map((env) => ({ env, input: null }));
      expect(lawBreaks(comp, script)).toEqual([]);
    }
  });

  it('voices every chord in 50–79, holding its tones, a ninth chord without its fifth', () => {
    expect(COMP_RANGE).toEqual([50, 79]);
    for (const chord of chords)
      for (const previous of [null, ...chords.slice(0, 12).map((c) => voicing(c, null))]) {
        const notes = voicing(chord, previous);
        expect(Math.min(...notes)).toBeGreaterThanOrEqual(50);
        expect(Math.max(...notes)).toBeLessThanOrEqual(79);
        expect(new Set(notes.map((n) => wrap(n, 12)))).toEqual(heldClasses(chord));
        expect(notes.length).toBe(heldClasses(chord).size);
      }
  });

  it('moves no more than any other close voicing in range, over every pair of chords', () => {
    for (const from of chords) {
      const previous = voicing(from, null);
      for (const to of chords) {
        const chosen = voiceMotion(previous, voicing(to, previous));
        for (const other of candidates(to))
          expect(chosen).toBeLessThanOrEqual(voiceMotion(previous, other));
      }
    }
  });

  it('measures motion as each new note to the nearest old, and half of each old to the nearest new', () => {
    expect(voiceMotion([60, 64, 67], [60, 65, 69])).toBe(3 + 0.5 * 3);
    // A voice that drops out still counts, at half.
    expect(voiceMotion([60, 64, 67, 70], [60, 64, 67])).toBe(1.5);
    expect(voiceMotion([60, 64, 67], [60, 64, 67, 70])).toBe(3 + 0);
  });

  it("chooses the prototype's voicing for every pair of chords, ties included", () => {
    // The prototype's voice(), as the reference: iv are the tones above the
    // root, and a five-tone chord drops its fifth.
    const prototypeVoice = (root: number, iv: number[], pv: number[] | null) => {
      const all = [0, ...iv];
      if (all.length >= 5) all.splice(2, 1);
      const pcs = all.map((x) => (root + x) % 12);
      const N = pcs.length;
      let best: number[] | null = null;
      let bs = 1e9;
      for (let inv = 0; inv < N; inv++) {
        const ord = pcs.slice(inv).concat(pcs.slice(0, inv));
        for (let n0 = 50; n0 <= 63; n0++) {
          if (n0 % 12 !== ord[0]) continue;
          const v = [n0];
          for (let k = 1; k < N; k++) {
            let x = v[k - 1]! + 1;
            while (x % 12 !== ord[k]) x++;
            v.push(x);
          }
          if (v[N - 1]! > 79) continue;
          const score = pv
            ? v.reduce((a, x) => a + Math.min(...pv.map((p) => Math.abs(p - x))), 0) +
              0.5 * pv.reduce((a, p) => a + Math.min(...v.map((x) => Math.abs(p - x))), 0)
            : Math.abs(v.reduce((a, b) => a + b, 0) / N - 62);
          if (score < bs) {
            bs = score;
            best = v;
          }
        }
      }
      return best!;
    };
    const ivOf = (chord: BarChord['chord']) => {
      const tones = joinChord(chord);
      return { root: wrap(tones[0]!, 12), iv: tones.slice(1).map((x) => x - tones[0]!) };
    };
    for (const from of [null, ...chords]) {
      const previous = from && voicing(from, null);
      for (const to of chords) {
        const { root, iv } = ivOf(to);
        expect(voicing(to, previous)).toEqual(prototypeVoice(root, iv, previous));
      }
    }
  });

  it('starts near the middle of its range, with nothing to lead from', () => {
    for (const chord of chords) {
      const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
      const chosen = Math.abs(mean(voicing(chord, null)) - 62);
      for (const other of candidates(chord))
        expect(chosen).toBeLessThanOrEqual(Math.abs(mean(other) - 62));
    }
  });

  it('writes well-formed pads and stabs from the voicings, leading each chord from the one before', () => {
    let last = comp.initial;
    for (const bar of bars.slice(0, 128)) {
      const { carried, output } = comp.advance(bar, last, null);
      let previous = last;
      const voiced = bar.chords.map((c) => (previous = voicing(c.chord, previous)));
      expect(carried).toEqual(voiced.at(-1));
      for (const e of output) {
        expect(writtenProblems(e)).toEqual([]);
        expect(['pad', 'stab']).toContain(e.part);
        expect(e.note).toBeGreaterThanOrEqual(50);
        expect(e.note).toBeLessThanOrEqual(79);
      }
      for (const e of output.filter((x) => x.part === 'pad')) {
        const i = bar.chords.findIndex((c) => c.slot.step === e.step);
        expect(voiced[i]).toContain(e.note);
        // A pad holds to the next chord, or to the end of the bar.
        expect(e.length).toBe((bar.chords[i + 1]?.slot.step ?? 16) - e.step);
      }
      last = carried;
    }
  });

  it('pads legato and stabs staccato', () => {
    const grooves = bars.filter((b) => b.plan.section.type !== 'breakdown' && b.barEnergy > 0.5);
    const with_ = (artic: number) =>
      grooves.flatMap(
        (b) => comp.advance({ ...b, style: { ...b.style, artic } }, null, null).output,
      );
    const legato = with_(0);
    expect(legato.every((e) => e.part === 'pad')).toBe(true);
    // At full legato every chord is padded, held to the next.
    for (const b of grooves.slice(0, 50)) {
      const pads = comp.advance({ ...b, style: { ...b.style, artic: 0 } }, null, null).output;
      expect(new Set(pads.map((e) => e.step))).toEqual(new Set(b.chords.map((c) => c.slot.step)));
    }
    const staccato = with_(1);
    expect(staccato.every((e) => e.part === 'stab')).toBe(true);
    expect(staccato.length).toBeGreaterThan(0);
    // A stab is written for one step; the performance makes it short (T4).
    for (const e of staccato) expect(e.length).toBe(1);
  });

  it('pads quietly through a breakdown and at low energy, and stabs there never', () => {
    const quiet = bars.filter((b) => b.plan.section.type === 'breakdown' || b.barEnergy < 0.3);
    expect(quiet.length).toBeGreaterThan(0);
    for (const b of quiet)
      for (const artic of [0, 0.5, 1])
        for (const e of comp.advance({ ...b, style: { ...b.style, artic } }, null, null).output)
          expect(e.part).toBe('pad');
  });

  it('anticipates the next bar’s chord on its last steps when syncopated', () => {
    let anticipated = 0;
    for (const b of bars.filter((x) => x.plan.section.type !== 'breakdown' && x.barEnergy >= 0.3)) {
      const style = { ...b.style, sync: 1, artic: 1 };
      const events = comp.advance({ ...b, style }, null, null).output;
      let previous: number[] | null = null;
      for (const c of b.chords) previous = voicing(c.chord, previous);
      const next = voicing(b.next[0]!.chord, previous);
      for (const e of events.filter((x) => x.step >= 14)) {
        expect(next).toContain(e.note);
        anticipated++;
      }
    }
    expect(anticipated).toBeGreaterThan(0);
  });
});
