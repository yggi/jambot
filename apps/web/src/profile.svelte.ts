/**
 * Who is playing: the name a person goes by, in a session and at its door.
 * One name for everything, kept in the browser, and a friendly one made up
 * for a person who hasn't given one, so a first visit can go straight on.
 * Storage may be missing or refuse (a private window): the name then lasts
 * as long as the page.
 */

export const NAME_KEY = 'jambot:name';

export const ADJECTIVES = [
  'Bright',
  'Brisk',
  'Calm',
  'Clever',
  'Cosmic',
  'Curious',
  'Dreamy',
  'Gentle',
  'Groovy',
  'Jolly',
  'Lively',
  'Mellow',
  'Nimble',
  'Quiet',
  'Sunny',
  'Swingy',
] as const;

export const ANIMALS = [
  'Badger',
  'Crane',
  'Finch',
  'Fox',
  'Heron',
  'Hare',
  'Lynx',
  'Magpie',
  'Otter',
  'Owl',
  'Panda',
  'Robin',
  'Seal',
  'Swan',
  'Wren',
  'Yak',
] as const;

/** A name to go by, made of a draw from `[0, 1)` for each of its two words. */
export function randomName(draw: () => number = Math.random): string {
  const adjective = ADJECTIVES[Math.floor(draw() * ADJECTIVES.length)]!;
  const animal = ANIMALS[Math.floor(draw() * ANIMALS.length)]!;
  return `${adjective} ${animal}`;
}

const stored = (): string | null => {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
};
const store = (name: string) => {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Nothing is lost but a name to retype.
  }
};

export class Profile {
  #name = $state('');
  #draw: () => number;

  constructor(draw: () => number = Math.random) {
    this.#draw = draw;
    const kept = stored()?.trim();
    this.#name = kept || randomName(draw);
    if (!kept) store(this.#name);
  }

  get name(): string {
    return this.#name;
  }

  set name(name: string) {
    this.#name = name;
    store(name);
  }

  /** The person left the field: a name left empty is made up again, so there is always one. */
  settle() {
    if (this.#name.trim() === '') this.name = randomName(this.#draw);
  }
}
