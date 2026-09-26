import { PRESETS } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import type { Output } from './audio/output.ts';
import { Player, type Surroundings } from './player.svelte.ts';

/** Surroundings a test drives by hand: the clock, the resume, the ticks and frames. */
function surroundings() {
  const world = {
    currentTime: 0,
    resumes: 0,
    resolve: () => {},
    played: 0,
    silenced: 0,
    tickers: [] as { tick: () => void; stopped: boolean }[],
    frames: [] as { follow: () => void; stopped: boolean }[],
  };
  const output: Output = {
    get currentTime() {
      return world.currentTime;
    },
    latency: 0,
    resume: () => {
      world.resumes++;
      return new Promise<void>((resolve) => (world.resolve = resolve));
    },
    play: () => void world.played++,
    silence: () => void world.silenced++,
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
    expect(player.position).not.toBeNull();
  });

  it("hears a preset's mode from the next section on (C5)", async () => {
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
        const { bar, key } = player.position ?? {};
        if (bar !== undefined && key) heard.set(bar, key.mode);
      }
    };
    // Synth-pop at 108 bpm: a bar is 2.2 s. Deep house is dorian.
    play(3);
    player.apply({ kind: 'preset', preset: PRESETS.find((p) => p.name === 'Deep house')! });
    expect(player.wish).toEqual({ tonic: null, mode: 'dorian' });
    play(20);
    for (let bar = 0; bar < 8; bar++) expect(heard.get(bar)).toBe('aeolian');
    expect(heard.get(8)).toBe('dorian');
  });
});
