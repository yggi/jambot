import { describe, expect, it } from 'vitest';
import { form } from './form.ts';
import { NO_HISTORY, centre } from './history.ts';
import {
  COMPOSER_MODES,
  INITIAL_KEY,
  type Key,
  type KeyWish,
  MELODIC_SCALES,
  type MelodicScale,
  nextKey,
  released,
} from './key.ts';
import { fifthsApart, harmonicReach, licenceOf, melodicDefault } from './licence.ts';
import { type Script, lawBreaks } from './machine.ts';
import { type Plan, type PlanEnv, bandWish, planner } from './plan.ts';
import { INITIAL_STYLE, PRESETS, type Style } from './style.ts';
import { themeKind } from './themes.ts';
import { presetMode } from './mode-repository.ts';
import { HARMONY_REPOSITORY } from './progressions.ts';
import { LEAD_REPOSITORY } from './lead-lines.ts';
import { EMPTY_LAYER } from './layer.ts';

const range = (n: number) => [...Array(n).keys()];

/** A tour: a new preset every section, with entropy rising, wishing for each preset's mode. */
const tour = (seed: number, sections = 24): Script<PlanEnv, null> =>
  range(sections).map((index) => {
    const preset = PRESETS[index % PRESETS.length]!;
    const style = { ...preset.style, entropy: (index % 4) / 4 };
    return {
      env: {
        seed,
        index,
        style,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        history: NO_HISTORY,
      },
      input: null,
    };
  });

const run = (script: Script<PlanEnv, null>): Plan[] => {
  let carried = planner.initial;
  return script.map(({ env, input }) => {
    const next = planner.advance(env, carried, input);
    carried = next.carried;
    return next.output;
  });
};

/** One steady style and wish for every section. */
const steady = (seed: number, style: Style, wish: KeyWish, sections = 40): Script<PlanEnv, null> =>
  range(sections).map((index) => ({
    env: { seed, index, style, wish, history: NO_HISTORY },
    input: null,
  }));

/** A script whose harmony is a static vamp, so the band never moves the key itself. */
const vamp = (script: Script<PlanEnv, null>): Script<PlanEnv, null> =>
  script.map(({ env, input }) => ({ env: { ...env, style: { ...env.style, harm: 0 } }, input }));

/** How many sections change key over `seeds` songs of `sections` in one style, wishing for no tonic. */
const drifts = (style: Style, seeds = 200, sections = 24) => {
  let moves = 0;
  for (const seed of range(seeds)) {
    const plans = run(steady(seed, style, aeolian, sections));
    for (let i = 1; i < plans.length; i++)
      if (plans[i]!.key.tonic !== plans[i - 1]!.key.tonic) moves++;
  }
  return moves / (seeds * (sections - 1));
};

const aeolian: KeyWish = { tonic: null, mode: 'aeolian', melodic: null };

describe('the section plan', () => {
  it('keeps the machine laws over a tour of the presets and their modes (F1, Q4a)', () => {
    for (const seed of [1, 2, 3]) expect(lawBreaks(planner, tour(seed))).toEqual([]);
  });

  it('follows the form', () => {
    for (const seed of [1, 2, 3]) {
      let before = form.initial;
      for (const [index, plan] of run(tour(seed)).entries()) {
        const { style } = tour(seed)[index]!.env;
        const section = form.advance({ seed, index, style }, before, null).output;
        expect(plan.section).toEqual(section);
        before = section;
      }
    }
  });

  it('moves the key toward the wish once per section, from the initial key', () => {
    for (const seed of [1, 2, 3]) {
      const script = vamp(tour(seed));
      let key = INITIAL_KEY;
      for (const [index, plan] of run(script).entries()) {
        key = nextKey(key, script[index]!.env.wish);
        expect(plan.key).toEqual(key);
      }
    }
  });

  it('settles on a steady wish: the key moves once, then stays (C6)', () => {
    for (const mode of COMPOSER_MODES)
      for (const tonic of [null, 0, 9]) {
        const plans = run(
          steady(1, { ...INITIAL_STYLE, harm: 0 }, { tonic, mode, melodic: null }, 8),
        );
        for (const plan of plans) expect(plan.key).toEqual(plans[0]!.key);
        expect(plans[0]!.key.mode).toBe(mode);
        if (tonic !== null) expect(plans[0]!.key.tonic).toBe(tonic);
      }
  });

  it('never moves the key itself where the harmony is a static vamp (harm 0), whatever the entropy (#169)', () => {
    expect(drifts({ ...INITIAL_STYLE, harm: 0, entropy: 1 })).toBe(0);
  });

  it('never moves the key itself at entropy 0, and the more often the higher the entropy (#169)', () => {
    const style = { ...INITIAL_STYLE, harm: 0.5 };
    expect(drifts({ ...style, entropy: 0 })).toBe(0);
    const low = drifts({ ...style, entropy: 0.25 });
    const high = drifts({ ...style, entropy: 1 });
    expect(low).toBeGreaterThan(0);
    expect(high).toBeGreaterThan(2 * low);
  });

  it('moves the key only within the harmony’s reach, in the mode playing, and never in the first section (#169)', () => {
    for (const harm of [0.1, 0.25, 0.5, 0.75, 1]) {
      const style = { ...INITIAL_STYLE, harm, entropy: 1 };
      for (const seed of range(20)) {
        const plans = run(steady(seed, style, aeolian, 24));
        expect(plans[0]!.key).toEqual(INITIAL_KEY);
        for (let i = 1; i < plans.length; i++) {
          const [before, after] = [plans[i - 1]!.key, plans[i]!.key];
          expect(after.mode).toBe(before.mode);
          expect(Math.abs(fifthsApart(after, before))).toBeLessThanOrEqual(harmonicReach(style));
        }
      }
    }
  });

  it('always takes the players’ wish over its own: a tonic, or another mode (#169)', () => {
    const style = { ...INITIAL_STYLE, harm: 1, entropy: 1 };
    for (const seed of range(20)) {
      for (const plan of run(steady(seed, style, { tonic: 2, mode: 'dorian', melodic: null }, 12)))
        expect(plan.key).toEqual({ tonic: 2, mode: 'dorian' });
      // A mode wished from section 1 on: the band pivots to it, and doesn't move on its own.
      const ionian = { tonic: null, mode: 'ionian', melodic: null } as const;
      const script = steady(seed, style, aeolian, 2).map(({ env, input }) => ({
        env: { ...env, wish: env.index === 1 ? ionian : env.wish },
        input,
      }));
      const plans = run(script);
      expect(plans[1]!.key).toEqual(nextKey(plans[0]!.key, ionian));
    }
  });

  it('leans toward the key its harmonic history centres on (#169, C9)', () => {
    // A history of E aeolian's scale, the band in A aeolian, one fifth either way: E or D.
    const e: Key = { tonic: 4, mode: 'aeolian' };
    const history = [...NO_HISTORY];
    for (const pitchClass of [4, 6, 7, 9, 11, 0, 2]) history[pitchClass] = 1;
    expect(centre(history, INITIAL_KEY)).toEqual(e);
    const style = { ...INITIAL_STYLE, harm: 1 / 6, entropy: 1 };
    const wishes = range(400)
      .map((seed) => bandWish({ seed, index: 1, style, history }, INITIAL_KEY))
      .filter((w) => w !== null);
    expect(wishes.length).toBeGreaterThan(100);
    for (const wish of wishes) expect([2, 4]).toContain(wish.tonic);
    expect(wishes.filter((w) => w.tonic === 4).length / wishes.length).toBeGreaterThan(0.7);
  });

  it("plays the theme of its section's kind, in its key's mode", () => {
    for (const seed of [1, 2, 3])
      for (const plan of run(tour(seed))) {
        expect(plan.theme.kind).toBe(themeKind(plan.section.type));
        expect(plan.theme.mode).toBe(plan.key.mode);
      }
  });

  it('brings a theme back while the style stays near it, but builds each build afresh (Q8)', () => {
    const style = { ...INITIAL_STYLE, energy: 0.8, entropy: 0 };
    for (const seed of range(10)) {
      const plans = run(steady(seed, style, aeolian));
      // (within a song: a new song writes its own themes, #655)
      const songs = new Map<number, typeof plans>();
      let song = -1;
      for (const p of plans) {
        if (p.section.song?.at === 0) song++;
        songs.set(song, [...(songs.get(song) ?? []), p]);
      }
      for (const kind of ['A', 'B'] as const) {
        let returned = 0;
        for (const inSong of songs.values()) {
          const themes = inSong.filter((p) => p.theme.kind === kind).map((p) => p.theme);
          for (const theme of themes) expect(theme).toEqual(themes[0]);
          returned += Math.max(0, themes.length - 1);
        }
        expect(returned).toBeGreaterThan(0);
      }
      for (const plan of plans.filter((p) => p.theme.kind === 'build'))
        expect(plan.theme.index).toBe(plan.section.index);
    }
  });

  it('builds a theme anew when the harmony has moved more than 0.2 from it, where the chain plays (Q8)', () => {
    // (a corner no song form lies near, so no song holds its themes: offbeat, paddy and dark, #547 rung 5)
    const corner = { ...INITIAL_STYLE, sync: 1, artic: 0, mood: 0, entropy: 0 };
    for (const seed of range(10))
      for (const [step, fresh] of [
        [0.1875, false],
        [0.25, true],
      ] as const) {
        const script = steady(seed, { ...corner, harm: 0.6875 }, aeolian).map(({ env, input }) => ({
          env: { ...env, style: { ...env.style, harm: 0.6875 + (env.index >= 20 ? step : 0) } },
          input,
        }));
        const plans = run(script);
        const before = plans.slice(0, 20).findLast((p) => p.theme.kind === 'A')!.theme;
        const after = plans.slice(20).find((p) => p.theme.kind === 'A')!;
        expect(after.theme.index === after.section.index).toBe(fresh);
        if (!fresh) expect(after.theme).toEqual(before);
      }
  });

  it('keeps a song’s theme though the harmony moved more than 0.2, while the song still fits (#547 rung 5)', () => {
    for (const seed of range(10)) {
      const script = steady(seed, { ...INITIAL_STYLE, harm: 0.375, entropy: 0 }, aeolian).map(
        ({ env, input }) => ({
          env: { ...env, style: { ...env.style, harm: 0.375 + (env.index >= 20 ? 0.25 : 0) } },
          input,
        }),
      );
      const plans = run(script);
      expect(plans.every((p) => p.section.song !== undefined)).toBe(true);
      const before = plans.slice(0, 20).findLast((p) => p.theme.kind === 'A')!.theme;
      expect(plans.slice(20).find((p) => p.theme.kind === 'A')!.theme).toEqual(before);
    }
  });

  it('builds a theme anew when the mode changes (Q8)', () => {
    for (const seed of range(10)) {
      const script = steady(seed, { ...INITIAL_STYLE, entropy: 0 }, aeolian).map(
        ({ env, input }) => ({
          env: {
            ...env,
            wish: env.index >= 20 ? { ...env.wish, mode: 'dorian' as const } : env.wish,
          },
          input,
        }),
      );
      const after = run(script)
        .slice(20)
        .find((p) => p.theme.kind === 'A')!;
      expect(after.theme.index).toBe(after.section.index);
      expect(after.theme.mode).toBe('dorian');
    }
  });

  it('renews a returning theme at random in the chain’s sections, the more often the higher the entropy, and never within a song (Q8, #655)', () => {
    // (a corner of style space no song form is placed near, where the chain plays: offbeat, moving, paddy and dark)
    const far = { ...INITIAL_STYLE, sync: 1, harm: 1, artic: 0, mood: 0, energy: 0.8 };
    const renewed = (entropy: number, at = far) => {
      let returns = 0;
      let fresh = 0;
      for (const seed of range(200)) {
        const plans = run(steady(seed, { ...at, entropy }, aeolian, 24));
        const seen = new Set<string>();
        for (const plan of plans) {
          const { kind } = plan.theme;
          if (kind === 'build') continue;
          // (a song's first section starts it afresh: its themes are its own)
          if (plan.section.song?.at === 0) seen.clear();
          if (seen.has(kind)) {
            returns++;
            if (plan.theme.index === plan.section.index) fresh++;
          }
          seen.add(kind);
        }
      }
      return fresh / returns;
    };
    for (const entropy of [0, 0.5, 1])
      expect(renewed(entropy, { ...INITIAL_STYLE, energy: 0.8 })).toBe(0);
    expect(renewed(0)).toBe(0);
    expect(renewed(0.5)).toBeGreaterThan(0.1);
    expect(renewed(0.5)).toBeLessThan(0.2);
    expect(renewed(1)).toBeGreaterThan(0.25);
    expect(renewed(1)).toBeLessThan(0.35);
  });

  it("moves a B vamp away from the A theme's vamp", () => {
    const style = { ...INITIAL_STYLE, harm: 0.2, energy: 0.2, entropy: 0 };
    let bs = 0;
    for (const seed of range(50)) {
      const plans = run(steady(seed, style, aeolian, 24));
      for (const [i, plan] of plans.entries()) {
        if (plan.theme.kind !== 'B' || plan.theme.index !== plan.section.index) continue;
        const a = plans.slice(0, i).findLast((p) => p.theme.kind === 'A')!.theme;
        expect(plan.theme.vamp).not.toBe(a.vamp);
        bs++;
      }
    }
    expect(bs).toBeGreaterThan(0);
  });
});

describe('the melodic scale a section plays', () => {
  /** Every harm on a grid of 60ths, which holds both thresholds of the melodic reach. */
  const HARMS = [...Array(61).keys()].map((i) => i / 60);
  const wishing = (melodic: MelodicScale | null): KeyWish => ({ ...aeolian, melodic });

  it('is the wish where the style reaches it, else the style’s default, at every harm (#209)', () => {
    for (const harm of HARMS)
      for (const melodic of [null, ...MELODIC_SCALES]) {
        const style = { ...INITIAL_STYLE, harm };
        const reached = melodic !== null && licenceOf(style).melodic.includes(melodic);
        for (const plan of run(steady(3, style, wishing(melodic), 4)))
          expect(plan.melodic).toBe(reached ? melodic : melodicDefault(style));
      }
    // The default is the plain scale, so a wish beyond the reach plays that.
    const vampish = { ...INITIAL_STYLE, harm: 0.5 };
    for (const plan of run(steady(3, vampish, wishing('blues'), 4)))
      expect(plan.melodic).toBe('plain');
  });

  it('follows a wish from the next section it plans, and not before (#209)', () => {
    const style = { ...INITIAL_STYLE, harm: 1 };
    for (const seed of range(5)) {
      const script = steady(seed, style, aeolian, 12).map(({ env, input }) => ({
        env: { ...env, wish: wishing(env.index >= 5 ? 'pentatonic' : null) },
        input,
      }));
      const plans = run(script);
      expect(plans.map((p) => p.melodic)).toEqual(
        range(12).map((i) => (i >= 5 ? 'pentatonic' : 'plain')),
      );
    }
  });

  it('stands once met, as the mode does, while a tonic wished for lets go (#209)', () => {
    // As the player does: after each section, the wish as released by the key planned.
    for (const seed of range(5)) {
      let wish: KeyWish = { tonic: 2, mode: 'dorian', melodic: 'blues' };
      let carried = planner.initial;
      for (const index of range(12)) {
        const env = {
          seed,
          index,
          style: { ...INITIAL_STYLE, harm: 1 },
          wish,
          history: NO_HISTORY,
        };
        const next = planner.advance(env, carried, null);
        carried = next.carried;
        expect(next.output.melodic).toBe('blues');
        wish = released(wish, next.output.key);
        expect(wish.melodic).toBe('blues');
        if (index > 0) expect(wish.tonic).toBeNull();
      }
    }
  });

  it('changes nothing else a section plays: its form, key and theme are the plain scale’s (#209)', () => {
    for (const seed of [1, 2, 3])
      for (const melodic of MELODIC_SCALES) {
        const plain = run(tour(seed));
        const wished = tour(seed).map(({ env, input }) => ({
          env: { ...env, wish: { ...env.wish, melodic } },
          input,
        }));
        run(wished).forEach((plan, i) => {
          expect({ ...plan, melodic: 'plain' }).toEqual(plain[i]);
        });
      }
  });
});

describe('the station (#547 rung 5, the owner’s rulings of 2026-11-23): songs in a rotation', () => {
  /** Each section's plan and the song the station plays it in, by id, held at a preset with the repositories. */
  const station = (presetName: string, entropy: number, sections: number, seed = 1) => {
    const preset = PRESETS.find((p) => p.name === presetName)!;
    const style = { ...preset.style, entropy };
    let carried = planner.initial;
    return range(sections).map((index) => {
      const env: PlanEnv = {
        seed,
        index,
        style,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        history: NO_HISTORY,
        harmonies: HARMONY_REPOSITORY,
        leads: LEAD_REPOSITORY,
      };
      const next = planner.advance(env, carried, null);
      carried = next.carried;
      return {
        plan: next.output,
        song: carried.song,
        rotation: carried.rotation,
        lead: carried.leadFragment,
      };
    });
  };
  /** Each song's plays: its sections' plans, play by play. */
  const playsOf = (run: ReturnType<typeof station>) => {
    const plays = new Map<number, Plan[][]>();
    for (const { plan, song } of run) {
      if (song === null) continue;
      const list = plays.get(song) ?? [];
      if (plan.section.song?.at === 0) list.push([]);
      list.at(-1)?.push(plan);
      plays.set(song, list);
    }
    return plays;
  };

  it('never plays a song twice in a row above entropy 0, and plays songs again once its rotation is full', () => {
    for (const name of ['Synth-pop', 'Techno', 'Deep house', 'Swing jazz']) {
      const run = station(name, 0.3, 160);
      const starts = run.filter((s) => s.plan.section.song?.at === 0).map((s) => s.song);
      expect(starts.length, name).toBeGreaterThan(10);
      for (let i = 1; i < starts.length; i++) expect(starts[i], name).not.toBe(starts[i - 1]);
      // (8 songs at entropy 0.3, each new until the rotation is full; then again)
      expect(new Set(starts).size, name).toBe(8);
      expect(run.every((s) => s.rotation.songs.length <= 8)).toBe(true);
    }
  });

  it('plays a song again with its own themes, their progressions and its lead line, whatever it played between', () => {
    for (const name of ['Synth-pop', 'Swing jazz', 'Kinderlied']) {
      const run = station(name, 0.3, 160);
      let again = 0;
      for (const [id, plays] of playsOf(run)) {
        const themesOf = (play: Plan[]) =>
          play.map((p) => (p.theme.kind === 'build' ? null : JSON.stringify(p.theme)));
        const kindsOf = (play: Plan[]) => play.map((p) => p.section.type);
        const first = plays[0]!;
        for (const play of plays.slice(1)) {
          if (play.length !== first.length) continue;
          again++;
          expect(themesOf(play), `${name}, song ${id}`).toEqual(themesOf(first));
          expect(kindsOf(play)).toEqual(kindsOf(first));
        }
      }
      expect(again, name).toBeGreaterThan(5);
      // (each play of a song starts from its lead line, once it has one; within the play the ladder may vary it)
      let starts = 0;
      for (const { plan, song, rotation, lead } of run) {
        const kept = rotation.songs.find((s) => s.id === song)?.lead ?? null;
        if (kept === null || plan.section.song?.at !== 0) continue;
        starts++;
        expect(lead, `${name}, song ${song}`).toBe(kept);
      }
      expect(starts, name).toBeGreaterThan(10);
    }
  });

  it('gives a new song another lead line once the composer tired of the last song’s, where it learns', () => {
    // (with a layer, as a host plays: 160 sections at entropy 0.3 make 8 songs; their leads, a preset's own line, its
    // variations and the next nearest)
    for (const name of ['Synth-pop', 'Techno', 'Swing jazz', 'Kinderlied', 'Ambient']) {
      const preset = PRESETS.find((p) => p.name === name)!;
      let carried = planner.initial;
      for (const index of range(160))
        carried = planner.advance(
          {
            seed: 1,
            index,
            style: { ...preset.style, entropy: 0.3 },
            wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
            history: NO_HISTORY,
            harmonies: HARMONY_REPOSITORY,
            leads: LEAD_REPOSITORY,
            layer: EMPTY_LAYER,
          },
          carried,
          null,
        ).carried;
      const leads = new Set(carried.rotation.songs.map((s) => s.lead));
      expect(carried.rotation.songs.length, name).toBe(8);
      expect(leads.size, name).toBeGreaterThanOrEqual(3);
    }
  });

  it('plays one song over and over at entropy 0, the same plans every time', () => {
    const run = station('Synth-pop', 0, 48);
    expect(new Set(run.map((s) => s.song))).toEqual(new Set([1]));
    const plays = playsOf(run).get(1)!;
    expect(plays.length).toBe(6);
    const shape = (play: Plan[]) => play.map((p) => [p.section.type, JSON.stringify(p.theme)]);
    for (const play of plays.slice(1)) expect(shape(play)).toEqual(shape(plays[0]!));
  });
});
