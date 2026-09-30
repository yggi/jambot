import { DRUM_NOTES, backbeatOf } from '@jambot/engine';
import { METERS, type MeterName, gaps, meterOnSteps, parallel } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { HEMIOLA, LAYERS, type Layer, type Setting, barPlan } from './bar-plan.ts';

const names = Object.keys(METERS) as MeterName[];
const only = (layer: Layer): Record<Layer, boolean> => ({
  click: layer === 'click',
  drums: layer === 'drums',
  bass: layer === 'bass',
});
const all: Record<Layer, boolean> = { click: true, drums: true, bass: true };
const setting = (name: MeterName, more: Partial<Setting> = {}): Setting => ({
  name,
  layers: all,
  hemiola: false,
  grade: 1,
  mirror: false,
  ...more,
});

describe('the bar’s plan', () => {
  it('lays every onset of every layer on an eighth of the meter’s bar (finite: every meter, every layer, the hemiola both ways, every accent)', () => {
    for (const name of names)
      for (const hemiola of [false, true])
        for (const grade of [0, 1])
          for (const onset of barPlan(setting(name, { hemiola, grade }))) {
            expect([name, onset.layer, Number.isInteger(onset.step)]).toEqual([
              name,
              onset.layer,
              true,
            ]);
            expect([name, onset.layer, onset.step % 2]).toEqual([name, onset.layer, 0]);
            expect(onset.step).toBeGreaterThanOrEqual(0);
            expect(onset.step).toBeLessThan(METERS[name].cycle * 2);
          }
  });

  it('clicks each eighth once, by weight, and plays nothing of a layer that is off', () => {
    for (const name of names) {
      const meter = METERS[name];
      const click = barPlan(setting(name, { layers: only('click') }));
      expect(click).toHaveLength(meter.cycle);
      expect(click.every((o) => o.layer === 'click')).toBe(true);
      expect(click.filter((o) => o.layer === 'click' && o.weight === 'pulse')).toHaveLength(
        meter.heights.length - 1,
      );
      for (const layer of LAYERS)
        expect(
          barPlan(setting(name, { layers: only(layer) })).every((o) => o.layer === layer),
        ).toBe(true);
      expect(
        barPlan(setting(name, { layers: { click: false, drums: false, bass: false } })),
      ).toEqual([]);
    }
  });

  it('gives every meter a backbeat of pulses after the downbeat, in order and inside the bar (finite: every meter)', () => {
    for (const name of names) {
      const pulses = METERS[name].heights.length;
      const backbeat = backbeatOf(METERS[name]);
      expect(backbeat.length).toBeGreaterThan(0);
      expect(backbeat).toEqual([...new Set(backbeat)].sort((a, b) => a - b));
      for (const pulse of backbeat) {
        expect(pulse).toBeGreaterThanOrEqual(1);
        expect(pulse).toBeLessThan(pulses);
      }
    }
  });

  it('plays the snare on the backbeat’s pulse starts, the kick on the downbeat, and hats on every eighth', () => {
    for (const name of names) {
      const meter = METERS[name];
      const starts = meterOnSteps(meter).heights;
      const drums = barPlan(setting(name, { layers: only('drums') }));
      const at = (note: number) =>
        drums.flatMap((o) => (o.layer === 'drums' && o.note === note ? [o.step] : []));
      expect(at(DRUM_NOTES.snare)).toEqual(backbeatOf(METERS[name]).map((p) => starts[p]!));
      expect(at(DRUM_NOTES.kick)[0]).toBe(0);
      expect(at(DRUM_NOTES.closedHat)).toHaveLength(meter.cycle);
    }
    const four = barPlan(setting('4/4', { layers: only('drums') }));
    const kicks = four.flatMap((o) =>
      o.layer === 'drums' && o.note === DRUM_NOTES.kick ? [o.step] : [],
    );
    expect(kicks).toEqual([0, 8]);
  });

  it('kicks the downbeat alone where the bar has two or three pulses, and the half as well where it has four or more (finite: every meter)', () => {
    for (const name of names) {
      const drums = barPlan(setting(name, { layers: only('drums') }));
      const kicks = drums.flatMap((o) =>
        o.layer === 'drums' && o.note === DRUM_NOTES.kick ? [o.step] : [],
      );
      expect([name, kicks.length]).toEqual([name, METERS[name].heights.length >= 4 ? 2 : 1]);
    }
  });

  it('groups 5/4 as 3+2 or 2+3 with the mirror, in what it accents and nowhere else', () => {
    const hats = (mirror: boolean) =>
      barPlan(setting('5/4', { layers: only('drums'), mirror })).flatMap((o) =>
        o.layer === 'drums' && o.note === DRUM_NOTES.closedHat ? [o.velocity] : [],
      );
    expect(hats(true)).not.toEqual(hats(false));
    expect([...hats(true)].sort()).toEqual([...hats(false)].sort());
    expect(barPlan(setting('6/8', { mirror: true }))).toEqual(barPlan(setting('6/8')));
  });

  it('plays the bass on the downbeat and each pulse, each note lasting to the next', () => {
    for (const name of names) {
      const meter = METERS[name];
      const bass = barPlan(setting(name, { layers: only('bass') }));
      expect(bass.map((o) => o.step)).toEqual(meterOnSteps(meter).heights);
      expect(bass.reduce((sum, o) => sum + (o.layer === 'bass' ? o.length : 0), 0)).toBe(
        meter.cycle * 2,
      );
    }
  });

  it('accents a bar as the slider says: the downbeat loudest, and its hats closer as the slider falls', () => {
    const hats = (grade: number) =>
      barPlan(setting('12/8', { layers: only('drums'), grade })).flatMap((o) =>
        o.layer === 'drums' && o.note === DRUM_NOTES.closedHat ? [o.velocity] : [],
      );
    const full = hats(1);
    expect(full[0]).toBe(Math.max(...full));
    expect(new Set(full).size).toBeGreaterThan(2);
    expect(new Set(hats(0).slice(1)).size).toBe(1);
  });
});

describe('the hemiola', () => {
  it('is `parallel` of 6/8 and 3/4: the two groupings, the bar kept and its pulses regrouped', () => {
    const six = METERS['6/8'];
    const three = METERS['3/4'];
    expect(parallel(three, six)).toEqual(six);
    expect(parallel(six, three)).toEqual(three);
    expect(gaps(parallel(six, three))).toEqual([2, 2, 2]);
    expect(gaps(parallel(three, six))).toEqual([3, 3]);
    expect(six.cycle).toBe(three.cycle);
  });

  it('pairs each meter that has one with a meter of the same bar, both ways', () => {
    for (const [name, partner] of Object.entries(HEMIOLA) as [MeterName, MeterName][]) {
      expect(HEMIOLA[partner]).toBe(name);
      expect(METERS[partner].cycle).toBe(METERS[name].cycle);
    }
  });

  it('moves the bass onto the other meter’s pulses and leaves the drums and the click alone', () => {
    for (const [name, partner] of Object.entries(HEMIOLA) as [MeterName, MeterName][]) {
      const straight = barPlan(setting(name));
      const regrouped = barPlan(setting(name, { hemiola: true }));
      const of = (plan: typeof straight, layer: Layer) => plan.filter((o) => o.layer === layer);
      expect(of(regrouped, 'drums')).toEqual(of(straight, 'drums'));
      expect(of(regrouped, 'click')).toEqual(of(straight, 'click'));
      expect(of(regrouped, 'bass').map((o) => o.step)).toEqual(
        meterOnSteps(METERS[partner]).heights,
      );
      expect(of(regrouped, 'bass')).not.toEqual(of(straight, 'bass'));
    }
  });

  it('does nothing in a meter with none', () => {
    for (const name of names.filter((n) => HEMIOLA[n] === undefined))
      expect(barPlan(setting(name, { hemiola: true }))).toEqual(barPlan(setting(name)));
  });
});
