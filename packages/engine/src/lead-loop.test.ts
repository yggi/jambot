import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandCarried, type BandEnv, band } from './band.ts';
import { COMPOSER } from './facet.ts';
import { SECTION_BARS } from './form.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { LEAD_REPOSITORY, leadText } from './lead-lines.ts';
import type { LeadNote } from './lead-query.ts';
import { stylePoint } from './meter-query.ts';
import type { HeardNote } from './muse.ts';
import { SOLOIST, leadOf } from './muse-lead.ts';
import { BY, VARIES } from './novelty.ts';
import { LEAD_TAG } from './plan.ts';
import { METER_REPOSITORY, presetSwing } from './repository.ts';
import { RHYTHM_REPOSITORY } from './rhythms.ts';
import { BASS_REPOSITORY } from './bass-lines.ts';
import { PRESETS, type Style, holding, writtenStyle } from './style.ts';
import { holdingSwing } from './swing.ts';
import { presetMode } from './mode-repository.ts';
import {
  LOOKAHEAD,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  clockOfTransport,
  transport,
} from './transport.ts';

const range = (n: number) => [...Array(n).keys()];
const byName = (name: string) => PRESETS.find((p) => p.name === name)!;
const SYNTH_POP = byName('Synth-pop');

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

/** Each preset held at entropy 0, swung as it is, 2 seeds, with cells' meters and rhythms and an empty layer. */
const held = (extra: Partial<TransportEnv> = {}) =>
  PRESETS.flatMap((preset) =>
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

/** Main's events as `layer.test.ts` and `bass-loop.test.ts` record them: every part, the presets held at entropy 0. */
const MAIN_STILL = [15612, '32d83dee'] as const;

describe('the lead in the loop with nothing filed plays what main plays (#424)', () => {
  const lead = (all: readonly TimedEvent[]) => all.filter((e) => e.event.part === 'lead');

  it('plays every event main plays with the lead lines and an empty layer, nobody playing: 15,612, each to 1e-9 s, over 8 presets × 2 seeds × 32 bars', () => {
    const loop = held({ leads: LEAD_REPOSITORY });
    expect([loop.length, hashOf(loop)]).toEqual(MAIN_STILL);
  });

  it('plays every lead event the bass’s loop plays, with the bass lines beside it', () => {
    const bass = held({ bassLines: BASS_REPOSITORY });
    const both = held({ bassLines: BASS_REPOSITORY, leads: LEAD_REPOSITORY });
    expect([both.length, hashOf(both)]).toEqual([bass.length, hashOf(bass)]);
    expect(lead(both).length).toBeGreaterThan(0);
  });
});

/** The band over `bars` bars at one style, every bar and the carried state after each. */
function play(
  bars: number,
  style: Style,
  extra: Partial<BandEnv> = {},
  seed = 1,
  preset = SYNTH_POP,
) {
  let carried: BandCarried = band.initial;
  return range(bars).map((bar) => {
    const next = band.advance(
      {
        seed,
        bar,
        style,
        swing: presetSwing(preset)!,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        offer: null,
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        leads: LEAD_REPOSITORY,
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

/** Each section's lead line, `-` where the lead plays its own. */
const leadsOf = (run: ReturnType<typeof play>) =>
  range(run.length / SECTION_BARS).map(
    (s) => run[s * SECTION_BARS]!.carried.plans.leadFragment ?? '-',
  );

/** The bars of a run that start a phrase (bar 0 or 4 of a section) of the line `id`, and where the lead plays. */
const phraseStarts = (run: ReturnType<typeof play>, id: string) =>
  range(run.length).filter(
    (b) =>
      b % 4 === 0 &&
      run[b - (b % SECTION_BARS)]!.carried.plans.leadFragment === id &&
      run[b]!.bar.written.some((n) => n.part === 'lead'),
  );

/** A layer's lead lines. */
const leadLines = (layer: LearnedLayer) =>
  layer.filed.filter((f) => f.fragment.association.some((p) => p.facet === 'lead'));

/** Ada's motif in A minor, a bar of it: A C B E D, each held to the next. */
const ADA = [69, 72, 71, 76, 74];
const ADA_STEPS = [0, 4, 6, 8, 12];
/** Ada's motif as a line: degrees from her first note. */
const ADA_LINE: LeadNote[] = [0, 2, 1, 4, 3].map((degree, i) => ({
  step: ADA_STEPS[i]!,
  degree,
  alter: 0,
}));

/**
 * The layer after a song at Synth-pop at entropy 0.3 in which a player played Ada's motif `shift` semitones moved, in
 * the second half of its second section, answering the lead's phrase there, and the 2 sections after.
 */
function song(seed = 3, source = 'Ada', shift = 0): LearnedLayer {
  const sections = 2;
  const played: HeardNote[] = range(SECTION_BARS / 2).flatMap((k) => {
    const bar = SECTION_BARS + SECTION_BARS / 2 + k;
    return ADA.map((note, i) => ({
      note: note + shift,
      velocity: 96,
      source,
      position: bar * 16 + ADA_STEPS[i]!,
      end: bar * 16 + (ADA_STEPS[i + 1] ?? 16),
    }));
  });
  const env: TransportEnv = {
    seed,
    start: 1,
    track: holding({ ...SYNTH_POP.style, entropy: 0.3 }),
    swing: holdingSwing(presetSwing(SYNTH_POP)!),
    wish: { tonic: null, mode: presetMode(SYNTH_POP)!, melodic: null },
    repository: METER_REPOSITORY,
    rhythms: RHYTHM_REPOSITORY,
    leads: LEAD_REPOSITORY,
    layer: EMPTY_LAYER,
  };
  let carried: TransportCarried | null = transport.initial;
  let waiting = [...played];
  for (let now = env.start - 0.1; ; now += 0.1) {
    const head = carried?.head.step ?? 0;
    const heard = waiting.filter((n) => n.position < head);
    waiting = waiting.filter((n) => n.position >= head);
    carried = transport.advance(env, carried, { now, until: now + LOOKAHEAD, heard }).carried!;
    if (carried.head.step > clockOfTransport(carried).barStart((sections + 2) * SECTION_BARS + 1))
      return carried.source.plans.layer!;
  }
}

describe('the Muse files a player’s motif as a lead line, and it comes back in a later song (#424)', () => {
  const layer = song();
  const ada = leadLines(layer).find((f) => f.meta.source === 'Ada')!;

  it('files the motif a player played over a section under the player’s name, as degrees from the first note over the key', () => {
    expect(ada.fragment.id).toBe('Ada song 3, bar 8');
    expect(ada.meta).toEqual({ source: 'Ada', created: 'song 3, bar 8', tags: [LEAD_TAG] });
    expect(ada.fragment.text).toBe(leadText(ADA_LINE, 16));
    expect(ada.fragment.association).toEqual([
      {
        point: stylePoint(writtenStyle({ ...SYNTH_POP.style, entropy: 0.3 })),
        weight: expect.any(Number),
        facet: 'lead',
      },
    ]);
  });

  it('files the lead’s own phrase of that section beside it, which the player answered', () => {
    const own = leadLines(layer).find((f) => f.meta.source === SOLOIST)!;
    expect(own.fragment.id).toBe('soloist song 3, bar 8');
    expect(leadLines(layer).map((f) => f.meta.source)).toEqual([SOLOIST, 'Ada']);
  });

  it('plays it in a later song, from the stored layer after a reload, at a style point near it, within 8 sections at entropy 0.3', () => {
    const reloaded = JSON.parse(JSON.stringify(layer)) as LearnedLayer;
    const near: Style = { ...SYNTH_POP.style, sync: SYNTH_POP.style.sync + 0.05, entropy: 0.3 };
    for (const seed of [5, 6, 7]) {
      const run = play(8 * SECTION_BARS, near, { layer: reloaded }, seed);
      expect(leadsOf(run), `seed ${seed}`).toContain(ada.fragment.id);
      // a phrase's first bar in a section of it plays the motif: its notes on its steps, each its degree from the first
      const starts = phraseStarts(run, ada.fragment.id);
      expect(starts.length, `seed ${seed}`).toBeGreaterThan(0);
      for (const at of starts) {
        const bar = run[at]!.bar;
        expect(
          leadOf(
            bar.written.filter((n) => n.part === 'lead'),
            bar.plan.key,
          ),
        ).toEqual(ADA_LINE);
      }
    }
  });

  it('plays the line as its phrase: the line, a variation, the line again, a variation', () => {
    const run = play(4 * SECTION_BARS, { ...SYNTH_POP.style, entropy: 0.3 }, { layer }, 5);
    const at = phraseStarts(run, ada.fragment.id)[0]!;
    expect(at).toBeDefined();
    const lines = range(4).map((k) => {
      const bar = run[at + k]!.bar;
      return leadOf(
        bar.written.filter((n) => n.part === 'lead'),
        bar.plan.key,
      );
    });
    expect(lines[0]).toEqual(ADA_LINE);
    expect(lines[2]).toEqual(ADA_LINE);
    expect(lines[1]).not.toEqual(ADA_LINE);
  });
});

describe('the lead is the generator on a miss, filed only where the players answered it (#424)', () => {
  it('finds no line with nothing filed, plays its own, and files nothing of it where nobody played', () => {
    const run = play(4 * SECTION_BARS, { ...SYNTH_POP.style, entropy: 0.3 });
    expect(leadsOf(run)).toEqual(['-', '-', '-', '-']);
    expect(leadLines(run.at(-1)!.carried.plans.layer!)).toEqual([]);
  });

  it('files nothing of a player who plays the motif in the bass’s register, three octaves down: a bass line is filed as one', () => {
    expect(leadLines(song(3, 'Bo', -36))).toEqual([]);
  });
});

describe('the composer tires of a lead line: varies it by lift or turn over, then rejects it (#424)', () => {
  const point = stylePoint(writtenStyle({ ...SYNTH_POP.style, entropy: 1 }));
  const seeded = LEAD_REPOSITORY.file!(EMPTY_LAYER, {
    notes: ADA_LINE,
    bench: { meter: METERS['4/4'], meterFragment: '4/4' },
    point,
    source: 'Ada',
    created: 'song 0, bar 0',
    tags: [LEAD_TAG],
  });
  const run = play(10 * SECTION_BARS, { ...SYNTH_POP.style, entropy: 1 }, { layer: seeded.layer });
  const lines = leadsOf(run);
  const layer = run.at(-1)!.carried.plans.layer!;

  it('plays the line 3 sections at entropy 1, a variation of it the next 3, then rejects both', () => {
    expect(lines.slice(0, 3)).toEqual([seeded.id, seeded.id, seeded.id]);
    const variation = lines[3]!;
    expect(variation).not.toBe(seeded.id);
    expect(lines.slice(3, 6)).toEqual([variation, variation, variation]);
    expect(lines.slice(6)).not.toContain(seeded.id);
    expect(lines.slice(6)).not.toContain(variation);
  });

  it('files the variation by the composer, naming the line it varies and the operator: lift or turn over', () => {
    const v = layer.filed.find((f) => f.fragment.id === lines[3])!;
    expect(v.meta[VARIES]).toBe(seeded.id);
    expect(v.meta.source).toBe(COMPOSER);
    expect(v.meta[BY]).toMatch(/^(transpose &lead 2|invert &lead)$/);
    expect(v.meta.tags).toEqual([LEAD_TAG]);
  });
});
