/**
 * Milestone 3 (`docs/briefs/analyzer.md`): one real file, end to end. Reads
 * a MIDI file's bytes off disk — the one Node-only step `packages/analyzer`
 * itself deliberately leaves out (#141) — and runs them through `parseSmf`
 * and `loadMidi`, printing a summary.
 *
 * Run: node --experimental-strip-types --no-warnings
 * packages/analyzer/experiments/load-file.ts <path-to-midi-file>
 */
import { readFileSync } from 'node:fs';
import { loadMidi, parseSmf } from '../src/index.ts';

const path = process.argv[2];
if (!path) {
  console.error('Usage: load-file.ts <path-to-midi-file>');
  process.exit(1);
}

const raw = parseSmf(readFileSync(path));
const result = loadMidi(raw);

console.log(`${raw.tracks.length} track(s), ${raw.ppq} ticks/quarter`);
console.log(
  `dropped ${result.droppedEmptyTracks} empty, ${result.droppedDuplicateTracks} duplicate`,
);
for (const role of result.roles)
  console.log(
    `  ${role.track.name ?? '(untitled)'} (channel ${role.track.channel}): ${role.role} — ${role.reason} (${role.confidence.toFixed(2)})`,
  );
console.log(
  `${result.sections.length} 4/4 section(s); other meters: ${JSON.stringify(result.otherMeters)}`,
);
console.log(`overall confidence: ${result.confidence.toFixed(3)}`);
for (const line of result.log) console.log(`- ${line}`);
