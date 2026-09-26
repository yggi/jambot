import { describe, expect, it } from 'vitest';
import { even, isMaximallyEven } from './even.ts';
import { RHYTHMS, parseRhythm } from './rhythms.ts';

describe('named rhythms', () => {
  it('take the even ones from the primitive', () => {
    expect(RHYTHMS['tresillo']).toMatchObject({ steps: 8, onsets: even(3, 8) });
    expect(RHYTHMS['cinquillo']).toMatchObject({ steps: 8, onsets: even(5, 8, 6) });
    expect(RHYTHMS['bossa clave']).toMatchObject({ steps: 16, onsets: even(5, 16, 6) });
    expect(RHYTHMS['four on the floor']).toMatchObject({ steps: 16, onsets: [0, 4, 8, 12] });
    expect(RHYTHMS['backbeat']).toMatchObject({ steps: 16, onsets: [4, 12] });
    expect(RHYTHMS['son clave']).toMatchObject({ steps: 16, onsets: [0, 3, 6, 10, 12] });
    expect(RHYTHMS['rumba clave']).toMatchObject({ steps: 16, onsets: [0, 3, 7, 10, 12] });
    for (const [name, rhythm] of Object.entries(RHYTHMS))
      expect(isMaximallyEven(rhythm.onsets, rhythm.steps), name).toBe(rhythm.even);
  });
});

describe('parseRhythm', () => {
  it('reads names and aliases', () => {
    expect(parseRhythm('clave')).toEqual({ steps: 16, onsets: [0, 3, 6, 10, 12] });
    expect(parseRhythm('Son Clave')).toEqual(parseRhythm('clave'));
    expect(parseRhythm('bossa nova')).toEqual({ steps: 16, onsets: even(5, 16, 6) });
    expect(parseRhythm('four-on-the-floor')).toEqual({ steps: 16, onsets: [0, 4, 8, 12] });
  });

  it('reads Euclidean patterns in several forms', () => {
    for (const text of ['E(5,16)', 'e(5, 16)', '(5,16)', 'euclid(5,16)', '5 of 16'])
      expect(parseRhythm(text), text).toEqual({ steps: 16, onsets: [0, 4, 7, 10, 13] });
    expect(parseRhythm('E(3,8,2)')).toEqual({ steps: 8, onsets: [0, 2, 5] });
    expect(parseRhythm('(3,8,-1)')).toEqual({ steps: 8, onsets: even(3, 8, -1) });
  });

  it('rejects what is not a rhythm', () => {
    for (const text of ['', 'samba?', 'E(9,8)', 'E(3,0)', '(3)', 'E(a,b)'])
      expect(parseRhythm(text), text).toBeUndefined();
  });
});
