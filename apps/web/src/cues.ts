/**
 * The cues: every heads-up the band gives, read from what it has already
 * planned (the bars decided, `hud.next`) and from the transport's phase. A
 * cue is a moment, what happens then and whom it is for: the count-in, the
 * band ending, the next section with the key and meter it brings, the lead
 * coming in or dropping out at its line, the lead taking up a player's
 * motif, and the radio's drift. One strip shows them (`CueStrip`), the
 * nearest first, counting down in bars while it is a bar or more away and
 * in beats in its last bar. Nothing here is new state: a cue is the plan,
 * read a few bars early.
 */

import type { Meter } from '@jambot/theory';
import type { BarView, Hud } from './hud.ts';

/** How many bars ahead a cue comes: a phrase's half, time enough to get ready. */
export const CUE_BARS = 4;

export type CueKind = 'count-in' | 'ending' | 'section' | 'voice' | 'motif' | 'radio';

/** What a cue's glyph draws, live on the beat: the transport's cells, the key's wheel, the meter's pulses, the lead's shape, the style's radar. */
export type CueGlyph = 'cells' | 'key' | 'meter' | 'lead' | 'radio';

export interface Cue {
  readonly kind: CueKind;
  readonly what: string;
  readonly sub: string;
  /** Whose it is: a player's colour (`--source-n`), or null for the band's. */
  readonly who: number | null;
  /** Bars until it, counting the bar heard's rest as one; 0 for the count-in, which is now. */
  readonly bars: number;
  /** The beats left before it in its last bar, or null while it is further off. */
  readonly beatsLeft: number | null;
  /** The beats in the bar it counts down in. */
  readonly beats: number;
  readonly glyph: CueGlyph;
  /** For a key's glyph: the key it turns to. */
  readonly tonic?: number;
  readonly scale?: readonly number[];
  /** For a meter's glyph: the meter it turns to. */
  readonly meter?: Meter;
}

export interface CueInput {
  readonly hud: Pick<Hud, 'bar' | 'beat' | 'next' | 'style'>;
  /** The count-in's beats left and the beats it counts, or null outside one. */
  readonly counting: { readonly left: number; readonly of: number } | null;
  /** Whether the band is ending on its bar. */
  readonly ending: boolean;
  /** Whether the radio is on the air. */
  readonly radio: boolean;
}

export function cuesOf({ hud, counting, ending, radio }: CueInput): Cue[] {
  const cues: Cue[] = [];
  if (counting)
    cues.push({
      kind: 'count-in',
      what: 'Count-in',
      sub: 'the band comes in on 1',
      who: null,
      bars: 0,
      beatsLeft: counting.left,
      beats: counting.of,
      glyph: 'cells',
    });
  const here = hud.bar;
  if (!here || hud.beat === null) return cues;
  const beats = here.meter.heights.length;
  const left = beats - hud.beat;
  /** A bar ahead's countdown: in bars, and in beats once it is the next one. */
  const until = (at: BarView) => {
    const bars = at.bar - here.bar;
    return { bars, beatsLeft: bars === 1 ? left : null, beats };
  };
  if (ending)
    cues.push({
      kind: 'ending',
      what: 'Ending',
      sub: 'the last chord rings · Stop again to stop now',
      who: null,
      bars: 1,
      beatsLeft: left,
      beats,
      glyph: 'cells',
    });
  const reach = hud.next.filter((b) => b.bar - here.bar <= CUE_BARS);
  const line = reach.find((b) => b.barInSection === 0);
  if (line) {
    const newKey = line.key !== here.key;
    const newMeter = line.meterName !== here.meterName;
    cues.push({
      kind: 'section',
      what: [line.section, newKey && line.key, newMeter && line.meterName]
        .filter(Boolean)
        .join(' · '),
      sub: newKey
        ? 'next section, in a new key'
        : newMeter
          ? 'next section, in a new meter'
          : 'next section',
      who: null,
      ...until(line),
      glyph: newKey ? 'key' : newMeter ? 'meter' : 'cells',
      ...(newKey ? { tonic: line.tonic, scale: line.scale } : {}),
      ...(newMeter ? { meter: line.meter } : {}),
    });
    const before = hud.next.find((b) => b.bar === line.bar - 1) ?? here;
    const resting = (b: BarView) => b.lead === 'resting';
    if (resting(before) !== resting(line))
      cues.push({
        kind: 'voice',
        what: resting(line) ? 'Lead drops out' : 'Lead comes in',
        sub: `${line.section} · ${resting(line) ? 'the others carry it' : 'over the band'}`,
        who: null,
        ...until(line),
        glyph: 'lead',
      });
    if (radio && hud.style.near.toward !== null)
      cues.push({
        kind: 'radio',
        what: `Radio · toward ${hud.style.near.toward}`,
        sub: 'drifting a section at a time',
        who: null,
        ...until(line),
        glyph: 'radio',
      });
  }
  if (here.motif === null) {
    const taken = reach.find((b) => b.motif !== null);
    if (taken?.motif)
      cues.push({
        kind: 'motif',
        what: `Lead plays ${taken.motif.name}’s motif`,
        sub: `heard in bar ${taken.motif.bar + 1}`,
        who: taken.motif.colour,
        ...until(taken),
        glyph: 'lead',
      });
  }
  const when = (c: Cue) => c.bars * 100 - (c.beatsLeft === null ? 0 : 100 - c.beatsLeft);
  return cues.sort((a, b) => when(a) - when(b));
}
