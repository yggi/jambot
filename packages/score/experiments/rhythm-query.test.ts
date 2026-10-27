import { PRESETS, stylePoint } from '@jambot/engine';
import { METERS } from '@jambot/theory';
import { unionOf } from '@yggi/cells/repository/fit';
import { describe, expect, it } from 'vitest';
import { witnesses } from './drums-in-cells.ts';
import {
  CO_SELECT,
  ENTRIES,
  RHYTHM_MISS,
  askCorpus,
  atSectionEnergy,
  coSelect,
  compare,
  corpus,
  drumFragmentOf,
  e31Readback,
  entered,
  gridAnswers,
  meterSweep,
  queryCost,
  readFragment,
  report,
  rhythmRepository,
  straightBench,
  workbenchOf,
} from './rhythm-query.ts';

const SECTIONS = corpus();
const ASKED = askCorpus(SECTIONS);
const COMPARED = compare(ASKED);
if (process.env.E36_REPORT) console.log(report(COMPARED));

const of = (preset: string) => COMPARED.find((c) => c.preset === preset)!;
const r2 = (x: number) => Math.round(x * 100) / 100;
const STRAIGHT = { level: '16n', share: 0.5 } as const;

describe('a fragment read back into the band’s drums, E31’s reverse (E36)', () => {
  it('reads every drum bar as E31’s hits under a straight 4/4 at its bpm: note, step, length, velocity and role, 144 of 144', () => {
    const read = e31Readback();
    expect(read.map((r) => r.mismatches)).toEqual(PRESETS.map(() => []));
    expect(read.reduce((n, r) => n + r.matched, 0)).toBe(144);
    expect(read.reduce((n, r) => n + r.hits, 0)).toBe(144);
  });

  it('reads all 144 under the meter each preset’s sections choose: the rim’s Euclid on `1m` swings under a 16n lean as the band swings it, the parts of a step swung (cells#306)', () => {
    const first = new Map(PRESETS.map((p) => [p.name, ASKED.find((s) => s.preset === p.name)!]));
    const read = e31Readback((preset) => {
      const bar = first.get(preset)!.bars[0]!;
      return { text: workbenchOf(bar), meter: bar.meter, swing: bar.swing };
    });
    expect(read.reduce((n, r) => n + r.matched, 0)).toBe(144);
    expect(read.flatMap((r) => r.mismatches)).toEqual([]);
  });

  it('finds what it checks: a hit moved, dropped, struck at another level, or put on another line, is a mismatch', () => {
    const w = witnesses().find((x) => x.preset === 'Funk')!;
    const { bpm } = w.bar.style;
    const text = drumFragmentOf('Funk').text;
    const readWith = (changed: string) => {
      expect(changed).not.toBe(text);
      return readFragment(changed, straightBench(bpm), bpm, METERS['4/4'], STRAIGHT);
    };
    const asBand = (hits: ReturnType<typeof readWith>) =>
      hits.map((h) => `${h.role}:${h.step}:${h.note}:${h.velocity}`).join(' ');
    const base = asBand(readWith(`${text}\n`));
    expect(asBand(readWith(text.replace(/~ &hh:0:([.\d]+)/, '&hh:0:$1 ~')))).not.toBe(base);
    expect(asBand(readWith(text.replace(/&oh:0:[.\d]+/, '~')))).not.toBe(base);
    expect(asBand(readWith(text.replace(/&oh:0:[.\d]+/, '&oh:0:.5')))).not.toBe(base);
    expect(
      asBand(
        readWith(
          text.replace('&ghost step=16n', '&ghosts step=16n').replace('&ghost,', '&ghosts,'),
        ),
      ),
    ).not.toBe(base);
  });
});

describe('the composer’s rhythm over the corpus (E36): 8 presets × 5 seeds × 64 bars, the meter chosen as the workbench', () => {
  it('asks at all 320 sections, and each preset’s finds its own drum bar at distance 0, under the meter its sections choose, with no miss', () => {
    expect(ASKED).toHaveLength(320);
    for (const s of ASKED) {
      expect(s.answer, `${s.preset} ${s.seed} ${s.index}`).toEqual({
        id: `${s.preset} drums`,
        distance: 0,
      });
    }
    expect(
      Object.fromEntries(
        PRESETS.map((p) => [
          p.name,
          ASKED.find((s) => s.preset === p.name)!.bars[0]!.plan.meterFragment,
        ]),
      ),
    ).toEqual({
      'Synth-pop': '4/4',
      Techno: '4/4',
      'Deep house': '4/4 leaning lightly on 16n',
      Ambient: '4/4 leaning faintly on 16n',
      'Lo-fi hip hop': '4/4 leaning on 16n',
      Funk: '4/4 leaning lightly on 16n',
      'Bossa nova': '4/4',
      'Swing jazz': '4/4 swung on 8n',
    });
  });

  it('misses by the fit under every meter but the 4/4s: at every preset’s point, the six others refuse all 13 rhythms', () => {
    const sweep = meterSweep();
    const verdicts = Object.fromEntries(
      [...new Set(sweep.map((r) => r.meter))].map((meter) => [
        meter,
        [
          ...new Set(
            sweep
              .filter((r) => r.meter === meter)
              .map((r) => ('miss' in r.answer ? r.answer.miss : 'found')),
          ),
        ],
      ]),
    );
    expect(verdicts).toEqual({
      '4/4': ['found'],
      '4/4 swung on 8n': ['found'],
      '4/4 leaning on 16n': ['found'],
      '4/4 leaning lightly on 16n': ['found'],
      '4/4 leaning faintly on 16n': ['found'],
      '3/4': ['fit'],
      '6/8': ['fit'],
      '12/8': ['fit'],
      '5/4': ['fit'],
      '7/8': ['fit'],
      '10/8': ['fit'],
    });
  });

  it(`misses over a grid of the four axes, the meter found first: 58 % found, 32 % refused by the fit, 10 % past ${RHYTHM_MISS}`, () => {
    expect(gridAnswers(11)).toEqual({ found: 8506, fit: 4674, distance: 1461 });
  });

  // a bound in wall-clock time, so it runs only when asked: on a shared runner it reads past 5 ms with nothing wrong (5.16 ms, #485's CI)
  it.runIf(process.env.E36_COST)(
    'asks in under 1 ms a section with a workbench seen before, and under 5 ms with one not (cells #148’s numbers)',
    () => {
      // the least of three runs' medians: the tests run beside others, which only ever add time
      const seed1 = SECTIONS.filter((s) => s.seed === 1);
      const runs = [0, 1, 2].map(() => queryCost(seed1, () => performance.now()));
      const cost = {
        none: Math.min(...runs.map((r) => r.none)),
        seen: Math.min(...runs.map((r) => r.seen)),
        unseen: Math.min(...runs.map((r) => r.unseen)),
      };
      expect(cost.none).toBeLessThan(1);
      expect(cost.seen).toBeLessThan(1);
      expect(cost.unseen).toBeLessThan(5);
    },
  );
});

describe('the fragment beside the drummer (E36)', () => {
  it('measures each preset’s drummer against its fragment, and against itself at another seed; the drummer fills 21 to 28 of its 40 sections', () => {
    expect(
      COMPARED.map((c) => ({
        preset: c.preset,
        fragment: c.fragmentHits,
        drummer: r2(c.drummerHits),
        overlap: r2(c.overlap),
        self: r2(c.selfOverlap),
        filled: Math.round(c.drummerFills * 40),
        equal: c.equalBars,
      })),
    ).toEqual([
      {
        preset: 'Synth-pop',
        fragment: 12,
        drummer: 13.7,
        overlap: 0.3,
        self: 0.46,
        filled: 22,
        equal: 0,
      },
      {
        preset: 'Techno',
        fragment: 28,
        drummer: 17.63,
        overlap: 0.5,
        self: 0.64,
        filled: 22,
        equal: 0,
      },
      {
        preset: 'Deep house',
        fragment: 15,
        drummer: 16.32,
        overlap: 0.36,
        self: 0.41,
        filled: 23,
        equal: 0,
      },
      {
        preset: 'Ambient',
        fragment: 18,
        drummer: 3.62,
        overlap: 0.17,
        self: 0.66,
        filled: 21,
        equal: 0,
      },
      // (Lo-fi hip hop's and Funk's rims swing as the drummer's since the parts of a step swing, cells#306)
      {
        preset: 'Lo-fi hip hop',
        fragment: 17,
        drummer: 13.78,
        overlap: 0.27,
        self: 0.34,
        filled: 23,
        equal: 0,
      },
      {
        preset: 'Funk',
        fragment: 24,
        drummer: 23.75,
        overlap: 0.35,
        self: 0.41,
        filled: 28,
        equal: 0,
      },
      {
        preset: 'Bossa nova',
        fragment: 16,
        drummer: 14.26,
        overlap: 0.22,
        self: 0.41,
        filled: 26,
        equal: 0,
      },
      {
        preset: 'Swing jazz',
        fragment: 14,
        drummer: 11.98,
        overlap: 0.41,
        self: 0.47,
        filled: 23,
        equal: 0,
      },
    ]);
  });

  it('holds a fill in every fragment, E31’s witness being a section’s last bar, so the fragment as the bar fills all 8 bars of a section', () => {
    for (const c of COMPARED) {
      expect(c.fragmentRoles, c.preset).toContain('fill');
      expect(c.entries.bar.fills, c.preset).toBe(8);
      for (const entry of ENTRIES.filter((e) => e !== 'bar'))
        expect(c.entries[entry].fills, `${c.preset} ${entry}`).toBe(c.drummerFills);
    }
  });

  it('keeps the drummer’s density by section type only as `groove`: `roles` and `thinned` stay under the fragment, a drop of Synth-pop 8.9 hits a bar against 23.7', () => {
    const synth = of('Synth-pop');
    expect(r2(synth.byType.drop!)).toBe(23.71);
    expect(r2(synth.entries.thinned.byType.drop!)).toBe(8.89);
    expect(r2(synth.entries.bar.byType.intro!)).toBe(12);
    for (const c of COMPARED)
      for (const [type, hits] of Object.entries(c.byType))
        expect(Math.abs(c.entries.groove.byType[type]! - hits), `${c.preset} ${type}`).toBeLessThan(
          0.2,
        );
  });

  it('as `groove`, moves fewer of the drummer’s hits than a seed does, at every preset, and makes its seeds agree more', () => {
    expect(
      COMPARED.map((c) => [
        c.preset,
        r2(c.entries.groove.overlap),
        r2(c.entries.groove.moved),
        r2(c.entries.groove.self),
      ]),
    ).toEqual([
      ['Synth-pop', 0.82, 1.26, 0.52],
      ['Techno', 0.73, 1.95, 0.77],
      ['Deep house', 0.81, 1.61, 0.52],
      ['Ambient', 0.82, 0.68, 0.72],
      // (Lo-fi hip hop's and Funk's rims swing as the drummer's do since the parts of a step swing, cells#306)
      ['Lo-fi hip hop', 0.68, 2.63, 0.5],
      ['Funk', 0.53, 6.09, 0.75],
      ['Bossa nova', 0.6, 4.05, 0.54],
      ['Swing jazz', 0.77, 1.78, 0.6],
    ]);
    for (const c of COMPARED) {
      expect(c.entries.groove.overlap, c.preset).toBeGreaterThan(c.selfOverlap);
      expect(c.entries.groove.self, c.preset).toBeGreaterThan(c.selfOverlap);
    }
  });

  it('builds each entry as it says: a role the drummer doesn’t play is dropped, its count kept, and a line with no band role played as its own', () => {
    const hit = (role: string, step: number, velocity = 80, note = 36) => ({
      role,
      sound: 'kick' as const,
      note,
      step,
      length: 1,
      velocity,
    });
    const fragment = [
      hit('kick', 0, 100),
      hit('kick', 8, 90),
      hit('kick', 10, 60),
      hit('hat', 2, 50, 42),
      hit('clave', 3, 90, 37),
    ];
    const drummer = [
      hit('kick', 0),
      hit('kick', 6),
      hit('kick', 12),
      hit('kick', 14),
      hit('fill', 15, 70, 38),
    ];
    const steps = (entry: (typeof ENTRIES)[number]) =>
      entered(entry, fragment, drummer).map((h) => `${h.role}${h.step}`);
    expect(steps('bar')).toEqual(['kick0', 'hat2', 'clave3', 'kick8', 'kick10']);
    expect(steps('roles')).toEqual(['kick0', 'clave3', 'kick8', 'kick10', 'fill15']);
    expect(steps('thinned')).toEqual(['kick0', 'clave3', 'kick8', 'kick10', 'fill15']);
    expect(steps('groove')).toEqual(['kick0', 'clave3', 'kick6', 'kick8', 'kick10', 'fill15']);
    expect(entered('thinned', fragment, drummer.slice(0, 2)).map((h) => h.step)).toEqual([0, 3, 8]);
  });
});

describe('a clave chosen with the drum bar, cells decision 046 (E36)', () => {
  it(`joins Funk’s and Bossa nova’s sections alone, within ${CO_SELECT}: the nearest fragment whose union renames nothing`, () => {
    expect(
      COMPARED.map((c) => [c.preset, c.withIt && { ...c.withIt, added: r2(c.withIt.added) }]),
    ).toEqual([
      ['Synth-pop', null],
      ['Techno', null],
      ['Deep house', null],
      ['Ambient', null],
      ['Lo-fi hip hop', null],
      ['Funk', { id: 'rumba clave 3-2', hits: 2.5, onDrums: 0, added: 2.5 }],
      ['Bossa nova', { id: 'bossa nova clave (one bar)', hits: 5, onDrums: 0, added: 5 }],
      ['Swing jazz', null],
    ]);
    expect(ASKED.filter((s) => s.withIt).length).toBe(80);
  });

  it('finds the nearest clave of every preset past the margin but those two, and tells a clave from a second drum bar by the union’s renames', () => {
    const repository = rhythmRepository();
    const bench = straightBench(120);
    expect(
      PRESETS.map((p) => {
        const found = coSelect(
          repository,
          stylePoint(p.style),
          bench,
          `${p.name} drums`,
          Infinity,
        )!;
        return [p.name, found.id, Math.round(found.distance * 1000) / 1000];
      }),
    ).toEqual([
      ['Synth-pop', 'son clave 3-2', 0.293],
      ['Techno', 'rumba clave 3-2', 0.468],
      ['Deep house', 'son clave 3-2', 0.266],
      ['Ambient', 'bossa nova clave', 0.522],
      ['Lo-fi hip hop', 'bossa nova clave (one bar)', 0.168],
      ['Funk', 'rumba clave 3-2', 0.069],
      ['Bossa nova', 'bossa nova clave (one bar)', 0.025],
      ['Swing jazz', 'bossa nova clave (one bar)', 0.26],
    ]);
    const withSynth = unionOf(drumFragmentOf('Synth-pop').text, bench).text;
    expect([...unionOf(drumFragmentOf('Deep house').text, withSynth).renamed.keys()]).toContain(
      '&kick',
    );
  });
});

describe('the point the rhythm is asked at (E36)', () => {
  it('takes another fragment in 57 of 320 sections at the section’s energy, 40 of them a clave alone, with no band role', () => {
    const moved = atSectionEnergy(ASKED);
    expect(moved).toHaveLength(57);
    expect(moved.filter((m) => m.noRole)).toHaveLength(40);
    expect([...new Set(moved.map((m) => `${m.preset} ${m.type} ${m.id}`))]).toEqual([
      'Synth-pop drop Deep house drums',
      'Deep house intro Synth-pop drums',
      'Deep house breakdown Synth-pop drums',
      'Lo-fi hip hop breakdown bossa nova clave',
      'Funk drop rumba clave 3-2',
      'Funk breakdown son clave 2-3',
      'Bossa nova intro bossa nova clave',
      'Bossa nova build bossa nova clave',
      'Bossa nova bridge bossa nova clave',
      'Bossa nova breakdown bossa nova clave',
    ]);
  });
});
