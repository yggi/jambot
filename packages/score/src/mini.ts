/**
 * The part of the mini-notation a line of the score needs so far: a
 * sequence of words, each held for its weight (`@n`), dividing the bar.
 *
 * `"i VI"` is two words of a half bar each and `"i@3 VI"` three quarters
 * and one, as in Strudel's mini-notation (L4). A word starts on the step
 * its weights before it reach, so the weights must land every word on a
 * step. The written form is the canonical one: the smallest whole weights,
 * `@1` left out, so `"i@2 VI@2"` is written `"i VI"` (F3).
 *
 * Rests, groups, alternation, layers and Euclid come with the drum line
 * (#63 step 2b), and the whole against `@strudel/mini` in step 4.
 */

/** A word of a sequence and the step of the bar it starts on. */
export interface Placed {
  readonly word: string;
  readonly step: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * A sequence's text, from words in order of step, the first on step 0,
 * each held until the next starts and the last to the end of the bar.
 */
export function writeSequence(placed: readonly Placed[], steps: number): string {
  const problem = placedProblem(placed, steps);
  if (problem) throw new Error(`writeSequence: ${problem}`);
  const lengths = placed.map((p, i) => (placed[i + 1]?.step ?? steps) - p.step);
  const unit = lengths.reduce(gcd);
  return placed
    .map((p, i) => (lengths[i] === unit ? p.word : `${p.word}@${lengths[i]! / unit}`))
    .join(' ');
}

function placedProblem(placed: readonly Placed[], steps: number): string | undefined {
  if (placed.length === 0) return 'a sequence has at least one word';
  if (placed[0]!.step !== 0) return 'the first word starts on step 0';
  for (const [i, p] of placed.entries()) {
    if (!/^\S+$/u.test(p.word) || p.word.includes('@')) return `"${p.word}" is not a word`;
    const next = placed[i + 1]?.step ?? steps;
    if (!(Number.isInteger(p.step) && p.step < next && next <= steps))
      return `the words' steps rise within the bar's ${steps}`;
  }
  return undefined;
}

/** A sequence's words and the steps they start on, or what is wrong with its text. */
export function readSequence(
  text: string,
  steps: number,
): { placed: Placed[] } | { problems: string[] } {
  const tokens = text.trim().split(/\s+/u).filter(Boolean);
  if (tokens.length === 0) return { problems: ['the sequence is empty'] };
  const problems: string[] = [];
  const read = tokens.map((token) => {
    const match = /^([^@]+)(?:@(\d+))?$/u.exec(token);
    const weight = match?.[2] === undefined ? 1 : Number(match[2]);
    if (!match || weight < 1) problems.push(`"${token}" is not a word with a whole weight`);
    return { word: match?.[1] ?? token, weight };
  });
  if (problems.length) return { problems };
  const total = read.reduce((sum, r) => sum + r.weight, 0);
  let before = 0;
  const placed = read.map(({ word, weight }) => {
    const step = (before * steps) / total;
    before += weight;
    return { word, step };
  });
  const off = placed.filter((p) => !Number.isInteger(p.step));
  if (off.length)
    return {
      problems: off.map((p) => `"${p.word}" starts between steps, at ${p.step.toFixed(2)}`),
    };
  return { placed };
}
