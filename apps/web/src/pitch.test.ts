// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { octaveMute, pitchColour, pitchHue } from './pitch.ts';

describe('the pitch colours: C red round the wheel (cell-studio’s noteColour)', () => {
  it('gives each of the twelve pitch classes its own hue, a twelfth of the wheel apart, C at red', () => {
    const hues = Array.from({ length: 12 }, (_, pc) => pitchHue(pc));
    expect(hues).toEqual([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]);
    for (let pc = -12; pc < 24; pc++) expect(pitchHue(pc)).toBe(hues[((pc % 12) + 12) % 12]);
  });

  it('is full colour in the middle octave, and mutes further off, the same either way', () => {
    expect(octaveMute(0)).toBe(1);
    for (let o = 1; o <= 3; o++) {
      expect(octaveMute(o)).toBeLessThan(octaveMute(o - 1));
      expect(octaveMute(-o)).toBe(octaveMute(o));
    }
  });

  it('is lighter above the middle octave and darker below, from the theme’s own lightness', () => {
    expect(pitchColour(9)).toBe(
      'hsl(270 calc(var(--pitch-s) * 1) clamp(18%, calc(var(--pitch-l) + 0%), 88%))',
    );
    expect(pitchColour(0, 1)).toContain('+ 11%');
    expect(pitchColour(0, -2)).toContain('+ -22%');
    expect(pitchColour(0, 9)).toBe(pitchColour(0, 3));
  });
});
