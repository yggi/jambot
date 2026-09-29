import { describe, expect, it } from 'vitest';
import { COMPOSER_MODES, INITIAL_KEY, type Key, MELODIC_SCALES, keyHelix } from './key.ts';
import {
  TEMPO_REACH,
  TEMPO_STEP,
  fifthsApart,
  harmonicReach,
  intoReach,
  MELODIC_FROM,
  licenceOf,
  melodicDefault,
  melodicWithin,
  nudgedTempo,
  tempoLicence,
  tempoNudgeWithin,
} from './licence.ts';
import { AXES, INITIAL_STYLE, PRESETS, type Style } from './style.ts';
import { positions } from '@jambot/theory';

const KEYS: Key[] = COMPOSER_MODES.flatMap((mode) =>
  [...Array(12).keys()].map((tonic) => ({ tonic, mode })),
);

/** The values of a unit axis this file walks: its ends and the tenths between them. */
const UNIT = [...Array(11).keys()].map((i) => i / 10);

/** Every preset as a style, at an entropy. */
const presetsAt = (entropy: number): { name: string; style: Style }[] =>
  PRESETS.map((p) => ({ name: p.name, style: { ...p.style, entropy } }));

/** Every preset at every entropy walked. */
const EVERY = UNIT.flatMap(presetsAt);

/** The tempo axis's geometric middle, where no tempo licence reaches either end. */
const MIDDLE = Math.sqrt(AXES.bpm.min * AXES.bpm.max);

/** How far a style's tempo licence reaches either way, away from the tempo axis's ends. */
const tempoReach = (style: Style) => tempoLicence({ ...style, bpm: MIDDLE }).high;

const rising = (values: readonly number[]) => values.every((v, i) => i === 0 || v > values[i - 1]!);

describe('the feel', () => {
  it('lies within 0 and 1, and rises with swing, with entropy and toward legato (T17)', () => {
    const feel = (style: Style) => licenceOf(style).feel;
    for (const { style } of EVERY) {
      expect(feel(style)).toBeGreaterThanOrEqual(0);
      expect(feel(style)).toBeLessThanOrEqual(1);
      for (const axis of ['swing', 'entropy', 'artic'] as const) {
        const along = UNIT.map((value) => feel({ ...style, [axis]: value }));
        // Swing and entropy loosen the feel; articulation tightens it.
        expect(rising(axis === 'artic' ? along.toReversed() : along)).toBe(true);
      }
    }
  });

  it('is exactly 0 at swing 0, entropy 0 and articulation 1, and only there (T17)', () => {
    for (const { style } of EVERY) {
      expect(licenceOf({ ...style, swing: 0, entropy: 0, artic: 1 }).feel).toBe(0);
      const still = style.swing === 0 && style.entropy === 0 && style.artic === 1;
      expect(licenceOf(style).feel === 0).toBe(still);
    }
  });

  it('orders the presets at any one entropy from Techno, the tightest, to Swing jazz, the loosest (T17)', () => {
    for (const entropy of UNIT) {
      const feels = presetsAt(entropy)
        .map((p) => ({ name: p.name, feel: licenceOf(p.style).feel }))
        .toSorted((a, b) => a.feel - b.feel);
      expect(feels[0]!.name).toBe('Techno');
      expect(feels.at(-1)!.name).toBe('Swing jazz');
      // No other preset ties either end.
      expect(feels[1]!.feel).toBeGreaterThan(feels[0]!.feel);
      expect(feels.at(-1)!.feel).toBeGreaterThan(feels.at(-2)!.feel);
    }
  });
});

describe('the tempo licence', () => {
  it('steps a 24th of an octave, and reaches a third of an octave at most, eight steps', () => {
    expect(TEMPO_REACH).toBe(1 / 3);
    expect(2 ** (8 * TEMPO_STEP)).toBeCloseTo(2 ** (1 / 3), 12);
  });

  it('reaches further as entropy rises, from two steps at 0 to a third of an octave at 1', () => {
    for (const { style } of presetsAt(0)) {
      const reach = UNIT.map((entropy) => tempoReach({ ...style, entropy }));
      expect(reach[0]).toBeCloseTo(2 * TEMPO_STEP, 12);
      expect(reach.at(-1)).toBeCloseTo(TEMPO_REACH, 12);
      expect(rising(reach)).toBe(true);
      for (const r of reach) expect(r).toBeGreaterThanOrEqual(2 * TEMPO_STEP - 1e-12);
    }
  });

  it('reads the style’s tempo and entropy alone, and is the licence’s tempo', () => {
    for (const { style } of EVERY) {
      expect(tempoLicence(style)).toEqual(
        tempoLicence({ ...INITIAL_STYLE, bpm: style.bpm, entropy: style.entropy }),
      );
      expect(licenceOf(style).tempo).toEqual(tempoLicence(style));
    }
  });

  it('plays the style’s tempo unnudged, and a nudge as a ratio of it', () => {
    for (const { style } of EVERY) {
      expect(nudgedTempo(style, 0)).toBe(style.bpm);
      expect(nudgedTempo(style, TEMPO_STEP)).toBeCloseTo(style.bpm * 2 ** TEMPO_STEP, 9);
    }
  });

  it('holds a nudge within its reach, and the tempo within its axis', () => {
    const at = (bpm: number, entropy = 1): Style => ({ ...INITIAL_STYLE, bpm, entropy });
    expect(tempoNudgeWithin(1, at(100))).toBe(TEMPO_REACH);
    expect(tempoNudgeWithin(-1, at(100))).toBe(-TEMPO_REACH);
    expect(tempoNudgeWithin(0.1, at(100))).toBe(0.1);
    expect(tempoNudgeWithin(1, at(100, 0))).toBeCloseTo(2 * TEMPO_STEP, 12);
    expect(tempoNudgeWithin(-1, at(100, 0))).toBeCloseTo(-2 * TEMPO_STEP, 12);
    expect(nudgedTempo(at(100), 1)).toBeCloseTo(100 * 2 ** TEMPO_REACH, 9);
    expect(nudgedTempo(at(170), TEMPO_REACH)).toBeCloseTo(AXES.bpm.max, 9);
    expect(nudgedTempo(at(64), -TEMPO_REACH)).toBeCloseTo(AXES.bpm.min, 9);
  });

  it('narrows the licence at the tempo axis’s ends, and nowhere else', () => {
    for (const { style } of EVERY) {
      const { low, high } = tempoLicence(style);
      const reach = tempoReach(style);
      expect(style.bpm * 2 ** low).toBeGreaterThanOrEqual(AXES.bpm.min - 1e-9);
      expect(style.bpm * 2 ** high).toBeLessThanOrEqual(AXES.bpm.max + 1e-9);
      expect(low === -reach).toBe(style.bpm * 2 ** -reach >= AXES.bpm.min);
      expect(high === reach).toBe(style.bpm * 2 ** reach <= AXES.bpm.max);
    }
  });
});

describe('the key licence', () => {
  it('counts fifths between key signatures, so relative keys are none apart', () => {
    for (const a of KEYS)
      for (const b of KEYS) {
        const apart = fifthsApart(a, b);
        expect(Math.abs(apart)).toBeLessThanOrEqual(6);
        const same = positions(keyHelix(a)).join() === [...positions(keyHelix(b))].join();
        expect(apart === 0).toBe(same);
      }
    expect(fifthsApart({ tonic: 4, mode: 'aeolian' }, INITIAL_KEY)).toBe(1); // E minor: one sharp
    expect(fifthsApart({ tonic: 5, mode: 'ionian' }, INITIAL_KEY)).toBe(-1); // F major: one flat
    expect(fifthsApart({ tonic: 2, mode: 'dorian' }, INITIAL_KEY)).toBe(0); // D dorian: none
  });

  it('reaches from the harmony: no fifth at harm 0, six at 1, rounded between', () => {
    for (const { style } of EVERY) {
      const reach = UNIT.map((harm) => harmonicReach({ ...style, harm }));
      expect(reach[0]).toBe(0);
      expect(reach.at(-1)).toBe(6);
      expect(reach).toEqual(UNIT.map((harm) => Math.round(6 * harm)));
      expect(reach.every((r, i) => i === 0 || r >= reach[i - 1]!)).toBe(true);
    }
  });

  it('gives the players the harmony’s reach, and at least a fifth', () => {
    for (const { style } of EVERY) {
      expect(licenceOf(style).keyReach).toBe(Math.max(1, harmonicReach(style)));
      expect(licenceOf({ ...style, harm: 0 }).keyReach).toBe(1);
      expect(licenceOf({ ...style, harm: 1 }).keyReach).toBe(6);
    }
    const reachOf = (name: string) =>
      licenceOf({ ...PRESETS.find((p) => p.name === name)!.style, entropy: 0 }).keyReach;
    expect(reachOf('Techno')).toBe(1);
    expect(reachOf('Swing jazz')).toBe(6);
  });

  it('reaches every key at harm 1', () => {
    const { keyReach } = licenceOf({ ...INITIAL_STYLE, harm: 1 });
    for (const key of KEYS) expect(intoReach(key, INITIAL_KEY, keyReach)).toEqual(key);
  });

  it('pulls a wish beyond its reach back to the nearest key within it, in the wished mode', () => {
    for (let reach = 0; reach <= 6; reach++)
      for (const key of KEYS) {
        const held = intoReach(key, INITIAL_KEY, reach);
        const apart = fifthsApart(key, INITIAL_KEY);
        expect(held.mode).toBe(key.mode);
        expect(Math.abs(fifthsApart(held, INITIAL_KEY))).toBe(Math.min(Math.abs(apart), reach));
        if (Math.abs(apart) <= reach) expect(held).toEqual(key);
        else
          expect(Math.sign(fifthsApart(held, INITIAL_KEY))).toBe(
            reach === 0 ? 0 : Math.sign(apart),
          );
      }
  });
});

describe('the melodic licence', () => {
  /** Every harm on a grid of 60ths, which holds both thresholds exactly, and its ends. */
  const HARMS = [...Array(61).keys()].map((i) => i / 60);

  it('opens the pentatonic from harm 1/3 and the blues from 2/3, the plain scale always (#209)', () => {
    expect(MELODIC_FROM).toEqual({ plain: 0, pentatonic: 1 / 3, blues: 2 / 3 });
    for (const { style } of EVERY)
      for (const harm of HARMS) {
        const { melodic } = licenceOf({ ...style, harm });
        expect(melodic).toEqual(
          harm >= 2 / 3
            ? ['plain', 'pentatonic', 'blues']
            : harm >= 1 / 3
              ? ['plain', 'pentatonic']
              : ['plain'],
        );
      }
    // Either side of each threshold, by the least step the score writes a style at.
    const at = (harm: number) => licenceOf({ ...INITIAL_STYLE, harm }).melodic;
    expect(at(0.333)).toEqual(['plain']);
    expect(at(0.334)).toEqual(['plain', 'pentatonic']);
    expect(at(0.666)).toEqual(['plain', 'pentatonic']);
    expect(at(0.667)).toEqual(['plain', 'pentatonic', 'blues']);
  });

  it('never loses a scale as the harmony rises, and reads the harmony alone (#209)', () => {
    for (const { style } of EVERY) {
      const over = HARMS.map((harm) => licenceOf({ ...style, harm }).melodic);
      over.forEach((melodic, i) => {
        expect(melodic[0]).toBe('plain');
        if (i > 0) expect(over[i - 1]!.every((s) => melodic.includes(s))).toBe(true);
      });
      expect(licenceOf(style).melodic).toEqual(
        licenceOf({ ...INITIAL_STYLE, harm: style.harm }).melodic,
      );
    }
  });

  it('gives each preset its scales: plain alone in Techno, Funk and Ambient, the pentatonic in Synth-pop and Deep house, the blues from Lo-fi hip hop up (#209)', () => {
    const reach = Object.fromEntries(
      presetsAt(0.3).map(({ name, style }) => [name, licenceOf(style).melodic.at(-1)]),
    );
    expect(reach).toEqual({
      'Synth-pop': 'pentatonic',
      Techno: 'plain',
      'Deep house': 'pentatonic',
      Ambient: 'plain',
      'Lo-fi hip hop': 'blues',
      Funk: 'plain',
      'Bossa nova': 'blues',
      'Swing jazz': 'blues',
    });
  });

  it('defaults to the plain scale everywhere, which is always within reach (#209)', () => {
    for (const { style } of EVERY)
      for (const harm of HARMS) {
        const at = { ...style, harm };
        expect(melodicDefault(at)).toBe('plain');
        expect(licenceOf(at).melodic).toContain(melodicDefault(at));
      }
  });

  it('holds a wished scale within reach: as it is where reached, else the widest the reach holds (#209)', () => {
    for (const harm of HARMS)
      for (const scale of MELODIC_SCALES) {
        const style = { ...INITIAL_STYLE, harm };
        const { melodic } = licenceOf(style);
        const held = melodicWithin(scale, style);
        expect(melodic).toContain(held);
        if (melodic.includes(scale)) expect(held).toBe(scale);
        else expect(held).toBe(melodic.at(-1));
      }
  });
});
