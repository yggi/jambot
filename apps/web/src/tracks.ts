/**
 * The tracks: one phrase of the song on one grid, a lane per band
 * performer, drums, bass, chords and lead, and a lane per player's source
 * under the performer whose part it plays. `tracksOf` reads the same `Hud`,
 * `SoundingNotes` and `Pattern` every other view reads, and touches neither
 * the engine nor a session: the same tracks are built the same way whether
 * the player plays alone, hosts, or follows a host
 * (`docs/briefs/host-mode.md`).
 *
 * The grid shows the last `PATTERN_BARS` bars, the bar heard last, with the
 * playhead on the step heard; until a phrase has been heard it fills from
 * the song's first bar. Every note is placed on its step from the first bar
 * shown.
 *
 * The loop of the Muse is drawn on it in the players' colours
 * (`attribution.ts`): the lead's bars that played a motif are credited to
 * its source and the bar it was heard in, from each bar's own offer as the
 * band composed it (`Pattern`); a player's lane marks the bar the Muse took
 * from it (`hud.muse.motif`). A host never has its clients' notes, only the
 * cells they were judged into, so a source with no notes here shows the cell
 * taken from it, as the Muse heard it, rows of its degrees in place of
 * notes, for as long as its bar is shown.
 */

import { BAR_STEPS, barAt, barStart } from '@jambot/engine';
import { playerSource, sourceName } from '@jambot/session';
import { type Credit, credit, sourceColour } from './attribution.ts';
import { type Hud, leadStatus, styleStatus } from './hud.ts';
import { type Mix, level, sounds } from './mix.ts';
import { PATTERN_BARS, type PatternBar, type PatternNote, playedIn } from './pattern.ts';
import type { AlongPart, HumanNote } from './player.svelte.ts';
import { type Performer, PERFORMERS, type SoundingNotes } from './sounding.ts';

/** A note on the grid: its step from the first bar shown's start, its pitch, and how long it sounds. */
export type LaneNote = PatternNote;

/** A bar of a lane credited to a motif's source: which bar shown, from 0. */
export interface LaneCredit {
  readonly at: number;
  readonly credit: Credit;
}

/** A band performer's lane. */
export interface PerformerView {
  readonly performer: Performer;
  readonly label: string;
  /** One line saying what the performer is playing. */
  readonly status: string;
  /** The notes sounding on this performer right now, on this device. */
  readonly sounding: readonly number[];
  readonly notes: readonly LaneNote[];
  /** For the lead, the bars shown that played a motif, credited; none for the others. */
  readonly motifs: readonly LaneCredit[];
  readonly muted: boolean;
  readonly soloed: boolean;
  /** Whether it sounds on this device (`Mix`). */
  readonly sounds: boolean;
  /** Its level on this device, 0 to 1 (`Mix`). */
  readonly level: number;
}

/** A player's lane: one source on one part. */
export interface PlayerView {
  readonly part: AlongPart;
  /** The source by id, as the Muse hears it. */
  readonly source: string;
  readonly name: string;
  /** Its player's colour (`sourceColour`). */
  readonly colour: number;
  /** Whether its notes are a cell as the Muse heard it, rows of its degrees, not the notes played. */
  readonly heardAs: boolean;
  /** Whether this device's player played it, as against a cell heard from another player. */
  readonly local: boolean;
  readonly notes: readonly LaneNote[];
  /** The bar shown the Muse took from it, from 0, or null. */
  readonly taken: number | null;
}

export interface TracksView {
  /** The first bar shown, counted from the song's start. */
  readonly first: number;
  /** The step heard, counted from the first bar shown's start, or null before anything is heard. */
  readonly playhead: number | null;
  readonly performers: readonly PerformerView[];
  /** In the order they first played in the bars shown; each under the performer of its part. */
  readonly players: readonly PlayerView[];
}

export interface TracksInput {
  readonly hud: Hud;
  readonly sounding: SoundingNotes;
  /** The band's last bars (`Pattern`). */
  readonly pattern: readonly PatternBar[];
  /** The step heard, or null before anything is. */
  readonly heard: number | null;
  /** What the players on this device played. */
  readonly humanNotes: readonly HumanNote[];
  /** This device's player in a session, or null outside one. */
  readonly playerId: string | null;
  /** A session's players' names, by id. */
  readonly players: Readonly<Record<string, string>>;
  readonly mix: Mix;
}

const LABELS: Readonly<Record<Performer, string>> = {
  drums: 'Drums',
  bass: 'Bass',
  comp: 'Chords',
  lead: 'Lead',
};

const PARTS: readonly AlongPart[] = ['lead', 'drums'];

export function tracksOf(input: TracksInput): TracksView {
  const { hud, sounding, pattern, heard, players, mix } = input;
  const first = heard === null ? 0 : Math.max(0, barAt(heard) - PATTERN_BARS + 1);
  const shown = (bar: number) => bar >= first && bar < first + PATTERN_BARS;
  /** Notes of `bar` placed from the first bar shown. */
  const placed = (bar: number, notes: readonly PatternNote[]) =>
    notes.map((n) => ({ ...n, step: n.step + (bar - first) * BAR_STEPS }));
  const bars = pattern.filter((b) => shown(b.bar));

  const style = styleStatus(hud.style);
  const performers = PERFORMERS.map((performer) => ({
    performer,
    label: LABELS[performer],
    status: performer === 'lead' ? leadStatus(hud) : style,
    sounding: sounding[performer],
    notes: bars.flatMap((b) => placed(b.bar, b.parts[performer])),
    motifs:
      performer === 'lead'
        ? bars.flatMap((b) =>
            b.motif ? [{ at: b.bar - first, credit: credit(b.motif, players) }] : [],
          )
        : [],
    muted: mix.muted.includes(performer),
    soloed: mix.soloed.includes(performer),
    sounds: sounds(mix, performer),
    level: level(mix, performer),
  }));

  const motif = hud.muse.motif;
  const takenFrom = (part: AlongPart, source: string) =>
    motif && part === 'lead' && motif.source === source && shown(motif.bar)
      ? motif.bar - first
      : null;
  const lanes = new Map<string, PlayerView & { notes: LaneNote[] }>();
  for (let bar = first; bar < first + PATTERN_BARS; bar++)
    for (const part of PARTS)
      for (const [played, notes] of Object.entries(
        playedIn(
          input.humanNotes.filter((n) => n.part === part),
          bar,
        ),
      )) {
        const source = input.playerId === null ? played : playerSource(input.playerId, played);
        const lane = `${part} ${source}`;
        if (!lanes.has(lane))
          lanes.set(lane, {
            part,
            source,
            name: sourceName(source, players),
            colour: sourceColour(source, players),
            heardAs: false,
            local: true,
            notes: [],
            taken: takenFrom(part, source),
          });
        lanes.get(lane)!.notes.push(...placed(bar, notes));
      }
  const order = (lane: PlayerView) => Math.min(...lane.notes.map((n) => n.step));
  const local = [...lanes.values()].sort((a, b) => order(a) - order(b));
  const heardAs =
    motif && shown(motif.bar) && !lanes.has(`lead ${motif.source}`)
      ? [
          {
            part: 'lead' as const,
            source: motif.source,
            name: `${motif.name}, as the Muse heard it`,
            colour: motif.colour,
            heardAs: true,
            local: false,
            taken: motif.bar - first,
            notes: motif.notes.map((n) => ({
              step: n.step + (motif.bar - first) * BAR_STEPS,
              note: n.row,
              length: n.length,
            })),
          },
        ]
      : [];

  return {
    first,
    playhead: heard === null ? null : heard - barStart(first),
    performers,
    players: [...local, ...heardAs],
  };
}
