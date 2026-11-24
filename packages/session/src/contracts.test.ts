/**
 * The family's session contract (yggi/music-commons `contracts/session`,
 * version 2, minor 3: protocol 33, the version Jambot speaks) run against
 * this package's readers, as yggi/webmidi and yggi/cells run theirs: the
 * hub's `vectors.json` is copied into `fixtures/contracts/session.json` with
 * a first field, `lifted`, naming the hub's path and the commit it came from,
 * and the hub's `README.md` for the contract is the rule. The hub's own
 * `lifted`, what it lifted from Jambot, is kept in the copy as `hubLifted`,
 * its one change.
 *
 * Each vector names its reader: `host` reads a client's message
 * (`readClientMessage`), `client` a host's (`readHostMessage`), `lobby` a
 * page's request (`readToLobby`) and `page` what a lobby says
 * (`readFromLobby`), as a lobby reads no version. A reader gives a message it
 * reads back as it is, and null for one it doesn't; a vector with `put` has
 * a number JSON can't hold set at its dotted path first. A join with
 * `admits` is met by the host's `admit` (`roster.ts`), as `host.svelte.ts`
 * calls it: the host's code (`byCode`), the seat the join's token opens
 * (`seat`), the lock from the wrong codes tried (`wrongCodes`, at the join's
 * time `at`), and whether it is seated to listen (`listens`). A welcome with
 * `admits` is met by the client's check, `sameMajor` (`client.svelte.ts`).
 * Both readers drop a kind they don't know as they drop one malformed, and
 * keep the link, so `ignored` is met by `reads` alone, as the contract allows.
 *
 * Every vector runs. One Jambot doesn't meet is recorded below with its
 * reason, and its run then shows it still differs, so a record that has gone
 * stale fails as surely as a vector newly missed.
 */
import { PARTS } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import hub from '../fixtures/contracts/session.json';
import { CLOCK } from './clock.ts';
import { EAR_AFTER } from './ear.ts';
import { SESSION_NAME_MAX, readFromLobby, readToLobby } from './lobby.ts';
import {
  type ClientMessage,
  CODE_DIGITS,
  FIRST_PROTOCOL,
  PLAYED_MOST,
  PROTOCOL,
  type Role,
  WRONG_CODES,
  readClientMessage,
  readHostMessage,
  sameMajor,
  wrongCodesWithin,
} from './protocol.ts';
import { RESUME_WINDOW, type Roster, admit } from './roster.ts';

interface Vector {
  readonly name: string;
  readonly reader: 'host' | 'client' | 'lobby' | 'page';
  readonly reads: boolean;
  readonly message: unknown;
  readonly ignored?: boolean;
  readonly put?: Readonly<Record<string, string>>;
  readonly inUse?: readonly string[];
  readonly admits?: boolean;
  readonly refusedFor?: 'version' | 'code' | 'locked' | 'name' | 'taken';
  readonly byCode?: string | null;
  readonly seat?: Role | null;
  readonly wrongCodes?: readonly number[];
  readonly at?: number;
  readonly listens?: boolean;
}

interface Contract {
  readonly lifted: string;
  readonly contract: string;
  readonly version: number;
  readonly minor: number;
  readonly protocol: number;
  readonly firstProtocol: number;
  readonly parts: readonly string[];
  readonly limits: Readonly<Record<string, number>>;
  readonly vectors: readonly Vector[];
}

type Readers = Record<Vector['reader'], (data: unknown) => unknown>;

const contract = hub as unknown as Contract;

/** Jambot's readers of each side's messages. */
const READERS: Readers = {
  host: readClientMessage,
  client: readHostMessage,
  lobby: readToLobby,
  page: readFromLobby,
};

/** A vector's message as its reader gets it: a number JSON can't hold put in at its path. */
function delivered(v: Vector): unknown {
  const message: unknown = JSON.parse(JSON.stringify(v.message));
  for (const [path, token] of Object.entries(v.put ?? {})) {
    const keys = path.split('.');
    const last = keys.pop()!;
    const at = keys.reduce<Record<string, unknown>>(
      (into, key) => into[key] as Record<string, unknown>,
      message as Record<string, unknown>,
    );
    at[last] = Number(token);
  }
  return message;
}

/** Why a host refuses a join, as the contract names it, or null where it admits it. */
function refusedFor(why: string | null): Vector['refusedFor'] | null {
  if (why === null) return null;
  if (/version/.test(why)) return 'version';
  // The lock's refusal names codes too, so it is told apart first.
  if (/Too many wrong codes/.test(why)) return 'locked';
  if (/code/.test(why)) return 'code';
  if (/needs a name/.test(why)) return 'name';
  if (/already in this session/.test(why)) return 'taken';
  throw new Error(`a refusal the contract doesn't name: ${why}`);
}

/**
 * A host's roster for a join's vector: a player present by each name in
 * use, and, where the join's token opens a seat, that seat away under the
 * join's name, a listener's seated without the code.
 */
function rosterFor(v: Vector, join: ClientMessage & { kind: 'join' }): Roster {
  const present = (v.inUse ?? []).map((name, i) => ({
    id: `p${i}`,
    name,
    token: `p${i}`,
    link: `p${i}`,
    awaySince: null,
    role: 'player' as const,
  }));
  if (!v.seat || join.resume === undefined) return present;
  return [
    ...present,
    { id: 'seat', name: join.name, token: join.resume, link: null, awaySince: 0, role: v.seat },
  ];
}

/**
 * How Jambot meets a vector, read by `readers`: null where it does, or what
 * differs. A reader reads the message as it is or not at all, and a peer
 * admits exactly the joins and welcomes the vector admits, for the reason it
 * names, a join seated to listen where it says so.
 */
function differs(v: Vector, readers: Readers = READERS): string | null {
  const message = delivered(v);
  const read = readers[v.reader](message);
  if (v.reads && read !== message) return `${v.reader} doesn't read it`;
  if (!v.reads && read !== null) return `${v.reader} reads it`;
  if (v.admits === undefined) return null;
  if (v.reader === 'host') {
    const join = read as ClientMessage & { kind: 'join' };
    const locked = wrongCodesWithin(v.wrongCodes ?? [], v.at ?? 0).length >= WRONG_CODES.count;
    // The names in use are the host's players', its own among them: none is the host's alone.
    const admitted = admit(
      rosterFor(v, join),
      join,
      'joining',
      'minted',
      '',
      v.byCode ?? null,
      locked,
    );
    const why = 'refusal' in admitted ? admitted.refusal : null;
    if ((why === null) !== v.admits) return v.admits ? `host refuses: ${why}` : 'host admits';
    if (refusedFor(why) !== (v.refusedFor ?? null)) return `host refuses for ${refusedFor(why)}`;
    if (
      'member' in admitted &&
      v.listens !== undefined &&
      (admitted.member.role === 'listener') !== v.listens
    )
      return v.listens ? 'host seats it to play' : 'host seats it to listen';
    return null;
  }
  const stays = sameMajor((read as { protocol: unknown }).protocol);
  return stays === v.admits ? null : stays ? 'client stays' : 'client leaves';
}

/**
 * The vectors Jambot doesn't meet, by name, each with why. Empty: a client
 * checks a host message's fields (`readHostMessage`), a host's join a
 * protocol that is an integer, and a page a listed session's `away`
 * (`readFromLobby`), as the contract's rule has them, and a host reads a
 * client's `lacked` (minor 2).
 */
const RECORDED: Readonly<Record<string, string>> = {};

/** The names recorded that name no vector: none while each record is of one. */
const strays = (names: readonly string[], recorded: readonly string[]) =>
  recorded.filter((n) => !names.includes(n));

const names = contract.vectors.map((v) => v.name);
const named = (name: string) => contract.vectors.find((v) => v.name === name)!;

describe('the session contract, version 2 (yggi/music-commons contracts/session, minor 3)', () => {
  it('is lifted with its source named, each vector named once, every record of a vector', () => {
    expect(contract.lifted).toMatch(
      /^Lifted from yggi\/music-commons contracts\/session\/vectors\.json @ [0-9a-f]{7,40}( \(.+\))?$/,
    );
    expect([contract.contract, contract.version, contract.minor]).toEqual(['session', 2, 3]);
    expect(new Set(names).size).toBe(names.length);
    expect(strays(names, Object.keys(RECORDED))).toEqual([]);
    expect(names).toHaveLength(381);
  });

  it("is the version Jambot speaks: its protocol and its first are Jambot's", () => {
    // (minor 3, protocol 33: a score's section a kind of a song form, #655, yggi/music-commons#76)
    expect([contract.protocol, contract.firstProtocol]).toEqual([PROTOCOL, FIRST_PROTOCOL]);
  });

  it("holds Jambot's parts and the limits this package keeps", () => {
    expect(contract.parts).toEqual(PARTS);
    const {
      playedMost,
      sentAfterSteps,
      resumeSeconds,
      tooFarSeconds,
      sessionNameMost,
      codeDigits,
      wrongCodes,
      wrongCodesSeconds,
    } = contract.limits;
    expect({
      playedMost,
      sentAfterSteps,
      resumeSeconds,
      tooFarSeconds,
      sessionNameMost,
      codeDigits,
      wrongCodes,
      wrongCodesSeconds,
    }).toEqual({
      playedMost: PLAYED_MOST,
      sentAfterSteps: EAR_AFTER,
      resumeSeconds: RESUME_WINDOW,
      tooFarSeconds: CLOCK.tooFar,
      sessionNameMost: SESSION_NAME_MAX,
      codeDigits: CODE_DIGITS,
      wrongCodes: WRONG_CODES.count,
      wrongCodesSeconds: WRONG_CODES.seconds,
    });
  });

  it.each(contract.vectors.map((v) => [v.reader, v.name, v] as const))(
    '%s: %s',
    (_reader, name, v) => {
      if (Object.hasOwn(RECORDED, name)) expect(differs(v), RECORDED[name]).not.toBeNull();
      else expect(differs(v)).toBeNull();
    },
  );

  it("is shown firing: a reader that reads what it shouldn't, a vector turned over, or a record of none, is caught", () => {
    // A reader that takes anything reads the kinds version 2 doesn't know, and one malformed.
    const credulous: Readers = { ...READERS, client: (m) => m, host: (m) => m };
    for (const name of [
      'bar, version 1’s, to a client of version 2',
      'section, version 1’s, to a client of version 2',
      'conduct: entropy = 1.5',
    ]) {
      expect(differs(named(name)), name).toBeNull();
      expect(differs(named(name), credulous), name).toBe('client reads it');
    }
    expect(differs(named('lacked, silent: why = "muted"'), credulous)).toBe('host reads it');
    // Each refusal of a score's, a conduct's or a welcome's fields, turned over.
    for (const name of [
      'score, a text: lock.1.id = "band"',
      'score, a text: section = "coda"',
      'conduct: entropy = 1.5',
      'welcome while stopped: band.hash = 7',
      'welcome while playing: song.conducts absent',
    ])
      expect(differs({ ...named(name), reads: true }), name).toBe("client doesn't read it");
    const ping = named('ping');
    expect(differs(ping)).toBeNull();
    expect(differs({ ...ping, reads: false })).toBe('host reads it');
    // A join and a welcome at 29, a version before, are refused and left; one at 31 admitted.
    const joinAt29 = named('handshake: a join at protocol 29, a version before');
    expect(differs({ ...joinAt29, admits: true })).toMatch(/^host refuses: .*version/);
    expect(differs({ ...joinAt29, refusedFor: 'name' })).toBe('host refuses for version');
    const welcomeAt29 = named('handshake: a welcome at protocol 29, a version before');
    expect(differs({ ...welcomeAt29, admits: true })).toBe('client leaves');
    const own = named('handshake: a join at protocol 33, its own');
    expect(differs({ ...own, admits: false })).toBe('host admits');
    // Cell studio's follower joins at 31, two minors before, and is admitted.
    const before = named('handshake: a join at protocol 31, a minor before');
    expect(differs({ ...before, admits: false })).toBe('host admits');
    const locked = named(
      'handshake: "Ada", code "042917", to a host by code "042917", wrong codes at 0, 10, 20, 30, 40 s, joining at 59.9 s',
    );
    expect(differs({ ...locked, refusedFor: 'code' })).toBe('host refuses for locked');
    expect(differs({ ...locked, at: 60 })).toBe('host admits');
    const listens = named('handshake: "Ada", no code, to a host by code "042917"');
    expect(differs({ ...listens, listens: false })).toBe('host seats it to listen');
    expect(differs({ ...listens, byCode: null })).toBe('host seats it to play');
    const listener = named(
      'handshake: "Bo", no code, a listener\'s token, beside the host, to a host by code "042917"',
    );
    expect(differs({ ...listener, seat: 'player' })).toBe('host seats it to play');
    const away = named(
      'from a lobby: {"op":"sessions","sessions":[{"name":"jam","players":2,"away":"yes"},{"name":"reel","players":1}]}',
    );
    expect(differs({ ...away, reads: true })).toBe("page doesn't read it");
    // A client's `lacked`, read; one whose `why` the contract doesn't name, turned over, is caught.
    const lacked = named('lacked, late');
    expect(differs(lacked)).toBeNull();
    expect(differs({ ...lacked, reads: false })).toBe('host reads it');
    const muted = named('lacked, silent: why = "muted"');
    expect(differs({ ...muted, reads: true })).toBe("host doesn't read it");
    expect(strays(['a', 'b'], ['a', 'gone'])).toEqual(['gone']);
  });
});
