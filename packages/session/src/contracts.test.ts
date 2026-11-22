/**
 * The family's session contract (yggi/music-commons `contracts/session-v1`,
 * version 1, minor 11: protocol 24, which Jambot spoke before version 2; and `contracts/session`, version 2,
 * minor 3: protocol 33, the version Jambot speaks) run against this package's readers, as yggi/webmidi
 * and yggi/cells run theirs: each version's hub `vectors.json` is copied into
 * `fixtures/contracts/` (`session.json` for version 1, `session-v2.json` for
 * version 2) with a first field, `lifted`, naming the hub's path and the
 * commit it came from, and the hub's `README.md` for the contract is the
 * rule. The hub's own `lifted`, what it lifted from Jambot, is kept in the
 * copy as `hubLifted`, its one change.
 *
 * Each vector names its reader: `host` reads a client's message
 * (`readClientMessage`, which version 2 shares, its client messages being
 * version 1's with minor 2's `lacked`), `client` a host's (`readHostMessage`, or
 * `readHostMessageV2` for version 2), `lobby` a page's request
 * (`readToLobby`) and `page` what a lobby says (`readFromLobby`), both
 * versions' alike, as a lobby reads no version. A reader gives a message it
 * reads back as it is, and null for one it doesn't; a vector with `put` has
 * a number JSON can't hold set at its dotted path first. A join with
 * `admits` is met by the host's `admit` (`roster.ts`) at the vector's
 * version, as `host.svelte.ts` calls it: the host's code (`byCode`), the
 * seat the join's token opens (`seat`), the lock from the wrong codes tried
 * (`wrongCodes`, at the join's time `at`), and whether it is seated to
 * listen (`listens`). A welcome with `admits` is met by the client's check,
 * `sameMajor` at the vector's version (`client.svelte.ts`).
 * Both readers drop a kind they don't know as they drop one malformed, and
 * keep the link, so `ignored` is met by `reads` alone, as the contract allows.
 *
 * Every vector runs. One Jambot doesn't meet is recorded below with its
 * reason, and its run then shows it still differs, so a record that has gone
 * stale fails as surely as a vector newly missed.
 */
import { PARTS } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import hubV1 from '../fixtures/contracts/session.json';
import hubV2 from '../fixtures/contracts/session-v2.json';
import { CLOCK } from './clock.ts';
import { EAR_AFTER } from './ear.ts';
import { SESSION_NAME_MAX, readFromLobby, readToLobby } from './lobby.ts';
import { FIRST_PROTOCOL_V2, PROTOCOL_V2, SESSION_V2, readHostMessageV2 } from './protocol-v2.ts';
import {
  type ClientMessage,
  FIRST_PROTOCOL,
  CODE_DIGITS,
  PLAYED_MOST,
  PROTOCOL,
  type Role,
  SESSION_V1,
  type SessionVersion,
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

/** One version of the contract as Jambot runs it: the copy, its readers, and the version its peers admit by. */
interface Run {
  readonly contract: Contract;
  readonly readers: Readers;
  readonly speaks: SessionVersion;
}

const LOBBY_READERS = { lobby: readToLobby, page: readFromLobby } as const;

const V1: Run = {
  contract: hubV1 as unknown as Contract,
  readers: { host: readClientMessage, client: readHostMessage, ...LOBBY_READERS },
  speaks: SESSION_V1,
};
const V2: Run = {
  contract: hubV2 as unknown as Contract,
  readers: { host: readClientMessage, client: readHostMessageV2, ...LOBBY_READERS },
  speaks: SESSION_V2,
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
 * How Jambot meets a vector of a version: null where it does, or what
 * differs. A reader reads the message as it is or not at all, and a peer
 * admits exactly the joins and welcomes the vector admits, for the reason it
 * names, a join seated to listen where it says so.
 */
function differs(run: Run, v: Vector): string | null {
  const message = delivered(v);
  const read = run.readers[v.reader](message);
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
      run.speaks,
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
  const stays = sameMajor((read as { protocol: unknown }).protocol, run.speaks);
  return stays === v.admits ? null : stays ? 'client stays' : 'client leaves';
}

/**
 * The vectors Jambot doesn't meet, by version and name, each with why.
 * Empty for both: a client checks a host message's fields
 * (`readHostMessage`, `readHostMessageV2`), a host's join a protocol that is
 * an integer, and a page a listed session's `away` (`readFromLobby`), as the
 * contract's rule has them, and a host reads a client's `lacked` (minor 2).
 */
const RECORDED: Readonly<Record<1 | 2, Readonly<Record<string, string>>>> = { 1: {}, 2: {} };

/** The names recorded that name no vector: none while each record is of one. */
const strays = (names: readonly string[], recorded: readonly string[]) =>
  recorded.filter((n) => !names.includes(n));

const namesOf = (run: Run) => run.contract.vectors.map((v) => v.name);
const named = (run: Run, name: string) => run.contract.vectors.find((v) => v.name === name)!;

describe.each([
  [1, V1, 'session-v1', 11, 366],
  [2, V2, 'session', 3, 381],
] as const)(
  'the session contract, version %i (yggi/music-commons contracts/%s, minor %i)',
  (version, run, path, minor, count) => {
    const { contract } = run;
    const names = namesOf(run);

    it('is lifted with its source named, each vector named once, every record of a vector', () => {
      expect(contract.lifted).toMatch(
        new RegExp(
          `^Lifted from yggi/music-commons contracts/${path}/vectors\\.json @ [0-9a-f]{7,40}( \\(.+\\))?$`,
        ),
      );
      expect([contract.contract, contract.version, contract.minor]).toEqual([
        'session',
        version,
        minor,
      ]);
      expect(contract.firstProtocol).toBe(run.speaks.firstProtocol);
      expect(new Set(names).size).toBe(names.length);
      expect(strays(names, Object.keys(RECORDED[version]))).toEqual([]);
      expect(names).toHaveLength(count);
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
        const recorded = RECORDED[version];
        if (Object.hasOwn(recorded, name)) expect(differs(run, v), recorded[name]).not.toBeNull();
        else expect(differs(run, v)).toBeNull();
      },
    );
  },
);

describe('the session contract, version 1, as Jambot spoke it before version 2', () => {
  it('is the version Jambot spoke', () => {
    // (minor 11, protocol 24: a section a kind of a song form, and its song, #655, yggi/music-commons#76)
    expect([V1.contract.protocol, V1.contract.firstProtocol]).toEqual([PROTOCOL, FIRST_PROTOCOL]);
    expect(SESSION_V1).toEqual({ protocol: PROTOCOL, firstProtocol: FIRST_PROTOCOL });
  });

  it('is shown firing: a vector turned over, or a record of none, is caught', () => {
    const ping = named(V1, 'ping');
    expect(differs(V1, ping)).toBeNull();
    expect(differs(V1, { ...ping, reads: false })).toBe('host reads it');
    const older = named(V1, 'handshake: a welcome at protocol 12, a version before');
    expect(differs(V1, { ...older, admits: true })).toBe('client leaves');
    const old = named(V1, 'handshake: a join at protocol 12, a version before');
    expect(differs(V1, { ...old, admits: true })).toMatch(/^host refuses: .*version/);
    expect(differs(V1, { ...old, refusedFor: 'name' })).toBe('host refuses for version');
    const locked = named(
      V1,
      'handshake: "Ada", code "042917", to a host by code "042917", wrong codes at 0, 10, 20, 30, 40 s, joining at 59.9 s',
    );
    expect(differs(V1, { ...locked, refusedFor: 'code' })).toBe('host refuses for locked');
    expect(differs(V1, { ...locked, at: 60 })).toBe('host admits');
    const listens = named(V1, 'handshake: "Ada", no code, to a host by code "042917"');
    expect(differs(V1, { ...listens, listens: false })).toBe('host seats it to listen');
    expect(differs(V1, { ...listens, byCode: null })).toBe('host seats it to play');
    const listener = named(
      V1,
      'handshake: "Bo", no code, a listener\'s token, beside the host, to a host by code "042917"',
    );
    expect(differs(V1, { ...listener, seat: 'player' })).toBe('host seats it to play');
    const away = named(
      V1,
      'from a lobby: {"op":"sessions","sessions":[{"name":"jam","players":2,"away":"yes"},{"name":"reel","players":1}]}',
    );
    expect(differs(V1, { ...away, reads: true })).toBe("page doesn't read it");
    expect(strays(['a', 'b'], ['a', 'gone'])).toEqual(['gone']);
  });
});

describe('the session contract, version 2, as Jambot speaks it', () => {
  it("is version 2's own protocol and first", () => {
    // (minor 3, protocol 33: a score's section a kind of a song form, #655, yggi/music-commons#76)
    expect([V2.contract.protocol, V2.contract.firstProtocol]).toEqual([
      PROTOCOL_V2,
      FIRST_PROTOCOL_V2,
    ]);
    expect(SESSION_V2).toEqual({ protocol: PROTOCOL_V2, firstProtocol: FIRST_PROTOCOL_V2 });
  });

  it("is shown firing: version 1's reader or admission in its place, or a vector turned over, is caught", () => {
    // Version 1's reader reads none of version 2's own kinds, and reads version 1's `bar`, which version 2 ignores.
    const asV1: Run = { ...V2, readers: V1.readers, speaks: SESSION_V1 };
    const score = named(V2, 'score, a text');
    expect(differs(V2, score)).toBeNull();
    expect(differs(asV1, score)).toBe("client doesn't read it");
    expect(differs(asV1, named(V2, 'conduct'))).toBe("client doesn't read it");
    expect(differs(asV1, named(V2, 'welcome while playing'))).toBe("client doesn't read it");
    expect(differs(asV1, named(V2, 'bar, version 1’s, to a client of version 2'))).toBe(
      'client reads it',
    );
    // Version 1's admission takes a join and a welcome at 29, which version 2 refuses.
    const joinAt29 = named(V2, 'handshake: a join at protocol 29, a version before');
    const welcomeAt29 = named(V2, 'handshake: a welcome at protocol 29, a version before');
    expect(differs(V2, joinAt29)).toBeNull();
    expect(differs(V2, welcomeAt29)).toBeNull();
    const admitsAsV1: Run = { ...V2, speaks: SESSION_V1 };
    expect(differs(admitsAsV1, joinAt29)).toBe('host admits');
    expect(differs(admitsAsV1, welcomeAt29)).toBe('client stays');
    // Each refusal of version 2's own fields, turned over.
    for (const name of [
      'score, a text: lock.1.id = "band"',
      'score, a text: section = "coda"',
      'conduct: entropy = 1.5',
      'welcome while stopped: band.hash = 7',
      'welcome while playing: song.conducts absent',
    ])
      expect(differs(V2, { ...named(V2, name), reads: true }), name).toBe("client doesn't read it");
    const own = named(V2, 'handshake: a join at protocol 33, its own');
    expect(differs(V2, { ...own, admits: false })).toBe('host admits');
    // Cell studio's follower joins at 31, two minors before, and is admitted.
    const before = named(V2, 'handshake: a join at protocol 31, a minor before');
    expect(differs(V2, { ...before, admits: false })).toBe('host admits');
    // A client's `lacked`, read; one whose `why` the contract doesn't name, turned over, is caught.
    const lacked = named(V2, 'lacked, late');
    expect(differs(V2, lacked)).toBeNull();
    expect(differs(V2, { ...lacked, reads: false })).toBe('host reads it');
    const muted = named(V2, 'lacked, silent: why = "muted"');
    expect(differs(V2, { ...muted, reads: true })).toBe("host doesn't read it");
  });
});
