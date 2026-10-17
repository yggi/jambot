import {
  type HarmonicWeights,
  INITIAL_KEY,
  NO_HISTORY,
  PRESETS,
  type ScheduledStep,
  INITIAL_STYLE,
  RING_STEPS,
  band,
  bandEnvAt,
  countIn,
  countInSeconds,
  foldBar,
  holding,
  lookAhead,
} from '@jambot/engine';
import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import type { Output } from './audio/output.ts';
import { Metronome } from './metronome.svelte.ts';
import { EVEN_MIX, type Mix, withLevel } from './mix.ts';
import { PATTERN_BARS } from './pattern.ts';
import { Player, type Hosting, type Surroundings } from './player.svelte.ts';

/** Surroundings a test drives by hand: the clock, the resume, the ticks and frames. */
function surroundings() {
  const world = {
    currentTime: 0,
    /** The page's clock, in seconds: the audio's, but where a test moves it alone. */
    page: 0,
    latency: 0,
    resumes: 0,
    resolve: () => {},
    played: 0,
    plays: [] as { part: string; note: number; velocity: number; seconds: number }[],
    silenced: 0,
    panics: 0,
    tickers: [] as { tick: () => void; stopped: boolean }[],
    frames: [] as { follow: () => void; stopped: boolean }[],
    seeds: [] as number[],
    steps: [] as ScheduledStep[],
    clicks: [] as { weight: string; seconds: number }[],
  };
  const output: Output = {
    get currentTime() {
      return world.currentTime;
    },
    get latency() {
      return world.latency;
    },
    resume: () => {
      world.resumes++;
      return new Promise<void>((resolve) => (world.resolve = resolve));
    },
    play: (part, note, velocity, seconds) => {
      world.played++;
      world.plays.push({ part, note, velocity, seconds });
    },
    silence: () => void world.silenced++,
    panic: () => void world.panics++,
    tick: (steps) => world.steps.push(...steps),
    click: (weight, seconds) => void world.clicks.push({ weight, seconds }),
  };
  const s: Surroundings = {
    output: () => output,
    ticker(tick) {
      const t = { tick, stopped: false };
      world.tickers.push(t);
      return () => void (t.stopped = true);
    },
    frame(follow) {
      const f = { follow, stopped: false };
      world.frames.push(f);
      return () => void (f.stopped = true);
    },
    seed() {
      world.seeds.push(7 + world.seeds.length);
      return world.seeds.at(-1)!;
    },
    page: () => world.page,
  };
  return { world, s };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('the player', () => {
  it('starts once, however often start is called while the audio clock starts', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    void player.start();
    expect(player.status).toBe('starting');
    world.resolve();
    await settle();
    void player.start();
    await settle();
    expect(player.status).toBe('playing');
    expect(world.resumes).toBe(1);
    expect(world.tickers).toHaveLength(1);
    expect(world.frames).toHaveLength(1);
  });

  it('cancels a start when stopped while the audio clock starts', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    player.stop();
    world.resolve();
    await settle();
    expect(player.status).toBe('stopped');
    expect(world.tickers).toHaveLength(0);
    expect(world.played).toBe(0);
  });

  it('panics the output once it exists, and does nothing before anything could be holding a note', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    player.panicMidi();
    expect(world.panics).toBe(0);
    void player.start();
    world.resolve();
    await settle();
    player.panicMidi();
    expect(world.panics).toBe(1);
  });

  it('plays what the transport schedules, and on stop silences it and stops ticking', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    for (let i = 0; i < 400; i++) {
      world.currentTime += 0.025;
      world.tickers[0]!.tick();
    }
    expect(world.played).toBeGreaterThan(0);
    player.halt();
    expect(player.status).toBe('stopped');
    expect(world.tickers[0]!.stopped).toBe(true);
    expect(world.frames[0]!.stopped).toBe(true);
    expect(world.silenced).toBe(1);
    const played = world.played;
    world.tickers[0]!.tick();
    expect(world.played).toBe(played);
  });

  it('counts its timing while it plays, a stall included, and afresh each song (#27)', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    for (let i = 0; i < 200; i++) {
      // The page stalls half a second at tick 100; its audio stands still for a tick at 150.
      const passed = i === 100 ? 0.5 : 0.025;
      world.page += passed;
      if (i !== 150) world.currentTime += passed;
      world.tickers[0]!.tick();
    }
    const { ticks, margins, laid, missed } = player.timing;
    // The first tick comes as it starts, the rest from the ticker, each timed on the page's clock.
    expect(ticks.count).toBe(200);
    expect(ticks.least).toBeCloseTo(25, 6);
    expect(ticks.most).toBeCloseTo(500, 6);
    expect(margins.count).toBe(world.played);
    expect(laid).toBe(world.steps.length);
    expect(missed).toBeGreaterThan(0);
    player.halt();
    const before = world.steps.length;
    void player.start();
    world.resolve();
    await settle();
    expect(player.timing.laid).toBe(world.steps.length - before);
    expect(player.timing.ticks.count).toBe(0);
    expect(player.timing.missed).toBe(0);
  });

  // Its clock is the test's own, so its time is the CPU's, composing an hour:
  // 2.4 to 3.1 s alone over 10 runs, 6.0 to 7.4 s beside two full test runs,
  // and once past 15 s as one of three full runs started together on the same
  // 4 cores (#320): the web project's timeout (`vitest.config.ts`) is ten times that.
  it('builds up no backlog while no frame shows, as in a hidden tab', async () => {
    // A Worker keeps ticking in a hidden tab, but no animation frame runs.
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    for (let i = 0; i < 3600; i++) {
      world.currentTime += 1;
      world.tickers[0]!.tick();
    }
    expect(player.backlog).toBeLessThan(20);
    world.frames[0]!.follow();
    expect(player.hud.beat).not.toBeNull();
  });

  it("hears a preset's mode from the next section on, and shows the chords (C5)", async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    const heard = new Map<number, string>();
    const chords = new Set<string>();
    const play = (seconds: number) => {
      for (let t = 0; t < seconds; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
        const { bar, beat, chord } = player.hud;
        if (beat !== null && bar) heard.set(bar.bar, bar.key.split(' ')[1]!);
        if (beat !== null && chord) chords.add(chord.symbol);
      }
    };
    // Synth-pop at 108 bpm: a bar is 2.2 s. Deep house is dorian.
    play(3);
    player.apply({ kind: 'preset', preset: PRESETS.find((p) => p.name === 'Deep house')! });
    expect(player.wish).toEqual({ tonic: null, mode: 'dorian', melodic: null });
    play(20);
    for (let bar = 0; bar < 8; bar++) expect(heard.get(bar)).toBe('minor');
    expect(heard.get(8)).toBe('dorian');
    // Synth-pop's first theme starts on A minor, at its harmony a triad or a
    // seventh, and the screen names each chord it hears.
    expect([...chords].some((chord) => /^Am7?$/.test(chord))).toBe(true);
  });

  it('shows the bar the band opens on before the start, as it then plays', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    const before = player.hud;
    expect(before.beat).toBeNull();
    expect(before.bar).toMatchObject({ bar: 0, section: 'Intro', key: 'A minor' });
    // The seven bars after the first.
    expect(before.next.map((b) => b.bar)).toEqual([...Array(7).keys()].map((i) => i + 1));
    void player.start();
    world.resolve();
    await settle();
    for (let i = 0; i < 200 && player.hud.beat === null; i++) {
      world.currentTime += 0.025;
      world.tickers[0]!.tick();
      world.frames[0]!.follow();
    }
    expect(player.hud.beat).toBe(0);
    expect(player.hud.bar).toEqual(before.bar);
    expect(player.hud.chord).toEqual(before.chord);
  });

  it('shows bars ahead that are the bars then heard, the seven after the bar heard', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    const foreseen = new Map<number, unknown[]>();
    const heard = new Map<number, unknown>();
    for (let t = 0; t < 40; t += 0.025) {
      world.currentTime += 0.025;
      world.tickers[0]!.tick();
      world.frames[0]!.follow();
      const { bar, beat, next } = player.hud;
      if (beat === null) continue;
      if (!bar) throw new Error(`no bar for the step heard, ${player.heard}`);
      heard.set(bar.bar, bar);
      expect(next.map((b) => b.bar)).toEqual([...Array(7).keys()].map((i) => bar.bar + 1 + i));
      for (const b of next) foreseen.set(b.bar, [...(foreseen.get(b.bar) ?? []), b]);
    }
    // Synth-pop at 108 bpm: 40 s is 18 bars.
    expect(heard.size).toBeGreaterThan(16);
    for (const [bar, views] of foreseen)
      if (heard.has(bar)) for (const view of views) expect(view).toEqual(heard.get(bar));
  });

  it('renews the bars ahead when a control moves, and names the glide under way', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    for (let t = 0; t < 3; t += 0.025) {
      world.currentTime += 0.025;
      world.tickers[0]!.tick();
      world.frames[0]!.follow();
    }
    const energies = player.hud.next.map((b) => b.energy);
    player.apply({ kind: 'axis', axis: 'energy', value: 1 });
    expect(player.hud.next.map((b) => b.energy)).not.toEqual(energies);
    player.apply({ kind: 'preset', preset: PRESETS.find((p) => p.name === 'Funk')! });
    expect(player.hud.style).toMatchObject({
      preset: 'Funk',
      glide: { from: 'Synth-pop', bar: 1, bars: 8 },
    });
  });

  it('draws the next song’s seed on stop, and shows its opening again', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    expect(world.seeds).toHaveLength(1);
    void player.start();
    world.resolve();
    await settle();
    for (let t = 0; t < 5; t += 0.025) {
      world.currentTime += 0.025;
      world.tickers[0]!.tick();
      world.frames[0]!.follow();
    }
    expect(player.hud.bar!.bar).toBeGreaterThan(0);
    player.halt();
    expect(world.seeds).toHaveLength(2);
    expect(player.hud.beat).toBeNull();
    expect(player.hud.bar!.bar).toBe(0);
  });

  it('keeps the bar heard when a control moves just after the transport passes a bar line', async () => {
    // The transport schedules 120 ms ahead, so for a moment after each bar
    // line it is in the next bar while the bar before is still heard.
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    let bars = 0;
    for (let t = 0; t < 12; t += 0.025) {
      world.currentTime += 0.025;
      world.tickers[0]!.tick();
      player.apply({ kind: 'axis', axis: 'energy', value: 0.5 + (t % 1) / 4 });
      world.frames[0]!.follow();
      if (player.hud.beat === null) continue;
      expect(player.hud.bar?.bar).toBe(Math.floor(player.heard! / 16));
      bars = player.hud.bar!.bar;
    }
    expect(bars).toBeGreaterThan(3);
  });

  it('shows the section playing whole in the song map, its past bars included', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    let checked = 0;
    for (let t = 0; t < 30; t += 0.025) {
      world.currentTime += 0.025;
      world.tickers[0]!.tick();
      world.frames[0]!.follow();
      const { bar, beat, sections } = player.hud;
      if (beat === null) continue;
      expect(sections.map((s) => s.index)).toEqual(
        [0, 1, 2, 3, 4].map((k) => k + Math.floor(bar!.bar / 8)),
      );
      expect(sections[0]!.bars).toHaveLength(8);
      checked++;
    }
    // Synth-pop at 108 bpm: 30 s is into the second section.
    expect(player.hud.bar!.bar).toBeGreaterThan(8);
    expect(checked).toBeGreaterThan(500);
  });

  it('opens in a key picked while stopped, and shows it heading there', () => {
    const { s } = surroundings();
    const player = new Player(s);
    player.apply({ kind: 'key', wish: { tonic: 2, mode: 'mixolydian' } });
    expect(player.hud.bar!.key).toBe('D mixolydian');
    expect(player.hud.heading).toEqual({ tonic: 2, mode: 'mixolydian' });
  });

  it('hears a key picked while playing from the next section on, and heads there at once', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    const heard = new Map<number, string>();
    const play = (seconds: number) => {
      for (let t = 0; t < seconds; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
        const { bar, beat } = player.hud;
        if (beat !== null && bar) heard.set(bar.bar, bar.key);
      }
    };
    // Synth-pop at 108 bpm: a bar is 2.2 s.
    play(3);
    player.apply({ kind: 'key', wish: { tonic: 7, mode: 'ionian' } });
    expect(player.hud.heading).toEqual({ tonic: 7, mode: 'ionian' });
    expect(player.hud.bar!.key).toBe('A minor');
    play(20);
    for (let bar = 0; bar < 8; bar++) expect(heard.get(bar)).toBe('A minor');
    expect(heard.get(8)).toBe('G major');
    // Once the band plays the key picked, the pick lets go, and the band moves on from there (#169).
    expect(player.wish).toEqual({ tonic: null, mode: 'ionian', melodic: null });
  });

  it('hears a melodic scale picked while playing from the next section on, heads there at once, and keeps it (#209)', async () => {
    const { world, s } = surroundings();
    const player = new Player(s);
    void player.start();
    world.resolve();
    await settle();
    const heard = new Map<number, { name: string; notes: readonly number[] }>();
    const play = (seconds: number) => {
      for (let t = 0; t < seconds; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
        const { bar, beat } = player.hud;
        if (beat !== null && bar) heard.set(bar.bar, { name: bar.melodicName, notes: bar.melodic });
      }
    };
    // Synth-pop at 108 bpm: a bar is 2.2 s, and its harmony reaches the pentatonic.
    play(3);
    player.apply({ kind: 'key', wish: { melodic: 'pentatonic' } });
    expect(player.hud.headingMelodic).toBe('pentatonic');
    expect(player.hud.bar!.melodicName).toBe('plain');
    play(20);
    for (let bar = 0; bar < 8; bar++) expect(heard.get(bar)!.name).toBe('plain');
    // A minor's pentatonic: A C D E G.
    expect(heard.get(8)).toEqual({ name: 'pentatonic', notes: [0, 2, 4, 7, 9] });
    expect(player.wish).toEqual({ tonic: null, mode: 'aeolian', melodic: 'pentatonic' });
  });

  describe('what players play', () => {
    it('has no written position before anything plays', () => {
      const { s } = surroundings();
      const player = new Player(s);
      expect(player.writtenPosition(0)).toBeNull();
    });

    it('ignores a note played before anything plays', () => {
      const { s } = surroundings();
      const player = new Player(s);
      player.humanNoteOn('lead', 60, 100, 'test', 0);
      expect(player.humanNotes).toEqual([]);
    });

    /** A started player, and a way to run its clock `seconds` on, a tick every 25 ms. */
    async function playing() {
      const { world, s } = surroundings();
      const player = new Player(s);
      void player.start();
      world.resolve();
      await settle();
      const run = (seconds: number) => {
        for (let i = 0; i < Math.round(seconds / 0.025); i++) {
          world.currentTime += 0.025;
          world.tickers[0]!.tick();
        }
      };
      return { world, player, run };
    }

    it('reads each step back where it was laid, after the tempo has changed again and again (#78)', async () => {
      // The style track keeps only its latest glide per axis, so reading it
      // back from the song's start put a note 18 bars early after two tempo
      // changes. The steps as laid keep what the track forgets.
      const { world, player, run } = await playing();
      for (const bpm of [90, 150, 70, 130]) {
        run(10);
        player.apply({ kind: 'axis', axis: 'bpm', value: bpm });
      }
      run(10);
      const recent = world.steps.filter((step) => step.seconds > world.currentTime - 4);
      expect(recent.length).toBeGreaterThan(16);
      for (const step of recent)
        expect(player.writtenPosition(step.seconds)).toBeCloseTo(step.step, 9);
    });

    it('forgets where steps were laid once no note could still be read against them', async () => {
      const { world, player, run } = await playing();
      run(20);
      const first = world.steps[0]!;
      const late = world.steps.findLast((step) => step.seconds < world.currentTime - 6)!;
      expect(player.writtenPosition(first.seconds)).toBeNull();
      expect(player.writtenPosition(late.seconds)).toBeCloseTo(late.step, 9);
    });

    it('logs a note played at its exact position, at the moment it was heard, whatever the latency', async () => {
      // The clock offset already maps a key's time to the moment being heard
      // (\`clockOffset\`), so the player takes the latency off no second time.
      const { world, player, run } = await playing();
      run(8);
      world.latency = 0.05;
      const step = world.steps.at(-20)!;
      const heard = step.seconds + 0.3 * step.length;
      player.humanNoteOn('lead', 64, 90, 'the computer keys', heard);
      expect(player.humanNotes).toEqual([
        {
          part: 'lead',
          note: 64,
          velocity: 90,
          source: 'the computer keys',
          position: expect.closeTo(step.step + 0.3, 9),
          end: null,
        },
      ]);
    });

    it('logs where a note was released, on the note from that source still held', async () => {
      const { world, player, run } = await playing();
      run(8);
      world.latency = 0.05;
      const [a, b, c] = [-30, -25, -20].map((i) => world.steps.at(i)!);
      const at = (step: { seconds: number }) => step.seconds;
      player.humanNoteOn('lead', 64, 90, 'the computer keys', at(a!));
      player.humanNoteOn('lead', 64, 90, 'a MIDI port', at(a!));
      player.humanNoteOff('lead', 64, 'the computer keys', at(b!));
      player.humanNoteOn('lead', 64, 90, 'the computer keys', at(b!));
      player.humanNoteOff('lead', 64, 'the computer keys', at(c!));
      player.humanNoteOff('lead', 64, 'the computer keys', at(c!) + 0.5);
      player.humanNoteOff('drums', 64, 'the computer keys', at(c!));
      expect(player.humanNotes.map((n) => [n.source, n.position, n.end])).toEqual([
        ['the computer keys', a!.step, b!.step],
        ['a MIDI port', a!.step, null],
        ['the computer keys', b!.step, c!.step],
      ]);
    });

    /** Play three notes on steps 0, 4 and 8 of `bar`, each as the clock reaches it. */
    function playMotif(
      world: ReturnType<typeof surroundings>['world'],
      player: Player,
      run: (seconds: number) => void,
      bar: number,
      part: 'lead' | 'drums' = 'lead',
    ) {
      for (const [i, note] of [69, 72, 76].entries()) {
        const step = 16 * bar + 4 * i;
        while (!world.steps.some((s) => s.step === step)) run(0.025);
        const at = world.steps.find((s) => s.step === step)!.seconds;
        while (world.currentTime < at) run(0.025);
        player.humanNoteOn(part, note, 100, 'the computer keys', at);
      }
    }

    /** The steps of `bar` the band's lead starts a note on. */
    const leadSteps = (world: ReturnType<typeof surroundings>['world'], bar: number) => {
      const steps = world.steps.filter((s) => Math.floor(s.step / 16) === bar);
      return world.plays
        .filter((p) => p.part === 'lead')
        .map((p) => steps.find((s) => Math.abs(s.seconds - p.seconds) < 1e-9)?.step)
        .filter((step) => step !== undefined)
        .map((step) => step % 16);
    };

    it('hears a motif played on the keys, and the lead plays it from the bar after next (#79)', async () => {
      const { world, player, run } = await playing();
      playMotif(world, player, run, 2);
      run(8);
      expect(leadSteps(world, 4)).toEqual([0, 4, 8]);
      expect(player.museLog.map((l) => [l.bar, l.offer?.bar ?? null])).toContainEqual([2, 2]);
    });

    it('shows the Muse on the screen: the motif on offer, the log, and the lead playing it (#79)', async () => {
      const { world, player, run } = await playing();
      expect(player.hud.muse).toEqual({ motif: null, log: [], memory: [], quiet: null });
      playMotif(world, player, run, 2);
      run(8);
      world.frames[0]!.follow();
      expect(player.hud.muse.motif).toMatchObject({ source: 'the computer keys', bar: 2 });
      expect(player.hud.muse.log[0]).toEqual({
        bar: 2,
        text: 'Took a 3-note motif from the computer keys.',
        taken: true,
      });
      expect(player.hud.bar).toMatchObject({
        lead: 'motif',
        motif: { source: 'the computer keys', bar: 2 },
      });
      // She remembers it once, offers it, and has heard no silence yet.
      expect(player.hud.muse.memory).toMatchObject([
        { source: 'the computer keys', bar: 2, heard: 1, confirmed: false, offered: true },
      ]);
      expect(player.hud.muse.quiet).toMatchObject({ of: 16 });
      player.forgetMotif();
      run(9);
      world.frames[0]!.follow();
      expect(player.hud.muse.motif).toBeNull();
      expect(player.hud.bar).toMatchObject({ motif: null });
    });

    it('keeps whose motif the lead played with each bar of the pattern, and none before (#164)', async () => {
      const { world, player, run } = await playing();
      playMotif(world, player, run, 2);
      /** Runs until the pattern holds `bar` whole, and gives its motif. */
      const shownAt = (bar: number) => {
        while (!player.pattern.some((b) => b.bar > bar)) run(0.025);
        return player.pattern.find((b) => b.bar === bar)!.motif;
      };
      expect(shownAt(3)).toBeNull();
      expect(shownAt(4)).toEqual({ source: 'the computer keys', bar: 2 });
      expect(leadSteps(world, 4)).toEqual([0, 4, 8]);
    });

    it('judges no note from the drum pads, which are not a melody', async () => {
      const { world, player, run } = await playing();
      playMotif(world, player, run, 2, 'drums');
      run(8);
      expect(player.humanNotes).toHaveLength(3);
      expect(player.museLog).toEqual([]);
    });

    it('forgets the motif when asked, and logs why', async () => {
      const { world, player, run } = await playing();
      playMotif(world, player, run, 2);
      run(8);
      player.forgetMotif();
      run(9);
      expect(player.museLog.at(-1)).toMatchObject({ offer: null, forgot: 'asked' });
      const after = Math.floor(world.steps.at(-1)!.step / 16) - 1;
      expect(leadSteps(world, after)).not.toEqual([0, 4, 8]);
    });

    it('keeps at most 240 notes, dropping the oldest half once full', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      void player.start();
      world.resolve();
      await settle();
      world.currentTime += 4;
      world.tickers[0]!.tick();
      const now = world.currentTime;
      for (let i = 0; i < 241; i++) player.humanNoteOn('lead', 60, 100, 'test', now);
      expect(player.humanNotes.length).toBeLessThanOrEqual(240);
      expect(player.humanNotes.length).toBeGreaterThan(0);
    });
  });

  describe('playing along', () => {
    it('shows every one of the band’s own tracks sounding, never past its duration', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      void player.start();
      world.resolve();
      await settle();
      const seen = { drums: false, bass: false, comp: false, lead: false };
      for (let t = 0; t < 24; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
        for (const part of ['drums', 'bass', 'comp', 'lead'] as const)
          if (player.sounding[part].length > 0) seen[part] = true;
      }
      expect(seen).toEqual({ drums: true, bass: true, comp: true, lead: true });
      player.halt();
      expect(player.sounding).toEqual({ drums: [], bass: [], comp: [], lead: [] });
    });

    it('plays along at once, on the band’s own output, without joining the band’s own notes', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      const before = world.played;
      const played = player.playAlong('lead', 64, 100);
      world.resolve();
      await played;
      expect(world.resumes).toBe(1);
      expect(world.played).toBe(before + 1);
      expect(player.sounding).toEqual({ drums: [], bass: [], comp: [], lead: [] });
    });
  });

  describe('the pattern of the last bars', () => {
    it('gives every track its notes in the last bars, one after another, and clears them on stop', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      void player.start();
      world.resolve();
      await settle();
      for (let t = 0; t < 24; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
      }
      const bars = player.pattern.map((b) => b.bar);
      expect(bars).toEqual(bars.map((_, i) => bars[0]! + i));
      expect(bars).toHaveLength(PATTERN_BARS + 1);
      for (const part of ['drums', 'bass', 'comp', 'lead'] as const)
        expect(
          player.pattern.some((b) => b.parts[part].length > 0),
          part,
        ).toBe(true);
      player.halt();
      expect(player.pattern).toEqual([]);
    });
  });

  describe('the local mix', () => {
    it('keeps a muted performer from the output and from sounding, but not from the pattern (#119)', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      player.mix = { ...EVEN_MIX, muted: ['drums'] };
      void player.start();
      world.resolve();
      await settle();
      let drumsSounded = false;
      for (let t = 0; t < 10; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
        if (player.sounding.drums.length > 0) drumsSounded = true;
      }
      expect(drumsSounded).toBe(false);
      expect(world.plays.filter((p) => p.part === 'drums')).toEqual([]);
      expect(world.plays.filter((p) => p.part === 'bass').length).toBeGreaterThan(0);
      expect(player.pattern.at(-2)!.parts.drums.length).toBeGreaterThan(0);
    });

    it('sounds only what is soloed, and all again once the solo is lifted', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      player.mix = { ...EVEN_MIX, soloed: ['bass'] };
      void player.start();
      world.resolve();
      await settle();
      const run = (seconds: number) => {
        for (let t = 0; t < seconds; t += 0.025) {
          world.currentTime += 0.025;
          world.tickers[0]!.tick();
        }
      };
      run(10);
      expect(new Set(world.plays.map((p) => p.part))).toEqual(new Set(['bass']));
      player.mix = EVEN_MIX;
      world.plays = [];
      run(14);
      const parts = new Set(world.plays.map((p) => p.part));
      for (const part of ['drums', 'bass', 'lead']) expect(parts).toContain(part);
    });
  });

  describe('the level of each performer', () => {
    const played = async (mix: Mix) => {
      const { world, s } = surroundings();
      const player = new Player(s);
      player.mix = mix;
      void player.start();
      world.resolve();
      await settle();
      for (let t = 0; t < 10; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
      }
      return world.plays;
    };

    it('scales the velocity of one performer’s notes and none other’s, note for note', async () => {
      const whole = await played(EVEN_MIX);
      const halved = await played(withLevel(EVEN_MIX, 'bass', 0.5));
      const of = (plays: typeof whole, part: string) => plays.filter((p) => p.part === part);
      expect(of(halved, 'bass')).toHaveLength(of(whole, 'bass').length);
      expect(of(whole, 'bass').length).toBeGreaterThan(0);
      of(whole, 'bass').forEach((p, i) => {
        expect(of(halved, 'bass')[i]!.velocity).toBe(Math.max(1, Math.round(p.velocity * 0.5)));
        expect(of(halved, 'bass')[i]!.note).toBe(p.note);
      });
      expect(of(halved, 'drums').map((p) => p.velocity)).toEqual(
        of(whole, 'drums').map((p) => p.velocity),
      );
    });

    it('plays nothing of a performer whose level is none, and all the others', async () => {
      const plays = await played(withLevel(EVEN_MIX, 'drums', 0));
      expect(plays.filter((p) => p.part === 'drums')).toEqual([]);
      expect(plays.filter((p) => p.part === 'bass').length).toBeGreaterThan(0);
    });
  });

  describe('the harmonic history', () => {
    it('is the band’s own, the history its key follows, and clears on stop (#169)', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      void player.start();
      world.resolve();
      await settle();
      for (let t = 0; t < 20; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
      }
      // The band's own decisions, run apart from the player: the history is
      // the fold of the chords of the first bars it decided, however many.
      const env = { seed: world.seeds.at(-1)!, start: 0, track: player.track, wish: player.wish };
      const bars = lookAhead(band.initial, (bar) => bandEnvAt(env, bar, null), 32);
      const folds = bars.reduce<HarmonicWeights[]>(
        (all, bar) => [...all, foldBar(all.at(-1) ?? NO_HISTORY, bar.chords)],
        [],
      );
      expect(folds.slice(8)).toContainEqual(player.harmonicHistory);
      player.halt();
      expect(player.harmonicHistory).toEqual(NO_HISTORY);
    });

    it('leaves the players’ home to the plan: the key the band is heading for, whatever the history weighs (C8)', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      expect(player.home).toEqual(INITIAL_KEY);
      void player.start();
      world.resolve();
      await settle();
      for (let t = 0; t < 20; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
      }
      // A history of another key's scale, a fifth away, where the band is not.
      const heading = player.hud.heading!;
      const elsewhere = [...NO_HISTORY];
      for (const step of [0, 2, 3, 5, 7, 8, 10]) elsewhere[(heading.tonic + 7 + step) % 12] = 1;
      player.harmonicHistory = elsewhere;
      expect(player.home).toEqual(heading);
    });

    it('weighs the pitch classes actually played, and clears them on stop', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      void player.start();
      world.resolve();
      await settle();
      for (let t = 0; t < 20; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
      }
      expect(player.harmonicHistory.some((w) => w > 0)).toBe(true);
      expect(player.harmonicHistory).toHaveLength(12);
      player.halt();
      expect(player.harmonicHistory).toEqual(new Array(12).fill(0));
    });
  });
});

/** A host's session as the player tells it: what it said, in order. */
function told() {
  const said: string[] = [];
  const started: { seed: number; start: number }[] = [];
  const composed: { bar: number; chords: number[] }[] = [];
  const finales: number[] = [];
  const hosting: Hosting = {
    started: (song) => (said.push('started'), started.push(song)),
    stopped: () => void said.push('stopped'),
    composed: (bars) =>
      bars.forEach(({ bar }) =>
        composed.push({ bar: bar.bar, chords: bar.chords.map((c) => c.slot.step) }),
      ),
    decided: () => {},
    track: () => {},
    meter: () => {},
    muse: () => {},
    finale: (bar) => (said.push('finale'), finales.push(bar)),
  };
  return { said, started, composed, finales, hosting };
}

describe('the count-in', () => {
  const COUNT_IN = countInSeconds(holdingSynthPop());
  const START = 0.1 + COUNT_IN;

  async function begun(metronome: Metronome | null = new Metronome()) {
    const { world, s } = surroundings();
    const player = new Player(s, metronome);
    const host = told();
    player.hosting = host.hosting;
    void player.start();
    world.resolve();
    await settle();
    const run = (seconds: number) => {
      for (let t = 0; t < seconds - 1e-9; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
      }
    };
    return { world, player, host, run };
  }

  it('clicks the beats of a bar before the song, the downbeat first, whether the click is on or not', async () => {
    const { world } = await begun();
    expect(world.clicks.map((c) => c.weight)).toEqual(['downbeat', 'pulse', 'pulse', 'pulse']);
    const beat = COUNT_IN / 4;
    world.clicks.forEach((c, i) => expect(c.seconds).toBeCloseTo(0.1 + i * beat, 9));
  });

  it('starts the song a bar after the clicks start, and plays nothing of the band before', async () => {
    const { world, player, run } = await begun();
    expect(player.counting).toBe(true);
    run(START - 0.2);
    expect(world.played).toBe(0);
    expect(world.steps).toEqual([]);
    expect(player.counting).toBe(true);
    run(1);
    expect(player.counting).toBe(false);
    expect(world.steps[0]!.seconds).toBeCloseTo(START, 9);
    for (const p of world.plays) expect(p.seconds).toBeGreaterThanOrEqual(START - 1e-9);
  });

  it('says which step of the count-in bar is heard, and nothing before it or once the song is heard', async () => {
    const { player, run } = await begun();
    const step = COUNT_IN / 16;
    expect(player.countStep).toBe(null);
    run(0.1 + step * 4.5);
    expect(player.countStep).toBe(4);
    run(step * 8);
    expect(player.countStep).toBe(12);
    run(COUNT_IN);
    expect(player.counting).toBe(false);
    expect(player.countStep).toBe(null);
  });

  it('plays a pattern of one’s own on this device, on the band’s steps, every bar, and logs it as played once heard', async () => {
    const { world, player, run } = await begun();
    // A claves (75): no drum the band plays, so every one heard is the pattern's.
    player.rhythm = [
      { note: 75, step: 0 },
      { note: 75, step: 8 },
    ];
    player.rhythmPlays = true;
    run(START + COUNT_IN * 2 + 0.2);
    const claves = world.plays.filter((p) => p.part === 'drums' && p.note === 75);
    const bar = COUNT_IN;
    expect(claves.length).toBeGreaterThanOrEqual(4);
    claves.slice(0, 4).forEach((p, i) => expect(p.seconds).toBeCloseTo(START + (i * bar) / 2, 6));
    const logged = player.humanNotes.filter((n) => n.part === 'drums' && n.note === 75);
    expect(logged.map((n) => n.position).slice(0, 4)).toEqual([0, 8, 16, 24]);
    expect(logged.every((n) => n.source === 'your pattern' && n.end === n.position + 1)).toBe(true);
  });

  it('plays nothing of a pattern while it is not asked to, and edits and records it', async () => {
    const { world, player, run } = await begun();
    player.toggleHit(75, 4);
    expect(player.rhythm).toEqual([{ note: 75, step: 4 }]);
    run(START + COUNT_IN + 0.2);
    expect(world.plays.filter((p) => p.note === 75)).toEqual([]);
    player.recordHit(76);
    expect(player.rhythm.some((h) => h.note === 76)).toBe(true);
    player.toggleHit(75, 4);
    expect(player.rhythm.map((h) => h.note)).toEqual([76]);
  });

  it('tells a host’s clients the start, a bar ahead, as the clicks begin, and the first bar with it', async () => {
    const { host, world } = await begun();
    expect(host.said).toEqual(['started']);
    expect(host.started[0]!.start).toBeCloseTo(START, 9);
    expect(world.currentTime).toBe(0);
    expect(host.composed.map((b) => b.bar)).toEqual([0]);
  });

  it('stops at once when stopped in the count-in, with nothing of the band played', async () => {
    const { world, player, host, run } = await begun();
    run(1);
    player.stop();
    expect(player.status).toBe('stopped');
    expect(player.counting).toBe(false);
    expect(player.ending).toBe(false);
    expect(host.said).toEqual(['started', 'stopped']);
    expect(world.played).toBe(0);
  });

  it('clicks the rest of it, and only the rest, for a client that follows a song already counting', async () => {
    const { world, s } = surroundings();
    const player = new Player(s, new Metronome());
    player.follow({ judged: () => {}, forget: () => {}, skew: () => 0 });
    const song = { seed: 3, start: 5, track: holdingSynthPop() };
    void player.followSong(song, []);
    world.resolve();
    await settle();
    const clicks = countInBeats(song.start);
    expect(world.clicks.map((c) => c.seconds)).toEqual(clicks);
    world.clicks.length = 0;
    world.currentTime = 4;
    world.tickers[0]!.tick();
    const late = new Player(surroundings().s, new Metronome());
    expect(late.counting).toBe(false);
  });
});

describe('stopping on a cadence', () => {
  async function playingOn() {
    const { world, s } = surroundings();
    const player = new Player(s, new Metronome());
    const host = told();
    player.hosting = host.hosting;
    void player.start();
    world.resolve();
    await settle();
    const run = (seconds: number) => {
      for (let t = 0; t < seconds - 1e-9; t += 0.025) {
        world.currentTime += 0.025;
        if (!world.tickers[0]!.stopped) world.tickers[0]!.tick();
        world.frames[0]!.follow();
      }
    };
    run(9);
    return { world, player, host, run };
  }

  it('plays on to a last bar that closes on a cadence, then halts and tells the session', async () => {
    const { world, player, host, run } = await playingOn();
    expect(player.counting).toBe(false);
    const asked = world.currentTime;
    player.stop();
    expect(player.status).toBe('playing');
    expect(player.ending).toBe(true);
    run(5);
    expect(host.finales).toHaveLength(1);
    const last = host.composed.at(-1)!;
    expect(last.bar).toBe(host.finales[0]);
    expect(last.chords).toEqual([0, 8]);
    run(12);
    expect(player.status).toBe('stopped');
    expect(player.ending).toBe(false);
    expect(host.said.filter((m) => m === 'stopped')).toHaveLength(1);
    expect(host.said.at(-1)).toBe('stopped');
    // No bar was composed after the last, and nothing was played after its end.
    expect(host.composed.map((b) => b.bar)).toEqual([...Array(last.bar + 1).keys()]);
    const end = world.steps.at(-1)!;
    const ends = end.seconds + end.length;
    for (const p of world.plays) expect(p.seconds).toBeLessThan(ends);
    expect(world.currentTime - asked).toBeGreaterThan(0);
  });

  it('halts within two bars of being asked and a ring, and not before its last bar has played', async () => {
    const { world, player, run } = await playingOn();
    const asked = world.currentTime;
    const bar = (16 * 15) / 108;
    player.stop();
    let halted: number | null = null;
    for (let i = 0; i < 800 && halted === null; i++) {
      run(0.025);
      if (player.status === 'stopped') halted = world.currentTime;
    }
    const ring = RING_STEPS * (15 / 108);
    expect(halted).not.toBeNull();
    expect(halted! - asked).toBeGreaterThan(ring);
    expect(halted! - asked).toBeLessThan(2 * bar + ring + 0.5);
  });

  it('halts at once when stopped a second time, silencing what rings', async () => {
    const { world, player, host } = await playingOn();
    player.stop();
    const silenced = world.silenced;
    player.stop();
    expect(player.status).toBe('stopped');
    expect(player.ending).toBe(false);
    expect(world.silenced).toBe(silenced + 1);
    expect(host.said.at(-1)).toBe('stopped');
  });

  it('plays a new song after one has ended, with a count-in again and the ending forgotten', async () => {
    const { world, player, host, run } = await playingOn();
    player.stop();
    run(20);
    expect(player.status).toBe('stopped');
    world.clicks.length = 0;
    void player.start();
    world.resolve();
    await settle();
    expect(player.status).toBe('playing');
    expect(player.counting).toBe(true);
    expect(player.ending).toBe(false);
    expect(world.clicks).toHaveLength(4);
    expect(host.said.filter((m) => m === 'started')).toHaveLength(2);
  });

  it('halts a client at once for any stop that is not the host’s ending', async () => {
    const { world, s } = surroundings();
    const player = new Player(s, new Metronome());
    player.follow({ judged: () => {}, forget: () => {}, skew: () => 0 });
    void player.followSong({ seed: 1, start: 0.2, track: holdingSynthPop() }, []);
    world.resolve();
    await settle();
    player.stop();
    expect(player.status).toBe('stopped');
  });
});

/** The default style, held: what a song opens on. */
function holdingSynthPop() {
  return holding(INITIAL_STYLE);
}

/** The count-in's beats for a song that starts at `start`. */
function countInBeats(start: number) {
  return countIn(holdingSynthPop(), start).map((c) => c.seconds);
}

describe('the meter asked for (#262)', () => {
  const start = async (more: (player: Player) => void = () => {}) => {
    const { world, s } = surroundings();
    const player = new Player(s, new Metronome());
    more(player);
    void player.start();
    world.resolve();
    await settle();
    const heard = new Map<number, { meter: string; steps: number }>();
    const play = (seconds: number) => {
      for (let t = 0; t < seconds; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
        const { bar, beat } = player.hud;
        if (beat !== null && bar)
          heard.set(bar.bar, { meter: bar.meterName, steps: player.clock.barSteps(bar.bar) });
      }
    };
    return { world, player, heard, play };
  };

  it('is 4/4 until asked, in the view and on the clock', () => {
    const { s } = surroundings();
    const player = new Player(s);
    expect(player.meter).toEqual(METERS['4/4']);
    expect(player.hud.bar!.meterName).toBe('4/4');
    expect(player.clock.barSteps(0)).toBe(16);
  });

  it('opens the song in the meter asked for while stopped, in the view, on the clock and in every section shown', () => {
    const { s } = surroundings();
    const player = new Player(s);
    player.setMeter(METERS['7/8']);
    expect(player.hud.bar!.meterName).toBe('7/8');
    expect(player.clock.barSteps(0)).toBe(14);
    expect(player.clock.barStart(3)).toBe(42);
    expect(player.hud.sections.map((s) => s.meterName)).toEqual(Array(5).fill('7/8'));
  });

  it('hears a meter asked for while playing from the next section on, and shows the section after it as the one that changes', async () => {
    const { player, heard, play } = await start();
    play(3);
    player.setMeter(METERS['6/8']);
    expect(player.hud.bar!.meterName).toBe('4/4');
    expect(player.hud.sections.map((s) => [s.meterName, s.newMeter])).toEqual([
      ['4/4', false],
      ['6/8', true],
      ['6/8', false],
      ['6/8', false],
      ['6/8', false],
    ]);
    play(24);
    for (let bar = 0; bar < 8; bar++) expect(heard.get(bar)).toEqual({ meter: '4/4', steps: 16 });
    expect(heard.get(8)).toEqual({ meter: '6/8', steps: 12 });
    expect(heard.get(9)).toEqual({ meter: '6/8', steps: 12 });
  });

  it('asks again for 4/4 from the next section on, and the clock follows each change', async () => {
    const { player, heard, play } = await start((p) => p.setMeter(METERS['7/8']));
    play(3);
    expect(heard.get(0)).toEqual({ meter: '7/8', steps: 14 });
    player.setMeter(METERS['4/4']);
    play(22);
    expect(heard.get(7)).toEqual({ meter: '7/8', steps: 14 });
    expect(heard.get(8)).toEqual({ meter: '4/4', steps: 16 });
    expect(player.clock.barStart(9) - player.clock.barStart(8)).toBe(16);
    expect(player.clock.barStart(8)).toBe(8 * 14);
  });

  it('makes the count-in a bar of the song’s opening meter', async () => {
    const { world } = await start((p) => p.setMeter(METERS['6/8']));
    expect(world.clicks.map((c) => c.weight)).toEqual(['downbeat', 'pulse']);
  });

  it('is the host’s to ask: a client follows the meter of its host’s bars, and its own asking rests', () => {
    const { s } = surroundings();
    const player = new Player(s);
    player.follow({ judged: () => {}, forget: () => {}, skew: () => 0 });
    player.setMeter(METERS['5/8']);
    expect(player.meter).toEqual(METERS['4/4']);
  });
});
