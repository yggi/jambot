/**
 * E46: what tells a section's kind apart, measured (yggi/cells#571 step 1, #547 rung 5's groundwork; twin #645). No
 * behaviour changes: it reads what the band plays.
 *
 * Jambot's section chain (`form.ts`) has six kinds, intro, groove, bridge, build, drop and breakdown, and shapes each
 * bar's energy from the style's by the kind (`barEnergy`, `ENERGY_OFFSET`); the parts read that energy, and some read
 * the kind itself (who rests in a breakdown). The question #571 asks before a section's style is spelled as an offset
 * from the song's: is a section's intensity one scalar that drives every component the band plays, or more than one?
 *
 * Each bar of the band, held at each of the prototype's eight presets (entropy 0.3, the preset's swing and mode), is
 * read for six components: its density (onsets per step, every part, a chord one onset), its layers (parts sounding),
 * its mean velocity, its register (the mean pitch of the parts but the drums), the lead's filter (its mean cutoff, in
 * hertz, where it plays) and cells' reading of it (`readStyle`: `sync` and `bite`, the style axes a bar can say). Per
 * component it gives each kind's mean, the share of the component's variance the kind explains (η²), and its
 * correlation with the bar's energy (Pearson's r): a component that rises and falls with the energy alone is the one
 * scalar; one that the kind explains past the energy is more. The tempo is no component: no section moves it.
 *
 * Step 1b (the owner's frame on #571): the distance between adjacent sections, each read as the mean of its bars'
 * `sync`, `bite` and density (the root of the mean squared difference), by the kind a section moves to.
 *
 * It runs under vitest: `E46_REPORT=1 pnpm vitest run --silent=false packages/engine/experiments/section-intensity.test.ts`
 * prints the tables.
 */

import { stepsOf } from '@jambot/theory';
import {
  type MeterSwing,
  PROTOTYPE_PRESETS,
  SECTION_BARS,
  type Style,
  band,
  presetSwing,
  readStyle,
} from '../src/index.ts';
import { presetMode } from '../src/mode-repository.ts';
import { SECTION_TYPES, type SectionType } from '../src/form.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

/** The components a bar is read for. */
export const COMPONENTS = [
  'density',
  'layers',
  'velocity',
  'register',
  'filter',
  'sync',
  'bite',
] as const;
export type Component = (typeof COMPONENTS)[number];

/** One bar the band played, read. A component it has no reading of (no pitched note, no lead, no reading) is absent. */
export interface SectionBar {
  readonly preset: string;
  readonly seed: number;
  readonly bar: number;
  readonly kind: SectionType;
  readonly energy: number;
  readonly values: Readonly<Partial<Record<Component, number>>>;
}

/** The bars of the band held at a preset's style (entropy 0.3), in its swing and mode, each read. */
export function sectionBars(
  preset: (typeof PROTOTYPE_PRESETS)[number],
  seed: number,
  bars: number,
): SectionBar[] {
  const style: Style = { ...preset.style, entropy: 0.3 };
  const swing: MeterSwing = presetSwing(preset)!;
  let carried = band.initial;
  return range(bars).map((bar) => {
    const out = band.advance(
      {
        seed,
        bar,
        style,
        swing,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        offer: null,
      },
      carried,
      null,
    );
    carried = out.carried;
    const { dough, plan, barEnergy, meter } = out.output;
    const steps = stepsOf(meter);
    const onsets = new Set(dough.map((n) => `${n.part} ${n.step}`)).size;
    const pitched = dough.filter((n) => n.part !== 'drums');
    const lead = dough.filter((n) => n.part === 'lead' && n.cutoff !== undefined);
    const reading = readStyle(dough, meter);
    const values: Partial<Record<Component, number>> = {
      density: onsets / steps,
      layers: new Set(dough.map((n) => n.part)).size,
    };
    if (dough.length) values.velocity = mean(dough.map((n) => n.velocity));
    if (pitched.length) values.register = mean(pitched.map((n) => n.note));
    if (lead.length) values.filter = mean(lead.map((n) => n.cutoff!));
    if (reading.sync !== undefined) values.sync = reading.sync;
    if (reading.bite !== undefined) values.bite = reading.bite;
    return { preset: preset.name, seed, bar, kind: plan.section.type, energy: barEnergy, values };
  });
}

/** Every bar of the measurement: the eight presets × `seeds` × `bars`. */
export const measured = (seeds: readonly number[] = [1, 2, 3], bars = 64): SectionBar[] =>
  PROTOTYPE_PRESETS.flatMap((p) => seeds.flatMap((seed) => sectionBars(p, seed, bars)));

/** Pearson's r of two series; 0 where either is constant. */
export function pearson(xs: readonly number[], ys: readonly number[]): number {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i]! - my);
    sxx += (x - mx) ** 2;
    syy += (ys[i]! - my) ** 2;
  });
  return sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
}

/** The share of a value's variance its group explains (η²): the between-group sum of squares over the total. */
export function etaSquared(groups: readonly (readonly number[])[]): number {
  const all = groups.flat();
  const m = mean(all);
  const total = all.reduce((s, x) => s + (x - m) ** 2, 0);
  const between = groups.reduce((s, g) => s + g.length * (mean(g) - m) ** 2, 0);
  return total === 0 ? 0 : between / total;
}

/**
 * The share of a value's variance its group explains past the bar's energy: the between-group sum of squares of what is
 * left after the least-squares line on the energy, over the value's whole sum of squares. A component the kind moves
 * only through the energy leaves nearly none; with `etaSquared` and the line's own share (r²) it splits the variance.
 */
export function etaPastEnergy(
  bars: readonly { kind: SectionType; energy: number; value: number }[],
): number {
  const xs = bars.map((b) => b.energy);
  const ys = bars.map((b) => b.value);
  const mx = mean(xs);
  const my = mean(ys);
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const total = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  const slope = sxx === 0 ? 0 : xs.reduce((s, x, i) => s + (x - mx) * (ys[i]! - my), 0) / sxx;
  const rest = bars.map((b) => ({ kind: b.kind, value: b.value - my - slope * (b.energy - mx) }));
  const groups = SECTION_TYPES.map((k) => rest.filter((r) => r.kind === k).map((r) => r.value));
  const all = groups.flat();
  const m = mean(all);
  const between = groups.reduce((s, g) => s + g.length * (mean(g) - m) ** 2, 0);
  return total === 0 ? 0 : between / total;
}

/** What is measured of one component over the bars. */
export interface ComponentReading {
  readonly component: Component;
  /** The bars that read it. */
  readonly n: number;
  /** Each kind's mean, where the kind played a bar that reads it. */
  readonly byKind: Readonly<Partial<Record<SectionType, number>>>;
  /** The share of its variance the section's kind explains. */
  readonly eta2: number;
  /** The share the kind explains past the bar's energy. */
  readonly eta2PastEnergy: number;
  /** Its correlation with the bar's energy. */
  readonly r: number;
}

/** Each component, read over the bars. */
export function components(bars: readonly SectionBar[]): ComponentReading[] {
  return COMPONENTS.map((component) => {
    const read = bars.flatMap((b) => {
      const value = b.values[component];
      return value === undefined ? [] : [{ kind: b.kind, energy: b.energy, value }];
    });
    const byKind = Object.fromEntries(
      SECTION_TYPES.flatMap((k) => {
        const of = read.filter((r) => r.kind === k).map((r) => r.value);
        return of.length ? [[k, mean(of)]] : [];
      }),
    );
    return {
      component,
      n: read.length,
      byKind,
      eta2: etaSquared(
        SECTION_TYPES.map((k) => read.filter((r) => r.kind === k).map((r) => r.value)),
      ),
      eta2PastEnergy: etaPastEnergy(read),
      r: pearson(
        read.map((r) => r.energy),
        read.map((r) => r.value),
      ),
    };
  });
}

/** How many bars of each kind the measurement played. */
export const kindCounts = (bars: readonly SectionBar[]): Readonly<Record<SectionType, number>> =>
  Object.fromEntries(
    SECTION_TYPES.map((k) => [k, bars.filter((b) => b.kind === k).length]),
  ) as Record<SectionType, number>;

/** A section read as the mean of its bars' `sync`, `bite` and density, each where its bars read it. */
interface SectionReading {
  readonly kind: SectionType;
  readonly point: readonly [number, number, number];
}

/** The sections of one run (one preset, one seed), in order, each read. */
function sectionsOf(bars: readonly SectionBar[]): SectionReading[] {
  return range(Math.floor(bars.length / SECTION_BARS)).map((s) => {
    const of = bars.slice(s * SECTION_BARS, (s + 1) * SECTION_BARS);
    const axis = (c: Component) =>
      mean(of.flatMap((b) => (b.values[c] === undefined ? [] : [b.values[c]!])));
    return { kind: of[0]!.kind, point: [axis('sync'), axis('bite'), axis('density')] };
  });
}

/** The distance between two section readings: the root of the mean squared difference over `sync`, `bite` and density. */
const distance = (a: SectionReading, b: SectionReading) =>
  Math.sqrt(mean(a.point.map((x, i) => (x - b.point[i]!) ** 2)));

/** Step 1b: the distance between adjacent sections over every run, overall and by the kind a section moves to. */
export function adjacent(bars: readonly SectionBar[]): {
  readonly n: number;
  readonly mean: number;
  readonly byKind: Readonly<Partial<Record<SectionType, number>>>;
} {
  const runs = new Map<string, SectionBar[]>();
  for (const b of bars) {
    const key = `${b.preset} ${b.seed}`;
    runs.set(key, [...(runs.get(key) ?? []), b]);
  }
  const steps = [...runs.values()].flatMap((run) => {
    const sections = sectionsOf(run);
    return sections.slice(1).map((to, i) => ({ to: to.kind, d: distance(sections[i]!, to) }));
  });
  return {
    n: steps.length,
    mean: mean(steps.map((s) => s.d)),
    byKind: Object.fromEntries(
      SECTION_TYPES.flatMap((k) => {
        const of = steps.filter((s) => s.to === k).map((s) => s.d);
        return of.length ? [[k, mean(of)]] : [];
      }),
    ),
  };
}
