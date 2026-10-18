import { readFragment } from '@yggi/cells/repository/files';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { describe, expect, it } from 'vitest';
import { band } from './band.ts';
import { NO_HISTORY } from './history.ts';
import {
  EMPTY_LAYER,
  LAYER_CAP,
  type LearnedLayer,
  cappedLayer,
  filedFiles,
  layerBytes,
} from './layer.ts';
import { composedMeter, stylePoint } from './meter-query.ts';
import { type PlanCarried, type PlanEnv, planner } from './plan.ts';
import { walkRadio } from './radio.ts';
import { METER_REPOSITORY, meterLayerProblems } from './repository.ts';
import { PRESETS, PRESET_GLIDE, type Style, glideTo, holding } from './style.ts';
import { STRAIGHT, holdingSwing } from './swing.ts';
import {
  LOOKAHEAD,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  clockOfTransport,
  transport,
} from './transport.ts';

/** The transport over 32 bars: every event. */
function events(env: TransportEnv): TimedEvent[] {
  let carried: TransportCarried | null = transport.initial;
  const out: TimedEvent[] = [];
  for (let now = env.start - 0.1; ; now += 0.1) {
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
    carried = next.carried!;
    out.push(...next.output.events.filter((e) => e.bar < 32));
    if (carried.head.step > clockOfTransport(carried).barStart(32)) return out;
  }
}

/** FNV-1a over every event's bar, part, step, note, velocity, onset and duration, to 1e-9 s. */
function hashOf(all: readonly TimedEvent[]): string {
  let h = 0x811c9dc5;
  for (const { bar, event, seconds, duration } of all) {
    const line = `${bar} ${event.part} ${event.step} ${event.note} ${event.velocity} ${seconds.toFixed(9)} ${duration.toFixed(9)}\n`;
    for (let i = 0; i < line.length; i++) h = Math.imul(h ^ line.charCodeAt(i), 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Each preset at entropy `entropy`, 2 seeds, the style held or walked by the radio a section at a time. */
function runs(entropy: number, walked: boolean, extra: Partial<TransportEnv> = {}) {
  return PRESETS.flatMap((preset) =>
    [0, 1].map((seed) => {
      let style = { ...preset.style, entropy };
      let track = holding(style);
      if (walked)
        for (let section = 1; section < 4; section++) {
          style = walkRadio(style, seed, section);
          track = glideTo(track, style, section * 128, PRESET_GLIDE);
        }
      return events({
        seed,
        start: 1,
        track,
        wish: { tonic: null, mode: preset.mode, melodic: null },
        swing: holdingSwing(STRAIGHT),
        repository: METER_REPOSITORY,
        ...extra,
      });
    }),
  );
}

const range = (n: number) => [...Array(n).keys()];

/** Main's events, as recorded on `main` at 22c47fe before the layer was carried: their count and hash. */
const MAIN = { held: [15061, '98f62766'], walked: [13019, '6444f418'] } as const;

describe('the band given an empty learned layer plays exactly what main plays (#398)', () => {
  it('over the 8 presets held, 2 seeds of 32 bars: 15,061 events, each to 1e-9 s', () => {
    for (const extra of [{}, { layer: EMPTY_LAYER }]) {
      const all = runs(0.3, false, extra).flat();
      expect([all.length, hashOf(all)]).toEqual(MAIN.held);
    }
  });

  it('over the 8 presets walked by the radio at entropy 1, 2 seeds of 32 bars: 13,019 events', () => {
    for (const extra of [{}, { layer: EMPTY_LAYER }]) {
      const all = runs(1, true, extra).flat();
      expect([all.length, hashOf(all)]).toEqual(MAIN.walked);
    }
  });
});

/** The planner over `sections` sections at one style, from `layer`, and what it carried after each. */
function planned(
  style: Style,
  layer: LearnedLayer | undefined,
  sections: number,
  meter?: PlanEnv['meter'],
) {
  let carried: PlanCarried = planner.initial;
  return range(sections).map((index) => {
    const env: PlanEnv = {
      seed: 1,
      index,
      style,
      wish: { tonic: null, mode: 'aeolian', melodic: null },
      history: NO_HISTORY,
      repository: METER_REPOSITORY,
      layer,
      meter,
    };
    carried = planner.advance(env, carried, null).carried;
    return carried;
  });
}

const SYNTH_POP = { ...PRESETS[0]!.style, entropy: 0.3 };
/** Synth-pop's style, moved off its meter's point. */
const OFF = { ...SYNTH_POP, sync: SYNTH_POP.sync + 0.05, energy: SYNTH_POP.energy - 0.05 };
const seedPoint = (id: string) => METER_FRAGMENTS.find((f) => f.id === id)!.association[0]!;

describe('the composer learns each meter it keeps, a use at the section’s point (#398)', () => {
  it('raises the point that found the meter by 0.1 a section, to 1.2 at most, and adds no place', () => {
    const id = composedMeter(METER_REPOSITORY, OFF, null)!.id;
    const after = planned(OFF, EMPTY_LAYER, 4).map((c) => c.layer!);
    const { point, facet } = seedPoint(id);
    expect(after[0]!.points).toEqual([{ id, point, weight: 1.1, facet }]);
    expect(after.map((l) => l.points.map((p) => p.weight))).toEqual([[1.1], [1.2], [1.2], [1.2]]);
    expect(after[3]!.together).toEqual([]);
    expect(after[3]!.filed).toEqual([]);
  });

  it('learns nothing given no layer, from a meter asked for, or on a miss', () => {
    expect(planned(OFF, undefined, 3).map((c) => c.layer)).toEqual([null, null, null]);
    const meter = METER_REPOSITORY.fragments.get('7/8')!.meter;
    expect(planned(OFF, EMPTY_LAYER, 3, meter).map((c) => c.layer)).toEqual([
      EMPTY_LAYER,
      EMPTY_LAYER,
      EMPTY_LAYER,
    ]);
    // Every axis at its end: no meter lies within the miss distance of this corner.
    const corner = { ...SYNTH_POP, sync: 1, harm: 0, artic: 1, energy: 0 };
    expect(composedMeter(METER_REPOSITORY, corner, null)).toBeNull();
    expect(planned(corner, EMPTY_LAYER, 3).map((c) => c.layer)).toEqual([
      EMPTY_LAYER,
      EMPTY_LAYER,
      EMPTY_LAYER,
    ]);
  });

  it('moves a border by what it learned: a meter kept reaches a fifth farther, no more', () => {
    // Along the line from 4/4's point to 5/4's, once 4/4 was kept at its point.
    const [a, b] = [seedPoint('4/4').point, seedPoint('5/4').point];
    const along = (t: number) =>
      Object.fromEntries(
        Object.keys(a).map((axis) => [axis, a[axis]! + t * (b[axis]! - a[axis]!)]),
      );
    const learned = planned({ ...SYNTH_POP, ...a }, EMPTY_LAYER, 3).at(-1)!.layer!;
    expect(learned.points.map((p) => [p.id, p.weight])).toEqual([['4/4', 1.2]]);
    let flips = 0;
    for (const t of range(201).map((i) => i / 200)) {
      const found = METER_REPOSITORY.query(along(t));
      const [nearest, own] = [found[0]!.distance, found.find((f) => f.id === '4/4')!.distance];
      const first = METER_REPOSITORY.query(along(t), learned)[0]!.id;
      if (first !== found[0]!.id) flips++;
      // 4/4 is first wherever it lies within 1.2 times the nearest's distance, and nowhere else.
      if (own < 1.2 * nearest - 1e-9) expect(first, `at ${t}`).toBe('4/4');
      else if (own > 1.2 * nearest + 1e-9) expect(first, `at ${t}`).toBe(found[0]!.id);
    }
    expect(flips).toBeGreaterThan(0);
  });

  it('plays the same from the same seed, style and layer: the plans carry the layer, so a forecast learns as the band will', () => {
    const play = () => {
      let carried = band.initial;
      const bars = range(96).map((bar) => {
        const step = band.advance(
          {
            seed: 3,
            bar,
            style: bar < 48 ? OFF : { ...OFF, harm: OFF.harm + 0.1 },
            wish: { tonic: null, mode: 'aeolian', melodic: null },
            repository: METER_REPOSITORY,
            layer: EMPTY_LAYER,
            offer: null,
          },
          carried,
          null,
        );
        carried = step.carried;
        return step.output;
      });
      return { bars, layer: carried.plans.layer };
    };
    const [one, two] = [play(), play()];
    expect(two.bars).toEqual(one.bars);
    expect(JSON.stringify(two.layer)).toBe(JSON.stringify(one.layer));
    expect(one.layer!.points.length).toBeGreaterThan(0);
  });
});

/** A learned point, `n` of them, each naming its fragment. */
const points = (n: number, id = '4/4') =>
  range(n).map((i) => ({
    id,
    point: { sync: i / n, harm: 0.5, artic: 0.5, energy: 0.5 },
    weight: 1.1,
    facet: 'meter',
  }));

describe('the layer within its cap (#398)', () => {
  it('is the same layer under the cap', () => {
    const layer = { ...EMPTY_LAYER, points: points(3) };
    expect(cappedLayer(layer)).toBe(layer);
  });

  it(`drops the oldest points first, then pairs, then filed fragments, until it weighs ${LAYER_CAP.toLocaleString('en')} bytes or less`, () => {
    const many = { ...EMPTY_LAYER, points: points(400) };
    expect(layerBytes(many)).toBeGreaterThan(LAYER_CAP);
    const capped = cappedLayer(many);
    expect(layerBytes(capped)).toBeLessThanOrEqual(LAYER_CAP);
    expect(capped.points).toEqual(many.points.slice(many.points.length - capped.points.length));
    const together = range(50).map((i) => ({ ids: [`a${i}`, `b${i}`] as const, count: 1 }));
    const mixed = cappedLayer({ ...EMPTY_LAYER, points: points(10), together }, 1000);
    expect(mixed.points).toEqual([]);
    expect(mixed.together).toEqual(together.slice(together.length - mixed.together.length));
    expect(layerBytes(mixed)).toBeLessThanOrEqual(1000);
  });

  it('counts the bytes as UTF-8', () => {
    expect(
      layerBytes({ ...EMPTY_LAYER, points: points(1, '4/4 ♭') }) -
        layerBytes({ ...EMPTY_LAYER, points: points(1, '4/4 b') }),
    ).toBe(2);
  });
});

/** A fragment filed, as cells' `fileFragment` files one. */
const filed = (id: string, text = '&bar meter("9/8")') => ({
  fragment: { id, text, association: [{ point: stylePoint(OFF), weight: 0.1, facet: 'meter' }] },
  meta: { source: 'composer', created: '2026-10-18T21:04:00Z' },
  prose: '',
});

describe('a layer the host keeps, read and written (#398)', () => {
  it('names what a query would refuse: a shape not a layer’s, a seed fragment filed', () => {
    expect(meterLayerProblems(EMPTY_LAYER)).toEqual([]);
    expect(meterLayerProblems(null)).toEqual(['the layer is not a map']);
    expect(meterLayerProblems({ filed: [], points: 'x', together: [] })).toEqual([
      'the layer: points is not a list',
    ]);
    expect(meterLayerProblems({ ...EMPTY_LAYER, filed: [filed('4/4')] })).toEqual([
      "the layer files 4/4, a seed fragment's id",
    ]);
  });

  it('leaves out a filed meter the band can’t read yet, so the composer never meets one', () => {
    const layer = { ...EMPTY_LAYER, filed: [filed('composer 2026-10-18T21:04:00Z')] };
    expect(meterLayerProblems(layer)).toEqual([]);
    const found = METER_REPOSITORY.query(stylePoint(OFF), layer);
    expect(found.map((f) => f.id)).toEqual(
      METER_REPOSITORY.query(stylePoint(OFF)).map((f) => f.id),
    );
  });

  it('writes its filed fragments as fragment files, which read back as filed', () => {
    const layer = {
      ...EMPTY_LAYER,
      filed: [filed('composer 2026-10-18T21:04:00Z'), filed('composer 2026-10-18T21:04:00Z!')],
    };
    const files = filedFiles(layer);
    expect(files.map((f) => f.name)).toEqual([
      'composer-2026-10-18T21-04-00Z.md',
      'composer-2026-10-18T21-04-00Z-2.md',
    ]);
    for (const [i, file] of files.entries())
      expect(readFragment(file.text)).toEqual(layer.filed[i]);
  });
});
