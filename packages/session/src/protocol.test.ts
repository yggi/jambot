import { describe, expect, it } from 'vitest';
import { PROTOCOL, readClientMessage, readHostMessage, refusal, sourceOf } from './protocol.ts';

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

  it('refuses a client of another version, and one without a name', () => {
    expect(refusal({ kind: 'join', protocol: PROTOCOL, name: 'Ada' })).toBeNull();
    expect(refusal({ kind: 'join', protocol: PROTOCOL + 1, name: 'Ada' })).toMatch(/version/);
    expect(refusal({ kind: 'join', protocol: PROTOCOL, name: '  ' })).toMatch(/name/);
  });

  it("names a client's note source by its player", () => {
    expect(sourceOf('Ada', 'the computer keys')).toBe("Ada's computer keys");
    expect(sourceOf('Ada', 'Launchkey MIDI 1')).toBe("Ada's Launchkey MIDI 1");
  });
});
