import {
  DRUMMER,
  DRUM_NOTES,
  DRUM_VOICES,
  EMPTY_LAYER,
  OWN_ROLES,
  PROTOTYPE_PRESETS,
  RHYTHM_REPOSITORY,
  SONG_METER,
  withInstruments,
} from '@jambot/engine';
import { even, positions } from '@jambot/theory';
import { RHYTHM_FRAGMENTS, grooveLines } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { DRUM_WORDS } from '../src/score.ts';
import {
  VOICE_OF_NOTE,
  bandDrums,
  cellsDrums,
  drumsAsCells,
  euclidOf,
  hitsOf,
  levelOf,
  mismatches,
  presetBars,
  report,
  rolesOf,
  velocitiesOf,
  witnesses,
} from './drums-in-cells.ts';
import { wordOf } from '@yggi/cells/repository';

const WITNESSES = witnesses();
if (process.env.E31_REPORT) console.log(WITNESSES.map(report).join('\n\n'));

const of = (preset: string) => WITNESSES.find((w) => w.preset === preset)!;

/**
 * The bar cells' seed drum bars were taken from: each preset's bar 23, the last of its third section, with its fill,
 * which was every preset's witness before #655's song forms. Since then the witness (the first bar with the most roles)
 * is Ambient's bar 9 and Bossa nova's bar 31, so the seeds' claims read bar 23 itself.
 */
const SEED_BAR = 23;
const SEEDED = PROTOTYPE_PRESETS.map((preset) => {
  const bar = presetBars(preset)[SEED_BAR]!;
  return { preset: preset.name, bar, text: drumsAsCells(bar) };
});
/**
 * The presets whose bar 23 is still cells' seed drum bar: each ends a groove at its preset's energy. Since #655's song
 * forms Synth-pop's bar 23 ends a chorus and Techno's a build, which play louder, and Ambient's groove plays two roles
 * where its seed plays four; no bar of the three's first 256 at seeds 0 to 3 is their seed (all 8 before). Since cells
 * v0.30.0 Bossa nova's and Swing jazz's bar 23 ends the first of their song form's solos, the kind `solo`, 0.05 hotter
 * than the `groove` it was, so their drummer plays more and louder there than their seed (5 presets before).
 */
const SEED_HELD = ['Deep house', 'Lo-fi hip hop', 'Funk'];

/** The presets whose seed drums take their euclid's levels from `metric_accent` since cells v0.29.0 (yggi/cells#890). */
const ACCENTED = ['Lo-fi hip hop', 'Funk', 'Bossa nova'];

/** Each drum voice's General MIDI note, as the kit writes it (`VOICE_OF_NOTE` turned round). */
const NOTE_OF_VOICE = new Map([...VOICE_OF_NOTE].map(([note, voice]) => [voice, note]));

/**
 * A one-line drum text at 120 bpm: a line of hits (on 16ths unless `step` says), played on channel 10 by voices with
 * the given attributes, each writing the note it sends (`note=`, as Migrate's rule `notes` writes it: a drum's name
 * gives none since cells v0.22.0, yggi/cells#626).
 */
const line = (hits: string, voices: string, sound = 's=white', step = '16n') =>
  [
    '&bar scan(1 1 1 1) step=120bpm',
    `&groove step=${step} ${hits}`,
    '&drums map=midi(10) [&groove]',
    ...voices.split(' ').map((v) => `&${v} note=${NOTE_OF_VOICE.get(v)} ${sound}`.trimEnd()),
  ].join('\n');

describe("the band's drums as cells text, one bar per preset (E31)", () => {
  it('has a witness for every preset, and between them every role and every sound the drums play', () => {
    expect(WITNESSES.map((w) => w.preset)).toEqual(PROTOTYPE_PRESETS.map((p) => p.name));
    // every role the drummer writes itself: the clave and the ostinato are a fragment's lines (#397, #651)
    expect(new Set(WITNESSES.flatMap((w) => rolesOf(w.bar)))).toEqual(new Set(OWN_ROLES));
    // every sound the drummer strikes itself: the clap is a fragment's (#508)
    expect(new Set(WITNESSES.flatMap((w) => w.band.map((h) => h.note)))).toEqual(
      new Set(Object.values(DRUM_NOTES).filter((n) => n !== DRUM_NOTES.clap)),
    );
    // Every witness plays 4 roles or more but Ambient's, which plays 3: since #655's song forms Ambient's grooves play
    // at its own energy, 0.2, and none of its first 32 bars plays a fourth role (every witness 4 or more before).
    expect(WITNESSES.map((w) => rolesOf(w.bar).length)).toEqual([5, 4, 5, 3, 6, 6, 6, 6]);
  });

  it('compiles every witness with no diagnostics', () => {
    for (const w of WITNESSES) expect(w.diagnostics, w.preset).toEqual([]);
  });

  it("plays every witness's hits as the band plays them: the sound, the step, the length and the velocity (E31)", () => {
    for (const w of WITNESSES) {
      expect(w.band.length, w.preset).toBeGreaterThan(0);
      expect(mismatches(w.band, w.cells), w.preset).toEqual([]);
    }
    // (144 before #655's song forms; 136 before cells v0.30.0, whose jazz song form plays its solos hotter)
    expect(WITNESSES.reduce((n, w) => n + w.cells.length, 0)).toBe(138);
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
      expect(w.text, w.preset).toMatch(/^&euclid role=euclid step=1m &rim\([357],16,\d+\)$/m);
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
    expect(changed(/^(&drums .*)$/m, '$1\n&ghost2 step=16n &sd')).toEqual([]);
  });
});

describe('the forms the translator relies on, over every case', () => {
  it('sends each of the band’s drum sounds as the General MIDI note its voice writes (`note=`), which its name gives none of (cells v0.22.0, yggi/cells#626)', () => {
    for (const [sound, note] of Object.entries(DRUM_NOTES)) {
      const voice = VOICE_OF_NOTE.get(note)!;
      const { hits, diagnostics } = cellsDrums(line(`&${voice} ~!15`, voice), 120);
      expect(diagnostics, sound).toEqual([]);
      expect(
        hits.map((h) => h.note),
        sound,
      ).toEqual([note]);
      // The same note under any name: the note is the voice's, not its name's.
      const renamed = [
        '&bar scan(1 1 1 1) step=120bpm',
        '&groove step=16n &drum ~!15',
        '&drums map=midi(10) [&groove]',
        `&drum note=${note} s=white`,
      ].join('\n');
      expect(
        cellsDrums(renamed, 120).hits.map((h) => h.note),
        sound,
      ).toEqual([note]);
      // A voice named as General MIDI's that writes no note takes the next free note from 36: its name gives none, and
      // since cells v0.29.0 no warning says what it once gave (yggi/cells#643).
      const unnoted = line(`&${voice} ~!15`, voice).replace(/ note=\d+/, '');
      const read = cellsDrums(unnoted, 120);
      expect(read.diagnostics, sound).toEqual([]);
      expect(
        read.hits.map((h) => h.note),
        sound,
      ).toEqual([36]);
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
      '&bd note=36 s=white',
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
    expect(w.cells).toHaveLength(15); // (12 before #655's song forms: its bar 23 ends a chorus since)
    for (const sound of ['gain=1', 'oneshot=1', '']) {
      // (each voice's line, which the kit gives it, stripped of its sound and keeping its note, `note=`)
      const text = w.text.replace(/^&(\w+) (note=\d+) s=.*$/gm, (_, voice: string, note: string) =>
        sound ? `&${voice} ${note} ${sound}` : `&${voice} ${note}`,
      );
      expect(text).not.toBe(w.text);
      const { hits, diagnostics } = cellsDrums(text, w.bar.style.bpm);
      expect(hits, sound).toEqual([]);
      expect(diagnostics.join(), sound).toMatch(/has no voice/);
    }
    for (const sound of ['gain=1', 'oneshot=1', ''])
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
    // (the euclid's since #749 its written metric accent's as well as the licence's: Lo-fi hip hop's 5 velocities before)
    expect(lines).toEqual([
      { at: 'Lo-fi hip hop euclid', hits: 5, velocities: 4 },
      { at: 'Funk euclid', hits: 7, velocities: 5 },
      { at: 'Bossa nova euclid', hits: 5, velocities: 4 },
      { at: 'Swing jazz ghost', hits: 2, velocities: 2 },
      { at: 'Swing jazz pedal', hits: 2, velocities: 2 },
    ]);
  });
});

describe('E31’s translation as the engine states a groove the Muse files (#401)', () => {
  it('states bar 23 as cells’ seed drum bar for its preset, character for character, less the bar line and its card, each with the kit it strikes, where it ends a groove: 3 presets of 8', () => {
    const seedOf = (preset: string) =>
      // (the seed's lines: a groove is a template since cells v0.24.0, its drums `gm_kit`'s by default, #634)
      withInstruments(
        grooveLines(RHYTHM_FRAGMENTS.find((f) => f.id === wordOf(`${preset} drums`))!.text),
      );
    const stated = (w: (typeof SEEDED)[number]) => w.text.split('\n').slice(2).join('\n');
    // (since cells v0.29.0 the Lo-fi hip hop, Funk and Bossa nova drums take their euclid's levels from `metric_accent`,
    // the owner's choice, yggi/cells#890: their bars hold word for word but that line, E31's velocities in the band's)
    const accent = /^&euclidLevel .*$/m;
    const unaccented = (text: string) => text.replace(accent, '&euclidLevel');
    for (const w of SEEDED.filter((w) => SEED_HELD.includes(w.preset))) {
      expect(unaccented(stated(w)), w.preset).toBe(unaccented(seedOf(w.preset)));
      expect(stated(w) === seedOf(w.preset), w.preset).toBe(!ACCENTED.includes(w.preset));
    }
    // (all 8 before #655's song forms)
    expect(
      SEEDED.filter((w) => unaccented(stated(w)) === unaccented(seedOf(w.preset))).map(
        (w) => w.preset,
      ),
    ).toEqual(SEED_HELD);
  });

  it('files bar 23 as the seed fragment it is where it is one, word for word: identity adds to it, a use at the point, and files nothing new; the others file a groove of their own', () => {
    for (const w of SEEDED) {
      const filed = RHYTHM_REPOSITORY.file!(EMPTY_LAYER, {
        hits: bandDrums(w.bar).map((n) => ({
          role: n.role!,
          note: n.note,
          step: n.step,
          velocity: n.velocity,
        })),
        bench: { meter: SONG_METER },
        point: { sync: 0.5, harm: 0.5, artic: 0.5, energy: 0.5 },
        source: DRUMMER,
        created: 'song 0',
        tags: ['groove'],
      });
      // (every preset's held as its seed before #655's song forms; since cells v0.29.0 the three whose seed takes its
      // euclid's levels from `metric_accent` file the band's bar, E31's velocities, as a groove of its own, yggi/cells#890)
      expect([filed.held, filed.id, filed.layer.filed.length], w.preset).toEqual(
        SEED_HELD.includes(w.preset) && !ACCENTED.includes(w.preset)
          ? [true, wordOf(`${w.preset} drums`), 0]
          : [false, 'drummer song 0', 1],
      );
    }
  });

  it('voices each sound as the score’s words do, and the snare as cells’ `sd`', () => {
    for (const [sound, word] of Object.entries(DRUM_WORDS))
      expect(DRUM_VOICES[sound as keyof typeof DRUM_WORDS]).toBe(word);
    expect(DRUM_VOICES.snare).toBe('sd');
  });
});
