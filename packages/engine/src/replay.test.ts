import { describe, expect, it } from 'vitest';
import {
  type BandBar,
  type BandCarried,
  type BandEnv,
  band,
  finaleBar,
  lookAhead,
  passBar,
} from './band.ts';
import { cadence } from './ending.ts';
import { SECTION_BARS } from './form.ts';
import { MELODIC_SCALES } from './key.ts';
import {
  type Loop,
  KEPT_BARS,
  loopEnd,
  loopFrom,
  loopReleased,
  repeatSection,
  replayOf,
} from './replay.ts';
import { presetMode } from './mode-repository.ts';
import { PRESETS } from './style.ts';

const range = (n: number) => [...Array(n).keys()];

/** A tour as the band's own test has it: a preset a section, entropy rising, the wish moving. */
const envAt =
  (seed: number, loop?: Loop) =>
  (bar: number): BandEnv => {
    const preset = PRESETS[Math.floor(bar / 8) % PRESETS.length]!;
    return {
      seed,
      bar,
      style: { ...preset.style, entropy: (bar % 32) / 32 },
      wish: {
        tonic: null,
        mode: presetMode(preset)!,
        melodic: MELODIC_SCALES[Math.floor(bar / 3) % MELODIC_SCALES.length]!,
      },
      offer: null,
      ...(loop ? { loop } : {}),
    };
  };

/** `bars` bars played, with a loop or none. */
function run(seed: number, bars: number, loop?: Loop): { played: BandBar[]; carried: BandCarried } {
  let carried = band.initial;
  const played: BandBar[] = [];
  for (const bar of range(bars)) {
    const made = band.advance(envAt(seed, loop)(bar), carried, null);
    carried = made.carried;
    played.push(made.output);
  }
  return { played, carried };
}

/** A bar as heard, its number aside. */
const sound = (bar: BandBar) => ({ ...bar, bar: 0 });

describe('a loop (#628)', () => {
  it('names the bar each bar of the clock plays again, a lap before it, for a repeat, a lock and a short window', () => {
    const once = repeatSection(8, 1);
    expect(range(32).map((bar) => replayOf(once, bar))).toEqual([
      ...range(16).map(() => null),
      ...range(8).map((i) => 8 + i),
      ...range(8).map(() => null),
    ]);
    const locked = repeatSection(8, null);
    for (const bar of range(200)) expect(replayOf(locked, bar)).toBe(bar < 16 ? null : bar - 8);
    const short: Loop = { bars: 2, at: 7, laps: 3 };
    expect(range(16).map((bar) => replayOf(short, bar))).toEqual([
      ...range(7).map(() => null),
      ...range(6).map((i) => 5 + i),
      ...range(3).map(() => null),
    ]);
    expect(loopFrom(short)).toBe(5);
    expect(replayOf(null, 20)).toBeNull();
    expect(loopEnd(once)).toBe(24);
    expect(loopEnd(locked)).toBeNull();
  });

  it('refuses a window it could not play: not kept, inside itself, or no laps', () => {
    expect(() => repeatSection(-8, 1)).toThrow();
    expect(() => repeatSection(8, 0)).toThrow();
    expect(() => repeatSection(8, 1.5)).toThrow();
    expect(KEPT_BARS).toBe(SECTION_BARS);
  });

  it('is released at the end of the lap playing, so nothing jumps; released before it plays, it is none', () => {
    const locked = repeatSection(8, null);
    expect(loopReleased(locked, 16)).toBeNull();
    expect(loopReleased(locked, 12)).toBeNull();
    for (const bar of range(40).map((b) => b + 17)) {
      const end = loopEnd(loopReleased(locked, bar)!)!;
      expect(end, `released as bar ${bar} is next`).toBeGreaterThanOrEqual(bar);
      expect(end - bar, `released as bar ${bar} is next`).toBeLessThan(SECTION_BARS);
      expect((end - 16) % SECTION_BARS).toBe(0);
    }
    // A repeat that ends sooner is left as it is.
    expect(loopReleased(repeatSection(8, 1), 20)).toEqual(repeatSection(8, 1));
  });

  for (const seed of [1, 2, 3])
    it(`plays a section again, bar for bar, then goes on with the section it had decided next: a repeat sign (seed ${seed})`, () => {
      const plain = run(seed, 40).played;
      const looped = run(seed, 48, repeatSection(8, 1)).played;
      // Up to the repeat, the band plays as with no loop.
      expect(looped.slice(0, 16)).toEqual(plain.slice(0, 16));
      // The repeat is the section exactly, on bars 16 to 23.
      for (const i of range(SECTION_BARS)) {
        expect(looped[16 + i]!.bar).toBe(16 + i);
        expect(sound(looped[16 + i]!)).toEqual(sound(looped[8 + i]!));
      }
      // After it, the section the band had decided after bar 15 starts.
      expect(looped[24]!.plan).toEqual(plain[16]!.plan);
      expect(looped[24]!.chords).toEqual(plain[16]!.chords);
      expect(looped.slice(24).every((b, i) => b.bar === 24 + i && b.barInSection === i % 8)).toBe(
        true,
      );
    });

  it('holds a section locked for as long as it is, and holds what the band plans', () => {
    const { played, carried } = run(4, 16 + 5 * SECTION_BARS + 3, repeatSection(8, null));
    for (const bar of range(played.length - 16).map((b) => b + 16))
      expect(sound(played[bar]!), `bar ${bar}`).toEqual(sound(played[8 + (bar % 8)]!));
    const before = run(4, 16).carried;
    for (const held of ['plans', 'history', 'parts', 'ear'] as const)
      expect(carried[held], held).toEqual(before[held]);
    // The bar decided next moves on with the clock, and the bars kept are the last played.
    expect(carried.next).toEqual({ ...before.next!, bar: played.length });
    expect(carried.nextBar).toBe(played.length);
    expect(carried.kept.map((k) => k.decided.bar)).toEqual(
      range(8).map((i) => played.length - 8 + i),
    );
  });

  for (const stopAt of range(SECTION_BARS * 2).map((i) => 16 + i))
    it(`ends a song at any bar inside a lock, bar ${stopAt}, and the band goes on from it in its place`, () => {
      const loop = repeatSection(8, null);
      const { carried } = run(3, stopAt, loop);
      const finale = finaleBar(envAt(3, loop)(stopAt), carried);
      expect(finale.bar.bar).toBe(stopAt);
      // A forecast from the state it leaves still runs, the loop still standing or let go.
      for (const after of [loop, undefined]) {
        const ahead = lookAhead(finale.carried, (bar) => envAt(3, after)(bar), 12);
        expect(ahead.map((b) => b.bar)).toEqual(range(12).map((i) => stopAt + 1 + i));
      }
    });

  it('lets a lock go at any bar, the loop dropped mid-lap, and the band goes on in its place', () => {
    for (const drop of range(SECTION_BARS * 2).map((i) => 16 + i)) {
      const loop = repeatSection(8, null);
      let { carried } = run(2, drop, loop);
      for (let bar = drop; bar < drop + 12; bar++)
        carried = band.advance(envAt(2)(bar), carried, null).carried;
      expect(carried.nextBar, `dropped at bar ${drop}`).toBe(drop + 12);
    }
  });

  it('looks ahead through a loop as it plays: the plans and chords decided are those that play', () => {
    for (const loop of [repeatSection(8, 1), repeatSection(8, 2), repeatSection(8, null)]) {
      const { played } = run(5, 56, loop);
      for (const from of [3, 12, 15, 16, 21]) {
        const { carried } = run(5, from, loop);
        const ahead = lookAhead(carried, (bar) => envAt(5, loop)(bar), 56 - from);
        expect(
          ahead.map(({ bar, plan, chords }) => ({ bar, plan, chords })),
          `looked ahead from bar ${from}`,
        ).toEqual(played.slice(from).map(({ bar, plan, chords }) => ({ bar, plan, chords })));
      }
    }
  });

  it('passes a bar played again as it passes any, with nothing planned moved', () => {
    const loop = repeatSection(8, null);
    const { carried } = run(6, 18, loop);
    const passed = passBar(envAt(6, loop)(18), carried);
    for (const held of ['plans', 'history', 'parts', 'ear'] as const)
      expect(passed[held], held).toEqual(carried[held]);
    expect(passed.nextBar).toBe(19);
  });

  it('plays nothing again for a bar it passed, as nothing played there', () => {
    const loop = repeatSection(8, 1);
    let carried = band.initial;
    for (const bar of range(16)) {
      const env = envAt(7, loop)(bar);
      carried = bar === 10 ? passBar(env, carried) : band.advance(env, carried, null).carried;
    }
    const again = band.advance(envAt(7, loop)(18), { ...carried, nextBar: 18 }, null);
    expect(again.output.bar).toBe(18);
    expect(again.output.dough).toEqual([]);
  });

  it('ends a song inside a lock on a cadence, its key the lap’s', () => {
    const loop = repeatSection(8, null);
    const { played, carried } = run(8, 21, loop);
    const { bar } = finaleBar(envAt(8, loop)(21), carried);
    expect(bar.bar).toBe(21);
    expect(bar.chords).toEqual(cadence(played[16]!.plan.key));
  });
});
