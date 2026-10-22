// @vitest-environment node
import {
  type ComposerMode,
  presetMode,
  CLAVES_NOTE,
  DRUM_NOTES,
  type HeardNote,
  type LateEvent,
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
  transportOver,
  type MeterSwing,
  presetSwing,
} from '@jambot/engine';
import {
  type FollowCarried,
  type SectionText,
  type SentBar,
  type Station,
  followSource,
  onward,
  sentBars,
  tuneIn,
} from '@jambot/session';
import { METERS, type MeterName } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { conductRadio, radioStyle } from './conductor.ts';
import { type SectionTexts, inlineTexts, playText, stateSection } from './section-texts.ts';
import { ONSET_BOUND, type Plays, Shadow, type ShadowReadout, playsFrom } from './shadow.ts';

const START = 1;
const TICK = 0.025;

/** What a run did: the shadow's readout, the band's events and the events played. */
interface Run {
  readout: ShadowReadout;
  band: TimedEvent[];
  played: TimedEvent[];
  /** What the outputs would have played and the clock passed: dropped late (#462). */
  late: LateEvent[];
}

/**
 * A client following the host of a run (#446): how long the link takes each way, how long its own texts take to
 * compile and play (the host's where none is said), and from which bar it joins, with the welcome's texts.
 */
interface Following {
  readonly link: number;
  readonly delay?: number;
  readonly joins?: number;
  /** Where the client's page ticks nothing, on the clock, from and to, in seconds (#462). */
  readonly stall?: readonly [number, number];
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
  swing = presetSwing(preset)!,
  mode = presetMode(preset)!,
  seed = 1,
  bars = 24,
  station = null,
  plays = 'cells',
  edit,
  control,
  meddle,
  finishAt,
  meter = '4/4',
  heard = [],
  repositories = false,
  delay,
  countIn = 0,
  follow,
}: {
  preset?: (typeof PRESETS)[number];
  /** The meter's swing held: the one the repository finds at the preset's point, unless a test moves the point off it. */
  swing?: MeterSwing;
  /** The mode wished for: the one the repository finds at the preset's point, unless a test moves the point off it. */
  mode?: ComposerMode;
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
  meter?: MeterName;
  /** Notes a player plays, each arriving on the first tick that has laid its step. */
  heard?: readonly HeardNote[];
  /** Whether the composer asks cells' repositories for each section's meter and rhythm, as the app's does, the meter then asked for none. */
  repositories?: boolean;
  /** How long a text takes to arrive once asked, in seconds on the clock, as from a worker; none answers at once, on the thread that asks. */
  delay?: number;
  /** How long before the song's first step the transport starts ticking, in seconds: the count-in. */
  countIn?: number;
  /** A client following the host over a link, its band playing through cells as the host's does or not (`plays`). */
  follow?: Following;
}): Run & { client?: Run } {
  let clock = 0;
  const due: { at: number; deliver: () => void }[] = [];
  const texts = (delay?: number): SectionTexts =>
    delay === undefined
      ? inlineTexts(edit)
      : {
          begin() {},
          end() {},
          ask(bars, answer) {
            // Copied as `postMessage` copies them, and stated where the worker would: off the page's time.
            const copy = structuredClone(bars);
            due.push({
              at: clock + delay,
              deliver: () => answer(structuredClone(stateSection(copy, edit))),
            });
          },
          play(given, answer) {
            const copy = structuredClone(given);
            due.push({ at: clock + delay, deliver: () => answer(structuredClone(playText(copy))) });
          },
        };
  const shadow = new Shadow(() => performance.now(), plays, texts(delay));
  shadow.reset();
  // The client: the host's bars and texts over the link, on a transport of its own in the host's time.
  const follower = transportOver(followSource);
  const theirs = follow && new Shadow(() => performance.now(), plays, texts(follow.delay ?? delay));
  theirs?.reset(plays === 'cells' ? 'given' : 'none');
  const client = { band: [] as TimedEvent[], played: [] as TimedEvent[], late: [] as LateEvent[] };
  let followed: TransportCarried<FollowCarried> | null = null;
  let inbox: SentBar[] = [];
  let ends: number | undefined;
  let joined = false;
  const send = (deliver: () => void) =>
    follow && due.push({ at: clock + follow.link, deliver: () => joined && deliver() });
  shadow.told = (text: SectionText) => send(() => theirs!.given(structuredClone(text)));
  let env: TransportEnv = {
    seed,
    start: START,
    track: rebeat(holding({ ...preset.style, entropy: 0.3 }), METERS['4/4'], METERS[meter]),
    swing: holdingSwing(swing),
    wish: { tonic: null, mode, melodic: null },
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
  const late: LateEvent[] = [];
  const walk = (on: Station, first: number, c: TransportCarried, from: TransportEnv) => {
    const walked = onward(on, radioStyle(from.track, nudge));
    const at = Math.max(c.head.step, clockOfTransport(c).barStart(first));
    return { walked, conducted: conductRadio(from.track, walked.style, at, nudge) };
  };
  const laid = new Set<number>();
  let waiting = [...heard];
  for (let now = START - countIn - TICK; ; now += TICK) {
    clock = now;
    for (const d of due.filter((d) => d.at <= now)) {
      due.splice(due.indexOf(d), 1);
      d.deliver();
    }
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
    if (follow && !joined && carried.nextBar > (follow.joins ?? 0)) {
      // A client joins: its welcome, the bars not yet played and the texts that state them, over the link.
      const c = carried;
      const welcome = structuredClone({
        bars: sentBars(c.bars, [], c.head, env.track, clockOfTransport(c), env.tempoMeter),
        texts: shadow.toldFrom(clockOfTransport(c).barAt(c.head.step)),
      });
      joined = true;
      send(() => {
        inbox.push(...welcome.bars);
        for (const text of welcome.texts) theirs!.given(text, true);
      });
    }
    if (follow && joined) {
      const bars = sentBars(
        next.output.composed,
        next.output.steps,
        carried.head,
        env.track,
        clockOfTransport(carried),
        env.tempoMeter,
      );
      const finale = carried.finale.bar;
      send(() => {
        inbox.push(...structuredClone(bars));
        if (finale !== null) ends = finale;
      });
    }
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
    const playing = shadow.tick({
      env: laidWith,
      next: env,
      carried,
      output,
      now,
      envFrom: (first) =>
        radio ? { ...env, track: walk(radio, first, c, env).conducted.track } : env,
    });
    played.push(...playing.events);
    late.push(...playing.lateEvents);
    const stalled = follow?.stall && now >= follow.stall[0] && now < follow.stall[1];
    if (theirs && joined && !stalled) {
      const f = follower.advance(laidWith, followed, {
        now,
        until: now + LOOKAHEAD,
        arrived: inbox,
        ends,
      });
      inbox = [];
      followed = f.carried;
      client.band.push(...f.output.events);
      const playing = theirs.follow({ env: laidWith, carried: followed!, output: f.output, now });
      client.played.push(...playing.events);
      client.late.push(...playing.lateEvents);
    }
    if (carried.nextBar > bars + 1 || carried.finale.ended !== null) break;
  }
  return {
    readout: shadow.readout,
    band,
    played,
    late,
    ...(theirs && { client: { readout: theirs.readout, ...client } }),
  };
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
      expect(readout.texts).toEqual({ ahead: 3, fresh: 1, again: 0, given: 0, joined: 0, told: 4 });
    },
  );

  it.each(['Funk', 'Bossa nova'])(
    'with the switch on, plays %s held from cells’ repositories, 3 sections, as the band does: its clave on the claves (75), beside the rim on a step they share (cells v0.7.0)',
    (name) => {
      const preset = PRESETS.find((p) => p.name === name)!;
      const { readout, band, played } = run({ preset, repositories: true, plays: 'cells' });
      const drums = (note: number) =>
        new Set(
          band
            .filter((e) => e.event.part === 'drums' && e.event.note === note)
            .map((e) => `${e.bar} ${e.event.step}`),
        );
      const claves = drums(CLAVES_NOTE);
      expect(claves.size).toBeGreaterThan(0);
      expect([...drums(DRUM_NOTES.rim)].some((at) => claves.has(at))).toBe(true);
      expect(readout.errors).toEqual([]);
      expect(readout.mismatched).toEqual(NONE);
      expect(readout.gaps).toEqual({});
      expect(readout.played.band).toBe(0);
      playsAsTheBand(band, played);
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
    const swung = PRESETS.find((p) => presetSwing(p)!.share !== 0.5)!;
    const { readout, band, played } = run({
      plays: 'cells',
      control: (env, carried) => {
        if (moved || carried.nextBar !== 6) return env;
        moved = true;
        return {
          ...env,
          swing: swingTo(env.swing!, presetSwing(swung)!, carried.head.step, 8 * 16),
        };
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

  it.each(PRESETS.filter((p) => presetSwing(p)!.share !== 0.5).map((p) => [p.name, p] as const))(
    'with the switch on, plays %s through cells as the band plays it while its swing’s level turns each section: each note’s end swings as the transport swings the band’s (#405)',
    (_, preset) => {
      const { readout, band, played } = run({
        plays: 'cells',
        preset: { ...preset, style: { ...preset.style, artic: 0 } },
        swing: presetSwing(preset)!,
        mode: presetMode(preset)!,
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
      swing: presetSwing(PRESETS.find((p) => p.name === 'Swing jazz')!)!,
      mode: presetMode(PRESETS.find((p) => p.name === 'Swing jazz')!)!,
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

  it('is silent with the switch off (`?play=band`): it hands back the band’s own output, the very object', () => {
    const shadow = new Shadow(() => 0, 'band');
    const events: TimedEvent[] = [];
    const output = {
      steps: [],
      events,
      lateEvents: [],
      passedSteps: [],
      composed: [],
      missed: 0,
      judged: [],
      dropped: [],
    };
    const env = {
      seed: 1,
      start: 0,
      track: holding(INITIAL_STYLE),
      wish: { tonic: null, mode: 'ionian' as const, melodic: null },
    };
    expect(shadow.tick({ env, carried: null as never, output, now: 0 })).toBe(output);
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

/** Every meter the band plays: those `METERS` names, which hold each of cells' meter fragments the band plays (`METER_REPOSITORY`). */
const EVERY_METER = Object.keys(METERS) as MeterName[];

describe('the band through cells in every meter it plays (#432)', () => {
  it.each(EVERY_METER)(
    'in %s, with the switch on, plays each preset held, seeds 1 and 2, 26 bars, as the band does: every written note and chord, and with the feel every velocity and sounding length; pulses all of 3 stated straight (#438), and of 2 and of 3 on an 8n swing their pairs alone (yggi/cells decision 053, #451), so no bar is a gap',
    (meter) => {
      for (const preset of PRESETS)
        for (const seed of [1, 2]) {
          const { readout, band, played } = run({ preset, seed, meter, plays: 'cells' });
          expect(readout.errors).toEqual([]);
          expect(readout.mismatched).toEqual(NONE);
          expect(readout.gaps).toEqual({});
          expect(readout.bars).toBe(26);
          expect(readout.played.band).toBe(0);
          expect(readout.onsets.within).toBe(readout.onsets.timed);
          expect(readout.lengths.within).toBe(readout.lengths.timed);
          playsAsTheBand(band, played);
        }
    },
  );

  it.each(['3/4', '5/4', '6/8', '7/8'] as const)(
    'in %s, with the switch on, plays a preset whose swing’s level turns to 8n mid-song as the band does: pulses of 2 and of 3 eighths then their pairs alone, no gap (#451)',
    (meter) => {
      const { readout, band, played } = run({
        plays: 'cells',
        preset: PRESETS.find((p) => p.name === 'Deep house')!,
        meter,
        bars: 32,
        control: (env, carried) =>
          carried.nextBar === SECTION_BARS + SECTION_BARS / 2
            ? { ...env, swing: swingTo(env.swing!, { level: '8n' }, carried.head.step, 0) }
            : env,
      });
      expect(readout.errors).toEqual([]);
      expect(readout.mismatched).toEqual(NONE);
      expect(readout.gaps).toEqual({});
      playsAsTheBand(band, played);
    },
  );

  it.each(['6/8', '9/8', '12/8'] as const)(
    'in %s, with the switch on, plays an 8n swing whose share glides within bars as the band does, stated straight: no pulse of 2 eighths swings there (T16, #438)',
    (meter) => {
      let moved = false;
      const { readout, band, played } = run({
        plays: 'cells',
        preset: PRESETS.find((p) => p.name === 'Swing jazz')!,
        meter,
        control: (env, carried) => {
          if (moved || carried.nextBar !== 6) return env;
          moved = true;
          return { ...env, swing: swingTo(env.swing!, { share: 0.55 }, carried.head.step, 8 * 16) };
        },
      });
      expect(moved).toBe(true);
      expect(readout.errors).toEqual([]);
      expect(readout.mismatched).toEqual(NONE);
      expect(readout.gaps).toEqual({});
      expect(readout.played.band).toBe(0);
      playsAsTheBand(band, played);
    },
  );
});

/** A text's way from a worker and back, in seconds: more than three times the 15 ms a text took to build, compile and play in #403's soak. */
const WORKER = 0.05;

/** The count-in, in seconds: a bar at 120 bpm, the transport ticking before the song's first step. */
const COUNT_IN = 2;

describe('a section’s text from a worker (#406)', () => {
  it.each(PRESETS.map((p) => [p.name, p] as const))(
    'with each text arriving 50 ms after it is asked, plays %s held through cells as the band does: every text there before its first bar plays, the first a count-in early and the others a section less a beat',
    (_, preset) => {
      const { readout, band, played } = run({
        plays: 'cells',
        preset,
        delay: WORKER,
        countIn: COUNT_IN,
      });
      expect(readout.errors).toEqual([]);
      expect(readout.mismatched).toEqual(NONE);
      expect(readout.gaps).toEqual({});
      expect(readout.bars).toBeGreaterThanOrEqual(24);
      expect(readout.played.band).toBe(0);
      expect(readout.texts).toEqual({ ahead: 3, fresh: 1, again: 0, given: 0, joined: 0, told: 4 });
      expect(readout.arrival.late).toBe(0);
      const bar = (4 * 60) / preset.style.bpm;
      expect(readout.arrival.least.fresh).toBeGreaterThan(COUNT_IN - 2 * WORKER);
      expect(readout.arrival.least.fresh).toBeLessThan(COUNT_IN + TICK);
      // Asked as the middle bar is composed, a beat before it starts and as far as the lookahead before that: the next section starts four bars and a beat later.
      expect(readout.arrival.least.ahead).toBeGreaterThan(4 * bar - 2 * WORKER);
      expect(readout.arrival.least.ahead).toBeLessThan(4 * bar + bar / 4 + LOOKAHEAD);
      expect(readout.arrival.least.again).toBeNull();
      playsAsTheBand(band, played);
    },
  );

  it('writes a section again from a worker when a bar is composed otherwise than foreseen: there a beat before it plays, less the way, and nothing differs', () => {
    let moved = false;
    const preset = PRESETS[0]!;
    const { readout, band, played } = run({
      plays: 'cells',
      preset,
      delay: WORKER,
      countIn: COUNT_IN,
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
    expect(readout.errors).toEqual([]);
    expect(readout.mismatched).toEqual(NONE);
    expect(readout.gaps).toEqual({});
    expect(readout.played.band).toBe(0);
    expect(readout.arrival.late).toBe(0);
    expect(readout.arrival.least.again).toBeGreaterThan(60 / preset.style.bpm - 2 * WORKER);
    playsAsTheBand(band, played);
  });

  it('plays the band’s own where a text is still on its way as its bar is laid, and counts each such step late, with its reason', () => {
    const { readout, band, played } = run({ plays: 'cells', delay: 2 });
    expect(readout.arrival.late).toBeGreaterThan(0);
    expect(Object.keys(readout.gaps)).toEqual([expect.stringMatching(/on its way/)]);
    expect(readout.played.band).toBeGreaterThan(0);
    expect(readout.played.cells).toBeGreaterThan(0);
    expect(readout.mismatched).toEqual(NONE);
    expect(readout.bars).toBeGreaterThanOrEqual(20);
    playsAsTheBand(band, played);
  });

  it('times the page’s own work for each text apart from the job’s, which a worker does', () => {
    const { readout } = run({ delay: WORKER, countIn: COUNT_IN });
    const asked = readout.texts.ahead + readout.texts.fresh + readout.texts.again;
    expect(readout.cost.main.count).toBe(asked);
    expect(readout.cost.compile.count).toBe(asked);
    expect(readout.cost.main.p50).toBeLessThan(readout.cost.buildCompile.p50);
  });
});

/** A link a client is joined over, one way, in seconds: some 30 ms, a phone on a busy Wi-Fi. */
const LINK = 0.03;

/** Every event a client played against its host's: the same notes on the same steps, each field the host's, its onset and duration within a microsecond. */
function playsAsTheHost(host: readonly TimedEvent[], client: readonly TimedEvent[]) {
  expect(client.length).toBeGreaterThan(0);
  const first = Math.min(...client.map((e) => e.bar));
  playsAsTheBand(
    host.filter((e) => e.bar >= first),
    client,
  );
}

describe('a session through cells: the section’s text on the wire, host to client (#446)', () => {
  it.each(PRESETS.map((p) => [p.name, p] as const))(
    'a client given each of %s’s texts over a link plays the host’s events through cells, every one, each field the host’s: none late, none from the band',
    (_, preset) => {
      const { readout, played, client } = run({
        plays: 'cells',
        preset,
        delay: WORKER,
        countIn: COUNT_IN,
        follow: { link: LINK },
      });
      const theirs = client!.readout;
      expect(readout.played.band).toBe(0);
      expect(theirs.from).toBe('given');
      expect(theirs.errors).toEqual([]);
      expect(theirs.mismatched).toEqual(NONE);
      expect(theirs.gaps).toEqual({});
      expect(theirs.played.band).toBe(0);
      expect(theirs.played.cells).toBe(client!.played.length);
      expect(theirs.bars).toBeGreaterThanOrEqual(24);
      // Every text the host took was told and given, as it took it.
      expect(readout.texts.told).toBe(4);
      expect(theirs.texts).toMatchObject({ given: 4, joined: 0, told: 0 });
      expect(theirs.arrival.late).toBe(0);
      // The first there a count-in before it plays, less the way: the host's worker, the link and the client's worker.
      expect(theirs.arrival.least.given).toBeGreaterThan(COUNT_IN - 2 * WORKER - LINK - TICK);
      playsAsTheHost(played, client!.played);
      playsAsTheBand(client!.band, client!.played);
    },
  );

  it('a client whose page ticks late drops what its cells would have played, and says so: what it played and dropped late are the host’s events, event for event (#462)', () => {
    const key = (e: { bar: number; event: TimedEvent['event'] }) =>
      `${e.bar} ${e.event.part} ${e.event.step} ${e.event.note}`;
    const keys = (es: readonly { bar: number; event: TimedEvent['event'] }[]) => es.map(key).sort();
    // Each text has the bass a step later than the band plays it, so cells' events are not the band's.
    const edit = (text: string) =>
      text.replace(/(&bass over=\S+ step=16n(?: legato=\S+)? )(\S+)/, '$1~ $2');
    // Stalls of 0.2 s drop events in the steps laid late; of 0.45 and 0.7 s whole steps too,
    // at 12 phases across the bars, some across a bar's start.
    let dropped = 0;
    for (let i = 0; i < 12; i++) {
      const from = 5 + i * 0.913;
      const gap = [0.2, 0.45, 0.7][i % 3]!;
      const { played, client, readout } = run({
        plays: 'cells',
        edit,
        delay: WORKER,
        countIn: COUNT_IN,
        follow: { link: LINK, stall: [from, from + gap] },
      });
      const theirs = client!;
      expect(readout.mismatched.written).toBeGreaterThan(0);
      expect(theirs.readout.played.band).toBe(0);
      // Of the bars both played whole, what the client played and dropped is what the host played.
      const last = Math.min(
        ...[played, theirs.played].map((es) => Math.max(...es.map((e) => e.bar))),
      );
      const upTo = <T extends { bar: number }>(es: readonly T[]) => es.filter((e) => e.bar < last);
      expect(keys(upTo([...theirs.played, ...theirs.late]))).toEqual(keys(upTo(played)));
      dropped += theirs.late.length;
    }
    expect(dropped).toBeGreaterThan(10);
  });

  it('a client given the host’s text again, at a bar composed otherwise than foreseen, plays it as the host does: there before it plays, less the way', () => {
    let moved = false;
    const { readout, played, client } = run({
      plays: 'cells',
      delay: WORKER,
      countIn: COUNT_IN,
      follow: { link: LINK },
      control: (env, carried) => {
        if (moved || carried.nextBar !== 11) return env;
        moved = true;
        return {
          ...env,
          track: glideTo(env.track, { energy: 0.95, artic: 0.9 }, carried.head.step, 0),
        };
      },
    });
    const theirs = client!.readout;
    expect(moved).toBe(true);
    expect(readout.texts.again).toBeGreaterThan(0);
    expect(theirs.texts.given).toBe(readout.texts.told);
    expect(theirs.mismatched).toEqual(NONE);
    expect(theirs.gaps).toEqual({});
    expect(theirs.arrival.late).toBe(0);
    expect(theirs.arrival.least.given).toBeGreaterThan(0);
    playsAsTheHost(played, client!.played);
  });

  it('a client whose texts take longer than a beat plays the band’s own where the host’s text again hasn’t come, counted late', () => {
    let moved = false;
    const { readout, played, client } = run({
      plays: 'cells',
      delay: WORKER,
      countIn: COUNT_IN,
      follow: { link: LINK, delay: 0.6 },
      control: (env, carried) => {
        if (moved || carried.nextBar !== 11) return env;
        moved = true;
        return {
          ...env,
          track: glideTo(env.track, { energy: 0.95, artic: 0.9 }, carried.head.step, 0),
        };
      },
    });
    const theirs = client!.readout;
    expect(readout.arrival.late).toBe(0);
    expect(theirs.arrival.late).toBeGreaterThan(0);
    expect(Object.keys(theirs.gaps)).toEqual([expect.stringMatching(/on its way/)]);
    expect(theirs.played.band).toBeGreaterThan(0);
    expect(theirs.mismatched).toEqual(NONE);
    playsAsTheHost(played, client!.played);
  });

  it('a client sent a bar otherwise than its latest text foresaw never plays that text in it: it waits for the host’s text again, as the host does, and plays the band’s own meanwhile', () => {
    let moved = false;
    // The host's worker slower than a beat: its text again comes after the bar it was asked at, on both pages.
    const { readout, played, client } = run({
      plays: 'cells',
      delay: 0.6,
      countIn: COUNT_IN,
      follow: { link: LINK, delay: WORKER },
      control: (env, carried) => {
        if (moved || carried.nextBar !== 11) return env;
        moved = true;
        return {
          ...env,
          track: glideTo(env.track, { energy: 0.95, artic: 0.9 }, carried.head.step, 0),
        };
      },
    });
    const theirs = client!.readout;
    expect(readout.arrival.late).toBeGreaterThan(0);
    expect(theirs.arrival.late).toBeGreaterThan(0);
    expect(theirs.played.band).toBeGreaterThan(0);
    expect(theirs.mismatched).toEqual(NONE);
    expect(theirs.errors).toEqual([]);
    playsAsTheHost(played, client!.played);
  });

  it('a client follows the radio’s walk through cells, a section at a time, as the host plays it', () => {
    const { played, client } = run({
      plays: 'cells',
      station: tuneIn(7),
      bars: 40,
      follow: { link: LINK },
    });
    const theirs = client!.readout;
    expect(theirs.mismatched).toEqual(NONE);
    expect(theirs.gaps).toEqual({});
    expect(theirs.texts.given).toBeGreaterThan(4);
    expect(theirs.played.band).toBe(0);
    playsAsTheHost(played, client!.played);
  });

  it('a client that joins mid-section is given the texts that state the bars not yet played with its welcome, plays them as the host does, and counts none late', () => {
    const { played, client } = run({
      plays: 'cells',
      delay: WORKER,
      countIn: COUNT_IN,
      follow: { link: LINK, joins: 10 },
    });
    const theirs = client!.readout;
    expect(theirs.texts.joined).toBeGreaterThan(0);
    expect(theirs.texts.given).toBeGreaterThan(0);
    expect(theirs.mismatched).toEqual(NONE);
    expect(theirs.arrival.late).toBe(0);
    // Only the first steps, laid while the welcome's texts were on their way, play the band's own, a gap of their own.
    expect(Object.keys(theirs.gaps).every((gap) => /joined/.test(gap))).toBe(true);
    expect(theirs.played.cells).toBeGreaterThan(theirs.played.band);
    playsAsTheHost(played, client!.played);
  });

  it('a host whose band plays its own tells its texts, which a client that plays its own neither asks for nor plays: the very events the transport laid', () => {
    const { readout, played, client } = run({ plays: 'band', follow: { link: LINK } });
    expect(readout.texts.told).toBeGreaterThan(0);
    expect(client!.readout.from).toBe('none');
    expect(client!.readout.texts.given).toBe(0);
    expect(client!.played).toEqual(client!.band);
    playsAsTheHost(played, client!.played);
  });
});

describe('the switch (#399)', () => {
  it('is on by default (#456), turned off by `?play=band` in the address, or by the build where the address says nothing', () => {
    expect(playsFrom('', undefined)).toBe('cells');
    expect(playsFrom('?play=band', undefined)).toBe('band');
    expect(playsFrom('?x=1&play=band', undefined)).toBe('band');
    expect(playsFrom('', 'band')).toBe('band');
    expect(playsFrom('?play=cells', 'band')).toBe('cells');
    expect(playsFrom('?play=strudel', undefined)).toBe('cells');
    expect(playsFrom('', 'strudel')).toBe('cells');
  });
});
