import { METERS, type Meter, meterOnSteps, stepsOf } from '@jambot/theory';
import { BAR_4_4, readStyle as readCellsStyle } from '@yggi/cells/engine/reading/style';
import { describe, expect, it } from 'vitest';
import { type BandEnv, band } from './band.ts';
import { type Part, SONG_METER, type WrittenNote } from './events.ts';
import { PRESETS, INITIAL_STYLE } from './style.ts';
import { readStyle, readingBar } from './style-reading.ts';

const note = (part: Part, step: number, length = 1, midi = 60): WrittenNote => ({
  part,
  step,
  note: midi,
  length,
});
const range = (n: number) => [...Array(n).keys()];

describe('reading the band', () => {
  const bars = (style = INITIAL_STYLE, count = 16) => {
    let carried = band.initial;
    return range(count).map((bar) => {
      const env: BandEnv = {
        seed: 3,
        bar,
        style,
        wish: { tonic: null, mode: 'aeolian', melodic: null },
        offer: null,
      };
      const next = band.advance(env, carried, null);
      carried = next.carried;
      return next.output;
    });
  };

  it('reads the gate and not the written length as the bite', () => {
    const at = (artic: number) =>
      bars({ ...INITIAL_STYLE, artic }, 8).map((b) => [b.written, b.dough] as const);
    for (const [written, dough] of at(1))
      if (readStyle(dough).bite !== undefined) {
        expect(readStyle(written).bite).toBe(0);
        expect(readStyle(dough).bite).toBeGreaterThan(0);
      }
  });

  it.each(PRESETS.map((p) => [p.name, p] as const))(
    'reads every axis it reads, in range, from %s',
    (_, preset) => {
      for (const bar of bars({ ...preset.style, entropy: 0.3 })) {
        const read = readStyle(bar.dough);
        for (const value of Object.values(read)) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
        }
        expect(read.sync ?? 0).toBeLessThanOrEqual(1);
        expect(read.bite ?? 0).toBeLessThanOrEqual(1);
      }
    },
  );
});

describe('a style read on other meters (#260)', () => {
  const named = Object.entries(METERS) as [string, Meter][];

  it('lays each meter on cells’ bar as its steps and its pulses, and the song’s 4/4 as cells’ own (finite: every meter)', () => {
    for (const [name, meter] of named)
      expect([name, readingBar(meter)]).toEqual([
        name,
        { steps: stepsOf(meter), pulses: meterOnSteps(meter).heights },
      ]);
    expect(readingBar(SONG_METER)).toEqual(BAR_4_4);
    const bar = [note('drums', 0), note('bass', 3, 2), note('lead', 6, 1), note('stab', 7)];
    expect(readStyle(bar)).toEqual(readCellsStyle(bar));
  });

  it('reads a bar’s density over its own steps, and 4/4 as it was (finite: every meter)', () => {
    for (const [name, meter] of named) {
      const steps = stepsOf(meter);
      const onEveryStep = range(steps).map((step) => note('bass', step));
      expect([name, readStyle(onEveryStep, meter).density]).toEqual([name, 1]);
      expect([name, readStyle([note('bass', 0)], meter).density]).toEqual([name, 1 / steps]);
    }
    expect(readStyle([note('bass', 0)]).density).toBe(1 / 16);
  });

  it('reads a bar on each of Jambot’s meters as cells reads it over that meter’s bar (finite: every meter, every step)', () => {
    // The syncopation rule itself is cells' (yggi/cells#723), held by its own tests.
    for (const [name, meter] of named) {
      const bar = readingBar(meter);
      const everyStep = range(stepsOf(meter)).flatMap((step) => [
        note('drums', step),
        note('bass', step, 2),
      ]);
      for (const notes of [...range(stepsOf(meter)).map((step) => [note('lead', step)]), everyStep])
        expect([name, notes, readStyle(notes, meter)]).toEqual([
          name,
          notes,
          readCellsStyle(notes, bar),
        ]);
    }
  });

  it('reads a note’s share of the gap to the bar’s end in the meter’s bar, not 4/4’s', () => {
    for (const [name, meter] of named) {
      const steps = stepsOf(meter);
      // One note held the whole bar sounds all of it; one held half sounds half.
      expect([name, readStyle([note('bass', 0, steps)], meter).bite]).toEqual([name, 0]);
      expect([name, readStyle([note('bass', 0, steps / 2)], meter).bite]).toEqual([name, 0.5]);
    }
  });
});
