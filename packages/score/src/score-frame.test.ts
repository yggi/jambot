/**
 * What a score states, read from the score alone (`score-frame.ts`, #553 rung 3): held to what the band composed it
 * from, for every preset in its own meter and in every meter, so a client of session version 2 reads the meter, swing,
 * tempo, key and style a host of version 1 sent beside the text.
 */

import {
  type BandBar,
  type BandCarried,
  PRESETS,
  SECTION_BARS,
  STRAIGHT,
  band,
  presetMode,
  presetSwing,
  sameMeter,
} from '@jambot/engine';
import { METERS, type MeterName } from '@jambot/theory';
import { resolveBand } from '@yggi/cells/library';
import { describe, expect, it } from 'vitest';
import { DEFAULT_BAND } from './lock.ts';
import { lockLacks, scoreFrame, scoreResolver } from './score-frame.ts';
import { compileSection } from './section-play.ts';
import { sectionAsCells, sectionTextOf, swingText } from './section-text.ts';

/** A preset's first `count` bars as the band composes them at entropy 0.3, seed 1, in its meter or the one asked for. */
function bars(name: string, count: number, meter?: MeterName): BandBar[] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  return Array.from({ length: count }, (_, bar) => {
    const made = band.advance(
      {
        seed: 1,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        swing: presetSwing(preset)!,
        ...(meter && { meter: METERS[meter] }),
        offer: null,
      },
      carried,
      null,
    );
    carried = made.carried;
    return made.output;
  });
}

/** Where a score's frame parts from the bars it was written from: one line each, none where it is theirs. */
function parted(section: readonly BandBar[]): string[] {
  const text = sectionTextOf(sectionAsCells(section, { tempo: 'first' }));
  const resolve = resolveBand(text, scoreResolver([]));
  const frame = scoreFrame(text, compileSection(text, resolve), section.length, resolve);
  if (!frame) return ['no frame'];
  const [first] = section;
  const swing = swingText(first!.meter, first!.swing) === '' ? STRAIGHT : first!.swing;
  return [
    ...(sameMeter(frame.meter, first!.meter) ? [] : [`meter ${JSON.stringify(frame.meter)}`]),
    ...(frame.swing.level === swing.level && frame.swing.share === swing.share
      ? []
      : [`swing ${JSON.stringify(frame.swing)} for ${JSON.stringify(swing)}`]),
    ...(Math.abs(frame.bpm - first!.style.bpm) < 1e-9 ? [] : [`bpm ${frame.bpm}`]),
    ...(frame.key.tonic === first!.plan.key.tonic && frame.key.mode === first!.plan.key.mode
      ? []
      : [`key ${JSON.stringify(frame.key)}`]),
    ...section.flatMap((b, k) =>
      Math.abs(frame.styles[k]!.artic - b.style.artic) < 1e-3 &&
      Math.abs(frame.styles[k]!.sync - b.style.sync) < 1e-3
        ? []
        : [`bar ${k} style ${JSON.stringify(frame.styles[k])}`],
    ),
  ];
}

describe('what a score states, read from the score alone (#553 rung 3)', () => {
  it.each(PRESETS.map((p) => p.name))(
    "reads %s's meter, swing, tempo, key and each bar's style as the band composed them, in two sections",
    (name) => {
      const composed = bars(name, 2 * SECTION_BARS);
      for (let from = 0; from < composed.length; from += SECTION_BARS)
        expect(parted(composed.slice(from, from + SECTION_BARS)), `${name} ${from}`).toEqual([]);
    },
  );

  it.each(Object.keys(METERS) as MeterName[])('reads a section of Funk in %s', (meter) => {
    expect(parted(bars('Funk', SECTION_BARS, meter))).toEqual([]);
  });

  it('reads no frame from a score that states no key, or a key of another fragment', () => {
    const text = sectionTextOf(sectionAsCells(bars('Funk', SECTION_BARS)));
    const frameOf = (t: string) => scoreFrame(t, compileSection(t), SECTION_BARS);
    expect(frameOf(text)).not.toBeNull();
    // (shown firing: the key's line gone, or taken from the major scale alone, gives no key to read)
    expect(frameOf(text.replace(/^&key from diatonic.*$/m, '&key scale(dorian, D)'))).toBeNull();
    expect(frameOf(text.replace(/^&bar from meter.*$/m, ''))).toBeNull();
  });

  it('reads a fragment the session sent by its hash, and names each locked one neither it nor the seed holds', () => {
    const riff = { id: 'muse_riff_1', hash: 'e2:00000000000000a1', text: '&muse_riff_1 0 2 4 2' };
    const resolve = scoreResolver([riff]);
    expect(resolve('muse_riff_1', riff.hash)).toBe(riff.text);
    expect(resolve('muse_riff_1', 'e2:00000000000000b2')).toBeNull();
    expect(resolve('band', undefined)).not.toBeNull();
    const seed = { id: 'band', hash: DEFAULT_BAND.hash };
    expect(lockLacks([seed, { id: riff.id, hash: riff.hash }], [riff])).toEqual([]);
    expect(lockLacks([seed, { id: riff.id, hash: riff.hash }], [])).toEqual([
      { id: riff.id, hash: riff.hash },
    ]);
    // A seed at another hash than this pin's is lacked, as a client whose pin lacks the host's seed says.
    expect(lockLacks([{ id: 'band', hash: 'e2:0000000000000000' }], [])).toHaveLength(1);
  });
});
