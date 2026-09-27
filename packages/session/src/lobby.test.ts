import { describe, expect, it } from 'vitest';
import { SESSION_NAME_MAX, nameRefusal, readFromLobby, readToLobby, sessionKey } from './lobby.ts';

describe("a lobby's words", () => {
  it('reads each request whole, and nothing else', () => {
    for (const request of [
      { op: 'list' },
      { op: 'host', session: 'jam' },
      { op: 'join', session: 'jam' },
      { op: 'send', message: { kind: 'stop' } },
      { op: 'send', to: 'c1', message: { kind: 'stop' } },
      { op: 'tell', message: { kind: 'forget' } },
    ])
      expect(readToLobby(request)).toEqual(request);
    for (const junk of [
      null,
      'list',
      { op: 'shout' },
      { op: 'host' },
      { op: 'join', session: 3 },
      { op: 'send' },
      { op: 'send', to: 4, message: { kind: 'stop' } },
      { op: 'tell', message: null },
    ])
      expect(readToLobby(junk)).toBeNull();
  });

  it('reads what a lobby says, and nothing else', () => {
    expect(readFromLobby({ op: 'gone' })).toEqual({ op: 'gone' });
    expect(readFromLobby({ op: 'list' })).toBeNull();
    expect(readFromLobby({})).toBeNull();
  });

  it('takes a name with something in it, and not too long, compared in any case', () => {
    expect(nameRefusal('Friday Jam')).toBeNull();
    expect(nameRefusal('   ')).toMatch(/needs a name/);
    expect(nameRefusal('x'.repeat(SESSION_NAME_MAX))).toBeNull();
    expect(nameRefusal('x'.repeat(SESSION_NAME_MAX + 1))).toMatch(/at most/);
    expect(sessionKey(' Friday JAM ')).toBe(sessionKey('friday jam'));
  });
});
