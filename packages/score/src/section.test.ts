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
  type WrittenNote,
  band,
  composedLevel,
  leanMap,
  leansOf,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { lineOf, playSection } from './section-play.ts';
import { hostOf, sectionAsCells, sectionTextOf, writtenNotes } from './section-text.ts';

/** A preset's first section, as the band composes it at entropy 0.3, seed 1. */
function section(name: string): BandBar[] {
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
});
