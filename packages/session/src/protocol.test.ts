import {
  INITIAL_STYLE,
  type Judgement,
  LOOKAHEAD,
  type TransportEnv,
  holding,
  judgeBar,
  transport,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { sentBars } from './host.ts';
import {
  PROTOCOL,
  type SentBar,
  playerOf,
  playerSource,
  readClientMessage,
  readHostMessage,
  refusal,
  sourceName,
} from './protocol.ts';

/** Every path to a plain value in a value, with the value's type: its shape. */
function paths(value: unknown, at = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => paths(v, `${at}[]`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => paths(v, at ? `${at}.${k}` : k));
  return [`${at}: ${value === null ? 'null' : typeof value}`];
}
const shapeOf = (values: readonly unknown[]) =>
  [...new Set(values.flatMap((v) => paths(v)))].sort();

/**
 * The bars a host sends over a minute of full energy and harmony, with a
 * motif heard in bar 2 so that bars carry an offer and accents, and the
 * judgements of the notes heard.
 */
function travelling(): { bars: SentBar[]; judgements: Judgement[] } {
  const env: TransportEnv = {
    seed: 3,
    start: 0,
    track: holding({ ...INITIAL_STYLE, energy: 1, harm: 1 }),
    wish: { tonic: null, mode: 'aeolian' },
  };
  const heard = [69, 72, 76, 74].map((note, i) => ({
    note,
    velocity: 110 - i * 20,
    source: 'a client',
    position: 32 + i * 4,
    end: i === 3 ? null : 33 + i * 4,
  }));
  let carried = transport.initial;
  const bars: SentBar[] = [];
  for (let t = 0; t < 60; t += 0.025) {
    const due = carried && carried.head.step > 50 && heard.length > 0 ? heard.splice(0) : [];
    const next = transport.advance(env, carried, { now: t, until: t + LOOKAHEAD, heard: due });
    carried = next.carried;
    bars.push(...sentBars(next.output.composed, next.output.steps, carried!.head, env.track));
  }
  const notes = [69, 72, 76, 74].map((note, i) => ({
    note,
    velocity: 110 - i * 20,
    source: 'a client',
    position: i * 4,
    end: 1 + i * 4,
  }));
  const judgements = [
    ...judgeBar(notes, 0, { tonic: 9, mode: 'aeolian' }),
    ...judgeBar(notes.slice(0, 2), 0, { tonic: 9, mode: 'aeolian' }),
  ];
  return { bars, judgements };
}

describe('the session protocol', () => {
  it("reads each side's messages, and nothing else", () => {
    expect(readHostMessage({ kind: 'stop' })).toEqual({ kind: 'stop' });
    expect(readClientMessage({ kind: 'ping', sent: 1 })).toEqual({ kind: 'ping', sent: 1 });
    for (const junk of [null, 3, 'stop', {}, { kind: 7 }, { kind: 'play' }]) {
      expect(readHostMessage(junk)).toBeNull();
      expect(readClientMessage(junk)).toBeNull();
    }
    // Each side reads only the other's.
    expect(readHostMessage({ kind: 'ping', sent: 1 })).toBeNull();
    expect(readClientMessage({ kind: 'stop' })).toBeNull();
  });

  it("reads a client's message only with the fields its kind carries, of their types", () => {
    const { judgements } = travelling();
    const judgement = judgements[0]!;
    for (const message of [
      { kind: 'join', protocol: PROTOCOL, name: 'Ada' },
      { kind: 'judged', bar: 3, judgement },
      { kind: 'ping', sent: 1.5 },
      { kind: 'forget' },
      { kind: 'leave' },
    ])
      expect(readClientMessage(message)).toEqual(message);
    for (const junk of [
      { kind: 'join', protocol: PROTOCOL },
      { kind: 'join', name: 'Ada' },
      { kind: 'join', protocol: String(PROTOCOL), name: 'Ada' },
      { kind: 'join', protocol: PROTOCOL, name: 7 },
      { kind: 'judged', judgement },
      { kind: 'judged', bar: '3', judgement },
      { kind: 'judged', bar: 3.5, judgement },
      { kind: 'judged', bar: 3 },
      { kind: 'judged', bar: 3, judgement: null },
      { kind: 'judged', bar: 3, judgement: { ...judgement, source: undefined } },
      { kind: 'judged', bar: 3, judgement: { ...judgement, kind: 7 } },
      { kind: 'ping' },
      { kind: 'ping', sent: '1' },
      { kind: 'ping', sent: Number.NaN },
    ])
      expect(readClientMessage(junk), JSON.stringify(junk)).toBeNull();
  });

  it('refuses a client of another version, and one without a name', () => {
    expect(refusal({ kind: 'join', protocol: PROTOCOL, name: 'Ada' })).toBeNull();
    expect(refusal({ kind: 'join', protocol: PROTOCOL + 1, name: 'Ada' })).toMatch(/version/);
    expect(refusal({ kind: 'join', protocol: PROTOCOL, name: '  ' })).toMatch(/name/);
  });

  it('refuses a name a player in the session already goes by, in any case', () => {
    const join = (name: string) => ({ kind: 'join', protocol: PROTOCOL, name }) as const;
    expect(refusal(join('Ada'), ['Bo', 'the host'])).toBeNull();
    expect(refusal(join(' ada '), ['Bo', 'Ada'])).toBe(
      'A player named ada is already in this session. Pick another name.',
    );
  });

  it('keeps a player by id in a source, and reads it out by name', () => {
    const players = { c7: 'Ada', host: 'Bo' };
    const keys = playerSource('c7', 'the computer keys');
    expect(playerOf(keys)).toBe('c7');
    expect(sourceName(keys, players)).toBe("Ada's computer keys");
    expect(sourceName(playerSource('host', 'LK Mini/1'), players)).toBe("Bo's LK Mini/1");
    // Two players of one name would still be two sources; one unknown reads as someone.
    expect(playerSource('c8', 'the computer keys')).not.toBe(keys);
    expect(sourceName(playerSource('c9', 'the drum pads'), players)).toBe("someone's drum pads");
    // Outside a session a source is the bare instrument.
    expect(playerOf('the computer keys')).toBeNull();
    expect(sourceName('the computer keys', players)).toBe('the computer keys');
  });

  it(`holds the shapes that travel as version ${PROTOCOL} has them: a change bumps PROTOCOL`, () => {
    // A bar and a judgement carry the engine's own types. If this fails,
    // their shape changed: bump PROTOCOL, so a host and a client of
    // different builds refuse each other, and record the shape here.
    const { bars, judgements } = travelling();
    expect({ protocol: PROTOCOL, bar: shapeOf(bars), judgement: shapeOf(judgements) }).toEqual(
      SHAPES,
    );
  });
});

/** The shapes of version 1, as a minute of the band and two judgements show them. */
const SHAPES = {
  protocol: 1,
  bar: [
    'bar.bar: number',
    'bar.barEnergy: number',
    'bar.barInSection: number',
    'bar.chords[].chord.helix.cycle: number',
    'bar.chords[].chord.helix.heights[]: number',
    'bar.chords[].chord.tensions[]: number',
    'bar.chords[].raised: boolean',
    'bar.chords[].slot.degree: number',
    'bar.chords[].slot.dominantOf: number',
    'bar.chords[].slot.step: number',
    'bar.next[].chord.helix.cycle: number',
    'bar.next[].chord.helix.heights[]: number',
    'bar.next[].chord.tensions[]: number',
    'bar.next[].raised: boolean',
    'bar.next[].slot.degree: number',
    'bar.next[].slot.dominantOf: number',
    'bar.next[].slot.step: number',
    'bar.offer.bar: number',
    'bar.offer.level: number',
    'bar.offer.motif.accents[]: number',
    'bar.offer.motif.accidentals[]: number',
    'bar.offer.motif.cycle: number',
    'bar.offer.motif.degrees[]: null',
    'bar.offer.motif.degrees[]: number',
    'bar.offer.motif.onsets[]: number',
    'bar.offer.source: string',
    'bar.offer: null',
    'bar.plan.key.mode: string',
    'bar.plan.key.tonic: number',
    'bar.plan.section.index: number',
    'bar.plan.section.type: string',
    'bar.plan.theme.bars[][].degree: number',
    'bar.plan.theme.bars[][].dominantOf: number',
    'bar.plan.theme.bars[][].step: number',
    'bar.plan.theme.harm: number',
    'bar.plan.theme.index: number',
    'bar.plan.theme.kind: string',
    'bar.plan.theme.mode: string',
    'bar.plan.theme.vamp: null',
    'bar.seed: number',
    'bar.style.artic: number',
    'bar.style.bpm: number',
    'bar.style.energy: number',
    'bar.style.entropy: number',
    'bar.style.harm: number',
    'bar.style.swing: number',
    'bar.style.sync: number',
    'bar.written[].accent: number',
    'bar.written[].length: number',
    'bar.written[].note: number',
    'bar.written[].part: string',
    'bar.written[].role: string',
    'bar.written[].step: number',
    'start: number',
  ],
  judgement: [
    'count: number',
    'kind: string',
    'level: number',
    'motif.accents[]: number',
    'motif.accidentals[]: number',
    'motif.cycle: number',
    'motif.degrees[]: null',
    'motif.degrees[]: number',
    'motif.onsets[]: number',
    'source: string',
  ],
};
