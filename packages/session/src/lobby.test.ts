import { describe, expect, it } from 'vitest';
import { SESSION_NAME_MAX, nameRefusal, readFromLobby, readToLobby, sessionKey } from './lobby.ts';

describe("a lobby's words", () => {
  it('reads each request whole, and nothing else', () => {
    for (const request of [
      { op: 'list' },
      { op: 'host', session: 'jam' },
      { op: 'host', session: 'jam', reclaim: 'secret' },
      { op: 'join', session: 'jam' },
      { op: 'send', message: { kind: 'stop' } },
      { op: 'send', to: 'c1', message: { kind: 'stop' } },
      { op: 'tell', message: { kind: 'forget' } },
      { op: 'end' },
    ])
      expect(readToLobby(request)).toEqual(request);
    for (const junk of [
      null,
      'list',
      { op: 'shout' },
      { op: 'host' },
      { op: 'host', session: 'jam', reclaim: 4 },
      { op: 'join', session: 3 },
      { op: 'send' },
      { op: 'send', to: 4, message: { kind: 'stop' } },
      { op: 'tell', message: null },
    ])
      expect(readToLobby(junk)).toBeNull();
  });

  it('reads what a lobby says, and nothing else', () => {
    for (const said of [{ op: 'gone' }, { op: 'away' }, { op: 'back' }])
      expect(readFromLobby(said)).toEqual(said);
    expect(readFromLobby({ op: 'list' })).toBeNull();
    expect(readFromLobby({})).toBeNull();
  });

  it('reads a list whose sessions say they are away by a boolean or not at all, and refuses one that says it otherwise (protocol 16)', () => {
    const listing = (away: unknown) => ({
      op: 'sessions',
      sessions: [
        { name: 'jam', players: 2, away },
        { name: 'reel', players: 1 },
      ],
    });
    for (const away of [true, false]) expect(readFromLobby(listing(away))).toEqual(listing(away));
    const without = { op: 'sessions', sessions: [{ name: 'reel', players: 1 }] };
    expect(readFromLobby(without)).toEqual(without);
    for (const away of ['yes', 1, null, {}]) expect(readFromLobby(listing(away))).toBeNull();
  });

  it('takes a name with something in it, and not too long, compared in any case', () => {
    expect(nameRefusal('Friday Jam')).toBeNull();
    expect(nameRefusal('   ')).toMatch(/needs a name/);
    expect(nameRefusal('x'.repeat(SESSION_NAME_MAX))).toBeNull();
    expect(nameRefusal('x'.repeat(SESSION_NAME_MAX + 1))).toMatch(/at most/);
    expect(sessionKey(' Friday JAM ')).toBe(sessionKey('friday jam'));
  });
});
