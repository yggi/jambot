// @vitest-environment node
import { SCALES } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { CORRECTION_SCALES, pitchClassesOf } from './scales.ts';

describe('the scales a correction snaps to', () => {
  it('names each, major and minor as a player says them, and keeps to the theory’s own scales', () => {
    expect(CORRECTION_SCALES.map((s) => s.name)).toEqual([
      'major',
      'minor',
      'major pentatonic',
      'minor pentatonic',
      'blues',
      'chromatic',
    ]);
    for (const { id } of CORRECTION_SCALES) expect(SCALES[id], id).toBeDefined();
  });

  it('is the theory’s scale moved to the root, for every root and every scale: sorted, from 0 to 11, the root in it', () => {
    for (const { id } of CORRECTION_SCALES)
      for (let root = 0; root < 12; root++) {
        const notes = pitchClassesOf(id, root);
        const heights = SCALES[id]!.helix.heights;
        expect(notes, `${id} ${root}`).toEqual(
          heights.map((h) => (h + root) % 12).sort((a, b) => a - b),
        );
        expect(notes).toContain(root);
        expect(Math.min(...notes)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...notes)).toBeLessThanOrEqual(11);
      }
  });

  it('has the sizes a scale has: seven, seven, five, five, six and twelve', () => {
    expect(CORRECTION_SCALES.map((s) => pitchClassesOf(s.id, 0).length)).toEqual([
      7, 7, 5, 5, 6, 12,
    ]);
  });

  it('reads C major as the white keys, and A minor as the same', () => {
    expect(pitchClassesOf('ionian', 0)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(pitchClassesOf('aeolian', 9)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('refuses a scale it does not know', () => {
    expect(() => pitchClassesOf('no such scale', 0)).toThrow(/no such scale/);
  });
});
