import { compileSource } from '@yggi/cells/engine/compile';
import { BASS_FRAGMENTS } from '@yggi/cells/repository/bass';
import { INSTRUMENT_FRAGMENTS } from '@yggi/cells/repository/instruments';
import { MODE_FRAGMENTS } from '@yggi/cells/repository/modes';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { describe, expect, it } from 'vitest';
import { METERS } from '@jambot/theory';
import {
  INSTRUMENT_LINES,
  notedVoices,
  PERFORMER_VOICES,
  instrumentsAt,
  instrumentsFor,
  withInstruments,
} from './instruments.ts';
import { readRhythm } from './rhythms.ts';
import { PRESETS } from './style.ts';

const errors = (text: string) =>
  compileSource(text)
    .diagnostics.filter((d) => d.severity === 'error')
    .map((d) => d.message);

const lineOf = (id: string, voice: string) =>
  INSTRUMENT_FRAGMENTS.find((f) => f.id === id)!
    .text.split('\n')
    .find((line) => line.startsWith(`&${voice} `))!;

describe("the instruments a fragment's sound holes are filled from (yggi/cells#244)", () => {
  it("fills every seed rhythm's, bass line's and mode's sound holes, so each compiles with nothing unknown but the workbench's names", () => {
    const seeds = [...RHYTHM_FRAGMENTS, ...BASS_FRAGMENTS, ...MODE_FRAGMENTS];
    expect(seeds.length).toBeGreaterThan(20);
    // (`&harm`, `&bar`, `&key` and the modes' `&tonic` are the workbench's, which a bench brings: not an instrument's)
    const unknownVoices = (text: string) =>
      errors(text).filter(
        (m) => /Unknown cell/.test(m) && !/Unknown cell &(harm|bar|key|tonic)\b/.test(m),
      );
    // (some seeds strike voices they don't define: else this would show nothing)
    expect(seeds.filter((f) => unknownVoices(f.text).length).length).toBeGreaterThan(0);
    for (const f of seeds) expect(unknownVoices(withInstruments(f.text)), f.id).toEqual([]);
  });

  it("takes a drum's voice and the agogô from the General MIDI kit, and the bass's voice from `bass`", () => {
    expect(INSTRUMENT_LINES.get('bd')).toBe(lineOf('gm_kit', 'bd'));
    expect(INSTRUMENT_LINES.get('highagogo')).toBe(lineOf('gm_kit', 'highagogo'));
    expect(INSTRUMENT_LINES.get('bassV')).toBe(lineOf('bass', 'bassV'));
  });

  it('adds only the voices a text reads and does not define, and leaves a text that lacks none as it is', () => {
    expect(instrumentsFor('&kick step=16n &bd ~ &bd:0:.5 ~\n&drums map=midi(10) [&kick]')).toEqual([
      lineOf('gm_kit', 'bd'),
    ]);
    // (a groove filed before cells v0.10.0 states its own voices: it keeps them, each with the note its name gave)
    const own = '&kick step=16n &bd ~ &bd ~\n&bd s=white\n&drums map=midi(10) [&kick]';
    expect(withInstruments(own)).toBe(own.replace('&bd s=white', '&bd note=36 s=white'));
    // (a voice no instrument defines is left for the compile to name)
    expect(instrumentsFor('&x step=16n &nosuchvoice ~')).toEqual([]);
    // (a name that only starts with an instrument's is not it)
    expect(instrumentsFor('&x step=16n &bdx ~')).toEqual([]);
  });
});

describe('a groove filed with its own voices, read at cells v0.22.0 (yggi/cells#626)', () => {
  it('sends each of its drums as General MIDI’s note for its name, which cells gives a name no longer: as it was filed', () => {
    const old = [
      '&kick step=16n &bd ~ ~ ~ &bd ~ ~ ~ &bd ~ ~ ~ &bd ~ ~ ~',
      '&backbeat step=16n ~ ~ ~ ~ &sd ~ ~ ~ ~ ~ ~ ~ &sd ~ ~ ~',
      '&hat step=16n &hh ~ &hh ~ &hh ~ &hh ~ &hh ~ &hh ~ &hh ~ &hh ~',
      '&bd s=white',
      '&sd s=white',
      '&hh s=white',
      '&groove [&kick, &backbeat, &hat]',
    ].join('\n');
    const read = readRhythm(old, METERS['4/4'])!;
    expect([...new Set(read.hits.map((h) => `${h.role} ${h.note}`))].sort()).toEqual([
      'backbeat 38',
      'hat 42',
      'kick 36',
    ]);
    // (a voice that writes its note keeps it, and a line with no sound is no voice to write one on)
    expect(notedVoices('&bd note=40 s=white')).toBe('&bd note=40 s=white');
    expect(notedVoices('&bd gain=1')).toBe('&bd gain=1');
  });
});

describe('the instruments a section’s performers play, found at its style (#497)', () => {
  const point = { sync: 0.9, harm: 0.1, artic: 0.9, energy: 0.1 };
  /** An instrument for the lead at a point of its own, as yggi/cells#350's are at the two presets'. */
  const theirs = {
    id: 'test whistle',
    text: '&leadV s=sine loop=C4 env=&(map=adsr .05 .1 .8 .2)',
    association: [{ point, weight: 0.125, facet: 'instrument' }],
  };

  /** The instruments cells wrote for two presets' points (yggi/cells#366): elsewhere each performer plays its own. */
  const FOUND: Record<string, Partial<Record<keyof typeof PERFORMER_VOICES, string>>> = {
    'Electro swing': { bass: 'upright_bass', lead: 'clarinet', stab: 'brass_stab' },
    Spooky: { bass: 'round_bass', lead: 'theremin', pad: 'organ', stab: 'celesta' },
  };

  it.each(PRESETS.map((p) => p.name))(
    'at %s, a performer plays the instrument found at its point where it isn’t its own, its own elsewhere',
    (name) => {
      const style = PRESETS.find((p) => p.name === name)!.style;
      for (const library of [INSTRUMENT_FRAGMENTS, [...INSTRUMENT_FRAGMENTS, theirs]]) {
        const found = instrumentsAt(style, library);
        expect(
          Object.fromEntries(Object.entries(found).map(([part, { id }]) => [part, id])),
        ).toEqual(FOUND[name] ?? {});
        // (the line each plays is the one its instrument defines the performer's voice with)
        for (const [part, { id, line }] of Object.entries(found))
          expect(line).toBe(
            lineOf(id, PERFORMER_VOICES[part as keyof typeof PERFORMER_VOICES].voice),
          );
        // (and holds its performer's own instrument's register, so MIDI out sends the same notes)
        for (const [part, { line }] of Object.entries(found)) {
          const { own, voice } = PERFORMER_VOICES[part as keyof typeof PERFORMER_VOICES];
          expect(/loop=(\S+)/.exec(line)![1], `${name} ${part}`).toBe(
            /loop=(\S+)/.exec(lineOf(own, voice))![1],
          );
        }
      }
    },
  );

  it('at an instrument’s own point, the performer whose voice it defines plays it, and the others their own', () => {
    expect(instrumentsAt(point, [...INSTRUMENT_FRAGMENTS, theirs])).toEqual({
      lead: { id: 'test whistle', line: theirs.text },
    });
  });

  // (since cells v0.15.0 each default instrument has a sound, `s=` and its filters, and reads the section's &style:
  // the lead's a blend of two waves, `s=tri..square * &style[artic]`, cells decision 066)
  it('names each pitched performer’s voice as its own instrument defines it, its register and its sound', () => {
    for (const { voice, own } of Object.values(PERFORMER_VOICES))
      expect(lineOf(own, voice), own).toMatch(
        new RegExp(`^&${voice} s=\\S+( \\* &\\S+)? loop=C\\d( |$)`),
      );
  });
});
