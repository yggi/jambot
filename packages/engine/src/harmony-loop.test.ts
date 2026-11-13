import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandCarried, type BandEnv, band, plannedAhead } from './band.ts';
import { BASS_REPOSITORY } from './bass-lines.ts';
import { SECTION_BARS } from './form.ts';
import { type HarmonySlot, barsOf } from './harmony-query.ts';
import type { KeyWish } from './key.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { LEAD_REPOSITORY } from './lead-lines.ts';
import { stylePoint } from './meter-query.ts';
import { presetMode } from './mode-repository.ts';
import type { HeardNote } from './muse.ts';
import { HARMONY_FRAGMENTS } from './library.ts';
import { HARMONY_TAG, sectionTheme } from './plan.ts';
import { HARMONY_REPOSITORY, harmonyRepository, progressionText } from './progressions.ts';
import { METER_REPOSITORY, presetSwing } from './repository.ts';
import { RHYTHM_REPOSITORY } from './rhythms.ts';
import { PRESETS, type Preset, type Style, holding, writtenStyle } from './style.ts';
import { holdingSwing } from './swing.ts';
import { buildTheme } from './themes.ts';
import {
  LOOKAHEAD,
  type TransportCarried,
  type TransportEnv,
  clockOfTransport,
  transport,
} from './transport.ts';

const range = (n: number) => [...Array(n).keys()];
const SYNTH_POP = PRESETS.find((p) => p.name === 'Synth-pop')!;

/** A preset held at entropy 0 for `bars` bars, seed `seed`: each bar's plan and the plans' state as of it. */
function planned(preset: Preset, seed: number, bars: number, extra: Partial<BandEnv> = {}) {
  const env = (bar: number): BandEnv => ({
    seed,
    bar,
    style: { ...preset.style, entropy: 0 },
    swing: presetSwing(preset)!,
    wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
    offer: null,
    repository: METER_REPOSITORY,
    rhythms: RHYTHM_REPOSITORY,
    bassLines: BASS_REPOSITORY,
    leads: LEAD_REPOSITORY,
    layer: EMPTY_LAYER,
    ...extra,
  });
  return plannedAhead(band.initial, env, bars);
}

describe('the harmony in the loop, held at entropy 0 (#425)', () => {
  const runs = PRESETS.flatMap((preset) =>
    [0, 1].map((seed) => ({
      preset,
      seed,
      main: planned(preset, seed, 64),
      loop: planned(preset, seed, 64, { harmonies: HARMONY_REPOSITORY }),
    })),
  );

  /**
   * What each preset takes where cells placed a harmony at its point (yggi/cells#409, #547, #572, #675, #679, and #540 at
   * v0.25.0, whose harmonies of 4 bars and of two chords to the bar are read again to a section's 8): every section's
   * A, over both seeds. Blues shuffle, with three equally near, draws a different one at each seed.
   */
  const PLACED: Readonly<Record<string, readonly string[]>> = {
    'Synth-pop': ['axis_progression'],
    'Deep house': ['ninth_vamp'],
    'Lo-fi hip hop': ['ninth_loop'],
    'Bossa nova': ['ii_v_i'],
    'Swing jazz': ['turnaround'],
    'Electro swing': ['minor_swing'],
    Spooky: ['dark_cadence'],
    Kinderlied: ['vamp_to_the_fifth'],
    Acid: ['tonic_vamp'],
    'Happy hardcore': ['axis_progression'],
    Elektro: ['axis_progression'],
    'Dark ambient': ['tonic_vamp'],
    Baroque: ['fifths_sequence'],
    'Blues shuffle': ['minor_swing', 'ninth_vamp'],
    'Sea shanty': ['vamp_to_the_seventh'],
    Chiptune: ['korobeiniki_changes'],
    Salsa: ['montuno'],
    Waltz: ['ninth_vamp'],
    March: ['vamp_to_the_fifth'],
    'Trip-hop': ['vamp_to_the_sixth'],
  };

  it("plays main's themes, degree for degree in every slot, over the presets × 2 seeds × 64 bars, where cells placed no harmony; elsewhere the one it placed, Spooky the dark cadence", () => {
    // (Spooky's dark cadence, i VI iv V, read twice: its haunted progression, nearer before v0.25.0 read the cadence's
    // four bars, lies past it)
    for (const r of runs.filter((r) => r.preset.name === 'Spooky'))
      for (const { bar } of r.loop.filter(({ bar }) => bar.plan.theme.kind === 'A'))
        expect(
          bar.plan.theme.bars.map((b) => b.map((slot) => ('degree' in slot ? slot.degree : -1))),
        ).toEqual([0, 5, 3, 4, 0, 5, 3, 4].map((d) => [d]));
    for (const r of runs.filter((r) => r.preset.name in PLACED)) {
      const taken = new Set(r.loop.map(({ plans }) => plans.themeFragments.A));
      expect(taken.size, `${r.preset.name}, seed ${r.seed}`).toBe(1);
      expect(PLACED[r.preset.name], `${r.preset.name}, seed ${r.seed}`).toContain([...taken][0]);
    }
    expect(PRESETS.filter((p) => !(p.name in PLACED)).map((p) => p.name)).toEqual([
      'Techno',
      'Ambient',
      'Funk',
    ]);
    for (const { main, loop } of runs.filter((r) => !(r.preset.name in PLACED)))
      for (let bar = 0; bar < 64; bar++) {
        const m = main[bar]!.bar;
        const l = loop[bar]!.bar;
        expect(l.plan.theme.bars).toEqual(m.plan.theme.bars);
        expect(l.chords).toEqual(m.chords);
      }
  });

  it('plays a seed vamp where main plays a vamp, a placed harmony where cells placed one, and the tables where it walks them', () => {
    const fromSeed = (name: string) =>
      runs
        .filter((r) => r.preset.name === name)
        .every((r) =>
          r.loop.every(({ plans, bar }) => {
            const kind = bar.plan.theme.kind;
            return kind === 'build' || plans.themeFragments[kind] !== null;
          }),
        );
    // (A and B both from the seeds: the three that vamp, and Blues shuffle, whose B draws another of its three equals)
    expect(PRESETS.filter((p) => fromSeed(p.name)).map((p) => p.name)).toEqual([
      'Techno',
      'Ambient',
      'Funk',
      'Blues shuffle',
    ]);
    // (above the vamps, A is what cells placed and B the tables', for contrast, where nothing else is equally near)
    for (const r of runs.filter(
      (r) => r.preset.style.harm >= 0.33 && r.preset.name !== 'Blues shuffle',
    ))
      for (const { plans } of r.loop) {
        expect(PLACED[r.preset.name], r.preset.name).toContain(plans.themeFragments.A);
        expect(plans.themeFragments.B, r.preset.name).toBeNull();
      }
  });
});

/** A minor, held: Ada's chords are read in it. */
const A_MINOR: KeyWish = { tonic: 9, mode: 'aeolian', melodic: null };

/**
 * Ada's progression in A minor, a chord a bar, twice: Am F G Em (i VI VII v), no seed's (since cells v0.25.0 the axis
 * progression, i VI III VII, is read twice to a section, and the Muse knows it played as the seed, `seedTextOf`).
 */
const ADA_DEGREES = [0, 5, 6, 4, 0, 5, 6, 4];
const ADA_VOICINGS: Record<number, readonly number[]> = {
  0: [57, 60, 64],
  5: [53, 57, 60],
  6: [55, 59, 62],
  4: [52, 55, 59],
};

/**
 * Cells' harmonies but the axis progression, which cells v0.25.0 places at Synth-pop's point (yggi/cells#540), where
 * it is nearer than a progression filed while the style walked near it: so what is filed here is the nearest, as it
 * is wherever no seed lies at the point (the filing and its coming back, not the seeds, are what these tests hold).
 */
const AWAY = harmonyRepository(HARMONY_FRAGMENTS.filter((f) => f.id !== 'axis_progression'));
const ADA: HarmonySlot[] = ADA_DEGREES.map((degree, b) => ({ step: b * 16, degree }));

/** A player's block chords over `sections` sections from section 1, each bar's struck on its beats one and three, `shift` semitones moved. */
function chordsPlayed(source: string, sections: number, shift = 0): HeardNote[] {
  return range(sections * SECTION_BARS).flatMap((k) => {
    const bar = SECTION_BARS + k;
    return [0, 8].flatMap((step) =>
      ADA_VOICINGS[ADA_DEGREES[k % SECTION_BARS]!]!.map((note) => ({
        note: note + shift,
        velocity: 90,
        source,
        position: bar * 16 + step,
        end: bar * 16 + step + 8,
      })),
    );
  });
}

/**
 * The layer after a song at Synth-pop at entropy 0.3 in A minor, a player playing `played` and the band going on 2
 * sections past them: heard as notes (`heard`), or played on the pad or the stab (`chords`, #570).
 */
function song(
  played: readonly HeardNote[],
  seed = 3,
  via: 'heard' | 'chords' = 'heard',
): LearnedLayer {
  const env: TransportEnv = {
    seed,
    start: 1,
    track: holding({ ...SYNTH_POP.style, entropy: 0.3 }),
    swing: holdingSwing(presetSwing(SYNTH_POP)!),
    wish: A_MINOR,
    repository: METER_REPOSITORY,
    rhythms: RHYTHM_REPOSITORY,
    harmonies: AWAY,
    layer: EMPTY_LAYER,
  };
  let carried: TransportCarried | null = transport.initial;
  let waiting = [...played];
  for (let now = env.start - 0.1; ; now += 0.1) {
    const head = carried?.head.step ?? 0;
    const heard = waiting.filter((n) => n.position < head);
    waiting = waiting.filter((n) => n.position >= head);
    carried = transport.advance(env, carried, {
      now,
      until: now + LOOKAHEAD,
      [via]: heard,
    }).carried!;
    if (carried.head.step > clockOfTransport(carried).barStart(4 * SECTION_BARS + 1))
      return carried.source.plans.layer!;
  }
}

/** A layer's progressions. */
const progressions = (layer: LearnedLayer) =>
  layer.filed.filter((f) => f.fragment.association.some((p) => p.facet === 'harmony'));

/** The band over `bars` bars at one style, in a key wished for: each bar and the carried state after it. */
function play(bars: number, style: Style, extra: Partial<BandEnv> = {}, seed = 1) {
  let carried: BandCarried = band.initial;
  return range(bars).map((bar) => {
    const next = band.advance(
      {
        seed,
        bar,
        style,
        swing: presetSwing(SYNTH_POP)!,
        wish: A_MINOR,
        offer: null,
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        harmonies: AWAY,
        layer: EMPTY_LAYER,
        ...extra,
      },
      carried,
      null,
    );
    carried = next.carried;
    return { bar: next.output, carried };
  });
}

describe('the Muse files a player’s progression, and it comes back in a later song (#425)', () => {
  const layer = song(chordsPlayed('Ada', 2));
  const ada = progressions(layer).find((f) => f.meta.source === 'Ada')!;

  it('files the eight bars a player played over a section under the player’s name, as degrees of the key, a section after it ends', () => {
    expect(progressions(layer).map((f) => f.fragment.id)).toEqual(['Ada song 3, bar 8']);
    expect(ada.meta).toEqual({ source: 'Ada', created: 'song 3, bar 8', tags: [HARMONY_TAG] });
    expect(ada.fragment.text).toBe(progressionText(ADA));
    // (a template, as a seed progression is: its signature, the key its main parameter, #562)
    expect(ada.fragment.text).toBe(
      '&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4] [5,7,9] [6,8,10] [4,6,8] [0,2,4] [5,7,9] [6,8,10] [4,6,8]',
    );
    expect(ada.fragment.association[0]).toEqual({
      point: stylePoint(writtenStyle({ ...SYNTH_POP.style, entropy: 0.3 })),
      weight: expect.any(Number),
      facet: 'harmony',
    });
  });

  it('plays it in a later song, from the stored layer after a reload, at a style point near it: its degrees, in another key too', () => {
    const reloaded = JSON.parse(JSON.stringify(layer)) as LearnedLayer;
    const near: Style = { ...SYNTH_POP.style, sync: SYNTH_POP.style.sync + 0.02, entropy: 0.3 };
    for (const wish of [A_MINOR, { ...A_MINOR, tonic: 2 }])
      for (const seed of [5, 6, 7]) {
        const run = play(4 * SECTION_BARS, near, { layer: reloaded, wish }, seed);
        const first = run[0]!;
        expect(first.carried.plans.themeFragments.A, `seed ${seed}`).toBe(ada.fragment.id);
        expect(first.bar.plan.theme.bars).toEqual(barsOf(ADA, SECTION_BARS));
        // (each bar's chord stands on Ada's degree of the key playing)
        expect(first.bar.plan.key.tonic).toBe(wish.tonic);
      }
  });

  it('files the chords a player plays on the pad or the stab (#570) as she files those heard, and no lead line of them', () => {
    const padded = song(chordsPlayed('Ada', 2), 3, 'chords');
    expect(progressions(padded).map((f) => [f.fragment.id, f.fragment.text])).toEqual([
      [ada.fragment.id, ada.fragment.text],
    ]);
    const leads = (l: LearnedLayer) =>
      l.filed.filter(
        (f) => f.fragment.association.some((p) => p.facet === 'lead') && f.meta.source === 'Ada',
      );
    expect(leads(padded)).toEqual([]);
  });

  it('files nothing where nobody played, or a player played the chords’ roots alone, or in the bass’s register', () => {
    expect(progressions(song([]))).toEqual([]);
    const roots = chordsPlayed('Bo', 2).filter((n, i) => i % 3 === 0);
    expect(progressions(song(roots))).toEqual([]);
    expect(progressions(song(chordsPlayed('Cy', 2, -24)))).toEqual([]);
  });
});

describe('the composer plays a progression filed, never varied, and leaves out one it rejects (#425)', () => {
  const point = stylePoint(writtenStyle({ ...SYNTH_POP.style, entropy: 1 }));
  const seeded = AWAY.file!(EMPTY_LAYER, {
    notes: ADA,
    bench: { meter: METERS['4/4'], meterFragment: 'meter' },
    point,
    source: 'Ada',
    created: 'song 0, bar 0',
    tags: [HARMONY_TAG],
  });

  it('plays it as A over 16 sections at entropy 1, B and the builds from the tables, and files no variation of it', () => {
    const run = play(
      16 * SECTION_BARS,
      { ...SYNTH_POP.style, entropy: 1 },
      { layer: seeded.layer },
    );
    const sections = range(16).map((s) => run[s * SECTION_BARS]!);
    for (const { carried, bar } of sections) {
      const { kind } = bar.plan.theme;
      if (kind === 'A') expect(carried.plans.themeFragments.A).toBe(seeded.id);
      // (B, with nothing on offer but A's, is the tables', for contrast)
      if (kind === 'B') expect(carried.plans.themeFragments.B).toBeNull();
    }
    expect(sections.some((s) => s.bar.plan.theme.kind === 'B')).toBe(true);
    expect(progressions(run.at(-1)!.carried.plans.layer!).map((f) => f.fragment.id)).toEqual([
      seeded.id,
    ]);
  });

  it('builds the theme from the tables where it rejects the progression', () => {
    const env = {
      harmonies: AWAY,
      style: writtenStyle({ ...SYNTH_POP.style, entropy: 1 }),
      layer: seeded.layer,
      seed: 1,
      index: 0,
    };
    const key = { tonic: 9, mode: 'aeolian' } as const;
    const bench = { meter: METERS['4/4'], meterFragment: 'meter' };
    const none = { A: null, B: null };
    expect(sectionTheme(env, 'A', key, bench, none, none).fragment).toBe(seeded.id);
    // (and each of cells' harmonies, since cells v0.25.0 places some within reach of Synth-pop at entropy 1)
    const rejected = sectionTheme(env, 'A', key, bench, none, none, [
      seeded.id,
      ...HARMONY_FRAGMENTS.map((f) => f.id),
    ]);
    expect(rejected.fragment).toBeNull();
    expect(rejected.theme).toEqual(
      buildTheme({ seed: 1, index: 0, kind: 'A', key, harm: env.style.harm, entropy: 1, a: null }),
    );
  });
});

describe('the band with harmonies carries what JSON keeps (#425)', () => {
  it('over a tour of the presets with entropy rising, learning, a player playing chords: the carried state survives JSON, and plays the same from it', () => {
    for (const seed of [1, 2]) {
      let carried: BandCarried = band.initial;
      for (let bar = 0; bar < 48; bar++) {
        const preset = PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
        const env: BandEnv = {
          seed,
          bar,
          style: { ...preset.style, entropy: (bar % 32) / 32 },
          wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
          offer: null,
          repository: METER_REPOSITORY,
          rhythms: RHYTHM_REPOSITORY,
          harmonies: HARMONY_REPOSITORY,
          layer: EMPTY_LAYER,
          harmonyHeard: [
            { source: 'Ada', bar: Math.max(0, bar - 2), slots: [{ step: 0, degree: bar % 7 }] },
          ],
        };
        const copy = JSON.parse(JSON.stringify(carried)) as BandCarried;
        expect(copy, `seed ${seed}, bar ${bar}`).toEqual(carried);
        const next = band.advance(env, carried, null);
        expect(band.advance(env, copy, null)).toEqual(next);
        carried = next.carried;
      }
      // (the player's chords were filed)
      expect(progressions(carried.plans.layer!).length).toBeGreaterThan(0);
    }
  });
});
