import { CHORD_QUALITIES } from '@jambot/theory';
import { QUALITY_STACKS } from '@yggi/cells/engine/reading/chords';
import { describe, expect, it } from 'vitest';
import { chordOf } from './chord-reading.ts';

describe('reading chords from notes: cells’ reader on Jambot’s chords', () => {
  it('reads by the theory’s qualities, in their order, but the harmonic series: what the comp plays and the Muse hears', () => {
    const theory = Object.entries(CHORD_QUALITIES)
      .filter(([name]) => name !== 'harmonics')
      .map(([name, { stack }]) => [name, stack]);
    expect(Object.entries(QUALITY_STACKS)).toEqual(theory);
  });

  it('reads every quality the theory names, on every root, back as itself (finite: every quality, every root)', () => {
    for (const [quality, { stack }] of Object.entries(CHORD_QUALITIES)) {
      if (quality === 'harmonics') continue;
      for (let root = 0; root < 12; root++) {
        const pcs = new Set(stack.map((x) => (root + x) % 12));
        expect([quality, root, chordOf(pcs, root)]).toEqual([quality, root, { root, quality }]);
      }
    }
  });
});
