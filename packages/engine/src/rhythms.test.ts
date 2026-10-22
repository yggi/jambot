import { METERS, type MeterName } from '@jambot/theory';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { describe, expect, it } from 'vitest';
import { type BandBar, type BandCarried, band } from './band.ts';
import { CLAVES_NOTE } from './drums.ts';
import { DRUM_ROLES } from './events.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { stylePoint } from './meter-query.ts';
import { METER_REPOSITORY, presetSwing } from './repository.ts';
import { composedRhythm, isOwnLine } from './rhythm-query.ts';
import {
  RHYTHM_BENCHES,
  RHYTHM_REPOSITORY,
  cellsFit,
  readRhythm,
  rhythmRepository,
} from './rhythms.ts';
import { pullOf } from './novelty.ts';
import { PRESETS, holding } from './style.ts';
import { holdingSwing } from './swing.ts';
import {
  LOOKAHEAD,
  type TransportCarried,
  type TransportEnv,
  forecast,
  transport,
} from './transport.ts';
import { presetMode } from './mode-repository.ts';

const FUNK = PRESETS.find((p) => p.name === 'Funk')!;

/** A preset held at entropy 0.3, 32 bars at a seed, the meter the repository's (as the app plays), with the rhythm or without (main). */
function run(
  preset: (typeof PRESETS)[number],
  seed: number,
  rhythms: boolean,
  layer?: LearnedLayer,
  learned?: (carried: BandCarried) => void,
): BandBar[] {
  let carried: BandCarried = band.initial;
  return Array.from({ length: 32 }, (_, bar) => {
    const out = band.advance(
      {
        seed,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        swing: presetSwing(preset)!,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        offer: null,
        repository: METER_REPOSITORY,
        ...(rhythms ? { rhythms: RHYTHM_REPOSITORY } : {}),
        ...(layer ? { layer } : {}),
      },
      carried,
      null,
    );
    carried = out.carried;
    learned?.(carried);
    return out.output;
  });
}

const drums = (bar: BandBar) => bar.written.filter((w) => w.part === 'drums');
const keyOf = (w: { step: number; note: number }) => w.step * 128 + w.note;
const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Each preset's 2 seeds of 32 bars, on main and with the rhythm, bar beside bar. */
const PAIRS = PRESETS.map((preset) => ({
  preset: preset.name,
  bars: [0, 1].flatMap((seed) => {
    const [main, built] = [run(preset, seed, false), run(preset, seed, true)];
    return main.map((bar, i) => ({ main: bar, built: built[i]! }));
  }),
}));

describe("cells' rhythms, as the composer asks them (#397)", () => {
  it('reads every rhythm under 4/4 played straight: the 8 drum bars E31’s 144 hits, a line a role, the claves 5 strokes a lap on their own sound, General MIDI’s 75 (cells v0.7.0)', () => {
    const read = RHYTHM_FRAGMENTS.map((f) => ({ id: f.id, ...readRhythm(f.text, METERS['4/4'])! }));
    const drumBars = read.filter((r) => r.id.endsWith(' drums'));
    expect(drumBars).toHaveLength(8);
    expect(drumBars.reduce((n, r) => n + r.hits.length, 0)).toBe(144);
    expect(new Set(drumBars.flatMap((r) => r.hits.map((h) => h.role)))).toEqual(
      new Set(DRUM_ROLES.filter((role) => role !== 'clave')),
    );
    for (const r of read.filter((x) => !x.id.endsWith(' drums'))) {
      expect(
        r.hits.map((h) => [h.role, h.note]),
        r.id,
      ).toEqual(Array(5).fill(['clave', CLAVES_NOTE]));
      expect(r.bars, r.id).toBe(r.id.endsWith('(one bar)') ? 1 : 2);
    }
  });

  it('finds each preset’s own drum bar at its point, under the meter its sections choose, and the clave near Funk and Bossa nova', () => {
    const found = PRESETS.map((preset) => {
      const meter = METER_REPOSITORY.query(stylePoint(preset.style))[0]!.id;
      const bench = { meter: METER_REPOSITORY.fragments.get(meter)!.meter, meterFragment: meter };
      return [preset.name, composedRhythm(RHYTHM_REPOSITORY, preset.style, bench, null)];
    });
    expect(Object.fromEntries(found)).toEqual({
      'Synth-pop': { rhythmFragment: 'Synth-pop drums' },
      Techno: { rhythmFragment: 'Techno drums' },
      'Deep house': { rhythmFragment: 'Deep house drums' },
      Ambient: { rhythmFragment: 'Ambient drums' },
      'Lo-fi hip hop': { rhythmFragment: 'Lo-fi hip hop drums' },
      Funk: { rhythmFragment: 'Funk drums', claveFragment: 'rumba clave 3-2' },
      'Bossa nova': {
        rhythmFragment: 'Bossa nova drums',
        claveFragment: 'bossa nova clave (one bar)',
      },
      'Swing jazz': { rhythmFragment: 'Swing jazz drums' },
    });
  });

  it('misses under every meter but the 4/4s, at every preset’s point: no rhythm fits, and the drummer invents', () => {
    const misses = (['3/4', '6/8', '12/8', '5/4', '7/8', '10/8'] as MeterName[]).flatMap((name) =>
      PRESETS.map((p) => composedRhythm(RHYTHM_REPOSITORY, p.style, { meter: METERS[name] }, null)),
    );
    expect(misses).toEqual(misses.map(() => ({})));
  });
});

describe('the band with the rhythm against main: 8 presets held × 2 seeds × 32 bars (#397)', () => {
  it('plays every other part as main does, note for note and velocity for velocity', () => {
    for (const { preset, bars } of PAIRS)
      for (const { main, built } of bars)
        expect(
          built.dough.filter((d) => d.part !== 'drums'),
          `${preset} ${main.bar}`,
        ).toEqual(main.dough.filter((d) => d.part !== 'drums'));
  });

  it('keeps the drummer’s hits per role by section type within 0.2 of main’s, and its fills exactly', () => {
    for (const { preset, bars } of PAIRS) {
      const types = [...new Set(bars.map((b) => b.main.plan.section.type))];
      for (const type of types)
        for (const role of DRUM_ROLES.filter((r) => r !== 'clave')) {
          const of = bars.filter((b) => b.main.plan.section.type === type);
          const count = (bar: BandBar) => drums(bar).filter((w) => w.role === role).length;
          const apart = Math.abs(
            mean(of.map((b) => count(b.built))) - mean(of.map((b) => count(b.main))),
          );
          expect(apart, `${preset} ${type} ${role}`).toBeLessThan(0.2);
        }
      const fills = (pick: 'main' | 'built') =>
        bars.map((b) => drums(b[pick]).some((w) => w.role === 'fill'));
      expect(fills('built'), preset).toEqual(fills('main'));
    }
  });

  it('moves this many of the drummer’s hits a bar to the fragment’s steps, and adds the clave’s line at Funk and Bossa nova', () => {
    const measured = PAIRS.map(({ preset, bars }) => {
      const each = bars.map(({ main, built }) => {
        const [a, b] = [drums(main), drums(built).filter((w) => w.role !== 'clave')];
        const there = new Set(b.map(keyOf));
        const shared = a.filter((w) => there.has(keyOf(w))).length;
        return {
          overlap: shared / new Set([...a.map(keyOf), ...b.map(keyOf)]).size || 1,
          moved: a.length - shared,
          hits: a.length,
          clave: drums(built).length - b.length,
        };
      });
      return [
        preset,
        r2(mean(each.map((e) => e.overlap))),
        r2(mean(each.map((e) => e.moved))),
        r2(mean(each.map((e) => e.hits))),
        r2(mean(each.map((e) => e.clave))),
      ];
    });
    // [preset, overlap with main's bar, main's hits a bar on other steps, main's hits a bar, clave strokes a bar]
    // (every stroke of the clave's lap: on its own sound, none falls to a rim on its step)
    expect(measured).toEqual([
      ['Synth-pop', 0.77, 1.53, 14.33, 0],
      ['Techno', 0.8, 1.91, 18.14, 0],
      ['Deep house', 0.78, 1.7, 17.05, 0],
      ['Ambient', 0.75, 0.88, 3.97, 0],
      ['Lo-fi hip hop', 0.61, 3, 14.67, 0],
      ['Funk', 0.71, 4.3, 26.02, 2.5],
      ['Bossa nova', 0.66, 2.81, 14.42, 5],
      ['Swing jazz', 0.78, 1.44, 12.52, 0],
    ]);
  });
});

describe('the rhythm and the learned layer (#397, #398)', () => {
  it('asks with the layer the band carries, plays what it plays with none, and learns the rhythm, the clave and the meter kept as used together', () => {
    const funk = PRESETS.find((p) => p.name === 'Funk')!;
    let layer: LearnedLayer | null = null;
    const bars = run(funk, 1, true, EMPTY_LAYER, (carried) => {
      layer = carried.plans.layer;
    });
    expect(bars.map((b) => b.dough)).toEqual(run(funk, 1, true).map((b) => b.dough));
    const learned = layer! as LearnedLayer;
    expect(new Set(learned.points.map((p) => p.id))).toEqual(
      new Set(['4/4 leaning lightly on 16n', 'Funk drums', 'rumba clave 3-2']),
    );
    expect(
      learned.points.filter((p) => p.id === 'rumba clave 3-2').every((p) => p.facet === 'rhythm'),
    ).toBe(true);
    // 4 sections played, and the fifth decided a bar ahead: each the rhythm and the clave kept together, and each with the meter (#401)
    expect(learned.together).toEqual([
      { ids: ['4/4 leaning lightly on 16n', 'Funk drums'], count: 5 },
      { ids: ['4/4 leaning lightly on 16n', 'rumba clave 3-2'], count: 5 },
      { ids: ['Funk drums', 'rumba clave 3-2'], count: 5 },
    ]);
  });
});

describe('the pull of a group the composer keeps, from its place on the ladder (#389)', () => {
  // Between Funk's point and Synth-pop's, the point where another drum bar is nearer than Funk's by 0.01: half what a
  // group known together pulls at entropy 0 (pull 0.2 × cells' reach 0.1), and more than nothing pulls at 1. (A clave
  // nearer doesn't count: it is never a section's rhythm, #428.)
  const FUNK = PRESETS.find((p) => p.name === 'Funk')!.style;
  const POP = PRESETS[0]!.style;
  const bench = { meter: METERS['4/4'] };
  const at = (t: number) =>
    Object.fromEntries(
      (['sync', 'harm', 'artic', 'energy'] as const).map((axis) => [
        axis,
        FUNK[axis] + (POP[axis] - FUNK[axis]) * t,
      ]),
    ) as Pick<typeof FUNK, 'sync' | 'harm' | 'artic' | 'energy'>;
  const drumBars = (t: number) =>
    RHYTHM_REPOSITORY.query(stylePoint(at(t)), bench).filter(
      (f) => !isOwnLine(RHYTHM_REPOSITORY.read(f.id, bench.meter)!),
    );
  /** How much nearer the nearest other drum bar lies than Funk's. */
  const lead = (t: number) => {
    const found = drumBars(t);
    const funk = found.find((f) => f.id === 'Funk drums')!.distance;
    return funk - found.find((f) => f.id !== 'Funk drums')!.distance;
  };
  let [low, high] = [0, 1];
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (lead(mid) < 0.01) low = mid;
    else high = mid;
  }
  const style = at(high);
  const [rival] = drumBars(high);
  // Funk's drum bar and the 4/4 meter fragment, known together (cells' 10 uses)
  const layer: LearnedLayer = {
    ...EMPTY_LAYER,
    together: [{ ids: ['4/4', 'Funk drums'], count: 10 }],
  };
  const taken = (entropy: number) =>
    composedRhythm(RHYTHM_REPOSITORY, style, bench, null, layer, ['4/4'], [], pullOf(entropy))
      .rhythmFragment;

  it('keeps the group at entropy 0 (repeat), and follows the style at entropy 1 (fetch far): the nearest by style alone', () => {
    expect(lead(high)).toBeCloseTo(0.01, 6);
    expect(rival!.id).not.toBe('Funk drums');
    expect(taken(0)).toBe('Funk drums');
    expect(taken(1)).toBe(rival!.id);
  });
});

describe('the rhythm repository warmed ahead (#397, review of #407)', () => {
  it('tests every fit a section can ask for while it warms, a step at a time, and none after', () => {
    let fits = 0;
    const fit = cellsFit();
    const repository = rhythmRepository(undefined, (fragment, workbench) => {
      fits++;
      return fit(fragment, workbench);
    });
    expect(RHYTHM_BENCHES.length).toBe(11 + Object.keys(METERS).length);
    const steps = [...repository.warm!(RHYTHM_BENCHES)].length;
    const warmed = fits;
    // (48 of the steps are the 8 drum bars' variations on each bench each fits, which the composer's ladder asks for, #442)
    expect([steps, warmed]).toEqual([1420, 740]);
    // Every preset's point and a spread of others, on every bench, a clave playing or none, with a layer and without.
    const styles = [
      ...PRESETS.map((p) => p.style),
      ...Array.from({ length: 50 }, (_, i) => ({
        sync: (i * 0.618) % 1,
        harm: (i * 0.414) % 1,
        artic: (i * 0.732) % 1,
        energy: (i * 0.236) % 1,
      })),
    ];
    for (const style of styles)
      for (const bench of RHYTHM_BENCHES) {
        const found = composedRhythm(repository, style, bench, null);
        composedRhythm(repository, style, bench, found, EMPTY_LAYER);
        for (const id of [found.rhythmFragment, found.claveFragment])
          if (id) repository.read(id, bench.meter);
      }
    expect(fits).toBe(warmed);
  });

  it('leaves a song no fit to test in its first section once the forecast from its start has run (#408)', () => {
    // The player keeps that forecast while stopped, at load and at every control moved, so a song starts warm.
    for (const preset of PRESETS) {
      let fits = 0;
      const fit = cellsFit();
      const rhythms = rhythmRepository(undefined, (fragment, workbench) => {
        fits++;
        return fit(fragment, workbench);
      });
      const env: TransportEnv = {
        seed: 0,
        start: 1,
        track: holding({ ...preset.style, entropy: 0.3 }),
        swing: holdingSwing(presetSwing(preset)!),
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        repository: METER_REPOSITORY,
        rhythms,
        layer: EMPTY_LAYER,
      };
      forecast(env, null, 48);
      const forecast48 = fits;
      expect([preset.name, forecast48 > 0]).toEqual([preset.name, true]);
      let carried: TransportCarried | null = transport.initial;
      for (let now = env.start - 0.1; (carried?.nextBar ?? 0) < 8; now += 0.1)
        carried = transport.advance(env, carried, { now, until: now + LOOKAHEAD }).carried;
      expect([preset.name, fits]).toEqual([preset.name, forecast48]);
    }
  });
});

describe('a groove filed, warmed ahead (#412)', () => {
  it('warms the grooves a layer filed on every bench, so no section near one tests a fit or reads afresh, and a second warming takes no step', () => {
    let fits = 0;
    let reads = 0;
    const fit = cellsFit();
    const repository = rhythmRepository(
      undefined,
      (fragment, workbench) => {
        fits++;
        return fit(fragment, workbench);
      },
      (text, meter) => {
        reads++;
        return readRhythm(text, meter);
      },
    );
    for (const step of repository.warm!(RHYTHM_BENCHES)) void step;
    // The drummer's groove, filed where the second section is planned in 5/4, where no rhythm of cells' fits (as muse-files.test.ts).
    const style = { ...FUNK.style, entropy: 0.3 };
    let carried: BandCarried = band.initial;
    for (let bar = 0; bar < 8; bar++)
      carried = band.advance(
        {
          seed: 1,
          bar,
          style,
          swing: presetSwing(FUNK)!,
          wish: { tonic: null, mode: presetMode(FUNK)!, melodic: null },
          offer: null,
          repository: METER_REPOSITORY,
          rhythms: repository,
          meter: METERS['5/4'],
          layer: EMPTY_LAYER,
        },
        carried,
        null,
      ).carried;
    const layer = carried.plans.layer!;
    expect(layer.filed.map((f) => f.fragment.id)).toEqual(['drummer song 1, bar 0']);
    const steps = [...repository.warm!(RHYTHM_BENCHES, layer)].length;
    expect(steps).toBeGreaterThan(0);
    const warmed = [fits, reads];
    // The filing's point and points around it, within the miss distance, on every bench, a clave playing or none.
    const point = stylePoint(style);
    const near = Array.from({ length: 20 }, (_, i) => ({
      sync: point.sync! + ((i % 5) - 2) * 0.05,
      harm: point.harm! + (((i * 3) % 5) - 2) * 0.05,
      artic: point.artic!,
      energy: point.energy! + ((i % 4) - 1.5) * 0.04,
    }));
    for (const at of near)
      for (const bench of RHYTHM_BENCHES) {
        const found = composedRhythm(repository, at, bench, null, layer);
        composedRhythm(repository, at, bench, found, layer);
        for (const id of [found.rhythmFragment, found.claveFragment])
          if (id) repository.read(id, bench.meter, layer);
      }
    expect([fits, reads]).toEqual(warmed);
    expect([...repository.warm!(RHYTHM_BENCHES, layer)].length).toBe(0);
  });
});
