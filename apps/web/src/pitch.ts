/**
 * The pitch colours: a pitch class's hue round the wheel, C red, a twelfth
 * apart (cell-studio's `noteColour`, so both projects share one wheel). Colour
 * means pitch and nothing else: a note, a chord's root, the letters of a scale.
 * Saturation and lightness are the theme's (`--pitch-s`, `--pitch-l` in
 * `app.css`), so a colour reads on the light page and the dark one; an octave
 * away from the middle one mutes it, lighter above and darker below.
 */

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** A pitch class's hue in degrees: C 0, C♯ 30 … B 330. */
export const pitchHue = (pitchClass: number): number => mod(Math.round(pitchClass), 12) * 30;

/** How much an octave away from the middle one keeps of the colour: all of it there, less each octave off. */
export const octaveMute = (octave: number): number =>
  octave === 0 ? 1 : Math.max(0.3, 0.6 - 0.1 * (Math.abs(octave) - 1));

/** A pitch class's colour, as CSS, `octave` octaves from the middle one (at most three either way). */
export function pitchColour(pitchClass: number, octave = 0): string {
  const o = Math.max(-3, Math.min(3, Math.round(octave)));
  return `hsl(${pitchHue(pitchClass)} calc(var(--pitch-s) * ${octaveMute(o)}) clamp(18%, calc(var(--pitch-l) + ${o * 11}%), 88%))`;
}

/** A note spelled in its key, with its pitch class for its colour. */
export interface Spelled {
  /** As the screen writes it: `G♯`, `B♭`. */
  readonly name: string;
  readonly pitchClass: number;
}
