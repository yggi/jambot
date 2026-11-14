/**
 * A section as one cells text and played back (`section-text.ts`,
 * `section-play.ts`): what the app's shadow reads beyond E35 (#399). E35's own
 * test holds the builder over its corpus.
 */

import {
  COMPOSER_MODES,
  BASS_REPOSITORY,
  HARMONY_REPOSITORY,
  LEAD_REPOSITORY,
  METER_REPOSITORY,
  RHYTHM_REPOSITORY,
  presetMode,
  type BandBar,
  type BandCarried,
  PRESETS,
  SECTION_BARS,
  LEAD_LEVEL,
  MISS_DISTANCE,
  type MeterSwing,
  STYLE_AXIS_NAMES,
  SWING_LEVELS,
  type WrittenNote,
  band,
  composedLevel,
  leanMap,
  leansOf,
  stepSeconds,
  presetSwing,
} from '@jambot/engine';
import { METERS, type MeterName, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import type { Resolve } from '@yggi/cells/engine/program';
import { bodyOf } from '@yggi/cells/engine/use';
import { references } from '@yggi/cells';
import { resolveSeed } from '@yggi/cells/repository/library';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { describe, expect, it } from 'vitest';
import {
  bandChords,
  compileSection,
  lineOf,
  lineReader,
  mismatches,
  playSection,
  soundOf,
} from './section-play.ts';
import {
  INSTRUMENT_REACH,
  PERFORMER_VOICES,
  bandAt,
  instrumentsAt,
  resolveBand,
  scoreStyle,
} from '@yggi/cells/repository/band';
import {
  BAND_PARTS,
  PIN_VOICES,
  type SectionNote,
  barred,
  hostOf,
  keyLine,
  keyText,
  levelOf,
  meterLine,
  scoreLevel,
  sectionAsCells,
  sectionTextOf,
  swingText,
  writtenNotes,
} from './section-text.ts';

/** A preset's first section, or as many bars as asked, as the band composes it at entropy 0.3, seed 1 or the one asked for, in its meter or the one asked for. */
function section(name: string, meter?: MeterName, seed = 1, bars = SECTION_BARS): BandBar[] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  return Array.from({ length: bars }, (_, bar) => {
    const made = band.advance(
      {
        seed,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        swing: presetSwing(preset)!,
        ...(meter && { meter: METERS[meter] }),
        offer: null,
      },
      carried,
      null,
    );
    carried = made.carried;
    return made.output;
  });
}

/** What the app gives the band to find its parts in: the meters, rhythms, bass lines, leads and harmonies of the repository. */
const FOUND = {
  repository: METER_REPOSITORY,
  rhythms: RHYTHM_REPOSITORY,
  bassLines: BASS_REPOSITORY,
  leads: LEAD_REPOSITORY,
  harmonies: HARMONY_REPOSITORY,
};

/**
 * A preset's first `count` bars as the band composes them at entropy 0.3, by seed, cut into its sections; with `found`,
 * as the app's band composes them, finding its parts in the repository (`FOUND`).
 */
function sections(name: string, seed: number, count: number, found = false): BandBar[][] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  const bars = Array.from({ length: count }, (_, bar) => {
    const made = band.advance(
      {
        seed,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        swing: presetSwing(preset)!,
        offer: null,
        ...(found && FOUND),
      },
      carried,
      null,
    );
    carried = made.carried;
    return made.output;
  });
  return Array.from({ length: count / SECTION_BARS }, (_, i) =>
    bars.slice(i * SECTION_BARS, (i + 1) * SECTION_BARS),
  );
}

/** The bars with a tempo that glides through them, a bpm higher each bar. */
const gliding = (bars: readonly BandBar[]) =>
  bars.map((bar, i) => ({ ...bar, style: { ...bar.style, bpm: bar.style.bpm + i } }));

describe('a section as one cells text, for the app (#399)', () => {
  it('holds one tempo a text, unless asked to state the first bar’s while the bars’ tempos glide', () => {
    const bars = gliding(section('Synth-pop'));
    expect(() => hostOf(bars)).toThrow(/bpm changes at its bar 1/);
    expect(hostOf(bars, { tempo: 'first' }).bpm).toBe(bars[0]!.style.bpm);
    const text = sectionTextOf(sectionAsCells(bars, { tempo: 'first' }));
    expect(text.split('\n')[1]).toBe(`&bar from meter ${bars[0]!.style.bpm}bpm`);
    // The rest of the text is the held tempo's.
    const held = sectionTextOf(sectionAsCells(section('Synth-pop')));
    expect(text.split('\n').slice(1)).toEqual(held.split('\n').slice(1));
  });

  it('offers the band its harmony and its key at its head, so a section whose parts leave the harmony unread says nothing of it (yggi/cells decision 075, #609)', () => {
    // The drums alone, as a section with no bass, pad or stab: nothing of the section's own reads `&harm`.
    const bars = section('Synth-pop').map((bar) => ({
      ...bar,
      written: bar.written.filter((w) => w.part === 'drums'),
    }));
    const text = sectionTextOf(sectionAsCells(bars));
    expect(text.split('\n')[0]).toBe('&harm, &key from');
    expect(text).not.toMatch(/over=&harm/);
    // (compiled without the reading's own lines, which read the harmony: `compileSection`)
    const said = (t: string) =>
      planOf(t, undefined, { resolve: resolveSeed }).result.diagnostics.map((d) => d.message);
    expect(said(text)).toEqual([]);
    // Without the offer, cells says the harmony is silent: a line that steps on a clock, and that nothing plays or reads.
    expect(said(text.split('\n').slice(1).join('\n'))).toEqual([
      expect.stringMatching(/^&harm is written and nothing plays or reads it/),
    ]);
  });

  it('is a score: no performer, voice or card, the parts it plays passed to the band and the rest written as tacets (yggi/cells decision 063, #531)', () => {
    const bars = section('Funk');
    const text = sectionTextOf(sectionAsCells(bars));
    const { result } = compileSection(text);
    expect(result.diagnostics).toEqual([]);
    expect(text).not.toMatch(/_performer|^&\w+V |map=midi|map=sample|^use /m);
    // (Funk's first section plays the drums, the bass and the stab; the pad and the lead rest)
    expect(text.split('\n').slice(-3)).toEqual([
      '&padline part=pad step=1m ~',
      '&leadline part=lead step=1m ~',
      '* from band(drumlines=&drumlines, bassline=&bassline, padline=&padline, stabline=&stabline, leadline=&leadline, bassLevel=&bassLevel, stabLevel=&stabLevel, style=&style)',
    ]);
    for (const part of BAND_PARTS) expect(text).toMatch(new RegExp(`^&${part} `, 'm'));
    // The band, resolved where the score is played, plays each part through its seed performer.
    expect(result.performers.map((p) => [p.name, p.role, p.part])).toEqual([
      ['drumsOut', 'drums', 'drumlines'],
      ['bassOut', 'bass', 'bassline'],
      ['padOut', 'pad', 'padline'],
      ['stabOut', 'stab', 'stabline'],
      ['leadOut', 'lead', 'leadline'],
    ]);
    // A tacet with no clock starts nothing: an error, which is why each is written on `1m`.
    expect(
      compileSection(text.replace('&padline part=pad step=1m ~', '&padline part=pad ~')).result
        .diagnostics,
    ).not.toEqual([]);
  });

  it('plays each pitched part at its register: the band’s performer moves its instrument’s register to the part’s (yggi/cells decisions 058 and 061, #490)', () => {
    const midiOf = (name: string) => {
      const [, letter, octave] = /^([A-G])(-?\d+)$/.exec(name)!;
      return 12 * (Number(octave) + 1) + [0, 2, 4, 5, 7, 9, 11]['CDEFGAB'.indexOf(letter!)]!;
    };
    const register = { bass: 'bass', pad: 'comp', stab: 'comp', lead: 'lead' } as const;
    const band = resolveSeed('band')!;
    const moves = (['bass', 'pad', 'stab', 'lead'] as const).map((part) => {
      const { result } = compileSection(
        [
          '&bar meter("4/4") step=120bpm',
          '&key scale(aeolian, A)',
          '&harm over=&key step=1m [0,2,4]',
          `&${part}line step=4n 0`,
          `* from band(${part}line=&${part}line)`,
        ].join('\n'),
      );
      expect(result.diagnostics).toEqual([]);
      const performer = result.performers.find((p) => p.role === part)!;
      // (the voice the band gives the performer, and the instrument it takes it from)
      const voice = new RegExp(
        `^&${part}, &${part}Out from ${part}_performer\\(.*\\b(\\w+V)=&`,
        'm',
      ).exec(band)![1]!;
      const instrument = new RegExp(`^&${voice} from (\\w+)`, 'm').exec(band)![1]!;
      const loop = resolveSeed(instrument)!.match(/loop=(\S+)/)![1]!;
      return [
        part,
        (performer.move?.transpose ?? 0) === midiOf(PIN_VOICES[register[part]]) - midiOf(loop),
      ];
    });
    expect(Object.fromEntries(moves)).toEqual({ bass: true, pad: true, stab: true, lead: true });
  });

  it('writes the section’s style over its bars, labelled, a range where it moves within the section (decision 063 §3)', () => {
    const bars = section('Funk');
    const at = (text: string) =>
      text.split('\n').filter((l) => /^&(style|\w+(, &\w+)*) /.test(l) && /style/.test(l));
    expect(at(sectionTextOf(sectionAsCells(bars)))).toEqual([
      '&funk from styles',
      '&style label="intro" style=&funk',
    ]);
    const bossa = PRESETS.find((p) => p.name === 'Bossa nova')!;
    const moving = bars.map((bar, i) =>
      i === bars.length - 1
        ? {
            ...bar,
            style: {
              ...bar.style,
              ...Object.fromEntries(STYLE_AXIS_NAMES.map((a) => [a, bossa.style[a]])),
            },
          }
        : bar,
    );
    const text = sectionTextOf(sectionAsCells(moving));
    expect(at(text)).toEqual([
      `&funk, &${bossa.id} from styles`,
      `&style label="intro" style=&funk..&${bossa.id}`,
    ]);
    expect(compileSection(text).result.diagnostics).toEqual([]);
    const off = bars.map((bar) => ({ ...bar, style: { ...bar.style, sync: 0.123 } }));
    expect(at(sectionTextOf(sectionAsCells(off)))[0]).toMatch(
      /^&style label="intro" style=&\(map=style sync=\.123 harm=\S+ bite=\S+ mood=\S+\)$/,
    );
  });

  it('names each note’s line by the part its performer’s role cell declares, else its line’s, a drum hit’s role by its line’s role=, never by a name (feel v3, yggi/cells decision 075, #615)', () => {
    const text = [
      '&bar meter("4/4") step=120bpm',
      '&key scale(aeolian, A)',
      '&harm over=&key step=1m [0,2,4]',
      '&tune over=&key step=4n 0 2 4 2',
      '&violin play=&tune &padV',
      '&padV loop=C3',
      '&strings map=role part=pad &violin',
      '&hats role=hat step=4n &hh &hh',
      '&hh from gm_kit',
      '&kitV &hh',
      '&skins play=&hats &kitV',
      '&drums map=role &skins',
      '&busk play=&melody &leadV',
      '&melody part=lead over=&key step=4n 4',
      '&leadV loop=C4',
      '&out map=midi &busk ~ &violin ~!6 &skins',
    ].join('\n');
    const { result } = compileSection(text);
    expect(result.diagnostics).toEqual([]);
    const read = (id: string) =>
      lineOf(result.outputs.find((o) => o.id.startsWith(id))!.id, result);
    // The violin plays its tune as the pad its role cell declares, named `&strings`; the skins the hats as a hat, their
    // line's `role=`; the busker's line is the lead its `part=` says, named `&melody`.
    expect(read('padV:tune:')).toEqual({ line: 'pad' });
    expect(read('kit:voices:hats:')).toEqual({ line: 'drums', role: 'hat' });
    expect(read('leadV:melody:')).toEqual({ line: 'lead' });
    // Undeclared, an output is none of the feel's, whatever its name: not the `tune` its line is named, nor a hat its
    // kit member is named, nor the lead its line was.
    const bare = compileSection(
      text
        .replace(' part=pad', '')
        .replace(' role=hat', '')
        .replace(' part=lead', '')
        .replaceAll('&hats', '&hat'),
    ).result;
    expect(bare.diagnostics).toEqual([]);
    const readBare = (id: string) =>
      lineOf(bare.outputs.find((o) => o.id.startsWith(id))!.id, bare);
    expect(readBare('padV:tune:')).toBeNull();
    expect(readBare('kit:voices:hat:')).toBeNull();
    expect(readBare('leadV:melody:')).toBeNull();
    expect(lineOf(undefined, result)).toBeNull();
  });

  it.each(['Swing jazz', 'Synth-pop', 'Bossa nova', 'Funk'])(
    'writes each pitched line of %s’s section with its part, `&bassline part=bass …`, and compiles it with no problem (#615, yggi/cells#708)',
    (name) => {
      const text = sectionTextOf(sectionAsCells(section(name)));
      const lines = text.split('\n').filter((l) => /^&(bass|pad|stab|lead)line /.test(l));
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) expect(line, line).toMatch(/^&(bass|pad|stab|lead)line part=\1 /);
      expect(compileSection(text).result.ok).toBe(true);
    },
  );

  it('declares the part or the drum role of every note it sends, so none is read as none of the feel’s: every preset, seeds 1 and 2, 32 bars (#615, #506)', () => {
    let sections = 0;
    let outputs = 0;
    const undeclared: string[] = [];
    const nones = (text: string) => {
      const { result } = compileSection(text);
      const read = lineReader(result);
      const sent = result.outputs.filter(
        (o) =>
          !o.id.startsWith('readV:') &&
          (o.id.startsWith('kit:') || o.via.length + o.through.length > 0),
      );
      return { sent, none: sent.filter((o) => read(o.id) === null).map((o) => o.id) };
    };
    for (const preset of PRESETS)
      for (const seed of [1, 2]) {
        const bars = section(preset.name, undefined, seed, 4 * SECTION_BARS);
        for (let from = 0; from < bars.length; from += SECTION_BARS) {
          const { sent, none } = nones(
            sectionTextOf(sectionAsCells(bars.slice(from, from + SECTION_BARS))),
          );
          expect(sent.length).toBeGreaterThan(0);
          undeclared.push(...none.map((id) => `${preset.name} ${seed} ${from}: ${id}`));
          outputs += sent.length;
          sections++;
        }
      }
    expect(sections).toBe(PRESETS.length * 2 * 4);
    expect(outputs).toBeGreaterThan(sections * 4);
    expect(undeclared).toEqual([]);
    // (shown firing: a section whose drum lines declare no role= sends hits none of the feel's)
    const funk = sectionTextOf(sectionAsCells(section('Funk')));
    expect(nones(funk).none).toEqual([]);
    expect(nones(funk.replace(/ role=\w+/g, '')).none.length).toBeGreaterThan(0);
  });

  it.each(['Swing jazz', 'Synth-pop', 'Bossa nova'])(
    'plays %s’s section back with each note’s line and role as the band writes them, its onset where the swing puts its step, and its end past it',
    (name) => {
      const bars = section(name);
      const played = playSection(sectionTextOf(sectionAsCells(bars)), bars);
      expect(played.diagnostics).toEqual([]);
      for (const [i, bar] of bars.entries()) {
        const p = played.bars[i]!;
        const swing = leanMap(leansOf(bar.swing), bar.meter);
        const key = (line: string, step: number, note: number, role?: string) =>
          `${line} ${Math.round(step)} ${note} ${role ?? ''}`;
        expect(p.notes.map((n, j) => key(p.lines[j]!, n.step, n.note, p.roles[j])).sort()).toEqual(
          writtenNotes(bar)
            .map((n) => key(n.line, n.step, n.note, n.role))
            .sort(),
        );
        for (const [j, n] of p.notes.entries()) {
          expect(p.onsets[j]).toBeCloseTo(swing.played(n.step), 9);
          expect(p.ends[j]!).toBeGreaterThan(p.onsets[j]!);
        }
      }
    },
  );

  it('states each note at the level the performer plays it at feel 0: a motif’s lead note on the lead’s level, its accent in place of the beat’s (#405)', () => {
    const [first] = section('Synth-pop');
    const motif: WrittenNote[] = [0, 2, 4, 6].map((step, i) => ({
      part: 'lead',
      step,
      note: 72 + i,
      length: 2,
      accent: [-20, 0, 9, 30][i]!,
    }));
    const bar = { ...first!, written: [...first!.written, ...motif] };
    const clamp = (v: number) => Math.max(1, Math.min(127, Math.round(v)));
    for (const n of writtenNotes(bar)) {
      const w = bar.written.find(
        (x) => x.part === n.line && x.step === n.step && x.note === n.note,
      )!;
      expect(n.velocity).toBe(clamp(composedLevel(bar, w)));
    }
    expect(
      writtenNotes(bar)
        .filter((n) => n.line === 'lead' && n.note >= 72)
        .map((n) => n.velocity),
    ).toEqual([-20, 0, 9, 30].map((a) => LEAD_LEVEL + a));
  });

  it('reads each chord back on the step the band writes it, through the swing: Swing jazz in 3/4 and 5/4, a chord on the offbeat of a swung beat (#432)', () => {
    for (const meter of ['3/4', '5/4'] as const) {
      const bars = section('Swing jazz', meter);
      const played = playSection(sectionTextOf(sectionAsCells(bars)), bars);
      const offbeat = bars.flatMap((bar) => bandChords(bar).filter((c) => c.step % 4 !== 0));
      expect(offbeat.length).toBeGreaterThan(0);
      // (as the shadow compares them: the step and the pitch classes; a numeral read back may be spelled otherwise, II9 for V9/V)
      const heard = (chords: readonly { step: number; pitchClasses: readonly number[] }[]) =>
        chords.map(({ step, pitchClasses }) => ({ step, pitchClasses }));
      expect(played.chords.map(heard)).toEqual(bars.map((bar) => heard(bandChords(bar))));
    }
  });

  it('pairs notes read back on one step a hair apart, as cells’ clock gives them in 7/8, by pitch as the band orders them (#432)', () => {
    const note = (step: number, pitch: number): SectionNote => ({
      part: 'drums',
      step,
      note: pitch,
      velocity: 90,
      written: 1,
      length: 1,
    });
    const band = [note(2, 37), note(2, 46)];
    expect(mismatches(band, [note(2.0000000000000036, 37), note(1.9999999999999956, 46)])).toEqual(
      [],
    );
    expect(mismatches(band, [note(2, 37), note(1.5, 46)])).toHaveLength(2);
  });

  it('sends a negative gain’s size as velocity: a band whose MIDI card strikes the bass at `-.5` sends the velocities of `.5`, the sign kept in cells’ route alone (cells v0.7.0, #413)', () => {
    const bars = section('Synth-pop');
    const text = sectionTextOf(sectionAsCells(bars));
    // (on a MIDI card a note is struck at its product's gain there; a voice's own `gain=` the card doesn't read: a
    // client's band whose card strikes the bass at a gain)
    const struck = (gain: string): Resolve => {
      const band = resolveSeed('band')!.replace(
        /^(&midi map=midi \S+ )&bassOut /m,
        `$1[&bassOut * ${gain}] `,
      );
      expect(band).not.toBe(resolveSeed('band'));
      return (id, hash) => (id === 'band' ? band : resolveSeed(id, hash));
    };
    // (the bass's instrument, its register the seed's, given a gain of its own in the score, which the band's
    // performer plays in place of its own)
    const voiced = (gain: string) => `${text}\n&bassV loop=C2 gain=${gain}`;
    const velocities = (source: string, resolve: Resolve = resolveSeed) =>
      playSection(source, bars, compileSection(source, resolve)).bars.flatMap((bar) =>
        bar.notes.filter((n) => n.part === 'bass').map((n) => n.velocity),
      );
    const own = velocities(text);
    const heard = velocities(text, struck('.5'));
    expect(heard).toHaveLength(own.length);
    // (the gain is played: half the level, each velocity lower than the bass's own)
    heard.forEach((v, i) => expect(v).toBeLessThan(own[i]!));
    expect(velocities(text, struck('-.5'))).toEqual(heard);
    expect([velocities(voiced('-.5')), velocities(voiced('.5'))]).toEqual([own, own]);
    // The sign reaches cells' route, which MIDI has no word for: the bass is routed at -.5, and struck at its size.
    const gains = (resolve: Resolve) => {
      const plan = planOf(text, undefined, { resolve });
      const route = router(plan.result, channelTable(plan.result));
      const bass = windowAt(plan, 0, 2).events.filter((e) => e.output?.startsWith('bassV:'));
      expect(bass.length).toBeGreaterThan(0);
      return [...new Set(bass.flatMap((e) => routesOf(route(e)).map((r) => r.gain)))];
    };
    expect([gains(struck('-.5')), gains(struck('.5'))]).toEqual([[-0.5], [0.5]]);
  });

  it('writes no swing on 8n in a meter whose pulses are all 3 eighths, which the band plays straight there (T16, #438), and plain where pulses of 2 and of 3 mix, a swing leaning pairs only (yggi/cells decision 071, v0.18.0)', () => {
    const swing: MeterSwing = { level: '8n', share: 2 / 3 };
    const names = Object.keys(METERS) as MeterName[];
    expect(Object.fromEntries(names.map((name) => [name, swingText(METERS[name], swing)]))).toEqual(
      {
        '2/4': ' swing=8n:2/3',
        // (alla breve's pulses are 4 eighths, which an 8n swing doesn't lean (`pulseAt`): the band plays it straight)
        '2/2': '',
        '3/4': ' swing=8n:2/3',
        '4/4': ' swing=8n:2/3',
        '5/4': ' swing=8n:2/3',
        '5/8': ' swing=8n:2/3',
        '6/8': '',
        '7/8': ' swing=8n:2/3',
        '9/8': '',
        '10/8': ' swing=8n:2/3',
        '12/8': '',
      },
    );
    expect(swingText(METERS['6/8'], { level: '16n', share: 2 / 3 })).toBe(' swing=16n:2/3');
    expect(swingText(METERS['7/8'], { level: '16n', share: 0.6 })).toBe(' swing=16n:.6');
  });

  it.each(Object.keys(METERS) as MeterName[])(
    'states the swing in %s as cells plays it where the band plays it, at every level, 2/3 and every preset’s share: the pairs alone on 8n where pulses of 2 and of 3 mix (T16; yggi/cells decision 053, #451)',
    (name) => {
      const meter = METERS[name];
      const steps = stepsOf(meter);
      for (const level of SWING_LEVELS)
        for (const share of new Set([
          0.5,
          0.6,
          2 / 3,
          0.75,
          ...PRESETS.map((p) => presetSwing(p)!.share),
        ])) {
          const swing: MeterSwing = { level, share };
          const text = [
            `&bar meter("${name}") step=60bpm${swingText(meter, swing)}`,
            '&x step=16n 0',
            '&v loop=C4',
            '&out map=midi [&x * &v]',
          ].join('\n');
          const plan = planOf(text);
          expect(plan.result.diagnostics).toEqual([]);
          const step = stepSeconds(60, meter);
          const cells = [
            ...new Set(windowAt(plan, 0, steps * step - 1e-6).events.map((e) => e.at)),
          ];
          const map = leanMap(leansOf(swing), meter);
          const band = Array.from({ length: steps }, (_, s) => map.played(s) * step);
          expect(cells).toHaveLength(steps);
          const off = cells.filter((at, s) => Math.abs(at - band[s]!) >= 1e-9);
          expect([level, share, off]).toEqual([level, share, []]);
          // (and the score's `from` line, cells' meter template, plays them where the line it stands for does: #531)
          const taken = planOf(
            [meterLine(name, 60, swingText(meter, swing)), ...text.split('\n').slice(1)].join('\n'),
            undefined,
            { resolve: resolveSeed },
          );
          expect(taken.result.diagnostics).toEqual([]);
          const takenCells = [
            ...new Set(windowAt(taken, 0, steps * step - 1e-6).events.map((e) => e.at)),
          ];
          expect(takenCells.map((at, s) => Math.abs(at - cells[s]!) < 1e-9)).toEqual(
            cells.map(() => true),
          );
        }
    },
  );
});

describe('what the composer took, written as its `from` line (#531, yggi/cells#714)', () => {
  /** The notes a text sends in its first two seconds, each its note and onset. */
  const notesOf = (text: string) => {
    const plan = planOf(text, undefined, { resolve: resolveSeed });
    expect(plan.result.diagnostics).toEqual([]);
    return windowAt(plan, 0, 2).events.map((e) => `${e.freq.toFixed(4)}@${e.at.toFixed(6)}`);
  };

  it('takes the key from cells’ mode fragment, playing every mode on every tonic as the scale it stands for', () => {
    const line = '&x over=&key step=16n 0 1 2 3 4 5 6 7 -1 -2 -3';
    const tail = ['&bar meter("4/4") step=120bpm', line, '&v loop=C4', '&out [&x * &v]'];
    for (const mode of COMPOSER_MODES)
      for (let tonic = 0; tonic < 12; tonic++) {
        const key = { tonic, mode };
        expect(keyLine(key)).toMatch(
          new RegExp(`^&key from diatonic\\(mode=${mode}\\) [A-G][#b]*$`),
        );
        expect(notesOf([keyLine(key), ...tail].join('\n')), `${mode} ${tonic}`).toEqual(
          notesOf([`&key ${keyText(key)}`, ...tail].join('\n')),
        );
      }
  });

  it('writes the meter, the key and a clave played whole as `from` lines, which cells’ references read back', () => {
    const [bars] = sections('Funk', 1, 8, true);
    const text = sectionTextOf(sectionAsCells(bars!));
    expect(text.split('\n').slice(1, 3)).toEqual([
      '&bar from meter(swing=16n:.6) 104bpm',
      '&key from diatonic(mode=dorian) D',
    ]);
    expect(references(text).map((r) => r.id)).toEqual([
      'meter',
      'diatonic',
      'styles',
      bars![0]!.plan.claveFragment,
      'band',
    ]);
    expect(text).toMatch(/^&drumlines \[.*, &clave \* \.\d+\]$/m);
    expect(text).not.toMatch(/^&clave role=/m);
  });

  it('plays every preset’s 32 bars, seeds 1 and 2, as the band writes them where it finds its parts in the repository, the clave taken wherever it plays whole', () => {
    let claves = 0;
    let taken = 0;
    let stated = 0;
    for (const preset of PRESETS)
      for (const seed of [1, 2])
        for (const bars of sections(preset.name, seed, 32, true)) {
          // (a section the score can't state, a chord it has no quality for, the app plays from the band's own
          // events, unstated: `stateSection`)
          let text: string;
          try {
            text = sectionTextOf(sectionAsCells(bars, { tempo: 'first' }));
          } catch {
            continue;
          }
          stated++;
          const played = playSection(text, bars);
          const at = `${preset.name} ${seed} ${bars[0]!.bar}`;
          expect(played.diagnostics, at).toEqual([]);
          for (const [i, bar] of bars.entries())
            expect(mismatches(writtenNotes(bar), played.bars[i]!.notes, true), at).toEqual([]);
          expect(text, at).toMatch(/^&bar from meter\b/m);
          expect(text, at).toMatch(/^&key from diatonic\(/m);
          if (bars[0]!.plan.claveFragment === undefined) continue;
          claves++;
          if (/^&clave from /m.test(text)) taken++;
          else expect(text, at).toMatch(/^&clave role=clave /m);
        }
    // (18 of 24 at cells v0.25.1: a section whose rim wins a step of the clave writes it out, shown below)
    expect(stated).toBeGreaterThan(170);
    expect(claves).toBeGreaterThan(0);
    expect(taken).toBeGreaterThan(claves / 2);
    expect(taken).toBeLessThan(claves);
  });

  it('is shown firing: a clave missing a hit the fragment holds is written out, not taken', () => {
    const [bars] = sections('Funk', 1, 8, true);
    const dropped = bars!.map((bar, i) =>
      i === 0
        ? {
            ...bar,
            written: bar.written.filter(
              (w, k) =>
                !(w.role === 'clave' && k === bar.written.findIndex((x) => x.role === 'clave')),
            ),
          }
        : bar,
    );
    expect(sectionTextOf(sectionAsCells(bars!))).toMatch(/^&clave from /m);
    expect(sectionTextOf(sectionAsCells(dropped))).toMatch(/^&clave role=clave /m);
  });
});

/** The drums cells sends on channel 10 in a text's first `seconds`: each hit's note and velocity, by onset. */
function drumsSent(lines: readonly string[], seconds: number): string[] {
  const plan = planOf([...lines, '* from band(drumlines=&drumlines)'].join('\n'), undefined, {
    resolve: resolveSeed,
  });
  expect(plan.result.diagnostics).toEqual([]);
  const route = router(plan.result, channelTable(plan.result));
  return windowAt(plan, 0, seconds)
    .events.flatMap((e) => routesOf(route(e)).flatMap((r) => midiNote(e, r) ?? []))
    .filter((n) => n.channel === 10)
    .sort((a, b) => a.at - b.at)
    .map((n) => `${n.note}/${n.velocity}@${n.at.toFixed(3)}`);
}

describe('a section’s bars, each stated once where it recurs (#498)', () => {
  const w = (at: number, length: number, text: string) => ({ at, length, text });

  it('states a bar a line plays more than once as a cell of its own, spliced in where it plays, a run as one word; a bar played once stays in line', () => {
    // Bars of 4 steps: A A B A.
    const spans = [w(0, 2, '0'), w(2, 1, '~'), w(3, 1, '~'), w(4, 2, '0'), w(6, 2, '~')];
    expect(barred('b', [...spans, w(8, 4, '3'), w(12, 2, '0'), w(14, 2, '~')], 4)).toEqual({
      words: '&bA!2 3@4 &bA',
      cells: ['&bA 0@2 ~@2'],
    });
    // Past Z, two letters.
    const many = Array.from({ length: 28 }, (_, i) =>
      [0, 4].map((at) => w(8 * i + at, 4, `[${i},9]`)),
    );
    const lettered = barred('b', many.flat(), 4);
    expect(lettered.cells.slice(25)).toEqual(['&bZ [25,9]@4', '&bAA [26,9]@4', '&bAB [27,9]@4']);
    expect(lettered.words.split(' ').slice(25)).toEqual(['&bZ!2', '&bAA!2', '&bAB!2']);
  });

  it('names no bar of rests alone, writes rests in a row as one, and leaves a line whose note is held across a bar’s end as it is', () => {
    const rests = [0, 1, 2, 3, 4, 5, 6, 7].map((at) => w(at, 1, '~'));
    expect(barred('b', [...rests, w(8, 4, '0'), w(12, 4, '0')], 4)).toEqual({
      words: '~@8 0@4 0@4',
      cells: [],
    });
    expect(barred('b', [w(0, 6, '0'), w(6, 2, '~'), w(8, 6, '0'), w(14, 2, '~')], 4)).toEqual({
      words: '0@6 ~@2 0@6 ~@2',
      cells: [],
    });
  });

  it('states a drum role’s levels as one bar, looped, where each is its step’s in the bar, and keeps each hit’s own where it is shorter', () => {
    const texts = PRESETS.map((p) => sectionTextOf(sectionAsCells(section(p.name))));
    const looped = texts.flatMap((t) =>
      [...t.matchAll(/^&(\w+)Level map=amp step=16n &\1LevelA$/gm)].map((m) => m[1]!),
    );
    expect(looped.length).toBeGreaterThan(0);
    for (const t of texts)
      for (const role of looped.filter((r) =>
        new RegExp(`^&${r}Level map=amp step=16n &${r}LevelA$`, 'm').test(t),
      )) {
        expect(t).toMatch(new RegExp(`^&drumlines \\[.*&${role} \\* &${role}Level\\b`, 'm'));
        expect(t).not.toMatch(new RegExp(`^&${role}[A-Z]? .*&\\w+:0:`, 'm'));
      }
  });

  it('plays every preset’s first section, its bars stated once, as the band writes it', () => {
    for (const p of PRESETS) {
      const bars = section(p.name);
      const text = sectionTextOf(sectionAsCells(bars));
      expect(text, p.name).toMatch(/^&\w+A /m);
      const played = playSection(text, bars);
      expect(played.diagnostics).toEqual([]);
      for (const [i, bar] of bars.entries())
        expect(mismatches(writtenNotes(bar), played.bars[i]!.notes), `${p.name} ${i}`).toEqual([]);
    }
  });

  // What cells does today that the text keeps clear of; each fails once cells plays it as written, and its way round can go.
  it('cells reads the voices after a splice of rests alone as picks of the kit: why no bar of rests is named', () => {
    const head = ['&bar meter("4/4") step=120bpm', '&drumlines [&fill]'];
    const hits = '~@13 &sd:0:.2 &sd:0:.3 &sd:0:.4';
    expect(drumsSent([...head, `&fill step=16n ~@16 ${hits}`], 3.99)).toEqual([
      '38/57@3.625',
      '38/70@3.750',
      '38/80@3.875',
    ]);
    expect(drumsSent([...head, '&fillA ~@16', `&fill step=16n &fillA ${hits}`], 3.99)).toEqual([
      '36/57@3.625',
      '37/57@3.750',
      '38/57@3.875',
    ]);
  });

  it('a bar of levels a bar long and looped levels each lap’s first hit, at 84 bpm swung, since cells v0.17.0 (yggi/cells#460): why the bar of levels is looped, not spliced a section long', () => {
    const lines = (level: string) => [
      '&bar meter("4/4") step=84bpm swing=16n:.65',
      '&hat step=16n &hh ~@15 &hh ~@15 &hh ~@15 &hh ~@15',
      level,
      '&drumlines [&hat * &hatLevel]',
    ];
    expect(drumsSent(lines('&hatLevel map=amp step=16n .5@16'), 11.4)).toHaveLength(4);
    expect(
      drumsSent([...lines('&hatLevel map=amp step=16n &hatLevelA!4'), '&hatLevelA .5@16'], 11.4),
    ).toHaveLength(4);
  });
});

describe('a section as a score, played on the band the client resolves (yggi/cells decision 063, #531)', () => {
  it.each(PRESETS.map((p) => p.name))(
    'writes %s’s section as a score that compiles on the band with no diagnostic, and ends in the band',
    (name) => {
      const text = sectionTextOf(sectionAsCells(section(name)));
      expect(text).not.toMatch(/^use |_performer|map=midi|map=sample/m);
      expect(text.split('\n').at(-1)).toMatch(/^\* from band\(/);
      expect(compileSection(text).result.diagnostics).toEqual([]);
    },
  );
});

describe('a section as a score holds what the band plays (#531’s bounds)', () => {
  it.each(PRESETS.map((p) => p.name))(
    'plays %s’s 32 bars, seeds 1 and 2, on the band each note as the band writes it, sounding as long, with no diagnostic',
    (name) => {
      for (const seed of [1, 2])
        for (const bars of sections(name, seed, 32)) {
          const text = sectionTextOf(sectionAsCells(bars, { tempo: 'first' }));
          const played = playSection(text, bars);
          expect(played.diagnostics, `${name} ${seed} ${bars[0]!.bar}`).toEqual([]);
          for (const [i, bar] of bars.entries())
            expect(
              mismatches(writtenNotes(bar), played.bars[i]!.notes, true),
              `${name} ${seed} ${bar.bar}`,
            ).toEqual([]);
        }
    },
  );

  it('is shown firing: a band whose bass sits an octave up plays other notes than the band writes', () => {
    const bars = section('Funk');
    const text = sectionTextOf(sectionAsCells(bars));
    const higher = resolveSeed('band')!.replace(/^&bassV .*$/m, '&bassV s=saw loop=C3');
    expect(higher).not.toBe(resolveSeed('band'));
    const played = playSection(
      text,
      bars,
      compileSection(text, (id, hash) => (id === 'band' ? higher : resolveSeed(id, hash))),
    );
    expect(played.diagnostics).toEqual([]);
    expect(
      bars.flatMap((bar, i) => mismatches(writtenNotes(bar), played.bars[i]!.notes)).length,
    ).toBeGreaterThan(0);
  });

  it('writes Spooky’s resting lead as a tacet, with no error and no info (energy 0.35)', () => {
    const resting = sections('Spooky', 1, 32).filter((bars) =>
      bars.every((bar) => bar.written.every((w) => w.part !== 'lead')),
    );
    expect(resting.length).toBeGreaterThan(0);
    for (const bars of resting) {
      const text = sectionTextOf(sectionAsCells(bars));
      expect(text).toMatch(/^&leadline part=lead step=1m ~$/m);
      expect(text).toMatch(/^\* from band\(.*\bleadline=&leadline\b/m);
      expect(compileSection(text).result.diagnostics).toEqual([]);
    }
  });

  it('writes each level as the shortest decimal cells strikes at its velocity, every velocity from 1 to 127', () => {
    for (let v = 1; v <= 127; v++) {
      const level = scoreLevel(v);
      expect(Math.round(127 * Math.sqrt(Number(level))), level).toBe(v);
      expect(level.replace(/^\./, '').length).toBeLessThanOrEqual(4);
      // (shorter than the square the Muse files a groove with, but where that is short already)
      expect(level.length).toBeLessThanOrEqual(levelOf(v).length);
    }
    expect([scoreLevel(127), scoreLevel(64), scoreLevel(8)]).toEqual(['1', '.254', '.004']);
  });
});

describe('the instruments the band plays a score on, found at its style (#497, #531 item 4)', () => {
  /**
   * The instruments cells wrote for presets' points: Electro swing's and Spooky's (yggi/cells#366), and since cells
   * v0.23.0 those of the styles cut from its examples, Kinderlied's and the four new (yggi/cells#572), and since v0.24.0
   * the eight it placed by hand and cut from its examples (yggi/cells#675, #679). Since v0.25.1 nothing stands at the
   * centre and each style has a second choice within each facet (yggi/cells#540): the defaults and the shared
   * instruments are placed by idiom, so Ambient, Funk and Swing jazz find instruments of their own, and Baroque, Blues
   * shuffle, Chiptune and Salsa more. Past `INSTRUMENT_REACH` each performer plays its own.
   */
  const FOUND: Record<string, Partial<Record<keyof typeof PERFORMER_VOICES, string>>> = {
    Ambient: { bass: 'sine_bass' },
    Funk: { stab: 'brass_stab' },
    'Swing jazz': { bass: 'upright_bass', lead: 'muted_trumpet' },
    'Electro swing': { bass: 'upright_bass', lead: 'clarinet', stab: 'brass_stab' },
    Spooky: { bass: 'round_bass', lead: 'theremin', pad: 'organ', stab: 'celesta' },
    Kinderlied: { bass: 'sine_bass', lead: 'recorder' },
    Acid: { bass: 'tb303' },
    'Happy hardcore': { lead: 'rave_lead' },
    Elektro: { bass: 'square_bass' },
    'Dark ambient': { pad: 'drone_pad', lead: 'prepared_piano' },
    Baroque: { stab: 'celesta', lead: 'moog' },
    'Blues shuffle': { bass: 'upright_bass', pad: 'organ', lead: 'blues_horn' },
    'Sea shanty': { lead: 'fiddle' },
    Chiptune: { bass: 'square_bass', lead: 'pulse_lead' },
    Salsa: { stab: 'brass_stab', lead: 'montuno_piano' },
    Waltz: { lead: 'accordion' },
    March: { lead: 'brass_band' },
    'Trip-hop': { lead: 'electric_piano' },
  };

  it.each(PRESETS.map((p) => p.name))(
    'at %s, the band the score resolves plays the instrument found at its style where it isn’t the performer’s own, in its register',
    (name) => {
      const text = sectionTextOf(sectionAsCells(section(name)));
      const found = instrumentsAt(scoreStyle(text)!);
      expect(Object.fromEntries(Object.entries(found).map(([part, f]) => [part, f.id]))).toEqual(
        FOUND[name] ?? {},
      );
      const band = resolveBand(text)('band')!;
      const own = resolveSeed('band')!;
      for (const [part, { line }] of Object.entries(found)) {
        const { voice, own: instrument } = PERFORMER_VOICES[part as keyof typeof PERFORMER_VOICES];
        expect(band.split('\n'), `${name} ${part}`).toContain(line);
        expect(own.split('\n')).not.toContain(line);
        // (and holds its performer's own instrument's register, so MIDI out sends the same notes)
        const ownLine = bodyOf(resolveSeed(instrument)!)
          .split('\n')
          .find((l) => l.startsWith(`&${voice} `))!;
        expect(/loop=(\S+)/.exec(line)![1], `${name} ${part}`).toBe(/loop=(\S+)/.exec(ownLine)![1]);
      }
      if (Object.keys(found).length === 0) expect(band).toBe(own);
    },
  );

  it('plays an instrument within `INSTRUMENT_REACH` of the style, the composer’s miss distance, and none farther (cells v0.25.1)', () => {
    expect(INSTRUMENT_REACH).toBe(MISS_DISTANCE);
    // (a lead of its own at a point, at weight 1: each axis moved by `d` lies `d` from it, the root of the mean squared
    // difference, which the ranking divides by the point's weight)
    const point = { sync: 0.9, harm: 0.1, bite: 0.9, mood: 0.1 };
    const whistle = {
      id: 'test whistle',
      text: '&leadV s=sine loop=C4 env=&(map=adsr .05 .1 .8 .2)',
      association: [{ point, weight: 1, facet: 'instrument' }],
    };
    const off = (d: number) => ({
      sync: point.sync - d,
      harm: point.harm + d,
      bite: point.bite - d,
      mood: point.mood + d,
    });
    expect(instrumentsAt(off(0.29), [whistle])).toEqual({
      lead: { id: 'test whistle', line: whistle.text },
    });
    expect(instrumentsAt(off(0.31), [whistle])).toEqual({});
  });
});

describe('a voice’s own sound, read off the text for the built-in synth (#497)', () => {
  // (a stab with a clarinet's vibrato, and a bass whose cutoff moves: Funk's first section plays the two)
  const STAB =
    '&keysV s=square loop=C3 lpf=2400 lpq=3 env=&(map=adsr .02 .2 .7 .15) pitch=&(map=lin loop=5.5 0 .12 0 -.12 0)';
  const BASS = '&bassV s=saw loop=C2 lpf=300..1200 * &bassMove';

  // (the instruments found at presets' points, yggi/cells#366 and, since cells v0.23.0, #572, by the waveform each
  // plays, and since cells v0.25.1 those placed by idiom within `INSTRUMENT_REACH`, yggi/cells#540: elsewhere a voice is
  // the performer's own instrument, and the synth colours it by the style)
  const WAVES: Record<string, Record<string, string>> = {
    Ambient: { bass: 'sine' },
    Funk: { stab: 'sawtooth' },
    'Swing jazz': { bass: 'sawtooth', lead: 'sawtooth' },
    'Electro swing': { bass: 'sawtooth', lead: 'square', stab: 'sawtooth' },
    Spooky: { bass: 'triangle', lead: 'sine', pad: 'square', stab: 'sine' },
    Kinderlied: { bass: 'sine', lead: 'triangle' },
    Acid: { bass: 'sawtooth' },
    'Happy hardcore': { lead: 'sawtooth' },
    Elektro: { bass: 'square' },
    'Dark ambient': { pad: 'sawtooth', lead: 'triangle' },
    'Blues shuffle': { bass: 'sawtooth', pad: 'square', lead: 'sawtooth' },
    Chiptune: { bass: 'square' },
    Salsa: { stab: 'sawtooth', lead: 'square' },
  };

  it.each(PRESETS.map((p) => p.name))(
    'gives %s’s pitched notes the sound of the instrument found at its style, every note of the performer, and no drum hit one',
    (name) => {
      const bars = section(name);
      const played = playSection(sectionTextOf(sectionAsCells(bars)), bars);
      const waves = new Map<string, Set<string | undefined>>();
      for (const b of played.bars)
        b.sounds.forEach((sound, j) => {
          const line = b.lines[j]!;
          if (!waves.has(line)) waves.set(line, new Set());
          waves.get(line)!.add(sound?.wave);
        });
      const want = WAVES[name] ?? {};
      for (const [line, heard] of waves)
        expect([...heard], `${name}: ${line}`).toEqual([want[line]]);
      // (and heard: the first section plays the bass and the stab or the pad, the lead coming in later)
      const early = Object.keys(want).filter((line) => line !== 'lead');
      expect(Object.keys(want).filter((line) => waves.has(line)).length).toBeGreaterThanOrEqual(
        Math.min(2, early.length),
      );
    },
  );

  it.each(['Electro swing', 'Spooky'])(
    'plays %s’s section on the instruments the band finds at its style with the same notes as on the band’s defaults (yggi/cells#350)',
    (name) => {
      const bars = section(name);
      const text = sectionTextOf(sectionAsCells(bars));
      expect(Object.keys(instrumentsAt(scoreStyle(text)!)).length).toBeGreaterThan(0);
      const voiced = playSection(text, bars);
      expect(voiced.diagnostics).toEqual([]);
      // (the band as cells' library holds it, each performer on its own instrument)
      const plain = playSection(text, bars, compileSection(text, resolveSeed));
      expect(plain.diagnostics).toEqual([]);
      expect(voiced.bars.map((b) => b.notes)).toEqual(plain.bars.map((b) => b.notes));
      expect(bandAt(scoreStyle(text)!)).not.toBe(resolveSeed('band'));
    },
  );

  it('gives each note its voice’s sound where the text writes one, and sends the same notes', () => {
    const bars = section('Funk');
    const text = sectionTextOf(sectionAsCells(bars));
    // (a voice the score writes is the one the band's performer plays: the band's own line for it gives way)
    const voiced = `${text}\n${STAB}\n${BASS}\n&bassMove step=1m 0 1`;
    const plain = playSection(text, bars);
    const played = playSection(voiced, bars);
    expect(played.diagnostics).toEqual([]);
    expect(played.bars.map((b) => b.notes)).toEqual(plain.bars.map((b) => b.notes));
    const stab = played.bars.flatMap((b) => b.sounds.filter((_, j) => b.lines[j] === 'stab'));
    const bass = played.bars.flatMap((b) => b.sounds.filter((_, j) => b.lines[j] === 'bass'));
    const rest = played.bars.flatMap((b) =>
      b.sounds.filter((_, j) => b.lines[j] !== 'stab' && b.lines[j] !== 'bass'),
    );
    expect(stab.length).toBeGreaterThan(0);
    expect(bass.length).toBeGreaterThan(0);
    for (const sound of stab) {
      expect(sound).toMatchObject({
        wave: 'square',
        lpf: 2400,
        lpq: 3,
        env: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.15 },
      });
      // (the vibrato, as cells bends it, from the note's start on: a stab is short enough to end on its way up)
      expect(Math.max(...sound!.bends!.map((b) => Math.abs(b.cents)))).toBeGreaterThan(0);
      expect(Math.min(...sound!.bends!.map((b) => b.at))).toBeGreaterThanOrEqual(0);
    }
    // (a moving cutoff at where its range starts; no envelope written, none carried)
    for (const sound of bass) expect(sound).toEqual({ wave: 'sawtooth', lpf: 300 });
    expect(rest.filter((s) => s !== undefined)).toEqual([]);
  });

  it('reads none off a voice with no waveform of the four: a register alone, or a noise', () => {
    const plan = planOf(
      [
        '&bar meter("4/4") step=120bpm',
        '&line step=4n 0 2',
        '&av loop=C4',
        '&bv s=white',
        '&cv s=tri',
        '&out map=sample [&line * &av, &line * &bv, &line * &cv]',
      ].join('\n'),
    );
    expect(plan.result.diagnostics).toEqual([]);
    const events = windowAt(plan, 0, 0.4).events;
    expect(
      ['av', 'bv', 'cv'].map((v) =>
        soundOf(
          events.find((e) => e.voice === v)!,
          plan.result,
        ),
      ),
    ).toEqual([undefined, undefined, { wave: 'triangle' }]);
  });
});
