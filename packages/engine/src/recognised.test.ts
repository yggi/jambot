import { METERS, even, stepsOf } from '@jambot/theory';
import { readVariations } from '@yggi/cells/engine/vary/index';
import { createRecogniser } from '@yggi/cells/repository/recognise';
import { describe, expect, it } from 'vitest';
import { type BandBar, type BandCarried, type BandEnv, band } from './band.ts';
import { BASS_REPOSITORY, readLine } from './bass-lines.ts';
import { chordsOn } from './chords.ts';
import { HARMONY_REPOSITORY } from './progressions.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { LEAD_REPOSITORY, MOTIF_LEADS, leadText } from './lead-lines.ts';
import type { LeadNote } from './lead-query.ts';
import { stylePoint } from './meter-query.ts';
import { presetMode } from './mode-repository.ts';
import { lineOf } from './muse-line.ts';
import {
  type BarRecognition,
  LATELY_THEMES,
  LOOP_FACETS,
  type LoopFacet,
  NOTHING_LATELY,
  NOTHING_RECOGNISED,
  LATELY_BARS,
  SHARE_BARS,
  barTexts,
  heardInto,
  heardTexts,
  libraryOf,
  playedInto,
  recogniseOptionsOf,
  recognisedBar,
  shareOf,
} from './recognised.ts';
import { METER_REPOSITORY, SEED_FRAGMENTS, presetSwing } from './repository.ts';
import { RHYTHM_REPOSITORY, readRhythm } from './rhythms.ts';
import { PRESETS } from './style.ts';

const FOUR = { meter: METERS['4/4'] };
const recogniser = createRecogniser();
const byName = (name: string) => PRESETS.find((p) => p.name === name)!;

/** A layer with one lead line filed, as the Muse files a player's. */
const LINE: LeadNote[] = [
  { step: 0, degree: 0, alter: 0 },
  { step: 4, degree: 2, alter: 0 },
  { step: 8, degree: 4, alter: 0 },
];
const WITH_LINE: LearnedLayer = LEAD_REPOSITORY.file!(EMPTY_LAYER, {
  notes: LINE,
  bench: FOUR,
  point: stylePoint(byName('Techno').style),
  source: 'player',
  created: 'song 1, bar 0',
  tags: [],
}).layer;

/** A preset held at entropy 0.3, every member through the loop, learning from an empty layer: its first `bars` bars. */
function played(name: string, bars: number): BandBar[] {
  const preset = byName(name);
  let carried = band.initial as BandCarried;
  const out: BandBar[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const env: BandEnv = {
      seed: 1,
      bar,
      style: { ...preset.style, entropy: 0.3 },
      wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
      swing: presetSwing(preset)!,
      repository: METER_REPOSITORY,
      rhythms: RHYTHM_REPOSITORY,
      layer: EMPTY_LAYER,
      offer: null,
      bassLines: BASS_REPOSITORY,
      leads: LEAD_REPOSITORY,
      harmonies: HARMONY_REPOSITORY,
    };
    const next = band.advance(env, carried, null);
    carried = next.carried;
    out.push(next.output);
  }
  return out;
}

describe('a member’s library (libraryOf)', () => {
  it('holds cells’ seeds of its facet alone, each of them, and the lead cells’ motifs (#520)', () => {
    const counts = LOOP_FACETS.map((f) => libraryOf(f).length);
    expect(counts).toEqual(
      LOOP_FACETS.map(
        (facet) =>
          SEED_FRAGMENTS.filter((f) => f.association.some((p) => p.facet === facet)).length,
      ),
    );
    expect(libraryOf('lead')).toEqual(MOTIF_LEADS);
    for (const facet of LOOP_FACETS)
      for (const f of libraryOf(facet))
        expect(f.association.some((p) => p.facet === facet)).toBe(true);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(
      SEED_FRAGMENTS.filter((f) => f.association.every((p) => p.facet !== 'meter')).length,
    );
  });

  it('adds what the layer filed of its facet, and nothing of another’s', () => {
    const counts = LOOP_FACETS.map((f) => libraryOf(f, WITH_LINE).length);
    expect(counts).toEqual(LOOP_FACETS.map((f) => libraryOf(f).length + (f === 'lead' ? 1 : 0)));
    expect(libraryOf('lead', WITH_LINE)[MOTIF_LEADS.length]!.text).toBe(leadText(LINE, 16));
  });
});

describe('a bar recognised (recognisedBar)', () => {
  it('recognises every seed of every member as itself, in 4/4', () => {
    for (const facet of LOOP_FACETS)
      for (const fragment of libraryOf(facet)) {
        const found = recogniser.recognise(
          fragment.text,
          libraryOf(facet),
          recogniseOptionsOf(facet, FOUR)!,
        );
        expect(found[0]?.fragment.id, fragment.id).toBe(fragment.id);
        expect(found[0]!.path).toEqual([]);
        expect(recognisedBar(recogniser, { [facet]: fragment.text }, FOUR)).toEqual({
          [facet]: true,
        });
      }
  });

  // (the variations whose bar strikes the steps its source does, so it reads as the source)
  const SAME_ONSETS = ['Spooky drums: drop &euclid 1'];
  it('recognises every variation the composer may make of a seed rhythm or bass line, by its operator, or as its source where it strikes the source’s steps', () => {
    let variations = 0;
    for (const facet of ['rhythm', 'bass'] as const)
      for (const fragment of libraryOf(facet)) {
        const options = recogniseOptionsOf(facet, FOUR)!;
        for (const { variation } of readVariations(fragment.text, options).variations) {
          variations++;
          const text = variation.apply(fragment.text);
          const found = recogniser.recognise(text, libraryOf(facet), options);
          // (Spooky drums' rim knocks once, mid-bar, where in 4/4 its kick strikes too: dropped, its bar reads as the
          // source's own, recognised at distance 0 with no operator, yggi/cells#360)
          const asItsSource = SAME_ONSETS.includes(`${fragment.id}: ${variation.by}`);
          expect(
            found.some(
              (r) =>
                r.fragment.id === fragment.id &&
                (asItsSource
                  ? r.path.length === 0 && r.distance === 0
                  : r.path[0]?.by === variation.by),
            ),
            `${fragment.id}: ${variation.by}`,
          ).toBe(true);
          expect(recognisedBar(recogniser, { [facet]: text }, FOUR)[facet]).toBe(true);
        }
      }
    expect(variations).toBeGreaterThan(100);
  });

  it('does not recognise a seed rhythm two operators away, nor a lead line before the layer files it', () => {
    const techno = libraryOf('rhythm').find((f) => f.id === 'Techno drums')!;
    const options = recogniseOptionsOf('rhythm', FOUR)!;
    const once = readVariations(techno.text, options).variations.find(
      (v) => v.variation.rule === 'drop',
    )!.variation;
    const onceText = once.apply(techno.text);
    const twice = readVariations(onceText, options).variations.find(
      (v) => v.variation.rule === 'drop',
    )!.variation;
    expect(recognisedBar(recogniser, { rhythm: twice.apply(onceText) }, FOUR)).toEqual({
      rhythm: false,
    });
    expect(recognisedBar(recogniser, { lead: leadText(LINE, 16) }, FOUR)).toEqual({
      lead: false,
    });
    expect(recognisedBar(recogniser, { lead: leadText(LINE, 16) }, FOUR, WITH_LINE)).toEqual({
      lead: true,
    });
    // (lifted, the composer's variation of it: recognised by the lead's operator)
    const lifted = LINE.map((n) => ({ ...n, degree: n.degree + 2 }));
    expect(recognisedBar(recogniser, { lead: leadText(lifted, 16) }, FOUR, WITH_LINE)).toEqual({
      lead: true,
    });
  });

  it('recognises within a tolerance the notes that differ, and only then', () => {
    const techno = libraryOf('rhythm').find((f) => f.id === 'Techno drums')!;
    const options = recogniseOptionsOf('rhythm', FOUR)!;
    const once = readVariations(techno.text, options).variations.find(
      (v) => v.variation.rule === 'drop',
    )!.variation;
    const onceText = once.apply(techno.text);
    const twice = readVariations(onceText, options)
      .variations.find((v) => v.variation.rule === 'drop')!
      .variation.apply(onceText);
    expect(recognisedBar(recogniser, { rhythm: twice }, FOUR, undefined, 1)).toEqual({
      rhythm: true,
    });
  });

  it('leaves out a member that stated nothing, and recognises none on a meter cells names no workbench for', () => {
    expect(recognisedBar(recogniser, {}, FOUR)).toEqual({});
    const text = libraryOf('bass')[0]!.text;
    expect(recognisedBar(recogniser, { bass: text }, { meter: even(4, 9) })).toEqual({
      bass: false,
    });
    expect(recogniseOptionsOf('bass', { meter: even(4, 9) })).toBeNull();
  });
});

describe('what each member played, as cells text (barTexts)', () => {
  it('states the drums’ hits but the clave’s, and the bass’s line, each reading back as the bar played them', () => {
    let drums = 0;
    for (const name of ['Techno', 'Bossa nova', 'Swing jazz'])
      for (const bar of played(name, 16)) {
        const texts = barTexts(bar);
        const steps = stepsOf(bar.meter);
        const hits = bar.written
          .filter((n) => n.part === 'drums' && n.role !== 'clave')
          .map((n) => `${n.step}:${n.note}`)
          .sort();
        if (hits.length) {
          drums++;
          const read = readRhythm(texts.rhythm!, bar.meter)!;
          expect(read.hits.map((h) => `${h.step}:${h.note}`).sort()).toEqual(hits);
        } else expect(texts.rhythm).toBeUndefined();
        const bass = bar.written.filter((n) => n.part === 'bass' && n.step < steps);
        const line = lineOf(bass, chordsOn(bar.chords, bar.meter), chordsOn(bar.next, bar.meter));
        expect(readLine(texts.bass!, bar.meter)!.notes).toEqual(line);
      }
    expect(drums).toBeGreaterThan(40);
  });

  it('states the lead where it played, and the section’s theme where a progression states it', () => {
    const techno = played('Techno', 16);
    // (Techno's A theme is a seed vamp: its text is the seed's)
    const vamp = barTexts(techno[0]!).harmony;
    expect(libraryOf('harmony').some((f) => f.text === vamp)).toBe(true);
    for (const bar of techno) {
      const lead = bar.written.some((n) => n.part === 'lead');
      expect(barTexts(bar).lead !== undefined).toBe(lead);
    }
    // (Bossa nova's theme leads to a dominant, which no progression states)
    expect(barTexts(played('Bossa nova', 1)[0]!).harmony).toBeUndefined();
  });
});

describe('the share of bars recognised (heardInto, shareOf)', () => {
  it('is a member’s recognised bars over those it played in, for every window of sixteen bars of one member', () => {
    for (let pattern = 0; pattern < 1 << SHARE_BARS; pattern++) {
      let window = NOTHING_RECOGNISED;
      for (let b = 0; b < SHARE_BARS; b++)
        window = heardInto(window, { bass: ((pattern >> b) & 1) === 1, lead: b % 2 === 0 });
      let ones = 0;
      for (let b = 0; b < SHARE_BARS; b++) ones += (pattern >> b) & 1;
      expect(shareOf(window, 'bass')).toBe(ones / SHARE_BARS);
      expect(shareOf(window, 'rhythm')).toBeNull();
      expect(shareOf(window)).toBe((ones + SHARE_BARS / 2) / (2 * SHARE_BARS));
    }
  });

  it('keeps the last sixteen bars: a seventeenth lets the first go', () => {
    let window = heardInto(NOTHING_RECOGNISED, { rhythm: true });
    for (let b = 1; b < SHARE_BARS; b++) window = heardInto(window, { rhythm: false });
    expect(shareOf(window, 'rhythm')).toBe(1 / SHARE_BARS);
    window = heardInto(window, { rhythm: false });
    expect(window).toHaveLength(SHARE_BARS);
    expect(shareOf(window, 'rhythm')).toBe(0);
  });

  it('pools every member’s bar played over all members, for every bar of the four members', () => {
    const states = [undefined, false, true] as const;
    for (let code = 0; code < 3 ** LOOP_FACETS.length; code++) {
      const bar: Partial<Record<LoopFacet, boolean>> = {};
      LOOP_FACETS.forEach((f, i) => {
        const state = states[Math.floor(code / 3 ** i) % 3];
        if (state !== undefined) bar[f] = state;
      });
      const heard = Object.values(bar);
      const share = shareOf(heardInto(NOTHING_RECOGNISED, bar as BarRecognition));
      expect(share).toBe(heard.length ? heard.filter(Boolean).length / heard.length : null);
    }
    expect(shareOf(NOTHING_RECOGNISED)).toBeNull();
  });
});

describe('what each member played lately (heardTexts, playedInto)', () => {
  it('hears the theme once a section, at its first bar, and every other member every bar it states', () => {
    for (const bar of played('Techno', 16)) {
      const { harmony, ...rest } = barTexts(bar);
      const heard = heardTexts(bar);
      expect({ ...heard, harmony: undefined }).toEqual({ ...rest, harmony: undefined });
      expect(heard.harmony).toBe(bar.barInSection === 0 ? harmony : undefined);
    }
  });

  it('keeps a member’s last eight texts and the harmony’s last two themes, each member alone', () => {
    let lately = NOTHING_LATELY;
    for (let b = 0; b < 3 * LATELY_BARS; b++)
      lately = playedInto(lately, {
        bass: `bass ${b}`,
        ...(b % 2 ? {} : { lead: `lead ${b}` }),
        ...(b % LATELY_BARS ? {} : { harmony: `theme ${b}` }),
      });
    const last = (n: number, of: (b: number) => string, every = 1) =>
      [...Array(3 * LATELY_BARS).keys()]
        .filter((b) => b % every === 0)
        .slice(-n)
        .map(of);
    expect(lately.bass).toEqual(last(LATELY_BARS, (b) => `bass ${b}`));
    expect(lately.lead).toEqual(last(LATELY_BARS, (b) => `lead ${b}`, 2));
    expect(lately.harmony).toEqual(last(LATELY_THEMES, (b) => `theme ${b}`, LATELY_BARS));
    expect(lately.rhythm).toEqual([]);
  });

  it('joins a member’s library after its seeds and filings, each text once, and no other member’s', () => {
    const text = leadText(LINE, 16);
    const lately = { ...NOTHING_LATELY, lead: [text, text] };
    expect(libraryOf('lead', undefined, lately).map((f) => f.text)).toEqual([
      ...MOTIF_LEADS.map((f) => f.text),
      text,
    ]);
    expect(libraryOf('bass', undefined, lately)).toEqual(libraryOf('bass'));
  });

  it('recognises a bar the member played lately, and a variation of it by one of its operators, where nothing else would', () => {
    const text = leadText(LINE, 16);
    const lifted = leadText(
      LINE.map((n) => ({ ...n, degree: n.degree + 2 })),
      16,
    );
    const lately = { ...NOTHING_LATELY, lead: [text] };
    expect(recognisedBar(recogniser, { lead: text }, FOUR)).toEqual({ lead: false });
    expect(recognisedBar(recogniser, { lead: text }, FOUR, undefined, 0, lately)).toEqual({
      lead: true,
    });
    expect(recognisedBar(recogniser, { lead: lifted }, FOUR, undefined, 0, lately)).toEqual({
      lead: true,
    });
    const other = leadText([{ step: 2, degree: 6, alter: 0 }], 16);
    expect(recognisedBar(recogniser, { lead: other }, FOUR, undefined, 0, lately)).toEqual({
      lead: false,
    });
  });
});
