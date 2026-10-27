import { compileSource } from '@yggi/cells/engine/compile';
import { BASS_FRAGMENTS } from '@yggi/cells/repository/bass';
import { INSTRUMENT_FRAGMENTS } from '@yggi/cells/repository/instruments';
import { MODE_FRAGMENTS } from '@yggi/cells/repository/modes';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { describe, expect, it } from 'vitest';
import { INSTRUMENT_LINES, instrumentsFor, withInstruments } from './instruments.ts';

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
    // (at v0.10.0 the rhythms and the bass lines strike voices they don't define)
    expect(seeds.filter((f) => unknownVoices(f.text).length).length).toBeGreaterThan(10);
    for (const f of seeds) expect(unknownVoices(withInstruments(f.text)), f.id).toEqual([]);
  });

  it("takes a voice from the core kit before the General MIDI kit, the agogô from the General MIDI kit, and the bass's voice from `bass`", () => {
    expect(INSTRUMENT_LINES.get('bd')).toBe(lineOf('core kit', 'bd'));
    expect(INSTRUMENT_LINES.get('highagogo')).toBe(lineOf('gm kit', 'highagogo'));
    expect(INSTRUMENT_LINES.get('bassV')).toBe('&bassV loop=C2');
  });

  it('adds only the voices a text reads and does not define, and leaves a text that lacks none as it is', () => {
    expect(instrumentsFor('&kick step=16n &bd ~ &bd:0:.5 ~\n&drums map=midi(10) [&kick]')).toEqual([
      lineOf('core kit', 'bd'),
    ]);
    // (a groove filed before the pin states its own voices: it keeps them)
    const own = '&kick step=16n &bd ~ &bd ~\n&bd s=white\n&drums map=midi(10) [&kick]';
    expect(withInstruments(own)).toBe(own);
    // (a voice no instrument defines is left for the compile to name)
    expect(instrumentsFor('&x step=16n &nosuchvoice ~')).toEqual([]);
    // (a name that only starts with an instrument's is not it)
    expect(instrumentsFor('&x step=16n &bdx ~')).toEqual([]);
  });
});
