/**
 * E31: the band's drums as cells text (#309, the seam).
 *
 * For each preset held, one bar the band writes (seed 0, entropy 0.3, the
 * first of 32 bars with the most roles, then the most hits), its drum part
 * stated as cells text by a small translator, compiled by `@yggi/cells`, and
 * played through cells' own MIDI path (`channelTable`, `router`, `midiNote`):
 * which sound, on which step, for how long and how hard, against the hits the
 * band plays. The band keeps playing as it does; this is a probe.
 *
 * The translator, `drumsAsCells`, uses only forms cells has:
 *
 * - the bar, `&bar scan(1 1 1 1) step=<bpm>bpm`, and a line on its 16ths, `step=16n`;
 * - one line per role, named by it (`&ghost`): a role is a cell, so the snare's open role (E16) is a word;
 * - a hit is its sound's voice, by the score's words (`DRUM_WORDS`) and cells' `sd` for the snare, which the score has no word for yet; cells' MIDI out sends each name as its General MIDI drum note;
 * - its accent is its own level, `&sd:0:.0635`: MIDI out strikes a note at 127·√level, so a velocity v is the level (v/127)²;
 * - the rim, which the band writes as `even(k, 16, shift)` (E16), is one Euclid token, `&rim(k,16,r)` on a step of the whole bar, and its levels a line of their own (`map=amp`) that the card multiplies it by;
 * - one MIDI card on channel 10 plays the lines, and each voice names a sound (`s=white`), since cells has no voice without one (gap 1).
 *
 * Where cells cannot say what a bar's drums do, the probe records a gap with
 * the bar as witness, and invents no form; the gaps are in
 * `docs/language-experiments.md`, E31, and the test holds each.
 *
 * It runs under vitest. Its test, `drums-in-cells.test.ts`, holds what it
 * found;
 * `E31_REPORT=1 pnpm vitest run --silent=false packages/score/experiments/drums-in-cells.test.ts`
 * also prints each bar and its text.
 */

import {
  BAR_STEPS,
  type BandBar,
  type BandCarried,
  DRUM_NOTES,
  DRUM_ROLES,
  type DrumRole,
  PRESETS,
  SONG_METER,
  band,
  stepSeconds,
} from '@jambot/engine';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { bjorklund } from '@yggi/cells/engine/parser/generators';
import { DRUM_WORDS } from '../src/score.ts';

/** The run each witness bar comes from. */
export const SEED = 0;
export const ENTROPY = 0.3;
export const BARS = 32;

/** One drum hit as it goes out: its General MIDI note, step, length in steps and velocity. */
export interface Hit {
  readonly note: number;
  readonly step: number;
  readonly length: number;
  readonly velocity: number;
}

/** The voice each drum note is written with: the score's words, and cells' `sd` for the snare. */
export const VOICE_OF_NOTE: ReadonlyMap<number, string> = new Map([
  ...Object.entries(DRUM_WORDS).map(
    ([sound, word]) => [DRUM_NOTES[sound as keyof typeof DRUM_WORDS], word] as const,
  ),
  [DRUM_NOTES.snare, 'sd'] as const,
]);

/** A velocity as a level, (v/127)², which cells' MIDI out strikes at 127·√level: six decimals, no leading 0. */
export function levelOf(velocity: number): string {
  if (velocity >= 127) return '1';
  return ((velocity / 127) ** 2).toFixed(6).replace(/0+$/, '').replace(/^0/, '');
}

/** A hit's own level after its voice (`&sd:0:.0635`), none at full velocity. */
const hitLevel = (velocity: number) => (velocity >= 127 ? '' : `:0:${levelOf(velocity)}`);

/** The rotation `r` at which cells' `euclid(k, n, r)` hits exactly these steps of `n`, if any. */
export function euclidOf(steps: readonly number[], n = BAR_STEPS): { k: number; r: number } | null {
  const k = steps.length;
  if (k === 0 || k >= n) return null;
  const want = [...steps].sort((a, b) => a - b).join();
  const from = bjorklund(k, n).flatMap((on, j) => (on ? [j] : []));
  for (let r = 0; r < n; r++)
    if (
      from
        .map((j) => (j + r) % n)
        .sort((a, b) => a - b)
        .join() === want
    )
      return { k, r };
  return null;
}

/** A bar's drum hits, as the band plays them, each with its role. */
export const bandDrums = (bar: BandBar) => bar.dough.filter((n) => n.part === 'drums');

/** The roles a bar's drums play, in the band's order (the stronger first). */
export const rolesOf = (bar: BandBar): DrumRole[] =>
  DRUM_ROLES.filter((role) => bandDrums(bar).some((n) => n.role === role));

/** The steps of a bar, each mapped. */
const eachStep = (f: (step: number) => string) =>
  Array.from({ length: BAR_STEPS }, (_, step) => f(step)).join(' ');

/** A role's lines, and the term the card plays it by. */
function roleLines(bar: BandBar, role: DrumRole): { lines: string[]; term: string } {
  const hits = bandDrums(bar).filter((n) => n.role === role);
  const notes = new Set(hits.map((n) => n.note));
  const euclid = role === 'euclid' && notes.size === 1 ? euclidOf(hits.map((n) => n.step)) : null;
  if (euclid) {
    const voice = VOICE_OF_NOTE.get(hits[0]!.note)!;
    const level = (step: number) => hits.find((n) => n.step === step)?.velocity;
    return {
      lines: [
        `&${role} step=1m &${voice}(${euclid.k},${BAR_STEPS},${euclid.r})`,
        `&${role}Level map=amp step=16n ${eachStep((s) => (level(s) ? levelOf(level(s)!) : '0'))}`,
      ],
      term: `&${role} * &${role}Level`,
    };
  }
  const braid = eachStep((step) => {
    const words = hits
      .filter((n) => n.step === step)
      .map((n) => `&${VOICE_OF_NOTE.get(n.note)!}${hitLevel(n.velocity)}`);
    return words.length === 0 ? '~' : words.length === 1 ? words[0]! : `[${words.join(',')}]`;
  });
  return { lines: [`&${role} step=16n ${braid}`], term: `&${role}` };
}

/** The cells text of a bar's drums: the bar, the lines of each role, the MIDI card playing `card` (every role unless given), the voices. */
export function drumsAsCells(bar: BandBar, card: readonly DrumRole[] = rolesOf(bar)): string {
  if (bar.meter !== SONG_METER) throw new Error(`bar ${bar.bar}: only 4/4 is translated`);
  const roles = rolesOf(bar).map((role) => ({ role, ...roleLines(bar, role) }));
  const terms = roles.filter((r) => card.includes(r.role)).map((r) => r.term);
  const voices = [...new Set(bandDrums(bar).map((n) => VOICE_OF_NOTE.get(n.note)!))];
  return [
    `&bar scan(1 1 1 1) step=${bar.style.bpm}bpm`,
    ...roles.flatMap((r) => r.lines),
    `&drums map=midi(10) ${terms.length ? `[${terms.join(', ')}]` : '~'}`,
    ...voices.map((voice) => `&${voice} s=white`),
  ].join('\n');
}

const sorted = (hits: readonly Hit[]): Hit[] =>
  [...hits].sort((a, b) => a.step - b.step || a.note - b.note);

/** What a cells text plays on channel 10 in its first `steps` 16ths at a tempo, as MIDI out sends it, and what its compiler said. */
export function cellsDrums(
  text: string,
  bpm: number,
  steps = BAR_STEPS,
): { hits: Hit[]; diagnostics: string[] } {
  const plan = planOf(text);
  const step = stepSeconds(bpm);
  const route = router(plan.result, channelTable(plan.result));
  const hits = windowAt(plan, 0, steps * step).events.flatMap((e) =>
    routesOf(route(e)).flatMap((r) => {
      const note = midiNote(e, r);
      if (!note || note.channel !== 10) return [];
      const at = note.at / step;
      return [{ note: note.note, step: at, length: note.end / step - at, velocity: note.velocity }];
    }),
  );
  return { hits: sorted(hits), diagnostics: plan.result.diagnostics.map((d) => d.message) };
}

/** Within a millionth of a step, as a step's time in seconds rounds. */
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Where two lists of hits part, one line each; none when they are the same hits. */
export function mismatches(bandHits: readonly Hit[], cellsHits: readonly Hit[]): string[] {
  const [left, right] = [sorted(bandHits), sorted(cellsHits)];
  const out =
    left.length === right.length
      ? []
      : [`${left.length} hits in the band, ${right.length} in cells`];
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const [a, b] = [left[i]!, right[i]!];
    if (
      a.note !== b.note ||
      !same(a.step, b.step) ||
      !same(a.length, b.length) ||
      a.velocity !== b.velocity
    )
      out.push(`band ${JSON.stringify(a)}, cells ${JSON.stringify(b)}`);
  }
  return out;
}

/**
 * A bar's drum hits (of one role, if given) as the band plays them: the
 * velocity as played, with the licence, and the length as written, since the
 * licence's gate on a played length is the performance's (T4), outside what
 * the probe asks.
 */
export const hitsOf = (bar: BandBar, role?: DrumRole): Hit[] =>
  sorted(
    bandDrums(bar)
      .filter((n) => role === undefined || n.role === role)
      .map((n) => ({
        note: n.note,
        step: n.step,
        length: bar.written.find(
          (w) => w.part === 'drums' && w.step === n.step && w.note === n.note,
        )!.length,
        velocity: n.velocity,
      })),
  );

/** One preset's witness: its bar, its text, the band's hits and what cells played. */
export interface Witness {
  readonly preset: string;
  readonly bar: BandBar;
  readonly text: string;
  readonly band: Hit[];
  readonly cells: Hit[];
  readonly diagnostics: string[];
  /** Each role's lines played alone, against the band's hits of that role. */
  readonly roles: readonly { readonly role: DrumRole; readonly mismatches: string[] }[];
}

/** The bars a preset held plays, at the seed and entropy above. */
export function presetBars(preset: (typeof PRESETS)[number]): BandBar[] {
  let carried: BandCarried = band.initial;
  return Array.from({ length: BARS }, (_, bar) => {
    const out = band.advance(
      {
        seed: SEED,
        bar,
        style: { ...preset.style, entropy: ENTROPY },
        swing: preset.swing,
        wish: { tonic: null, mode: preset.mode, melodic: null },
        offer: null,
      },
      carried,
      null,
    );
    carried = out.carried;
    return out.output;
  });
}

/** A preset's witness bar: the first with the most roles, then the most hits. */
export function witnessBar(bars: readonly BandBar[]): BandBar {
  const score = (bar: BandBar) => rolesOf(bar).length * 1000 + bandDrums(bar).length;
  return bars.reduce((best, bar) => (score(bar) > score(best) ? bar : best));
}

/** Every preset's witness, stated, compiled and played. */
export function witnesses(): Witness[] {
  return PRESETS.map((preset) => {
    const bar = witnessBar(presetBars(preset));
    const text = drumsAsCells(bar);
    const played = cellsDrums(text, bar.style.bpm);
    return {
      preset: preset.name,
      bar,
      text,
      band: hitsOf(bar),
      cells: played.hits,
      diagnostics: played.diagnostics,
      roles: rolesOf(bar).map((role) => ({
        role,
        mismatches: mismatches(
          hitsOf(bar, role),
          cellsDrums(drumsAsCells(bar, [role]), bar.style.bpm).hits,
        ),
      })),
    };
  });
}

/** How many velocities a role's hits in a bar play. */
export const velocitiesOf = (bar: BandBar, role: DrumRole): number =>
  new Set(hitsOf(bar, role).map((h) => h.velocity)).size;

/** A witness to read: the preset, the bar, each role's hits and velocities, and its text. */
export function report(w: Witness): string {
  const { bar } = w;
  const roles = rolesOf(bar)
    .map((role) => `${role} ${hitsOf(bar, role).length}/${velocitiesOf(bar, role)}`)
    .join(', ');
  return [
    `${w.preset}: bar ${bar.bar} (${bar.plan.section.type}, bar ${bar.barInSection + 1} of 8), ${w.band.length} hits; hits/velocities ${roles}; ${mismatches(w.band, w.cells).length} mismatches`,
    ...w.text.split('\n').map((line) => `  ${line}`),
  ].join('\n');
}
