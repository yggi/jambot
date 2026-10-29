/**
 * The Muse's ear for grooves (#401): what a source played on drums over a
 * section, distilled into one bar and stated as cells text, which the
 * composer files in the learned layer (`plan.ts`, cells' `fileFragment`).
 *
 * A source is the band's drummer, on a section where the composer found no
 * rhythm and the drummer invented its own, or a player, on the drum pads or
 * the drum channel; one path takes both (`HeardGroove`):
 *
 * - **a bar's hits**: each a role, a General MIDI note, a step of the bar
 *   and a velocity (`FragmentHit`, as a fragment read back is). The
 *   drummer's are what it played, each with the velocity its performer gave
 *   it. A player's are what the Muse heard (`heardDrums`), on the grid her
 *   nearest reading rounds to, the bar's steps (`heardStep`: a sixteenth in
 *   4/4), each sound of the band's kit on its role (`roleOfSound`), the
 *   loudest where two strike one sound on one step; a note outside the kit
 *   is left out.
 * - **distilled** (`distilledGroove`): the section's recurring bar, the
 *   pattern of hits (role, sound and step) its bars play most often, as the
 *   first bar that plays it; ties to the earliest. So a section of a groove
 *   and its fill files the groove, and one whose every bar differs (a build,
 *   its energy rising) files its first. A bar of fewer than `GROOVE_FEWEST`
 *   hits is no groove.
 * - **stated** (`grooveText`): E31's forward translation, open on its meter
 *   as cells' rhythms are (taps, no `&bar`): a line a role on `16n` over the
 *   bar's steps, each hit its sound's voice at its own level (`&sd:0:.0635`,
 *   a velocity v at (v/127)², which cells' MIDI out strikes at 127·√level);
 *   the rim, where one sound plays a Euclid, one token on `1m` and its levels
 *   a line of their own; one mix of the lines, `&groove`, and no MIDI card,
 *   as cells' seed bars have none (yggi/cells#299); each voice its sound.
 *   E31's own bars stated so are cells' seed drum bars, which is how
 *   identity finds them (`muse-groove.test.ts`).
 *
 * Read back by cells (`readRhythm`, under the meter played straight), a
 * groove stated so gives every hit it was stated from: the round trip the
 * filing relies on, which its test runs over every velocity and every
 * groove E38's runs file.
 */

import { type Meter, meterOnSteps, stepsOf } from '@jambot/theory';
import { bjorklund } from '@yggi/cells/engine/parser/generators';
import { CLAVES_NOTE, DRUM_NOTES, type DrumSound, backbeatOf } from './drums.ts';
import { BAR_STEPS, DRUM_ROLES, type DrumRole, type SongClock } from './events.ts';
import { type HeardNote, heardStep } from './muse.ts';
import type { FragmentHit } from './rhythm-query.ts';

/** The voice each of the kit's sounds is written with: the score's words (`DRUM_WORDS`), and cells' `sd` and `cp` for the snare and the clap, which the score has none for. */
export const DRUM_VOICES: Readonly<Record<DrumSound, string>> = {
  kick: 'bd',
  rim: 'rim',
  snare: 'sd',
  clap: 'cp',
  closedHat: 'hh',
  pedalHat: 'ph',
  openHat: 'oh',
  ride: 'rd',
};

/** The voice each drum note is written with (E31): the kit's, and General MIDI's name for the claves a clave line strikes, which cells sends as 75 (cells v0.7.0). */
export const VOICE_OF_NOTE: ReadonlyMap<number, string> = new Map([
  ...(Object.keys(DRUM_VOICES) as DrumSound[]).map(
    (sound) => [DRUM_NOTES[sound], DRUM_VOICES[sound]] as const,
  ),
  [CLAVES_NOTE, 'claves'],
]);

/** A velocity as a level, (v/127)², which cells' MIDI out strikes at 127·√level: six decimals, no leading 0. */
export function levelOf(velocity: number): string {
  if (velocity >= 127) return '1';
  const share = velocity / 127;
  return (share * share).toFixed(6).replace(/0+$/, '').replace(/^0/, '');
}

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

/** Hits in the order a bar plays them: by step, then note. */
const inOrder = (hits: readonly FragmentHit[]): FragmentHit[] =>
  [...hits].sort((a, b) => a.step - b.step || a.note - b.note);

/** A hit's own level after its voice, none at full velocity. */
const hitLevel = (velocity: number) => (velocity >= 127 ? '' : `:0:${levelOf(velocity)}`);

/** A bar's steps, each mapped. */
const eachStep = (steps: number, f: (step: number) => string) =>
  Array.from({ length: steps }, (_, step) => f(step)).join(' ');

/** A role's lines, and the term the card plays it by (E31's `roleLines`, on a bar of `steps`). */
function roleLines(hits: readonly FragmentHit[], steps: number): { lines: string[]; term: string } {
  const { role } = hits[0]!;
  const notes = new Set(hits.map((h) => h.note));
  const euclid =
    role === 'euclid' && notes.size === 1
      ? euclidOf(
          hits.map((h) => h.step),
          steps,
        )
      : null;
  if (euclid) {
    const voice = VOICE_OF_NOTE.get(hits[0]!.note)!;
    const level = (step: number) => hits.find((h) => h.step === step)?.velocity;
    return {
      lines: [
        `&${role} step=1m &${voice}(${euclid.k},${steps},${euclid.r})`,
        `&${role}Level map=amp step=16n ${eachStep(steps, (s) => (level(s) ? levelOf(level(s)!) : '0'))}`,
      ],
      term: `&${role} * &${role}Level`,
    };
  }
  const braid = eachStep(steps, (step) => {
    const words = hits
      .filter((h) => h.step === step)
      .map((h) => `&${VOICE_OF_NOTE.get(h.note)!}${hitLevel(h.velocity)}`);
    return words.length === 0 ? '~' : words.length === 1 ? words[0]! : `[${words.join(',')}]`;
  });
  return { lines: [`&${role} step=16n ${braid}`], term: `&${role}` };
}

/**
 * A bar's drum hits as cells text, open on its meter (E31's translation, no
 * `&bar`): the lines of each role in the band's order and their mix,
 * `&groove`, which a reading sends on channel 10. Its voices are holes a kit fills, as cells' seed
 * rhythms' are (yggi/cells#260), so a groove that plays a seed's hits is
 * that seed's text. Every hit's note must be one of the kit's
 * (`VOICE_OF_NOTE`).
 */
export function grooveText(hits: readonly FragmentHit[], steps: number): string {
  const sorted = inOrder(hits);
  const unknown = sorted.find((h) => !VOICE_OF_NOTE.has(h.note));
  if (unknown) throw new Error(`grooveText: note ${unknown.note} is none of the kit's`);
  const roles = (DRUM_ROLES as readonly string[]).filter((role) =>
    sorted.some((h) => h.role === role),
  );
  const stated = roles.map((role) =>
    roleLines(
      sorted.filter((h) => h.role === role),
      steps,
    ),
  );
  return [
    ...stated.flatMap((r) => r.lines),
    `&groove ${stated.length ? `[${stated.map((r) => r.term).join(', ')}]` : '~'}`,
  ].join('\n');
}

/** The fewest hits a bar holds to be a groove: as many as a motif's notes (`MUSE.fewest`). */
export const GROOVE_FEWEST = 3;

/** A bar's pattern: its hits' roles, sounds and steps, in order. */
const patternOf = (hits: readonly FragmentHit[]) =>
  inOrder(hits)
    .map((h) => `${h.role}:${h.note}:${h.step}`)
    .join(' ');

/**
 * A section's recurring bar: of its bars of `GROOVE_FEWEST` hits or more,
 * the first that plays the pattern most of them play (role, sound and step,
 * the velocities aside), ties to the earliest; null where none has enough.
 */
export function distilledGroove(
  bars: readonly (readonly FragmentHit[])[],
): readonly FragmentHit[] | null {
  const counts = new Map<string, { count: number; first: readonly FragmentHit[] }>();
  for (const bar of bars) {
    if (bar.length < GROOVE_FEWEST) continue;
    const pattern = patternOf(bar);
    const seen = counts.get(pattern);
    if (seen) seen.count++;
    else counts.set(pattern, { count: 1, first: bar });
  }
  let best: { count: number; first: readonly FragmentHit[] } | null = null;
  for (const entry of counts.values()) if (!best || entry.count > best.count) best = entry;
  return best ? inOrder(best.first) : null;
}

/** What a source played on drums over a section, as the Muse heard it: each bar's hits. */
export interface HeardGroove {
  /** Who played it: `drummer` for the band's, or the player as the Muse knows them. */
  readonly source: string;
  readonly bars: readonly (readonly FragmentHit[])[];
}

/** What a source played on drums in one bar, heard and read onto the bar's steps (`heardDrums`). */
export interface HeardDrumBar {
  readonly source: string;
  readonly bar: number;
  readonly hits: readonly FragmentHit[];
}

/**
 * The role a sound of the kit plays in a player's groove, as the drummer's
 * own: the kick its kick; the snare and the clap the backbeat on a
 * backbeat pulse (`backbeatOf`), else a ghost; the rim the Euclid's; the pedal hat the
 * pedal; the closed and open hats and the ride the hat. Null for a note
 * outside the kit.
 */
export function roleOfSound(note: number, step: number, meter: Meter): DrumRole | null {
  if (!VOICE_OF_NOTE.has(note)) return null;
  if (note === DRUM_NOTES.kick) return 'kick';
  if (note === DRUM_NOTES.rim) return 'euclid';
  if (note === DRUM_NOTES.pedalHat) return 'pedal';
  if (note !== DRUM_NOTES.snare && note !== DRUM_NOTES.clap) return 'hat';
  const starts = meterOnSteps(meter).heights;
  const backbeat = backbeatOf(meter).map((pulse) => starts[pulse]);
  return backbeat.includes(step) ? 'backbeat' : 'ghost';
}

/**
 * Each source's drum hits in a bar, as the Muse hears them: each note on the
 * step her nearest reading rounds it to (`heardStep`), in the bar, the
 * kit's sounds alone, each on its role (`roleOfSound`), the loudest where
 * two strike one sound on one step. Sources in the order their first notes
 * arrived; none that struck nothing of the kit.
 */
export function heardDrums(
  notes: readonly HeardNote[],
  bar: number,
  meter: Meter,
  clock: SongClock,
): HeardDrumBar[] {
  const steps = stepsOf(meter);
  const inBar = notes.filter((n) => clock.barAt(heardStep(n)) === bar);
  const sources = [...new Set(inBar.map((n) => n.source))];
  return sources.flatMap((source) => {
    const kept = new Map<number, FragmentHit>();
    for (const n of inBar) {
      if (n.source !== source) continue;
      // (`+ 0`: a hit a hair before the downbeat rounds to -0)
      const step = clock.stepInBar(heardStep(n)) + 0;
      const role = step < steps ? roleOfSound(n.note, step, meter) : null;
      if (role === null) continue;
      const key = step * 128 + n.note;
      const there = kept.get(key);
      if (!there || n.velocity > there.velocity)
        kept.set(key, { role, note: n.note, step, velocity: n.velocity });
    }
    const hits = inOrder([...kept.values()]);
    return hits.length ? [{ source, bar, hits }] : [];
  });
}
