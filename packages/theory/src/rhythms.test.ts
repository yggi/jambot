import { describe, expect, it } from 'vitest';
import { even, isEven } from './even.ts';
import { positions } from './helix.ts';
import { RHYTHMS, parseRhythm } from './rhythms.ts';

describe('named rhythms', () => {
  it('take the even ones from the primitive', () => {
    expect(RHYTHMS['tresillo']!.helix).toEqual(even(3, 8));
    expect(RHYTHMS['cinquillo']!.helix).toEqual(even(5, 8, 6));
    expect(RHYTHMS['bossa clave']!.helix).toEqual(even(5, 16, 6));
    expect(RHYTHMS['four on the floor']!.helix).toEqual({ cycle: 16, heights: [0, 4, 8, 12] });
    expect(RHYTHMS['backbeat']!.helix).toEqual({ cycle: 16, heights: [4, 12] });
    expect(RHYTHMS['son clave']!.helix).toEqual({ cycle: 16, heights: [0, 3, 6, 10, 12] });
    expect(RHYTHMS['rumba clave']!.helix).toEqual({ cycle: 16, heights: [0, 3, 7, 10, 12] });
    expect(
      Object.entries(RHYTHMS)
        .filter(([, rhythm]) => !isEven(rhythm.helix))
        .map(([name]) => name),
    ).toEqual(['son clave', 'rumba clave']);
  });

  it('play the bossa from its downbeat, though its degree 0 is at step 6', () => {
    expect(positions(RHYTHMS['bossa clave']!.helix)).toEqual([0, 3, 6, 10, 13]);
    expect(positions(RHYTHMS['cinquillo']!.helix)).toEqual([0, 2, 3, 5, 6]);
  });
});

describe('parseRhythm', () => {
  it('reads names and aliases', () => {
    expect(parseRhythm('clave')).toEqual({ cycle: 16, heights: [0, 3, 6, 10, 12] });
    expect(parseRhythm('Son Clave')).toEqual(parseRhythm('clave'));
    expect(parseRhythm('bossa nova')).toEqual(even(5, 16, 6));
    expect(parseRhythm('four-on-the-floor')).toEqual({ cycle: 16, heights: [0, 4, 8, 12] });
  });

  it('reads Euclidean patterns in several forms', () => {
    for (const text of ['E(5,16)', 'e(5, 16)', '(5,16)', 'euclid(5,16)', '5 of 16'])
      expect(parseRhythm(text), text).toEqual({ cycle: 16, heights: [0, 4, 7, 10, 13] });
    expect(parseRhythm('E(3,8,2)')).toEqual(even(3, 8, 2));
    expect(positions(parseRhythm('E(3,8,2)')!)).toEqual([0, 2, 5]);
    expect(parseRhythm('(3,8,-1)')).toEqual(even(3, 8, -1));
  });

  it('rejects what is not a rhythm', () => {
    for (const text of ['', 'samba?', 'E(9,8)', 'E(3,0)', '(3)', 'E(a,b)'])
      expect(parseRhythm(text), text).toBeUndefined();
  });
});
