/**
 * Records the identity of the band's bars (`src/identity.ts`, #260): the
 * hashes of every bar over E15's corpus, into `src/identity.fixture.json`.
 * Run on `main`, before a part is put on the meter, and again only when the
 * band's output is meant to change.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/identity.ts [--write]
 * Without `--write` it says where the band differs from the fixture.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { IDENTITY_BARS, IDENTITY_SEEDS, firstDifference, identityHashes } from '../src/identity.ts';

const FIXTURE = new URL('../src/identity.fixture.json', import.meta.url);
const hashes = identityHashes();

if (process.argv.includes('--write')) {
  writeFileSync(
    FIXTURE,
    JSON.stringify({ seeds: IDENTITY_SEEDS, bars: IDENTITY_BARS, hashes }, null, 2) + '\n',
  );
  console.log(`recorded ${Object.keys(hashes).length} runs of ${IDENTITY_BARS} bars`);
} else {
  const recorded = JSON.parse(readFileSync(FIXTURE, 'utf8')) as { hashes: Record<string, string> };
  console.log(firstDifference(hashes, recorded.hashes) ?? 'the band is as recorded');
}
