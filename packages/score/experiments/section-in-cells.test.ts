import { PRESETS, SECTION_BARS, STRAIGHT, licenceOf, slotStepOn } from '@jambot/engine';
import { joinChord } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { describe, expect, it } from 'vitest';
import { characters as barCharacters, barAsCells, indexOf, statedChords } from './bar-in-cells.ts';
import { degreeText, keyText, pinTone } from './pitch-in-cells.ts';
import {
  BARS,
  type CorpusRun,
  type MeasuredSection,
  PARTS,
  QUICK_SEEDS,
  RUNS,
  bandRun,
  cellsPlays,
  characters,
  hostOf,
  measureRun,
  melodicTones,
  report,
  table,
  textOf,
} from './section-in-cells.ts';

const QUICK = RUNS.filter((r) => QUICK_SEEDS.includes(r.seed));
const name = (r: CorpusRun) => `${r.preset} ${r.seed}${r.melodic ? ` ${r.melodic}` : ''}`;
const RUN_OF = new Map(QUICK.map((key) => [name(key), bandRun(key)]));
const SECTIONS = QUICK.flatMap((key) => measureRun(key, RUN_OF.get(name(key))));
const MEASURED = SECTIONS.flatMap((s) => s.measured);
const TABLE = table(SECTIONS, QUICK);
if (process.env.E35_REPORT) {
  console.log(TABLE.map((row) => JSON.stringify(row)).join('\n'));
  console.log(JSON.stringify(characters(SECTIONS.map((s) => s.text))));
  console.log(report(at('Ambient', 2)));
}

function at(preset: string, section: number): MeasuredSection {
  return SECTIONS.find((s) => s.run.preset === preset && s.section === section)!;
}

const equalBars = (sections: readonly MeasuredSection[]) => {
  const bars = sections.flatMap((s) => s.measured);
  return Object.fromEntries(PARTS.map((p) => [p, bars.filter((m) => m.equal[p]).length]));
};

/** The parts a section's text, edited, plays otherwise than the text as stated: on the written layer, or with sounding lengths. */
function differs(preset: string, section: number, from: RegExp, to: string) {
  const s = at(preset, section);
  const text = textOf(s.text);
  expect(text.replace(from, to), String(from)).not.toBe(text);
  const run = RUN_OF.get(`${preset} 1`)!;
  const [again] = measureRun(s.run, { ...run, bars: s.bars }, (t) => t.replace(from, to));
  const was = (p: string) => s.measured.every((m) => m.equal[p as 'drums']);
  const now = (p: string) => again!.measured.every((m) => m.equal[p as 'drums']);
  const sounds = (x: MeasuredSection, p: 'bass' | 'comp' | 'lead') =>
    x.measured.every((m) => m.sounding[p]);
  return {
    written: PARTS.filter((p) => was(p) && !now(p)),
    sounding: (['bass', 'comp', 'lead'] as const).filter((p) => sounds(s, p) && !sounds(again!, p)),
    diagnostics: again!.played.diagnostics,
  };
}

/** Every onset of a run, its sections' texts edited, as far from the transport's as the farthest; infinitely where one meets no onset of the band's. */
const farthest = (preset: string, edit: (text: string) => string) =>
  measureRun({ preset, seed: 1 }, RUN_OF.get(`${preset} 1`), edit).reduce(
    (a, s) =>
      s.unmatched > 0 ? Infinity : s.offsets.reduce((b, o) => Math.max(b, Math.abs(o)), a),
    0,
  );

describe('the band writes a whole section as one cells text, every part, the lead as its notes (E35)', () => {
  it('runs seed 1 of every preset through the transport: 8 runs of 64 bars, 64 sections of 8 bars, each holding one meter, tempo, swing, key and melodic scale', () => {
    expect(SECTION_BARS).toBe(8);
    expect(RUNS).toHaveLength(40);
    expect(QUICK.map((r) => r.preset)).toEqual(PRESETS.map((p) => p.name));
    for (const r of RUN_OF.values()) {
      expect(r.bars, r.preset).toHaveLength(BARS);
      expect(r.missed, r.preset).toBe(0);
    }
    expect(SECTIONS).toHaveLength(64);
    expect(MEASURED).toHaveLength(512);
    // The plan holds them for a section, so the host's lines are stated once (`hostOf` throws where a bar parts).
    for (const s of SECTIONS) {
      expect(s.bars, `${s.run.preset} ${s.section}`).toHaveLength(SECTION_BARS);
      expect(() => hostOf(s.bars)).not.toThrow();
    }
    expect(new Set(SECTIONS.map((s) => s.bars[0]!.plan.melodic))).toEqual(new Set(['plain']));
    // A section's 8 bars taken across a boundary where the key moves are refused: one text holds one key.
    const moved = SECTIONS.find((s, i) => {
      const next = SECTIONS[i + 1];
      return next?.run === s.run && next.bars[0]!.plan.key.tonic !== s.bars[0]!.plan.key.tonic;
    })!;
    const across = RUN_OF.get(name(moved.run))!.bars.slice(
      moved.section * SECTION_BARS + 4,
      moved.section * SECTION_BARS + 12,
    );
    expect(() => hostOf(across)).toThrow(/a section's key changes at its bar 4/);
  });

  it('compiles every section with no diagnostic: the host’s lines first, once, and every part open on them (taps, `over=&key`, `over=&harm`)', () => {
    for (const s of SECTIONS) {
      const text = textOf(s.text);
      expect(s.played.diagnostics, `${s.run.preset} ${s.section}`).toEqual([]);
      const lines = text.split('\n');
      expect(lines[0]).toMatch(/^&bar meter\("4\/4"\) step=\d+bpm( swing=(8n|16n):[\d./]+)?$/);
      expect(lines[1]).toMatch(/^&key scale\((aeolian|dorian|ionian|mixolydian), [A-G][b#]?\)$/);
      expect(lines[2]).toMatch(/^&harm over=&key step=(1m|2n) /);
      // No other line names a meter or a key; every line on a clock taps the main meter, and reads the main key, the
      // chord in force or the melodic scale.
      for (const line of lines.slice(1)) {
        expect(line).not.toMatch(/meter\(|scale\(.*\).*\n/);
        expect(line).not.toMatch(/step=(?!(16n|2n|1m)( |$))/);
        expect(line).not.toMatch(/over=(?!(&key|&harm|&melo)( |$))/);
      }
      expect(lines.filter((l) => /scale\(/.test(l))).toHaveLength(1);
    }
  });

  it('plays every part of every bar as written, step, pitch, velocity and written length: 512 of 512 bars for the drums, the bass, the comp, the harmony (each chord’s notes) and the lead, 18,200 notes', () => {
    expect(equalBars(SECTIONS)).toEqual({
      drums: 512,
      bass: 512,
      comp: 512,
      harmony: 512,
      lead: 512,
    });
    const notes = MEASURED.reduce((n, m) => n + m.notes, 0);
    expect(notes).toBe(18200);
    const byPart = (part: string) =>
      SECTIONS.reduce(
        (n, s) =>
          n + s.played.bars.reduce((k, b) => k + b.notes.filter((x) => x.part === part).length, 0),
        0,
      );
    expect(['drums', 'bass', 'comp', 'lead'].map(byPart)).toEqual([9617, 2336, 4288, 1959]);
    for (const s of SECTIONS) expect(s.text.cuts, `${s.run.preset} ${s.section}`).toEqual([]);
  });

  it('places every onset within 1 ms of the transport, 10,906 of them in the 5 swung presets, each section laid where the one before ends as cells holds it', () => {
    for (const row of TABLE) {
      expect(row.timed, row.preset).toBe(
        SECTIONS.filter((s) => s.run.preset === row.preset).reduce(
          (n, s) => n + s.measured.reduce((k, m) => k + m.notes, 0),
          0,
        ),
      );
      expect(row.within1ms, row.preset).toBe(row.timed);
      expect(row.largest, row.preset).toBeLessThan(1e-11);
    }
    expect(TABLE.reduce((n, row) => n + row.timed, 0)).toBe(18200);
    const swung = SECTIONS.filter((s) => s.bars[0]!.swing.share !== STRAIGHT.share);
    expect(swung.reduce((n, s) => n + s.offsets.length, 0)).toBe(10906);
    expect(SECTIONS.every((s) => s.unmatched === 0)).toBe(true);
  });

  it('states the lead as its notes, degrees of the key from C4 where the plan’s melodic scale is the key’s own: 54 lines, 1,959 notes, 6 of them off the key', () => {
    const lines = SECTIONS.flatMap((s) => s.text.pitched.filter((p) => p.part === 'lead'));
    expect(lines).toHaveLength(54);
    expect(lines.every((l) => l.table === 'key' && l.shares === 1)).toBe(true);
    let notes = 0;
    let off = 0;
    for (const s of SECTIONS)
      for (const bar of s.bars)
        for (const w of bar.written.filter((x) => x.part === 'lead')) {
          notes++;
          if (pinTone(bar.plan.key, w.note, 'lead').accidental !== 0) off++;
        }
    expect([notes, off]).toEqual([1959, 6]);
    // Witness: Synth-pop's section 2 in A aeolian, its lead from C4 and its levels on the beat and off it.
    const text = textOf(at('Synth-pop', 2).text);
    expect(text).toMatch(
      /^&leadline over=&key step=16n legato=\.6375 ~@5 5@3 5@6 8@2 ~@5 8@3 6@6 3@2 ~@5 2@3 2@6 5@2 /m,
    );
    expect(text).toMatch(/^&leadLevel map=amp step=16n /m);
    expect(text).toMatch(/^use \* from "lead performer"$/m);
    expect(text).toMatch(/^&out map=midi &leadOut &bassOut &stabOut ~!6 &drumsOut$/m);
  });

  it('states each part as a fragment: the host’s lines and one part’s alone compile and play that part’s notes as the whole does', () => {
    const synthPop = SECTIONS.filter((s) => s.run.preset === 'Synth-pop');
    for (const s of synthPop)
      for (const part of ['drums', 'bass', 'comp', 'lead'] as const) {
        const outs = {
          drums: ['&drumsOut'],
          bass: ['&bassOut'],
          comp: ['&padOut', '&stabOut'],
          lead: ['&leadOut'],
        };
        const others = Object.entries(outs).flatMap(([p, o]) => (p === part ? [] : o));
        const lines = s.text.lines
          .filter((l) => ['meter', 'key', 'harmony', part].includes(l.part))
          .map((l) => l.text);
        const card = s.text.lines.find((l) => l.part === 'card')!.text;
        const alone = [
          ...lines,
          others
            .reduce((c, o) => c.replace(new RegExp(`${o}\\b`), '~'), card)
            .replace('[~, ~]', '~'),
        ].join('\n');
        const played = cellsPlays(alone, s.bars);
        expect(played.diagnostics, `${s.section} ${part}`).toEqual([]);
        for (const [i, bar] of played.bars.entries())
          expect(bar.notes, `${s.section} ${part} ${i}`).toEqual(
            s.played.bars[i]!.notes.filter((n) => n.part === part),
          );
      }
  });

  it('states the host’s lines and the harmony once a section: 4,775 characters a section, 4,333 without the lead, against E33’s 7,549 for the same 8 bars, 43 % fewer', () => {
    const e35 = characters(SECTIONS.map((s) => s.text));
    expect(e35).toEqual({
      total: 305578,
      meter: 2456,
      key: 1436,
      harmony: 7197,
      drums: 197312,
      bass: 36868,
      comp: 28345,
      lead: 28293,
      card: 3671,
    });
    // E33 states every bar alone: its meter, key, harmony, voices, mix and card every bar, and no lead.
    const e33 = barCharacters(
      SECTIONS.flatMap((s) => s.bars.map((bar) => ({ text: barAsCells(bar) }))),
    );
    expect(e33).toEqual({
      total: 483148,
      meter: 19648,
      key: 11488,
      harmony: 17811,
      drums: 251231,
      bass: 90065,
      comp: 68839,
      card: 24066,
    });
    expect(TABLE.reduce((n, row) => n + row.e33, 0)).toBe(e33.total);
    expect(Math.round(e35.total / 64)).toBe(4775);
    expect(Math.round((e35.total - e35.lead) / 64)).toBe(4333);
    expect(Math.round(e33.total / 64)).toBe(7549);
    expect(Math.round((100 * (e33.total - (e35.total - e35.lead))) / e33.total)).toBe(43);
    expect(
      Object.fromEntries(TABLE.map((row) => [row.preset, [row.characters, row.withoutLead]])),
    ).toEqual({
      'Synth-pop': [36369, 32959],
      Techno: [40793, 35891],
      'Deep house': [44461, 39732],
      Ambient: [22027, 20842],
      'Lo-fi hip hop': [40874, 36996],
      Funk: [49013, 47117],
      'Bossa nova': [38091, 34576],
      'Swing jazz': [33950, 29172],
    });
  });

  it('finds what it checks: a hit dropped, a lead note moved, held shorter or struck softer, a chord respelled, a line read over the key, the key moved, or a tempo a hundredth off, is a difference; a share changed moves only the sounding length', () => {
    expect(differs('Synth-pop', 2, /&hh:0:[.\d]+/, '~').written).toEqual(['drums']);
    expect(differs('Synth-pop', 2, /~@5 5@3 5@6 8@2/, '~@5 6@3 5@6 8@2').written).toEqual(['lead']);
    expect(differs('Synth-pop', 2, /~@5 5@3 5@6 8@2/, '~@5 5@2 ~ 5@6 8@2').written).toEqual([
      'lead',
    ]);
    expect(differs('Synth-pop', 2, /\.416889@3/, '.3@3').written).toEqual(['lead']);
    // The chord is stated once: respelled, the stab that reads it moves with it.
    expect(differs('Synth-pop', 2, /\[0,2,4\] /, '[0,2#,4] ').written).toEqual(['comp', 'harmony']);
    expect(
      differs('Synth-pop', 2, /^&bassline over=&harm/m, '&bassline over=&key').written,
    ).toEqual(['bass']);
    // The parts are open on the host's key: a key moved moves every pitched part, and the drums stay.
    expect(differs('Synth-pop', 2, /scale\(aeolian, A\)/, 'scale(aeolian, B)').written).toEqual([
      'bass',
      'comp',
      'harmony',
      'lead',
    ]);
    // A share is how long a note sounds, not how long it is held: the written layer stays.
    expect(differs('Synth-pop', 2, /legato=\.6375/, 'legato=.7')).toEqual({
      written: [],
      sounding: ['lead'],
      diagnostics: [],
    });
    expect(farthest('Synth-pop', (t) => t)).toBeLessThan(1e-11);
    expect(
      farthest('Synth-pop', (t) =>
        t.replace(/step=([\d.]+)bpm/, (_, bpm) => `step=${Number(bpm) + 0.01}bpm`),
      ),
    ).toBeGreaterThan(0.001);
  });
});

describe('the lead over its melodic scale (a probe off the corpus: the players wish for a pentatonic or the blues)', () => {
  const probe: CorpusRun[] = PRESETS.flatMap((p) =>
    (['pentatonic', 'blues'] as const)
      .filter((melodic) => licenceOf({ ...p.style, entropy: 0.3 }).melodic.includes(melodic))
      .map((melodic) => ({ preset: p.name, seed: 1, melodic })),
  );
  const sections = probe.flatMap((key) => measureRun(key));

  it('states the scale once a section as a stack of the key’s degrees and the lead as indices into it, every bar equal: 8 runs, 512 bars; 50 of 56 lines over the scale', () => {
    expect(probe.map(name)).toEqual([
      'Synth-pop 1 pentatonic',
      'Deep house 1 pentatonic',
      'Lo-fi hip hop 1 pentatonic',
      'Lo-fi hip hop 1 blues',
      'Bossa nova 1 pentatonic',
      'Bossa nova 1 blues',
      'Swing jazz 1 pentatonic',
      'Swing jazz 1 blues',
    ]);
    expect(equalBars(sections)).toEqual({
      drums: 512,
      bass: 512,
      comp: 512,
      harmony: 512,
      lead: 512,
    });
    for (const s of sections) expect(s.played.diagnostics).toEqual([]);
    const lines = sections.flatMap((s) =>
      s.text.pitched.filter((p) => p.part === 'lead').map((p) => ({ s, p })),
    );
    expect(lines).toHaveLength(56);
    expect(lines.filter((x) => x.p.table === 'melo')).toHaveLength(50);
    // 26 notes take an accidental on their index: a degree of the key beside a tone of the scale.
    expect(lines.reduce((n, x) => n + x.p.accidentals, 0)).toBe(26);
    // Witness: Lo-fi hip hop's section 1 in A aeolian, the blues `[0,2,3,4b,4,6]`, its lead's indices into it.
    const lofi = sections.find(
      (s) => s.run.melodic === 'blues' && s.run.preset === 'Lo-fi hip hop' && s.section === 1,
    )!;
    expect(textOf(lofi.text)).toMatch(/^&melo over=&key step=1m \[0,2,3,4b,4,6\]$/m);
    expect(textOf(lofi.text)).toMatch(
      /^&leadline over=&melo step=16n legato=\.7875 ~@4 0 2@5 1@3 0@3 /m,
    );
  });

  it('gap: a note off the key that no tone of the scale carries has no index (an accidental on an index is a degree of the key), so its section’s lead reads the key: 6 lines, 8 notes', () => {
    const kept = sections.flatMap((s) =>
      s.text.pitched.filter((p) => p.part === 'lead' && p.table === 'key').map((p) => ({ s, p })),
    );
    expect(kept.map((x) => `${name(x.s.run)} ${x.s.section}`)).toEqual([
      'Synth-pop 1 pentatonic 2',
      'Synth-pop 1 pentatonic 7',
      'Lo-fi hip hop 1 pentatonic 7',
      'Lo-fi hip hop 1 blues 7',
      'Bossa nova 1 pentatonic 5',
      'Bossa nova 1 blues 5',
    ]);
    const notes = kept.flatMap((x) =>
      x.p.unreached.map((u) => ({ ...u, key: x.s.bars[0]!.plan.key })),
    );
    expect(notes).toHaveLength(8);
    for (const n of notes) expect(pinTone(n.key, n.note, 'lead').accidental).not.toBe(0);
    // Witness: Synth-pop's section 7 over the D minor pentatonic, its C♯5 (73), the third of V (A) it lands on.
    expect(kept[1]!.p.unreached).toEqual([{ step: 48, note: 73 }]);
    const bar = kept[1]!.s.bars[3]!;
    expect([keyText(bar.plan.key), statedChords(bar)[0]!.numeral]).toEqual([
      'scale(aeolian, D)',
      'V',
    ]);
    expect(joinChord(bar.chords[0]!.chord).some((h) => (((h - 73) % 12) + 12) % 12 === 0)).toBe(
      true,
    );
  });
});

describe('the forms it relies on, over every case', () => {
  it('plays every note of the lead’s range, 60 to 86, over the key from C4, and every note of the key over each melodic scale’s stack, in all 48 keys of the composer’s four modes, 3,915 notes; a note off the key has an index into a stack only through a tone’s own alteration, the blue note’s, 351 of 1,620', () => {
    let played = 0;
    let off = 0;
    const reachedOff = [0, 0, 0];
    for (const mode of ['aeolian', 'dorian', 'ionian', 'mixolydian'] as const)
      for (let tonic = 0; tonic < 12; tonic++) {
        const key = { tonic, mode };
        const range = Array.from({ length: 27 }, (_, i) => 60 + i);
        const scales = (['plain', 'pentatonic', 'blues'] as const).map((s) => melodicTones(key, s));
        const overKey = range.map((note) => {
          const t = pinTone(key, note, 'lead');
          return degreeText(t.degree, t.accidental);
        });
        const overScale = scales.map((tones, si) =>
          range.map((note) => {
            const index = indexOf(key, tones, note, 'lead');
            const onKey = pinTone(key, note, 'lead').accidental === 0;
            if (onKey) expect(index, `${keyText(key)} ${note}`).not.toBeNull();
            else if (index) reachedOff[si]!++;
            else off++;
            return index ? degreeText(index.n, index.alter) : '~';
          }),
        );
        const text = [
          '&bar meter("4/4") step=120bpm',
          `&key ${keyText(key)}`,
          ...scales.map(
            (tones, i) =>
              `&melo${i} over=&key step=1m [${tones.map((t) => degreeText(t.degree, t.accidental)).join(',')}]`,
          ),
          `&k over=&key step=16n ${overKey.join(' ')}`,
          ...overScale.map((words, i) => `&s${i} over=&melo${i} step=16n ${words.join(' ')}`),
          '&leadV loop=C4',
          `&out map=midi [&k * &leadV] ${overScale.map((_, i) => `[&s${i} * &leadV]`).join(' ')}`,
        ].join('\n');
        const plan = planOf(text);
        expect(
          plan.result.diagnostics.map((d) => d.message),
          keyText(key),
        ).toEqual([]);
        const route = router(plan.result, channelTable(plan.result));
        const heard = windowAt(plan, 0, 27 * 0.125 - 1e-9)
          .events.flatMap((e) =>
            routesOf(route(e)).flatMap((r) => {
              const n = midiNote(e, r);
              return n ? [`${n.channel} ${Math.round(n.at / 0.125)} ${n.note}`] : [];
            }),
          )
          .sort();
        const said = [
          ...range.map((note, i) => `1 ${i} ${note}`),
          ...overScale.flatMap((words, c) =>
            range.flatMap((note, i) => (words[i] === '~' ? [] : [`${c + 2} ${i} ${note}`])),
          ),
        ].sort();
        expect(heard, keyText(key)).toEqual(said);
        played += said.length;
      }
    expect({ played, off, reachedOff }).toEqual({
      played: 3915,
      off: 1269,
      reachedOff: [0, 0, 351],
    });
  });

  it('sounds a line of shares where a line sounds two: Swing jazz’s breakdown bass at seed 5, held 0.3 of a step short of each written length', () => {
    const run = bandRun({ preset: 'Swing jazz', seed: 5 });
    const sections = measureRun({ preset: 'Swing jazz', seed: 5 }, run);
    const shared = sections.filter((s) => s.text.pitched.some((p) => p.shares > 1));
    expect(shared.map((s) => s.section)).toEqual([3, 6]);
    for (const s of shared) {
      expect(s.bars[0]!.plan.section.type).toBe('breakdown');
      expect(textOf(s.text)).toMatch(/^&bassline over=\S+ step=16n legato=&bassShare /m);
      expect(textOf(s.text)).toMatch(/^&bassShare step=16n .*\.98125@16.*\.9625@8/m);
      expect(s.measured.every((m) => m.equal.bass)).toBe(true);
      // cells reads each bass note's share at its onset off `&bassShare`: the band's (its length less 0.3) / length.
      const shares = s.played.bars.flatMap((b) =>
        b.notes.flatMap((n, j) =>
          n.part === 'bass' ? [`${+n.written.toFixed(9)} ${b.shares[j]}`] : [],
        ),
      );
      expect(new Set(shares)).toEqual(new Set(['16 0.98125', '8 0.9625']));
    }
  });
});

describe('what cells could not say (E35: the gaps)', () => {
  it('gap 1, a secondary’s function (E33’s gap 3): the harmony’s notes are the band’s in every bar, and 28 bars read back a secondary as the stack it is (V9/vi as III9)', () => {
    const lost = MEASURED.filter((m) => !m.functions);
    expect(lost).toHaveLength(28);
    expect(new Set(lost.map((m) => m.run.preset))).toEqual(new Set(['Bossa nova', 'Swing jazz']));
    for (const m of lost) {
      expect(m.equal.harmony).toBe(true);
      expect(statedChords(m.bar).some((c) => c.numeral.includes('/'))).toBe(true);
    }
    // Witness: Bossa nova's bar 0 in C, Imaj7 and V9/vi; the second reads back as III9, the stack it is.
    const w = lost[0]!;
    expect([w.run.preset, w.bar.bar]).toEqual(['Bossa nova', 0]);
    const s = at('Bossa nova', 0);
    expect(s.played.chords[0]!.map((c) => c.numeral)).toEqual(['Imaj7', 'III9']);
  });

  it('gap 2, a line’s articulation under swing (E33’s gap 1), closed in cells v0.6.0 (yggi/cells#120): the written layer and the sounding length are the band’s in every bar, swung or straight', () => {
    const sounding = Object.fromEntries(
      PRESETS.map((p) => [
        p.name,
        (['bass', 'comp', 'lead'] as const).map(
          (x) => MEASURED.filter((m) => m.run.preset === p.name && m.sounding[x]).length,
        ),
      ]),
    );
    expect(sounding).toEqual({
      'Synth-pop': [64, 64, 64],
      Techno: [64, 64, 64],
      'Deep house': [64, 64, 64],
      Ambient: [64, 64, 64],
      'Lo-fi hip hop': [64, 64, 64],
      Funk: [64, 64, 64],
      'Bossa nova': [64, 64, 64],
      'Swing jazz': [64, 64, 64],
    });
  });

  it('gap 3, a line reads one table: a note off the key that no tone of the chord in force carries keeps its whole section’s line on the key, 10 of 149 bass, pad and stab lines (E33: one bar’s)', () => {
    const lines = SECTIONS.flatMap((s) =>
      s.text.pitched.filter((p) => p.part !== 'lead').map((p) => ({ s, p })),
    );
    expect(lines).toHaveLength(149);
    const kept = lines.filter((x) => x.p.table === 'key');
    expect(kept.map((x) => `${x.s.run.preset} ${x.s.section} ${x.p.part}`)).toEqual([
      'Funk 5 stab',
      'Bossa nova 5 bass',
      'Swing jazz 0 bass',
      'Swing jazz 1 bass',
      'Swing jazz 2 bass',
      'Swing jazz 3 bass',
      'Swing jazz 4 bass',
      'Swing jazz 5 bass',
      'Swing jazz 6 bass',
      'Swing jazz 7 bass',
    ]);
    // Each note that keeps it there is off the key and off the chord sounding: 55 notes.
    let notes = 0;
    for (const { s, p } of kept)
      for (const u of p.unreached) {
        const bar = s.bars[Math.floor(u.step / 16)]!;
        const chord = bar.chords.findLast(
          (c) => slotStepOn(bar.meter, c.slot.step) <= u.step % 16,
        )!;
        const voice = p.part === 'bass' ? 'bass' : 'comp';
        expect(pinTone(bar.plan.key, u.note, voice).accidental).not.toBe(0);
        expect(joinChord(chord.chord).some((h) => (((h - u.note) % 12) + 12) % 12 === 0)).toBe(
          false,
        );
        notes++;
      }
    expect(notes).toBe(55);
    // Witness: Funk's section 5 in D dorian, its stab's last note B♭3 (58) at step 14 of its last bar, over VII (C).
    expect(kept[0]!.p.unreached).toEqual([{ step: 126, note: 58 }]);
    const last = kept[0]!.s.bars[7]!;
    expect([keyText(last.plan.key), statedChords(last)[0]!.numeral]).toEqual([
      'scale(dorian, D)',
      'VII',
    ]);
  });
});

describe.runIf(process.env.E35_FULL)(
  'the whole corpus, 40 runs (E35_FULL=1, about 8 s alone)',
  () => {
    const sections = RUNS.flatMap((key) => measureRun(key));
    const bars = sections.flatMap((s) => s.measured);

    it('plays every part of every bar as written: 2,560 of 2,560 bars a part, 73,444 notes, each within 1 ms of the transport, with no diagnostic', () => {
      expect(sections).toHaveLength(320);
      expect(equalBars(sections)).toEqual({
        drums: 2560,
        bass: 2560,
        comp: 2560,
        harmony: 2560,
        lead: 2560,
      });
      expect(bars.filter((m) => m.functions)).toHaveLength(2467);
      // The sounding length too, swung or straight (cells v0.6.0, yggi/cells#120).
      expect(
        bars.filter((m) => m.sounding.bass && m.sounding.comp && m.sounding.lead),
      ).toHaveLength(2560);
      const offsets = sections.flatMap((s) => s.offsets);
      expect(bars.reduce((n, m) => n + m.notes, 0)).toBe(73444);
      expect(offsets.filter((o) => Math.abs(o) < 0.001)).toHaveLength(73444);
      for (const s of sections) {
        expect(s.played.diagnostics).toEqual([]);
        expect(s.unmatched).toBe(0);
        expect(s.text.cuts).toEqual([]);
      }
    });

    it('reads the chord in force in 682 of 727 bass, pad and stab lines, the lead over the key in 216; 3,926 characters a section, 3,559 without the lead, against E33’s 6,602', () => {
      const lines = sections.flatMap((s) => s.text.pitched);
      const by = (part: string) => {
        const own = lines.filter((p) => p.part === part);
        return [
          own.length,
          own.filter((p) => p.table !== 'key').length,
          own.filter((p) => p.shares > 1).length,
        ];
      };
      expect(['bass', 'pad', 'stab', 'lead'].map(by)).toEqual([
        [320, 283, 2],
        [201, 201, 0],
        [206, 198, 0],
        [216, 0, 0],
      ]);
      const e35 = characters(sections.map((s) => s.text));
      expect([e35.total, e35.lead]).toEqual([1256452, 117665]);
      const e33 = table(sections, RUNS).reduce((n, row) => n + row.e33, 0);
      expect(e33).toBe(2112582);
      expect([e35.total, e35.total - e35.lead, e33].map((n) => Math.round(n / 320))).toEqual([
        3926, 3559, 6602,
      ]);
    });
  },
);
