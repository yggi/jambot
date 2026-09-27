/** The twelve pitch classes' names, C = 0, spelled as the prototype spells them. */
export const TONIC_NAMES = [
  'C',
  'C♯',
  'D',
  'E♭',
  'E',
  'F',
  'F♯',
  'G',
  'A♭',
  'A',
  'B♭',
  'B',
] as const;

/** A key's notes, named in ascending order from the tonic, for a plain-text readout. */
export function scaleNoteNames(scale: readonly number[], tonic: number): readonly string[] {
  const from = scale.indexOf(tonic);
  const ordered = from < 0 ? scale : [...scale.slice(from), ...scale.slice(0, from)];
  return ordered.map((pitchClass) => TONIC_NAMES[pitchClass]!);
}
