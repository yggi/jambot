// @vitest-environment node
import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { CUE_BARS, type CueInput, cuesOf } from './cues.ts';
import type { BarView, Hud } from './hud.ts';

/** Bar `n` of a song of eight-bar sections in A minor, 4/4, the lead improvising. */
const bar = (n: number, over: Partial<BarView> = {}): BarView =>
  ({
    bar: n,
    barInSection: n % 8,
    sectionIndex: Math.floor(n / 8),
    section: n < 8 ? 'Intro' : 'Groove',
    key: 'A minor',
    tonic: 9,
    scale: [0, 2, 4, 5, 7, 9, 11],
    meter: METERS['4/4'],
    meterName: '4/4',
    lead: 'improvising',
    motif: null,
    ...over,
  }) as BarView;

/** The hud at bar `n`, beat `beat`, with the seven bars after it as `ahead` makes them. */
const hud = (
  n: number,
  beat: number | null = 0,
  ahead: (m: number) => Partial<BarView> = () => ({}),
  near: { at: string; toward: string | null } = { at: 'Synth-pop', toward: null },
): Pick<Hud, 'bar' | 'beat' | 'next' | 'style'> =>
  ({
    bar: bar(n, ahead(n)),
    beat,
    next: Array.from({ length: 7 }, (_, i) => bar(n + 1 + i, ahead(n + 1 + i))),
    style: { near },
  }) as unknown as Pick<Hud, 'bar' | 'beat' | 'next' | 'style'>;

const input = (over: Partial<CueInput>): CueInput => ({
  hud: hud(0),
  counting: null,
  ending: false,
  radio: false,
  ...over,
});
const kinds = (i: CueInput) => cuesOf(i).map((c) => c.kind);

describe('the cues: every heads-up read from the plan the band already holds', () => {
  it('counts the band in, in beats', () => {
    const [cue] = cuesOf(input({ hud: hud(0, null), counting: { left: 3, of: 4 } }));
    expect(cue).toMatchObject({
      kind: 'count-in',
      what: 'Count-in',
      beatsLeft: 3,
      beats: 4,
      bars: 0,
    });
  });

  it('says the band ends on its bar’s last beat, in beats', () => {
    const [cue] = cuesOf(input({ hud: hud(3, 1), ending: true }));
    expect(cue).toMatchObject({ kind: 'ending', beatsLeft: 3, beats: 4 });
  });

  it('names the next section once it is within reach, in bars, then in its last bar in beats', () => {
    expect(CUE_BARS).toBe(4);
    expect(kinds(input({ hud: hud(2) }))).toEqual([]);
    expect(cuesOf(input({ hud: hud(4) }))[0]).toMatchObject({
      kind: 'section',
      what: 'Groove',
      bars: 4,
      beatsLeft: null,
    });
    expect(cuesOf(input({ hud: hud(7, 2) }))[0]).toMatchObject({ bars: 1, beatsLeft: 2 });
  });

  it('says a new key and a new meter with the section, and draws the one that changes', () => {
    const turn = (m: number) =>
      m >= 8
        ? {
            key: 'D minor',
            tonic: 2,
            scale: [0, 2, 4, 5, 7, 9, 10],
            meter: METERS['7/8'],
            meterName: '7/8 2+2+3',
          }
        : {};
    const [cue] = cuesOf(input({ hud: hud(6, 0, turn) }));
    expect(cue).toMatchObject({ what: 'Groove · D minor · 7/8 2+2+3', glyph: 'key', tonic: 2 });
    const meterOnly = (m: number) =>
      m >= 8 ? { meter: METERS['7/8'], meterName: '7/8 2+2+3' } : {};
    expect(cuesOf(input({ hud: hud(6, 0, meterOnly) }))[0]).toMatchObject({
      what: 'Groove · 7/8 2+2+3',
      glyph: 'meter',
    });
  });

  it('says the lead comes in or drops out at the section line, in the lead’s own shape', () => {
    const rests = (from: number) => (m: number) => (m >= from ? { lead: 'resting' as const } : {});
    expect(cuesOf(input({ hud: hud(6, 0, rests(8)) })).map((c) => [c.kind, c.what])).toContainEqual(
      ['voice', 'Lead drops out'],
    );
    const enters = (m: number) => (m < 8 ? { lead: 'resting' as const } : {});
    const cue = cuesOf(input({ hud: hud(6, 0, enters) })).find((c) => c.kind === 'voice');
    expect(cue).toMatchObject({ what: 'Lead comes in', glyph: 'lead', who: null });
  });

  it('says the lead takes up a player’s motif, in their colour, from the bar it plays it', () => {
    const ada = { source: 'k', name: 'Ada', colour: 2, bar: 1 };
    const offered = (m: number) => (m >= 3 ? { lead: 'motif' as const, motif: ada } : {});
    const cue = cuesOf(input({ hud: hud(1, 0, offered) })).find((c) => c.kind === 'motif');
    expect(cue).toMatchObject({ what: 'Lead plays Ada’s motif', who: 2, bars: 2, glyph: 'lead' });
  });

  it('says where the radio drifts, only while it is on the air and heading for another preset', () => {
    const drifting = hud(5, 0, () => ({}), { at: 'Synth-pop', toward: 'Funk' });
    expect(kinds(input({ hud: drifting }))).toEqual(['section']);
    expect(
      cuesOf(input({ hud: drifting, radio: true })).find((c) => c.kind === 'radio'),
    ).toMatchObject({
      what: 'Radio · toward Funk',
      glyph: 'radio',
    });
  });

  it('puts the nearest first', () => {
    const ada = { source: 'k', name: 'Ada', colour: 2, bar: 1 };
    const both = (m: number) => (m >= 6 ? { lead: 'motif' as const, motif: ada } : {});
    const cues = cuesOf(input({ hud: hud(5, 0, both), ending: true }));
    expect(cues.map((c) => c.kind)).toEqual(['ending', 'motif', 'section']);
  });

  it('says nothing ahead before anything is heard, but the count-in', () => {
    expect(kinds(input({ hud: hud(6, null) }))).toEqual([]);
  });
});
