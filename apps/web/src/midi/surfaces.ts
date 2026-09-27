/**
 * The playing surfaces that reach the Muse: a MIDI message, the computer
 * keys, and the on-screen keyboard's layout. Each is a pure function of its
 * input, so a keydown or a MIDI byte string can be tested without a real
 * keyboard or port.
 */

/** A note read off a raw MIDI message, or null for anything that isn't one. */
export interface ParsedNote {
  readonly on: boolean;
  readonly note: number;
  readonly velocity: number;
}

/** Note-on with velocity 0 counts as a note-off, as the spec allows. */
export function parseMidiMessage(data: ArrayLike<number>): ParsedNote | null {
  const status = data[0];
  const note = data[1];
  const velocity = data[2] ?? 0;
  if (status === undefined || note === undefined) return null;
  const command = status & 0xf0;
  if (command === 0x90 && velocity > 0) return { on: true, note, velocity };
  if (command === 0x80 || command === 0x90) return { on: false, note, velocity: 0 };
  return null;
}

/** a–l for the white keys, w e t y u o for the black ones, C4 to D5. */
export const COMPUTER_KEY_MAP: Readonly<Record<string, number>> = {
  a: 60,
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72,
  o: 73,
  l: 74,
};

/** Whether a keyboard event should be ignored: a repeat, a modifier chord, or typing into a field. */
export function ignoreKeyEvent(
  target: EventTarget | null,
  repeat: boolean,
  modifier: boolean,
): boolean {
  if (repeat || modifier) return true;
  const tag = target instanceof Element ? target.tagName : undefined;
  return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
}

export const KEYBOARD_LOW = 60;
export const KEYBOARD_HIGH = 76;

export const isBlackKey = (note: number): boolean => [1, 3, 6, 8, 10].includes(note % 12);

export interface KeyLayout {
  readonly note: number;
  readonly black: boolean;
  /** Percent from the left. */
  readonly left: number;
  /** Percent wide. */
  readonly width: number;
}

/** The on-screen keyboard's keys, `low` to `high`, as percent positions over the white keys' width. */
export function keyboardLayout(low = KEYBOARD_LOW, high = KEYBOARD_HIGH): readonly KeyLayout[] {
  const whites: number[] = [];
  for (let note = low; note <= high; note++) if (!isBlackKey(note)) whites.push(note);
  const width = 100 / whites.length;
  const layout: KeyLayout[] = [];
  for (let note = low; note <= high; note++) {
    if (!isBlackKey(note)) {
      layout.push({ note, black: false, left: whites.indexOf(note) * width, width });
    } else {
      const below = whites.indexOf(note - 1);
      layout.push({
        note,
        black: true,
        left: (below + 1) * width - width * 0.3,
        width: width * 0.6,
      });
    }
  }
  return layout;
}
