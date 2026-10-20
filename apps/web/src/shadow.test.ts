// @vitest-environment node
import {
  type HeardNote,
  INITIAL_STYLE,
  LOOKAHEAD,
  METER_REPOSITORY,
  PRESETS,
  RHYTHM_REPOSITORY,
  SECTION_BARS,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  clockOfTransport,
  glideTo,
  holding,
  holdingSwing,
  rebeat,
  swingTo,
  transport,
} from '@jambot/engine';
import { type Station, onward, tuneIn } from '@jambot/session';
import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { conductRadio, radioStyle } from './conductor.ts';
import { ONSET_BOUND, type Plays, Shadow, type ShadowReadout, playsFrom } from './shadow.ts';

const START = 1;
const TICK = 0.025;

/** What a run did: the shadow's readout, the band's events and the events played. */
interface Run {
  readout: ShadowReadout;
  band: TimedEvent[];
  played: TimedEvent[];
}

/**
 * The band through its own transport, as the player runs it, with the
 * shadow beside it: a tick every 25 ms for `bars` bars; with a station, the
 * radio walks the track at each section's start as the player's does
 * (`#walkRadio`), and the shadow reads its walk to come (`envFrom`).
 * `control` may move a control at a tick: it returns the environment from
 * then on.
 */
function run({
  preset = PRESETS[0]!,
  seed = 1,
  bars = 24,
  station = null,
  plays = 'band',
  edit,
  control,
  meddle,
  finishAt,
  meter = '4/4',
  heard = [],
  repositories = false,
}: {
  preset?: (typeof PRESETS)[number];
  seed?: number;
  bars?: number;
  station?: Station | null;
  plays?: Plays;
  edit?: (text: string) => string;
  control?: (env: TransportEnv, carried: TransportCarried) => TransportEnv;
  meddle?: (events: readonly TimedEvent[]) => TimedEvent[];
  /** The bar composing which the song is asked to end on. */
  finishAt?: number;
  /** The meter asked for, which the song opens in, the track's bpm counting its beats. */
  meter?: '4/4' | '7/8' | '6/8' | '3/4' | '5/4';
  /** Notes a player plays, each arriving on the first tick that has laid its step. */
  heard?: readonly HeardNote[];
  /** Whether the composer asks cells' repositories for each section's meter and rhythm, as the app's does, the meter then asked for none. */
  repositories?: boolean;
}): Run {
  const shadow = new Shadow(() => performance.now(), plays, edit);
  let env: TransportEnv = {
    seed,
    start: START,
    track: rebeat(holding({ ...preset.style, entropy: 0.3 }), METERS['4/4'], METERS[meter]),
    swing: holdingSwing(preset.swing),
    wish: { tonic: null, mode: preset.mode, melodic: null },
    tempoMeter: METERS[meter],
    ...(repositories
      ? { repository: METER_REPOSITORY, rhythms: RHYTHM_REPOSITORY }
      : { meter: METERS[meter] }),
  };
  let radio = station;
  let nudge = 0;
  let carried: TransportCarried | null = null;
  const band: TimedEvent[] = [];
  const played: TimedEvent[] = [];
  const walk = (on: Station, first: number, c: TransportCarried, from: TransportEnv) => {
    const walked = onward(on, radioStyle(from.track, nudge));
    const at = Math.max(c.head.step, clockOfTransport(c).barStart(first));
    return { walked, conducted: conductRadio(from.track, walked.style, at, nudge) };
  };
  const laid = new Set<number>();
  let waiting = [...heard];
  for (let now = START - TICK; ; now += TICK) {
    const laidWith = env;
    const finish = finishAt !== undefined && (carried?.nextBar ?? 0) >= finishAt;
    const arrived = waiting.filter((n) => laid.has(Math.floor(n.position)));
    waiting = waiting.filter((n) => !arrived.includes(n));
    const next = transport.advance(env, carried, {
      now,
      until: now + LOOKAHEAD,
      finish,
      heard: arrived,
    });
    carried = next.carried!;
    for (const step of next.output.steps) laid.add(step.step);
    for (const { bar } of next.output.composed)
      if (radio && bar > 0 && bar % SECTION_BARS === 0) {
        const { walked, conducted } = walk(radio, bar, carried, env);
        radio = walked.station;
        nudge = conducted.nudge;
        env = { ...env, track: conducted.track };
      }
    if (control) env = control(env, carried);
    const c = carried;
    const output = meddle ? { ...next.output, events: meddle(next.output.events) } : next.output;
    band.push(...output.events);
    played.push(
      ...shadow.tick({
        env: laidWith,
        next: env,
        carried,
        output,
        now,
        envFrom: (first) =>
          radio ? { ...env, track: walk(radio, first, c, env).conducted.track } : env,
      }),
    );
    if (carried.nextBar > bars + 1 || carried.finale.ended !== null) break;
  }
  return { readout: shadow.readout, band, played };
}

const NONE = {
  written: 0,
  harmony: 0,
  unmatched: 0,
  onsets: 0,
  extra: 0,
  velocity: 0,
  length: 0,
};

/** Every event the band's outputs play, against the band's own: the same note on the same step, its onset within 1 ms, and its velocity and sounding length the band's, its duration within a microsecond. */
function playsAsTheBand(band: readonly TimedEvent[], played: readonly TimedEvent[]) {
  const key = (e: TimedEvent) => `${e.bar} ${e.event.part} ${e.event.step} ${e.event.note}`;
  const sorted = (es: readonly TimedEvent[]) => [...es].sort((a, b) => (key(a) < key(b) ? -1 : 1));
  const [b, c] = [sorted(band), sorted(played)];
  expect(c.map(key)).toEqual(b.map(key));
  for (const [i, e] of c.entries()) {
    const own = b[i]!;
    expect(Math.abs(e.seconds - own.seconds)).toBeLessThan(ONSET_BOUND);
    expect(e.event.velocity).toBe(own.event.velocity);
    expect(e.event.gain).toBe(own.event.gain);
    expect(e.event.length).toBeCloseTo(own.event.length, 9);
    expect(Math.abs(e.duration - own.duration)).toBeLessThan(1e-6);
  }
}

/** A motif a player plays in `bar`, on its steps 0, 4, 8 and 12, each at its own velocity: offered with accents, their mean's distance, from bar + 2 on. */
const motifIn = (bar: number, velocities = [110, 70, 95, 60]): HeardNote[] =>
  [69, 72, 76, 74].map((note, i) => ({
    note,
    velocity: velocities[i]!,
    source: 'the computer keys',
    position: 16 * bar + 4 * i,
    end: null,
  }));

describe('the band through cells, in shadow (#399)', () => {
  it.each(PRESETS.map((p) => [p.name, p] as const))(
    'plays %s held, 3 sections, as the band does: every written note and chord, every onset within 1 ms on the transport’s clock and on cells’ own',
    (_, preset) => {
      const { readout } = run({ preset });
      expect(readout.errors).toEqual([]);
      expect(readout.mismatched).toEqual(NONE);
      expect(readout.bars).toBeGreaterThanOrEqual(24);
      expect(readout.notes).toBeGreaterThan(24 * 4);
      expect(readout.onsets.timed).toBeGreaterThan(24 * 4);
      expect(readout.onsets.within).toBe(readout.onsets.timed);
      expect(readout.ownClock.within).toBe(readout.ownClock.timed);
      expect(readout.ownClock.largest).toBeLessThan(ONSET_BOUND);
      expect(readout.gaps).toEqual({});
      // Section 0 is written as the song starts, the rest ahead, at the middle of the section before; none again.
      expect(readout.texts).toEqual({ ahead: 3, fresh: 1, again: 0 });
    },
  );

  it.each(['7/8', '6/8', '3/4', '5/4'] as const)(
    'plays Synth-pop held in %s, 3 sections, as the band does',
    (meter) => {
      const { readout } = run({ meter });
      expect(readout.errors).toEqual([]);
      expect(readout.mismatched).toEqual(NONE);
      expect(readout.gaps).toEqual({});
      expect(readout.onsets.within).toBe(readout.onsets.timed);
      expect(readout.ownClock.within).toBe(readout.ownClock.timed);
      expect(readout.texts.again).toBe(0);
    },
  );

  it('follows the radio’s walk, a section at a time at entropy 0.3: the walk to come is in the forecast, and cells’ events ride the transport’s gliding tempo; on its own clock, one tempo a text, they drift', () => {
    const { readout } = run({ station: tuneIn(7), bars: 40 });
    expect(readout.errors).toEqual([]);
    expect(readout.mismatched).toEqual(NONE);
    expect(readout.texts.again).toBe(0);
    expect(readout.onsets.within).toBe(readout.onsets.timed);
    expect(readout.onsets.timed).toBeGreaterThan(40 * 4);
    expect(readout.ownClock.largest).toBeGreaterThan(ONSET_BOUND);
  });

  it('writes a section again from a bar composed otherwise than foreseen: a control moved mid-section, and nothing differs', () => {
    let moved = false;
    const { readout } = run({
      control: (env, carried) => {
        if (moved || carried.nextBar !== 11) return env;
        moved = true;
        return {
          ...env,
          track: glideTo(env.track, { energy: 0.95, artic: 0.9 }, carried.head.step, 0),
        };
      },
    });
    expect(moved).toBe(true);
    expect(readout.texts.again).toBeGreaterThan(0);
    expect(readout.mismatched).toEqual(NONE);
  });

  it('counts apart a swing that glides: the bars its share moves in are a gap with their reason, and the switch plays the band’s own there', () => {
    let moved = false;
    const swung = PRESETS.find((p) => p.swing.share !== 0.5)!;
    const { readout, band, played } = run({
      plays: 'cells',
      control: (env, carried) => {
        if (moved || carried.nextBar !== 6) return env;
        moved = true;
        return { ...env, swing: swingTo(env.swing!, swung.swing, carried.head.step, 8 * 16) };
      },
    });
    expect(readout.mismatched).toEqual(NONE);
    expect(Object.keys(readout.gaps).join()).toMatch(/swing moves/);
    expect(readout.played.band).toBeGreaterThan(0);
    expect(played).toHaveLength(band.length);
  });

  it.each(PRESETS.map((p) => [p.name, p] as const))(
    'with the switch on, plays %s through cells as the band plays it: the same notes on the same steps, each within 1 ms, with the performer’s feel, its velocities and sounding lengths the band’s own (#405)',
    (_, preset) => {
      const { readout, band, played } = run({ plays: 'cells', preset });
      expect(readout.played.band).toBe(0);
      expect(readout.played.cells).toBe(band.length);
      expect(readout.mismatched).toEqual(NONE);
      expect(readout.lengths.within).toBe(readout.lengths.timed);
      playsAsTheBand(band, played);
    },
  );

  it('plays a motif a player offers through cells as the band plays it, each note’s accent on the lead’s level (#405)', () => {
    const { readout, band, played } = run({ plays: 'cells', heard: motifIn(2), bars: 16 });
    expect(readout.errors).toEqual([]);
    expect(readout.mismatched).toEqual(NONE);
    expect(readout.gaps).toEqual({});
    const lead = band.filter((e) => e.event.part === 'lead' && e.event.accent !== undefined);
    expect(lead.length).toBeGreaterThan(8);
    playsAsTheBand(band, played);
  });

  it.each(PRESETS.filter((p) => p.swing.share !== 0.5).map((p) => [p.name, p] as const))(
    'with the switch on, plays %s through cells as the band plays it while its swing’s level turns each section: each note’s end swings as the transport swings the band’s (#405)',
    (_, preset) => {
      const { readout, band, played } = run({
        plays: 'cells',
        preset: { ...preset, style: { ...preset.style, artic: 0 } },
        bars: 40,
        control: (env, carried) =>
          carried.nextBar % SECTION_BARS === SECTION_BARS / 2
            ? {
                ...env,
                swing: swingTo(
                  env.swing!,
                  { level: (carried.nextBar / SECTION_BARS) % 2 < 1 ? '16n' : '8n' },
                  carried.head.step,
                  0,
                ),
              }
            : env,
      });
      expect(readout.errors).toEqual([]);
      expect(readout.mismatched).toEqual(NONE);
      playsAsTheBand(band, played);
    },
  );

  it('with the switch on, ends a note that runs into the next section, whose swing’s level turned, as the transport ends the band’s: by the next bar’s swing once it is composed (#405)', () => {
    let crossing = 0;
    const { readout, band, played } = run({
      plays: 'cells',
      // Stabs held long, past the bar's end (articulation 0.1).
      preset: (({ style, ...p }) => ({ ...p, style: { ...style, artic: 0.1 } }))(
        PRESETS.find((p) => p.name === 'Swing jazz')!,
      ),
      seed: 2,
      meter: '3/4',
      bars: 32,
      control: (env, carried) =>
        carried.nextBar % SECTION_BARS === 3
          ? {
              ...env,
              swing: swingTo(
                env.swing!,
                { level: Math.floor(carried.nextBar / SECTION_BARS) % 2 ? '8n' : '16n' },
                carried.head.step,
                0,
              ),
            }
          : env,
    });
    for (const e of band) if (e.event.step + e.event.length > 12) crossing++;
    expect(crossing).toBeGreaterThan(0);
    expect(readout.mismatched).toMatchObject({ velocity: 0, length: 0, onsets: 0, unmatched: 0 });
    expect(readout.lengths.largest).toBeLessThan(1e-9);
    playsAsTheBand(band, played);
  });

  it('plays a motif accented past MIDI’s 127 on the lead’s level through cells as the band plays it: the composer clamps the level before the feel, so the text states what is played (#433)', () => {
    // Accents 48, -19, 21 and -49 from their mean, 79: the first would land at 139 on the lead's level, and is composed at
    // 127; and 1 against a mean of 95.5, an accent of -94.5, below 1, composed at 1.
    for (const velocities of [
      [127, 60, 100, 30],
      [1, 127, 127, 127],
    ]) {
      const { readout, band, played } = run({
        plays: 'cells',
        heard: motifIn(2, velocities),
        bars: 16,
      });
      expect(readout.errors).toEqual([]);
      expect(readout.mismatched).toEqual(NONE);
      expect(readout.gaps).toEqual({});
      expect(readout.played.band).toBe(0);
      const lead = band.filter((e) => e.event.part === 'lead' && e.event.accent !== undefined);
      expect(lead.length).toBeGreaterThan(8);
      playsAsTheBand(band, played);
    }
  });

  it('counts the song’s last bar apart, its last chord ringing past the text’s end, and the switch plays the band’s own there', () => {
    const { readout, band, played } = run({ plays: 'cells', finishAt: 6, bars: 16 });
    expect(readout.mismatched).toEqual(NONE);
    expect(Object.entries(readout.gaps)).toEqual([
      [expect.stringMatching(/finale's ring/), expect.objectContaining({ bars: 1 })],
    ]);
    expect(readout.texts.again).toBe(1);
    expect(played).toHaveLength(band.length);
  });

  it('is silent by default: with the switch off it hands back the band’s own events, the very array', () => {
    const shadow = new Shadow(() => 0);
    const events: TimedEvent[] = [];
    const output = { steps: [], events, composed: [], missed: 0, judged: [], dropped: [] };
    const env = {
      seed: 1,
      start: 0,
      track: holding(INITIAL_STYLE),
      wish: { tonic: null, mode: 'ionian' as const, melodic: null },
    };
    expect(shadow.tick({ env, carried: null as never, output, now: 0 })).toBe(events);
  });

  it('finds what it checks: a lead note moved in the text is a written mismatch, an onset 2 ms late or a note the band plays that cells lacks is an onset’s', () => {
    const moved = run({
      edit: (t) => t.replace(/(&lead over=\S+ step=16n(?: legato=\S+)? )(\S+)/, '$1~ $2'),
      bars: 8,
    });
    expect(moved.readout.mismatched.written).toBeGreaterThan(0);
    const late = run({
      bars: 8,
      meddle: (es) => es.map((e) => (e.bar === 3 ? { ...e, seconds: e.seconds + 0.002 } : e)),
    });
    expect(late.readout.mismatched.onsets).toBeGreaterThan(0);
    const extra = run({
      bars: 8,
      meddle: (es) => [
        ...es,
        ...es
          .filter((e) => e.bar === 2)
          .map((e) => ({ ...e, event: { ...e.event, note: e.event.note + 1 } })),
      ],
    });
    expect(extra.readout.mismatched.unmatched).toBeGreaterThan(0);
  });

  it('finds the feel played otherwise: a velocity one louder, or a note sounding shorter, as the band plays it is a mismatch as played (#405)', () => {
    const louder = run({
      bars: 8,
      meddle: (es) =>
        es.map((e) =>
          e.bar === 3 ? { ...e, event: { ...e.event, velocity: e.event.velocity + 1 } } : e,
        ),
    });
    expect(louder.readout.mismatched.velocity).toBeGreaterThan(0);
    expect(louder.readout.differing[0]).toMatch(/^bar 3 \w+ step \d+ note \d+: band \d+, /);
    expect(louder.readout.mismatched.length).toBe(0);
    const shorter = run({
      bars: 8,
      meddle: (es) =>
        es.map((e) =>
          e.bar === 3
            ? {
                ...e,
                duration: e.duration * 0.9,
                event: { ...e.event, length: e.event.length * 0.9 },
              }
            : e,
        ),
    });
    expect(shorter.readout.mismatched.length).toBeGreaterThan(0);
    expect(shorter.readout.mismatched.velocity).toBe(0);
  });
});

describe('the switch (#399)', () => {
  it('is off by default, set by `?play=cells` in the address, or by the build where the address says nothing', () => {
    expect(playsFrom('', undefined)).toBe('band');
    expect(playsFrom('?play=cells', undefined)).toBe('cells');
    expect(playsFrom('?x=1&play=cells', undefined)).toBe('cells');
    expect(playsFrom('', 'cells')).toBe('cells');
    expect(playsFrom('?play=band', 'cells')).toBe('band');
    expect(playsFrom('?play=strudel', undefined)).toBe('band');
  });
});
