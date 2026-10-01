/**
 * The tracks: one phrase of the song on one grid, a lane per band
 * performer, drums, bass, chords and lead, and a lane per player's source
 * under the performer whose part it plays. `tracksOf` reads the same `Hud`,
 * `SoundingNotes` and `Pattern` every other view reads, and touches neither
 * the engine nor a session: the same tracks are built the same way whether
 * the player plays alone, hosts, or follows a host
 * (`docs/briefs/host-mode.md`).
 *
 * The grid shows `PATTERN_BARS` bars with the bar heard in the middle: two
 * behind it as they were played, and it and two ahead as foreseen
 * (`foresight`, from the player), with the playhead on the step heard. The bars
 * jump on as the bar heard changes, and the playhead moves across them.
 * Before anything is heard it shows the song from its first bar. Every note
 * is placed on its step from the first bar shown, on the song's own clock
 * (`SongClock`): the bars shown may be of different lengths, and the grid's
 * `frame` says where each starts, how long it is and where its pulses fall,
 * so a lane draws the bar of the meter it is in (#262).
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

import { SONG_CLOCK, type SongClock } from '@jambot/engine';
import { playerSource, sourceName } from '@jambot/session';
import { type Credit, credit, sourceColour } from './attribution.ts';
import { type Hud, leadStatus, styleStatus } from './hud.ts';
import { type Mix, level, sounds } from './mix.ts';
import {
  BARS_BEHIND,
  PATTERN_BARS,
  type PatternBar,
  type PatternNote,
  playedIn,
} from './pattern.ts';
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

/** A bar of the grid: where it starts and how long it is, and where its pulses fall, in steps from the first bar shown's start. */
export interface BarFrame {
  readonly start: number;
  readonly steps: number;
  /** The steps its pulses start on, from the grid's start. */
  readonly pulses: readonly number[];
}

export interface TracksView {
  /** The first bar shown, counted from the song's start. */
  readonly first: number;
  /** The bars shown, each where the song's clock puts it. */
  readonly frame: readonly BarFrame[];
  /** The steps the grid spans: the bars shown, end to end. */
  readonly span: number;
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
  /** The bars from the head on with their notes, foreseen. */
  readonly ahead: readonly PatternBar[];
  /** The song's clock, as far as the bars decided reach; the song's 4/4 where none is given. */
  readonly clock?: SongClock;
}

const LABELS: Readonly<Record<Performer, string>> = {
  drums: 'Drums',
  bass: 'Bass',
  comp: 'Chords',
  lead: 'Lead',
};

const PARTS: readonly AlongPart[] = ['lead', 'drums'];

export function tracksOf(input: TracksInput): TracksView {
  const { hud, sounding, pattern, heard, players, mix, clock = SONG_CLOCK } = input;
  const now = heard === null ? 0 : clock.barAt(heard);
  const first = Math.max(0, now - BARS_BEHIND);
  const shown = (bar: number) => bar >= first && bar < first + PATTERN_BARS;
  const origin = clock.barStart(first);
  /** Where `bar` starts, from the first bar shown's start. */
  const startOf = (bar: number) => clock.barStart(bar) - origin;
  const frame = Array.from({ length: PATTERN_BARS }, (_, i): BarFrame => {
    const bar = first + i;
    const start = clock.barStart(bar);
    const end = clock.barStart(bar + 1);
    const pulses: number[] = [];
    for (let beat = clock.beatAt(start); clock.beatStart(beat) < end; beat++)
      pulses.push(clock.beatStart(beat) - origin);
    return { start: start - origin, steps: end - start, pulses };
  });
  /** Notes of `bar` placed from the first bar shown. */
  const placed = (bar: number, notes: readonly PatternNote[]) =>
    notes.map((n) => ({ ...n, step: n.step + startOf(bar) }));
  // The bars from the one heard on are the foreseen ones, whole; those before it are as they were played.
  const bars = Array.from({ length: PATTERN_BARS }, (_, i) => first + i).flatMap((bar) => {
    const found =
      (bar >= now ? input.ahead.find((b) => b.bar === bar) : undefined) ??
      pattern.find((b) => b.bar === bar);
    return found ? [found] : [];
  });

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
          clock,
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
              step: n.step + startOf(motif.bar),
              note: n.row,
              length: n.length,
            })),
          },
        ]
      : [];

  return {
    first,
    frame,
    span: frame.reduce((steps, bar) => steps + bar.steps, 0),
    playhead: heard === null ? null : heard - origin,
    performers,
    players: [...local, ...heardAs],
  };
}
