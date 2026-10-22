import { describe, expect, it } from 'vitest';
import {
  type ClientResume,
  type HostSnapshot,
  SAVED_MAX_AGE,
  readClientResume,
  readHostSnapshot,
} from './snapshot.ts';

const snapshot: HostSnapshot = {
  version: 1,
  savedAt: 1000,
  session: 'Friday Jam',
  lobby: 'wss://example',
  reclaim: 'secret',
  player: 'Bo',
  roster: [{ id: 'c0', name: 'Ada', token: 'token-0' }],
  players: { host: 'Bo', c0: 'Ada' },
  track: { energy: { from: 0.5, to: 0.5, at: 0, over: 0 } } as never,
  wish: { tonic: null, mode: 'aeolian', melodic: null },
  tempoNudge: 0.1,
  meter: { cycle: 10, heights: [0, 2, 4, 6, 8] },
  swing: {
    level: '8n',
    share: { from: 0.5, to: 2 / 3, start: 16, length: 128, slope: 0, brake: 0 },
  },
};

const resume: ClientResume = {
  version: 1,
  savedAt: 1000,
  session: 'Friday Jam',
  name: 'Ada',
  token: 'token-0',
  lobby: 'wss://example',
};

describe('what a host keeps to come back from a reload', () => {
  it('reads what it wrote, through JSON', () => {
    expect(readHostSnapshot(JSON.parse(JSON.stringify(snapshot)), 1001)).toEqual(snapshot);
  });

  it('reads one saved before it kept a meter, which asks for none (#305)', () => {
    const older = { ...snapshot, meter: undefined };
    expect(readHostSnapshot(JSON.parse(JSON.stringify(older)), 1001)).toEqual(older);
  });

  it('reads one that asks for no meter, whose composer asks the repository (#375)', () => {
    const none = { ...snapshot, meter: null };
    expect(readHostSnapshot(JSON.parse(JSON.stringify(none)), 1001)).toEqual(none);
  });

  it('reads one saved before the meter held the swing, which plays straight (#360)', () => {
    const older = { ...snapshot, swing: undefined };
    expect(readHostSnapshot(JSON.parse(JSON.stringify(older)), 1001)).toEqual(older);
  });

  it('reads one with a station on the air, and one saved before there was one, with the radio off (#313)', () => {
    const on = { ...snapshot, station: { seed: 12, walked: 5 } };
    expect(readHostSnapshot(JSON.parse(JSON.stringify(on)), 1001)).toEqual(on);
    const older = { ...snapshot, station: undefined };
    expect(readHostSnapshot(JSON.parse(JSON.stringify(older)), 1001)).toEqual(older);
  });

  it('reads one that admits by a code, one open, and one saved before there were codes, open (#461)', () => {
    for (const code of ['042917', null, undefined]) {
      const kept = { ...snapshot, code };
      expect(readHostSnapshot(JSON.parse(JSON.stringify(kept)), 1001), String(code)).toEqual(kept);
    }
    for (const code of [42917, '', ' ', {}])
      expect(readHostSnapshot({ ...snapshot, code }, 1001), JSON.stringify(code)).toBeNull();
  });

  it('reads no station that is not a seed and a count of sections (#313)', () => {
    for (const station of [
      null,
      3,
      {},
      { seed: 1 },
      { seed: 1, walked: -2 },
      { seed: 1.5, walked: 0 },
    ])
      expect(readHostSnapshot({ ...snapshot, station }, 1001), JSON.stringify(station)).toBeNull();
  });

  it('reads no swing that is not a level and a glide (#360)', () => {
    const glide = snapshot.swing!.share;
    for (const swing of [
      0.5,
      { level: '4n', share: glide },
      { level: '8n', share: 0.6 },
      { level: '16n', share: { ...glide, to: null } },
    ])
      expect(readHostSnapshot({ ...snapshot, swing }, 1001), JSON.stringify(swing)).toBeNull();
  });

  it('reads nothing that is not one, or of another version, or too old', () => {
    for (const junk of [
      null,
      'x',
      {},
      { ...snapshot, version: 2 },
      { ...snapshot, savedAt: 'now' },
      { ...snapshot, session: 3 },
      { ...snapshot, session: ' ' },
      { ...snapshot, lobby: undefined },
      { ...snapshot, reclaim: 4 },
      { ...snapshot, player: null },
      { ...snapshot, roster: 'Ada' },
      { ...snapshot, roster: [{ id: 'c0', name: 'Ada' }] },
      { ...snapshot, roster: [null] },
      { ...snapshot, players: [] },
      { ...snapshot, players: { c0: 3 } },
      { ...snapshot, track: null },
      { ...snapshot, wish: null },
      { ...snapshot, tempoNudge: 'up' },
      { ...snapshot, tempoNudge: Number.NaN },
      { ...snapshot, meter: '5/4' },
      { ...snapshot, meter: { cycle: 0, heights: [0] } },
      { ...snapshot, meter: { cycle: 10, heights: [] } },
      { ...snapshot, meter: { cycle: 10, heights: [2, 4] } },
      { ...snapshot, meter: { cycle: 10, heights: [0, 4, 4] } },
      { ...snapshot, meter: { cycle: 10, heights: [0, 10] } },
      { ...snapshot, meter: { cycle: 10, heights: [0, 2.5] } },
    ])
      expect(readHostSnapshot(junk, 1001), JSON.stringify(junk)).toBeNull();
    expect(readHostSnapshot(snapshot, 1000 + SAVED_MAX_AGE)).toEqual(snapshot);
    expect(readHostSnapshot(snapshot, 1000 + SAVED_MAX_AGE + 1)).toBeNull();
    // A clock that ran backwards makes no snapshot from the future.
    expect(readHostSnapshot(snapshot, 500)).toBeNull();
  });

  it('may name the tabs of the browser, and no lobby server', () => {
    expect(readHostSnapshot({ ...snapshot, lobby: '' }, 1001)).toMatchObject({ lobby: '' });
    expect(readClientResume({ ...resume, lobby: '' }, 1001)).toMatchObject({ lobby: '' });
  });

  it('may hold no reclaim secret, where the lobby gave none', () => {
    expect(readHostSnapshot({ ...snapshot, reclaim: null }, 1001)).toMatchObject({ reclaim: null });
  });
});

describe('what a client keeps to come back from a closed app', () => {
  it('reads what it wrote, and nothing that is not one, or too old', () => {
    expect(readClientResume(JSON.parse(JSON.stringify(resume)), 1001)).toEqual(resume);
    for (const junk of [
      null,
      {},
      { ...resume, version: 0 },
      { ...resume, savedAt: null },
      { ...resume, session: '' },
      { ...resume, name: ' ' },
      { ...resume, token: 1 },
      { ...resume, lobby: undefined },
    ])
      expect(readClientResume(junk, 1001), JSON.stringify(junk)).toBeNull();
    expect(readClientResume(resume, 1000 + SAVED_MAX_AGE + 1)).toBeNull();
    expect(readClientResume(resume, 999)).toBeNull();
  });
});
