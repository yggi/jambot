import { METERS, type MeterName } from '@jambot/theory';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { describe, expect, it } from 'vitest';
import { type BandBar, type BandCarried, band } from './band.ts';
import { DRUM_ROLES } from './events.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { stylePoint } from './meter-query.ts';
import { METER_REPOSITORY } from './repository.ts';
import { composedRhythm } from './rhythm-query.ts';
import {
  RHYTHM_BENCHES,
  RHYTHM_REPOSITORY,
  cellsFit,
  readRhythm,
  rhythmRepository,
} from './rhythms.ts';
import { PRESETS } from './style.ts';

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
        swing: preset.swing,
        wish: { tonic: null, mode: preset.mode, melodic: null },
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
  it('reads every rhythm under 4/4 played straight: the 8 drum bars E31’s 144 hits, a line a role, the claves 5 strokes a lap', () => {
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
      ).toEqual(Array(5).fill(['clave', 37]));
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
    expect(measured).toEqual([
      ['Synth-pop', 0.77, 1.53, 14.33, 0],
      ['Techno', 0.8, 1.91, 18.14, 0],
      ['Deep house', 0.78, 1.7, 17.05, 0],
      ['Ambient', 0.75, 0.88, 3.97, 0],
      ['Lo-fi hip hop', 0.61, 3, 14.67, 0],
      ['Funk', 0.71, 4.3, 26.02, 1.66],
      ['Bossa nova', 0.66, 2.81, 14.42, 3.06],
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
    expect([steps, warmed]).toEqual([838, 740]);
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
});
