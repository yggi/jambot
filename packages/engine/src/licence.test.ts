import { describe, expect, it } from 'vitest';
import { COMPOSER_MODES, INITIAL_KEY, type Key, MELODIC_SCALES, keyHelix } from './key.ts';
import {
  TEMPO_REACH,
  TEMPO_STEP,
  fifthsApart,
  harmonicReach,
  intoReach,
  MELODIC_DEFAULT_FROM,
  MELODIC_OPENS,
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
  /** Every value on a grid of 60ths, which holds every threshold exactly, and its ends. */
  const GRID = [...Array(61).keys()].map((i) => i / 60);
  /** Every harmony and swing on the grid. */
  const PLANE = GRID.flatMap((harm) => GRID.map((swing) => ({ harm, swing })));
  /** The presets' styles, for the axes other than harmony and swing, which the plane sweeps. */
  const BASES = PRESETS.map(({ style }) => ({ ...INITIAL_STYLE, ...style }));

  it('opens the pentatonic with the harmony from 1/3, the blues with the swing from 1/4 and the pentatonic it holds with it, the plain scale always (#209)', () => {
    expect(MELODIC_OPENS).toEqual({ pentatonic: 1 / 3, blues: 1 / 4 });
    for (const style of BASES)
      for (const { harm, swing } of PLANE) {
        const { melodic } = licenceOf({ ...style, harm, swing });
        expect(melodic, JSON.stringify({ harm, swing })).toEqual(
          swing >= 1 / 4
            ? ['plain', 'pentatonic', 'blues']
            : harm >= 1 / 3
              ? ['plain', 'pentatonic']
              : ['plain'],
        );
      }
    // Either side of each threshold, by the least step the score writes a style at.
    const at = (harm: number, swing: number) =>
      licenceOf({ ...INITIAL_STYLE, harm, swing }).melodic;
    expect(at(0.333, 0)).toEqual(['plain']);
    expect(at(0.334, 0)).toEqual(['plain', 'pentatonic']);
    expect(at(0, 0.249)).toEqual(['plain']);
    expect(at(0, 0.25)).toEqual(['plain', 'pentatonic', 'blues']);
  });

  it('never loses a scale as the harmony or the swing rises, and reads those two alone (#209)', () => {
    for (const style of BASES)
      for (const { harm, swing } of PLANE) {
        const here = licenceOf({ ...style, harm, swing }).melodic;
        expect(here[0]).toBe('plain');
        for (const up of [
          { harm: Math.min(1, harm + 1 / 60), swing },
          { harm, swing: Math.min(1, swing + 1 / 60) },
        ])
          expect(here.every((s) => licenceOf({ ...style, ...up }).melodic.includes(s))).toBe(true);
      }
    for (const { style } of EVERY)
      expect(licenceOf(style).melodic).toEqual(
        licenceOf({ ...INITIAL_STYLE, harm: style.harm, swing: style.swing }).melodic,
      );
  });

  it('gives each preset its scales: the plain alone in Techno and Ambient, the pentatonic in Synth-pop and Bossa nova, the blues wherever the band swings (#209)', () => {
    const reach = Object.fromEntries(
      presetsAt(0.3).map(({ name, style }) => [name, licenceOf(style).melodic.at(-1)]),
    );
    expect(reach).toEqual({
      'Synth-pop': 'pentatonic',
      Techno: 'plain',
      'Deep house': 'blues',
      Ambient: 'plain',
      'Lo-fi hip hop': 'blues',
      Funk: 'blues',
      'Bossa nova': 'pentatonic',
      'Swing jazz': 'blues',
    });
  });

  it('defaults to the scale where harmony and swing meet: the pentatonic from their product 1/4, the blues from 2/3, else the plain one (#209)', () => {
    expect(MELODIC_DEFAULT_FROM).toEqual({ pentatonic: 1 / 4, blues: 2 / 3 });
    for (const style of BASES)
      for (const { harm, swing } of PLANE) {
        const at = { ...style, harm, swing };
        const meet = harm * swing;
        expect(melodicDefault(at), JSON.stringify({ harm, swing })).toBe(
          meet >= 2 / 3 ? 'blues' : meet >= 1 / 4 ? 'pentatonic' : 'plain',
        );
        expect(licenceOf(at).melodic).toContain(melodicDefault(at));
      }
  });

  it('defaults the presets as they sound best: the blues in Swing jazz, the pentatonic in Lo-fi hip hop, the plain scale in the rest (#209)', () => {
    expect(
      Object.fromEntries(presetsAt(0.3).map(({ name, style }) => [name, melodicDefault(style)])),
    ).toEqual({
      'Synth-pop': 'plain',
      Techno: 'plain',
      'Deep house': 'plain',
      Ambient: 'plain',
      'Lo-fi hip hop': 'pentatonic',
      Funk: 'plain',
      'Bossa nova': 'plain',
      'Swing jazz': 'blues',
    });
  });

  it('holds a wished scale where the style reaches it, else none, so the style’s default plays (#209)', () => {
    for (const { harm, swing } of PLANE)
      for (const scale of [...MELODIC_SCALES, null]) {
        const style = { ...INITIAL_STYLE, harm, swing };
        const held = melodicWithin(scale, style);
        expect(held).toBe(
          scale !== null && licenceOf(style).melodic.includes(scale) ? scale : null,
        );
      }
  });
});
