import { compileSource } from '@yggi/cells/engine/compile';
import { bodyOf } from '@yggi/cells/engine/use';
import {
  BASS_FRAGMENTS,
  INSTRUMENT_FRAGMENTS,
  MODE_FRAGMENTS,
  RHYTHM_FRAGMENTS,
} from './library.ts';
import { describe, expect, it } from 'vitest';
import { METERS } from '@jambot/theory';
import { INSTRUMENT_LINES, notedVoices, instrumentsFor, withInstruments } from './instruments.ts';
import { grooveLines, readRhythm } from './rhythms.ts';

const errors = (text: string) =>
  compileSource(text)
    .diagnostics.filter((d) => d.severity === 'error')
    .map((d) => d.message);

/** The line an instrument defines a voice with: of its body, past a signature (`&bassV from (&style)`, yggi/cells#631). */
const lineOf = (id: string, voice: string) =>
  bodyOf(INSTRUMENT_FRAGMENTS.find((f) => f.id === id)!.text)
    .split('\n')
    .find((line) => line.startsWith(`&${voice} `))!;

describe("the instruments a fragment's sound holes are filled from (yggi/cells#244)", () => {
  it("fills every seed rhythm's, bass line's and mode's sound holes, so each compiles with nothing unknown but the workbench's names", () => {
    // (a groove by its lines, as the band reads it: its drums the parameters its `from gm_kit` line fills, #634)
    const seeds = [
      ...RHYTHM_FRAGMENTS.map((f) => ({ ...f, text: grooveLines(f.text) })),
      ...BASS_FRAGMENTS,
      ...MODE_FRAGMENTS,
    ];
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
