import { PRESETS, baseLengthOf, slotStepOn } from '@jambot/engine';
import { joinChord, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { describe, expect, it } from 'vitest';
import {
  BARS,
  PARTS,
  RUNS,
  type Run,
  characters,
  composedNotes,
  measureRun,
  report,
  runOf,
  table,
  textOf,
  timesCompared,
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

/** Every onset of a run, measured with its text edited, as far from the transport's as the farthest. */
const farthest = (r: Run, edit: (text: string) => string) =>
  measureRun(r, edit)
    .flatMap((m) => m.offsets)
    .reduce((a, o) => Math.max(a, Math.abs(o)), 0);

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
      expect(textOf(m.text)).toMatch(/^&bar meter\("(4\/4|3\/4|7\/8)"\) step=[\d.]+bpm\n/);
    }
  });

  it("plays every bar's drums, bass and comp as composed (step, pitch, written length, velocity), and reads back its harmony but in 4 bars", () => {
    for (const m of MEASURED)
      for (const part of ['drums', 'bass', 'comp'] as const)
        expect(m.mismatches[part], `${m.run.preset} ${m.run.meter} ${m.bar.bar} ${part}`).toEqual(
          [],
        );
    const equal = Object.fromEntries(
      PARTS.map((p) => [p, MEASURED.filter((m) => m.equal[p]).length]),
    );
    expect(equal).toEqual({ drums: 384, bass: 384, comp: 384, harmony: 380 });
    const notes = MEASURED.reduce((n, m) => n + m.played.notes.length, 0);
    expect(notes).toBe(MEASURED.reduce((n, m) => n + composedNotes(m.bar).length, 0));
    expect(notes).toBe(7478);
  });

  it('places every onset within 1 ms of the transport where the swing is 0: Synth-pop, Techno and Bossa nova, in every meter they run', () => {
    expect(
      PRESETS.filter((p) => timesCompared({ preset: p.name, meter: '4/4' })).map((p) => p.name),
    ).toEqual(['Synth-pop', 'Techno', 'Bossa nova']);
    const timed = TABLE.filter((row) => timesCompared(row));
    expect(timed.map((row) => `${row.preset} ${row.meter}`)).toEqual([
      'Synth-pop 4/4',
      'Techno 4/4',
      'Bossa nova 4/4',
      'Synth-pop 3/4',
      'Synth-pop 7/8',
      'Bossa nova 3/4',
      'Bossa nova 7/8',
    ]);
    for (const row of timed) {
      const notes = MEASURED.filter(
        (m) => m.run.preset === row.preset && m.run.meter === row.meter,
      ).reduce((n, m) => n + m.played.notes.length, 0);
      expect(row.timed, `${row.preset} ${row.meter}`).toBe(notes);
      expect(row.within1ms, `${row.preset} ${row.meter}`).toBe(notes);
    }
    expect(timed.reduce((n, row) => n + row.timed, 0)).toBe(4067);
    expect(Math.max(...timed.map((row) => row.largest))).toBeLessThan(1e-6);
    // The farthest is in 7/8, whose tempo cells writes to six decimals; in 4/4 and 3/4 it is rounding.
    for (const row of timed)
      expect(row.largest, `${row.preset} ${row.meter}`).toBeLessThan(
        row.meter === '7/8' ? 3e-7 : 1e-12,
      );
  });

  it('counts the characters of every part', () => {
    expect(characters(MEASURED)).toEqual({
      total: 281539,
      meter: 11872,
      key: 8640,
      harmony: 12921,
      drums: 139824,
      bass: 50061,
      comp: 40520,
      card: 17701,
    });
    const levels = MEASURED.reduce(
      (n, m) => n + (textOf(m.text).match(/:0:[.\d]+/g) ?? []).join('').length,
      0,
    );
    expect(levels).toBe(39242);
    expect(
      Object.fromEntries(TABLE.map((row) => [`${row.preset} ${row.meter}`, row.characters.total])),
    ).toEqual({
      'Synth-pop 4/4': 24345,
      'Techno 4/4': 25939,
      'Deep house 4/4': 24891,
      'Ambient 4/4': 15155,
      'Lo-fi hip hop 4/4': 24381,
      'Funk 4/4': 30824,
      'Bossa nova 4/4': 24149,
      'Swing jazz 4/4': 25011,
      'Synth-pop 3/4': 21891,
      'Synth-pop 7/8': 21789,
      'Bossa nova 3/4': 21254,
      'Bossa nova 7/8': 21910,
    });
  });

  it('taps the chords by the clock of their coarsest unit, and writes the rim as one Euclid on the bar in every meter, at one level a bar', () => {
    const clocks = new Set(
      MEASURED.map(
        (m) => `${m.run.meter} ${/^&harm over=&key step=(\S+)/m.exec(textOf(m.text))![1]}`,
      ),
    );
    // Only Swing jazz writes two chords in a bar (6 bars), so a chord on a half of 3/4 or 7/8 is not met.
    expect([...clocks].sort()).toEqual(['3/4 1m', '4/4 1m', '4/4 2n', '7/8 1m']);
    const rims = MEASURED.filter((m) => /^&euclid /m.test(textOf(m.text)));
    expect(rims).toHaveLength(90);
    for (const m of rims)
      expect(textOf(m.text)).toMatch(
        new RegExp(`^&euclid step=1m &rim\\([357],${stepsOf(m.bar.meter)},\\d+\\)$`, 'm'),
      );
    expect(rims.filter((m) => /&euclid \* \.\d+\]/.test(textOf(m.text)))).toHaveLength(90);
  });

  it('finds what it checks: a hit dropped, a bass note moved, a level changed, a chord respelled, or 7/8 at the band’s quarter tempo, is a difference', () => {
    const differs = (preset: string, meter: string, bar: number, from: RegExp, to: string) => {
      const m = at(preset, meter, bar);
      const text = textOf(m.text);
      const edited = text.replace(from, to);
      expect(edited, String(from)).not.toBe(text);
      const [again] = measureRun({ ...run(preset, meter), bars: [m.bar] }, (t) =>
        t.replace(from, to),
      );
      return PARTS.filter((p) => !again!.equal[p]);
    };
    expect(differs('Funk', '4/4', 23, /&hh:0:[.\d]+/, '~')).toEqual(['drums']);
    expect(differs('Synth-pop', '4/4', 0, /7@10 14@6/, '7@9 14@7')).toEqual(['bass']);
    expect(differs('Synth-pop', '4/4', 0, /level=\.18755/, 'level=.2')).toEqual(['comp']);
    expect(differs('Synth-pop', '4/4', 0, /\[0,2,4\]$/m, '[0,2#,4]')).toEqual(['harmony']);
    const seven = run('Synth-pop', '7/8');
    expect(farthest(seven, (t) => t)).toBeLessThan(1e-6);
    expect(farthest(seven, (t) => t.replace(/step=[\d.]+bpm/, 'step=108bpm'))).toBeGreaterThan(
      0.001,
    );
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
  it('gap 1, a line’s articulation: the bass and the stab sound a share of their written length, one number a line, and the text states the written length', () => {
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
    // Sounding its share, no note runs into its line's next onset, and 46 stabs (a share over 1) run past the bar line.
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
    // The witness: Techno's bar 0, its bass written 8 steps long and sounding 2.56; cells plays the 8.
    const w = at('Techno', '4/4', 0);
    const written = w.bar.written.find((n) => n.part === 'bass')!;
    expect([written.length, baseLengthOf(w.bar, written)]).toEqual([8, 2.5600000000000005]);
    expect(w.played.notes.find((n) => n.part === 'bass')!.length).toBe(8);
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

  it('gap 4, swing on the bar: the times of the 5 swung presets are not compared', () => {
    expect(TABLE.filter((row) => !timesCompared(row)).map((row) => row.preset)).toEqual([
      'Deep house',
      'Ambient',
      'Lo-fi hip hop',
      'Funk',
      'Swing jazz',
    ]);
  });
});
