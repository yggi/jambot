import { describe, expect, it } from 'vitest';
import { COMPOSER_MODES, INITIAL_KEY, type Key, keyHelix } from './key.ts';
import {
  KEY_REACH,
  TEMPO_REACH,
  TEMPO_STEP,
  fifthsApart,
  intoReach,
  nudgedTempo,
  tempoLicence,
  tempoNudgeWithin,
} from './licence.ts';
import { AXES, PRESETS } from './style.ts';
import { positions } from '@jambot/theory';

const KEYS: Key[] = COMPOSER_MODES.flatMap((mode) =>
  [...Array(12).keys()].map((tonic) => ({ tonic, mode })),
);

describe('the tempo licence', () => {
  it('reaches a third of an octave either way, eight steps', () => {
    expect(TEMPO_REACH).toBe(1 / 3);
    expect(2 ** (8 * TEMPO_STEP)).toBeCloseTo(2 ** (1 / 3), 12);
  });

  it('plays the style’s tempo unnudged, and a nudge as a ratio of it', () => {
    for (const p of PRESETS) {
      expect(nudgedTempo(p.style.bpm, 0)).toBe(p.style.bpm);
      expect(nudgedTempo(p.style.bpm, TEMPO_STEP)).toBeCloseTo(p.style.bpm * 2 ** TEMPO_STEP, 9);
    }
  });

  it('holds a nudge within its reach, and the tempo within its axis', () => {
    expect(tempoNudgeWithin(1, 100)).toBe(TEMPO_REACH);
    expect(tempoNudgeWithin(-1, 100)).toBe(-TEMPO_REACH);
    expect(tempoNudgeWithin(0.1, 100)).toBe(0.1);
    expect(nudgedTempo(100, 1)).toBeCloseTo(100 * 2 ** TEMPO_REACH, 9);
    expect(nudgedTempo(170, TEMPO_REACH)).toBeCloseTo(AXES.bpm.max, 9);
    expect(nudgedTempo(64, -TEMPO_REACH)).toBeCloseTo(AXES.bpm.min, 9);
  });

  it('narrows the licence at the tempo axis’s ends, and nowhere else', () => {
    for (const p of PRESETS) {
      const { low, high } = tempoLicence(p.style.bpm);
      expect(p.style.bpm * 2 ** low).toBeGreaterThanOrEqual(AXES.bpm.min - 1e-9);
      expect(p.style.bpm * 2 ** high).toBeLessThanOrEqual(AXES.bpm.max + 1e-9);
      expect(low === -TEMPO_REACH).toBe(p.style.bpm * 2 ** -TEMPO_REACH >= AXES.bpm.min);
      expect(high === TEMPO_REACH).toBe(p.style.bpm * 2 ** TEMPO_REACH <= AXES.bpm.max);
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

  it('reaches every key', () => {
    expect(KEY_REACH).toBe(6);
    for (const key of KEYS) expect(intoReach(key, INITIAL_KEY, KEY_REACH)).toEqual(key);
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
