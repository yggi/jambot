/**
 * The family's feel contract's minor 1 (yggi/music-commons `contracts/feel`,
 * version 1, minor 1): the reading of a host's section text, which part and
 * drum role each of cells' events is, off the output cells names it by.
 * Jambot's reader is `lineOf` (`section-play.ts`); the vectors are the
 * engine's copy (`packages/engine/fixtures/contracts/feel.json`, its
 * `reading`), whose performer the engine's own contract test runs.
 *
 * Every reading runs. One Jambot doesn't meet is recorded below with its
 * reason, and its run then shows it still differs, so a record that has gone
 * stale fails as surely as a reading newly missed.
 */
import { describe, expect, it } from 'vitest';
import feelHub from '../../engine/fixtures/contracts/feel.json';
import { lineOf } from './section-play.ts';

interface Reading {
  readonly output: string;
  readonly reads: { readonly part: string; readonly role?: string } | null;
}
const feel = feelHub as unknown as {
  readonly contract: string;
  readonly version: number;
  readonly minor: number;
  readonly reading: readonly Reading[];
};

/** What `lineOf` reads an output as, in the contract's words: a part, and a drum's role. */
const read = (output: string) => {
  const { line, role } = lineOf(output);
  return line === 'drums' ? { part: line, role } : { part: line };
};

/**
 * The readings Jambot doesn't meet, each with why: the contract reads an
 * output that names no part of the feel's, or a drum role not among the
 * eight, as not the feel's (`null`), and `lineOf` reads every output as some
 * line. A host's text writes none of these (the contract, "A host's text …
 * writes none"), so no event Jambot plays meets one (#506).
 */
const RECORDED: Readonly<Record<string, string>> = {
  'kit:voices:shaker:12:1': 'lineOf reads any kit member as a drum, its role unchecked',
  'leadV:melo:9:1': 'lineOf reads any line a voice plays as a part, its name unchecked',
  'compV:compV:30:1': 'lineOf reads any line a voice plays as a part, its name unchecked',
  'drums:drums:14:1': 'lineOf reads the second field as the part, so the mix reads as the drums',
  bassV: 'lineOf reads an output with no line as a part named nothing',
};

describe('the feel contract’s reading (yggi/music-commons contracts/feel, version 1, minor 1)', () => {
  it('is the minor the engine’s copy holds: 12 outputs the feel’s, 5 not', () => {
    expect([feel.contract, feel.version, feel.minor]).toEqual(['feel', 1, 1]);
    expect(feel.reading).toHaveLength(17);
    expect(feel.reading.filter((r) => r.reads === null)).toHaveLength(5);
  });

  it('lineOf reads every output as the contract does, but those recorded, which still differ', () => {
    for (const { output, reads } of feel.reading) {
      if (output in RECORDED) expect(read(output), output).not.toEqual(reads);
      else expect(read(output), output).toEqual(reads);
    }
    expect(Object.keys(RECORDED).filter((o) => !feel.reading.some((r) => r.output === o))).toEqual(
      [],
    );
  });
});
