// @vitest-environment node
import {
  INITIAL_STYLE,
  LOOKAHEAD,
  PRESETS,
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
}): Run {
  const shadow = new Shadow(() => performance.now(), plays, edit);
  let env: TransportEnv = {
    seed,
    start: START,
    track: rebeat(holding({ ...preset.style, entropy: 0.3 }), METERS['4/4'], METERS[meter]),
    swing: holdingSwing(preset.swing),
    wish: { tonic: null, mode: preset.mode, melodic: null },
    meter: METERS[meter],
    tempoMeter: METERS[meter],
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
  for (let now = START - TICK; ; now += TICK) {
    const laidWith = env;
    const finish = finishAt !== undefined && (carried?.nextBar ?? 0) >= finishAt;
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD, finish });
    carried = next.carried!;
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

const NONE = { written: 0, harmony: 0, unmatched: 0, onsets: 0, extra: 0 };

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

  it('with the switch on, plays cells’ events in place of the band’s: the same notes on the same steps, each within 1 ms, at the velocity the performer plays at feel 0', () => {
    const { readout, band, played } = run({ plays: 'cells', preset: PRESETS[1]! });
    expect(readout.played.band).toBe(0);
    expect(readout.played.cells).toBe(band.length);
    const key = (e: TimedEvent) => `${e.bar} ${e.event.part} ${e.event.step} ${e.event.note}`;
    const sorted = (es: readonly TimedEvent[]) =>
      [...es].sort((a, b) => (key(a) < key(b) ? -1 : 1));
    const [b, c] = [sorted(band), sorted(played)];
    expect(c.map(key)).toEqual(b.map(key));
    for (const [i, e] of c.entries())
      expect(Math.abs(e.seconds - b[i]!.seconds)).toBeLessThan(ONSET_BOUND);
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
