import { SECTION_TYPES } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  type BarConduct,
  FIRST_PROTOCOL_V2,
  PROTOCOL_V2,
  NO_LACKED,
  SESSION_V2,
  type SectionScore,
  countLacked,
  lackedIn,
  readHostMessageV2,
  readHostSaid,
  versionOf,
} from './protocol-v2.ts';
import {
  FIRST_PROTOCOL,
  LACKED_WHYS,
  PROTOCOL,
  SESSION_V1,
  readClientMessage,
  readHostMessage,
  refusal,
  sameMajor,
} from './protocol.ts';

const conduct: BarConduct = {
  bar: 4,
  start: 12.5,
  seed: 3,
  entropy: 0.3,
  offer: null,
  foreseen: 'd4',
};
const score: SectionScore = {
  bar: 4,
  step: 64,
  section: 'groove',
  text: '* from band',
  unstated: null,
  lock: [{ id: 'styles', hash: 'h1' }],
  fragments: [],
  energy: [0.5, 0.6],
  foreseen: ['d4', 'd5'],
  cut: [],
};
const song = {
  seed: 3,
  start: 2,
  track: {},
  swing: {},
  tempoMeter: {},
  conducts: [conduct],
  scores: [score],
};
const welcome = {
  kind: 'welcome',
  protocol: PROTOCOL_V2,
  session: 'jam',
  resume: 'token',
  song,
  forecast: { from: 4, count: 0, changed: [] },
  muse: {
    offer: null,
    memory: [],
    asOf: null,
    lastPlayed: null,
    log: [],
    dropped: [],
    players: {},
  },
  fragments: [{ id: 'funk_drums~2', hash: 'h2', text: '&drums: x . x .' }],
  band: { id: 'band', hash: 'h3' },
};

describe('the session protocol, version 2', () => {
  it('is protocol 32, minor 2, version 2 from 30; version 1 stays protocol 23', () => {
    expect([PROTOCOL_V2, FIRST_PROTOCOL_V2]).toEqual([32, 30]);
    expect(SESSION_V2).toEqual({ protocol: 32, firstProtocol: 30 });
    expect(SESSION_V1).toEqual({ protocol: PROTOCOL, firstProtocol: FIRST_PROTOCOL });
    expect(PROTOCOL).toBe(23);
  });

  it('admits a peer of each version from its first protocol on, every protocol from 0 to 40', () => {
    for (let protocol = 0; protocol <= 40; protocol++) {
      expect(sameMajor(protocol, SESSION_V1), String(protocol)).toBe(protocol >= 13);
      expect(sameMajor(protocol, SESSION_V2), String(protocol)).toBe(protocol >= 30);
      const join = { kind: 'join', protocol, name: 'Ada' } as const;
      expect(refusal(join, [], null, SESSION_V2) === null, String(protocol)).toBe(protocol >= 30);
    }
    expect(sameMajor(30.5, SESSION_V2)).toBe(false);
    expect(refusal({ kind: 'join', protocol: 29, name: 'Ada' }, [], null, SESSION_V2)).toBe(
      'This host speaks version 32 of the session protocol, which takes 30 on, and this app 29: reload it.',
    );
  });

  it("reads a client's `lacked` of every why, and none with a why the contract doesn't name, a bar not whole or no text", () => {
    for (const why of LACKED_WHYS) {
      const lacked = { kind: 'lacked', bar: 12, why, text: `bar 12: ${why}` };
      expect(readClientMessage(lacked), why).toBe(lacked);
    }
    const lacked = { kind: 'lacked', bar: 12, why: 'late', text: 'its score was still being read' };
    for (const broken of [
      { ...lacked, why: 'muted' },
      { ...lacked, why: undefined },
      { ...lacked, bar: 1.5 },
      { ...lacked, bar: '12' },
      { ...lacked, text: undefined },
      { ...lacked, text: 7 },
    ])
      expect(readClientMessage(broken), JSON.stringify(broken)).toBeNull();
    // A host's reader of either version drops it: it is a client's.
    expect(readHostMessageV2(lacked)).toBeNull();
    expect(readHostMessage(lacked)).toBeNull();
  });

  it('counts the bars each client lacked by why, every why, and the total a soak reads', () => {
    let counts = {};
    for (const why of LACKED_WHYS) counts = countLacked(counts, 'c0', why);
    counts = countLacked(counts, 'c0', 'late');
    counts = countLacked(counts, 'c1', 'digest');
    expect(counts).toEqual({
      c0: { silent: 1, digest: 1, lock: 1, late: 2 },
      c1: { ...NO_LACKED, digest: 1 },
    });
    expect(lackedIn(counts)).toEqual({ silent: 1, digest: 2, lock: 1, late: 2, bars: 6 });
    expect(lackedIn({})).toEqual({ ...NO_LACKED, bars: 0 });
  });

  it("reads version 2's score, conduct and welcome, and version 1's bar and section not", () => {
    for (const message of [
      welcome,
      { ...welcome, song: null },
      { kind: 'conduct', ...conduct },
      { kind: 'conduct', ...conduct, start: null, offer: {} },
      { kind: 'score', ...score },
      { kind: 'score', ...score, text: '', unstated: 'the key moves' },
    ])
      expect(readHostMessageV2(message), JSON.stringify(message)).toBe(message);
    // Version 1's reader reads none of them: a welcome while playing lacks its `bars`, and `score` and `conduct` are kinds it doesn't know.
    expect(readHostMessage(welcome)).toBeNull();
    expect(readHostMessage({ kind: 'score', ...score })).toBeNull();
    expect(readHostMessage({ kind: 'conduct', ...conduct })).toBeNull();
    expect(readHostMessageV2({ kind: 'bar', sent: { bar: {}, start: 1 } })).toBeNull();
    expect(readHostMessageV2({ kind: 'section', bar: 0 })).toBeNull();
    expect(readHostMessageV2({ kind: 'stop' })).toEqual({ kind: 'stop' });
    expect(readHostMessageV2({ kind: 'away' })).toBeNull();
  });

  it('reads a score of each section type, and refuses one that locks the band, which never travels', () => {
    for (const section of SECTION_TYPES)
      expect(readHostMessageV2({ kind: 'score', ...score, section }), section).not.toBeNull();
    expect(
      readHostMessageV2({ kind: 'score', ...score, lock: [{ id: 'band', hash: 'h3' }] }),
    ).toBeNull();
    expect(readHostMessageV2({ ...welcome, band: null })).not.toBeNull();
  });

  it('reads a conduct whose entropy is from 0 to 1, its ends among them, and none outside', () => {
    for (const entropy of [0, 0.5, 1])
      expect(
        readHostMessageV2({ kind: 'conduct', ...conduct, entropy }),
        String(entropy),
      ).not.toBeNull();
    for (const entropy of [-0.01, 1.01, Number.NaN, Infinity])
      expect(
        readHostMessageV2({ kind: 'conduct', ...conduct, entropy }),
        String(entropy),
      ).toBeNull();
  });

  it("reads a version 2 client's messages as version 1's, its join at 31 among them", () => {
    const join = { kind: 'join', protocol: PROTOCOL_V2, name: 'Ada' };
    expect(readClientMessage(join)).toBe(join);
    const nudge = { kind: 'nudge', target: 'key', by: -1 };
    expect(readClientMessage(nudge)).toBe(nudge);
  });
});

describe('a host of either version, as a lobby hands it a client (#553 rung 3)', () => {
  it('says the version a protocol is of: 1 to 29, 2 from 30', () => {
    expect([FIRST_PROTOCOL, PROTOCOL, FIRST_PROTOCOL_V2 - 1].map(versionOf)).toEqual([1, 1, 1]);
    expect([FIRST_PROTOCOL_V2, PROTOCOL_V2].map(versionOf)).toEqual([2, 2]);
  });

  it('reads a message of either version, and none of neither', () => {
    expect(readHostSaid({ kind: 'conduct', ...conduct })).toEqual({ kind: 'conduct', ...conduct });
    expect(readHostSaid({ kind: 'score', ...score })).toEqual({ kind: 'score', ...score });
    expect(readHostSaid({ kind: 'stop' })).toEqual({ kind: 'stop' });
    expect(readHostSaid({ kind: 'conduct', ...conduct, entropy: 2 })).toBeNull();
    expect(readHostSaid({ kind: 'nothing' })).toBeNull();
  });
});
