import { type MeterSwing, PROTOTYPE_PRESETS, stylePoint } from '@jambot/engine';
import { METERS, type Meter } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type Hit, hitsOf, presetBars, witnesses } from './drums-in-cells.ts';
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
  entered,
  gridAnswers,
  meterSweep,
  onBench,
  queryCost,
  readFragment,
  report,
  rhythmRepository,
  straightBench,
  workbenchOf,
} from './rhythm-query.ts';
import { wordOf } from '@yggi/cells/repository';

const SECTIONS = corpus();
const ASKED = askCorpus(SECTIONS);
const COMPARED = compare(ASKED);
if (process.env.E36_REPORT) console.log(report(COMPARED));

const of = (preset: string) => COMPARED.find((c) => c.preset === preset)!;
const r2 = (x: number) => Math.round(x * 100) / 100;
const STRAIGHT = { level: '16n', share: 0.5 } as const;

/**
 * E31's reverse, read against the bar each preset's drum fragment was taken from: its bar 23 at seed 0, the last of its
 * third section (`e31Readback` reads E31's witness, the first bar with the most roles, which was that bar before #655's
 * song forms and is since Ambient's bar 9 and Bossa nova's bar 31). Per preset, the hits, how many match (note, step,
 * length, velocity and role), how many match but for a euclid's velocity (`accented`: since cells v0.29.0 three seeds
 * take their euclid's levels from `metric_accent`, yggi/cells#890), and the mismatches.
 */
function seedReadback(
  bench: (preset: string, bpm: number) => { text: string; meter: Meter; swing: MeterSwing } = (
    _,
    bpm,
  ) => ({ text: straightBench(bpm), meter: METERS['4/4'], swing: STRAIGHT }),
) {
  return PROTOTYPE_PRESETS.map((preset) => {
    const bar = presetBars(preset)[23]!;
    const { bpm } = bar.style;
    const b = bench(preset.name, bpm);
    const read = readFragment(drumFragmentOf(preset.name).text, b.text, bpm, b.meter, b.swing);
    const roleOf = (h: Hit) =>
      bar.dough.find((n) => n.part === 'drums' && n.step === h.step && n.note === h.note)!.role;
    const key = (h: { note: number; step: number }) => `${h.step}:${h.note}`;
    const byKey = new Map(read.map((h) => [key(h), h]));
    const band = hitsOf(bar);
    const matches = (h: Hit, accent: boolean) => {
      const r = byKey.get(key(h));
      return (
        !!r &&
        r.length === h.length &&
        (r.velocity === h.velocity || (accent && roleOf(h) === 'euclid')) &&
        r.role === roleOf(h)
      );
    };
    const matched = band.filter((h) => matches(h, false)).length;
    const accented = band.filter((h) => matches(h, true)).length;
    const extra = read.filter((r) => !band.some((h) => key(h) === key(r))).length;
    return {
      preset: preset.name,
      hits: band.length,
      matched,
      accented,
      exact: matched === band.length && !extra,
      exactButAccent: accented === band.length && !extra,
    };
  });
}

/**
 * The presets whose bar 23 is still their drum fragment: each ends a groove at its preset's energy. Since #655's song
 * forms Synth-pop's bar 23 ends a chorus and Techno's a build, and Ambient's groove plays two roles where its fragment
 * plays four (`drums-in-cells.test.ts`); all 8 before.
 */
const SEED_HELD = ['Deep house', 'Lo-fi hip hop', 'Funk', 'Bossa nova', 'Swing jazz'];

/** The presets whose seed drums take their euclid's levels from `metric_accent` since cells v0.29.0 (yggi/cells#890). */
const ACCENTED = ['Lo-fi hip hop', 'Funk', 'Bossa nova'];

describe('a fragment read back into the band’s drums, E31’s reverse (E36)', () => {
  it('reads every drum bar as the band’s bar it was taken from under a straight 4/4 at its bpm, where the band still plays it: note, step, length, velocity and role, 5 presets of 8, 86 of 86, but the euclid’s velocities of the 3 whose seed is accented', () => {
    const read = seedReadback();
    // (all 8 presets, 144 of 144, before #655's song forms; since cells v0.29.0 the three accented ones but their euclid's
    // velocities, 70 of 86 exactly)
    expect(read.filter((r) => r.exactButAccent).map((r) => r.preset)).toEqual(SEED_HELD);
    expect(read.filter((r) => r.exact).map((r) => r.preset)).toEqual(
      SEED_HELD.filter((p) => !ACCENTED.includes(p)),
    );
    const held = read.filter((r) => SEED_HELD.includes(r.preset));
    expect(held.reduce((n, r) => n + r.accented, 0)).toBe(86);
    expect(held.reduce((n, r) => n + r.matched, 0)).toBe(70);
    expect(held.reduce((n, r) => n + r.hits, 0)).toBe(86);
  });

  it('reads all 86 under the meter each preset’s sections choose: the rim’s Euclid on `1m` swings under a 16n lean as the band swings it, the parts of a step swung (cells#306)', () => {
    const first = new Map(
      PROTOTYPE_PRESETS.map((p) => [p.name, ASKED.find((s) => s.preset === p.name)!]),
    );
    const read = seedReadback((preset) => {
      const bar = first.get(preset)!.bars[0]!;
      return { text: workbenchOf(bar), meter: bar.meter, swing: bar.swing };
    }).filter((r) => SEED_HELD.includes(r.preset));
    expect(read.reduce((n, r) => n + r.accented, 0)).toBe(86); // (144 of 144 before #655's song forms)
    expect(read.filter((r) => !r.exactButAccent)).toEqual([]);
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
        id: wordOf(`${s.preset} drums`),
        distance: 0,
      });
    }
    expect(
      Object.fromEntries(
        PROTOTYPE_PRESETS.map((p) => [
          p.name,
          ASKED.find((s) => s.preset === p.name)!.bars[0]!.plan.meterFragment,
        ]),
      ),
    ).toEqual({
      'Synth-pop': 'meter',
      Techno: 'meter',
      'Deep house': 'meter(swing=16n:.6)',
      Ambient: 'meter(swing=16n:31/60)',
      'Lo-fi hip hop': 'meter(swing=16n:.65)',
      Funk: 'meter(swing=16n:.6)',
      'Bossa nova': 'meter',
      'Swing jazz': 'meter(swing=8n:2/3)',
    });
  });

  // (2/2 and 2/4 among the band's meters since #652: 2/2's bar is a 4/4's, so every preset's drum bar fits it, and 2/4
  // finds Spooky, March or Happy hardcore drums at five presets' points and misses by the distance at Ambient's, Funk's
  // and Bossa nova's)
  it('misses past the distance only: the 4/4s and 2/2 find each preset’s drum bar, the five other meters Spooky drums where it is within reach, 2/4 the drum bars of two beats, and 7/8 Ghost drums (cells v0.15.0), past them a miss by the distance', () => {
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
      meter: ['found'],
      'meter(swing=8n:2/3)': ['found'],
      'meter(swing=16n:.65)': ['found'],
      'meter(swing=16n:.6)': ['found'],
      'meter(swing=16n:31/60)': ['found'],
      'meter(grouping=meter("3/4"))': ['found', 'distance'],
      'meter(grouping=meter("6/8"))': ['found', 'distance'],
      'meter(grouping=meter("12/8"))': ['found', 'distance'],
      'meter(grouping=meter("2/2", 2))': ['found'],
      'meter(grouping=meter("2/4"))': ['found', 'distance'],
      'meter(grouping=meter("5/4"))': ['found', 'distance'],
      'meter(grouping=meter("7/8"))': ['found', 'distance'],
      'meter(grouping=meter("10/8"))': ['found', 'distance'],
    });
  });

  // (none refused by the fit since cells v0.15.0: Ghost drums fits 7/8, the one meter no seed rhythm fitted)
  // (90 % found since cells v0.23.0, its four new drum bars, three of which fit every meter, and a rhythm's point on
  // sync, harm and bite, which the grid's mood moves nowhere: 69 % before)
  // (93 % since cells v0.24.0's seven drum bars the drummer holds, yggi/cells#675 and #679: 90 % before)
  // (96 % since cells v0.25.0's aksak and twelve-eight drums, yggi/cells#707: 13,673 and 968 before; and as many with 2/4
  // and 2/2 among the band's meters on top of it, #652, the 132 points that now choose 2/4 finding March or Kinderlied
  // drums and the 66 that choose 2/2 Chip, Elektro or Deep house drums or the quiet pulse)
  // (98 % since cells v0.26.0, whose twelve-eight drums weigh 1, not 0.25, yggi/cells#706: 14,102 and 539 before)
  it(`misses over a grid of the four axes, the meter found first: 98 % found, none refused by the fit, 2 % past ${RHYTHM_MISS}`, () => {
    expect(gridAnswers(11)).toEqual({ found: 14399, fit: 0, distance: 242 });
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
  it('measures each preset’s drummer against its fragment, and against itself at another seed; the drummer fills 14 to 26 of its 40 sections', () => {
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
        drummer: 13.4,
        overlap: 0.34,
        self: 0.41,
        filled: 14,
        equal: 0,
        // (13.7, 0.3, 0.46, 22 before #655's song forms)
      },
      {
        preset: 'Techno',
        fragment: 28,
        drummer: 17.78,
        overlap: 0.49,
        self: 0.74,
        filled: 26,
        equal: 0,
        // (17.63, 0.5, 0.64, 22 before #655's song forms)
      },
      {
        preset: 'Deep house',
        fragment: 15,
        drummer: 12.28,
        overlap: 0.34,
        self: 0.46,
        filled: 18,
        equal: 0,
        // (16.32, 0.36, 0.41, 23 before #655's song forms)
      },
      {
        preset: 'Ambient',
        fragment: 18,
        drummer: 1.82,
        overlap: 0.08,
        self: 0.67,
        filled: 15,
        equal: 0,
        // (3.62, 0.17, 0.66, 21 before #655's song forms)
      },
      // (Lo-fi hip hop's and Funk's rims swing as the drummer's since the parts of a step swing, cells#306)
      {
        preset: 'Lo-fi hip hop',
        fragment: 17,
        drummer: 9.55,
        overlap: 0.24,
        self: 0.45,
        filled: 18,
        equal: 0,
        // (13.78, 0.27, 0.34, 23 before #655's song forms)
      },
      {
        preset: 'Funk',
        fragment: 24,
        drummer: 21.91,
        overlap: 0.34,
        self: 0.49,
        filled: 26,
        equal: 0,
        // (23.75, 0.35, 0.41, 28 before #655's song forms)
      },
      {
        preset: 'Bossa nova',
        fragment: 16,
        drummer: 12.81,
        overlap: 0.23,
        self: 0.41,
        filled: 20,
        equal: 0,
        // (14.26, 0.22, 0.41, 26 before #655's song forms)
      },
      {
        preset: 'Swing jazz',
        fragment: 14,
        drummer: 13.03,
        overlap: 0.45,
        self: 0.5,
        filled: 15,
        equal: 0,
        // (11.98, 0.41, 0.47, 23 before #655's song forms)
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

  // (the witness a drop of Synth-pop before #655's song forms, 8.9 hits a bar against 23.7: Synth-pop's songs since are
  // verses and choruses, which play no drop, so the witness is its chorus, the loudest kind it plays)
  it('keeps the drummer’s density by section type only as `groove`: `roles` and `thinned` stay under the fragment, a chorus of Synth-pop 8.5 hits a bar against 18.6', () => {
    const synth = of('Synth-pop');
    expect(r2(synth.byType.chorus!)).toBe(18.59);
    expect(r2(synth.entries.thinned.byType.chorus!)).toBe(8.52);
    expect(r2(synth.entries.bar.byType.intro!)).toBe(12);
    for (const c of COMPARED)
      for (const [type, hits] of Object.entries(c.byType))
        expect(Math.abs(c.entries.groove.byType[type]! - hits), `${c.preset} ${type}`).toBeLessThan(
          0.2,
        );
  });

  // (at every preset before #655's song forms; since, Techno's and Funk's `groove` keeps 0.740 and 0.491 of the drummer's
  // hits where another seed keeps 0.742 and 0.491, a tie within 0.002 the seed wins: the drummer at another seed agrees
  // with itself more than before, 0.74 and 0.49 where it was 0.64 and 0.41)
  it('as `groove`, moves fewer of the drummer’s hits than a seed does at 7 presets of 8, ties within 0.002 at Techno, and makes its seeds agree more at every preset', () => {
    expect(
      COMPARED.map((c) => [
        c.preset,
        r2(c.entries.groove.overlap),
        r2(c.entries.groove.moved),
        r2(c.entries.groove.self),
      ]),
    ).toEqual([
      ['Synth-pop', 0.75, 1.66, 0.51], // (0.82, 1.26, 0.52 before #655's song forms)
      ['Techno', 0.74, 1.71, 0.82], // (0.73, 1.95, 0.77)
      ['Deep house', 0.73, 2.02, 0.59], // (0.81, 1.61, 0.52)
      ['Ambient', 0.83, 0.38, 0.72], // (0.82, 0.68, 0.72)
      // (Lo-fi hip hop's and Funk's rims swing as the drummer's do since the parts of a step swing, cells#306)
      ['Lo-fi hip hop', 0.62, 2.32, 0.59], // (0.68, 2.63, 0.5)
      ['Funk', 0.49, 6.53, 0.77], // (0.53, 6.09, 0.75; 6.57 before cells v0.29.0's accent, yggi/cells#890)
      ['Bossa nova', 0.57, 3.92, 0.6], // (0.6, 4.05, 0.54)
      ['Swing jazz', 0.72, 2.07, 0.65], // (0.77, 1.78, 0.6)
    ]);
    expect(
      COMPARED.filter((c) => c.entries.groove.overlap <= c.selfOverlap).map((c) => c.preset),
      // (and Funk before cells v0.29.0's accent, yggi/cells#890)
    ).toEqual(['Techno']);
    for (const c of COMPARED) {
      expect(c.selfOverlap - c.entries.groove.overlap, c.preset).toBeLessThan(0.002);
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
      ['Funk', { id: 'rumba_clave_3_2', hits: 2.5, onDrums: 0, added: 2.5 }],
      ['Bossa nova', { id: 'bossa_nova_clave_one_bar', hits: 5, onDrums: 0, added: 5 }],
      ['Swing jazz', null],
    ]);
    expect(ASKED.filter((s) => s.withIt).length).toBe(80);
  });

  it('finds the nearest clave of every preset past the margin but those two, and tells a clave from a second drum bar by the union’s renames', () => {
    const repository = rhythmRepository();
    const bench = straightBench(120);
    expect(
      PROTOTYPE_PRESETS.map((p) => {
        const found = coSelect(
          repository,
          stylePoint(p.style),
          bench,
          wordOf(`${p.name} drums`),
          Infinity,
        )!;
        return [p.name, found.id, Math.round(found.distance * 1000) / 1000];
      }),
      // (since cells v0.23.0 a clave's point is on sync, harm and bite, so each lies a little farther from a preset's;
      // Techno's nearest is the son clave 2-3, Lo-fi hip hop's and Swing jazz's the two-bar bossa nova clave)
    ).toEqual([
      ['Synth-pop', 'cinquillo', 0.33],
      ['Techno', 'son_clave_2_3', 0.54],
      ['Deep house', 'cinquillo', 0.292],
      ['Ambient', 'bossa_nova_clave', 0.574],
      ['Lo-fi hip hop', 'bossa_nova_clave', 0.183],
      ['Funk', 'rumba_clave_3_2', 0.074],
      ['Bossa nova', 'bossa_nova_clave_one_bar', 0.029],
      ['Swing jazz', 'bossa_nova_clave', 0.275],
    ]);
    const withSynth = onBench(drumFragmentOf('Synth-pop').text, bench).text;
    expect([
      ...onBench(drumFragmentOf('Deep house').text, withSynth).union!.renamed.keys(),
    ]).toContain('&kick');
  });
});

describe('the point the rhythm is asked at (E36)', () => {
  // (81 of 320 sections, 40 of them a clave alone, took another fragment at the section's energy before cells v0.23.0,
  // which is why the composer asks at the style's point; since then energy is on no point, decision 076)
  it('takes no other fragment at the section’s energy: energy is on no point since cells v0.23.0', () => {
    expect(atSectionEnergy(ASKED)).toEqual([]);
  });
});
