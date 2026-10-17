import { PRESETS, baseLengthOf, leanMap, leansOf, slotStepOn, stepSeconds } from '@jambot/engine';
import { joinChord, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { describe, expect, it } from 'vitest';
import {
  BARS,
  PARTS,
  RUNS,
  type Note,
  type Run,
  barAsCells,
  characters,
  composedNotes,
  measureRun,
  report,
  runOf,
  shareText,
  swung,
  table,
  textOf,
} from './bar-in-cells.ts';
import { levelOf } from './drums-in-cells.ts';

const RUN_OF = new Map<string, Run>(RUNS.map((key) => [`${key.preset} ${key.meter}`, runOf(key)]));
const run = (preset: string, meter = '4/4') => RUN_OF.get(`${preset} ${meter}`)!;
const MEASURED = [...RUN_OF.values()].flatMap((r) => measureRun(r));
const TABLE = table(MEASURED);
if (process.env.E33_REPORT) {
  console.log(TABLE.map((row) => JSON.stringify(row)).join('\n'));
  console.log(JSON.stringify(characters(MEASURED)));
  console.log(report(MEASURED.find((m) => m.run.meter === '7/8')!));
}

const at = (preset: string, meter: string, bar: number) =>
  MEASURED.find((m) => m.run.preset === preset && m.run.meter === meter && m.bar.bar === bar)!;

/** Every onset of a run, measured with its text edited, as far from the transport's as the farthest; infinitely, where one meets no step of the band's. */
const farthest = (r: Run, edit: (text: string) => string) =>
  measureRun(r, edit).reduce(
    (a, m) =>
      m.offsets.length < m.played.notes.length
        ? Infinity
        : m.offsets.reduce((b, o) => Math.max(b, Math.abs(o)), a),
    0,
  );

describe('the band writes a whole bar as one cells text (E33)', () => {
  it('runs every preset in 4/4 and Synth-pop and Bossa nova in 3/4 and 7/8 through the transport: 12 runs of 32 bars, each bar in its meter, no step missed', () => {
    expect(RUNS).toHaveLength(12);
    expect(RUNS.filter((r) => r.meter === '4/4').map((r) => r.preset)).toEqual(
      PRESETS.map((p) => p.name),
    );
    for (const r of RUN_OF.values()) {
      expect(r.bars, `${r.preset} ${r.meter}`).toHaveLength(BARS);
      expect(r.missed, `${r.preset} ${r.meter}`).toBe(0);
      const steps = { '4/4': 16, '3/4': 12, '7/8': 14 }[r.meter as '4/4'];
      for (const bar of r.bars) expect(stepsOf(bar.meter), `${r.preset} ${r.meter}`).toBe(steps);
    }
    expect(MEASURED).toHaveLength(384);
  });

  it('compiles every bar with no diagnostics, every line on a tap of &bar', () => {
    for (const m of MEASURED) {
      expect(m.played.diagnostics, `${m.run.preset} ${m.run.meter} ${m.bar.bar}`).toEqual([]);
      for (const line of textOf(m.text).split('\n').slice(1))
        expect(line).not.toMatch(/step=(?!(16n|8n|8n\.|4n|4n\.|2n|2n\.|1m) )/);
      expect(textOf(m.text)).toMatch(
        /^&bar meter\("(4\/4|3\/4|7\/8)"\) step=[\d.]+bpm( swing=(8n|16n):[\d./]+)?\n/,
      );
    }
  });

  it('states each swung preset’s meter with its swing, as cells’ swung meter fragments do, and a straight one with none', () => {
    const meters = new Map(
      MEASURED.map((m) => [`${m.run.preset} ${m.run.meter}`, textOf(m.text).split('\n')[0]]),
    );
    expect(Object.fromEntries(meters)).toEqual({
      'Synth-pop 4/4': '&bar meter("4/4") step=108bpm',
      'Techno 4/4': '&bar meter("4/4") step=130bpm',
      'Deep house 4/4': '&bar meter("4/4") step=122bpm swing=16n:.6',
      'Ambient 4/4': '&bar meter("4/4") step=72bpm swing=16n:31/60',
      'Lo-fi hip hop 4/4': '&bar meter("4/4") step=84bpm swing=16n:.65',
      'Funk 4/4': '&bar meter("4/4") step=104bpm swing=16n:.6',
      'Bossa nova 4/4': '&bar meter("4/4") step=132bpm',
      'Swing jazz 4/4': '&bar meter("4/4") step=148bpm swing=8n:2/3',
      'Synth-pop 3/4': '&bar meter("3/4") step=108bpm',
      'Synth-pop 7/8': '&bar meter("7/8") step=108bpm',
      'Bossa nova 3/4': '&bar meter("3/4") step=132bpm',
      'Bossa nova 7/8': '&bar meter("7/8") step=132bpm',
    });
    // A share is the shorter of its shortest decimal and a fraction that is exactly it.
    expect([0.6, 31 / 60, 0.65, 2 / 3, 0.55].map(shareText)).toEqual([
      '.6',
      '31/60',
      '.65',
      '2/3',
      '.55',
    ]);
  });

  it("plays every bar's drums as composed (step, pitch, length, velocity), its bass and comp but for their lengths under swing (gap 1), and reads back its harmony but in 4 bars", () => {
    for (const m of MEASURED) {
      const where = `${m.run.preset} ${m.run.meter} ${m.bar.bar}`;
      expect(m.mismatches.drums, where).toEqual([]);
      // Where the bass or the comp differs, only a length does: every step, pitch and velocity is the band's.
      for (const part of ['bass', 'comp'] as const)
        for (const line of m.mismatches[part]) {
          const [band, cells] = line
            .split(', cells ')
            .map((x) => JSON.parse(x.replace(/^band /, '')) as Note);
          expect([cells!.part, cells!.note, cells!.velocity], where).toEqual([
            band!.part,
            band!.note,
            band!.velocity,
          ]);
          expect(Math.abs(cells!.step - band!.step), where).toBeLessThan(1e-6);
        }
    }
    const equal = Object.fromEntries(
      PARTS.map((p) => [p, MEASURED.filter((m) => m.equal[p]).length]),
    );
    expect(equal).toEqual({ drums: 384, bass: 256, comp: 336, harmony: 380 });
    const notes = MEASURED.reduce((n, m) => n + m.played.notes.length, 0);
    expect(notes).toBe(MEASURED.reduce((n, m) => n + composedNotes(m.bar).length, 0));
    expect(notes).toBe(7478);
  });

  it('places every onset within 1 ms of the transport, the 5 swung presets with their swing on &bar among them', () => {
    expect(
      PRESETS.filter((p) => swung({ preset: p.name, meter: '4/4' })).map((p) => p.name),
    ).toEqual(['Deep house', 'Ambient', 'Lo-fi hip hop', 'Funk', 'Swing jazz']);
    for (const row of TABLE) {
      const notes = MEASURED.filter(
        (m) => m.run.preset === row.preset && m.run.meter === row.meter,
      ).reduce((n, m) => n + m.played.notes.length, 0);
      expect(row.timed, `${row.preset} ${row.meter}`).toBe(notes);
      expect(row.within1ms, `${row.preset} ${row.meter}`).toBe(notes);
    }
    expect(TABLE.reduce((n, row) => n + row.timed, 0)).toBe(7478);
    expect(TABLE.filter((row) => swung(row)).reduce((n, row) => n + row.timed, 0)).toBe(3411);
    // Both count the meter's beats (#367), and cells' swing places Jambot's (yggi/cells#18), so only rounding is left.
    for (const row of TABLE) expect(row.largest, `${row.preset} ${row.meter}`).toBeLessThan(1e-12);
  });

  it('counts the characters of every part', () => {
    expect(characters(MEASURED)).toEqual({
      total: 294616,
      meter: 13664,
      key: 8640,
      harmony: 12921,
      drums: 143841,
      bass: 54221,
      comp: 43628,
      card: 17701,
    });
    const levels = MEASURED.reduce(
      (n, m) => n + (textOf(m.text).match(/:0:[.\d]+/g) ?? []).join('').length,
      0,
    );
    expect(levels).toBe(41982);
    expect(
      Object.fromEntries(TABLE.map((row) => [`${row.preset} ${row.meter}`, row.characters.total])),
    ).toEqual({
      'Synth-pop 4/4': 25065,
      'Techno 4/4': 26555,
      'Deep house 4/4': 26027,
      'Ambient 4/4': 15667,
      'Lo-fi hip hop 4/4': 26594,
      'Funk 4/4': 35012,
      'Bossa nova 4/4': 24869,
      'Swing jazz 4/4': 26065,
      'Synth-pop 3/4': 22597,
      'Synth-pop 7/8': 22093,
      'Bossa nova 3/4': 21862,
      'Bossa nova 7/8': 22210,
    });
  });

  it('taps the chords by the clock of their coarsest unit, and writes the rim as one Euclid on the bar in every straight meter, at one level a bar', () => {
    const clocks = new Set(
      MEASURED.map(
        (m) => `${m.run.meter} ${/^&harm over=&key step=(\S+)/m.exec(textOf(m.text))![1]}`,
      ),
    );
    // Only Swing jazz writes two chords in a bar (6 bars), so a chord on a half of 3/4 or 7/8 is not met.
    expect([...clocks].sort()).toEqual(['3/4 1m', '4/4 1m', '4/4 2n', '7/8 1m']);
    const rims = MEASURED.filter((m) => /^&euclid step=1m /m.test(textOf(m.text)));
    expect(rims).toHaveLength(45);
    expect(rims.every((m) => !swung(m.run))).toBe(true);
    for (const m of rims)
      expect(textOf(m.text)).toMatch(
        new RegExp(`^&euclid step=1m &rim\\([357],${stepsOf(m.bar.meter)},\\d+\\)$`, 'm'),
      );
    expect(rims.filter((m) => /&euclid \* \.\d+\]/.test(textOf(m.text)))).toHaveLength(45);
  });

  it('finds what it checks: a hit dropped, a bass note moved, a level changed, a chord respelled, a share changed, 7/8 at its quarters a minute, or a swing left out or moved, is a difference', () => {
    const differs = (preset: string, meter: string, bar: number, from: RegExp, to: string) => {
      const m = at(preset, meter, bar);
      const text = textOf(m.text);
      const edited = text.replace(from, to);
      expect(edited, String(from)).not.toBe(text);
      const [again] = measureRun({ ...run(preset, meter), bars: [m.bar] }, (t) =>
        t.replace(from, to),
      );
      return PARTS.filter((p) => m.equal[p] && !again!.equal[p]);
    };
    expect(differs('Funk', '4/4', 23, /&hh:0:[.\d]+/, '~')).toEqual(['drums']);
    expect(differs('Synth-pop', '4/4', 0, /7@10 14@6/, '7@9 14@7')).toEqual(['bass']);
    expect(differs('Synth-pop', '4/4', 0, /level=\.18755/, 'level=.2')).toEqual(['comp']);
    expect(differs('Synth-pop', '4/4', 0, /\[0,2,4\]$/m, '[0,2#,4]')).toEqual(['harmony']);
    expect(differs('Synth-pop', '4/4', 0, /legato=\.635/, 'legato=.64')).toEqual(['bass']);
    expect(differs('Synth-pop', '4/4', 0, / legato=\.635/, '')).toEqual(['bass']);
    const lofi = run('Lo-fi hip hop');
    expect(farthest(lofi, (t) => t)).toBeLessThan(1e-12);
    expect(farthest(lofi, (t) => t.replace(/ swing=\S+/, ''))).toBeGreaterThan(0.001);
    expect(farthest(lofi, (t) => t.replace('swing=16n:.65', 'swing=16n:.64'))).toBeGreaterThan(
      0.001,
    );
    expect(farthest(lofi, (t) => t.replace('swing=16n:.65', 'swing=8n:.65'))).toBeGreaterThan(
      0.001,
    );
    const seven = run('Synth-pop', '7/8');
    expect(seven.bars[0]!.style.bpm).toBe(108);
    expect(farthest(seven, (t) => t)).toBeLessThan(1e-12);
    // 108 beats of 7/8 a minute are 126 quarters: a text that counted quarters would be off.
    expect(
      farthest(seven, (t) =>
        t.replace(/step=([\d.]+)bpm/, (_, bpm) => `step=${(Number(bpm) * 7) / 6}bpm`),
      ),
    ).toBeGreaterThan(0.001);
    expect(
      farthest(seven, (t) =>
        t.replace(/step=([\d.]+)bpm/, (_, bpm) => `step=${Number(bpm) + 0.01}bpm`),
      ),
    ).toBeGreaterThan(0.001);
  });
});

describe('the forms it relies on, over every case', () => {
  it('strikes every velocity, 1 to 127, as a gate’s level, one gain or a line of levels', () => {
    const velocities = Array.from({ length: 127 }, (_, i) => i + 1);
    const play = (text: string) => {
      const plan = planOf(text);
      const route = router(plan.result, channelTable(plan.result));
      return windowAt(plan, 0, 127 * 0.125).events.flatMap((e) =>
        routesOf(route(e)).flatMap((r) => midiNote(e, r)?.velocity ?? []),
      );
    };
    const scaffold = (line: string, level: string) =>
      [
        '&bar meter("4/4") step=120bpm',
        line,
        `&bassOut play=&bass level=${level} &bassV`,
        '&bassV loop=C1',
        '&out map=midi ~ &bassOut',
      ].join('\n');
    expect(
      play(
        scaffold(
          `&bass step=16n ${velocities.map(() => '0').join(' ')}\n&bassLevel map=amp step=16n ${velocities.map(levelOf).join(' ')}`,
          '&bassLevel',
        ),
      ),
    ).toEqual(velocities);
    for (const v of velocities)
      expect(play(scaffold('&bass step=16n 0', levelOf(v)))[0], `${v}`).toBe(v);
  });
});

describe('what cells could not say (E33: the gaps)', () => {
  it('gap 1, a line’s articulation under swing: `legato=` states each line’s share, and every bass, pad and stab note sounds the band’s length within 1e-6 steps where the meter is straight; under swing, 572 bass and stab notes part', () => {
    const shares = new Map<string, Set<string>>();
    let gated = 0;
    let all = 0;
    for (const m of MEASURED)
      for (const w of m.bar.written) {
        if (w.part === 'lead' || w.part === 'drums') continue;
        all++;
        const share = baseLengthOf(m.bar, w) / w.length;
        if (Math.abs(share - 1) > 1e-9) gated++;
        const k = `${m.run.preset} ${m.run.meter} ${w.part}`;
        shares.set(k, (shares.get(k) ?? new Set()).add(share.toFixed(4)));
      }
    expect({ gated, all }).toEqual({ gated: 2242, all: 2979 });
    // Sounding its share, no note runs into its line's next onset, and 46 stabs (a share over 1) run past the bar line, whole in cells too.
    let into = 0;
    let past = 0;
    for (const m of MEASURED)
      for (const part of ['bass', 'pad', 'stab'] as const) {
        const notes = m.bar.written.filter((w) => w.part === part);
        for (const n of notes) {
          const end = n.step + baseLengthOf(m.bar, n);
          const next = notes.map((o) => o.step).filter((s) => s > n.step);
          if (next.length && end > Math.min(...next) + 1e-9) into++;
          if (end > stepsOf(m.bar.meter) + 1e-9) past++;
        }
      }
    expect({ into, past }).toEqual({ into: 0, past: 46 });
    // One share a line in every run, the same in every meter: the pad's 1, and each preset's bass and stab below.
    for (const [k, s] of shares) expect(s.size, k).toBe(1);
    const share = (k: string) => [...(shares.get(k) ?? ['-'])][0];
    expect(
      Object.fromEntries(
        PRESETS.map((p) => [
          p.name,
          ['bass', 'stab', 'pad'].map((part) => share(`${p.name} 4/4 ${part}`)),
        ]),
      ),
    ).toEqual({
      'Synth-pop': ['0.6350', '1.3725', '1.0000'],
      Techno: ['0.3200', '0.4500', '-'],
      'Deep house': ['0.5650', '1.1675', '1.0000'],
      Ambient: ['1.0000', '-', '1.0000'],
      'Lo-fi hip hop': ['0.7750', '1.7825', '1.0000'],
      Funk: ['0.4250', '0.7575', '-'],
      'Bossa nova': ['0.7050', '1.5775', '1.0000'],
      'Swing jazz': ['0.8100', '1.8850', '1.0000'],
    });
    for (const preset of ['Synth-pop', 'Bossa nova'])
      for (const meter of ['3/4', '7/8'])
        for (const part of ['bass', 'stab', 'pad'])
          expect(share(`${preset} ${meter} ${part}`)).toBe(share(`${preset} 4/4 ${part}`));
    // The bass and the stab tap the same level, 16n, at shares of their own, so a meter's legato by level can't carry both.
    const legatos = new Set(
      MEASURED.flatMap((m) =>
        [
          ...textOf(m.text).matchAll(/^&(bass|stab|pad) over=&key step=(\S+)(?: legato=(\S+))? /gm),
        ].map(([, part, tap, legato]) => `${m.run.preset} ${part} ${tap} ${legato ?? 1}`),
      ),
    );
    expect([...legatos].filter((l) => l.startsWith('Synth-pop ')).sort()).toEqual([
      'Synth-pop bass 16n .635',
      'Synth-pop pad 16n 1',
      'Synth-pop stab 16n 1.3725',
    ]);
    // The witness of the straight: Techno's bar 0, its bass written 8 steps long, sounding 2.56 in the band and in cells.
    const w = at('Techno', '4/4', 0);
    const written = w.bar.written.find((n) => n.part === 'bass')!;
    expect([written.length, baseLengthOf(w.bar, written)]).toEqual([8, 2.5600000000000005]);
    expect(textOf(w.text)).toMatch(/^&bass over=&key step=16n legato=\.32 /m);
    expect(w.played.notes.find((n) => n.part === 'bass')!.length).toBeCloseTo(2.56, 9);
    // Every length, by run: within 1e-6 steps (and 1 ms) where the meter is straight or the line sounds as written.
    const lengths = (preset: string) =>
      MEASURED.filter((m) => m.run.preset === preset).flatMap((m) => m.lengths);
    const off = (preset: string) => lengths(preset).filter((l) => Math.abs(l.steps) > 1e-6);
    expect(MEASURED.reduce((n, m) => n + m.lengths.length, 0)).toBe(2979);
    expect(
      Object.fromEntries(
        PRESETS.map((p) => [
          p.name,
          [
            lengths(p.name).length,
            off(p.name).length,
            [...new Set(off(p.name).map((l) => l.part))],
          ],
        ]),
      ),
    ).toEqual({
      'Synth-pop': [576, 0, []],
      Techno: [394, 0, []],
      'Deep house': [239, 209, ['bass', 'comp']],
      Ambient: [155, 0, []],
      'Lo-fi hip hop': [254, 158, ['bass', 'comp']],
      Funk: [413, 77, ['bass']],
      'Bossa nova': [648, 0, []],
      'Swing jazz': [300, 128, ['bass']],
    });
    for (const l of MEASURED.flatMap((m) => m.lengths))
      expect(Math.abs(l.steps) > 1e-6).toBe(Math.abs(l.seconds) > 0.001);
    const farthest = MEASURED.flatMap((m) => m.lengths).reduce(
      (a, l) => (Math.abs(l.seconds) > Math.abs(a.seconds) ? l : a),
      { part: 'bass', steps: 0, seconds: 0 },
    );
    expect([farthest.part, farthest.steps.toFixed(4), farthest.seconds.toFixed(4)]).toEqual([
      'comp',
      '0.4615',
      '0.0838',
    ]);
    // Why: cells sounds the share of a note's held time, Jambot the share of its written steps, then swung.
    // Funk's bar 0: its bass at step 10, written 3, sounds .425 of it. Jambot ends it at step 11.275, 1.42
    // steps' time after its onset (a pair of sixteenths is .6 and .4 of its time); cells .425 of the 3.2
    // steps' time it is held, 1.36, which ends it at step 11.2.
    const funk = at('Funk', '4/4', 0);
    const ten = funk.played.notes.find((n) => n.part === 'bass' && n.step === 10)!;
    expect(ten.length).toBeCloseTo(1.2, 9);
    const lean = leanMap(leansOf(funk.bar.swing), funk.bar.meter);
    expect(lean.played(13) - lean.played(10)).toBeCloseTo(3.2, 9);
    expect(lean.played(11.275) - lean.played(10)).toBeCloseTo(1.42, 9);
    expect(lean.written(lean.played(10) + 0.425 * 3.2) - 10).toBeCloseTo(1.2, 9);
  });

  it('gap 2, the chord in force: a line read over the harmony reads its braid of chords as turned, so past the chord sounding it plays the next chord, not the chord a lap up', () => {
    const text = [
      '&bar meter("4/4") step=120bpm',
      '&key scale(aeolian, A)',
      '&harm over=&key step=2n [0,2,4,6] [4,6#,8,10]',
      '&bass over=&harm step=16n 0 1 2 3 4 ~!11',
      '&bassV loop=C1',
      '&out map=midi ~ [&bass * &bassV]',
    ].join('\n');
    const plan = planOf(text);
    const route = router(plan.result, channelTable(plan.result));
    const notes = windowAt(plan, 0, 0.6).events.flatMap((e) =>
      routesOf(route(e)).flatMap((r) => midiNote(e, r)?.note ?? []),
    );
    // A1 C2 E2 G2 are Am7's tones from C1; its root a lap up is A2 (45), and cells plays E2, the next chord's root.
    expect(notes).toEqual([33, 36, 40, 43, 40]);
    // What such a form would carry: the notes of the bass, the pad and the stab that are tones of the chord sounding.
    const tones: Record<string, [number, number]> = {};
    for (const m of MEASURED)
      for (const w of m.bar.written) {
        if (w.part !== 'bass' && w.part !== 'pad' && w.part !== 'stab') continue;
        const chord = m.bar.chords.findLast((c) => slotStepOn(m.bar.meter, c.slot.step) <= w.step)!;
        const pitchClasses = new Set(joinChord(chord.chord).map((h) => ((h % 12) + 12) % 12));
        const t = (tones[w.part] ??= [0, 0]);
        t[1]++;
        if (pitchClasses.has(w.note % 12)) t[0]++;
      }
    expect(tones).toEqual({ bass: [868, 927], pad: [678, 678], stab: [1316, 1374] });
  });

  it("gap 3, a secondary's function (E32's gap 1): Swing jazz's V7/V and V9/V read back as II7 and II9", () => {
    const lost = MEASURED.filter((m) => !m.equal.harmony);
    expect(lost.map((m) => `${m.run.preset} ${m.run.meter} ${m.bar.bar}`)).toEqual([
      'Swing jazz 4/4 2',
      'Swing jazz 4/4 6',
      'Swing jazz 4/4 10',
      'Swing jazz 4/4 14',
    ]);
    expect(lost.map((m) => m.played.chords[1]!.numeral)).toEqual(['II9', 'II7', 'II9', 'II7']);
  });

  it('gap 4, a Euclid under swing: its hits are even parts of its step, which the swing doesn’t reach, so a swung rim is a line on 16n', () => {
    // Stated as one Euclid on 1m anyway, the swung rims (Lo-fi hip hop's 13 bars, Funk's 32) play their offbeats
    // straight: early by the swing, up to 54 ms (Lo-fi hip hop's sixteenths at .65 and 84 bpm).
    let bars = 0;
    let hits = 0;
    let offbeats = 0;
    let farthest = 0;
    for (const r of RUN_OF.values()) {
      if (!swung(r)) continue;
      for (const m of measureRun(
        r,
        (t) => t,
        (bar) => barAsCells(bar, true),
      )) {
        if (!/^&euclid step=1m /m.test(textOf(m.text))) continue;
        bars++;
        expect(m.mismatches.drums.length, `${r.preset} ${m.bar.bar}`).toBeGreaterThan(0);
        const lean = leanMap(leansOf(m.bar.swing), m.bar.meter);
        const step = stepSeconds(m.bar.style.bpm, m.bar.meter);
        for (const w of m.bar.written.filter((x) => x.role === 'euclid')) {
          const late = (lean.played(w.step) - w.step) * step;
          hits++;
          if (late > 1e-9) offbeats++;
          farthest = Math.max(farthest, late);
        }
      }
    }
    expect({ bars, hits, offbeats, farthest: farthest.toFixed(4) }).toEqual({
      bars: 45,
      hits: 275,
      offbeats: 137,
      farthest: '0.0536',
    });
  });
});
