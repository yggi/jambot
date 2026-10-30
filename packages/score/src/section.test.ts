/**
 * A section as one cells text and played back (`section-text.ts`,
 * `section-play.ts`): what the app's shadow reads beyond E35 (#399). E35's own
 * test holds the builder over its corpus.
 */

import {
  presetMode,
  type BandBar,
  type BandCarried,
  PRESETS,
  SECTION_BARS,
  LEAD_LEVEL,
  type MeterSwing,
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
import { resolveSeed } from '@yggi/cells/repository/library';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { describe, expect, it } from 'vitest';
import {
  bandChords,
  compileSection,
  lineOf,
  mismatches,
  playSection,
  soundOf,
} from './section-play.ts';
import {
  PIN_VOICES,
  type SectionNote,
  barred,
  performerOf,
  hostOf,
  sectionAsCells,
  sectionTextOf,
  swingText,
  writtenNotes,
} from './section-text.ts';

/** A preset's first section, as the band composes it at entropy 0.3, seed 1, in its meter or the one asked for. */
function section(name: string, meter?: MeterName): BandBar[] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  return Array.from({ length: SECTION_BARS }, (_, bar) => {
    const made = band.advance(
      {
        seed: 1,
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

/** The bars with a tempo that glides through them, a bpm higher each bar. */
const gliding = (bars: readonly BandBar[]) =>
  bars.map((bar, i) => ({ ...bar, style: { ...bar.style, bpm: bar.style.bpm + i } }));

describe('a section as one cells text, for the app (#399)', () => {
  it('holds one tempo a text, unless asked to state the first bar’s while the bars’ tempos glide', () => {
    const bars = gliding(section('Synth-pop'));
    expect(() => hostOf(bars)).toThrow(/bpm changes at its bar 1/);
    expect(hostOf(bars, { tempo: 'first' }).bpm).toBe(bars[0]!.style.bpm);
    const text = sectionTextOf(sectionAsCells(bars, { tempo: 'first' }));
    expect(text.split('\n')[0]).toBe(`&bar meter("4/4") step=${bars[0]!.style.bpm}bpm`);
    // The rest of the text is the held tempo's.
    const held = sectionTextOf(sectionAsCells(section('Synth-pop')));
    expect(text.split('\n').slice(1)).toEqual(held.split('\n').slice(1));
  });

  it('plays each part through its seed performer, the card sending their gates, each moved from its instrument’s register to the part’s (yggi/cells decisions 058 and 061, #490)', () => {
    const bars = section('Funk');
    const text = sectionTextOf(sectionAsCells(bars));
    const { result } = compileSection(text);
    expect(result.diagnostics).toEqual([]);
    expect(text.match(/^use .*$/gm)).toEqual(
      ['drums', 'bass', 'stab'].map((p) => `use * from "${p} performer"`),
    );
    expect(text.split('\n').at(-1)).toBe('&out map=midi ~ &bassOut &stabOut ~!6 &drumsOut');
    expect(result.performers.map((p) => [p.name, p.role, p.part])).toEqual([
      ['drumsOut', 'drums', 'drumlines'],
      ['bassOut', 'bass', 'bassline'],
      ['stabOut', 'stab', 'stabline'],
    ]);
    // Each performer's move is the part's register less its instrument's, which the instrument fragment holds.
    const midiOf = (name: string) => {
      const [, letter, octave] = /^([A-G])(-?\d+)$/.exec(name)!;
      return 12 * (Number(octave) + 1) + [0, 2, 4, 5, 7, 9, 11]['CDEFGAB'.indexOf(letter!)]!;
    };
    const register = { bass: 'bass', pad: 'comp', stab: 'comp', lead: 'lead' } as const;
    const moves = (['bass', 'pad', 'stab', 'lead'] as const).map((part) => {
      const performer = compileSection(
        `&${part}line step=4n 0\n&${part}Level map=amp 1\nuse * from "${performerOf(part)}"\n&out map=midi &${part}Out`,
      ).result.performers[0]!;
      const voice = performer.voices[0]!;
      const use = resolveSeed(performerOf(part))!.match(
        new RegExp(`^use &${voice} from (\\S+)$`, 'm'),
      )!;
      const loop = resolveSeed(use[1]!.replace(/"/g, ''))!.match(/loop=(\S+)/)![1]!;
      return [
        part,
        (performer.move?.transpose ?? 0) === midiOf(PIN_VOICES[register[part]]) - midiOf(loop),
      ];
    });
    expect(Object.fromEntries(moves)).toEqual({ bass: true, pad: true, stab: true, lead: true });
    // A role on the card is an error: it names gates, and is no sound to send.
    expect(compileSection(text.replace(/&bassOut(?= )/, '&bass')).result.diagnostics).not.toEqual(
      [],
    );
  });

  it('names each note’s line by the role of the performer whose gate plays it, a drum hit’s role by its line, and else by the output cells gives it (feel v1.2, yggi/music-commons#35)', () => {
    const text = [
      '&bar meter("4/4") step=120bpm',
      '&key scale(aeolian, A)',
      '&harm over=&key step=1m [0,2,4]',
      '&tune over=&key step=4n 0 2 4 2',
      '&violin play=&tune &padV',
      '&padV loop=C3',
      '&pad map=role &violin',
      '&hats step=4n &hh &hh',
      'use &hh from gm_kit',
      '&kitV &hh',
      '&skins play=&hats &kitV',
      '&drums map=role &skins',
      '&busk play=&lead &leadV',
      '&lead over=&key step=4n 4',
      '&leadV loop=C4',
      '&out map=midi &busk ~ &violin ~!6 &skins',
    ].join('\n');
    const { result } = compileSection(text);
    expect(result.diagnostics).toEqual([]);
    const read = (id: string) =>
      lineOf(result.outputs.find((o) => o.id.startsWith(id))!.id, result);
    // The violin plays its tune as the pad; the skins the hats as the drums, the hats' role their line's.
    expect(read('padV:tune:')).toEqual({ line: 'pad' });
    expect(read('kit:voices:hats:')).toEqual({ line: 'drums', role: 'hats' });
    // A gate no role cell names plays as written: its line's name says.
    expect(read('leadV:lead:')).toEqual({ line: 'lead' });
    expect(lineOf(result.outputs.find((o) => o.id.startsWith('padV:tune:'))!.id)).toEqual({
      line: 'tune',
    });
    expect(lineOf('compV:pad:17:14')).toEqual({ line: 'pad' });
    expect(lineOf('compV:stab:19:15')).toEqual({ line: 'stab' });
    expect(lineOf('bassV:bass:14:15')).toEqual({ line: 'bass' });
    expect(lineOf('leadV:lead:30:15')).toEqual({ line: 'lead' });
    expect(lineOf('kit:voices:hat:9:35')).toEqual({ line: 'drums', role: 'hat' });
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

  it('sends a negative gain’s size as velocity: a section whose bass is struck at `-.5` sends the velocities of `.5`, the sign kept in cells’ route alone (cells v0.7.0, #413)', () => {
    const bars = section('Synth-pop');
    const text = sectionTextOf(sectionAsCells(bars));
    // (on a MIDI card a note is struck at its product's gain there; a voice's own `gain=` the card doesn't read)
    const struck = (gain: string) =>
      text.replace(/^(&out map=midi .*)&bassOut /m, `$1[&bassOut * ${gain}] `);
    // (the bass's instrument, its register the seed's, given a gain of its own after the performer that uses it)
    const voiced = (gain: string) => {
      const edited = text.replace(
        /^use \* from "bass performer"$/m,
        (line) => `${line}\n&bassV loop=C2 gain=${gain}`,
      );
      expect(edited).not.toBe(text);
      return edited;
    };
    const velocities = (source: string) =>
      playSection(source, bars).bars.flatMap((bar) =>
        bar.notes.filter((n) => n.part === 'bass').map((n) => n.velocity),
      );
    const own = velocities(text);
    const heard = velocities(struck('.5'));
    expect(heard).toHaveLength(own.length);
    // (the gain is played: half the level, each velocity lower than the bass's own)
    heard.forEach((v, i) => expect(v).toBeLessThan(own[i]!));
    expect(velocities(struck('-.5'))).toEqual(heard);
    expect([velocities(voiced('-.5')), velocities(voiced('.5'))]).toEqual([own, own]);
    // The sign reaches cells' route, which MIDI has no word for: the bass is routed at -.5, and struck at its size.
    const gains = (source: string) => {
      const plan = planOf(source, undefined, { resolve: resolveSeed });
      const route = router(plan.result, channelTable(plan.result));
      const bass = windowAt(plan, 0, 2).events.filter((e) => e.output?.startsWith('bassV:'));
      return [...new Set(bass.flatMap((e) => routesOf(route(e)).map((r) => r.gain)))];
    };
    expect([gains(struck('-.5')), gains(struck('.5'))]).toEqual([[-0.5], [0.5]]);
  });

  it('writes no swing on 8n in a meter whose pulses are all 3 eighths, which the band plays straight there (T16, #438), and the pairs alone where pulses of 2 and of 3 mix (yggi/cells decision 053, #451)', () => {
    const swing: MeterSwing = { level: '8n', share: 2 / 3 };
    const names = Object.keys(METERS) as MeterName[];
    expect(Object.fromEntries(names.map((name) => [name, swingText(METERS[name], swing)]))).toEqual(
      {
        '3/4': ' swing=8n:2/3',
        '4/4': ' swing=8n:2/3',
        '5/4': ' swing=8n:2/3',
        '5/8': ' swing=8n:2/3:pairs',
        '6/8': '',
        '7/8': ' swing=8n:2/3:pairs',
        '9/8': '',
        '10/8': ' swing=8n:2/3:pairs',
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
        }
    },
  );
});

/** The drums cells sends on channel 10 in a text's first `seconds`: each hit's note and velocity, by onset. */
function drumsSent(lines: readonly string[], seconds: number): string[] {
  const plan = planOf(
    [...lines, 'use * from "drums performer"', '&out map=midi ~!9 &drumsOut'].join('\n'),
    undefined,
    { resolve: resolveSeed },
  );
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

  it('states a drum role’s levels as one bar spliced in a section long where each is its step’s in the bar, and keeps each hit’s own where it is shorter', () => {
    const texts = PRESETS.map((p) => sectionTextOf(sectionAsCells(section(p.name))));
    const looped = texts.flatMap((t) =>
      [...t.matchAll(/^&(\w+)Level map=amp step=16n &\1LevelA!8$/gm)].map((m) => m[1]!),
    );
    expect(looped.length).toBeGreaterThan(0);
    for (const t of texts)
      for (const role of looped.filter((r) => t.includes(`&${r}LevelA!8`))) {
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

  it('cells misses a hit on a bar’s first step where its levels are a bar long and loop, at 84 bpm swung: why they are spliced a section long', () => {
    const lines = (level: string) => [
      '&bar meter("4/4") step=84bpm swing=16n:.65',
      '&hat step=16n &hh ~@15 &hh ~@15 &hh ~@15 &hh ~@15',
      level,
      '&drumlines [&hat * &hatLevel]',
    ];
    expect(drumsSent(lines('&hatLevel map=amp step=16n .5@16'), 11.4)).toHaveLength(3);
    expect(
      drumsSent([...lines('&hatLevel map=amp step=16n &hatLevelA!4'), '&hatLevelA .5@16'], 11.4),
    ).toHaveLength(4);
  });
});

describe('a voice’s own sound, read off the text for the built-in synth (#497)', () => {
  // (a stab with a clarinet's vibrato, and a bass whose cutoff moves: Funk's first section plays the two)
  const STAB =
    '&keysV s=square loop=C3 lpf=2400 lpq=3 env=&(map=adsr .02 .2 .7 .15) pitch=&(map=lin loop=5.5 0 .12 0 -.12 0)';
  const BASS = '&bassV s=saw loop=C2 lpf=300..1200 * &bassMove';

  // (the instruments found at two presets' points, yggi/cells#366, by the waveform each plays: elsewhere a voice
  // holds a register only, and the synth colours it by the style)
  const WAVES: Record<string, Record<string, string>> = {
    'Electro swing': { bass: 'sawtooth', lead: 'square', stab: 'sawtooth' },
    Spooky: { bass: 'triangle', lead: 'sine', pad: 'square', stab: 'sine' },
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
      if (name in WAVES)
        expect(Object.keys(want).filter((line) => waves.has(line)).length).toBeGreaterThan(1);
    },
  );

  it.each(['Electro swing', 'Spooky'])(
    'plays %s’s section on its instruments with the same notes as on the performers’ own (yggi/cells#350)',
    (name) => {
      const bars = section(name);
      const text = sectionAsCells(bars);
      const voiced = playSection(sectionTextOf(text), bars);
      expect(voiced.diagnostics).toEqual([]);
      // (the text with its instruments' lines and the card that hears them left out: the performers' own)
      const own = {
        ...text,
        lines: text.lines.filter((l) => !/^&(bassV|padV|keysV|leadV|heard) /.test(l.text)),
      };
      expect(own.lines.length).toBeLessThan(text.lines.length);
      const plain = playSection(sectionTextOf(own), bars);
      expect(voiced.bars.map((b) => b.notes)).toEqual(plain.bars.map((b) => b.notes));
    },
  );

  it('gives each note its voice’s sound where the text writes one, and sends the same notes', () => {
    const bars = section('Funk');
    const text = sectionTextOf(sectionAsCells(bars));
    // (a voice with a sound is heard on a sound card: on a MIDI card alone cells says its sound isn't sent)
    const voiced = `${text}\n${STAB}\n${BASS}\n&bassMove step=1m 0 1\n&heard map=sample [&stabOut, &bassOut]`;
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
