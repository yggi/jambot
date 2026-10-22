import {
  INITIAL_STYLE,
  type Judgement,
  LOOKAHEAD,
  METER_REPOSITORY,
  type MuseOutput,
  PRESETS,
  RHYTHM_REPOSITORY,
  type Style,
  type Remembered,
  type SongClock,
  type TransportEnv,
  clockOfTransport,
  holding,
  judgeBar,
  transport,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import hub from '../fixtures/contracts/session.json';
import { EAR, earListen } from './ear.ts';
import { sentBars } from './host.ts';
import {
  type ClientMessage,
  FIRST_PROTOCOL,
  type HostMessage,
  PLAYED_MOST,
  PROTOCOL,
  type SectionText,
  heardFrom,
  type SentBar,
  playerOf,
  playerSource,
  readClientMessage,
  readHostMessage,
  refusal,
  sameMajor,
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
 * The bars a host sends over 75 seconds of full energy and harmony, with a
 * motif heard in bar 2 so that bars carry an offer and accents, and the
 * judgements of the notes heard. The repository gives that style 10/8, whose
 * bars are 20 steps, so 75 seconds hold the bars a minute of 4/4 does, enough
 * for the Muse to forget a motif.
 */
function travelling(style: Style = { ...INITIAL_STYLE, energy: 1, harm: 1 }): {
  bars: SentBar[];
  judgements: Judgement[];
  log: MuseOutput[];
  memory: Remembered[];
} {
  const env: TransportEnv = {
    seed: 3,
    start: 0,
    track: holding(style),
    wish: { tonic: null, mode: 'aeolian', melodic: null },
    // No meter asked for: each section's plan says the repository's meter and its share (#375),
    // and the rhythm the composer finds that fits it, with its clave where one layers (#397).
    repository: METER_REPOSITORY,
    rhythms: RHYTHM_REPOSITORY,
  };
  // The motif in bar 2, and again in bar 3, so the log carries a recognition: each
  // bar where the song's clock starts it, in whatever meter the repository gives.
  const inBar = (bar: number, clock: SongClock) =>
    [69, 72, 76, 74].map((note, i) => ({
      note,
      velocity: 110 - i * 20,
      source: 'a client',
      position: clock.barStart(bar) + i * 4,
      end: i === 3 ? null : clock.barStart(bar) + 1 + i * 4,
    }));
  const heard = [2, 3];
  let carried = transport.initial;
  const bars: SentBar[] = [];
  const log: MuseOutput[] = [];
  let memory: Remembered[] = [];
  for (let t = 0; t < 75; t += 0.025) {
    const clock = clockOfTransport(carried);
    const due =
      carried && heard.length > 0 && carried.head.step > clock.barStart(5 - heard.length) + 2
        ? inBar(heard.shift()!, clock)
        : [];
    const next = transport.advance(env, carried, { now: t, until: t + LOOKAHEAD, heard: due });
    carried = next.carried;
    bars.push(
      ...sentBars(
        next.output.composed,
        next.output.steps,
        carried!.head,
        env.track,
        clockOfTransport(carried),
      ),
    );
    log.push(...next.output.judged);
    // What she remembers while she does: it fades out of the run's end.
    const now = carried?.listening.muse.memory ?? [];
    if (now.length > 0) memory = [...now];
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
  return { bars, judgements, log, memory };
}

/**
 * What a client's ear passes on of a bar of drums (#410): kick, snare and
 * hats struck on the pads, a hat held from a MIDI port, each a little off
 * the grid, as a hand plays.
 */
function playedBars(): (ClientMessage & { kind: 'played' })[] {
  const drums = [36, 42, 38, 42].map((note, i) => ({
    note,
    velocity: 100 - i * 9,
    source: i === 3 ? 'a MIDI port' : 'the drum pads',
    position: 16 + i * 4 + 0.23,
    end: i === 3 ? 16 + i * 4 + 1.71 : null,
  }));
  return earListen(EAR, [], 3 * 16, () => undefined, undefined, drums).played.map((p) => ({
    kind: 'played',
    ...p,
  }));
}

/**
 * A section's cells text as a host sends it (#446), framed by the first of
 * the bars it states: the text itself is cells' (the app builds it), so a
 * line of it stands in here, which a shape doesn't read.
 */
function sectionsOf(bars: readonly SentBar[]): (HostMessage & { kind: 'section' })[] {
  const at = (first: number): HostMessage & { kind: 'section' } => {
    const { plan, swing, style } = bars[first]!.bar;
    return {
      kind: 'section',
      bar: bars[first]!.bar.bar,
      step: bars[first]!.bar.bar * 16,
      text: '&bar meter("4/4") step=120bpm',
      unstated: null,
      frame: { meter: plan.meter, swing, bpm: style.bpm, key: plan.key },
      foreseen: bars.slice(first, first + 8).map((_, i) => `1f3a${i}`),
      cut: [3],
    };
  };
  const stated = at(0);
  const unstated = { ...at(8), text: '', unstated: "the section's key moves between its bars" };
  return [stated, unstated];
}

describe('the session protocol', () => {
  it("reads each side's messages, and nothing else", () => {
    expect(readHostMessage({ kind: 'stop' })).toEqual({ kind: 'stop' });
    expect(readHostMessage({ kind: 'finale', bar: 9 })).toEqual({ kind: 'finale', bar: 9 });
    // A section's text (#446), as a host sends it, and with a welcome.
    const sections = sectionsOf(travelling().bars);
    for (const section of sections) expect(readHostMessage(section)).toEqual(section);
    expect(readClientMessage(sections[0])).toBeNull();
    const text: SectionText = sections[0]!;
    expect(text.foreseen).toHaveLength(8);
    expect(readClientMessage({ kind: 'ping', sent: 1 })).toEqual({ kind: 'ping', sent: 1 });
    for (const junk of [null, 3, 'stop', {}, { kind: 7 }, { kind: 'play' }]) {
      expect(readHostMessage(junk)).toBeNull();
      expect(readClientMessage(junk)).toBeNull();
    }
    // A lobby says a link dropped or a host came back; no peer can say it for it.
    for (const kind of ['lost', 'away', 'back']) {
      expect(readClientMessage({ kind })).toBeNull();
      expect(readHostMessage({ kind })).toBeNull();
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
      { kind: 'join', protocol: PROTOCOL, name: 'Ada', resume: 'token' },
      { kind: 'judged', bar: 3, judgement },
      { kind: 'ping', sent: 1.5 },
      ...playedBars(),
      // Any part the band has reads; a host hears drums alone so far (`heardFrom`).
      { kind: 'played', part: 'bass', bar: 1, notes: [] },
      { kind: 'forget' },
      { kind: 'leave' },
    ])
      expect(readClientMessage(message)).toEqual(message);
    for (const junk of [
      { kind: 'join', protocol: PROTOCOL },
      { kind: 'join', name: 'Ada' },
      { kind: 'join', protocol: String(PROTOCOL), name: 'Ada' },
      { kind: 'join', protocol: PROTOCOL, name: 7 },
      { kind: 'join', protocol: PROTOCOL, name: 'Ada', resume: 7 },
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
      ...playedJunk(),
    ])
      expect(readClientMessage(junk), JSON.stringify(junk)).toBeNull();
  });

  it(`reads a client's played bar of at most ${PLAYED_MOST} notes, and hears drums alone in it, by the player's name`, () => {
    const [played] = playedBars();
    expect(played!.notes).toHaveLength(4);
    const most = { ...played!, notes: Array(PLAYED_MOST).fill(played!.notes[0]) };
    expect(readClientMessage(most)).toEqual(most);
    expect(readClientMessage({ ...most, notes: [...most.notes, played!.notes[0]] })).toBeNull();
    // The host names each note by the player it seated, whatever the client said it was.
    expect(heardFrom(played!, 'Ada')).toEqual(played!.notes.map((n) => ({ ...n, source: 'Ada' })));
    expect(heardFrom({ ...played!, part: 'lead' }, 'Ada')).toEqual([]);
    // About 85 bytes a note on the wire, as JSON: a bar of 4 hits is under 400.
    expect(JSON.stringify(played).length).toBeLessThan(400);
  });

  it('admits a client of any minor of its major version, 13 on, and refuses one of an older, and one without a name (#460)', () => {
    expect([PROTOCOL, FIRST_PROTOCOL]).toEqual([14, 13]);
    for (const protocol of [13, 14, 15])
      expect(refusal({ kind: 'join', protocol, name: 'Ada' }), String(protocol)).toBeNull();
    for (const protocol of [12, 1, 13.5, Number.NaN])
      expect(refusal({ kind: 'join', protocol, name: 'Ada' }), String(protocol)).toMatch(
        /version 14 .* takes 13 on/,
      );
    expect(refusal({ kind: 'join', protocol: FIRST_PROTOCOL, name: '  ' })).toMatch(/name/);
    expect(sameMajor('14')).toBe(false);
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
    // A bar, a judgement and the Muse's log carry the engine's own types. If this fails,
    // their shape changed: bump PROTOCOL, a minor where the change only adds (#460),
    // and record the shape here.
    const { bars: tenEight, judgements, log, memory } = travelling();
    // 10/8 fits no rhythm: Funk's point, in 4/4, plays its drum bar and the rumba clave (#397).
    const funk = travelling({
      ...PRESETS.find((p) => p.name === 'Funk')!.style,
      entropy: 0.3,
    }).bars;
    expect(funk.some((b) => b.bar.plan.claveFragment)).toBe(true);
    const bars = [...tenEight, ...funk];
    expect(memory.length).toBeGreaterThan(0);
    expect(log.some((l) => l.recognised.length > 0)).toBe(true);
    expect({
      protocol: PROTOCOL,
      bar: shapeOf(bars),
      judgement: shapeOf(judgements),
      log: shapeOf(log),
      memory: shapeOf(memory),
      played: shapeOf(playedBars()),
      section: shapeOf(sectionsOf(bars)),
    }).toEqual(SHAPES);
    // The session contract (yggi/music-commons `contracts/session`) holds the same shapes.
    expect(hub.shapes).toEqual(SHAPES);
  });

  it('never carries a performer’s fill on the wire: a bar states only what a WrittenNote holds (#107, #140)', () => {
    // The check itself can fail: a note with a fill key is caught.
    expect(shapeOf([{ gain: 0.5 }])).toContain('gain: number');
    const { bars } = travelling();
    const shape = shapeOf(bars);
    for (const key of [
      'velocity',
      'gain',
      'cutoff',
      'attack',
      'release',
      'resonance',
      'triangle',
      'square',
      'saw',
    ])
      expect(shape.some((path) => path.endsWith(`.${key}: number`))).toBe(false);
  });
});

/** The shapes of version 14 (the join and welcome that carry a resume token are read by field, above), as 75 seconds of the band, two judgements, the Muse's log, a client's bar of drums and a host's section texts show them; 10 carries the meter's swing track (#360, #369) and counts a track's bpm in the beats of the meter beside it (#367, #373); 11 has a section's plan say the meter fragment the composer took from the repository and the share it swings at (#375); 12 the rhythm fragment and the clave (#397); 13 has a client pass on each bar its players played on drums, the notes as heard (`played`, #410); 14 has a host send each section's cells text (`section`, and a welcome's `song.texts`, #446). */
/** A played bar that isn't one: each field missing or of another type, in turn. */
function playedJunk(): unknown[] {
  const [played] = playedBars();
  const note = played!.notes[0]!;
  const notes = (changed: Record<string, unknown>) => ({
    ...played,
    notes: [{ ...note, ...changed }],
  });
  return [
    { ...played, part: undefined },
    { ...played, part: 'kazoo' },
    { ...played, bar: undefined },
    { ...played, bar: 1.5 },
    { ...played, notes: undefined },
    { ...played, notes: 'kick' },
    { ...played, notes: [null] },
    notes({ note: undefined }),
    notes({ note: 36.5 }),
    notes({ note: 128 }),
    notes({ velocity: '100' }),
    notes({ velocity: -1 }),
    notes({ velocity: 128 }),
    notes({ source: 7 }),
    notes({ position: Number.POSITIVE_INFINITY }),
    notes({ position: undefined }),
    notes({ end: undefined }),
    notes({ end: Number.NaN }),
  ];
}

const SHAPES = {
  protocol: 14,
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
    'bar.plan.claveFragment: string',
    'bar.plan.key.mode: string',
    'bar.plan.key.tonic: number',
    'bar.plan.melodic: string',
    'bar.plan.meter.cycle: number',
    'bar.plan.meter.heights[]: number',
    'bar.plan.meterFragment: string',
    'bar.plan.rhythmFragment: string',
    'bar.plan.section.index: number',
    'bar.plan.section.type: string',
    'bar.plan.share: number',
    'bar.plan.swing: string',
    'bar.plan.theme.bars[][].degree: number',
    'bar.plan.theme.bars[][].dominantOf: number',
    'bar.plan.theme.bars[][].step: number',
    'bar.plan.theme.harm: number',
    'bar.plan.theme.index: number',
    'bar.plan.theme.kind: string',
    'bar.plan.theme.mode: string',
    'bar.plan.theme.vamp: null',
    'bar.plan.theme.vamp: number',
    'bar.seed: number',
    'bar.style.artic: number',
    'bar.style.bpm: number',
    'bar.style.energy: number',
    'bar.style.entropy: number',
    'bar.style.harm: number',
    'bar.style.sync: number',
    'bar.swing.level: string',
    'bar.swing.share: number',
    'bar.written[].accent: number',
    'bar.written[].length: number',
    'bar.written[].note: number',
    'bar.written[].part: string',
    'bar.written[].role: string',
    'bar.written[].step: number',
    'start: number',
  ],
  judgement: [
    'confidence: number',
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
  log: [
    'bar: number',
    'forgot: null',
    'forgot: string',
    'judgements[].confidence: number',
    'judgements[].kind: string',
    'judgements[].level: number',
    'judgements[].motif.accents[]: number',
    'judgements[].motif.accidentals[]: number',
    'judgements[].motif.cycle: number',
    'judgements[].motif.degrees[]: null',
    'judgements[].motif.degrees[]: number',
    'judgements[].motif.onsets[]: number',
    'judgements[].source: string',
    'offer.bar: number',
    'offer.level: number',
    'offer.motif.accents[]: number',
    'offer.motif.accidentals[]: number',
    'offer.motif.cycle: number',
    'offer.motif.degrees[]: null',
    'offer.motif.degrees[]: number',
    'offer.motif.onsets[]: number',
    'offer.source: string',
    'offer: null',
    'recognised[].of.bar: number',
    'recognised[].of.source: string',
    'recognised[].op.late: number',
    'recognised[].op.mirror: boolean',
    'recognised[].op.rev: boolean',
    'recognised[].op.strans: number',
    'recognised[].source: string',
  ],
  memory: [
    'bar: number',
    'heard: number',
    'motif.accents[]: number',
    'motif.accidentals[]: number',
    'motif.cycle: number',
    'motif.degrees[]: null',
    'motif.degrees[]: number',
    'motif.onsets[]: number',
    'source: string',
    'weight: number',
  ],
  played: [
    'bar: number',
    'kind: string',
    'notes[].end: null',
    'notes[].end: number',
    'notes[].note: number',
    'notes[].position: number',
    'notes[].source: string',
    'notes[].velocity: number',
    'part: string',
  ],
  section: [
    'bar: number',
    'cut[]: number',
    'foreseen[]: string',
    'frame.bpm: number',
    'frame.key.mode: string',
    'frame.key.tonic: number',
    'frame.meter.cycle: number',
    'frame.meter.heights[]: number',
    'frame.swing.level: string',
    'frame.swing.share: number',
    'kind: string',
    'step: number',
    'text: string',
    'unstated: null',
    'unstated: string',
  ],
};
