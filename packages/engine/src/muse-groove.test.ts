import { METERS, type Meter, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { CLAVES_NOTE, DRUM_NOTES, type DrumSound } from './drums.ts';
import { DRUM_ROLES, SONG_METER, clockOf } from './events.ts';
import type { HeardNote } from './muse.ts';
import {
  DRUM_VOICES,
  GROOVE_FEWEST,
  VOICE_OF_NOTE,
  distilledGroove,
  euclidOf,
  grooveText,
  heardDrums,
  levelOf,
  roleOfSound,
} from './muse-groove.ts';
import type { FragmentHit } from './rhythm-query.ts';
import { cellsFit, readRhythm } from './rhythms.ts';

const hit = (role: string, step: number, note: number, velocity = 100): FragmentHit => ({
  role,
  note,
  step,
  velocity,
});
const inOrder = (hits: readonly FragmentHit[]) =>
  [...hits].sort((a, b) => a.step - b.step || a.note - b.note);
/** A meter played straight, as the repository's bench for a meter asked for. */
const bench = (meter: Meter) =>
  `&bar meter("${Object.entries(METERS).find(([, m]) => m === meter)![0]}") step=120bpm`;

describe('a groove stated as cells text, open on its meter (#401, E31’s translation)', () => {
  it('reads back every velocity from 1 to 127 as it was stated: (v/127)² to six decimals, struck at 127·√level', () => {
    const velocities = Array.from({ length: 127 }, (_, i) => i + 1);
    for (let from = 0; from < velocities.length; from += 16) {
      const hits = velocities
        .slice(from, from + 16)
        .map((v, step) => hit('hat', step, DRUM_NOTES.closedHat, v));
      expect(readRhythm(grooveText(hits, 16), SONG_METER)!.hits).toEqual(hits);
    }
    expect([levelOf(127), levelOf(64), levelOf(1)]).toEqual(['1', '.253953', '.000062']);
  });

  it('reads back every sound of the kit in every role, on every step, in a bar of each meter, and fits its meter alone', () => {
    const fit = cellsFit();
    const sounds = Object.keys(DRUM_NOTES) as DrumSound[];
    const roles = DRUM_ROLES.filter((role) => role !== 'clave');
    for (const meter of Object.values(METERS)) {
      const steps = stepsOf(meter);
      const hits = Array.from({ length: steps }, (_, step) =>
        hit(
          roles[step % roles.length]!,
          step,
          DRUM_NOTES[sounds[step % sounds.length]!],
          40 + step,
        ),
      );
      const text = grooveText(hits, steps);
      expect(text).not.toMatch(/&bar/);
      expect(readRhythm(text, meter)!.hits, String(steps)).toEqual(inOrder(hits));
      for (const other of Object.values(METERS))
        expect(fit(text, bench(other)), `${steps} on ${stepsOf(other)}`).toBe(
          stepsOf(other) % steps === 0,
        );
    }
  });

  it('writes the rim as one Euclid token on `1m` where one sound plays a Euclid, and as a braid where it doesn’t', () => {
    const steps = stepsOf(METERS['5/4']);
    const e = [3, 7, 11, 15, 19];
    expect(euclidOf(e, steps)).toEqual({ k: 5, r: 3 });
    const rim = e.map((step) => hit('euclid', step, DRUM_NOTES.rim, 80));
    const text = grooveText(rim, steps);
    expect(text).toMatch(/^&euclid step=1m &rim\(5,20,3\)$/m);
    expect(readRhythm(text, METERS['5/4'])!.hits).toEqual(rim);
    const off = [...rim.slice(1), hit('euclid', 0, DRUM_NOTES.rim, 80)];
    expect(grooveText(off, steps)).toMatch(/^&euclid step=16n &rim:0:/m);
    expect(readRhythm(grooveText(off, steps), METERS['5/4'])!.hits).toEqual(inOrder(off));
  });

  it('voices every sound of the kit and the claves, and refuses a note outside them', () => {
    expect(VOICE_OF_NOTE.size).toBe(Object.keys(DRUM_NOTES).length + 1);
    expect(new Set(Object.values(DRUM_VOICES)).size).toBe(Object.keys(DRUM_NOTES).length);
    expect(() => grooveText([hit('hat', 0, 49)], 16)).toThrow(/note 49/);
  });

  it('states a clave line on the claves, which cells sends as 75 and reads back so (cells v0.7.0)', () => {
    const clave = [0, 6, 12].map((step) => hit('clave', step, CLAVES_NOTE, 90));
    const text = grooveText([hit('kick', 0, DRUM_NOTES.kick, 100), ...clave], 16);
    expect(text).toMatch(/^&clave step=16n &claves:0:/m);
    expect(readRhythm(text, METERS['4/4'])!.hits.filter((h) => h.role === 'clave')).toEqual(clave);
  });
});

describe('a section distilled into its recurring bar (#401)', () => {
  const groove = [0, 4, 8, 12].map((step) => hit('kick', step, DRUM_NOTES.kick));
  const fill = [...groove, hit('fill', 14, DRUM_NOTES.snare), hit('fill', 15, DRUM_NOTES.snare)];
  const louder = groove.map((h) => ({ ...h, velocity: 120 }));

  it('takes the pattern most bars play, as the first that plays it, its velocities aside', () => {
    expect(distilledGroove([louder, fill, groove, groove, fill])).toEqual(louder);
    expect(distilledGroove([fill, groove, fill, groove, groove])).toEqual(groove);
  });

  it('takes the earliest of patterns played as often, so a section whose every bar differs files its first', () => {
    expect(distilledGroove([fill, groove])).toEqual(fill);
    expect(distilledGroove([groove, fill, fill, groove])).toEqual(groove);
  });

  it(`files no bar of fewer than ${GROOVE_FEWEST} hits, and nothing where none has as many`, () => {
    const two = groove.slice(0, 2);
    expect(distilledGroove([two, two, groove])).toEqual(groove);
    expect(distilledGroove([two, two])).toBeNull();
    expect(distilledGroove([])).toBeNull();
  });
});

describe('a player’s drums as the Muse hears them (#401)', () => {
  const clock = clockOf([{ bar: 0, meter: SONG_METER }]);
  const note = (n: number, position: number, velocity = 90, source = 'Ada'): HeardNote => ({
    note: n,
    velocity,
    source,
    position,
    end: null,
  });

  it('puts each hit on the step her nearest reading rounds it to, in its bar, on its role', () => {
    const heard = [
      note(DRUM_NOTES.kick, 16.3),
      note(DRUM_NOTES.snare, 19.6),
      note(DRUM_NOTES.snare, 22.8, 40),
      note(DRUM_NOTES.closedHat, 17.5),
      note(DRUM_NOTES.kick, 31.6),
      note(DRUM_NOTES.kick, 15.4),
    ];
    expect(heardDrums(heard, 1, SONG_METER, clock)).toEqual([
      {
        source: 'Ada',
        bar: 1,
        hits: [
          hit('kick', 0, DRUM_NOTES.kick, 90),
          hit('hat', 2, DRUM_NOTES.closedHat, 90),
          hit('backbeat', 4, DRUM_NOTES.snare, 90),
          hit('ghost', 7, DRUM_NOTES.snare, 40),
        ],
      },
    ]);
  });

  it('keeps the loudest of two strikes of one sound on one step, leaves out a note outside the kit, and keeps sources apart', () => {
    const heard = [
      note(DRUM_NOTES.kick, 0.1, 50),
      note(DRUM_NOTES.kick, -0.2, 70),
      note(49, 4),
      note(DRUM_NOTES.kick, 8, 60, 'Bo'),
      note(49, 2, 100, 'Cy'),
    ];
    expect(heardDrums(heard, 0, SONG_METER, clock)).toEqual([
      { source: 'Ada', bar: 0, hits: [hit('kick', 0, DRUM_NOTES.kick, 70)] },
      { source: 'Bo', bar: 0, hits: [hit('kick', 8, DRUM_NOTES.kick, 60)] },
    ]);
  });

  it('gives each sound of the kit its role in every meter: the snare and the clap the backbeat on a backbeat pulse, else a ghost', () => {
    const others: Record<DrumSound, string | null> = {
      kick: 'kick',
      rim: 'euclid',
      snare: null,
      clap: null,
      closedHat: 'hat',
      pedalHat: 'pedal',
      openHat: 'hat',
      ride: 'hat',
    };
    const backbeats: Record<string, readonly number[]> = {
      '3/4': [4, 8],
      '4/4': [4, 12],
      '5/4': [4, 12],
      '5/8': [6],
      '6/8': [6],
      '7/8': [6, 10],
      '9/8': [6, 12],
      '10/8': [6, 16],
      '12/8': [6, 18],
    };
    for (const [name, meter] of Object.entries(METERS))
      for (let step = 0; step < stepsOf(meter); step++) {
        for (const sound of Object.keys(DRUM_NOTES) as DrumSound[])
          expect(roleOfSound(DRUM_NOTES[sound], step, meter), `${name} ${sound} ${step}`).toBe(
            others[sound] ?? (backbeats[name]!.includes(step) ? 'backbeat' : 'ghost'),
          );
        expect(roleOfSound(49, step, meter)).toBeNull();
      }
  });
});
