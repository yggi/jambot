import { describe, expect, it } from 'vitest';
import type { BarEnv } from './bar.ts';
import { CLAVES_NOTE, DRUM_NOTES } from './drums.ts';
import { type DrumRole, SONG_METER, type WrittenNote } from './events.ts';
import { grooveBar } from './groove.ts';
import { INITIAL_KEY } from './key.ts';
import type { FragmentHit } from './rhythm-query.ts';
import { INITIAL_STYLE } from './style.ts';
import { STRAIGHT } from './swing.ts';
import { buildTheme } from './themes.ts';

const ENV: BarEnv = {
  seed: 1,
  bar: 8,
  meter: SONG_METER,
  plan: {
    section: { type: 'groove', index: 1 },
    meter: SONG_METER,
    swing: '16n',
    key: INITIAL_KEY,
    melodic: 'plain',
    theme: buildTheme({
      seed: 1,
      index: 1,
      kind: 'A',
      key: INITIAL_KEY,
      harm: 0.5,
      entropy: 0,
      a: null,
    }),
  },
  barInSection: 0,
  style: INITIAL_STYLE,
  swing: STRAIGHT,
  barEnergy: 0.6,
  chords: [],
  next: [],
  offer: null,
};

const own = (role: DrumRole, step: number, note: number = DRUM_NOTES.kick): WrittenNote => ({
  part: 'drums',
  role,
  step,
  note,
  length: 1,
});
const frag = (
  role: string,
  step: number,
  velocity = 90,
  note: number = DRUM_NOTES.kick,
): FragmentHit => ({
  role,
  note,
  step,
  velocity,
});
const read = (notes: readonly WrittenNote[]) => notes.map((n) => `${n.role}${n.step}:${n.note}`);

describe('the drummer plays from the composer’s rhythm, `groove` as the owner ruled on E36 (#397)', () => {
  it('plays its own bar as it is where no fragment gives it hits', () => {
    const bar = [own('kick', 0), own('hat', 2, DRUM_NOTES.closedHat)];
    expect(grooveBar(ENV, bar, [])).toEqual(bar);
  });

  it('keeps its count of each role: the fragment’s hits first, the loudest first, its own on other steps making up the rest', () => {
    const bar = [own('kick', 0), own('kick', 6), own('kick', 12)];
    // The fragment holds two kicks for the drummer's three: both, then the drummer's loudest other, the downbeat's.
    expect(read(grooveBar(ENV, bar, [frag('kick', 4, 100), frag('kick', 10, 80)]))).toEqual([
      'kick0:36',
      'kick4:36',
      'kick10:36',
    ]);
    // It holds four for the drummer's three: its three loudest.
    expect(
      read(
        grooveBar(ENV, bar, [
          frag('kick', 2, 50),
          frag('kick', 4, 100),
          frag('kick', 10, 80),
          frag('kick', 14, 90),
        ]),
      ),
    ).toEqual(['kick4:36', 'kick10:36', 'kick14:36']);
  });

  it('plays a role the fragment lacks as its own, and nothing of a line for a role it doesn’t play in the bar', () => {
    const bar = [own('kick', 0), own('hat', 2, DRUM_NOTES.closedHat)];
    expect(
      read(grooveBar(ENV, bar, [frag('kick', 8), frag('ghost', 7, 40, DRUM_NOTES.snare)])),
    ).toEqual(['hat2:42', 'kick8:36']);
  });

  it('keeps its own fill, and leaves the fragment’s out', () => {
    const bar = [
      own('backbeat', 4, DRUM_NOTES.snare),
      own('fill', 14, DRUM_NOTES.snare),
      own('fill', 15, DRUM_NOTES.snare),
    ];
    expect(
      read(
        grooveBar(ENV, bar, [
          frag('backbeat', 12, 100, DRUM_NOTES.snare),
          frag('fill', 13, 60, DRUM_NOTES.snare),
        ]),
      ),
    ).toEqual(['backbeat12:38', 'fill14:38', 'fill15:38']);
  });

  it('plays a clave as a line of its own, the weakest: the rim wins a step they share', () => {
    const bar = [own('kick', 0), own('euclid', 3, DRUM_NOTES.rim)];
    const played = grooveBar(ENV, bar, [
      frag('kick', 0),
      frag('euclid', 3, 70, DRUM_NOTES.rim),
      frag('clave', 3, 90, DRUM_NOTES.rim),
      frag('clave', 6, 90, DRUM_NOTES.rim),
    ]);
    expect(read(played)).toEqual(['kick0:36', 'euclid3:37', 'clave6:37']);
    // With no rim in the bar, the clave plays on every step it strikes.
    expect(read(grooveBar(ENV, [own('kick', 0)], [frag('clave', 3, 90, DRUM_NOTES.rim)]))).toEqual([
      'kick0:36',
      'clave3:37',
    ]);
  });

  it('plays a clave on its own sound, the claves (cells#179), beside the rim on a step they share', () => {
    const bar = [own('kick', 0), own('euclid', 3, DRUM_NOTES.rim)];
    const played = grooveBar(ENV, bar, [
      frag('clave', 3, 90, CLAVES_NOTE),
      frag('clave', 6, 90, CLAVES_NOTE),
    ]);
    expect(read(played)).toEqual(['kick0:36', 'euclid3:37', 'clave3:75', 'clave6:75']);
  });

  it('writes each hit as the drummer writes its own, a step long, the velocity left to the performer', () => {
    const [hit] = grooveBar(ENV, [own('kick', 0)], [frag('kick', 4, 17)]);
    expect(hit).toEqual(own('kick', 4));
  });

  it('plays no hit off the bar’s steps', () => {
    expect(
      read(grooveBar(ENV, [own('kick', 0)], [frag('kick', 16), frag('clave', 20, 90, 37)])),
    ).toEqual(['kick0:36']);
  });
});
