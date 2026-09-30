/**
 * The identity of the band's bars (#260): a hash of every bar it writes and
 * plays, over the corpus of E15 (5 seeds, each of the eight presets held and
 * the tour through them, 64 bars each: 2,880 bars), recorded in
 * `identity.fixture.json`. It is the gate for putting the parts on a meter:
 * a rewrite that reads the bar's steps from its meter must change nothing in
 * 4/4, event for event, written and played, and this says where it does.
 *
 * A bar's hash is FNV-1a over its written notes and its dough, as JSON, so a
 * moved onset, another role, a velocity one louder or a note a step longer is
 * another hash. The fixture is recorded from the band as it stands
 * (`experiments/identity.ts --write`), and re-recorded only when the band's
 * output is meant to change, after a diff per run (`docs/memory/testing.md`).
 */

import { type BandCarried, band } from './band.ts';
import type { KeyWish } from './key.ts';
import { PRESETS, type Preset } from './style.ts';

export const IDENTITY_SEEDS = 5;
export const IDENTITY_BARS = 64;

/** FNV-1a over the UTF-16 units of a string: 8 hex digits. */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** What a bar plays, as a hash: its written notes and its dough. */
export function hashOf(bar: { readonly written: unknown; readonly dough: unknown }): string {
  return fnv1a(JSON.stringify({ written: bar.written, dough: bar.dough }));
}

/** A run of the corpus: one preset held, or the tour that changes it every 8 bars. */
export interface IdentityRun {
  readonly name: string;
  readonly presetAt: (bar: number) => Preset;
}

export const IDENTITY_RUNS: readonly IdentityRun[] = [
  ...PRESETS.map((preset) => ({ name: preset.name, presetAt: () => preset })),
  { name: 'tour', presetAt: (bar: number) => PRESETS[Math.floor(bar / 8) % PRESETS.length]! },
];

/** The key of a run in the fixture. */
export const runKey = (seed: number, run: string) => `${seed}:${run}`;

/** Every run's bars, hashed: 8 hex digits a bar, a run's 64 bars in one string. */
export function identityHashes(): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (let seed = 0; seed < IDENTITY_SEEDS; seed++)
    for (const run of IDENTITY_RUNS) {
      let carried: BandCarried = band.initial;
      let line = '';
      for (let bar = 0; bar < IDENTITY_BARS; bar++) {
        const preset = run.presetAt(bar);
        const { output, carried: after } = band.advance(
          {
            seed,
            bar,
            style: { ...preset.style, entropy: (bar % 32) / 32 },
            wish: { tonic: null, mode: preset.mode, melodic: null } as KeyWish,
            offer: null,
          },
          carried,
          null,
        );
        carried = after;
        line += hashOf(output);
      }
      hashes[runKey(seed, run.name)] = line;
    }
  return hashes;
}

/** Where two sets of hashes first differ, as a sentence, or null where they agree. */
export function firstDifference(
  actual: Readonly<Record<string, string>>,
  recorded: Readonly<Record<string, string>>,
): string | null {
  for (const key of new Set([...Object.keys(recorded), ...Object.keys(actual)])) {
    const now = actual[key];
    const then = recorded[key];
    if (now === undefined || then === undefined)
      return `${key} is ${now === undefined ? 'not run' : 'not recorded'}`;
    if (now === then) continue;
    for (let bar = 0; bar * 8 < Math.max(now.length, then.length); bar++)
      if (now.slice(bar * 8, bar * 8 + 8) !== then.slice(bar * 8, bar * 8 + 8))
        return `${key} differs from bar ${bar}`;
  }
  return null;
}
