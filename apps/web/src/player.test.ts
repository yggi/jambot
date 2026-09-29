import {
  type HarmonicWeights,
  NO_HISTORY,
  PRESETS,
  type ScheduledStep,
  band,
  bandEnvAt,
  foldBar,
  lookAhead,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import type { Output } from './audio/output.ts';
import { Player, type Surroundings } from './player.svelte.ts';

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
    plays: [] as { part: string; note: number; seconds: number }[],
    silenced: 0,
    panics: 0,
    tickers: [] as { tick: () => void; stopped: boolean }[],
    frames: [] as { follow: () => void; stopped: boolean }[],
    seeds: [] as number[],
    steps: [] as ScheduledStep[],
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
    play: (part, note, _velocity, seconds) => {
      world.played++;
      world.plays.push({ part, note, seconds });
    },
    silence: () => void world.silenced++,
    panic: () => void world.panics++,
    tick: (steps) => world.steps.push(...steps),
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
    player.stop();
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
    player.stop();
    const before = world.steps.length;
    void player.start();
    world.resolve();
    await settle();
    expect(player.timing.laid).toBe(world.steps.length - before);
    expect(player.timing.ticks.count).toBe(0);
    expect(player.timing.missed).toBe(0);
  });

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
    expect(player.wish).toEqual({ tonic: null, mode: 'dorian' });
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
    // The rest of the intro and the whole section after it.
    expect(before.next.map((b) => b.bar)).toEqual([...Array(15).keys()].map((i) => i + 1));
    void player.start();
    world.resolve();
    await settle();
    for (let i = 0; i < 20 && player.hud.beat === null; i++) {
      world.currentTime += 0.025;
      world.tickers[0]!.tick();
      world.frames[0]!.follow();
    }
    expect(player.hud.beat).toBe(0);
    expect(player.hud.bar).toEqual(before.bar);
    expect(player.hud.chord).toEqual(before.chord);
  });

  it('shows bars ahead that are the bars then heard, from the one after the bar heard to the end of the next section', async () => {
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
      const end = (Math.floor(bar.bar / 8) + 2) * 8;
      expect(next.map((b) => b.bar)).toEqual(
        [...Array(end - bar.bar - 1).keys()].map((i) => bar.bar + 1 + i),
      );
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
    expect(player.hud.style).toEqual({
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
    player.stop();
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
        [0, 1, 2, 3].map((k) => k + Math.floor(bar!.bar / 8)),
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
    expect(player.wish).toEqual({ tonic: null, mode: 'ionian' });
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
      run(5);
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
      run(5);
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
      expect(player.hud.muse).toEqual({ motif: null, log: [] });
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
      player.forgetMotif();
      run(9);
      world.frames[0]!.follow();
      expect(player.hud.muse.motif).toBeNull();
      expect(player.hud.bar).toMatchObject({ motif: null });
    });

    it('keeps whose motif the lead played with the bar the pattern shows, and none before (#164)', async () => {
      const { world, player, run } = await playing();
      playMotif(world, player, run, 2);
      /** Runs until the pattern shows `bar`, and gives its motif. */
      const shownAt = (bar: number) => {
        while (player.pattern.bar !== bar) run(0.025);
        return player.pattern.motif;
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
      world.currentTime += 1;
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
      for (let t = 0; t < 20; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
        for (const part of ['drums', 'bass', 'comp', 'lead'] as const)
          if (player.sounding[part].length > 0) seen[part] = true;
      }
      expect(seen).toEqual({ drums: true, bass: true, comp: true, lead: true });
      player.stop();
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

  describe('the last bar’s pattern', () => {
    it('gives every track the notes of the last bar it finished, and clears them on stop', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      void player.start();
      world.resolve();
      await settle();
      for (let t = 0; t < 20; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
      }
      for (const part of ['drums', 'bass', 'comp', 'lead'] as const)
        expect(player.pattern.parts[part].length).toBeGreaterThan(0);
      player.stop();
      expect(player.pattern).toEqual({
        bar: null,
        parts: { drums: [], bass: [], comp: [], lead: [] },
        motif: null,
      });
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
      player.stop();
      expect(player.harmonicHistory).toEqual(NO_HISTORY);
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
      player.stop();
      expect(player.harmonicHistory).toEqual(new Array(12).fill(0));
    });
  });
});
