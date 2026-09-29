import {
  type Motif,
  alteredDegree,
  chromaticStep,
  motifProblems,
  heightOf,
  joinChord,
  positions,
  wrap,
} from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandBar, band } from './band.ts';
import { chordAt } from './chords.ts';
import { writtenProblems } from './events.ts';
import { keyHelix } from './key.ts';
import recorded from './lead.fixture.json';
import { LEAD_RANGE, type LeadCarried, lead, leadRests, phraseParams } from './lead.ts';
import { SECTION_TYPES } from './form.ts';
import { type Script, lawBreaks } from './machine.ts';
import type { Offer } from './muse.ts';
import { PRESETS, type Style } from './style.ts';

const range = (n: number) => [...Array(n).keys()];

const styleAt = (bar: number): Style => ({
  ...PRESETS[Math.floor(bar / 8) % PRESETS.length]!.style,
  energy: 0.7,
  entropy: (bar % 32) / 32,
});

const tour = (seed: number, bars = 160, style = styleAt): BandBar[] => {
  let carried = band.initial;
  return range(bars).map((bar) => {
    const preset = PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
    const next = band.advance(
      { seed, bar, style: style(bar), wish: { tonic: null, mode: preset.mode }, offer: null },
      carried,
      null,
    );
    carried = next.carried;
    return next.output;
  });
};

/** The lead over bars in order, with what it carried into each. */
const play = (over: readonly BandBar[]) => {
  let carried: LeadCarried = lead.initial;
  return over.map((bar) => {
    const before = carried;
    const next = lead.advance(bar, carried, null);
    carried = next.carried;
    return { bar, before, after: carried, events: next.output };
  });
};

const played = [1, 2, 3, 4].flatMap((seed) => play(tour(seed)));
const playing = played.filter((p) => p.events.length > 0);

const classesOf = (tones: readonly number[]) => tones.map((x) => wrap(x, 12));

describe('the lead', () => {
  it('keeps the machine laws over a tour of the presets (F1)', () => {
    for (const seed of [1, 2]) {
      const script: Script<BandBar, null> = tour(seed, 64).map((env) => ({ env, input: null }));
      expect(lawBreaks(lead, script)).toEqual([]);
    }
  });

  it('writes well-formed lead events, every note in 60–86', () => {
    expect(LEAD_RANGE).toEqual([60, 86]);
    expect(playing.length).toBeGreaterThan(200);
    for (const { events } of playing)
      for (const e of events) {
        expect(writtenProblems(e)).toEqual([]);
        expect(e.part).toBe('lead');
        expect(e.note).toBeGreaterThanOrEqual(60);
        expect(e.note).toBeLessThanOrEqual(86);
      }
  });

  it('keeps every note in 60–86 over a grid of styles, where its phrases are widest', () => {
    // The widest phrases come at high energy and entropy. A phrase that no
    // octave shift fits folds its stragglers note by note.
    const run = (seed: number, style: Style, bars: number) => {
      let carried = band.initial;
      return range(bars).flatMap((bar) => {
        const next = band.advance(
          { seed, bar, style, wish: { tonic: null, mode: 'aeolian' }, offer: null },
          carried,
          null,
        );
        carried = next.carried;
        return next.output.dough
          .filter((e) => e.part === 'lead')
          .map((e) => ({ bar, note: e.note }));
      });
    };
    // Seed 9, bar 61, which played 86 84 89 79 81 72 69 when the octave
    // folds undid each other.
    const repro = {
      swing: 1,
      sync: 1 / 3,
      harm: 0,
      artic: 1 / 3,
      energy: 0.8,
      entropy: 0.9,
      bpm: 120,
    };
    const bar61 = run(9, repro, 62).filter((n) => n.bar === 61);
    expect(bar61.length).toBeGreaterThan(0);
    const outside: string[] = [];
    for (const n of bar61) if (n.note < 60 || n.note > 86) outside.push(`repro: ${n.note}`);
    const grid = [0, 0.5, 1];
    let notes = 0;
    for (const swing of grid)
      for (const sync of grid)
        for (const harm of grid)
          for (const artic of grid)
            for (const [energy, entropy] of [
              [0.8, 0.9],
              [1, 1],
            ] as const)
              for (const seed of range(3)) {
                const style = { swing, sync, harm, artic, energy, entropy, bpm: 120 };
                for (const n of run(seed, style, 64)) {
                  notes++;
                  if (n.note < 60 || n.note > 86)
                    outside.push(`${JSON.stringify(style)} ${seed}: ${n.note}`);
                }
              }
    expect(outside.slice(0, 5)).toEqual([]);
    expect(notes).toBeGreaterThan(10000);
  });

  it('plays the same melody on an engine whose Math.sin is one ulp off, either way (T5)', () => {
    // sin(π/6) times an odd span lies one ulp from a half, so an unquantised
    // round would flip. Energy and entropy summing to 1 give span 5.
    const steady = (): Style => ({ ...PRESETS[0]!.style, energy: 0.7, entropy: 0.3 });
    const bars = range(40).flatMap((seed) => tour(seed, 48, steady));
    const melody = () => play(bars).map((p) => p.events.map((e) => `${e.step}:${e.note}`).join());
    const exact = melody();
    const sin = Math.sin;
    for (const ulp of [1 + 2 ** -52, 1 - 2 ** -53]) {
      Math.sin = (x: number) => sin(x) * ulp;
      try {
        expect(melody()).toEqual(exact);
      } finally {
        Math.sin = sin;
      }
    }
  });

  it('rests in an intro, a breakdown and below energy 0.4, and forgets its phrase there', () => {
    let rests = 0;
    for (const { bar, events, after } of played) {
      const resting =
        bar.plan.section.type === 'intro' ||
        bar.plan.section.type === 'breakdown' ||
        bar.barEnergy < 0.4;
      expect(events.length === 0).toBe(resting);
      if (resting) {
        rests++;
        expect(after.phrase).toBeNull();
      }
    }
    expect(rests).toBeGreaterThan(0);
  });

  it('plays from energy 0.4 up, and not below', () => {
    const grooves = playing.map((p) => p.bar).slice(0, 100);
    const at = (energy: number) =>
      grooves.map((b) => lead.advance({ ...b, barEnergy: energy }, lead.initial, null).output);
    expect(at(0.41).every((events) => events.length > 0)).toBe(true);
    expect(at(0.39).every((events) => events.length === 0)).toBe(true);
  });

  it('plays at least three notes in a shape, two in a variation, in order, each written to the next', () => {
    for (const { bar, events } of playing) {
      expect(events.length).toBeGreaterThanOrEqual(bar.barInSection % 2 === 0 ? 3 : 2);
      const steps = events.map((e) => e.step);
      expect([...steps].sort((a, b) => a - b)).toEqual(steps);
      expect(new Set(steps).size).toBe(steps.length);
      events.forEach((e, i) => expect(e.length).toBe((events[i + 1]?.step ?? 16) - e.step));
    }
  });

  it('lands on a chord tone on the half bar and where a chord starts, and walks the key between', () => {
    for (const { bar, events } of playing) {
      const inKey = new Set(positions(keyHelix(bar.plan.key)));
      for (const e of events) {
        const chord = chordAt(bar.chords, e.step);
        const tones = new Set(classesOf(joinChord(chord.chord)));
        const onChord = e.step % 8 === 0 || bar.chords.some((c) => c.slot.step === e.step);
        if (onChord) expect(tones.has(wrap(e.note, 12))).toBe(true);
        else expect(inKey.has(wrap(e.note, 12)) || tones.has(wrap(e.note, 12))).toBe(true);
      }
    }
  });

  it('ends bar 2 of each phrase on the third or fifth, and bar 4 on the root, over every chord it meets', () => {
    let open = 0;
    let closed = 0;
    for (const { bar, events } of playing) {
      const phase = bar.barInSection % 4;
      if (phase !== 1 && phase !== 3) continue;
      const lastNote = events.at(-1)!;
      const tones = joinChord(chordAt(bar.chords, lastNote.step).chord);
      const allowed = phase === 3 ? [tones[0]!] : [tones[1]!, tones[2]!];
      expect(classesOf(allowed)).toContain(wrap(lastNote.note, 12));
      if (phase === 3) closed++;
      else open++;
    }
    expect(open).toBeGreaterThan(50);
    expect(closed).toBeGreaterThan(50);
  });

  it('plays a phrase of four bars: a shape, a variation, the shape again, a variation', () => {
    let phrases = 0;
    for (let i = 0; i + 3 < played.length; i++) {
      const bars = played.slice(i, i + 4);
      if (bars[0]!.bar.barInSection % 4 !== 0 || bars.some((b) => b.events.length === 0)) continue;
      if (bars.some((b) => b.bar.plan !== bars[0]!.bar.plan)) continue;
      phrases++;
      const shape = bars[0]!.after.phrase!;
      expect(bars[1]!.after.phrase).toEqual(shape);
      expect(bars[2]!.after.phrase).toEqual(shape);
      // Bars 1 and 3 play the shape's rhythm; the variations may drop its last note.
      const onsets = shape.onsets.filter((_, i) => shape.degrees[i] !== null);
      for (const b of [bars[0]!, bars[2]!]) expect(b.events.map((e) => e.step)).toEqual(onsets);
      for (const b of [bars[1]!, bars[3]!]) {
        const steps = b.events.map((e) => e.step);
        expect(onsets.slice(0, steps.length)).toEqual(steps);
        expect(onsets.length - steps.length).toBeLessThanOrEqual(1);
      }
    }
    expect(phrases).toBeGreaterThan(20);
  });

  it("brings a theme's melody back with its harmony, while the style stays near it (Q8)", () => {
    // A steady style: every return of a theme plays the shape it played before.
    const steady = (): Style => ({ ...PRESETS[0]!.style, energy: 0.9, entropy: 0 });
    let returns = 0;
    for (const seed of range(6)) {
      const run = play(tour(seed, 160, steady));
      const first = new Map<number, unknown>();
      for (const { bar, after } of run) {
        if (bar.barInSection !== 0 || !after.phrase) continue;
        const theme = bar.plan.theme.index;
        if (first.has(theme)) {
          expect(after.phrase).toEqual(first.get(theme));
          returns++;
        } else first.set(theme, after.phrase);
      }
    }
    expect(returns).toBeGreaterThan(5);
  });

  it('carries its phrases and its themes’ melodies as motifs of a bar, a rest first where the bar starts silent (U4)', () => {
    let late = 0;
    for (const { after } of played) {
      const shapes = [after.phrase, ...Object.values(after.melodies).map((m) => m!.shape)];
      for (const shape of shapes) {
        if (!shape) continue;
        expect(motifProblems(shape)).toEqual([]);
        expect(shape.cycle).toBe(16);
        expect(shape.accidentals.every((a) => a === 0)).toBe(true);
        expect(shape.onsets[0]).toBe(0);
        if (shape.degrees[0] === null) late++;
        expect(shape.degrees.slice(1).every((d) => d !== null)).toBe(true);
      }
    }
    expect(late).toBeGreaterThan(0);
  });

  it('starts each phrase from the chord tone nearest where it left off', () => {
    for (const { bar, before, events } of playing) {
      if (bar.barInSection % 4 !== 0) continue;
      const first = events[0]!;
      const tones = classesOf(joinChord(chordAt(bar.chords, first.step).chord));
      const nearest = range(13)
        .map((i) => before.last - 6 + i)
        .filter((n) => tones.includes(wrap(n, 12)))
        .sort((a, b) => Math.abs(a - before.last) - Math.abs(b - before.last) || a - b)[0]!;
      expect(wrap(first.note - nearest, 12)).toBe(0);
    }
  });
});

/**
 * What the lead writes over every preset, seeds 1 to 3 and 32 bars from the
 * song's start, at entropy 0.3: per preset and seed, one string per bar, each
 * note `step:note:length`, and `:accent` where it has one.
 */
const recording = () =>
  Object.fromEntries(
    PRESETS.map((preset) => [
      preset.name,
      Object.fromEntries(
        [1, 2, 3].map((seed) => {
          let carried = band.initial;
          const bars = range(32).map((bar) => {
            const next = band.advance(
              {
                seed,
                bar,
                style: { ...preset.style, entropy: 0.3 },
                wish: { tonic: null, mode: preset.mode },
                offer: null,
              },
              carried,
              null,
            );
            carried = next.carried;
            return next.output.written
              .filter((e) => e.part === 'lead')
              .map((e) =>
                [e.step, e.note, e.length, ...('accent' in e ? [e.accent] : [])].join(':'),
              )
              .join(' ');
          });
          return [String(seed), bars];
        }),
      ),
    ]),
  );

describe('what the lead writes', () => {
  it('is the recorded notes, note for note, over every preset, three seeds and 32 bars', () => {
    // The recording pins every phrase parameter and the order of every draw:
    // a change to what the lead plays fails here, and a change meant to is
    // re-recorded on purpose, as `JSON.stringify(recording(), null, 2)`.
    const notes = (bars: readonly string[]) => bars.join(' ').split(' ').filter(Boolean).length;
    const playedIn = Object.values(recorded).filter((seeds) =>
      Object.values(seeds).some((bars) => notes(bars) > 0),
    );
    expect(playedIn.length).toBeGreaterThanOrEqual(PRESETS.length - 1);
    expect(Object.keys(recorded)).toEqual(PRESETS.map((p) => p.name));
    expect(recording()).toEqual(recorded);
  });
});

describe('the phrase parameters', () => {
  const grid = range(21).map((i) => i / 20);
  const ascending = (xs: readonly number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]!);
  /** A bar of each preset from the band, its chords included. */
  const barsOf = PRESETS.map((preset) => {
    const bars = tour(1, 16, () => ({ ...preset.style, entropy: 0.3 }));
    return { preset, bar: bars.find((b) => b.chords.length > 1) ?? bars[8]! };
  });
  const at = (bar: BandBar, energy: number, entropy: number) =>
    phraseParams({ ...bar, barEnergy: energy, style: { ...bar.style, entropy } });

  it('fill with the bar’s energy: density from 0.25 to 0.75, a pulse of 3 to 8 hits, over every preset', () => {
    for (const { bar } of barsOf)
      for (const entropy of grid) {
        const over = grid.map((energy) => at(bar, energy, entropy));
        expect(over.map((p) => p.density)).toEqual(grid.map((e) => 0.25 + 0.5 * e));
        expect(ascending(over.map((p) => p.pulse.length))).toBe(true);
        expect([over[0]!.pulse.length, over.at(-1)!.pulse.length]).toEqual([3, 8]);
        for (const p of over) {
          expect(p.pulse.every((s) => Number.isInteger(s) && s >= 0 && s < 16)).toBe(true);
          expect(p.grooveMix).toBe(bar.style.sync);
        }
      }
  });

  it('widen the span from 2 to 8 degrees with energy and entropy, over every preset', () => {
    for (const { bar } of barsOf) {
      for (const entropy of grid)
        expect(ascending(grid.map((energy) => at(bar, energy, entropy).span))).toBe(true);
      for (const energy of grid)
        expect(ascending(grid.map((entropy) => at(bar, energy, entropy).span))).toBe(true);
      expect([at(bar, 0, 0).span, at(bar, 1, 1).span]).toEqual([2, 8]);
    }
  });

  it('turn and nudge more with entropy, and leap only above 0.5, over every preset', () => {
    for (const { bar } of barsOf)
      for (const energy of grid) {
        const over = grid.map((entropy) => at(bar, energy, entropy));
        expect(over.map((p) => p.turn)).toEqual(grid.map((e) => 0.2 + 0.3 * e));
        expect(over.map((p) => p.nudge)).toEqual(grid.map((e) => e * 0.5));
        expect(over.map((p) => p.leap)).toEqual(grid.map((e) => (e > 0.5 ? e - 0.5 : 0)));
      }
  });

  it('weigh every contour alike, and the variations 0.3, 0.25, 0.25, 0.2, over every preset', () => {
    for (const { bar } of barsOf)
      for (const energy of grid) {
        const p = at(bar, energy, 0.3);
        expect(p.contours).toEqual([1, 1, 1, 1]);
        expect(p.variations).toEqual([0.3, 0.25, 0.25, 0.2]);
        expect(p.range).toEqual(LEAD_RANGE);
      }
  });

  it('snap on the half bar and where each of the bar’s chords starts, a chord on every step', () => {
    for (const { bar } of barsOf) {
      const starts = bar.chords.map((c) => c.slot.step);
      expect(phraseParams(bar).snap).toEqual(
        range(16).filter((s) => s % 8 === 0 || starts.includes(s)),
      );
      // The themes start chords on 0 and 8 only, so a chord is added on each step.
      const chord = bar.chords[0]!;
      for (const step of range(16)) {
        const chords = [chord, { ...chord, slot: { ...chord.slot, step } }];
        expect(phraseParams({ ...bar, chords }).snap).toEqual(
          [...new Set([0, 8, step])].sort((a, b) => a - b),
        );
      }
    }
  });

  it('read the style’s sync and entropy and the bar’s energy, and nothing else of the style', () => {
    for (const { bar } of barsOf) {
      const base = phraseParams(bar);
      for (const axis of ['swing', 'harm', 'artic', 'energy', 'bpm'] as const)
        for (const value of [0, 0.5, 1, 90])
          expect(phraseParams({ ...bar, style: { ...bar.style, [axis]: value } })).toEqual(base);
      const sync = bar.style.sync === 1 ? 0 : 1;
      expect(phraseParams({ ...bar, style: { ...bar.style, sync } })).not.toEqual(base);
    }
  });
});

describe('whether the lead rests', () => {
  it('is what the lead does: it rests in an intro, a breakdown and below energy 0.4, every section and energy', () => {
    const { bar, after: carried } = playing[0]!;
    let rests = 0;
    for (const type of SECTION_TYPES)
      for (const energy of range(101).map((i) => i / 100)) {
        const env = {
          ...bar,
          barEnergy: energy,
          plan: { ...bar.plan, section: { ...bar.plan.section, type } },
        };
        const next = lead.advance(env, carried, null);
        const rested = next.carried.phrase === null && next.output.length === 0;
        expect(rested, `${type} at ${energy}`).toBe(leadRests(type, energy));
        if (rested) rests++;
      }
    // 2 of 6 sections always, and the other 4 below 0.4: 40 of 101 energies.
    expect(rests).toBe(2 * 101 + 4 * 40);
  });
});

describe('the lead with a motif on offer', () => {
  // A flat on the third note, a second above the start on the half bar,
  // where the lead's own notes go to a chord tone, and a rest after it.
  const motif: Motif = {
    cycle: 16,
    onsets: [0, 3, 6, 8, 10, 12],
    degrees: [0, 1, 2, 1, null, -1],
    accidentals: [0, 0, -1, 0, 0, 0],
  };
  const notesOf = (m: Motif) => m.onsets.filter((_, i) => m.degrees[i] !== null);
  const offer = (bar: number): Offer => ({ motif, source: 'the computer keys', bar, level: 90 });
  const offered = (over: readonly BandBar[], offerAt: (bar: number) => Offer | null) =>
    over.map((bar) => ({ ...bar, offer: offerAt(bar.bar) }));

  /** The notes the motif gives, from the first note played, altered as written. */
  const expected = (bar: BandBar, first: number) => {
    const scale = keyHelix(bar.plan.key);
    const origin = alteredDegree(scale, first)!.degree;
    return motif.degrees.flatMap((d, i) =>
      d === null
        ? []
        : [heightOf(scale, origin + d) + motif.accidentals[i]! * chromaticStep(scale)],
    );
  };

  it('plays it whole in every bar, altered as written, silent in its rests, but for the close of bars 2 and 4 (#79)', () => {
    let bars = 0;
    let offChord = 0;
    for (const seed of [1, 2, 3])
      for (const { bar, events } of play(offered(tour(seed), () => offer(0)))) {
        expect(events.map((e) => e.step)).toEqual(notesOf(motif));
        expect(events.map((e) => e.length)).toEqual([3, 3, 2, 2, 4]);
        const notes = events.map((e) => e.note);
        const closes = bar.barInSection % 2 === 1;
        const want = expected(bar, notes[0]!);
        expect(closes ? notes.slice(0, -1) : notes).toEqual(closes ? want.slice(0, -1) : want);
        if (closes) {
          const tones = joinChord(chordAt(bar.chords, events.at(-1)!.step).chord);
          const allowed = bar.barInSection % 4 === 3 ? [tones[0]!] : [tones[1]!, tones[2]!];
          expect(classesOf(allowed)).toContain(wrap(notes.at(-1)!, 12));
        }
        for (const e of events) {
          const tones = classesOf(joinChord(chordAt(bar.chords, e.step).chord));
          const onChord = e.step % 8 === 0 || bar.chords.some((c) => c.slot.step === e.step);
          if (onChord && !tones.includes(wrap(e.note, 12))) offChord++;
        }
        bars++;
      }
    expect(bars).toBe(480);
    expect(offChord).toBeGreaterThan(0);
  });

  it('writes each note of a motif with its accent, 0 where it has none, and none on its own notes (U4)', () => {
    const accented: Motif = { ...motif, accents: [12, -8, 0, 5, 0, -3] };
    const bar = playing[0]!.bar;
    const at = (m: Motif) =>
      lead.advance({ ...bar, offer: { ...offer(0), motif: m } }, lead.initial, null).output;
    expect(at(accented).map((e) => e.accent)).toEqual([12, -8, 0, 5, -3]);
    expect(at(motif).map((e) => e.accent)).toEqual([0, 0, 0, 0, 0]);
    for (const { events } of playing) for (const e of events) expect('accent' in e).toBe(false);
  });

  it('takes a new one at once, mid-phrase', () => {
    let bars = 0;
    for (const { bar, events, after } of play(offered(tour(4), (b) => offer(b)))) {
      expect(after.offered).toBe(bar.bar);
      expect(events.map((e) => e.step)).toEqual(notesOf(motif));
      bars++;
    }
    expect(bars).toBe(160);
  });

  it('plays it where it would rest: in an intro, a breakdown and below energy 0.4', () => {
    const { bar, after: carried } = playing[0]!;
    for (const type of SECTION_TYPES)
      for (const energy of range(11).map((i) => i / 10)) {
        const env = {
          ...bar,
          offer: offer(0),
          barEnergy: energy,
          plan: { ...bar.plan, section: { ...bar.plan.section, type } },
        };
        expect(lead.advance(env, carried, null).output.map((e) => e.step)).toEqual(notesOf(motif));
      }
  });

  it('goes back to its own phrases at once when the offer goes, and keeps no motif as a theme’s melody', () => {
    const over = offered(tour(2), (b) => (b >= 20 && b < 50 ? offer(20) : null));
    const run = play(over);
    const alone = play(tour(2));
    for (const [i, { bar, after, events }] of run.entries()) {
      const offering = bar.bar >= 20 && bar.bar < 50;
      expect(after.offered).toBe(offering ? 20 : null);
      if (offering) expect(after.phrase).toBeNull();
      // Before the offer, and from where a phrase starts afresh after it,
      // the lead plays what it plays alone, themes' melodies included.
      if (bar.bar < 20) expect(events).toEqual(alone[i]!.events);
    }
    const back = run.find((p) => p.bar.bar >= 50 && p.events.length > 0)!;
    expect(back.events.map((e) => e.step)).not.toEqual(notesOf(motif));
    expect(Object.keys(run.at(-1)!.after.melodies).length).toBeGreaterThan(0);
  });

  it('keeps the machine laws while motifs come and go (F1)', () => {
    const over = offered(tour(3, 64), (b) => (b % 24 < 12 ? offer(b - (b % 24)) : null));
    const script: Script<BandBar, null> = over.map((env) => ({ env, input: null }));
    expect(lawBreaks(lead, script)).toEqual([]);
  });
});
