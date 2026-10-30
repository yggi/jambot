import { METERS, stepsOf, wrap } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandCarried, type BandEnv, band } from './band.ts';
import { BASS_REPOSITORY, lineText, readLine } from './bass-lines.ts';
import { lineTone } from './bass-query.ts';
import { chordsOn } from './chords.ts';
import { COMPOSER } from './facet.ts';
import { SECTION_BARS } from './form.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { stylePoint } from './meter-query.ts';
import type { HeardNote } from './muse.ts';
import { BASSIST, lineOf } from './muse-line.ts';
import { BY, VARIES } from './novelty.ts';
import { LINE_TAG, sectionLine } from './plan.ts';
import { METER_REPOSITORY, presetSwing } from './repository.ts';
import { RHYTHM_REPOSITORY } from './rhythms.ts';
import { PROTOTYPE_PRESETS, type Style, holding, writtenStyle } from './style.ts';
import { holdingSwing } from './swing.ts';
import {
  LOOKAHEAD,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  clockOfTransport,
  transport,
} from './transport.ts';
import { presetMode } from './mode-repository.ts';

const range = (n: number) => [...Array(n).keys()];
const byName = (name: string) => PROTOTYPE_PRESETS.find((p) => p.name === name)!;

/** The transport over 32 bars: every event. */
function events(env: TransportEnv): TimedEvent[] {
  let carried: TransportCarried | null = transport.initial;
  const out: TimedEvent[] = [];
  for (let now = env.start - 0.1; ; now += 0.1) {
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
    carried = next.carried!;
    out.push(...next.output.events.filter((e) => e.bar < 32));
    if (carried.head.step > clockOfTransport(carried).barStart(32)) return out;
  }
}

/** FNV-1a over every event's bar, part, step, note, velocity, onset and duration, to 1e-9 s. */
function hashOf(all: readonly TimedEvent[]): string {
  let h = 0x811c9dc5;
  for (const { bar, event, seconds, duration } of all) {
    const line = `${bar} ${event.part} ${event.step} ${event.note} ${event.velocity} ${seconds.toFixed(9)} ${duration.toFixed(9)}\n`;
    for (let i = 0; i < line.length; i++) h = Math.imul(h ^ line.charCodeAt(i), 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Each preset held at entropy 0, swung as it is, 2 seeds, with cells' meters and rhythms and an empty layer; and the bass lines where given. */
const held = (extra: Partial<TransportEnv> = {}) =>
  PROTOTYPE_PRESETS.flatMap((preset) =>
    [0, 1].map((seed) =>
      events({
        seed,
        start: 1,
        track: holding({ ...preset.style, entropy: 0 }),
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        swing: holdingSwing(presetSwing(preset)!),
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        layer: EMPTY_LAYER,
        ...extra,
      }),
    ),
  ).flat();

/** Main's events as `layer.test.ts` records them (its `MAIN_RHYTHMS.still`): every part, the presets held at entropy 0. */
const MAIN_STILL = [15612, '32d83dee'] as const;

describe('the drums, the comp and the lead, unchanged by the bass in the loop (#423)', () => {
  const main = held();
  const loop = held({ bassLines: BASS_REPOSITORY });
  const part = (all: readonly TimedEvent[], p: string, not = false) =>
    all.filter((e) => (e.event.part === p) !== not);

  it('plays main without the bass lines: 15,612 events', () => {
    expect([main.length, hashOf(main)]).toEqual(MAIN_STILL);
  });

  it('plays every drum, comp and lead event main plays, each to 1e-9 s, over the 8 presets held at entropy 0, 2 seeds of 32 bars', () => {
    expect(part(loop, 'drums').length).toBe(part(main, 'drums').length);
    expect(hashOf(part(loop, 'drums'))).toBe(hashOf(part(main, 'drums')));
    expect(hashOf(part(loop, 'bass', true))).toBe(hashOf(part(main, 'bass', true)));
    // and as many bass notes, which move (E41)
    expect(part(loop, 'bass').length).toBe(part(main, 'bass').length);
    expect(hashOf(part(loop, 'bass'))).not.toBe(hashOf(part(main, 'bass')));
  });
});

/** The band over `bars` bars at one style, every bar and the carried state after each. */
function play(
  bars: number,
  style: Style,
  extra: Partial<BandEnv> = {},
  preset = byName('Synth-pop'),
) {
  let carried: BandCarried = band.initial;
  return range(bars).map((bar) => {
    const next = band.advance(
      {
        seed: 1,
        bar,
        style,
        swing: presetSwing(preset)!,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        offer: null,
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        bassLines: BASS_REPOSITORY,
        layer: EMPTY_LAYER,
        ...extra,
      },
      carried,
      null,
    );
    carried = next.carried;
    return { bar: next.output, carried };
  });
}

/** Each section's bass line, `-` where the bass plays its own. */
const linesOf = (run: ReturnType<typeof play>) =>
  range(run.length / SECTION_BARS).map(
    (s) => run[s * SECTION_BARS]!.carried.plans.bassFragment ?? '-',
  );

describe('the composer asks for a bass line by the facet `bass` at the style (#423)', () => {
  it('finds each preset’s line at its point, at distance 0, and plays it every section while the preset is held at entropy 0', () => {
    const found = Object.fromEntries(
      PROTOTYPE_PRESETS.map((p) => {
        const run = play(4 * SECTION_BARS, { ...p.style, entropy: 0 }, {}, p);
        return [p.name, [...new Set(linesOf(run))]];
      }),
    );
    expect(found).toEqual({
      'Synth-pop': ['root bass'],
      Techno: ['pumping bass'],
      'Deep house': ['root bass'],
      Ambient: ['root bass'],
      'Lo-fi hip hop': ['funk bass'],
      Funk: ['funk bass'],
      'Bossa nova': ['funk bass'],
      'Swing jazz': ['walking bass'],
    });
    for (const p of PROTOTYPE_PRESETS)
      expect(
        BASS_REPOSITORY.query(stylePoint(writtenStyle({ ...p.style, entropy: 0 })), {
          meter: METERS['4/4'],
        })[0]!.distance,
        p.name,
      ).toBe(0);
  });

  it('takes the walk only under a meter that swings its 8ths: at Swing jazz’s point in a straight 4/4 it takes the next nearest', () => {
    const swing = byName('Swing jazz');
    const env = { bassLines: BASS_REPOSITORY, style: writtenStyle({ ...swing.style, entropy: 0 }) };
    const meter = { meter: METERS['4/4'], meterFragment: '4/4 swung on 8n' };
    expect(sectionLine(env, { ...meter, swing: '8n', share: 2 / 3 }, undefined)).toBe(
      'walking bass',
    );
    // (since cells v0.12.0 the next nearest is Spooky's creeping bass, 0.15 from Swing jazz's point, where funk bass was)
    expect(sectionLine(env, { meter: METERS['4/4'], swing: '16n', share: 0.5 }, undefined)).toBe(
      'creeping bass',
    );
  });

  it('plays from the line: each bar’s notes on the line’s steps first, reading its tones over the bar’s chords, as many as the bass plays alone', () => {
    const run = play(
      2 * SECTION_BARS,
      { ...byName('Swing jazz').style, entropy: 0 },
      {},
      byName('Swing jazz'),
    );
    const alone = play(
      2 * SECTION_BARS,
      { ...byName('Swing jazz').style, entropy: 0 },
      { bassLines: undefined },
      byName('Swing jazz'),
    );
    const line = BASS_REPOSITORY.read('walking bass', METERS['4/4'])!.notes;
    for (const [i, { bar }] of run.entries()) {
      const bass = bar.written.filter((n) => n.part === 'bass');
      const own = alone[i]!.bar.written.filter((n) => n.part === 'bass');
      if (bar.plan.section.type === 'breakdown') continue;
      expect(bass.length).toBe(own.length);
      const chords = chordsOn(bar.chords, bar.meter);
      for (const n of line) {
        const played = bass.find((b) => b.step === n.step)!;
        expect(played, `bar ${bar.bar} step ${n.step}`).toBeDefined();
        expect(wrap(played.note, 12)).toBe(
          wrap(lineTone(n, chords, chordsOn(bar.next, bar.meter), bar.plan.key), 12),
        );
      }
    }
  });
});

/** A style no line of cells' lies within the miss distance of: full sync, the rest at 0 (the nearest, the root bass, 0.51 away). */
const FAR: Style = { ...byName('Funk').style, sync: 1, harm: 0, artic: 0, energy: 0, entropy: 0.3 };

describe('the bass is the generator on a miss, and the Muse files what it played (#423)', () => {
  it('finds no line at a point far from every seed line, plays its own, and the Muse files that line where the next section is planned', () => {
    expect(
      BASS_REPOSITORY.query(stylePoint(writtenStyle(FAR)), { meter: METERS['4/4'] })[0]!.distance,
    ).toBeGreaterThan(0.3);
    const run = play(2 * SECTION_BARS, FAR);
    expect(linesOf(run)).toEqual(['-', 'bassist song 1, bar 0']);
    const layer = run.at(-1)!.carried.plans.layer!;
    const filed = layer.filed.find((f) => f.fragment.id === 'bassist song 1, bar 0')!;
    expect(filed.meta).toEqual({ source: BASSIST, created: 'song 1, bar 0', tags: [LINE_TAG] });
    expect(filed.fragment.association).toEqual([
      { point: stylePoint(writtenStyle(FAR)), weight: expect.any(Number), facet: 'bass' },
    ]);
  });

  it('reads a filed line back as the notes the bass played in the bars it recurs in, over the chords it was heard on: the round trip', () => {
    const run = play(2 * SECTION_BARS, FAR);
    const layer = run.at(-1)!.carried.plans.layer!;
    const read = BASS_REPOSITORY.read('bassist song 1, bar 0', METERS['4/4'], layer)!;
    // the section's first seven bars are heard (the last leads into the next section's chords)
    const heard = run.slice(0, SECTION_BARS - 1).map(({ bar }) => bar);
    const matching = heard.filter((bar) => {
      const notes = bar.written.filter((n) => n.part === 'bass');
      const chords = chordsOn(bar.chords, bar.meter);
      const next = chordsOn(bar.next, bar.meter);
      const back = read.notes.map(
        (n) => `${n.step}:${wrap(lineTone(n, chords, next, bar.plan.key), 12)}`,
      );
      return back.join() === notes.map((n) => `${n.step}:${wrap(n.note, 12)}`).join();
    });
    expect(matching.length).toBeGreaterThanOrEqual(2);
  });

  it('reads every bar the band’s bass plays, over 8 presets and 2 seeds, as a line that plays its notes again over its chords', () => {
    let bars = 0;
    for (const preset of PROTOTYPE_PRESETS)
      for (const seed of [0, 1]) {
        let carried: BandCarried = band.initial;
        for (const bar of range(2 * SECTION_BARS)) {
          const env: BandEnv = {
            seed,
            bar,
            style: { ...preset.style, entropy: 0.6 },
            swing: presetSwing(preset)!,
            wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
            offer: null,
            repository: METER_REPOSITORY,
          };
          const { carried: after, output } = band.advance(env, carried, null);
          carried = after;
          const notes = output.written.filter((n) => n.part === 'bass');
          const chords = chordsOn(output.chords, output.meter);
          const next = chordsOn(output.next, output.meter);
          const line = lineOf(notes, chords, next);
          const text = lineText(line, stepsOf(output.meter));
          const back = readLine(text, output.meter)!.notes;
          expect(
            back.map((n) => `${n.step}:${wrap(lineTone(n, chords, next, output.plan.key), 12)}`),
            `${preset.name} ${seed} ${bar}`,
          ).toEqual(notes.map((n) => `${n.step}:${wrap(n.note, 12)}`));
          bars++;
        }
      }
    expect(bars).toBe(256);
  });

  it('files a line a player plays in the bass’s register under the player’s name, and nothing of a player who plays above it', () => {
    const style: Style = { ...byName('Funk').style, entropy: 0.3 };
    /** A root and a fifth an octave down, on one and three, and a note an octave above the bass's top for Bo. */
    const played: HeardNote[] = range(8).flatMap((bar) => [
      ...[0, 8].map((step, i) => ({
        note: i ? 40 : 33,
        velocity: 100,
        source: 'Ada',
        position: bar * 16 + step,
        end: bar * 16 + step + 4,
      })),
      ...[0, 4, 8].map((step) => ({
        note: step === 4 ? 70 : 36,
        velocity: 100,
        source: 'Bo',
        position: bar * 16 + step,
        end: null,
      })),
    ]);
    const heard = (input: 'heard' | 'bass'): LearnedLayer => {
      const env: TransportEnv = {
        seed: 3,
        start: 1,
        track: holding(style),
        swing: holdingSwing(presetSwing(byName('Funk'))!),
        wish: { tonic: null, mode: 'dorian', melodic: null },
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        bassLines: BASS_REPOSITORY,
        layer: EMPTY_LAYER,
      };
      let carried: TransportCarried | null = transport.initial;
      let waiting = [...played];
      for (let now = env.start - 0.1; ; now += 0.1) {
        const head = carried?.head.step ?? 0;
        const notes = waiting.filter((n) => n.position < head);
        waiting = waiting.filter((n) => n.position >= head);
        carried = transport.advance(env, carried, {
          now,
          until: now + LOOKAHEAD,
          [input]: notes,
        }).carried!;
        if (carried.head.step > clockOfTransport(carried).barStart(9))
          return carried.source.plans.layer!;
      }
    };
    for (const input of ['heard', 'bass'] as const) {
      const layer = heard(input);
      const lines = layer.filed.filter((f) =>
        f.fragment.association.some((p) => p.facet === 'bass'),
      );
      expect(
        lines.map((f) => [f.fragment.id, f.meta.source]),
        input,
      ).toEqual([['Ada song 3, bar 0', 'Ada']]);
      const read = BASS_REPOSITORY.read('Ada song 3, bar 0', METERS['4/4'], layer)!;
      expect(read.notes.map((n) => n.step)).toEqual([0, 8]);
    }
  });
});

describe('the composer tires of a line: varies it by cells’ pitched operators, then rejects it (#423)', () => {
  const run = play(10 * SECTION_BARS, { ...byName('Synth-pop').style, entropy: 1 });
  const lines = linesOf(run);
  const layer = run.at(-1)!.carried.plans.layer!;

  it('plays the preset’s line 3 sections at entropy 1, a variation of it the next 3, then rejects both and takes the next nearest', () => {
    expect(lines.slice(0, 6)).toEqual([
      'root bass',
      'root bass',
      'root bass',
      'composer song 1, bar 24 2',
      'composer song 1, bar 24 2',
      'composer song 1, bar 24 2',
    ]);
    expect(lines.slice(6, 9)).toEqual(['funk bass', 'funk bass', 'funk bass']);
  });

  it('files the variation by the composer, naming the line it varies and the operator, and never moves the root on the downbeat', () => {
    const v = layer.filed.find((f) => f.fragment.id === 'composer song 1, bar 24 2')!;
    expect(v.meta[VARIES]).toBe('root bass');
    expect(v.meta.source).toBe(COMPOSER);
    expect(v.meta[BY]).toMatch(/^(transpose &bassline -?[12]|invert &bassline|reverse &bassline)$/);
    expect(v.meta.tags).toEqual([LINE_TAG]);
    const read = BASS_REPOSITORY.read(v.fragment.id, METERS['4/4'], layer)!;
    expect(read.notes[0]).toEqual({ step: 0, chord: 0, index: 0, alter: 0, shift: 0 });
    expect(read.notes).not.toEqual(BASS_REPOSITORY.read('root bass', METERS['4/4'])!.notes);
  });

  it('climbs with no layer to file in no rung: the preset’s line every section', () => {
    const none = play(
      10 * SECTION_BARS,
      { ...byName('Synth-pop').style, entropy: 1 },
      { layer: undefined },
    );
    expect(new Set(linesOf(none))).toEqual(new Set(['root bass']));
  });
});
