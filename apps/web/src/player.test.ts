import { PRESETS, type ScheduledStep } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import type { Output } from './audio/output.ts';
import { Player, type Surroundings } from './player.svelte.ts';

/** Surroundings a test drives by hand: the clock, the resume, the ticks and frames. */
function surroundings() {
  const world = {
    currentTime: 0,
    latency: 0,
    resumes: 0,
    resolve: () => {},
    played: 0,
    silenced: 0,
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
    play: () => void world.played++,
    silence: () => void world.silenced++,
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
    for (let bar = 0; bar < 8; bar++) expect(heard.get(bar)).toBe('aeolian');
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
    expect(before.bar).toMatchObject({ bar: 0, section: 'Intro', key: 'A aeolian' });
    expect(before.next.map((b) => b.bar)).toEqual([1, 2, 3, 4]);
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

  it('shows bars ahead that are the bars then heard, and the next four after the one heard', async () => {
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
      expect(next.map((b) => b.bar)).toEqual([1, 2, 3, 4].map((i) => bar.bar + i));
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
    expect(player.hud.bar!.key).toBe('A aeolian');
    play(20);
    for (let bar = 0; bar < 8; bar++) expect(heard.get(bar)).toBe('A aeolian');
    expect(heard.get(8)).toBe('G ionian');
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

    it('logs a note played at its exact position, where it was heard: the output’s latency earlier', async () => {
      const { world, player, run } = await playing();
      run(5);
      world.latency = 0.05;
      const step = world.steps.at(-20)!;
      const heard = step.seconds + 0.3 * step.length;
      player.humanNoteOn('lead', 64, 90, 'the computer keys', heard + world.latency);
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
      const at = (step: { seconds: number }) => step.seconds + world.latency;
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
    it('shows the band’s own lead and drum notes sounding, never past their duration', async () => {
      const { world, s } = surroundings();
      const player = new Player(s);
      void player.start();
      world.resolve();
      await settle();
      let sawLead = false;
      let sawDrums = false;
      for (let t = 0; t < 20; t += 0.025) {
        world.currentTime += 0.025;
        world.tickers[0]!.tick();
        world.frames[0]!.follow();
        if (player.sounding.lead.length > 0) sawLead = true;
        if (player.sounding.drums.length > 0) sawDrums = true;
      }
      expect(sawLead).toBe(true);
      expect(sawDrums).toBe(true);
      player.stop();
      expect(player.sounding).toEqual({ lead: [], drums: [] });
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
      expect(player.sounding).toEqual({ lead: [], drums: [] });
    });
  });
});
