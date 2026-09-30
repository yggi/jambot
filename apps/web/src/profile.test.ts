import { SESSION_NAME_MAX } from '@jambot/session';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ADJECTIVES,
  ANIMALS,
  NAME_KEY,
  PLACES,
  Profile,
  randomName,
  randomSessionName,
} from './profile.svelte.ts';

describe('a player’s name', () => {
  afterEach(() => localStorage.clear());

  it('is every adjective with every animal, each within a session’s name length, given a draw', () => {
    const seen = new Set<string>();
    for (let a = 0; a < ADJECTIVES.length; a++)
      for (let n = 0; n < ANIMALS.length; n++) {
        const draws = [(a + 0.5) / ADJECTIVES.length, (n + 0.5) / ANIMALS.length];
        const name = randomName(() => draws.shift()!);
        expect(name).toBe(`${ADJECTIVES[a]} ${ANIMALS[n]}`);
        expect(name.length).toBeLessThanOrEqual(SESSION_NAME_MAX);
        seen.add(name);
      }
    expect(seen.size).toBe(ADJECTIVES.length * ANIMALS.length);
  });

  it('keeps the edge of a draw inside the lists', () => {
    expect(randomName(() => 0)).toBe(`${ADJECTIVES[0]} ${ANIMALS[0]}`);
    expect(randomName(() => 0.9999999)).toBe(`${ADJECTIVES.at(-1)} ${ANIMALS.at(-1)}`);
  });

  it('starts as a random one, and keeps it, so a reload is the same player', () => {
    const first = new Profile(() => 0.3);
    expect(first.name).toBe(randomName(() => 0.3));
    expect(new Profile(() => 0.9).name).toBe(first.name);
  });

  it('keeps the name a person typed, and a name kept before this was written', () => {
    localStorage.setItem(NAME_KEY, 'Ada');
    const profile = new Profile();
    expect(profile.name).toBe('Ada');
    profile.name = 'Bo';
    expect(localStorage.getItem(NAME_KEY)).toBe('Bo');
    expect(new Profile().name).toBe('Bo');
  });

  it('gives a fresh random name when the person clears the field and leaves it', () => {
    const profile = new Profile(() => 0.5);
    profile.name = '   ';
    profile.settle();
    expect(profile.name).toBe(randomName(() => 0.5));
  });

  it('plays on where storage is refused', () => {
    const refused = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('no storage');
      },
      configurable: true,
    });
    try {
      const profile = new Profile(() => 0.5);
      profile.name = 'Ada';
      expect(profile.name).toBe('Ada');
    } finally {
      Object.defineProperty(window, 'localStorage', refused);
    }
  });
});

describe('a session’s made-up name', () => {
  it('is every adjective with every place, each within a session’s name length, given a draw', () => {
    const seen = new Set<string>();
    for (let a = 0; a < ADJECTIVES.length; a++)
      for (let n = 0; n < PLACES.length; n++) {
        const draws = [(a + 0.5) / ADJECTIVES.length, (n + 0.5) / PLACES.length];
        const name = randomSessionName(() => draws.shift()!);
        expect(name).toBe(`${ADJECTIVES[a]} ${PLACES[n]}`);
        expect(name.length).toBeLessThanOrEqual(SESSION_NAME_MAX);
        seen.add(name);
      }
    expect(seen.size).toBe(ADJECTIVES.length * PLACES.length);
  });

  it('keeps the edge of a draw inside the lists', () => {
    expect(randomSessionName(() => 0.9999999)).toBe(`${ADJECTIVES.at(-1)} ${PLACES.at(-1)}`);
  });
});

describe('regenerating a name', () => {
  afterEach(() => localStorage.clear());

  it('makes up another and keeps it', () => {
    const draws = [0, 0, 0.9999, 0.9999];
    const profile = new Profile(() => draws.shift()!);
    expect(profile.name).toBe(`${ADJECTIVES[0]} ${ANIMALS[0]}`);
    profile.regenerate();
    expect(profile.name).toBe(`${ADJECTIVES.at(-1)} ${ANIMALS.at(-1)}`);
    expect(localStorage.getItem(NAME_KEY)).toBe(profile.name);
  });
});
