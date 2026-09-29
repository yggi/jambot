/**
 * Where a motif the lead plays came from, and how the views credit it: the
 * source named by its player, in its player's colour.
 *
 * The colour is the player's, not the instrument's, so a person reads as one
 * colour whatever they play. It is the player's place in the session's
 * record of players (`players`), which keeps every player in the order they
 * joined, the host first, and keeps them after they leave: every screen
 * holds the same record, so a player has the same colour on each, and one
 * who joins later takes the next. A name can change and the colour stays,
 * since the place is the id's. Outside a session there is one player, who
 * takes the first colour. `app.css` holds the colours, as `--source-0` to
 * `--source-5`, for the light theme and the dark; the band's own amber is
 * not among them.
 */

import { playerOf, sourceName } from '@jambot/session';

/**
 * Where a motif the lead plays came from: its source, by id, and the bar it
 * was heard in, counted from the song's start. It is the bar's own `Offer`
 * less the motif itself: the cell and where it was heard, not how the lead
 * realises it.
 */
export interface Attribution {
  readonly source: string;
  readonly bar: number;
}

/** An attribution as the views show it: its source named, and its player's colour. */
export interface Credit extends Attribution {
  /** The source as people read it (`sourceName`). */
  readonly name: string;
  /** Which of the `SOURCE_COLOURS`, from 0: `var(--source-N)`. */
  readonly colour: number;
}

/** How many colours tell the players apart, before they come round again. */
export const SOURCE_COLOURS = 6;

/** The colour of a source's player, from 0 (`Credit.colour`). */
export function sourceColour(source: string, players: Readonly<Record<string, string>>): number {
  const player = playerOf(source);
  if (player === null) return 0;
  const place = Object.keys(players).indexOf(player);
  if (place >= 0) return place % SOURCE_COLOURS;
  // A player not yet named, as a judgement can arrive before its name: a colour from its id alone.
  let hash = 0;
  for (const c of player) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return hash % SOURCE_COLOURS;
}

/** An attribution credited: its source named, in its player's colour. */
export function credit(
  attribution: Attribution,
  players: Readonly<Record<string, string>>,
): Credit {
  return {
    source: attribution.source,
    name: sourceName(attribution.source, players),
    colour: sourceColour(attribution.source, players),
    bar: attribution.bar,
  };
}
