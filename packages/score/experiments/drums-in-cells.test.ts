import { DRUM_NOTES, DRUM_ROLES, PRESETS } from '@jambot/engine';
import { even, positions } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  VOICE_OF_NOTE,
  cellsDrums,
  euclidOf,
  hitsOf,
  levelOf,
  mismatches,
  report,
  rolesOf,
  velocitiesOf,
  witnesses,
} from './drums-in-cells.ts';

const WITNESSES = witnesses();
if (process.env.E31_REPORT) console.log(WITNESSES.map(report).join('\n\n'));

const of = (preset: string) => WITNESSES.find((w) => w.preset === preset)!;

/** A one-line drum text at 120 bpm: a line of hits (on 16ths unless `step` says), played on channel 10 by voices with the given attributes. */
const line = (hits: string, voices: string, sound = 's=white', step = '16n') =>
  [
    '&bar scan(1 1 1 1) step=120bpm',
    `&groove step=${step} ${hits}`,
    '&drums map=midi(10) [&groove]',
    ...voices.split(' ').map((v) => `&${v} ${sound}`),
  ].join('\n');

describe("the band's drums as cells text, one bar per preset (E31)", () => {
  it('has a witness for every preset, and between them every role and every sound the drums play', () => {
    expect(WITNESSES.map((w) => w.preset)).toEqual(PRESETS.map((p) => p.name));
    // every role the drummer writes itself: the clave is the composer's line (#397)
    expect(new Set(WITNESSES.flatMap((w) => rolesOf(w.bar)))).toEqual(
      new Set(DRUM_ROLES.filter((role) => role !== 'clave')),
    );
    expect(new Set(WITNESSES.flatMap((w) => w.band.map((h) => h.note)))).toEqual(
      new Set(Object.values(DRUM_NOTES)),
    );
    for (const w of WITNESSES) expect(rolesOf(w.bar).length, w.preset).toBeGreaterThanOrEqual(4);
  });

  it('compiles every witness with no diagnostics', () => {
    for (const w of WITNESSES) expect(w.diagnostics, w.preset).toEqual([]);
  });

  it("plays every witness's hits as the band plays them: the sound, the step, the length and the velocity (E31)", () => {
    for (const w of WITNESSES) {
      expect(w.band.length, w.preset).toBeGreaterThan(0);
      expect(mismatches(w.band, w.cells), w.preset).toEqual([]);
    }
    expect(WITNESSES.reduce((n, w) => n + w.cells.length, 0)).toBe(144);
  });

  it("states each role as a line of its own name, which plays that role's hits alone", () => {
    for (const w of WITNESSES)
      for (const { role, mismatches: found } of w.roles)
        expect(found, `${w.preset} ${role}`).toEqual([]);
  });

  it('writes the rim, where the band plays it, as one Euclid token, and its accents as a line of levels', () => {
    const rims = WITNESSES.filter((w) => rolesOf(w.bar).includes('euclid'));
    expect(rims.map((w) => w.preset)).toEqual(['Lo-fi hip hop', 'Funk', 'Bossa nova']);
    for (const w of rims) {
      expect(w.text, w.preset).toMatch(/^&euclid step=1m &rim\([357],16,\d+\)$/m);
      expect(w.text, w.preset).toMatch(/^&euclidLevel map=amp step=16n /m);
    }
  });

  it('finds what it checks: a hit dropped, moved, struck at another level, or a Euclid turned, is a mismatch', () => {
    const w = of('Funk');
    const bpm = w.bar.style.bpm;
    const changed = (from: RegExp, to: string) => {
      const text = w.text.replace(from, to);
      expect(text).not.toBe(w.text);
      return mismatches(w.band, cellsDrums(text, bpm).hits);
    };
    expect(changed(/&hh:0:[.\d]+/, '~')).not.toEqual([]);
    expect(changed(/~ &hh:0:([.\d]+)/, '&hh:0:$1 ~')).not.toEqual([]);
    expect(changed(/&oh:0:[.\d]+/, '&oh:0:.5')).not.toEqual([]);
    expect(changed(/&rim\(7,16,0\)/, '&rim(7,16,1)')).not.toEqual([]);
    expect(changed(/&sd s=white/, '&sd s=white\n&ghost2 step=16n &sd')).toEqual([]);
  });
});

describe('the forms the translator relies on, over every case', () => {
  it('names each of the band’s drum sounds by a word that cells sends as its General MIDI note', () => {
    for (const [sound, note] of Object.entries(DRUM_NOTES)) {
      const voice = VOICE_OF_NOTE.get(note)!;
      const { hits, diagnostics } = cellsDrums(line(`&${voice} ~!15`, voice), 120);
      expect(diagnostics, sound).toEqual([]);
      expect(
        hits.map((h) => h.note),
        sound,
      ).toEqual([note]);
    }
  });

  it('strikes every velocity, 1 to 127, as a hit’s own level and as a line of levels', () => {
    const velocities = Array.from({ length: 127 }, (_, i) => i + 1);
    const own = cellsDrums(
      line(velocities.map((v) => `&bd:0:${levelOf(v)}`).join(' '), 'bd'),
      120,
      127,
    );
    expect(own.diagnostics).toEqual([]);
    expect(own.hits.map((h) => h.velocity)).toEqual(velocities);
    const text = [
      '&bar scan(1 1 1 1) step=120bpm',
      `&groove step=16n ${velocities.map(() => '&bd').join(' ')}`,
      `&levels map=amp step=16n ${velocities.map(levelOf).join(' ')}`,
      '&drums map=midi(10) [&groove * &levels]',
      '&bd s=white',
    ].join('\n');
    const read = cellsDrums(text, 120, 127);
    expect(read.diagnostics).toEqual([]);
    expect(read.hits.map((h) => h.velocity)).toEqual(velocities);
  });

  it('writes every rim the band can play, even(k, 16, shift) for k of 3, 5, 7 and a shift of 0 to 3, as one cells Euclid', () => {
    // cells turns Bjorklund's form right by r; `even`'s rotation differs by an offset per k (music-commons' Euclid contract).
    const found = [3, 5, 7].flatMap((k) =>
      [0, 1, 2, 3].map((shift) => {
        const steps = positions(even(k, 16, shift));
        const euclid = euclidOf(steps)!;
        const played = cellsDrums(
          line(`&rim(${k},16,${euclid.r})`, 'rim', 's=white', '1m'),
          120,
        ).hits;
        expect(played.map((h) => h.step)).toEqual(steps);
        return [k, shift, euclid.r];
      }),
    );
    expect(found).toEqual([
      [3, 0, 6],
      [3, 1, 7],
      [3, 2, 8],
      [3, 3, 9],
      [5, 0, 4],
      [5, 1, 5],
      [5, 2, 6],
      [5, 3, 7],
      [7, 0, 0],
      [7, 1, 1],
      [7, 2, 2],
      [7, 3, 3],
    ]);
  });
});

describe('what cells could not say (E31: the gaps)', () => {
  it('gap 1: a drum voice that is only its MIDI note: a kit member with no sound is no voice, so the text names one the band never plays', () => {
    // The witness: Synth-pop's bar, its voices given no sound, or only a gain or a hit's envelope.
    const w = of('Synth-pop');
    expect(w.cells).toHaveLength(12);
    for (const sound of ['gain=1', 'oneshot', '']) {
      const text = w.text.replaceAll(' s=white', sound ? ` ${sound}` : '');
      const { hits, diagnostics } = cellsDrums(text, w.bar.style.bpm);
      expect(hits, sound).toEqual([]);
      expect(diagnostics.join(), sound).toMatch(/has no voice/);
    }
    for (const sound of ['gain=1', 'oneshot', ''])
      expect(cellsDrums(line('&bd ~!15', 'bd', sound), 120).hits, sound).toEqual([]);
    expect(cellsDrums(line('&bd ~!15', 'bd'), 120).hits).toHaveLength(1);
  });

  it("gap 2: a role's accent left to the player: every line of a role with one accent (ghost, pedal, euclid) plays its hits at more than one velocity, the licence's, so the text states each", () => {
    const lines = WITNESSES.flatMap((w) =>
      (['ghost', 'pedal', 'euclid'] as const)
        .filter((role) => hitsOf(w.bar, role).length >= 2)
        .map((role) => ({
          at: `${w.preset} ${role}`,
          hits: hitsOf(w.bar, role).length,
          velocities: velocitiesOf(w.bar, role),
        })),
    );
    expect(lines).toEqual([
      { at: 'Lo-fi hip hop euclid', hits: 5, velocities: 5 },
      { at: 'Funk euclid', hits: 7, velocities: 5 },
      { at: 'Bossa nova euclid', hits: 5, velocities: 4 },
      { at: 'Swing jazz ghost', hits: 2, velocities: 2 },
      { at: 'Swing jazz pedal', hits: 2, velocities: 2 },
    ]);
  });
});
