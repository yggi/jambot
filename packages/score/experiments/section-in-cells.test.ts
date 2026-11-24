import {
  PROTOTYPE_PRESETS,
  SECTION_BARS,
  STRAIGHT,
  licenceOf,
  melodicHelix,
  slotStepOn,
} from '@jambot/engine';
import { joinChord } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/midi';
import { bandLine } from '@yggi/cells/library';
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
    expect(QUICK.map((r) => r.preset)).toEqual(PROTOTYPE_PRESETS.map((p) => p.name));
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
      // (what the section offers the band, its harmony and its key: yggi/cells decision 075, #609)
      const [offer, ...lines] = text.split('\n');
      expect(offer).toBe('&harm, &key from');
      // (each taken by its `from` line, the meter from cells' template and the key from its mode fragment: #531; the
      // meter's swing on its head since cells v0.30.0, `bar`'s, decision 103)
      expect(lines[0]).toMatch(/^&bar (swing=(8n|16n):[\d./]+ )?from bar \d+bpm$/);
      expect(lines[1]).toMatch(
        /^&key from diatonic\(mode=(aeolian|dorian|ionian|mixolydian)\) [A-G][b#]?$/,
      );
      // (the section's style, where its first bar sits: cells v0.15.0's instruments read it, decision 063 §3)
      // (named by its preset's id in cells' library where it sits on one, #596: every section here is held at a preset)
      expect(lines[2]).toMatch(/^&(\w+) from styles$/);
      // (labelled with the section's kind, #531)
      expect(lines[3]).toMatch(
        new RegExp(`^&style label="\\w+" style=&${/^&(\w+)/.exec(lines[2]!)![1]}$`),
      );
      expect(lines[4]).toMatch(/^&harm over=&key step=(1m|2n) /);
      // No other line names a meter or a key; every line on a clock taps the main meter, and reads the main key, the
      // chord in force or the melodic scale.
      for (const line of lines.slice(1)) {
        expect(line).not.toMatch(/meter\(|scale\(.*\).*\n/);
        expect(line).not.toMatch(/step=(?!(16n|2n|1m)( |$))/);
        expect(line).not.toMatch(/over=(?!(&key|&harm|&melo)( |$))/);
      }
      // (one key: the one taken from its mode fragment)
      expect(lines.filter((l) => /scale\(|diatonic\(/.test(l))).toHaveLength(1);
    }
  });

  it('plays every part of every bar as written, step, pitch, velocity and written length: 512 of 512 bars for the drums, the bass, the comp, the harmony (each chord’s notes) and the lead, 13,588 notes', () => {
    expect(equalBars(SECTIONS)).toEqual({
      drums: 512,
      bass: 512,
      comp: 512,
      harmony: 512,
      lead: 512,
    });
    const notes = MEASURED.reduce((n, m) => n + m.notes, 0);
    // (18,200 before #655's song forms; 13,684 before the station's rotation, #547 rung 5, whose songs start from their
    // lead; 13,700 before cells v0.30.0's solos, hotter and without the pad; 13,576 before the found parts, #540, #643, #644, #646)
    expect(notes).toBe(13588);
    const byPart = (part: string) =>
      SECTIONS.reduce(
        (n, s) =>
          n + s.played.bars.reduce((k, b) => k + b.notes.filter((x) => x.part === part).length, 0),
        0,
      );
    // (9,617, 2,336, 4,288 and 1,959 before #655's song forms; the lead's 1,314 before the station's rotation, #547 rung 5;
    // 6,822, 1,933, 3,615 and 1,330 before cells v0.30.0's solos, hotter and without the pad; the drums 6,880 before the
    // found parts, #540, #643, #644, #646)
    expect(['drums', 'bass', 'comp', 'lead'].map(byPart)).toEqual([6892, 1935, 3383, 1378]);
    for (const s of SECTIONS) expect(s.text.cuts, `${s.run.preset} ${s.section}`).toEqual([]);
  });

  it('places every onset within 1 ms of the transport, 7,220 of them in the 4 swung presets, each section laid where the one before ends as cells holds it', () => {
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
    // (18,200 before #655's song forms; 13,684 before the station's rotation, #547 rung 5; 13,700 before cells v0.30.0;
    // 13,576 before the found parts, #540, #643, #644, #646)
    expect(TABLE.reduce((n, row) => n + row.timed, 0)).toBe(13588);
    const swung = SECTIONS.filter((s) => s.bars[0]!.swing.share !== STRAIGHT.share);
    // (10,906; 7,907 in 5 before cells v0.30.0, whose jazz song form plays its solos as the kind `solo` and whose Ambient 4/4 is straight; 7,227 before the found parts, #540, #643, #644, #646)
    expect(swung.reduce((n, s) => n + s.offsets.length, 0)).toBe(7220);
    expect(SECTIONS.every((s) => s.unmatched === 0)).toBe(true);
  });

  // (54 lines and 1,959 notes, 6 of them off the key, each written with an accidental, before #655's song forms: since,
  // in a song the section's kind alone decides whether the lead plays, and no note it played at seed 1 was off the key
  // until cells v0.30.0, whose jazz song form plays its solos 0.05 hotter: Bossa nova's lead lands on a secondary
  // dominant's tones in its three solos, F♯ and G♯ over C, 6 notes; 1,330 notes before)
  it('states the lead as its notes, degrees of the key from C4 where the plan’s melodic scale is the key’s own: 38 lines, 1,378 notes, 6 of them off the key', () => {
    const lines = SECTIONS.flatMap((s) => s.text.pitched.filter((p) => p.part === 'lead'));
    expect(lines).toHaveLength(38);
    expect(lines.every((l) => l.table === 'key' && l.shares === 1)).toBe(true);
    let notes = 0;
    let off = 0;
    for (const s of SECTIONS)
      for (const bar of s.bars)
        for (const w of bar.written.filter((x) => x.part === 'lead')) {
          notes++;
          if (pinTone(bar.plan.key, w.note, 'lead').accidental !== 0) off++;
        }
    expect([notes, off]).toEqual([1378, 6]); // (1,314 before the station's rotation, #547 rung 5)
    // Witness: Synth-pop's section 2 in A aeolian (a chorus since #655's song forms), its lead from C4 and its levels on
    // the beat and off it.
    const text = textOf(at('Synth-pop', 2).text);
    expect(text).toMatch(
      /^&leadline part=lead over=&key step=16n legato=\.6375 &leadlineA ~@4 9@2 8@2 6 6@4 6@3 /m,
    );
    // (a bar it plays more than once stated once, and spliced in where it plays)
    expect(text).toMatch(/^&leadlineA ~@4 5@2 6@2 7 8@4 8@3$/m);
    expect(text).toMatch(/^&leadLevel map=amp step=16n /m);
    // (passed to the band, which plays it: the score names no performer and no card, #531)
    expect(text).not.toMatch(/_performer|map=midi/);
    expect(text.split('\n').at(-1)).toMatch(
      /^\* from band\(.*\bleadline=&leadline\b.*\bleadLevel=&leadLevel\b/,
    );
  });

  it('states each part as a fragment: the host’s lines and one part’s alone compile and play that part’s notes as the whole does', () => {
    const synthPop = SECTIONS.filter((s) => s.run.preset === 'Synth-pop');
    for (const s of synthPop)
      for (const part of ['drums', 'bass', 'comp', 'lead'] as const) {
        const lines = s.text.lines
          .filter((l) => ['meter', 'key', 'harmony', part].includes(l.part))
          .map((l) => l.text);
        // (passed to the band alone: what the score doesn't pass, the band rests)
        const alone = [...lines, bandLine(lines.join('\n'))].join('\n');
        const played = cellsPlays(alone, s.bars);
        expect(played.diagnostics, `${s.section} ${part}`).toEqual([]);
        for (const [i, bar] of played.bars.entries())
          expect(bar.notes, `${s.section} ${part} ${i}`).toEqual(
            s.played.bars[i]!.notes.filter((n) => n.part === part),
          );
      }
  });

  // (since cells v0.24.0 each drum line writes its role, `role=kick`, decision 075; since v0.25.0 each pitched line says
  // its part, `part=bass`, yggi/cells#708; since #531 the section is a score: no performer, voice or card, the parts
  // passed to the band, `* from band(…)`, and each level the shortest decimal cells strikes at its velocity, `scoreLevel`)
  // (2,490, 2,223 and 7,792, 71 %, before #655's song forms)
  it('states the host’s lines and the harmony once a section: 2,092 characters a section, 1,897 without the lead, against E33’s 6,824 for the same 8 bars, 72 % fewer', () => {
    const e35 = characters(SECTIONS.map((s) => s.text));
    // (159,356 in all before #655's song forms: the meter 9,136, the harmony 8,285, the drums 60,238, the bass 23,974,
    // the comp 24,556, the lead 17,097 and the band 13,866; 132,593 in all and the lead 12,469 before the station's rotation, #547 rung 5;
    // 132,644 in all and the drums 45,884 before the drummer wrote the rim's metric accent, #749; 135,158 in all, the
    // meter 8,368, the drums 48,398, the bass 20,355, the comp 21,508, the lead 12,520 and the band 13,508 before cells
    // v0.30.0, whose jazz song form plays its solos as the kind `solo`, hotter and without the pad, whose Ambient 4/4 is
    // straight, and whose meter line is `&bar swing=16n:.6 from bar 104bpm` where it was `&bar from meter(swing=16n:.6)
    // 104bpm`, decision 103; 133,754 in all and the drums 48,501 before the found parts, #540, #643, #644, #646)
    expect(e35).toEqual({
      total: 133886,
      meter: 8072,
      key: 2204,
      harmony: 8297,
      drums: 48633,
      bass: 20356,
      comp: 20468,
      lead: 12468,
      band: 13388,
    });
    // E33 states every bar alone: its meter, key, harmony, voices, mix and card every bar, and no lead.
    const e33 = barCharacters(
      SECTIONS.flatMap((s) => s.bars.map((bar) => ({ text: barAsCells(bar) }))),
    );
    // (498,676 in all before #655's song forms: the harmony 17,811, the drums 266,759, the bass 90,065, the comp 68,839
    // and the card 24,066; 432,144 in all and the drums 212,479 before the drummer wrote the rim's metric accent, #749;
    // 440,397 in all, the meter 19,648, the drums 220,732, the bass 82,078, the comp 64,856 and the card 23,792 before
    // cells v0.30.0, whose jazz song form plays its solos as the kind `solo`, hotter and without the pad, and whose
    // Ambient 4/4 is straight; 436,576 in all and the drums 222,162 before the found parts, #540, #643, #644, #646)
    expect(e33).toEqual({
      total: 436718,
      meter: 18624,
      key: 11488,
      harmony: 17803,
      drums: 222304,
      bass: 82102,
      comp: 60983,
      card: 23414,
    });
    expect(TABLE.reduce((n, row) => n + row.e33, 0)).toBe(e33.total);
    // (2,073, 1,877 and 6,752 before the drummer wrote the rim's metric accent, #749; 2,072 before the station's rotation,
    // #547 rung 5; 2,112, 1,916 and 6,881 before cells v0.30.0; 2,090, 1,895 and 6,822 before the found parts, #540, #643, #644, #646)
    expect(Math.round(e35.total / 64)).toBe(2092);
    expect(Math.round((e35.total - e35.lead) / 64)).toBe(1897);
    expect(Math.round(e33.total / 64)).toBe(6824);
    expect(Math.round((100 * (e33.total - (e35.total - e35.lead))) / e33.total)).toBe(72);
    expect(
      Object.fromEntries(TABLE.map((row) => [row.preset, [row.characters, row.withoutLead]])),
    ).toEqual({
      // (before cells v0.30.0, whose meter line names `bar` with its swing on the head, 2 or 3 characters fewer a section,
      // and whose jazz song form plays its solos hotter and without the pad, and Ambient straight: each row's first pair
      // named by no change; the found parts are #540, #643, #644 and #646)
      'Synth-pop': [18264, 16309], // (18,274 and 16,319 before the found parts; 18,290 and 16,335; 17,523 and 15,568 before #749; 20,367 and 18,220 before #655's song forms)
      Techno: [19675, 17890], // (19,504 and 17,719 before the found parts; 19,520 and 17,735; 19,248 and 17,463 before #749; 19,902 and 17,419; 19,197 before the station's rotation, #547 rung 5)
      'Deep house': [17351, 15685], // (17,375 and 15,709; 17,245 and 15,579 before #749; 22,508 and 19,981)
      Ambient: [9742, 8888], // (9,677 and 8,823 before the found parts; 9,658 and 8,804; 13,397 and 12,222)
      'Lo-fi hip hop': [15531, 14071], // (15,553 and 14,093 before the found parts; 15,577 and 14,117; 15,471 and 14,011 before #749; 20,902 and 18,570)
      Funk: [18804, 17423], // (18,828 and 17,447; 18,601 and 17,220 before #749; 22,320 and 20,494)
      'Bossa nova': [18833, 17337], // (18,853 and 17,357 before the found parts; 19,497 and 17,949; 18,669 and 17,121 before #749; 22,308 and 20,196)
      'Swing jazz': [15686, 13815], // (15,738 and 13,867 before the found parts; 16,413 and 14,542; 16,229 and 14,358 before #749; 17,652 and 15,157)
    });
  });

  it('finds what it checks: a hit dropped, a lead note moved, held shorter or struck softer, a chord respelled, a line read over the key, the key moved, or a tempo a hundredth off, is a difference; a share changed moves only the sounding length', () => {
    // (Synth-pop's section 2 is a chorus since #655's song forms: its hats a line of levels, `&hatA &hh &hh …`, its lead
    // and its chords others, so the edits are its own)
    expect(differs('Synth-pop', 2, /^(&hatA )&hh/m, '$1~').written).toEqual(['drums']);
    expect(
      differs('Synth-pop', 2, /~@4 5@2 6@2 7 8@4 8@3/, '~@4 6@2 6@2 7 8@4 8@3').written,
    ).toEqual(['lead']);
    expect(
      differs('Synth-pop', 2, /~@4 5@2 6@2 7 8@4 8@3/, '~@4 5 ~ 6@2 7 8@4 8@3').written,
    ).toEqual(['lead']);
    expect(differs('Synth-pop', 2, /^(&leadLevelA ~@4 )\.62@2/m, '$1.3@2').written).toEqual([
      'lead',
    ]);
    // The chord is stated once: respelled, the stab that reads it moves with it.
    expect(differs('Synth-pop', 2, /\[2,4,6\] /, '[2,4#,6] ').written).toEqual(['comp', 'harmony']);
    expect(
      differs('Synth-pop', 2, /^&bassline part=bass over=&harm/m, '&bassline part=bass over=&key')
        .written,
    ).toEqual(['bass']);
    // The parts are open on the host's key: a key moved moves every pitched part, and the drums stay.
    expect(
      differs('Synth-pop', 2, /diatonic\(mode=aeolian\) A$/m, 'diatonic(mode=aeolian) B').written,
    ).toEqual(['bass', 'comp', 'harmony', 'lead']);
    // A share is how long a note sounds, not how long it is held: the written layer stays.
    expect(differs('Synth-pop', 2, /legato=\.6375/, 'legato=.7')).toEqual({
      written: [],
      sounding: ['lead'],
      diagnostics: [],
    });
    expect(farthest('Synth-pop', (t) => t)).toBeLessThan(1e-11);
    expect(
      farthest('Synth-pop', (t) =>
        t.replace(
          /^(&bar from .* )([\d.]+)bpm$/m,
          (_, line, bpm) => `${line}${Number(bpm) + 0.01}bpm`,
        ),
      ),
    ).toBeGreaterThan(0.001);
  });
});

describe('the lead over its melodic scale (a probe off the corpus: the players wish for a pentatonic or the blues)', () => {
  const probe: CorpusRun[] = PROTOTYPE_PRESETS.flatMap((p) =>
    (['pentatonic', 'blues'] as const)
      .filter((melodic) => licenceOf({ ...p.style, entropy: 0.3 }).melodic.includes(melodic))
      .map((melodic) => ({ preset: p.name, seed: 1, melodic })),
  );
  const sections = probe.flatMap((key) => measureRun(key));

  it('states the scale once a section as a stack of the key’s degrees and the lead as indices into it, every bar equal: 8 runs, 512 bars; 38 of 38 lines over the scale', () => {
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
    // (50 of 56 before #655's song forms: no lead line at seed 1 read the key since, below, until cells v0.30.0's hotter
    // solos, where 6 of Bossa nova's do, 38 of 38 before)
    expect(lines).toHaveLength(38);
    expect(lines.filter((x) => x.p.table === 'melo')).toHaveLength(32);
    // 10 notes take an accidental on their index: a degree of the key beside a tone of the scale (26 before #655's song
    // forms).
    expect(lines.reduce((n, x) => n + x.p.accidentals, 0)).toBe(10);
    // Witness: Lo-fi hip hop's section 1 in A aeolian, the blues `[0,2,3,4b,4,6]`, its lead's indices into it.
    const lofi = sections.find(
      (s) => s.run.melodic === 'blues' && s.run.preset === 'Lo-fi hip hop' && s.section === 1,
    )!;
    expect(textOf(lofi.text)).toMatch(/^&melo over=&key step=1m \[0,2,3,4b,4,6\]$/m);
    expect(textOf(lofi.text)).toMatch(
      /^&leadline part=lead over=&melo step=16n legato=\.7875 ~@4 0 2@5 1@3 0@3 /m,
    );
  });

  // (at seed 1 before #655's song forms, 6 lines and 8 notes: Synth-pop's pentatonic sections 2 and 7, Lo-fi hip hop's
  // 7 in both scales, Bossa nova's 5 in both. Since, no lead at seed 1 played a note off its scale's reach until cells
  // v0.30.0's hotter solos, where Bossa nova's three solos in both scales do, 6 lines and 9 notes; so the gap is
  // witnessed at seed 2 too, where Synth-pop's pentatonic run meets it in 6 sections)
  it('gap: a note off the key that no tone of the scale carries has no index (an accidental on an index is a degree of the key), so its section’s lead reads the key: 6 lines and 9 notes in Bossa nova’s solos at seed 1, 6 lines and 10 notes in Synth-pop’s pentatonic at seed 2', () => {
    const keptOf = (of: readonly MeasuredSection[]) =>
      of.flatMap((s) =>
        s.text.pitched.filter((p) => p.part === 'lead' && p.table === 'key').map((p) => ({ s, p })),
      );
    const solos = keptOf(sections);
    expect(
      solos.map((x) => `${name(x.s.run)} ${x.s.section} ${x.s.bars[0]!.plan.section.type}`),
    ).toEqual([
      'Bossa nova 1 pentatonic 2 solo',
      'Bossa nova 1 pentatonic 3 solo',
      'Bossa nova 1 pentatonic 4 solo',
      'Bossa nova 1 blues 2 solo',
      'Bossa nova 1 blues 3 solo',
      'Bossa nova 1 blues 4 solo',
    ]);
    expect(solos.flatMap((x) => x.p.unreached)).toHaveLength(9);
    const kept = keptOf(measureRun({ preset: 'Synth-pop', seed: 2, melodic: 'pentatonic' }));
    expect(kept.map((x) => `${name(x.s.run)} ${x.s.section}`)).toEqual([
      'Synth-pop 2 pentatonic 1',
      'Synth-pop 2 pentatonic 2',
      'Synth-pop 2 pentatonic 3',
      'Synth-pop 2 pentatonic 4',
      'Synth-pop 2 pentatonic 5',
      'Synth-pop 2 pentatonic 6',
    ]);
    const notes = kept.flatMap((x) =>
      x.p.unreached.map((u) => ({ ...u, key: x.s.bars[0]!.plan.key })),
    );
    expect(notes).toHaveLength(10);
    for (const n of notes) expect(pinTone(n.key, n.note, 'lead').accidental).not.toBe(0);
    // Witness: Synth-pop's section 1 at seed 2 over the D minor pentatonic, its C♯5 (73), the third of V7 (A7) it
    // lands on (section 7 at seed 1 before #655's song forms, over V).
    expect(kept[0]!.p.unreached).toEqual([
      { step: 48, note: 73 },
      { step: 112, note: 73 },
    ]);
    const bar = kept[0]!.s.bars[3]!;
    expect([keyText(bar.plan.key), statedChords(bar)[0]!.numeral]).toEqual([
      'scale(aeolian, D)',
      'V7',
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
        const scales = (['plain', 'pentatonic', 'blues'] as const).map((s) =>
          melodicTones(key, melodicHelix(key, s)),
        );
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

  // (Swing jazz's at seed 5, sections 3 and 6, before #655's song forms: its songs since are heads and solos, which
  // play no breakdown, so the witness is Lo-fi hip hop's, the one breakdown bass of the corpus that sounds two shares)
  it('sounds a line of shares where a line sounds two: Lo-fi hip hop’s breakdown bass at seed 5, held 0.3 of a step short of each written length', () => {
    const run = bandRun({ preset: 'Lo-fi hip hop', seed: 5 });
    const sections = measureRun({ preset: 'Lo-fi hip hop', seed: 5 }, run);
    const shared = sections.filter((s) => s.text.pitched.some((p) => p.shares > 1));
    expect(shared.map((s) => s.section)).toEqual([3]);
    for (const s of shared) {
      expect(s.bars[0]!.plan.section.type).toBe('breakdown');
      expect(textOf(s.text)).toMatch(/^&bassline part=bass over=\S+ step=16n legato=&bassShare /m);
      expect(textOf(s.text)).toMatch(/^&bassShare step=16n .*\.98125@16.*&bassShareA/m);
      expect(textOf(s.text)).toMatch(/^&bassShareA \.9625@8 \.9625@8$/m);
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
  it('gap 1, a secondary’s function (E33’s gap 3): the harmony’s notes are the band’s in every bar, and 32 bars read back a secondary as the stack it is (V9/vi as III9)', () => {
    const lost = MEASURED.filter((m) => !m.functions);
    expect(lost).toHaveLength(32); // (28 before #655's song forms)
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
      PROTOTYPE_PRESETS.map((p) => [
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

  it('gap 3, a line reads one table: a note off the key that no tone of the chord in force carries keeps its whole section’s line on the key, 9 of 143 bass, pad and stab lines (E33: one bar’s)', () => {
    const lines = SECTIONS.flatMap((s) =>
      s.text.pitched.filter((p) => p.part !== 'lead').map((p) => ({ s, p })),
    );
    // (149 before cells v0.30.0, whose jazz solos rest the pad)
    expect(lines).toHaveLength(143);
    const kept = lines.filter((x) => x.p.table === 'key');
    // (Funk's section 5's stab too before #655's song forms: it is a breakdown since, where no stab plays)
    expect(kept.map((x) => `${x.s.run.preset} ${x.s.section} ${x.p.part}`)).toEqual([
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
    // Each note that keeps it there is off the key and off the chord sounding: 54 notes (55 before #655's song forms).
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
    expect(notes).toBe(54);
    // Witness: Bossa nova's section 5 in C, its bass's E♭2 (39) at step 13 of its last bar, over V7 (G7) (Funk's
    // section 5's stab before #655's song forms, its B♭3 over VII in D dorian).
    expect(kept[0]!.p.unreached).toEqual([{ step: 125, note: 39 }]);
    const last = kept[0]!.s.bars[7]!;
    expect([keyText(last.plan.key), statedChords(last)[0]!.numeral]).toEqual([
      'scale(ionian, C)',
      'V7',
    ]);
  });
});

describe.runIf(process.env.E35_FULL)(
  'the whole corpus, 40 runs (E35_FULL=1, about 8 s alone)',
  () => {
    const sections = RUNS.flatMap((key) => measureRun(key));
    const bars = sections.flatMap((s) => s.measured);

    // (73,444 notes and 2,467 bars that read back each chord's function before #655's song forms; 68,614 notes before
    // cells v0.30.0, whose jazz solos play hotter and without the pad; 68,042 before the found parts, #540, #643, #644, #646)
    it('plays every part of every bar as written: 2,560 of 2,560 bars a part, 68,085 notes, each within 1 ms of the transport, with no diagnostic', () => {
      expect(sections).toHaveLength(320);
      expect(equalBars(sections)).toEqual({
        drums: 2560,
        bass: 2560,
        comp: 2560,
        harmony: 2560,
        lead: 2560,
      });
      expect(bars.filter((m) => m.functions)).toHaveLength(2427);
      // The sounding length too, swung or straight (cells v0.6.0, yggi/cells#120).
      expect(
        bars.filter((m) => m.sounding.bass && m.sounding.comp && m.sounding.lead),
      ).toHaveLength(2560);
      const offsets = sections.flatMap((s) => s.offsets);
      expect(bars.reduce((n, m) => n + m.notes, 0)).toBe(68085);
      expect(offsets.filter((o) => Math.abs(o) < 0.001)).toHaveLength(68085);
      for (const s of sections) {
        expect(s.played.diagnostics).toEqual([]);
        expect(s.unmatched).toBe(0);
        expect(s.text.cuts).toEqual([]);
      }
    });

    // (682 of 727 lines, the lead in 216, and 2,132, 1,914 and 6,806 characters a section, before #655's song forms; 699
    // of 748, 2,027, 1,832 and 6,682 before cells v0.30.0, whose jazz solos rest the pad and whose meter line names `bar`;
    // 2,041, 1,846 and 6,736 before the found parts, #540, #643, #644, #646)
    it('reads the chord in force in 672 of 721 bass, pad and stab lines, the lead over the key in 190; 2,042 characters a section, 1,847 without the lead, against E33’s 6,738', () => {
      const lines = sections.flatMap((s) => s.text.pitched);
      const by = (part: string) => {
        const own = lines.filter((p) => p.part === part);
        return [
          own.length,
          own.filter((p) => p.table !== 'key').length,
          own.filter((p) => p.shares > 1).length,
        ];
      };
      // ([320, 283, 2], [201, 201, 0], [206, 198, 0] and [216, 0, 0] before #655's song forms; the pad's 209 before cells
      // v0.30.0)
      expect(['bass', 'pad', 'stab', 'lead'].map(by)).toEqual([
        [320, 278, 1],
        [182, 182, 0],
        [219, 212, 0],
        [190, 0, 0],
      ]);
      const e35 = characters(sections.map((s) => s.text));
      // (797,294 before #531, whose section is a score passed to the band, its levels each the shortest decimal; 782,673
      // before cells v0.24.0, whose drum lines write their roles, `role=kick`; 682,778 before #645, whose levels the band
      // drives by the section's intensity; 682,321 and 69,844 before #655's song forms; 648,641 and 62,532 before cells
      // v0.30.0; 653,052 before the found parts, #540, #643, #644, #646)
      expect([e35.total, e35.lead]).toEqual([653487, 62440]);
      const e33 = table(sections, RUNS).reduce((n, row) => n + row.e33, 0);
      // (2,178,078 before #655's song forms; 2,138,319 before cells v0.30.0; 2,155,653 before the found parts)
      expect(e33).toBe(2156108);
      expect([e35.total, e35.total - e35.lead, e33].map((n) => Math.round(n / 320))).toEqual([
        2042, 1847, 6738,
      ]);
    });
  },
);
