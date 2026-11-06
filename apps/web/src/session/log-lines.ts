/**
 * The session's log, worded (docs/briefs/session-roles.md step 3): each
 * line a host says, as people read it, like a chat. Players speak for what
 * they did (joined, left, nudged); the band's own voices for what it did:
 * the conductor for what a section line moved (the style's axes, the tempo,
 * the key, the meter), the composer for each section it plans, and the Muse
 * for what she heard and offers back. A bar is counted from 1 in the text,
 * as people count it, and from 0 in `bar`, as the session does.
 *
 * The host says the lines (`HostSession`, `Player`'s section line), the log
 * keeps them (`packages/session/src/log.ts`), and the Session card shows
 * them. Pure: each function words one line from what it is given.
 */

import {
  type Key,
  LEANED,
  type Leaned,
  type MuseOutput,
  type Nudged,
  type SectionType,
  type Style,
} from '@jambot/engine';
import { type Role, type SessionEvent, playerOf } from '@jambot/session';
import type { Meter } from '@jambot/theory';
import { meterLabel } from '../meter-choice.ts';
import { keyName } from '../noteNames.ts';

/** How the band's voices are named where a line is shown. */
export const VOICE_NAMES: Readonly<Record<string, string>> = {
  conductor: 'Conductor',
  composer: 'Composer',
  muse: 'Muse',
};

/**
 * Who said a line, as a log shows it beside the line: a voice of the band
 * by its name, a player by theirs; none where the line names its speaker
 * already ("Ada joined, to play.", "The Muse hears …"), so no name is said
 * twice.
 */
export function speakerOf(
  line: SessionEvent,
  players: Readonly<Record<string, string>>,
): string | null {
  const name = VOICE_NAMES[line.who] ?? players[line.who] ?? null;
  if (name === null) return null;
  return line.text.startsWith(`${name} `) || line.text.startsWith(`The ${name} `) ? null : name;
}

/** A style axis as a line names it. */
const AXIS_WORDS: Readonly<Record<Leaned, string>> = {
  sync: 'syncopation',
  harm: 'harmony',
  artic: 'articulation',
  energy: 'energy',
  bpm: 'the tempo',
};

const line = (bar: number | null, who: string, what: string, text: string): SessionEvent => ({
  bar,
  who,
  what,
  text,
});

/** A player joined, to play or to listen, or came back to its seat. */
export function joinedLine(
  bar: number | null,
  id: string,
  name: string,
  role: Role,
  back = false,
): SessionEvent {
  const text = back
    ? `${name} is back${role === 'listener' ? ', to listen' : ''}.`
    : `${name} joined, to ${role === 'player' ? 'play' : 'listen'}.`;
  return line(bar, id, back ? 'back' : 'joined', text);
}

/** A player left, or lost its link and keeps its seat for a while. */
export function leftLine(bar: number | null, id: string, name: string, lost = false): SessionEvent {
  return line(
    bar,
    id,
    'left',
    lost ? `${name} lost the link; the seat is kept for a while.` : `${name} left.`,
  );
}

/** The host seated a player as another role. */
export function castLine(bar: number | null, host: string, name: string, role: Role): SessionEvent {
  return line(
    bar,
    'host',
    'cast',
    role === 'player' ? `${host} let ${name} play.` : `${host} made ${name} listen.`,
  );
}

/** A player nudged something a step up or down. */
export function nudgedLine(
  bar: number | null,
  id: string,
  name: string,
  target: Nudged,
  by: 1 | -1,
): SessionEvent {
  const up = by > 0;
  const what =
    target === 'bpm'
      ? `the tempo ${up ? 'faster' : 'slower'}`
      : target === 'key'
        ? `the key a fifth ${up ? 'up' : 'down'}`
        : target === 'meter'
          ? `the meter a beat ${up ? 'more' : 'fewer'}`
          : `${AXIS_WORDS[target]} ${up ? 'up' : 'down'}`;
  return line(bar, id, 'nudged', `${name} nudged ${what}.`);
}

const percent = (v: number) => Math.round(v * 100);

/**
 * What a section line moved, from bar `bar` on: each style axis whose
 * percentage changed, the tempo where its bpm did, a key step and a meter
 * asked for; null where nothing a person would read changed.
 */
export function movedLine(
  bar: number,
  before: Style,
  after: Style,
  key = 0,
  meter: { readonly from: Meter; readonly to: Meter } | null = null,
): SessionEvent | null {
  const parts: string[] = [];
  for (const axis of LEANED) {
    if (axis === 'bpm') {
      const [from, to] = [Math.round(before.bpm), Math.round(after.bpm)];
      if (from !== to) parts.push(`tempo ${from} → ${to} bpm`);
      continue;
    }
    const [from, to] = [percent(before[axis]), percent(after[axis])];
    if (from !== to) parts.push(`${AXIS_WORDS[axis]} ${from} → ${to} %`);
  }
  if (key !== 0) parts.push(`the key a fifth ${key > 0 ? 'up' : 'down'}`);
  if (meter) parts.push(`${meterLabel(meter.from)} → ${meterLabel(meter.to)}`);
  if (parts.length === 0) return null;
  return line(bar, 'conductor', 'moved', `From bar ${bar + 1}: ${parts.join(', ')}.`);
}

/** A section the composer planned: its type, where it starts, its key and its meter. */
export function composedLine(bar: number, type: SectionType, key: Key, meter: Meter): SessionEvent {
  const name = type[0]!.toUpperCase() + type.slice(1);
  return line(
    bar,
    'composer',
    'composed',
    `${name} from bar ${bar + 1}: ${keyName(key)}, ${meterLabel(meter)}.`,
  );
}

/** A player's name by a note source, or someone's. */
const nameOf = (source: string, players: Readonly<Record<string, string>>): string => {
  const id = playerOf(source);
  return (id && players[id]) ?? 'someone';
};

/**
 * What the Muse said of a bar she read: the motif she takes up and offers
 * the band, where it is new (`offered` says whose offer stood before), each
 * player she heard play one again, and a forgetting.
 */
export function museLines(
  output: MuseOutput,
  players: Readonly<Record<string, string>>,
  offered: { readonly source: string; readonly bar: number } | null,
): SessionEvent[] {
  const lines: SessionEvent[] = [];
  const { bar, offer, recognised, forgot } = output;
  if (offer && (offered === null || offer.source !== offered.source || offer.bar !== offered.bar))
    lines.push(
      line(
        bar,
        'muse',
        'inspired',
        `The Muse takes up ${nameOf(offer.source, players)}'s motif from bar ${offer.bar + 1}, and offers it to the band.`,
      ),
    );
  const again = [...new Set(recognised.map((r) => nameOf(r.source, players)))];
  if (again.length > 0)
    lines.push(
      line(bar, 'muse', 'heard', `The Muse hears ${again.join(' and ')} play a motif again.`),
    );
  if (forgot === 'asked') lines.push(line(bar, 'muse', 'forgot', 'The Muse forgets, as asked.'));
  if (forgot === 'silence')
    lines.push(line(bar, 'muse', 'forgot', 'The Muse lets go: nobody has played for a while.'));
  return lines;
}
