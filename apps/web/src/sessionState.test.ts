import { describe, expect, it } from 'vitest';
import { type Following, networkColours, sessionMain, sessionSub } from './sessionState.ts';

const following: Following = {
  status: 'joined',
  session: 'Garage',
  name: 'Bo',
  hostPlaying: true,
  hostAway: false,
  trip: 12,
  lacked: 0,
};
const nobody = { session: 'Garage', guests: [] };
const ada = { id: 'c0', name: 'Ada' };
const bo = { id: 'c1', name: 'Bo' };

describe('what the session card names', () => {
  it('names the session hosted or followed, and solo as solo', () => {
    expect(sessionMain('host', nobody, following)).toBe('Garage');
    expect(sessionMain('client', nobody, { ...following, session: 'Loft' })).toBe('Loft');
    expect(sessionMain('solo', nobody, following)).toBe('Solo');
  });

  it('names a session still being joined as one, before it is known which', () => {
    expect(sessionMain('client', nobody, { ...following, status: 'joining', session: null })).toBe(
      'A session',
    );
  });
});

describe('what the session card says of its state', () => {
  it('says a solo band plays on this device only', () => {
    expect(sessionSub('solo', nobody, following)).toBe('This device only');
  });

  it('counts those who joined a host', () => {
    expect(sessionSub('host', nobody, following)).toBe('Hosting · nobody has joined');
    expect(sessionSub('host', { ...nobody, guests: [ada] }, following)).toBe('Hosting · 1 joined');
    expect(sessionSub('host', { ...nobody, guests: [ada, bo] }, following)).toBe(
      'Hosting · 2 joined',
    );
  });

  it('says what a client’s link and its host are doing, the host away before the rest', () => {
    const sub = (more: Partial<Following>) =>
      sessionSub('client', nobody, { ...following, ...more });
    expect(sub({})).toBe('Following · host playing');
    expect(sub({ hostPlaying: false })).toBe('Following · host stopped');
    expect(sub({ hostAway: true })).toBe('Following · host away');
    expect(sub({ hostAway: true, hostPlaying: false })).toBe('Following · host away');
    expect(sub({ status: 'joining' })).toBe('Joining');
    expect(sub({ status: 'reconnecting' })).toBe('Reconnecting · playing on what it has');
  });
});

describe('the colours of the network', () => {
  const players = { host: 'Ada', c0: 'Bo', c1: 'Cy' };

  it('is one node, the first colour, alone', () => {
    expect(networkColours('solo', nobody, {}, null)).toEqual([0]);
  });

  it('is the host and each guest, each in its player’s colour', () => {
    expect(networkColours('host', nobody, players, 'host')).toEqual([0]);
    expect(networkColours('host', { ...nobody, guests: [ada, bo] }, players, 'host')).toEqual([
      0, 1, 2,
    ]);
  });

  it('is the host and the client itself, in its place among the players', () => {
    expect(networkColours('client', nobody, players, 'c1')).toEqual([0, 2]);
  });

  it('gives a player not yet in the record the next colour, and comes round after six', () => {
    expect(networkColours('host', { ...nobody, guests: [ada] }, {}, 'host')).toEqual([0, 1]);
    const many = Array.from({ length: 7 }, (_, i) => ({ id: `g${i}`, name: `G${i}` }));
    const colours = networkColours('host', { ...nobody, guests: many }, {}, 'host');
    expect(colours).toHaveLength(8);
    expect(Math.max(...colours)).toBeLessThan(6);
  });
});
