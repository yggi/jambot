import { PRESETS, SECTION_BARS, band } from '@jambot/engine';
import {
  CHORD_QUALITIES,
  type Numeral,
  alteredHeight,
  chromaticStep,
  diatonicMode,
  formatNumeral,
  heightOf,
  joinChord,
} from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { describe, expect, it } from 'vitest';
import { type ScoreKey, lowerNumeral } from '../src/score.ts';
import {
  CANDIDATES,
  type Harmony,
  QUALITY_DEGREES,
  breakdown,
  cellsPlays,
  chordScaleText,
  everyNumeral,
  lowerNumerals,
  measure,
  playedBars,
  report,
  sameHarmony,
  shapesOnce,
  table,
} from './pitch-in-cells.ts';

const PLAYED = playedBars();
const MEASURED = measure(PLAYED);
const candidate = (name: string) => CANDIDATES.find((c) => c.name === name)!;
const at = (preset: string, bar: number) =>
  MEASURED.find((m) => m.preset === preset && m.bar === bar)!;

if (process.env.E32_REPORT)
  console.log(
    [
      JSON.stringify(table(MEASURED)),
      ...['score', ...CANDIDATES.map((c) => c.name)].map(
        (name) => `${name} ${JSON.stringify(breakdown(MEASURED, name))}`,
      ),
      `shapes stated once a preset: ${shapesOnce(MEASURED)}`,
      report(at('Swing jazz', 2)),
      report(at('Funk', 23)),
    ].join('\n'),
  );

/** The notes a bar's chords sound, as the band's chords in the key's register, from C4. */
const bandChords = (h: Harmony) =>
  h.chords.map(({ step, numeral }) => ({
    step,
    notes: joinChord(lowerNumeral(h.key, numeral)).map((x) => x + 60),
  }));

const COMPOSER_KEYS: ScoreKey[] = (['ionian', 'dorian', 'mixolydian', 'aeolian'] as const).flatMap(
  (mode) => Array.from({ length: 12 }, (_, tonic) => ({ tonic, mode })),
);

/** A key's numerals in bars of 16, one chord a step, as a harmony each. */
const inBars = (key: ScoreKey, numerals: readonly Numeral[]): Harmony[] =>
  Array.from({ length: Math.ceil(numerals.length / 16) }, (_, i) => ({
    key,
    chords: numerals.slice(i * 16, i * 16 + 16).map((numeral, step) => ({ step, numeral })),
  }));

describe("the band's harmony as cells text, 8 presets × 32 bars (E32)", () => {
  it('reads every preset held, 32 bars each, seed 0: six keys in three modes, secondaries, a next chord and pins among them', () => {
    expect(MEASURED).toHaveLength(256);
    expect(new Set(MEASURED.map((m) => m.preset))).toEqual(new Set(PRESETS.map((p) => p.name)));
    const keys = new Set(MEASURED.map((m) => `${m.harmony.key.tonic}:${m.harmony.key.mode}`));
    expect(keys.size).toBe(6);
    expect(new Set(MEASURED.map((m) => m.harmony.key.mode))).toEqual(
      new Set(['aeolian', 'dorian', 'ionian']),
    );
    const chords = MEASURED.flatMap((m) => m.harmony.chords);
    expect(chords).toHaveLength(262);
    expect(chords.filter((c) => c.numeral.of).map((c) => formatNumeral(c.numeral))).toEqual([
      'V9/V',
      'V7/V',
      'V9/V',
      'V7/V',
    ]);
    // The band writes no root off the key: every chord's root is a degree of it (U1 is exercised below, over every case).
    expect(chords.filter((c) => c.numeral.accidental !== 0)).toEqual([]);
    expect(MEASURED.filter((m) => m.harmony.next)).toHaveLength(19);
    expect(MEASURED.filter((m) => m.harmony.frame?.comp)).toHaveLength(231);
    expect(MEASURED.filter((m) => m.harmony.frame?.bass !== undefined)).toHaveLength(233);
  });

  it('counts each spelling: its characters, and the bars that read back exactly', () => {
    expect(table(MEASURED)).toEqual([
      { name: 'score', characters: 12900, exact: 256 },
      { name: 'stacks', characters: 27180, exact: 252 },
      { name: 'shapes', characters: 29425, exact: 252 },
      { name: 'numerals', characters: 25577, exact: 256 },
    ]);
    // The key and the pin are the same lines in every candidate; the chords are where they part.
    expect(breakdown(MEASURED, 'stacks')).toEqual({ key: 5744, chords: 10123, frame: 11569 });
    expect(breakdown(MEASURED, 'shapes')).toEqual({ key: 5744, chords: 12368, frame: 11569 });
    expect(breakdown(MEASURED, 'numerals')).toEqual({ key: 5744, chords: 8520, frame: 11569 });
    expect(breakdown(MEASURED, 'score')).toEqual({ key: 3440, chords: 2936, frame: 6780 });
    // Stated once a run, as a section's text would, the shapes cost less, and still more than the numerals.
    expect(shapesOnce(MEASURED)).toBe(26230);
  });

  it('compiles every stacks and shapes text in cells v0.1.0 with no diagnostic, and plays the band’s chords, step for step', () => {
    for (const m of MEASURED)
      for (const name of ['stacks', 'shapes']) {
        const { played, diagnostics } = cellsPlays(m.texts[name]!);
        expect(diagnostics, `${m.preset} ${m.bar} ${name}`).toEqual([]);
        expect(played.get('harm'), `${m.preset} ${m.bar} ${name}`).toEqual(bandChords(m.harmony));
      }
  });

  it('parses no numerals text in cells v0.1.0 (a proposal), and plays each, lowered by its stated meaning, as the band’s chords', () => {
    const w = at('Swing jazz', 2);
    expect(planOf(w.texts.numerals!).result.diagnostics.map((d) => d.message)).toEqual([
      "Unexpected 'vii'",
    ]);
    for (const m of MEASURED) {
      const lowered = lowerNumerals(m.texts.numerals!);
      expect(lowered).toBe(m.texts.stacks);
      expect(cellsPlays(lowered).played.get('harm')).toEqual(bandChords(m.harmony));
    }
  });

  it('finds what it checks: a chord, a pin or the next key altered in any spelling reads back as another bar', () => {
    const minor = at('Synth-pop', 6); // V7 in A minor, pinned
    const changed = (name: string, from: string | RegExp, to: string) => {
      const text = minor.texts[name]!.replace(from, to);
      expect(text, name).not.toBe(minor.texts[name]);
      return sameHarmony(candidate(name).read(text), minor.harmony);
    };
    expect(changed('stacks', '[4,6#,8,10]', '[4,6,8,10]')).toBe(false);
    expect(changed('shapes', '&c0^4', '&c0^3')).toBe(false);
    expect(changed('numerals', ' V7', ' v7')).toBe(false);
    for (const name of ['stacks', 'shapes', 'numerals']) {
      expect(changed(name, '[0,2,5]', '[0,2,4]')).toBe(false);
      expect(changed(name, 'frameBass over=&key 5', 'frameBass over=&key 4')).toBe(false);
    }
    const leading = at('Funk', 23);
    for (const name of ['stacks', 'shapes', 'numerals']) {
      const text = leading.texts[name]!.replace('scale(dorian, A)', 'scale(dorian, G)');
      expect(sameHarmony(candidate(name).read(text), leading.harmony), name).toBe(false);
      expect(sameHarmony(candidate(name).read(leading.texts[name]!), leading.harmony), name).toBe(
        true,
      );
    }
  });

  it('writes every numeral of every key the composer keys in, roots on the key and off it as U1 writes them, and reads each back in every candidate', () => {
    let numerals = 0;
    let offTheKey = 0;
    for (const key of COMPOSER_KEYS) {
      const all = everyNumeral(key);
      numerals += all.length;
      offTheKey += all.filter((n) => n.accidental !== 0).length;
      for (const h of inBars(key, all))
        for (const c of CANDIDATES)
          expect(sameHarmony(c.read(c.write(h)), h), `${c.name} ${JSON.stringify(key)}`).toBe(true);
    }
    expect([numerals, offTheKey]).toEqual([48 * 12 * 19, 4560]);
    expect(Object.keys(QUALITY_DEGREES).sort()).toEqual(
      Object.keys(CHORD_QUALITIES)
        .filter((q) => q !== 'harmonics')
        .sort(),
    );
  });
});

describe('what no candidate can say (E32: the gaps)', () => {
  it('gap 1: a secondary dominant’s function: stacks and shapes play V7/V’s notes and read back II7, in the band’s 4 bars and every secondary of every key', () => {
    const lost = MEASURED.filter((m) => !m.back.stacks);
    expect(lost.map((m) => `${m.preset} ${m.bar}`)).toEqual([
      'Swing jazz 2',
      'Swing jazz 6',
      'Swing jazz 10',
      'Swing jazz 14',
    ]);
    expect(MEASURED.filter((m) => !m.back.shapes)).toEqual(lost);
    for (const m of lost)
      for (const name of ['stacks', 'shapes'])
        expect(
          candidate(name)
            .read(m.texts[name]!)
            .chords.map((c) => formatNumeral(c.numeral)),
        ).toEqual(['viiø7', m.harmony.chords[1]!.numeral.quality === '9' ? 'II9' : 'II7']);
    // Every V, V7 and V9 of every degree whose triad is major or minor, in every key: only the numerals keep it.
    let secondaries = 0;
    for (const key of COMPOSER_KEYS) {
      const scale = diatonicMode(key.mode);
      // A target is a major or minor triad: a perfect fifth over its root.
      const targets = [1, 2, 3, 4, 5, 6].filter(
        (d) => heightOf(scale, d + 4) - heightOf(scale, d) === 7,
      );
      const all: Numeral[] = targets.flatMap((degree) =>
        ['major', '7', '9'].map((quality) => ({
          degree: 4,
          accidental: 0 as const,
          quality,
          of: {
            degree,
            accidental: 0 as const,
            minor: heightOf(scale, degree + 2) - heightOf(scale, degree) === 3,
          },
        })),
      );
      secondaries += all.length;
      for (const h of inBars(key, all)) {
        expect(sameHarmony(candidate('numerals').read(candidate('numerals').write(h)), h)).toBe(
          true,
        );
        for (const name of ['stacks', 'shapes']) {
          const back = candidate(name).read(candidate(name).write(h));
          expect(back.chords.every((c) => !c.numeral.of)).toBe(true);
          expect(back.chords.map((c) => lowerNumeral(key, c.numeral))).toEqual(
            h.chords.map((c) => lowerNumeral(key, c.numeral)),
          );
        }
      }
    }
    expect(secondaries).toBe(48 * 5 * 3);
  });

  it('gap 2: a key of another cycle: a cells accidental is a step of the grid, so stacks and shapes write the same chord as 3# in 12 and 3## in 31; a numeral means the key’s chromatic step in both, as P5 reads it', () => {
    // Jambot's major key in 31 tones: its sharp is the large step less the small, 2 of 31.
    const key31 = { cycle: 31, heights: [0, 5, 10, 13, 18, 23, 28] };
    expect(chromaticStep(key31)).toBe(2);
    const fSharp = alteredHeight(key31, 3, 1);
    expect(fSharp).toBe(15);
    const played = (degrees: string) => {
      const plan = planOf(
        [
          '&bar scan(1 1 1 1) step=120bpm',
          '&e31 cycle=31 map=edo',
          '&key over=&e31 scan(5 5 3 5 5 5 3)',
          `&harm over=&key step=&bar*4 ${degrees}`,
          '&v s=sine loop=C4',
          '&out map=sample [&harm * &v]',
        ].join('\n'),
      );
      expect(plan.result.diagnostics).toEqual([]);
      return windowAt(plan, 0, 0.125).events.map((e) =>
        Math.round(31 * Math.log2(e.freq / 261.6255653005986)),
      );
    };
    expect(played('[1,3#,5]')).toEqual([5, 14, 23]);
    expect(played('[1,3##,5]')).toEqual([5, fSharp, 23]);
  });

  it('gap 3: the hand: every pin reads back through cells as degrees of the key, and none says what the pin is for, the voicing led from it', () => {
    const pins = MEASURED.flatMap((m) =>
      m.texts.stacks!.split('\n').filter((line) => line.startsWith('&frame')),
    );
    const notes = pins.flatMap((line) => line.split(' ').at(-1)!.replace(/[[\]]/gu, '').split(','));
    expect([pins.length, notes.length, notes.filter((n) => /[#b]/u.test(n)).length]).toEqual([
      464, 1036, 33,
    ]);
    // Every bar read its pins back, whatever its chords did (the 4 lost bars above lose a chord, not a pin).
    for (const m of MEASURED)
      expect(candidate('stacks').read(m.texts.stacks!).frame).toEqual(m.harmony.frame);
    // Synth-pop's bar 2: V in A minor, its comp led from the pin, and from none another inversion.
    const played = PLAYED.find((p) => p.preset === 'Synth-pop' && p.bar.bar === 2)!;
    const comp = (from: typeof played.before) =>
      band
        .advance(played.env, from, null)
        .output.written.filter((n) => n.part === 'pad' || n.part === 'stab')
        .map((n) => n.note);
    expect(comp(played.before)).toEqual([56, 59, 64]);
    expect(comp({ ...played.before, parts: { ...played.before.parts, comp: null } })).toEqual([
      59, 64, 68,
    ]);
    // In cells the pin is a cell nothing plays: it compiles, and nothing reads it.
    expect(at('Synth-pop', 2).texts.stacks).toContain('&frame over=&key [0,2,5]');
  });

  it('gap 4: the next chord is a copy, not a reference: 19 bars state it again, 1 in the next key, 6 across a section’s end', () => {
    const leading = MEASURED.filter((m) => m.harmony.next);
    expect(leading.map((m) => `${m.preset} ${m.bar}`)).toEqual([
      ...[3, 7, 11, 15, 19, 23, 27, 31].map((b) => `Funk ${b}`),
      ...[8, 9, 10, 11, 12, 13, 14, 15, 29, 30, 31].map((b) => `Bossa nova ${b}`),
    ]);
    const elsewhere = leading.filter(
      (m) =>
        m.harmony.next!.key.tonic !== m.harmony.key.tonic ||
        m.harmony.next!.key.mode !== m.harmony.key.mode,
    );
    expect(elsewhere.map((m) => `${m.preset} ${m.bar}`)).toEqual(['Funk 23']);
    expect(elsewhere[0]!.texts.numerals).toContain('&next over=scale(dorian, A) i');
    expect(leading.filter((m) => m.bar % SECTION_BARS === SECTION_BARS - 1)).toHaveLength(6);
  });

  it('gap 5: a chord’s scale as a line’s default (U3): no candidate has one, and every line can state its scale once: 256 of 262 by cells’ names, 6 by tonal’s', () => {
    const stated = MEASURED.flatMap((m) =>
      m.harmony.chords.map((c) => chordScaleText(m.harmony.key, c.numeral)!),
    );
    expect(stated.every(Boolean)).toBe(true);
    expect(stated.filter((s) => s.by === 'cells')).toHaveLength(256);
    const tonal = stated.filter((s) => s.by === 'tonal');
    expect([...new Set(tonal.map((s) => s.text))]).toEqual(['scale("E:phrygian:dominant")']);
    expect(tonal).toHaveLength(6);
    // Each scale stated, once a line, plays the scale the chord implies.
    for (const s of new Map(stated.map((x) => [x.text, x])).values()) {
      const text = [
        '&bar scan(1 1 1 1) step=120bpm',
        `&line over=${s.text} step=&bar*4 0 1 2 3 4 5 6 7`,
        '&v s=sine loop=C4',
        '&out map=sample [&line * &v]',
      ].join('\n');
      const plan = planOf(text);
      expect(plan.result.diagnostics, s.text).toEqual([]);
      const notes = windowAt(plan, 0, 8 * 0.125).events.map((e) =>
        Math.round(12 * Math.log2(e.freq / 261.6255653005986)),
      );
      const scale = [s.root];
      for (const step of s.steps) scale.push(scale.at(-1)! + step);
      expect(notes, s.text).toEqual(scale);
    }
  });
});
