/**
 * A section as one cells text and played back (`section-text.ts`,
 * `section-play.ts`): what the app's shadow reads beyond E35 (#399). E35's own
 * test holds the builder over its corpus.
 */

import {
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
} from '@jambot/engine';
import { METERS, type MeterName, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, router, routesOf } from '@yggi/cells/engine/midi';
import { describe, expect, it } from 'vitest';
import { bandChords, lineOf, mismatches, playSection } from './section-play.ts';
import {
  type SectionNote,
  hostOf,
  sectionAsCells,
  sectionTextOf,
  swingStated,
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
        wish: { tonic: null, mode: preset.mode, melodic: null },
        swing: preset.swing,
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

  it('names each note’s line by the output cells gives it: a gate’s voice then its line, a kit’s member then its role', () => {
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
    const voiced = (gain: string) => text.replace(/^&bassV .*$/m, (line) => `${line} gain=${gain}`);
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
      const plan = planOf(source);
      const route = router(plan.result, channelTable(plan.result));
      const bass = windowAt(plan, 0, 2).events.filter((e) => e.output?.startsWith('bassV:'));
      return [...new Set(bass.flatMap((e) => routesOf(route(e)).map((r) => r.gain)))];
    };
    expect([gains(struck('-.5')), gains(struck('.5'))]).toEqual([[-0.5], [0.5]]);
  });

  it('writes no swing on 8n in a meter whose pulses are all 3 eighths, which the band plays straight there (T16, #438), and says it can’t state one of pairs and threes (yggi/cells#204)', () => {
    const swing: MeterSwing = { level: '8n', share: 2 / 3 };
    const names = Object.keys(METERS) as MeterName[];
    expect(names.filter((name) => swingText(METERS[name], swing) === '')).toEqual([
      '6/8',
      '9/8',
      '12/8',
    ]);
    expect(names.filter((name) => !swingStated(METERS[name], swing))).toEqual([
      '5/8',
      '7/8',
      '10/8',
    ]);
    expect(swingText(METERS['6/8'], { level: '16n', share: 2 / 3 })).toBe(' swing=16n:2/3');
  });

  it.each(Object.keys(METERS) as MeterName[])(
    'states the swing in %s where cells plays it as the band does, and says where it can’t: pulses of 2 and of 3 eighths on an 8n swing (T16; yggi/cells#204)',
    (name) => {
      const meter = METERS[name];
      const steps = stepsOf(meter);
      for (const level of SWING_LEVELS)
        for (const share of [0.5, 0.6, 2 / 3, 0.75]) {
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
          const agrees = cells.every((at, s) => Math.abs(at - band[s]!) < 1e-9);
          expect([level, share, agrees]).toEqual([level, share, swingStated(meter, swing)]);
        }
    },
  );
});
