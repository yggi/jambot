import {
  BASS_REPOSITORY,
  type BandBar,
  type BandCarried,
  HARMONY_REPOSITORY,
  LEAD_REPOSITORY,
  METER_REPOSITORY,
  PRESETS,
  RHYTHM_REPOSITORY,
  SECTION_BARS,
  band,
  presetMode,
  presetSwing,
} from '@jambot/engine';
import { compileSection, sectionAsCells, sectionOutline, sectionTextOf } from '@jambot/score';
import { describe, expect, it } from 'vitest';
import { type PlayingRow, playingRows, playingSummary } from './playingView.ts';

/** A preset's first section as the app's band composes it, finding its parts in the repository, seed 1. */
function firstSection(name: string): BandBar[] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  return Array.from({ length: SECTION_BARS }, (_, bar) => {
    const made = band.advance(
      {
        seed: 1,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        swing: presetSwing(preset)!,
        offer: null,
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        bassLines: BASS_REPOSITORY,
        leads: LEAD_REPOSITORY,
        harmonies: HARMONY_REPOSITORY,
      },
      carried,
      null,
    );
    carried = made.carried;
    return made.output;
  });
}

/** A section's score and its outline, as the worker answers with them. */
function scored(name: string) {
  const text = sectionTextOf(sectionAsCells(firstSection(name)));
  return { text, outline: sectionOutline(compileSection(text)) };
}

/** Rows as nested lines, `label id`, for a readable expectation. */
const drawn = (rows: readonly PlayingRow[]) =>
  rows.map((r) => `${'  '.repeat(r.depth)}${r.label} ${r.id ?? '-'}`);

describe('the Playing tree (#642)', () => {
  const funk = scored('Funk');

  it('reads a section from the ground: each part under what it is taken on, the clave in its drums', () => {
    expect(drawn(playingRows(funk.text, funk.outline, 'ground'))).toEqual([
      'bar meter',
      '  drums -',
      '    clave rumba_clave_3_2',
      '  pad -',
      '  lead -',
      'key diatonic',
      '  harm -',
      '    bass -',
      '    stab -',
      'funk styles',
      'style -',
      // (the section's intensity, its song folded in: #645)
      'intensity -',
    ]);
  });

  it('names what plays each part from the band, its arguments and the score’s lines it is', () => {
    const rows = playingRows(funk.text, funk.outline, 'ground');
    const row = (label: string) => rows.find((r) => r.label === label)!;
    expect(row('bass').on).toEqual(['bass_performer', 'bass']);
    expect(row('bar').args).toBe('swing=16n:.6, tempo=104bpm');
    expect(row('key').args).toBe('mode=dorian, tonic=D');
    const lines = funk.text.split('\n');
    expect(row('clave').lines.map((n) => lines[n - 1])).toEqual(['&clave from rumba_clave_3_2']);
    // (the drums: every role, its bars and levels, and the line the band is passed)
    expect(row('drums').lines.map((n) => lines[n - 1]!.split(' ')[0])).toContain('&drumlines');
  });

  it('reads it from the outputs: the band, each instrument and performer, the line it plays and what that reads', () => {
    expect(drawn(playingRows(funk.text, funk.outline, 'outputs')).slice(3, 14)).toEqual([
      'band band',
      '  drums_performer drums_performer',
      '    drums -',
      '      clave rumba_clave_3_2',
      '  stab_performer stab_performer',
      '    stab -',
      '  bass bass',
      '    bass_performer bass_performer',
      '      bass -',
      '        harm -',
      '          bar meter',
    ]);
  });

  it('gives a fragment the composer has in mind its weight there', () => {
    const rows = playingRows(funk.text, funk.outline, 'ground', {
      inMind: [{ id: 'rumba_clave_3_2', weight: 0.5 }],
      boredom: [],
    });
    expect(rows.find((r) => r.label === 'clave')!.weight).toBe(0.5);
    expect(rows.find((r) => r.label === 'bar')!.weight).toBeNull();
  });

  it('sums up, folded, how many parts play and how many of them are fragments', () => {
    expect(playingSummary(playingRows(funk.text, funk.outline, 'ground'))).toEqual({
      main: '12 parts playing',
      sub: '4 from fragments · 8 written',
    });
    expect(playingSummary(playingRows(funk.text, funk.outline, 'ground').slice(0, 1)).main).toBe(
      '1 part playing',
    );
  });

  it.each(PRESETS.map((p) => p.name))(
    'at %s, places every line of the score in one row or in the band, from the ground, and every row once',
    (name) => {
      const { text, outline } = scored(name);
      const rows = playingRows(text, outline, 'ground');
      expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
      const covered = rows.flatMap((r) => r.lines);
      expect(new Set(covered).size, 'a line in two rows').toBe(covered.length);
      const band = outline.parts
        .filter((p) => p.id === 'band' || p.within !== null)
        .map((p) => p.line);
      const lines = text.split('\n').length;
      const parted = new Set(outline.parts.filter((p) => p.line <= lines).map((p) => p.line));
      expect([...parted].filter((n) => !covered.includes(n) && !band.includes(n))).toEqual([]);
    },
  );
});
