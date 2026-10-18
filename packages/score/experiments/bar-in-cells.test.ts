import { PRESETS, baseLengthOf, leanMap, leansOf, slotStepOn, stepSeconds } from '@jambot/engine';
import { joinChord, parseNumeral, stepsOf } from '@jambot/theory';
import { lowerNumeral } from '../src/score.ts';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { describe, expect, it } from 'vitest';
import {
  BARS,
  PARTS,
  RUNS,
  type Run,
  barAsCells,
  characters,
  composedNotes,
  indexOf,
  measureRun,
  report,
  runOf,
  shareText,
  statedChords,
  swung,
  table,
  textOf,
  throughChord,
} from './bar-in-cells.ts';
import { levelOf } from './drums-in-cells.ts';
import {
  chordTones,
  degreeText,
  everyNumeral,
  keyText,
  pinNote,
  pinTone,
} from './pitch-in-cells.ts';

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

  it("plays every bar's drums, bass and comp as composed (step, pitch, length, velocity), and reads back its harmony but in 4 bars", () => {
    for (const m of MEASURED) {
      const where = `${m.run.preset} ${m.run.meter} ${m.bar.bar}`;
      for (const part of ['drums', 'bass', 'comp'] as const)
        expect(m.mismatches[part], where).toEqual([]);
    }
    const equal = Object.fromEntries(
      PARTS.map((p) => [p, MEASURED.filter((m) => m.equal[p]).length]),
    );
    expect(equal).toEqual({ drums: 384, bass: 384, comp: 384, harmony: 380 });
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

  it('states the bass and the comp over the chord in force, `over=&harm`, in 781 of their 802 lines, 720 of them with whole indices alone (#387)', () => {
    const lines = MEASURED.flatMap((m) => m.text.pitched.map((p) => ({ m, p })));
    const over = (x: (typeof lines)[number]) => x.p.table;
    expect(lines).toHaveLength(802);
    expect(lines.filter((x) => over(x) === 'harm')).toHaveLength(781);
    expect(lines.filter((x) => over(x) === 'harm' && x.p.accidentals === 0)).toHaveLength(720);
    // Each line as the text has it: over the harmony, or over the key with the notes no index reaches.
    for (const m of MEASURED)
      for (const p of m.text.pitched) {
        expect(textOf(m.text)).toMatch(new RegExp(`^&${p.part} over=&${p.table} `, 'm'));
        expect(p.unreached.length > 0).toBe(p.table === 'key');
      }
    // 91 notes take an accidental on their index, a degree of the key beside a chord tone: the bass 33, the stab 58.
    const accidentals = (part: string) =>
      lines.filter((x) => x.p.part === part).reduce((n, x) => n + x.p.accidentals, 0);
    expect(['bass', 'pad', 'stab'].map(accidentals)).toEqual([33, 0, 58]);
    // The 21 lines over the key are Swing jazz's walking bass: 25 notes off the key, each a semitone from the root of
    // the chord that sounds next (the bar's next, or the next bar's first), and off the chord sounding. An accidental on
    // an index moves a degree of the key (cells decision 015), so no index into a chord names a step of the 12 that
    // none of its tones carries.
    const kept = lines.filter((x) => over(x) === 'key');
    expect(kept).toHaveLength(21);
    expect(new Set(kept.map((x) => `${x.m.run.preset} ${x.m.run.meter} ${x.p.part}`))).toEqual(
      new Set(['Swing jazz 4/4 bass']),
    );
    const swingJazz = run('Swing jazz');
    const approaches = kept.flatMap(({ m, p }) =>
      p.unreached.map((u) => {
        const next =
          m.bar.chords.find((c) => slotStepOn(m.bar.meter, c.slot.step) > u.step) ??
          swingJazz.bars[m.bar.bar + 1]!.chords[0]!;
        const root = joinChord(next.chord)[0]!;
        return {
          offKey: pinTone(m.bar.plan.key, u.note, 'bass').accidental !== 0,
          semitone: Math.abs(((u.note - root + 6 + 1200) % 12) - 6) === 1,
        };
      }),
    );
    expect(approaches).toHaveLength(25);
    expect(approaches.every((a) => a.offKey && a.semitone)).toBe(true);
    // Witness: Swing jazz's bar 0, Imaj9 in C, the bass's last note G♭2 (42) leading to IVmaj7's F; written over the key.
    const w = at('Swing jazz', '4/4', 0);
    expect(statedChords(w.bar)).toEqual([{ step: 0, numeral: 'Imaj9' }]);
    expect(w.text.pitched).toEqual([
      { part: 'bass', table: 'key', accidentals: 0, unreached: [{ step: 12, note: 42 }] },
    ]);
    expect(textOf(w.text)).toMatch(/^&harm over=&key step=1m \[0,2,4,6,8\]$/m);
    expect(textOf(w.text)).toMatch(/^&bass over=&key step=16n legato=\.81 7@4 11@4 11@4 11b@4$/m);
    // … and the next bar's, IVmaj7 `[3,5,7,9]`, its walk on the chord's tones (F2 E2 A2 C3), over it.
    expect(textOf(at('Swing jazz', '4/4', 1).text)).toMatch(
      /^&bass over=&harm step=16n legato=\.81 4@4 3@4 5@4 6@4$/m,
    );
  });

  it('counts the characters of every part, the bass and the comp over the chord in force 716 more than over the key (#387)', () => {
    expect(characters(MEASURED)).toEqual({
      total: 295332,
      meter: 13664,
      key: 8640,
      harmony: 12921,
      drums: 143841,
      bass: 54278,
      comp: 44287,
      card: 17701,
    });
    // The same bars with the bass and the comp over the key, as E33 stated them before cells v0.5.0: the harmony
    // stated again in the comp, and 716 characters fewer (54,221 + 43,628 + 12,921 = 110,770 against 111,486).
    const overKey = [...RUN_OF.values()].flatMap((r) =>
      r.bars.map((bar) => ({ text: barAsCells(bar, { table: 'key' }) })),
    );
    expect(characters(overKey)).toMatchObject({
      total: 294616,
      harmony: 12921,
      bass: 54221,
      comp: 43628,
    });
    const levels = MEASURED.reduce(
      (n, m) => n + (textOf(m.text).match(/:0:[.\d]+/g) ?? []).join('').length,
      0,
    );
    expect(levels).toBe(41982);
    expect(
      Object.fromEntries(TABLE.map((row) => [`${row.preset} ${row.meter}`, row.characters.total])),
    ).toEqual({
      'Synth-pop 4/4': 25150,
      'Techno 4/4': 26619,
      'Deep house 4/4': 26068,
      'Ambient 4/4': 15672,
      'Lo-fi hip hop 4/4': 26732,
      'Funk 4/4': 35087,
      'Bossa nova 4/4': 24930,
      'Swing jazz 4/4': 26102,
      'Synth-pop 3/4': 22671,
      'Synth-pop 7/8': 22148,
      'Bossa nova 3/4': 21907,
      'Bossa nova 7/8': 22246,
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

  it('finds what it checks: a hit dropped, a bass note moved, a level changed, a chord respelled (and the comp with it), a line read over the key, a share changed, 7/8 at its quarters a minute, or a swing left out or moved, is a difference', () => {
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
    expect(differs('Synth-pop', '4/4', 0, /3@10 6@6/, '3@9 6@7')).toEqual(['bass']);
    expect(differs('Synth-pop', '4/4', 0, /level=\.18755/, 'level=.2')).toEqual(['comp']);
    // The chord is stated once: respelled, the comp that reads it moves with it (the bass plays its root, a lap up).
    expect(differs('Synth-pop', '4/4', 0, /\[0,2,4\]$/m, '[0,2#,4]')).toEqual(['comp', 'harmony']);
    expect(differs('Synth-pop', '4/4', 0, /^&pad over=&harm/m, '&pad over=&key')).toEqual(['comp']);
    expect(differs('Synth-pop', '4/4', 0, /^&bass over=&harm/m, '&bass over=&key')).toEqual([
      'bass',
    ]);
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

describe('the chord in force as E33 reads it, over every case (#387)', () => {
  it('plays what `throughChord` says over every chord of the composer’s four modes: 228 a key, indices from below the root to past a lap, none, a sharp or a flat, 43,776 notes', () => {
    // A stack of degrees is the same in every tonic, so A in each mode is every case; the tonic only adds itself.
    const alters = [0, 1, -1];
    let notes = 0;
    for (const mode of ['ionian', 'dorian', 'mixolydian', 'aeolian'] as const) {
      const key = { tonic: 9, mode };
      const chords = everyNumeral(key).map((n) => chordTones(key, lowerNumeral(key, n)));
      expect(chords).toHaveLength(228);
      // each bar a chord, and 16 indices into it from −(its tones), on three lines: no accidental, `#`, `b`
      const index = (c: (typeof chords)[number], k: number) => k - c.length;
      const text = [
        '&bar meter("4/4") step=120bpm',
        `&key ${keyText(key)}`,
        `&harm over=&key step=1m ${chords.map((c) => `[${c.map((t) => degreeText(t.degree, t.accidental)).join(',')}]`).join(' ')}`,
        ...alters.map(
          (alter, i) =>
            `&i${i} over=&harm step=16n ${chords.flatMap((c) => Array.from({ length: 16 }, (_, k) => degreeText(index(c, k), alter))).join(' ')}`,
        ),
        '&bassV loop=C1',
        `&out map=midi ~ ${alters.map((_, i) => `[&i${i} * &bassV]`).join(' ')}`,
      ].join('\n');
      const plan = planOf(text);
      expect(plan.result.diagnostics.map((d) => d.message)).toEqual([]);
      const route = router(plan.result, channelTable(plan.result));
      const played = windowAt(plan, 0, chords.length * 2)
        .events.flatMap((e) =>
          routesOf(route(e)).flatMap((r) => {
            const n = midiNote(e, r);
            return n ? [`${n.channel} ${Math.round(n.at / 0.125)} ${n.note}`] : [];
          }),
        )
        .sort();
      const said = chords
        .flatMap((c, bar) =>
          alters.flatMap((alter, i) =>
            Array.from({ length: 16 }, (_, k) => {
              const tone = throughChord(key, c, { n: index(c, k), alter });
              return `${i + 2} ${bar * 16 + k} ${pinNote(key, tone, 'bass')}`;
            }),
          ),
        )
        .sort();
      expect(played, mode).toEqual(said);
      notes += said.length;
    }
    expect(notes).toBe(4 * 228 * 3 * 16);
  });
});

describe('what cells could not say (E33: the gaps)', () => {
  it('gap 1, a line’s articulation under swing, closed in cells v0.6.0 (yggi/cells#120): `legato=` states each line’s share, and every bass, pad and stab note sounds the band’s length within 1e-6 steps, swung or straight', () => {
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
          ...textOf(m.text).matchAll(/^&(bass|stab|pad) over=&\w+ step=(\S+)(?: legato=(\S+))? /gm),
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
    expect(textOf(w.text)).toMatch(/^&bass over=&harm step=16n legato=\.32 /m);
    expect(w.played.notes.find((n) => n.part === 'bass')!.length).toBeCloseTo(2.56, 9);
    // Every length, by run: within 1e-6 steps (and 1 ms), in every meter and every swing.
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
      'Deep house': [239, 0, []],
      Ambient: [155, 0, []],
      'Lo-fi hip hop': [254, 0, []],
      Funk: [413, 0, []],
      'Bossa nova': [648, 0, []],
      'Swing jazz': [300, 0, []],
    });
    for (const l of MEASURED.flatMap((m) => m.lengths))
      expect(Math.abs(l.steps) > 1e-6).toBe(Math.abs(l.seconds) > 0.001);
    const farthest = MEASURED.flatMap((m) => m.lengths).reduce(
      (a, l) => Math.max(a, Math.abs(l.seconds)),
      0,
    );
    expect(farthest).toBeLessThan(1e-9);
    // Why: cells and Jambot both sound the share of a note's written steps, then swing its end as its onset.
    // Funk's bar 0: its bass at step 10, written 3, sounds .425 of it, so both end it at step 11.275, 1.42
    // steps' time after its onset (a pair of sixteenths is .6 and .4 of its time), where cells v0.5.0 sounded
    // .425 of the 3.2 steps' time it is held, 1.36, and ended it at step 11.2.
    const funk = at('Funk', '4/4', 0);
    const ten = funk.played.notes.find((n) => n.part === 'bass' && n.step === 10)!;
    expect(ten.length).toBeCloseTo(1.275, 9);
    const lean = leanMap(leansOf(funk.bar.swing), funk.bar.meter);
    expect(lean.played(13) - lean.played(10)).toBeCloseTo(3.2, 9);
    expect(lean.played(11.275) - lean.played(10)).toBeCloseTo(1.42, 9);
    expect(lean.written(lean.played(10) + 0.425 * 3.2) - 10).toBeCloseTo(1.2, 9);
  });

  it('gap 2, what the chord in force leaves: a step of the 12 off the chord (Swing jazz’s 25 approach notes), the next chord (83 notes beside this one), and the hand (599 stacks of indices, 543 close)', () => {
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
    // A1 C2 E2 G2 are Am7's tones from C1, and cells plays its root a lap up, A2 (45), where v0.4.0 played E2, the next chord's root.
    expect(notes).toEqual([33, 36, 40, 43, 45]);
    // What reading it would carry: the notes of the bass, the pad and the stab that are tones of the chord sounding.
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
    // Off the chord: an accidental on an index is a degree of the key, so a step of the 12 that no tone of the chord
    // carries has no index. Swing jazz's bar 0: G♭2 (42), over the key `11b`, over Imaj9 none.
    const c = { tonic: 0, mode: 'ionian' as const };
    const imaj9 = chordTones(c, lowerNumeral(c, parseNumeral('Imaj9')!));
    expect(imaj9.map((t) => degreeText(t.degree, t.accidental))).toEqual(['0', '2', '4', '6', '8']);
    expect(pinTone(c, 42, 'bass')).toEqual({ degree: 11, accidental: -1 });
    expect(indexOf(c, imaj9, 42, 'bass')).toBeNull();
    // (G2 a semitone up is the chord's fifth a lap up, index 7)
    expect(indexOf(c, imaj9, 43, 'bass')).toEqual({ n: 7, alter: 0 });
    // The next chord: of the notes off the chord sounding, 83 are tones of the next bar's first chord (the bass 31, the
    // stab 52), which the text writes beside this chord's tones, since cells has no next chord (yggi/cells#50).
    const next: Record<string, number> = { bass: 0, pad: 0, stab: 0 };
    for (const r of RUN_OF.values())
      for (const [i, bar] of r.bars.entries()) {
        // (a run's last bar has no next in the run)
        const after = r.bars[i + 1];
        if (!after) continue;
        const pitchClasses = (chord: (typeof bar.chords)[number]) =>
          new Set(joinChord(chord.chord).map((h) => ((h % 12) + 12) % 12));
        const following = pitchClasses(after.chords[0]!);
        for (const w of bar.written) {
          if (w.part !== 'bass' && w.part !== 'pad' && w.part !== 'stab') continue;
          const sounding = bar.chords.findLast(
            (x) => slotStepOn(bar.meter, x.slot.step) <= w.step,
          )!;
          if (!pitchClasses(sounding).has(w.note % 12) && following.has(w.note % 12))
            next[w.part]!++;
        }
      }
    expect(next).toEqual({ bass: 31, pad: 0, stab: 52 });
    // The hand: the comp's stacks over the chord are its indices, the voicing written out, not led from a pin (E32's
    // gap 3); most are close, consecutive tones of the chord with no accidental, which a voicing could choose.
    const stacks = MEASURED.flatMap((m) =>
      [...textOf(m.text).matchAll(/^&(?:pad|stab) over=&harm .*$/gm)].flatMap(([line]) =>
        [...line.matchAll(/\[([^\]]+)\]/g)].map(([, inner]) => inner!.split(',')),
      ),
    );
    const close = stacks.filter((tones) =>
      tones.every(
        (t, i) => /^-?\d+$/.test(t) && (i === 0 || Number(t) === Number(tones[i - 1]) + 1),
      ),
    );
    expect([close.length, stacks.length]).toEqual([543, 599]);
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
        (bar) => barAsCells(bar, { euclid: true }),
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
