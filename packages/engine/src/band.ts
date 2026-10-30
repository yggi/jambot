/**
 * The band: the machine at bar rate.
 *
 * It reads the seed, the bar, the style where the bar starts and the key the
 * players wish for. It reads the style as the score writes it, on a grid of
 * 3 decimals (`writtenStyle`, C7), so a bar states exactly the style it was
 * composed from. Each bar it plays one bar and decides the next: its
 * section's plan (form, key and theme), advanced when the bar starts a
 * section and held for its eight bars, and its chords. So a part can lead
 * into the next bar's chords, and what it leads into is what plays. A
 * section is planned, and a bar's chords coloured, from the style and the
 * wish where the bar before starts; bar 0 decides itself.
 *
 * It carries the plan's state, the bar it decided, the harmonic history of
 * the bars it decided (`history.ts`), which a section's plan reads to move
 * the key itself (#169), and what its parts carry. Where it has a learned
 * layer and rhythms, it carries the Muse's ear too (#401, `GrooveEar`): each
 * bar the drummer plays on a miss, and each bar players played on drums
 * that the Muse heard, so a section's grooves are filed where the next is
 * planned; and with bass lines (#423), the bass's own bars on a miss and
 * each bar players played as a bass; and with lead lines (#424), the lead's
 * own bars on a miss (`inventedBar`) and each player's motif, the lead's own
 * filed only in a section a player answered, where she heard a motif; and
 * with harmonies (#425), each player's bars of chords, kept a section longer,
 * since a progression is filed once all eight of its bars are heard. A bar is heard as it is decided past,
 * played or passed, so a forecast files as the band will. The bass plays
 * from the line its section's plans found (`PlanCarried.bassFragment`), as
 * the drummer from its rhythm; and with lead lines (#424), the lead's own
 * bars on a miss and each player's motif, the lead playing the line its
 * section's plans found (`PlanCarried.leadFragment`) as its phrase.
 * The parts play side by side from the same bar: the drums, the bass, the
 * comp and the lead. What they write, the band plays through the
 * performance (`performer.ts`, T4).
 *
 * Since what it decides reads only the seed, the bar, the style and the
 * wish, the bars ahead can be decided before they play (`lookAhead`): as
 * long as nobody moves a control, the forecast is what plays.
 */

import { type Meter, stepsOf } from '@jambot/theory';
import { chordsOn } from './chords.ts';
import type { BarEnv } from './bar.ts';
import { type BarChord, barChords } from './chords.ts';
import { bass, playBass } from './bass.ts';
import { type LineNote, type LineRepository, sectionNotes } from './bass-query.ts';
import { comp } from './comp.ts';
import { type LeadCarried, inventedBar, lead, playLead } from './lead.ts';
import { type LeadNote, type LeadRepository, leadPhrase } from './lead-query.ts';
import { type HeardLeadBar, SOLOIST, leadOf } from './muse-lead.ts';
import type { HarmonyRepository } from './harmony-query.ts';
import { type HeardHarmonyBar, sectionHarmony } from './muse-harmony.ts';
import { drums } from './drums.ts';
import { cadence, finale } from './ending.ts';
import {
  type DoughNote,
  type MeterChange,
  SONG_METER,
  type SongClock,
  type WrittenNote,
  clockOf,
  withMeter,
} from './events.ts';
import { SECTION_BARS, barEnergy } from './form.ts';
import type { HeardBars } from './facet.ts';
import { type HarmonicWeights, NO_HISTORY, foldBar } from './history.ts';
import type { KeyWish } from './key.ts';
import type { Machine } from './machine.ts';
import type { LearnedLayer } from './layer.ts';
import type { MeterRepository } from './meter-query.ts';
import { grooveBar } from './groove.ts';
import type { HeardDrumBar } from './muse-groove.ts';
import { BASSIST, type HeardLineBar, lineOf } from './muse-line.ts';
import { type FragmentHit, type RhythmRepository, sectionHits } from './rhythm-query.ts';
import type { Offer } from './muse.ts';
import { perform } from './performer.ts';
import { type Plan, type PlanCarried, planner } from './plan.ts';
import { type Style, writtenStyle } from './style.ts';
import { type MeterSwing, STRAIGHT } from './swing.ts';

export interface BandEnv {
  readonly seed: number;
  /** Counted from the song's start. */
  readonly bar: number;
  /** The style where the bar starts. */
  readonly style: Style;
  /** The key the players wish for, which a section boundary moves toward. */
  readonly wish: KeyWish;
  /** The meter asked for, which a section boundary takes (#261); where none is, the repository's (#375), or the song's 4/4. */
  readonly meter?: Meter | undefined;
  /**
   * The meter's swing asked for (#360): its level, which a section boundary
   * takes as it takes the meter, and its share where the bar starts, which
   * the bar plays at once. Straight where none is.
   */
  readonly swing?: MeterSwing | undefined;
  /** The repository the composer asks for a section's meter where none is asked for (#375). */
  readonly repository?: MeterRepository | undefined;
  /** What the host has learned, which the song starts from (#398); the plans carry it on from the first section. */
  readonly layer?: LearnedLayer | undefined;
  /** The repository the composer asks for a section's rhythm, which the drummer plays from (#397). */
  readonly rhythms?: RhythmRepository | undefined;
  /** The motif the Muse offers, which the lead settles on (#79). */
  readonly offer: Offer | null;
  /**
   * What players played on drums in bars the Muse heard since the bar before
   * (#401, `heardDrums`): each bar of the section playing joins what she
   * files at its end. None where nobody played drums.
   */
  readonly drumsHeard?: readonly HeardDrumBar[] | undefined;
  /** The session the band plays in, which a groove filed is tagged with (#401). */
  readonly session?: string | undefined;
  /** The repository the composer asks for a section's bass line, which the bass plays from (#423). */
  readonly bassLines?: LineRepository | undefined;
  /**
   * What players played as a bass in bars the Muse heard since the bar before
   * (#423, `heardBass`), each read as a line over its bar's chords: each bar
   * of the section playing joins what she files at its end.
   */
  readonly bassHeard?: readonly HeardLineBar[] | undefined;
  /** The repository the composer asks for a section's lead line, which the lead plays from (#424). */
  readonly leads?: LeadRepository | undefined;
  /**
   * What players played as a lead in bars the Muse heard since the bar
   * before (#424, `heardLead`), each motif she judged as a line: each bar of
   * the section playing joins what she files at its end.
   */
  readonly leadHeard?: readonly HeardLeadBar[] | undefined;
  /** The repository the composer asks for a section's theme, which the band plays (#425). */
  readonly harmonies?: HarmonyRepository | undefined;
  /**
   * What players played as chords in bars the Muse heard since the bar
   * before (#425, `heardHarmony`), each read as slots of its key: each bar
   * joins what she files a section after its own ends.
   */
  readonly harmonyHeard?: readonly HeardHarmonyBar[] | undefined;
}

/** What the Muse heard of one member in the section playing: the member's own bars where it played its own on a miss, and each player's. */
export interface HeardSection<Bar> {
  readonly own: readonly Bar[];
  readonly players: readonly HeardBars<Bar>[];
}

/**
 * What the Muse has heard in the section playing (#401, #423), for her to
 * file at its end, a member at a time: on drums, the drummer's bars where it
 * invents on a miss, and each player's; as a bass, the bass's where it plays
 * its own, and each player's. Kept only where the band has a layer to file
 * in and a repository of the member's. The bass's own bar is heard once the
 * bar after it is decided (`unheard`), since it leads into that bar's chords;
 * so the section's last bar, which leads into the next section's, is decided
 * after the section is filed, and isn't heard.
 */
export interface Ear {
  readonly section: number;
  readonly drums: HeardSection<readonly FragmentHit[]>;
  readonly bass: HeardSection<readonly LineNote[]>;
  readonly lead: HeardSection<readonly LeadNote[]>;
  /** The bass's own bar heard last, waiting for the chords of the bar after it. */
  readonly unheard: BarEnv | null;
  /**
   * The bars the lead played its own in, as it read them: the Muse hears
   * them (`inventedBar`) only at the section's end, and only where a player
   * answered, since only then are they filed (#424).
   */
  readonly leadBars: readonly BarEnv[];
  /**
   * Each player's bars heard as chords (#425), of the section playing and
   * the one before: a section's progression is filed once the next is
   * planned, when its last bars have been heard.
   */
  readonly harmony: readonly HeardHarmonyBar[];
}

/** Nothing heard of a member yet. */
const NOTHING_HEARD: HeardSection<never> = { own: [], players: [] };

/** A bar as decided the bar before: its section's plan and its chords. */
export interface DecidedBar {
  readonly bar: number;
  readonly plan: Plan;
  readonly chords: readonly BarChord[];
}

/** What each part carries from bar to bar. The drums carry nothing. */
export interface PartsCarried {
  /** The bass's last note. */
  readonly bass: number;
  /** The comp's last voicing. */
  readonly comp: readonly number[] | null;
  /** The lead's last note, its phrase and its themes' melodies. */
  readonly lead: LeadCarried;
}

export interface BandCarried {
  /** The section plan's carried state: the latest section planned, and the themes. */
  readonly plans: PlanCarried;
  /** The bar the band plays next, decided. */
  readonly next: DecidedBar | null;
  /** The harmonic history, up to and including the bar decided next. */
  readonly history: HarmonicWeights;
  readonly parts: PartsCarried;
  /** What the Muse has heard played in the section playing (#401, #423); null before a bar is heard, or with nothing to file in. */
  readonly ear: Ear | null;
}

/**
 * One bar as the band plays it: everything its parts read, the notes they
 * write, and each played by a performer, dough-shaped (#107, #129).
 */
export interface BandBar extends BarEnv {
  readonly written: readonly WrittenNote[];
  /** The written notes, each played by a performer. */
  readonly dough: readonly DoughNote[];
}

const INITIAL: BandCarried = {
  plans: planner.initial,
  next: null,
  history: NO_HISTORY,
  parts: { bass: bass.initial, comp: comp.initial, lead: lead.initial },
  ear: null,
};

/** The drummer's source, as a groove it invented is filed (#401); the bass's is `BASSIST` (#423). */
export const DRUMMER = 'drummer';

/**
 * Decide a bar from the style and wish where the bar composed now starts:
 * its plan, advanced at a section's first bar from the history so far, and
 * its chords, which the history then folds in.
 */
function decide(
  {
    seed,
    style,
    wish,
    meter,
    swing = STRAIGHT,
    repository,
    layer,
    rhythms,
    session,
    bassLines,
    leads,
    harmonies,
  }: BandEnv,
  bar: number,
  plans: PlanCarried,
  history: HarmonicWeights,
  ear: Ear | null = null,
): { plans: PlanCarried; decided: DecidedBar; history: HarmonicWeights } {
  const barInSection = bar % SECTION_BARS;
  const next =
    barInSection === 0
      ? planner.advance(
          {
            seed,
            index: bar / SECTION_BARS,
            style,
            wish,
            history,
            meter,
            swing: swing.level,
            repository,
            layer,
            rhythms,
            heard: ear && ear.section === bar / SECTION_BARS - 1 ? heardOf(ear.drums, DRUMMER) : [],
            session,
            share: swing.share,
            bassLines,
            bassHeard:
              ear && ear.section === bar / SECTION_BARS - 1 ? heardOf(ear.bass, BASSIST) : [],
            leads,
            // (the lead's own only where players answered it: a section where she heard a player's motif)
            leadHeard:
              ear && ear.section === bar / SECTION_BARS - 1 && ear.lead.players.length
                ? heardOf({ ...ear.lead, own: leadOwn(ear.leadBars) }, SOLOIST)
                : [],
            harmonies,
            harmonyHeard:
              ear && bar >= 2 * SECTION_BARS
                ? sectionHarmony(ear.harmony, bar - 2 * SECTION_BARS)
                : [],
          },
          plans,
          null,
        ).carried
      : plans;
  const plan = next.before!;
  const { key, theme } = plan;
  const chords = barChords({ seed, barInSection, key, theme, harm: style.harm });
  return { plans: next, decided: { bar, plan, chords }, history: foldBar(history, chords) };
}

/** A bar's swing: its section's level, at its section's share where the repository gave it, else the share asked for where it starts. */
const barSwing = ({ swing = STRAIGHT }: BandEnv, plan: Plan): MeterSwing => ({
  level: plan.swing,
  share: plan.share ?? swing.share,
});

/** A bar's environment as its parts read it, from the band's and the bar decided; `next` the chords of the bar after. */
function barEnvOf(env: BandEnv, here: DecidedBar, next: readonly BarChord[]): BarEnv {
  const barInSection = env.bar % SECTION_BARS;
  return {
    seed: env.seed,
    bar: env.bar,
    meter: here.plan.meter,
    plan: here.plan,
    barInSection,
    style: env.style,
    swing: barSwing(env, here.plan),
    barEnergy: barEnergy(env.style.energy, here.plan.section.type, barInSection),
    chords: here.chords,
    next,
    offer: env.offer,
  };
}

/** The lead's own bars as the Muse hears them: each a line over its key, those it rested in left out. */
const leadOwn = (bars: readonly BarEnv[]): (readonly LeadNote[])[] =>
  bars.map((b) => leadOf(inventedBar(b), b.plan.key)).filter((line) => line.length > 0);

/** What the Muse heard of a member, as the planner files it: the member's own first, under its source, then each player's. */
const heardOf = <Bar>(section: HeardSection<Bar>, member: string): HeardBars<Bar>[] => [
  ...(section.own.length ? [{ source: member, bars: section.own }] : []),
  ...section.players,
];

/** A member's heard section with a player's bar added, in the section playing. */
function withPlayer<Bar>(heard: HeardSection<Bar>, source: string, bar: Bar): HeardSection<Bar> {
  const players = [...heard.players];
  const at = players.findIndex((p) => p.source === source);
  if (at === -1) players.push({ source, bars: [bar] });
  else players[at] = { source, bars: [...players[at]!.bars, bar] };
  return { ...heard, players };
}

/**
 * The Muse's ear after the bar `here` (#401, #423), given the plans as of
 * it: where the band has a layer and a member's repository, the member's own
 * bar where its section found no fragment, as it plays it (the drums, each
 * hit at its performer's velocity, reading no bar after; the bass's bar
 * before, once `here`'s chords are what it led into, as a line over its
 * chords), and each player's bar heard in the same section. A new section
 * starts a new ear.
 */
function heard(env: BandEnv, here: DecidedBar, plans: PlanCarried, ear: Ear | null): Ear | null {
  if ((!env.rhythms && !env.bassLines && !env.leads && !env.harmonies) || plans.layer === null)
    return null;
  const section = Math.floor(here.bar / SECTION_BARS);
  let now: Ear =
    ear?.section === section
      ? ear
      : {
          section,
          drums: NOTHING_HEARD,
          bass: NOTHING_HEARD,
          lead: NOTHING_HEARD,
          unheard: null,
          leadBars: [],
          // (the chords heard in the section before stay, to be filed once this one's next is planned)
          harmony: (ear?.harmony ?? []).filter(
            (h) => Math.floor(h.bar / SECTION_BARS) >= section - 1,
          ),
        };
  if (now.unheard) {
    const bar = { ...now.unheard, next: here.chords };
    const played = playBass(bar, bass.initial).output;
    const line = lineOf(played, chordsOn(bar.chords, bar.meter), chordsOn(bar.next, bar.meter));
    now = { ...now, bass: { ...now.bass, own: [...now.bass.own, line] }, unheard: null };
  }
  if (env.rhythms && here.plan.rhythmFragment === undefined) {
    const bar = barEnvOf(env, here, []);
    const hits = drums(bar).map((n) => ({
      role: n.role!,
      note: n.note,
      step: n.step,
      velocity: perform(bar, n).velocity,
    }));
    now = { ...now, drums: { ...now.drums, own: [...now.drums.own, hits] } };
  }
  if (env.bassLines && plans.bassFragment === null)
    now = { ...now, unheard: barEnvOf(env, here, []) };
  if (env.leads && plans.leadFragment === null)
    now = { ...now, leadBars: [...now.leadBars, barEnvOf(env, here, [])] };
  for (const { source, bar, hits } of env.drumsHeard ?? [])
    if (Math.floor(bar / SECTION_BARS) === section)
      now = { ...now, drums: withPlayer(now.drums, source, hits) };
  for (const { source, bar, notes } of env.bassHeard ?? [])
    if (Math.floor(bar / SECTION_BARS) === section)
      now = { ...now, bass: withPlayer(now.bass, source, notes) };
  for (const { source, bar, notes } of env.leadHeard ?? [])
    if (Math.floor(bar / SECTION_BARS) === section)
      now = { ...now, lead: withPlayer(now.lead, source, notes) };
  if (env.harmonies) {
    const chords = (env.harmonyHeard ?? []).filter(
      (h) => Math.floor(h.bar / SECTION_BARS) >= section - 1,
    );
    if (chords.length) now = { ...now, harmony: [...now.harmony, ...chords] };
  }
  return now;
}

/** The environment as the band reads it: its style as the score writes it (C7). */
const read = (env: BandEnv): BandEnv => ({ ...env, style: writtenStyle(env.style) });

/** The bar to play now, the plans as of it, and the carried state with the bar after it decided. */
function step(
  env: BandEnv,
  carried: BandCarried,
): { here: DecidedBar; at: PlanCarried; carried: BandCarried } {
  let { plans, history } = carried;
  let here = carried.next;
  if (!here) {
    if (env.bar !== 0) throw new Error(`band: bar ${env.bar}, but the song starts at bar 0`);
    ({ plans, decided: here, history } = decide(env, 0, plans, history));
  } else if (here.bar !== env.bar)
    throw new Error(`band: bar ${env.bar}, but the band decided bar ${here.bar} next`);
  // The bar is heard before the next is decided, so a section's last bar joins what is filed at its end.
  const ear = heard(env, here, plans, carried.ear);
  const after = decide(env, env.bar + 1, plans, history, ear);
  return {
    here,
    at: plans,
    carried: { ...carried, plans: after.plans, next: after.decided, history: after.history, ear },
  };
}

/**
 * The band past a bar it doesn't play, as when the clock has passed it: the
 * plan and the chords move on as if it had played. The parts don't play it,
 * so they carry on from where they were: what they carry is register, and
 * it resumes from the last note heard.
 */
export function passBar(env: BandEnv, carried: BandCarried): BandCarried {
  return step(read(env), carried).carried;
}

/**
 * The next `count` bars as the band will decide them, from the bar it
 * decided next (bar 0 before the song starts): their plans and chords,
 * without the parts. It runs the band's own decisions forward, as passing
 * those bars does, reading the environment of each bar from `envAt`, given
 * the song's clock as far as the bars before it are known: `meters` are
 * those already laid, and each bar decided adds its own (#261).
 */
export function lookAhead(
  carried: BandCarried,
  envAt: (bar: number, clock: SongClock) => BandEnv,
  count: number,
  meters: readonly MeterChange[] = [{ bar: 0, meter: SONG_METER }],
): DecidedBar[] {
  return plannedAhead(carried, envAt, count, meters).map((p) => p.bar);
}

/**
 * `lookAhead`, each bar with the plans' state as of it, which holds what a
 * bar's plan doesn't carry to a session's clients: the bass line its
 * section plays from (`PlanCarried.bassFragment`, #423).
 */
export function plannedAhead(
  carried: BandCarried,
  envAt: (bar: number, clock: SongClock) => BandEnv,
  count: number,
  meters: readonly MeterChange[] = [{ bar: 0, meter: SONG_METER }],
): { readonly bar: DecidedBar; readonly plans: PlanCarried }[] {
  const bars: { bar: DecidedBar; plans: PlanCarried }[] = [];
  let changes = meters;
  for (let bar = carried.next?.bar ?? 0; bars.length < count; bar++) {
    const { here, at, carried: after } = step(read(envAt(bar, clockOf(changes))), carried);
    bars.push({ bar: here, plans: at });
    changes = withMeter(changes, bar, here.plan.meter);
    carried = after;
  }
  return bars;
}

export const band: Machine<BandEnv, BandCarried, null, BandBar> = {
  initial: INITIAL,
  advance(given, carried) {
    const env = read(given);
    const { here, at, carried: after } = step(env, carried);
    const bar = barEnvOf(env, here, after.next!.chords);
    const { barInSection } = bar;
    const line = env.bassLines
      ? sectionNotes(
          env.bassLines,
          at.bassFragment ?? undefined,
          bar.meter,
          barInSection,
          stepsOf(bar.meter),
          after.plans.layer ?? undefined,
        )
      : [];
    const bassline = playBass(bar, carried.parts.bass, line);
    const comping = comp.advance(bar, carried.parts.comp, null);
    const figure = env.leads
      ? leadPhrase(
          env.leads,
          at.leadFragment ?? undefined,
          bar.meter,
          stepsOf(bar.meter),
          after.plans.layer ?? undefined,
        )
      : null;
    const melody = playLead(bar, carried.parts.lead, figure, at.leadFragment ?? undefined);
    const parts = { bass: bassline.carried, comp: comping.carried, lead: melody.carried };
    const rhythm = env.rhythms
      ? sectionHits(
          env.rhythms,
          here.plan,
          bar.meter,
          barInSection,
          stepsOf(bar.meter),
          after.plans.layer ?? undefined,
        )
      : [];
    const written = [
      ...grooveBar(bar, drums(bar), rhythm),
      ...bassline.output,
      ...comping.output,
      ...melody.output,
    ];
    return { carried: { ...after, parts }, output: playBar(bar, written) };
  },
};

/**
 * The band's last bar: the one it plays instead of the next, which closes
 * the song on a cadence (`ending.ts`). It is decided as any bar is, so its
 * section and key are the plan's, and then its chords are the cadence in
 * that key. The band goes on from it as from any bar, its plan and history
 * moved on, so a forecast from the state it leaves still runs; the parts
 * carry what they did, as the song's end wrote nothing they lead from.
 */
export function finaleBar(
  given: BandEnv,
  carried: BandCarried,
): { carried: BandCarried; bar: BandBar } {
  const env = read(given);
  const { here, carried: after } = step(env, carried);
  const chords = cadence(here.plan.key);
  const bar: BarEnv = { ...barEnvOf(env, here, [chords[1]!]), chords };
  return { carried: after, bar: playBar(bar, finale(bar, carried.parts)) };
}

/**
 * A bar's written notes as the band plays them: each through a performer.
 * It is where writing ends and playing starts, so a bar written elsewhere
 * (a host's) plays here exactly as the band that wrote it would play it.
 */
export function playBar(bar: BarEnv, written: readonly WrittenNote[]): BandBar {
  return { ...bar, written, dough: written.map((note) => perform(bar, note)) };
}
