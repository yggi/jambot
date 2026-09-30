import { describe, expect, it } from 'vitest';
import { type BandBar, type BandCarried, band } from './band.ts';
import type { KeyWish } from './key.ts';
import recorded from './identity.fixture.json';
import {
  IDENTITY_BARS,
  IDENTITY_RUNS,
  IDENTITY_SEEDS,
  firstDifference,
  hashOf,
  identityHashes,
  runKey,
} from './identity.ts';
import { PRESETS } from './style.ts';

/** One real bar of the band: bar 5 of seed 1, whose written notes and dough there are plenty of. */
function aBar() {
  let carried: BandCarried = band.initial;
  let output: BandBar | undefined;
  const preset = PRESETS[0]!;
  for (let bar = 0; bar <= 5; bar++) {
    const result = band.advance(
      {
        seed: 1,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: preset.mode, melodic: null } as KeyWish,
        offer: null,
      },
      carried,
      null,
    );
    carried = result.carried;
    output = result.output;
  }
  return output!;
}

describe('the identity of the band’s bars', () => {
  it('is what the band writes and plays over every preset held and the tour, bar for bar', () => {
    expect(firstDifference(identityHashes(), recorded.hashes)).toBeNull();
  });

  it('is recorded for every seed and run, 8 hex digits a bar (finite: every run)', () => {
    expect(recorded.seeds).toBe(IDENTITY_SEEDS);
    expect(recorded.bars).toBe(IDENTITY_BARS);
    expect(Object.keys(recorded.hashes)).toHaveLength(IDENTITY_SEEDS * IDENTITY_RUNS.length);
    for (let seed = 0; seed < IDENTITY_SEEDS; seed++)
      for (const run of IDENTITY_RUNS) {
        const line = (recorded.hashes as Record<string, string>)[runKey(seed, run.name)]!;
        expect(line).toMatch(new RegExp(`^[0-9a-f]{${8 * IDENTITY_BARS}}$`));
      }
  });

  it('has bars that are not all the same, or it would hold nothing', () => {
    const line = (recorded.hashes as Record<string, string>)[runKey(0, 'tour')]!;
    const bars = Array.from({ length: IDENTITY_BARS }, (_, i) => line.slice(i * 8, i * 8 + 8));
    expect(new Set(bars).size).toBeGreaterThan(IDENTITY_BARS / 2);
  });

  describe('fires', () => {
    const bar = aBar();

    it('on a moved onset: one written note a step later', () => {
      const i = bar.written.findIndex((n) => n.part === 'bass');
      const moved = bar.written.map((n, k) => (k === i ? { ...n, step: n.step + 1 } : n));
      expect(i).toBeGreaterThanOrEqual(0);
      expect(hashOf({ ...bar, written: moved })).not.toBe(hashOf(bar));
    });

    it('on another role, a velocity one louder and a note a step longer', () => {
      const i = bar.dough.findIndex((n) => n.part === 'drums');
      expect(i).toBeGreaterThanOrEqual(0);
      const changed = (change: object) =>
        hashOf({ ...bar, dough: bar.dough.map((n, k) => (k === i ? { ...n, ...change } : n)) });
      const note = bar.dough[i]!;
      expect(changed({ velocity: note.velocity + 1 })).not.toBe(hashOf(bar));
      expect(changed({ length: note.length + 1 })).not.toBe(hashOf(bar));
    });

    it('on a bar dropped or added', () => {
      expect(hashOf({ ...bar, written: bar.written.slice(1) })).not.toBe(hashOf(bar));
      expect(hashOf({ ...bar, written: [...bar.written, bar.written[0]!] })).not.toBe(hashOf(bar));
    });

    it('and says where: the run and the first bar that differs', () => {
      const line = (recorded.hashes as Record<string, string>)['2:Techno']!;
      const flipped =
        line.slice(0, 8 * 17) + (line[8 * 17] === '0' ? '1' : '0') + line.slice(8 * 17 + 1);
      expect(firstDifference({ '2:Techno': flipped }, { '2:Techno': line })).toBe(
        '2:Techno differs from bar 17',
      );
      expect(firstDifference({ a: 'x' }, { a: 'x', b: 'y' })).toBe('b is not run');
      expect(firstDifference({ a: 'x', b: 'y' }, { a: 'x' })).toBe('b is not recorded');
      expect(firstDifference({ a: 'x' }, { a: 'x' })).toBeNull();
    });
  });

  it('gives every bar the song’s meter, 4/4, and the band’s output the steps of it', () => {
    const bar = aBar();
    expect(bar.meter.cycle).toBe(8);
    expect(bar.written.every((n) => n.step >= 0 && n.step < 16)).toBe(true);
  });
});
