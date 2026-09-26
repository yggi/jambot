// E1 in docs/language.md: is a bar's score text self-contained?
//
// Runs the prototype headless and compiles every bar twice: warm, as it
// plays, with the compiler's history (each part's previous pitch, the
// previous chord voicing), and cold, from the same text with that history
// reset. It also compares the tempo the player uses at each step with the
// bpm= the bar writes.
//
//   node prototype/experiments/cold-warm.mjs [bars=64] [seeds=5]
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = new URL('../../', import.meta.url);
const { JSDOM } = createRequire(new URL('apps/web/package.json', root))('jsdom');
const html = readFileSync(new URL('prototype/jambot-prototype.html', root), 'utf8').replace(
  'window.__JAMBOT_TEST__({',
  'window.__JAMBOT_TEST__({compileBar,',
);
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

const exact = (e) =>
  `${e.part}|${e.sub ?? ''}|${e.step}|${e.off.toFixed(4)}|${e.note}|${e.vel}|${e.len.toFixed(4)}`;
const classes = (e) =>
  `${e.part}|${e.sub ?? ''}|${e.step}|${e.off.toFixed(4)}|${e.note % 12}|${e.vel}|${e.len.toFixed(4)}`;
const multiset = (evs, f) => evs.map(f).sort();
function missing(a, b) {
  // events of a that b lacks, as multisets
  const m = new Map();
  for (const x of b) m.set(x, (m.get(x) ?? 0) + 1);
  let n = 0;
  for (const x of a) m.get(x) ? m.set(x, m.get(x) - 1) : n++;
  return n;
}

function run(api, seed, scenario) {
  const { S, PRESETS, composeBar, applyPreset, compileBar, valAt } = api;
  Object.assign(S, {
    seed, plan: [], sectionsMade: 0, lastType: null, themes: {}, leadThemes: {},
    prevVoicing: null, prevLeadPitch: 69, leadMemory: null, tr: {}, curStep: 0,
    humanNotes: [], cs: { bass: { prev: 43 }, lead: { prev: 72 } }, over: {}, playing: false,
  });
  S.composed.clear();
  applyPreset(PRESETS[scenario.start]);
  S.playing = true;
  const rows = [];
  for (let bar = 0; bar < BARS; bar++) {
    S.curStep = bar * 16;
    if (scenario.switches?.[bar] != null) applyPreset(PRESETS[scenario.switches[bar]]);
    const bpms = [...Array(16)].map((_, s) => valAt('bpm', bar * 16 + s));
    const warm = composeBar(bar);
    const history = { cs: structuredClone(S.cs), pv: S.prevVoicing };
    S.cs = { bass: { prev: 43 }, lead: { prev: 72 } };
    S.prevVoicing = null;
    const cold = compileBar(warm.ir, bar);
    S.cs = history.cs;
    S.prevVoicing = history.pv;
    const w = multiset(warm.ev, exact), c = multiset(cold.ev, exact);
    const parts = new Set();
    for (const p of new Set(warm.ev.map((e) => e.part)))
      if (missing(w.filter((x) => x.startsWith(p + '|')), c) > 0) parts.add(p);
    const written = +/bpm=(\d+)/.exec(warm.ir)[1];
    const played = bpms.reduce((a, b) => a + 15 / b, 0);
    rows.push({
      events: warm.ev.length,
      differ: missing(w, c) + missing(c, w) > 0,
      differEvents: missing(w, c),
      parts,
      sameClasses: missing(multiset(warm.ev, classes), multiset(cold.ev, classes)) === 0 && warm.ev.length === cold.ev.length,
      nx: /"[^"]*\bnx\b/.test(warm.ir),
      harmAndKey: /^harm /m.test(warm.ir) && /key=/.test(warm.ir),
      coldErrors: cold.errs.length,
      bpmOff: Math.max(...bpms.map((b) => Math.abs(b - written))),
      driftMs: Math.abs(played - (16 * 15) / written) * 1000,
    });
  }
  return rows;
}

const api = load();
const scenarios = [
  ...api.PRESETS.map((p, i) => ({ name: p.name, start: i })),
  {
    name: 'Tour, a preset every 8 bars',
    start: 0,
    switches: Object.fromEntries(api.PRESETS.slice(1).map((_, i) => [8 * (i + 1), i + 1])),
  },
];
const table = {}, all = [];
for (const sc of scenarios) {
  const rows = SEEDS.flatMap((seed) => run(api, seed, sc));
  all.push(...rows);
  const count = (f) => rows.filter(f).length;
  table[sc.name] = {
    bars: rows.length,
    'bars differ': `${count((r) => r.differ)} (${Math.round((100 * count((r) => r.differ)) / rows.length)}%)`,
    'events differ': `${rows.reduce((a, r) => a + r.differEvents, 0)}/${rows.reduce((a, r) => a + r.events, 0)}`,
    bass: count((r) => r.parts.has('bass')),
    lead: count((r) => r.parts.has('lead')),
    chords: count((r) => r.parts.has('chords')),
    'nx bars': count((r) => r.nx),
    'max bpm off': Math.max(...rows.map((r) => r.bpmOff)).toFixed(1),
    'max drift ms': Math.max(...rows.map((r) => r.driftMs)).toFixed(0),
  };
}
console.table(table);
const differ = all.filter((r) => r.differ);
console.log({
  bars: all.length,
  differ: differ.length,
  differOnlyInOctaveOrVoicing: differ.filter((r) => r.sameClasses).length,
  usesNx: all.filter((r) => r.nx).length,
  writesHarmAndKey: all.filter((r) => r.harmAndKey).length,
  coldErrors: all.reduce((a, r) => a + r.coldErrors, 0),
});
// The page's own timers keep jsdom alive.
process.exit(0);
