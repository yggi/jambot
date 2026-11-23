import {
  type BandBar,
  type BandCarried,
  PRESETS,
  SECTION_BARS,
  band,
  presetMode,
  presetSwing,
} from '@jambot/engine';
import { fragmentHash } from '@yggi/cells';
import type { Resolve } from '@yggi/cells';
import { resolveBand, resolveSeed } from '@yggi/cells/library';
import { describe, expect, it } from 'vitest';
import { DEFAULT_BAND, isSeed, scoreLock } from './lock.ts';
import { sectionAsCells, sectionTextOf } from './section-text.ts';

/** A preset's section from `from`, as the band composes it at entropy 0.3, seed 1, stated as the app states it. */
function scoreOf(name: string, from = 0): string {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  const bars: BandBar[] = Array.from({ length: from + SECTION_BARS }, (_, bar) => {
    const made = band.advance(
      {
        seed: 1,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        swing: presetSwing(preset)!,
        offer: null,
      },
      carried,
      null,
    );
    carried = made.carried;
    return made.output;
  }).slice(from);
  return sectionTextOf(sectionAsCells(bars, { tempo: 'first' }));
}

/** A fragment the Muse filed, which no seed library has: a two-bar riff. */
const RIFF = '&muse_riff_1 step=8n 0 2 4 2';
const RIFF_HASH = fragmentHash(RIFF);

/** A score that takes the riff as well, and the resolver that finds it beside the band and the seeds. */
function withRiff(text: string): { text: string; resolve: Resolve } {
  const taking = text.replace(/\n\* from band/, '\n&muse_riff_1 from muse_riff_1\n* from band');
  const band = resolveBand(taking, resolveSeed);
  return {
    text: taking,
    resolve: (id, hash) => (id === 'muse_riff_1' ? RIFF : band(id, hash)),
  };
}

describe("a score's lock (session version 2, #553)", () => {
  it('locks every fragment a section takes from, by its id and hash, and never the band', () => {
    for (const preset of PRESETS) {
      const text = scoreOf(preset.name, SECTION_BARS);
      const { lock, filed } = scoreLock(text);
      expect(text, preset.name).toMatch(/^\* from band/m);
      expect(
        lock.map((l) => l.id),
        preset.name,
      ).not.toContain('band');
      expect(
        lock.map((l) => l.id),
        preset.name,
      ).toEqual(expect.arrayContaining(['meter', 'diatonic', 'styles']));
      // Each is the seed's at this pin, so none is sent.
      for (const l of lock) expect(isSeed(l), `${preset.name}: ${l.id}`).toBe(true);
      expect(filed, preset.name).toEqual([]);
    }
  });

  it('carries the text of a fragment not in the seed library, once, and of no seed', () => {
    const { text, resolve } = withRiff(scoreOf('Funk'));
    const { lock, filed } = scoreLock(text, resolve);
    expect(lock).toContainEqual({ id: 'muse_riff_1', hash: RIFF_HASH });
    expect(lock.map((l) => l.id)).not.toContain('band');
    expect(filed).toEqual([{ id: 'muse_riff_1', hash: RIFF_HASH, text: RIFF }]);
  });

  it('takes a seed whose hash is another version than the pin’s for no seed', () => {
    const diatonic = resolveSeed('diatonic')!;
    expect(isSeed({ id: 'diatonic', hash: fragmentHash(diatonic) })).toBe(true);
    expect(isSeed({ id: 'diatonic', hash: 'e2:0000000000000000' })).toBe(false);
    expect(isSeed({ id: 'muse_riff_1', hash: RIFF_HASH })).toBe(false);
  });

  it('locks nothing for a score that states no bars', () => {
    expect(scoreLock('')).toEqual({ lock: [], filed: [] });
  });

  it('names the seed library’s band as the default, which no lock names', () => {
    expect(DEFAULT_BAND).toEqual({ id: 'band', hash: fragmentHash(resolveSeed('band')!) });
    expect(DEFAULT_BAND.hash).toMatch(/^e2:[0-9a-f]{16}$/);
  });
});
