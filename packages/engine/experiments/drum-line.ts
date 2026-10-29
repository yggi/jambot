/**
 * E16: how the score's drum line writes a hit's role (#63 step 2b; L7, T4, F5)
 *
 * The drums write each hit as a sound on a step with its role in the groove
 * (`drums.ts`), and the performance reads the role for the hit's accent
 * (`performer.ts`), so the score's drum line has to carry it. Where two roles
 * land on one sound and step, the stronger stays, so a written role can hide
 * a weaker one. This runs the band over E1's shape (5 seeds, each preset held
 * and the tour, 64 bars each), collects every drum hit with its sound, step,
 * role, section type and whether its bar ends the section, and asks:
 *
 * 1. the census: how often each sound takes each role;
 * 2. what determines the role: of the keys sound; sound and step; sound, step
 *    and section type; and those and the section's last bar, how many hits
 *    fall on a key seen with more than one role;
 * 3. three forms of the line, in tokens per bar and in hits that need their
 *    role (or sound) written: (i) one line, each hit a sound with its role
 *    (`sd:ghost`); (ii) a sub-line per role, a hit's sound written only where
 *    the role takes more than one; (iii) a sub-line per sound, a hit's role
 *    written only where it is not the sound's most common. The counting rule:
 *    per line written (a line with no hits in the bar is left out), one token
 *    for its name, one per hit, and one per run of steps with no hit in it
 *    (`~@n`); a hit's attached role or sound is part of its token;
 * 4. of bars with euclid hits, how many are exactly one `even(k, 16, shift)`,
 *    so the line could write them as one Euclid token;
 * 5. the overlaps: in a section's last bar with a fill, which role the
 *    snare writes on the backbeat's steps, 4 and 12, by section type. The
 *    backbeat is the stronger, so where both land it hides the fill.
 *
 * Run: node --experimental-strip-types --no-warnings packages/engine/experiments/drum-line.ts
 */

import { even, positions } from '@jambot/theory';
import {
  presetMode,
  type BandCarried,
  DRUM_NOTES,
  DRUM_ROLES,
  type DrumRole,
  type DrumSound,
  type KeyWish,
  PROTOTYPE_PRESETS,
  SECTION_BARS,
  band,
  presetSwing,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const SEEDS = range(5);
const BARS = 64;
const runs: ((bar: number) => (typeof PROTOTYPE_PRESETS)[number])[] = [
  ...PROTOTYPE_PRESETS.map((preset) => () => preset),
  (bar) => PROTOTYPE_PRESETS[Math.floor(bar / 8) % PROTOTYPE_PRESETS.length]!,
];

const SOUND_OF = new Map(Object.entries(DRUM_NOTES).map(([s, n]) => [n as number, s as DrumSound]));

interface Hit {
  sound: DrumSound;
  role: DrumRole;
  step: number;
}
interface Bar {
  hits: Hit[];
  section: string;
  last: boolean;
}

const bars: Bar[] = [];
for (const seed of SEEDS)
  for (const presetAt of runs) {
    let carried: BandCarried = band.initial;
    for (const bar of range(BARS)) {
      const preset = presetAt(bar);
      const { output, carried: after } = band.advance(
        {
          seed,
          bar,
          style: { ...preset.style, entropy: (bar % 32) / 32 },
          // The level is asked a bar ahead: a section's plan takes it on the bar before (#360).
          swing: {
            level: presetSwing(presetAt(bar + 1))!.level,
            share: presetSwing(preset)!.share,
          },
          wish: { tonic: null, mode: presetMode(preset)!, melodic: null } as KeyWish,
          offer: null,
        },
        carried,
        null,
      );
      carried = after;
      const hits = output.written
        .filter((n) => n.part === 'drums')
        .map((n) => ({ sound: SOUND_OF.get(n.note)!, role: n.role!, step: n.step }));
      if (hits.length)
        bars.push({
          hits,
          section: output.plan.section.type,
          last: output.barInSection === SECTION_BARS - 1,
        });
    }
  }
const all = bars.flatMap((b) => b.hits.map((h) => ({ ...h, section: b.section, last: b.last })));

/** Counts by a key, each key's count by a second one. */
const nested = <A, B>(pairs: [A, B][]) => {
  const out = new Map<A, Map<B, number>>();
  for (const [a, b] of pairs) {
    const inner = out.get(a) ?? out.set(a, new Map()).get(a)!;
    inner.set(b, (inner.get(b) ?? 0) + 1);
  }
  return out;
};
const pct = (a: number, b: number) => `${a} of ${b} (${((100 * a) / b).toFixed(1)}%)`;
const sounds = Object.keys(DRUM_NOTES) as DrumSound[];

console.log(`E16 the drum line (5 seeds × 9 runs × 64 bars: ${bars.length} drum bars)\n`);
console.log('E16.1 the census: hits by sound (rows) and role (columns)');
const bySound = nested(all.map((h) => [h.sound, h.role]));
console.table(
  Object.fromEntries(
    sounds.map((s) => [
      s,
      Object.fromEntries(DRUM_ROLES.map((r) => [r, bySound.get(s)?.get(r) ?? 0])),
    ]),
  ),
);
const byRole = nested(all.map((h) => [h.role, h.sound]));
console.log('roles by sound:');
for (const s of sounds) console.log(`  ${s}: ${[...(bySound.get(s)?.keys() ?? [])].join(', ')}`);
console.log('sounds by role:');
for (const r of DRUM_ROLES) console.log(`  ${r}: ${[...(byRole.get(r)?.keys() ?? [])].join(', ')}`);

console.log('\nE16.2 what determines the role: hits on a key seen with more than one role');
const keys: [string, (h: (typeof all)[number]) => string][] = [
  ['sound', (h) => h.sound],
  ['sound, step', (h) => `${h.sound} ${h.step}`],
  ['sound, step, section', (h) => `${h.sound} ${h.step} ${h.section}`],
  ['sound, step, section, last bar', (h) => `${h.sound} ${h.step} ${h.section} ${h.last}`],
];
const ambiguity = Object.fromEntries(
  keys.map(([name, keyOf]) => {
    const roles = nested(all.map((h) => [keyOf(h), h.role]));
    const split = [...roles.values()].filter((r) => r.size > 1);
    const hits = split.reduce((a, r) => a + [...r.values()].reduce((x, y) => x + y, 0), 0);
    return [name, { hits: pct(hits, all.length), keys: `${split.length} of ${roles.size}` }];
  }),
);
console.table(ambiguity);
const smallest = Object.entries(ambiguity).find(([, v]) => v.hits.startsWith('0 '));
console.log(`the smallest key with no ambiguity: ${smallest?.[0] ?? 'none'}`);
const lastKey = nested(all.map((h) => [keys[3]![1](h), h.role]));
for (const [k, r] of lastKey)
  if (r.size > 1)
    console.log(`  still split: ${k}: ${[...r].map(([x, n]) => `${x} ${n}`).join(', ')}`);

console.log('\nE16.3 forms of the line');
/** Tokens for one line's hits: its name, a token per hit, one per run of empty steps. */
const lineTokens = (steps: number[]) => {
  const on = new Set(steps);
  let runsOfRest = 0;
  for (let s = 0; s < 16; s++) if (!on.has(s) && (s === 0 || on.has(s - 1))) runsOfRest++;
  return 1 + steps.length + runsOfRest;
};
const defaultRole = new Map(
  sounds.map((s) => [s, [...(bySound.get(s) ?? [])].sort((a, b) => b[1] - a[1])[0]?.[0]]),
);
const forms = {
  '(i) one line, sound:role': {
    lines: (b: Bar) => [b.hits],
    marked: () => true,
  },
  '(ii) a line per role': {
    lines: (b: Bar) => DRUM_ROLES.map((r) => b.hits.filter((h) => h.role === r)),
    marked: (h: Hit) => (byRole.get(h.role)?.size ?? 0) > 1,
  },
  '(iii) a line per sound': {
    lines: (b: Bar) => sounds.map((s) => b.hits.filter((h) => h.sound === s)),
    marked: (h: Hit) => h.role !== defaultRole.get(h.sound),
  },
};
console.table(
  Object.fromEntries(
    Object.entries(forms).map(([name, { lines, marked }]) => {
      const tokens = bars.map((b) =>
        lines(b)
          .filter((l) => l.length)
          .reduce((a, l) => a + lineTokens(l.map((h) => h.step)), 0),
      );
      return [
        name,
        {
          'tokens/bar mean': +(tokens.reduce((a, t) => a + t, 0) / bars.length).toFixed(2),
          'tokens/bar max': Math.max(...tokens),
          tokens: tokens.reduce((a, t) => a + t, 0),
          'hits marked': pct(all.filter(marked).length, all.length),
        },
      ];
    }),
  ),
);
console.log('marked: (i) the role on every hit; (ii) the sound; (iii) the role, off its default:');
for (const s of sounds) {
  const off = [...(bySound.get(s) ?? [])].filter(([r]) => r !== defaultRole.get(s));
  console.log(
    `  ${s} → ${defaultRole.get(s)}; off it: ${off.map(([r, n]) => `${r} ${n}`).join(', ') || 'none'}`,
  );
}

console.log('\nE16.4 euclid: bars whose euclid hits are one even(k, 16, shift)');
const euclidBars = bars.map((b) => b.hits.filter((h) => h.role === 'euclid').map((h) => h.step));
const withEuclid = euclidBars.filter((s) => s.length);
const shapes = nested(
  withEuclid.map((steps) => {
    const at = steps.join();
    const k = steps.length;
    const shift = range(16).find((sh) => positions(even(k, 16, sh)).join() === at);
    return [shift === undefined ? 'no even(k, 16, shift)' : `E(${k},16)`, shift ?? -1];
  }),
);
const exact = [...shapes].filter(([k]) => k.startsWith('E'));
console.log(
  pct(
    exact.reduce((a, [, s]) => a + [...s.values()].reduce((x, y) => x + y, 0), 0),
    withEuclid.length,
  ),
);
for (const [k, s] of shapes)
  console.log(
    `  ${k}: ${[...s]
      .sort((a, b) => a[0] - b[0])
      .map(([sh, n]) => `shift ${sh}: ${n}`)
      .join(', ')}`,
  );

console.log(
  '\nE16.5 overlaps: the snare on the backbeat steps, 4 and 12, in last bars with a fill',
);
const fillBars = bars.filter((b) => b.last && b.hits.some((h) => h.role === 'fill'));
const onBackbeat = (b: Bar, step: number) =>
  b.hits.find((h) => h.sound === 'snare' && h.step === step)?.role ?? 'none';
console.table(
  Object.fromEntries(
    [...new Set(fillBars.map((b) => b.section))].map((section) => {
      const these = fillBars.filter((b) => b.section === section);
      const cells = [4, 12].flatMap((step) =>
        [...nested(these.map((b) => [step, onBackbeat(b, step)]))].flatMap(([, v]) =>
          [...v].map(([role, n]) => [`step ${step} ${role}`, n]),
        ),
      );
      return [section, { bars: these.length, ...Object.fromEntries(cells) }];
    }),
  ),
);
const lastBars = nested(
  bars.filter((b) => b.last).map((b) => [b.section, b.hits.some((h) => h.role === 'fill')]),
);
console.log('last bars of a section, with a fill / without:');
for (const [k, v] of lastBars) console.log(`  ${k}: ${v.get(true) ?? 0} / ${v.get(false) ?? 0}`);
