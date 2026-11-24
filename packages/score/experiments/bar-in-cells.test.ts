import {
  PROTOTYPE_PRESETS,
  baseLengthOf,
  leanMap,
  leansOf,
  slotStepOn,
  stepSeconds,
} from '@jambot/engine';
import { joinChord, parseNumeral, stepsOf } from '@jambot/theory';
import { lowerNumeral } from '../src/score.ts';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/midi';
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
      PROTOTYPE_PRESETS.map((p) => p.name),
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
      // (Ambient's swung 16n:31/60 before cells v0.30.0, whose 4/4 is straight there, yggi/cells decision 103)
      'Ambient 4/4': '&bar meter("4/4") step=72bpm',
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

  it("plays every bar's drums, bass and comp as composed (step, pitch, length, velocity), and reads back its harmony but in 6 bars", () => {
    for (const m of MEASURED) {
      const where = `${m.run.preset} ${m.run.meter} ${m.bar.bar}`;
      for (const part of ['drums', 'bass', 'comp'] as const)
        expect(m.mismatches[part], where).toEqual([]);
    }
    const equal = Object.fromEntries(
      PARTS.map((p) => [p, MEASURED.filter((m) => m.equal[p]).length]),
    );
    expect(equal).toEqual({ drums: 384, bass: 384, comp: 384, harmony: 378 }); // (380 before #655's song forms)
    const notes = MEASURED.reduce((n, m) => n + m.played.notes.length, 0);
    expect(notes).toBe(MEASURED.reduce((n, m) => n + composedNotes(m.bar).length, 0));
    // (7,478 before #655's song forms; 7,047 before cells v0.30.0, whose jazz song form plays its solos as the kind `solo`, 0.05 hotter and without the pad, and whose Ambient 4/4 is straight)
    expect(notes).toBe(6970);
  });

  it('places every onset within 1 ms of the transport, the 4 swung presets with their swing on &bar among them', () => {
    expect(
      PROTOTYPE_PRESETS.filter((p) => swung({ preset: p.name, meter: '4/4' })).map((p) => p.name),
    ).toEqual(['Deep house', 'Lo-fi hip hop', 'Funk', 'Swing jazz']); // (and Ambient before cells v0.30.0)
    for (const row of TABLE) {
      const notes = MEASURED.filter(
        (m) => m.run.preset === row.preset && m.run.meter === row.meter,
      ).reduce((n, m) => n + m.played.notes.length, 0);
      expect(row.timed, `${row.preset} ${row.meter}`).toBe(notes);
      expect(row.within1ms, `${row.preset} ${row.meter}`).toBe(notes);
    }
    // (7,478 and 3,411 before #655's song forms; 7,047 and 2,999 before cells v0.30.0, whose jazz song form plays its solos as the kind `solo`, 0.05 hotter and without the pad, and whose Ambient 4/4 is straight)
    expect(TABLE.reduce((n, row) => n + row.timed, 0)).toBe(6970);
    expect(TABLE.filter((row) => swung(row)).reduce((n, row) => n + row.timed, 0)).toBe(2752);
    // Both count the meter's beats (#367), and cells' swing places Jambot's (yggi/cells#18), so only rounding is left.
    for (const row of TABLE) expect(row.largest, `${row.preset} ${row.meter}`).toBeLessThan(1e-12);
  });

  it('states the bass and the comp over the chord in force, `over=&harm`, in 705 of their 729 lines, 650 of them with whole indices alone (#387)', () => {
    const lines = MEASURED.flatMap((m) => m.text.pitched.map((p) => ({ m, p })));
    const over = (x: (typeof lines)[number]) => x.p.table;
    // (802, 781 and 720 before #655's song forms; 764, 741 and 686 before cells v0.30.0, whose jazz song form plays its solos as the kind `solo`, 0.05 hotter and without the pad, and whose Ambient 4/4 is straight: the pad rests in the solos)
    expect(lines).toHaveLength(729);
    expect(lines.filter((x) => over(x) === 'harm')).toHaveLength(705);
    expect(lines.filter((x) => over(x) === 'harm' && x.p.accidentals === 0)).toHaveLength(650);
    // Each line as the text has it: over the harmony, or over the key with the notes no index reaches.
    for (const m of MEASURED)
      for (const p of m.text.pitched) {
        expect(textOf(m.text)).toMatch(new RegExp(`^&${p.part} over=&${p.table} `, 'm'));
        expect(p.unreached.length > 0).toBe(p.table === 'key');
      }
    // 86 notes take an accidental on their index, a degree of the key beside a chord tone: the bass 29, the stab 57
    // (91, 33 and 58 before #655's song forms).
    const accidentals = (part: string) =>
      lines.filter((x) => x.p.part === part).reduce((n, x) => n + x.p.accidentals, 0);
    expect(['bass', 'pad', 'stab'].map(accidentals)).toEqual([29, 0, 57]);
    // The 24 lines over the key (21 before #655's song forms, 23 before cells v0.30.0) are Swing jazz's walking bass and,
    // since cells v0.30.0's solos, one of Bossa nova's stabs in 7/8: 30 notes off the key (25; 29), each a semitone from the root of
    // the chord that sounds next (the bar's next, or the next bar's first), and off the chord sounding. An accidental on
    // an index moves a degree of the key (cells decision 015), so no index into a chord names a step of the 12 that
    // none of its tones carries.
    const kept = lines.filter((x) => over(x) === 'key');
    expect(kept).toHaveLength(24);
    expect(new Set(kept.map((x) => `${x.m.run.preset} ${x.m.run.meter} ${x.p.part}`))).toEqual(
      new Set(['Swing jazz 4/4 bass', 'Bossa nova 7/8 stab']),
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
    expect(approaches).toHaveLength(30);
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

  it('counts the characters of every part, the bass and the comp over the chord in force 643 more than over the key (#387)', () => {
    // (305,740 in all before #655's song forms: the harmony 12,921, the drums 154,249, the bass 54,278, the comp 44,287
    // and the card 17,701; 291,814 in all and the drums 146,522 before the drummer wrote the rim's metric accent, #749,
    // which a line of levels states; 297,848, the meter 13,664, the drums 152,556, the bass 53,055, the comp 39,637 and the
    // card 17,334 before cells v0.30.0, whose jazz song form plays its solos as the kind `solo`, 0.05 hotter and without
    // the pad, and whose Ambient bar states no swing)
    expect(characters(MEASURED)).toEqual({
      total: 295075,
      meter: 13152,
      key: 8640,
      harmony: 12962,
      drums: 153473,
      bass: 53065,
      comp: 36798,
      card: 16985,
    });
    // The same bars with the bass and the comp over the key, as E33 stated them before cells v0.5.0: the harmony
    // stated again in the comp, and 643 characters fewer (53,003 + 36,217 + 12,962 = 102,182 against 102,825; 683 fewer,
    // 52,993 + 39,016 + 12,962 = 104,971 against 105,654, before cells v0.30.0, whose jazz solos rest the pad; 716
    // before #655's song forms, 54,221 + 43,628 + 12,921 = 110,770 against 111,486).
    const overKey = [...RUN_OF.values()].flatMap((r) =>
      r.bars.map((bar) => ({ text: barAsCells(bar, { table: 'key' }) })),
    );
    // (291,131 before the drummer wrote the rim's metric accent, #749; 297,165 before cells v0.30.0)
    expect(characters(overKey)).toMatchObject({
      total: 294432,
      harmony: 12962,
      bass: 53003,
      comp: 36217,
    });
    const levels = MEASURED.reduce(
      (n, m) => n + (textOf(m.text).match(/:0:[.\d]+/g) ?? []).join('').length,
      0,
    );
    expect(levels).toBe(39561); // (41,982 before #655's song forms; 38,816 before cells v0.30.0's solos)
    expect(
      Object.fromEntries(TABLE.map((row) => [`${row.preset} ${row.meter}`, row.characters.total])),
    ).toEqual({
      // (26,022, 27,643, 26,964, 16,072, 27,532, 36,367, 25,730, 27,038, 23,543, 23,084, 22,699 and 23,046 before #655's
      // song forms; Bossa nova's 25,728, 23,406 and 22,993 before the drummer wrote the rim's metric accent, #749, a line of
      // levels where its rim is a Euclid; Ambient's 14,085, Bossa nova's 27,806, 25,340 and 25,015 and Swing jazz's 27,304
      // before cells v0.30.0, whose jazz song form plays its solos as the kind `solo` and whose Ambient is straight)
      'Synth-pop 4/4': 24703,
      'Techno 4/4': 28000,
      'Deep house 4/4': 22806,
      'Ambient 4/4': 13573,
      'Lo-fi hip hop 4/4': 22014,
      'Funk 4/4': 35811,
      'Bossa nova 4/4': 27393,
      'Swing jazz 4/4': 26348,
      'Synth-pop 3/4': 22405,
      'Synth-pop 7/8': 22559,
      'Bossa nova 3/4': 24837,
      'Bossa nova 7/8': 24626,
    });
  });

  it('taps the chords by the clock of their coarsest unit, and writes the rim as one Euclid on the bar in every straight meter, its metric accent a line of levels', () => {
    const clocks = new Set(
      MEASURED.map(
        (m) => `${m.run.meter} ${/^&harm over=&key step=(\S+)/m.exec(textOf(m.text))![1]}`,
      ),
    );
    // Only Swing jazz writes two chords in a bar (9 bars, 6 before #655's song forms), so a chord on a half of 3/4 or 7/8
    // is not met.
    expect([...clocks].sort()).toEqual(['3/4 1m', '4/4 1m', '4/4 2n', '7/8 1m']);
    const rims = MEASURED.filter((m) => /^&euclid step=1m /m.test(textOf(m.text)));
    // (45 before #655's song forms; Bossa nova's 22 bars in each meter since)
    expect(rims).toHaveLength(66);
    expect(rims.every((m) => !swung(m.run))).toBe(true);
    for (const m of rims)
      expect(textOf(m.text)).toMatch(
        new RegExp(`^&euclid step=1m &rim\\([357],${stepsOf(m.bar.meter)},\\d+\\)$`, 'm'),
      );
    // (its levels the drummer's metric accent, a line of levels, since #749: at one level a bar before)
    expect(rims.filter((m) => /&euclid \* &euclidLevel\]/.test(textOf(m.text)))).toHaveLength(66);
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
    // Synth-pop's bar 8, its first verse's first bar (bar 0 before #655's song forms: it is an intro's since, whose comp
    // rests, so nothing is left there for a level or a respelled chord to move in the comp)
    expect(differs('Synth-pop', '4/4', 8, /3@2 6@14/, '3@3 6@13')).toEqual(['bass']);
    expect(differs('Synth-pop', '4/4', 8, /level=\.208568/, 'level=.2')).toEqual(['comp']);
    // The chord is stated once: respelled, the comp that reads it moves with it (the bass plays its root, a lap up).
    expect(differs('Synth-pop', '4/4', 8, /\[0,2,4\]$/m, '[0,2#,4]')).toEqual(['comp', 'harmony']);
    expect(differs('Synth-pop', '4/4', 8, /^&pad over=&harm/m, '&pad over=&key')).toEqual(['comp']);
    expect(differs('Synth-pop', '4/4', 8, /^&bass over=&harm/m, '&bass over=&key')).toEqual([
      'bass',
    ]);
    expect(differs('Synth-pop', '4/4', 8, /legato=\.635/, 'legato=.64')).toEqual(['bass']);
    expect(differs('Synth-pop', '4/4', 8, / legato=\.635/, '')).toEqual(['bass']);
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
  it('plays what `throughChord` says over every chord of the composer’s four modes: 252 a key, indices from below the root to past a lap, none, a sharp or a flat, 48,384 notes', () => {
    // A stack of degrees is the same in every tonic, so A in each mode is every case; the tonic only adds itself.
    const alters = [0, 1, -1];
    let notes = 0;
    for (const mode of ['ionian', 'dorian', 'mixolydian', 'aeolian'] as const) {
      const key = { tonic: 9, mode };
      const chords = everyNumeral(key).map((n) => chordTones(key, lowerNumeral(key, n)));
      expect(chords).toHaveLength(252);
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
    expect(notes).toBe(4 * 252 * 3 * 16);
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
    // (2,242 and 2,979 before #655's song forms; 2,017 and 2,766 before cells v0.30.0's solos, hotter and without the pad)
    expect({ gated, all }).toEqual({ gated: 2026, all: 2619 });
    // Sounding its share, no note runs into its line's next onset, and 47 stabs (a share over 1; 46 before #655's song
    // forms) run past the bar line, whole in cells too.
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
    expect({ into, past }).toEqual({ into: 0, past: 47 });
    // One share a line in every run, the same in every meter: the pad's 1, and each preset's bass and stab below; but
    // the bass of Deep house, Ambient and Lo-fi hip hop, which sounds .98125 in their breakdowns. Each bar states its
    // own `legato=`, so every length is still the band's (below). (One share a line in every run before #655's song
    // forms: since, these three play a breakdown in their first 32 bars, where the bass is held 0.3 of a step short of
    // its written length, as E35 found of Swing jazz's breakdown bass.)
    expect(
      [...shares]
        .filter(([, s]) => s.size > 1)
        .map(([k, s]) => `${k} ${[...s].sort().join(' ')}`)
        .sort(),
    ).toEqual([
      'Ambient 4/4 bass 0.9812 1.0000',
      'Deep house 4/4 bass 0.5650 0.9812',
      'Lo-fi hip hop 4/4 bass 0.7750 0.9812',
    ]);
    const share = (k: string) => [...(shares.get(k) ?? ['-'])][0];
    expect(
      Object.fromEntries(
        PROTOTYPE_PRESETS.map((p) => [
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
    // (in every run before #655's song forms: since, Synth-pop's run in 7/8 plays no stab in its 32 bars)
    for (const preset of ['Synth-pop', 'Bossa nova'])
      for (const meter of ['3/4', '7/8'])
        for (const part of ['bass', 'stab', 'pad'])
          if (shares.has(`${preset} ${meter} ${part}`))
            expect(share(`${preset} ${meter} ${part}`)).toBe(share(`${preset} 4/4 ${part}`));
    expect(
      ['Synth-pop', 'Bossa nova'].flatMap((preset) =>
        ['3/4', '7/8'].flatMap((meter) =>
          ['bass', 'stab', 'pad']
            .filter((part) => !shares.has(`${preset} ${meter} ${part}`))
            .map((part) => `${preset} ${meter} ${part}`),
        ),
      ),
    ).toEqual(['Synth-pop 7/8 stab']);
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
    expect(MEASURED.reduce((n, m) => n + m.lengths.length, 0)).toBe(2619); // (2,979 before #655's song forms; 2,766)
    expect(
      Object.fromEntries(
        PROTOTYPE_PRESETS.map((p) => [
          p.name,
          [
            lengths(p.name).length,
            off(p.name).length,
            [...new Set(off(p.name).map((l) => l.part))],
          ],
        ]),
      ),
    ).toEqual({
      // (576, 394, 239, 155, 254, 413, 648 and 300 before #655's song forms; Bossa nova's 580 and Swing jazz's 324 before
      // cells v0.30.0's solos, without the pad)
      'Synth-pop': [485, 0, []],
      Techno: [412, 0, []],
      'Deep house': [212, 0, []],
      Ambient: [144, 0, []],
      'Lo-fi hip hop': [214, 0, []],
      Funk: [395, 0, []],
      'Bossa nova': [493, 0, []],
      'Swing jazz': [264, 0, []],
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

  it('gap 2, what the chord in force leaves: a step of the 12 off the chord (30 approach notes, Swing jazz’s 29), the next chord (83 notes beside this one), and the hand (511 stacks of indices, 466 close)', () => {
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
    // (868 of 927, 678 of 678 and 1,316 of 1,374 before #655's song forms; 839 of 897, 709 of 709 and 1,103 of 1,160
    // before cells v0.30.0's solos, hotter and without the pad)
    expect(tones).toEqual({ bass: [840, 898], pad: [553, 553], stab: [1109, 1168] });
    // Off the chord: an accidental on an index is a degree of the key, so a step of the 12 that no tone of the chord
    // carries has no index. Swing jazz's bar 0: G♭2 (42), over the key `11b`, over Imaj9 none.
    const c = { tonic: 0, mode: 'ionian' as const };
    const imaj9 = chordTones(c, lowerNumeral(c, parseNumeral('Imaj9')!));
    expect(imaj9.map((t) => degreeText(t.degree, t.accidental))).toEqual(['0', '2', '4', '6', '8']);
    expect(pinTone(c, 42, 'bass')).toEqual({ degree: 11, accidental: -1 });
    expect(indexOf(c, imaj9, 42, 'bass')).toBeNull();
    // (G2 a semitone up is the chord's fifth a lap up, index 7)
    expect(indexOf(c, imaj9, 43, 'bass')).toEqual({ n: 7, alter: 0 });
    // The next chord: of the notes off the chord sounding, 83 are tones of the next bar's first chord (the bass 27, the
    // stab 56; 83, 31 and 52 before #655's song forms; 81, 27 and 54 before cells v0.30.0's solos), which the text writes beside this chord's tones, since cells has no next chord (yggi/cells#50).
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
    expect(next).toEqual({ bass: 27, pad: 0, stab: 56 });
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
    // (543 and 599 before #655's song forms; 501 and 549 before cells v0.30.0's solos, without the pad)
    expect([close.length, stacks.length]).toEqual([466, 511]);
  });

  it("gap 3, a secondary's function (E32's gap 1): Swing jazz's V7/V and V9/V read back as II7 and II9", () => {
    const lost = MEASURED.filter((m) => !m.equal.harmony);
    expect(lost.map((m) => `${m.run.preset} ${m.run.meter} ${m.bar.bar}`)).toEqual([
      'Swing jazz 4/4 2',
      'Swing jazz 4/4 6',
      'Swing jazz 4/4 18',
      'Swing jazz 4/4 22',
      'Swing jazz 4/4 26',
      'Swing jazz 4/4 30',
    ]); // (bars 2, 6, 10 and 14 before #655's song forms)
    expect(lost.map((m) => m.played.chords[1]!.numeral)).toEqual([
      'II9',
      'II7',
      'II9',
      'II7',
      'II9',
      'II7',
    ]);
  });

  it('gap 4, a Euclid under swing, closed in cells v0.11.2: its hits are even parts of its step, which swing with it (yggi/cells#306), so a swung rim plays as one Euclid on 1m', () => {
    // Stated as one Euclid on 1m, the swung rims (Lo-fi hip hop's 7 bars, 13 before #655's song forms; Funk's 32) play their offbeats
    // late as the band does, by up to 54 ms (Lo-fi hip hop's sixteenths at .65 and 84 bpm).
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
        expect(m.mismatches.drums, `${r.preset} ${m.bar.bar}`).toEqual([]);
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
      // (45, 275 and 137 before #655's song forms)
      bars: 39,
      hits: 227,
      offbeats: 110,
      farthest: '0.0536',
    });
  });
});
