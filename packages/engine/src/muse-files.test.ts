import { METERS, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandBar, type BandCarried, type BandEnv, DRUMMER, band, lookAhead } from './band.ts';
import { DRUM_NOTES } from './drums.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { stylePoint } from './meter-query.ts';
import type { HeardNote } from './muse.ts';
import { distilledGroove } from './muse-groove.ts';
import { SECTION_BARS } from './form.ts';
import { GROOVE_ANCHORS, variations } from './novelty.ts';
import { COMPOSER, GROOVE_TAG } from './plan.ts';
import { METER_REPOSITORY } from './repository.ts';
import type { FragmentHit } from './rhythm-query.ts';
import { RHYTHM_REPOSITORY, readRhythm } from './rhythms.ts';
import { SHORT_TERM_FLOOR } from './short-term.ts';
import { PRESETS, type Style, holding, writtenStyle } from './style.ts';
import { holdingSwing } from './swing.ts';
import {
  LOOKAHEAD,
  type TransportCarried,
  type TransportEnv,
  clockOfTransport,
  transport,
} from './transport.ts';

const FUNK = PRESETS.find((p) => p.name === 'Funk')!;
const STYLE: Style = { ...FUNK.style, entropy: 0.3 };
/** The point of the 5/4 meter fragment, where the repository's meter is 5/4 and no rhythm fits it. */
const COOL: Style = { ...STYLE, sync: 0.4, harm: 0.9, artic: 0.5, energy: 0.3 };
const range = (n: number) => [...Array(n).keys()];

/** The band over `bars` bars at one style, every bar and the carried state after each. */
function play(bars: number, extra: Partial<BandEnv>, style: Style = STYLE) {
  let carried: BandCarried = band.initial;
  const out: { bar: BandBar; carried: BandCarried }[] = [];
  for (const bar of range(bars)) {
    const next = band.advance(
      {
        seed: 1,
        bar,
        style,
        swing: FUNK.swing,
        wish: { tonic: null, mode: FUNK.mode, melodic: null },
        offer: null,
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        ...extra,
      },
      carried,
      null,
    );
    carried = next.carried;
    out.push({ bar: next.output, carried });
  }
  return out;
}

/** A bar's drums as the Muse hears the drummer: each hit's role, note, step and the velocity it played at. */
const drumsOf = (bar: BandBar): FragmentHit[] =>
  bar.dough
    .filter((n) => n.part === 'drums')
    .map((n) => ({ role: n.role!, note: n.note, step: n.step, velocity: n.velocity }));

const FIVE = METERS['5/4'];

describe('the Muse files the groove the drummer invents on a miss (#401)', () => {
  // 5/4 asked for: no rhythm of cells' fits it, so every section misses until a groove is filed.
  const run = play(24, { meter: FIVE, layer: EMPTY_LAYER });
  const filedAfter = (bar: number) => run[bar]!.carried.plans.layer!.filed;

  it('files nothing while the section plays, and the drummer’s groove where the next is planned', () => {
    expect(run[0]!.bar.plan.rhythmFragment).toBeUndefined();
    for (const bar of range(7)) expect(filedAfter(bar)).toEqual([]);
    expect(filedAfter(7).map((f) => f.fragment.id)).toEqual(['drummer song 1, bar 0']);
    const [file] = filedAfter(7);
    expect(file!.meta).toEqual({ source: DRUMMER, created: 'song 1, bar 0', tags: [GROOVE_TAG] });
    // filed at cells' filing weight, 0.1, and kept at once by the section planned there: a use, 0.1 more
    expect(file!.fragment.association).toEqual([
      { point: stylePoint(writtenStyle(STYLE)), weight: 0.2, facet: 'rhythm' },
    ]);
  });

  it('files the section’s recurring bar, which cells reads back hit for hit as the drummer played it', () => {
    const played = range(8).map((bar) => drumsOf(run[bar]!.bar));
    const groove = distilledGroove(played)!;
    const pattern = (bar: readonly FragmentHit[]) => bar.map((h) => [h.role, h.note, h.step]);
    expect(
      played.map((bar) => JSON.stringify(pattern(bar)) === JSON.stringify(pattern(groove))),
      // in 5/4 the drummer reads its 4/4 tables by the cycle, four bars round (`regroup.ts`): bars 0 and 4 alike, and 2 and 6, the earliest first
    ).toEqual([true, false, false, false, true, false, false, false]);
    expect(groove).toEqual(played[0]);
    const { text } = filedAfter(7)[0]!.fragment;
    expect(text).not.toMatch(/&bar/);
    expect(readRhythm(text, FIVE)).toEqual({ bars: 1, hits: groove });
  });

  it('is found by the next query at the point it was filed at, at distance 0, and the next section plays from it', () => {
    const layer = filedAfter(7) && run[7]!.carried.plans.layer!;
    const found = RHYTHM_REPOSITORY.query(stylePoint(writtenStyle(STYLE)), { meter: FIVE }, layer);
    expect(found[0]).toEqual({ id: 'drummer song 1, bar 0', distance: 0 });
    for (const bar of [8, 16])
      expect(run[bar]!.bar.plan.rhythmFragment).toBe('drummer song 1, bar 0');
    // and no section after misses, so nothing else is filed
    expect(filedAfter(23)).toHaveLength(1);
  });

  it('puts it on the composer’s short-term memory, in mind for the sections after', () => {
    const memory = run[7]!.carried.plans.shortTerm;
    expect(memory.map((m) => m.id)).toContain('drummer song 1, bar 0');
    expect(memory.every((m) => m.weight >= SHORT_TERM_FLOOR)).toBe(true);
  });

  it('adds the same groove filed twice to one fragment: a use where it was filed (cells decision 048’s identity)', () => {
    const layer = run[7]!.carried.plans.layer!;
    const { hits } = readRhythm(layer.filed[0]!.fragment.text, FIVE)!;
    const again = RHYTHM_REPOSITORY.file!(layer, {
      hits,
      bench: { meter: FIVE },
      point: stylePoint(writtenStyle(STYLE)),
      source: DRUMMER,
      created: 'song 1, bar 64',
      tags: [GROOVE_TAG],
    });
    expect(again.held).toBe(true);
    expect(again.id).toBe('drummer song 1, bar 0');
    expect(again.layer.filed).toHaveLength(1);
    expect(again.layer.filed[0]!.fragment.association[0]!.weight).toBe(0.3);
  });

  it('counts the groove as used together with the meter fragment it was played in, so the two pull each other', () => {
    const cool = play(16, { layer: EMPTY_LAYER }, COOL);
    expect(cool[0]!.bar.plan.meterFragment).toBe('5/4');
    const layer = cool[7]!.carried.plans.layer!;
    expect(layer.filed.map((f) => f.fragment.id)).toEqual(['drummer song 1, bar 0']);
    // filed beside its meter, and kept with it by the section planned there: twice together
    expect(layer.together).toEqual([{ ids: ['5/4', 'drummer song 1, bar 0'], count: 2 }]);
    expect(cool[8]!.bar.plan.rhythmFragment).toBe('drummer song 1, bar 0');
    expect(cool[15]!.carried.plans.layer!.together).toEqual([
      { ids: ['5/4', 'drummer song 1, bar 0'], count: 3 },
    ]);
  });

  it('files nothing and plays as with no rhythms where the band has no layer: the drummer invents as it did', () => {
    const none = play(24, { meter: FIVE });
    const without = play(24, { meter: FIVE, rhythms: undefined });
    expect(none.map((b) => b.bar)).toEqual(without.map((b) => b.bar));
    expect(none.every((b) => b.carried.ear === null && b.carried.plans.layer === null)).toBe(true);
  });

  it('plays the same from the same seed, style and layer, and a forecast files as the band will', () => {
    const again = play(24, { meter: FIVE, layer: EMPTY_LAYER });
    expect(again.map((b) => b.bar)).toEqual(run.map((b) => b.bar));
    expect(JSON.stringify(again.at(-1)!.carried.plans.layer)).toBe(
      JSON.stringify(run.at(-1)!.carried.plans.layer),
    );
    const forecast = lookAhead(
      band.initial,
      (bar) => ({
        seed: 1,
        bar,
        style: STYLE,
        swing: FUNK.swing,
        wish: { tonic: null, mode: FUNK.mode, melodic: null },
        offer: null,
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        meter: FIVE,
        layer: EMPTY_LAYER,
      }),
      24,
    );
    expect(forecast.map((d) => d.plan)).toEqual(run.map((b) => b.bar.plan));
  });
});

describe('the Muse files a player’s drum pattern the same way (#401)', () => {
  /** Ada's pattern, a bar of 4/4: kick, snare on the backbeat, hats on the eighths. */
  const PATTERN: readonly { note: number; step: number; velocity: number }[] = [
    { note: DRUM_NOTES.kick, step: 0, velocity: 110 },
    { note: DRUM_NOTES.closedHat, step: 2, velocity: 70 },
    { note: DRUM_NOTES.snare, step: 4, velocity: 100 },
    { note: DRUM_NOTES.closedHat, step: 6, velocity: 72 },
    { note: DRUM_NOTES.kick, step: 10, velocity: 96 },
    { note: DRUM_NOTES.snare, step: 12, velocity: 104 },
    { note: DRUM_NOTES.closedHat, step: 14, velocity: 68 },
  ];
  /** Played over the song's first 8 bars, each hit up to 0.3 of a step off the grid, as a hand plays. */
  const PLAYED: HeardNote[] = range(8).flatMap((bar) =>
    PATTERN.map(({ note, step, velocity }, i) => ({
      note,
      velocity,
      source: 'Ada',
      position: bar * 16 + step + (((bar * 7 + i * 3) % 7) - 3) / 10,
      end: null,
    })),
  );

  /** The transport until `bars` bars are laid, each note delivered once the clock has passed it. */
  function heardBy(bars: number, layer?: LearnedLayer): TransportCarried {
    const env: TransportEnv = {
      seed: 3,
      start: 1,
      track: holding(STYLE),
      swing: holdingSwing(FUNK.swing),
      wish: { tonic: null, mode: FUNK.mode, melodic: null },
      repository: METER_REPOSITORY,
      rhythms: RHYTHM_REPOSITORY,
      layer,
      session: 'Friday jam',
    };
    let carried: TransportCarried | null = transport.initial;
    let waiting = [...PLAYED];
    for (let now = env.start - 0.1; ; now += 0.1) {
      const head = carried?.head.step ?? 0;
      const drums = waiting.filter((n) => n.position < head);
      waiting = waiting.filter((n) => n.position >= head);
      carried = transport.advance(env, carried, { now, until: now + LOOKAHEAD, drums }).carried!;
      if (carried.head.step > clockOfTransport(carried).barStart(bars)) return carried;
    }
  }

  it('files it with the player’s name as its source, tagged with the session, where the next section is planned', () => {
    const carried = heardBy(9, EMPTY_LAYER);
    const filed = carried.source.plans.layer!.filed;
    expect(filed.map((f) => f.fragment.id)).toEqual(['Ada song 3, bar 0']);
    expect(filed[0]!.meta).toEqual({
      source: 'Ada',
      created: 'song 3, bar 0',
      tags: [GROOVE_TAG, 'Friday jam'],
    });
  });

  it('is found by the next query at the point it was played at, and reads back as played, to the step the Muse rounds to', () => {
    const carried = heardBy(9, EMPTY_LAYER);
    const layer = carried.source.plans.layer!;
    const plan = carried.bars.at(-1)!.plan;
    const point = stylePoint(writtenStyle(STYLE));
    const found = RHYTHM_REPOSITORY.query(
      point,
      { meter: plan.meter, meterFragment: plan.meterFragment },
      layer,
    );
    expect(found[0]).toEqual({ id: 'Ada song 3, bar 0', distance: 0 });
    // Funk's own drum bar lies there too: the rhythm playing holds against one no nearer
    expect(found[1]).toEqual({ id: 'Funk drums', distance: 0 });
    const text = layer.filed[0]!.fragment.text;
    expect(readRhythm(text, plan.meter)!.hits).toEqual(
      PATTERN.map(({ note, step, velocity }) => ({
        role: note === DRUM_NOTES.kick ? 'kick' : note === DRUM_NOTES.snare ? 'backbeat' : 'hat',
        note,
        step,
        velocity,
      })),
    );
  });

  it('hears nothing and files nothing with no layer, and the band plays as it does with nobody on drums', () => {
    const heard = heardBy(10);
    expect(heard.source.plans.layer).toBeNull();
    expect(heard.source.ear).toBeNull();
  });
});

describe('the composer tires of a groove: varies it, then rejects it, and the drummer invents again (#411)', () => {
  // 5/4 asked for, where no rhythm of cells' fits: section 0 misses and the drummer invents; the Muse files it at section 1.
  const rhythmsOf = (run: ReturnType<typeof play>) =>
    range(run.length / SECTION_BARS).map(
      (s) => run[s * SECTION_BARS]!.bar.plan.rhythmFragment ?? '-',
    );
  const G = 'drummer song 1, bar 0';
  const V = 'composer song 1, bar 32';
  const G2 = 'drummer song 1, bar 56';

  it('at entropy 1 plays the groove 3 sections, its variation the next 3, then rejects both: the drummer invents, and the Muse files that', () => {
    const run = play(
      10 * SECTION_BARS,
      { meter: FIVE, layer: EMPTY_LAYER },
      { ...STYLE, entropy: 1 },
    );
    expect(rhythmsOf(run)).toEqual(['-', G, G, G, V, V, V, '-', G2, G2]);
    // the drummer's own bars play in the section the composer rejected the groove, and its groove is filed where the next is planned
    const filed = run.at(-1)!.carried.plans.layer!.filed;
    expect(filed.map((f) => [f.fragment.id, f.meta.source, f.meta.varies])).toEqual([
      [G, DRUMMER, undefined],
      [V, COMPOSER, G],
      [G2, DRUMMER, undefined],
    ]);
    // (the band decides a bar ahead: the state after bar 47 has planned section 6, the variation's third)
    expect(run[6 * SECTION_BARS - 1]!.carried.plans.boredom).toEqual([
      { grooves: [G, V], boredom: 6, rejected: true },
    ]);
  });

  it('varies by one operator on one line, never the kick or the backbeat, and the drummer plays from the variation', () => {
    const run = play(
      5 * SECTION_BARS,
      { meter: FIVE, layer: EMPTY_LAYER },
      { ...STYLE, entropy: 1 },
    );
    const layer = run.at(-1)!.carried.plans.layer!;
    const [groove, varied] = [G, V].map((id) => RHYTHM_REPOSITORY.read(id, FIVE, layer)!.hits);
    expect(variations(groove!, stepsOf(FIVE)).map((v) => JSON.stringify(v))).toContain(
      JSON.stringify(varied),
    );
    const anchors = (hits: readonly FragmentHit[]) =>
      hits.filter((h) => GROOVE_ANCHORS.includes(h.role));
    expect(anchors(varied!)).toEqual(anchors(groove!));
    expect(run[4 * SECTION_BARS]!.bar.plan.rhythmFragment).toBe(V);
  });

  it('holds the groove at entropy 0: no variation, no rejection, nothing filed but the drummer’s first', () => {
    const run = play(
      12 * SECTION_BARS,
      { meter: FIVE, layer: EMPTY_LAYER },
      { ...STYLE, entropy: 0 },
    );
    expect(rhythmsOf(run)).toEqual(['-', ...range(11).map(() => G)]);
    expect(run.at(-1)!.carried.plans.layer!.filed.map((f) => f.fragment.id)).toEqual([G]);
  });

  it('brings a rejected groove back once its boredom has faded, with its variation, and varies no family twice', () => {
    const run = play(
      30 * SECTION_BARS,
      { meter: FIVE, layer: EMPTY_LAYER },
      { ...STYLE, entropy: 1 },
    );
    const played = rhythmsOf(run);
    // G2's family is rejected after its 6 sections (8 to 13); G's, rejected after section 6, has faded by then
    expect(played.slice(14, 20)).toEqual(played.slice(14, 20).map(() => V));
    expect(run.at(-1)!.carried.plans.layer!.filed).toHaveLength(4);
  });
});
