// E8 in docs/language.md: what does the composer write?
//
// Runs the prototype headless over E1's corpus (every preset and the tour,
// five seeds, 64 bars each) and counts the score's tokens: the Roman
// numerals in `harm`, and the pitch tokens in `bass` and `lead`. It bears on
// #7's decision (a), what a numeral's `b` and `#` count from, and on #9,
// where `b3` reads as the note B3 rather than a flat third.
//
//   node prototype/experiments/census.mjs [bars=64] [seeds=5]
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = new URL('../../', import.meta.url);
const { JSDOM } = createRequire(new URL('apps/web/package.json', root))('jsdom');
const html = readFileSync(new URL('prototype/jambot-prototype.html', root), 'utf8');
const BARS = +(process.argv[2] ?? 64);
const SEEDS = [...Array(+(process.argv[3] ?? 5))].map((_, i) => i + 1);

function load() {
  let api;
  new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(w) {
      w.__JAMBOT_TEST__ = (x) => (api = x);
      w.HTMLCanvasElement.prototype.getContext = () =>
        new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
    },
  });
  return api;
}

/** Every bar's score text over the corpus. */
function corpus(api) {
  const { S, PRESETS, composeBar, applyPreset } = api;
  const scenarios = [
    ...PRESETS.map((_, i) => ({ start: i })),
    {
      start: 0,
      switches: Object.fromEntries(PRESETS.slice(1).map((_, i) => [8 * (i + 1), i + 1])),
    },
  ];
  const texts = [];
  for (const scenario of scenarios)
    for (const seed of SEEDS) {
      Object.assign(S, {
        seed, plan: [], sectionsMade: 0, lastType: null, themes: {}, leadThemes: {},
        prevVoicing: null, prevLeadPitch: 69, leadMemory: null, tr: {}, curStep: 0,
        humanNotes: [], cs: { bass: { prev: 43 }, lead: { prev: 72 } }, over: {}, playing: false,
      });
      S.composed.clear();
      applyPreset(PRESETS[scenario.start]);
      S.playing = true;
      for (let bar = 0; bar < BARS; bar++) {
        S.curStep = bar * 16;
        if (scenario.switches?.[bar] != null) applyPreset(PRESETS[scenario.switches[bar]]);
        texts.push(composeBar(bar).ir);
      }
    }
  return texts;
}

/** The tokens of a mini-notation string, without weights, repeats and rests. */
const tokens = (seq) =>
  seq
    .split(/[\s<>[\],]+/)
    .filter(Boolean)
    .map((t) => t.replace(/@[\d.]+$/, '').replace(/\*\d+$/, ''))
    .filter((t) => t !== '~');

// The degrees (0 to 6) where each mode differs from major: a numeral there
// gains a `b` if `b` and `#` count from the parallel major.
const lowered = { major: [], mixolydian: [6], dorian: [2, 6], minor: [2, 5, 6] };
const degree = { i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6 };
const count = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

const texts = corpus(load());
const modes = new Map(), kinds = new Map(), pitch = new Map(), absolute = new Map();
let numerals = 0, altered = 0, secondaries = 0, wouldGainFlat = 0;
for (const text of texts) {
  const [, key, mode] = /key=(\S+?):(\w+)/.exec(text);
  count(modes, mode);
  const harm = /^harm "([^"]*)"/m.exec(text)?.[1] ?? '';
  for (const numeral of tokens(harm)) {
    numerals++;
    count(kinds, numeral);
    if (/^[b#]/.test(numeral)) altered++;
    if (numeral.includes('/')) secondaries++;
    else {
      const [, accidental, roman] = /^([b#]?)([ivIV]+)/.exec(numeral) ?? [];
      if (roman && !accidental && lowered[mode]?.includes(degree[roman.toLowerCase()]))
        wouldGainFlat++;
    }
  }
  for (const line of text.split('\n').filter((l) => /^(bass|lead) /.test(l))) {
    const part = line.split(' ')[0];
    for (const raw of tokens(/"([^"]*)"/.exec(line)?.[1] ?? '')) {
      const token = raw.replace(/:\d$/, '').replace(/^[\^v]+|[\^v]+$/g, '');
      const kind = /^[a-g][#b]?-?\d$/.test(token)
        ? 'absolute note'
        : /^b\d/.test(token)
          ? 'b-prefixed'
          : /^#\d/.test(token)
            ? '#-prefixed'
            : /^\d+$/.test(token)
              ? 'plain number'
              : 'other';
      count(pitch, kind);
      if (kind === 'absolute note') count(absolute, `${part} ${token} over ${harm} in ${key}:${mode}`);
    }
  }
}

console.log({
  bars: texts.length,
  modes: Object.fromEntries(modes),
  numerals,
  kinds: kinds.size,
  altered,
  secondaries,
  wouldGainFlat,
  pitchTokens: Object.fromEntries(pitch),
});
console.log('Absolute notes, with the chords of their bar:');
for (const [where, n] of [...absolute].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${where}`);
// The page's own timers keep jsdom alive.
process.exit(0);
