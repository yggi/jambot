import { describe, expect, it } from 'vitest';
import {
  CODE_NEEDED,
  CODE_WRONG,
  FIRST_PROTOCOL,
  PROTOCOL,
  type ClientMessage,
} from './protocol.ts';
import { RESUME_WINDOW, admit, expire, leave, lose, present, type Roster } from './roster.ts';

type Join = ClientMessage & { kind: 'join' };
const join = (name: string, resume?: string): Join =>
  resume === undefined
    ? { kind: 'join', protocol: PROTOCOL, name }
    : { kind: 'join', protocol: PROTOCOL, name, resume };

/** A roster admitted one after another: each a name, on a link of its own. */
function seated(...names: string[]): Roster {
  let roster: Roster = [];
  names.forEach((name, i) => {
    const admitted = admit(roster, join(name), `c${i}`, `token-${i}`, 'the host');
    if ('refusal' in admitted) throw new Error(admitted.refusal);
    roster = admitted.roster;
  });
  return roster;
}

describe("a session's roster", () => {
  it('admits a player by the id of its link, with the token it may come back by', () => {
    const admitted = admit([], join(' Ada '), 'c0', 'token-0', 'the host');
    expect(admitted).toEqual({
      roster: [{ id: 'c0', name: 'Ada', token: 'token-0', link: 'c0', awaySince: null }],
      member: { id: 'c0', name: 'Ada', token: 'token-0', link: 'c0', awaySince: null },
    });
  });

  it('refuses another major version, no name, and a name in use, the host’s included', () => {
    const roster = seated('Ada');
    expect(
      admit(roster, { ...join('Bo'), protocol: FIRST_PROTOCOL - 1 }, 'c1', 't', 'h'),
    ).toHaveProperty('refusal', expect.stringMatching(/version/));
    expect(admit(roster, join(' '), 'c1', 't', 'h')).toHaveProperty(
      'refusal',
      expect.stringMatching(/name/),
    );
    expect(admit(roster, join('ada'), 'c1', 't', 'h')).toHaveProperty(
      'refusal',
      expect.stringMatching(/already in this session/),
    );
    expect(admit(roster, join('The Host'), 'c1', 't', 'the host')).toHaveProperty(
      'refusal',
      expect.stringMatching(/already in this session/),
    );
  });

  it('gives a player back its id when it comes back on a new link with its token', () => {
    const away = lose(seated('Ada', 'Bo'), 'c0', 10);
    expect(present(away).map((m) => m.name)).toEqual(['Bo']);
    const back = admit(away, join('Ada', 'token-0'), 'c7', 'unused', 'the host');
    if ('refusal' in back) throw new Error(back.refusal);
    expect(back.member).toEqual({
      id: 'c0',
      name: 'Ada',
      token: 'token-0',
      link: 'c7',
      awaySince: null,
    });
    expect(present(back.roster).map((m) => m.id)).toEqual(['c0', 'c1']);
  });

  it('lets a player whose old link is still held come back over it, under its own name', () => {
    const roster = seated('Ada');
    const back = admit(roster, join('Ada', 'token-0'), 'c9', 'unused', 'the host');
    if ('refusal' in back) throw new Error(back.refusal);
    expect(back.roster).toHaveLength(1);
    expect(back.member.link).toBe('c9');
    expect(back.member.id).toBe('c0');
  });

  it('takes a token nobody holds for no token: a fresh player, under a name that is free', () => {
    const roster = seated('Ada');
    const stranger = admit(roster, join('Bo', 'forged'), 'c1', 'token-1', 'the host');
    expect(stranger).toHaveProperty('member', expect.objectContaining({ id: 'c1', name: 'Bo' }));
    // A forged token is no key to a name that is held.
    expect(admit(roster, join('Ada', 'forged'), 'c2', 't', 'the host')).toHaveProperty('refusal');
  });

  it("a token is its player's only: it doesn't open another's seat", () => {
    const roster = lose(seated('Ada', 'Bo'), 'c0', 0);
    const back = admit(roster, join('Bo', 'token-0'), 'c5', 'unused', 'the host');
    // It is Ada's token, and Bo's name is held by Bo.
    expect(back).toHaveProperty('refusal');
  });

  it('refuses a returning player whose name was taken while it was away', () => {
    let roster = lose(seated('Ada'), 'c0', 0);
    const other = admit(roster, join('Ada'), 'c1', 'token-1', 'the host');
    if ('refusal' in other) throw new Error(other.refusal);
    roster = other.roster;
    expect(admit(roster, join('Ada', 'token-0'), 'c2', 'unused', 'the host')).toHaveProperty(
      'refusal',
    );
  });

  it('never gives a new player the id of one away, whatever ids its lobby hands out', () => {
    const away = lose(seated('Ada'), 'c0', 0);
    // A lobby restarted counts from c0 again.
    const fresh = admit(away, join('Bo'), 'c0', 'token-b', 'the host');
    if ('refusal' in fresh) throw new Error(fresh.refusal);
    expect(new Set(fresh.roster.map((m) => m.id)).size).toBe(2);
    const back = admit(fresh.roster, join('Ada', 'token-0'), 'c3', 'unused', 'the host');
    if ('refusal' in back) throw new Error(back.refusal);
    expect(back.member.id).toBe('c0');
  });

  it('admits by a code where the host asks for one, and seats a player back by its token without it (#461)', () => {
    const roster = seated('Ada');
    const byCode = (j: Join, link: string) =>
      admit(roster, j, link, `token-${link}`, 'the host', '042917');
    expect(byCode(join('Bo'), 'c1')).toEqual({ refusal: CODE_NEEDED });
    expect(byCode({ ...join('Bo'), code: '111111' }, 'c1')).toEqual({ refusal: CODE_WRONG });
    expect(byCode({ ...join('Bo'), code: '042917' }, 'c1')).toHaveProperty(
      'member',
      expect.objectContaining({ id: 'c1', name: 'Bo' }),
    );
    // A token is a seat the host gave: its player comes back without the code, as when the host turned it on later.
    const away = lose(roster, 'c0', 10);
    const back = admit(away, join('Ada', 'token-0'), 'c4', 'unused', 'the host', '042917');
    expect(back).toHaveProperty('member', expect.objectContaining({ id: 'c0', link: 'c4' }));
    // A token nobody holds is no seat: it needs the code like any join.
    expect(admit(away, join('Cy', 'forged'), 'c5', 't', 'the host', '042917')).toEqual({
      refusal: CODE_NEEDED,
    });
    // Without a code asked for, a join is admitted as ever.
    expect(admit(roster, join('Bo'), 'c1', 't', 'the host', null)).toHaveProperty('member');
  });

  it('forgets a player that leaves, and one away past the window, and no other', () => {
    const roster = lose(lose(seated('Ada', 'Bo', 'Cy'), 'c0', 100), 'c1', 200);
    expect(expire(roster, 100 + RESUME_WINDOW - 1).map((m) => m.name)).toEqual(['Ada', 'Bo', 'Cy']);
    expect(expire(roster, 100 + RESUME_WINDOW).map((m) => m.name)).toEqual(['Bo', 'Cy']);
    expect(expire(roster, 200 + RESUME_WINDOW).map((m) => m.name)).toEqual(['Cy']);
    expect(leave(roster, 'c2').map((m) => m.name)).toEqual(['Ada', 'Bo']);
    // A player that left has no seat to come back to.
    const gone = leave(roster, 'c2');
    expect(admit(gone, join('Cy', 'token-2'), 'c8', 'token-8', 'the host')).toHaveProperty(
      'member',
      expect.objectContaining({ id: 'c8' }),
    );
    // A link the roster doesn't know changes nothing.
    expect(lose(roster, 'nobody', 5)).toEqual(roster);
    expect(leave(roster, 'nobody')).toEqual(roster);
  });
});
