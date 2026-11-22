import {
  BASS_REPOSITORY,
  type BandBar,
  type BandCarried,
  EMPTY_LAYER,
  HARMONY_REPOSITORY,
  LEAD_REPOSITORY,
  METER_REPOSITORY,
  PRESETS,
  RHYTHM_REPOSITORY,
  SECTION_BARS,
  band,
  presetMode,
  presetSwing,
} from '@jambot/engine';
import { compileSection, sectionAsCells, sectionOutline, sectionTextOf } from '@jambot/score';
import { describe, expect, it } from 'vitest';
import { type FragmentRow, type TakenSection, fragmentRows, logged } from './fragmentsView.ts';
import {
  type PlayingRow,
  type SectionDerivation,
  cameLine,
  cameOf,
  cameOfRow,
  derivationOf,
  fragmentLine,
  playingRows,
  playingSummary,
} from './playingView.ts';

/** A preset's first section as the app's band composes it, finding its parts in the repository, seed 1. */
function firstSection(name: string): BandBar[] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  return Array.from({ length: SECTION_BARS }, (_, bar) => {
    const made = band.advance(
      {
        seed: 1,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        swing: presetSwing(preset)!,
        offer: null,
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        bassLines: BASS_REPOSITORY,
        leads: LEAD_REPOSITORY,
        harmonies: HARMONY_REPOSITORY,
      },
      carried,
      null,
    );
    carried = made.carried;
    return made.output;
  });
}

/** A section's score and its outline, as the worker answers with them. */
function scored(name: string) {
  const text = sectionTextOf(sectionAsCells(firstSection(name)));
  return { text, outline: sectionOutline(compileSection(text)) };
}

/** Rows as nested lines, `label id`, for a readable expectation. */
const drawn = (rows: readonly PlayingRow[]) =>
  rows.map((r) => `${'  '.repeat(r.depth)}${r.label} ${r.id ?? '-'}`);

describe('the Playing tree (#642)', () => {
  const funk = scored('Funk');

  it('reads a section from the ground: each part under what it is taken on, the clave in its drums', () => {
    expect(drawn(playingRows(funk.text, funk.outline, 'ground'))).toEqual([
      'bar meter',
      '  drums -',
      '    clave rumba_clave_3_2',
      '  pad -',
      '  lead -',
      'key diatonic',
      '  harm -',
      '    bass -',
      '    stab -',
      'funk styles',
      // (a style reads its styles: a wire since cells v0.27.0, yggi/cells#827)
      '  style -',
      // (the section's intensity, its song folded in: #645)
      'intensity -',
    ]);
  });

  it('names what plays each part from the band, its arguments and the score’s lines it is', () => {
    const rows = playingRows(funk.text, funk.outline, 'ground');
    const row = (label: string) => rows.find((r) => r.label === label)!;
    expect(row('bass').on).toEqual(['bass_performer', 'bass']);
    expect(row('bar').args).toBe('swing=16n:.6, tempo=104bpm');
    expect(row('key').args).toBe('mode=dorian, tonic=D');
    const lines = funk.text.split('\n');
    expect(row('clave').lines.map((n) => lines[n - 1])).toEqual(['&clave from rumba_clave_3_2']);
    // (the drums: every role, its bars and levels, and the line the band is passed)
    expect(row('drums').lines.map((n) => lines[n - 1]!.split(' ')[0])).toContain('&drumlines');
  });

  it('reads it from the outputs: the band, each instrument and performer, the line it plays and what that reads', () => {
    // (the band reads the section's intensity, a sum of values, and the key under harm: wires since cells v0.27.0,
    // yggi/cells#823 and #827)
    expect(drawn(playingRows(funk.text, funk.outline, 'outputs')).slice(0, 13)).toEqual([
      'band band',
      '  intensity -',
      '  drums_performer drums_performer',
      '    drums -',
      '      clave rumba_clave_3_2',
      '  stab_performer stab_performer',
      '    stab -',
      '  bass bass',
      '    bass_performer bass_performer',
      '      bass -',
      '        harm -',
      '          bar meter',
      '          key diatonic',
    ]);
  });

  it('gives a fragment the composer has in mind its weight there', () => {
    const rows = playingRows(funk.text, funk.outline, 'ground', {
      inMind: [{ id: 'rumba_clave_3_2', weight: 0.5 }],
      boredom: [],
    });
    expect(rows.find((r) => r.label === 'clave')!.weight).toBe(0.5);
    expect(rows.find((r) => r.label === 'bar')!.weight).toBeNull();
  });

  it('sums up, folded, how many parts play and how many of them are fragments', () => {
    expect(playingSummary(playingRows(funk.text, funk.outline, 'ground'))).toEqual({
      main: '12 parts playing',
      sub: '4 from fragments · 8 written',
    });
    expect(playingSummary(playingRows(funk.text, funk.outline, 'ground').slice(0, 1)).main).toBe(
      '1 part playing',
    );
  });

  it.each(PRESETS.map((p) => p.name))(
    'at %s, places every line of the score in one row or in the band, from the ground, and every row once',
    (name) => {
      const { text, outline } = scored(name);
      const rows = playingRows(text, outline, 'ground');
      expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
      const covered = rows.flatMap((r) => r.lines);
      expect(new Set(covered).size, 'a line in two rows').toBe(covered.length);
      const band = outline.parts
        .filter((p) => p.id === 'band' || p.within !== null)
        .map((p) => p.line);
      const lines = text.split('\n').length;
      const parted = new Set(outline.parts.filter((p) => p.line <= lines).map((p) => p.line));
      expect([...parted].filter((n) => !covered.includes(n) && !band.includes(n))).toEqual([]);
    },
  );
});

/**
 * A preset's first `sections` sections as a band alone plays them, seed 1, with a learned layer: each section's score,
 * what the page logs off the band's carried plans for it (`derivationOf`), the Library's rows as of it, and the
 * fragments its bars name (`BarView.fragments`).
 */
function solo(name: string, sections: number) {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  const bars: BandBar[] = [];
  const derived = new Map<number, SectionDerivation>();
  const out = [];
  let log: readonly TakenSection[] = [];
  for (let bar = 0; bar < sections * SECTION_BARS; bar++) {
    const made = band.advance(
      {
        seed: 1,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        swing: presetSwing(preset)!,
        offer: null,
        repository: METER_REPOSITORY,
        layer: EMPTY_LAYER,
        rhythms: RHYTHM_REPOSITORY,
        bassLines: BASS_REPOSITORY,
        leads: LEAD_REPOSITORY,
        harmonies: HARMONY_REPOSITORY,
      },
      carried,
      null,
    );
    carried = made.carried;
    bars.push(made.output);
    const d = derivationOf(carried.plans);
    if (d) derived.set(d.section, d);
    if (bar % SECTION_BARS === SECTION_BARS - 1) {
      const section = bars.slice(-SECTION_BARS);
      const { plan } = section[0]!;
      const fragments = {
        meter: plan.meterFragment ?? null,
        rhythm: plan.rhythmFragment ?? null,
        clave: plan.claveFragment ?? null,
      };
      log = logged(log, { index: plan.section.index, section: plan.section.type, ...fragments });
      const text = sectionTextOf(sectionAsCells(section));
      const workbench = { inMind: carried.plans.shortTerm, boredom: carried.plans.boredom };
      const library = fragmentRows({
        layer: carried.plans.layer,
        log,
        memory: [],
        players: {},
        workbench,
      });
      out.push({
        text,
        outline: sectionOutline(compileSection(text)),
        fragments,
        derived: derived.get(plan.section.index)!,
        library: new Map(library.map((r) => [r.key, r])),
        workbench,
      });
    }
  }
  return out;
}

/** A Library row of the seed's, with what a test changes. */
const libraryRow = (over: Partial<FragmentRow> = {}): FragmentRow => ({
  key: 'funk_bass',
  name: 'funk_bass',
  role: 'bass',
  filed: false,
  retrieved: false,
  muse: false,
  mind: true,
  playing: false,
  source: 'seed',
  colour: null,
  sections: 0,
  since: '',
  text: null,
  point: [],
  tags: [],
  varies: null,
  by: null,
  together: [],
  strength: null,
  weight: null,
  lineage: null,
  ...over,
});

describe('the Playing tree joined to the Library (#730)', () => {
  it('says how a fragment came and who made it, for every way one comes', () => {
    expect(cameOf(libraryRow())).toMatchObject({ how: 'a seed', who: null, colour: null });
    expect(cameOf(libraryRow({ filed: true, source: 'The drummer' }))).toMatchObject({
      how: 'found',
      who: 'The drummer',
      colour: null,
    });
    expect(
      cameOf(
        libraryRow({
          filed: true,
          source: 'The composer',
          varies: 'funk_drums',
          by: 'drop &hat 6',
        }),
      ),
    ).toMatchObject({
      how: 'a variation of funk_drums by drop &hat 6',
      who: 'The composer',
      colour: null,
    });
    expect(
      cameOf(libraryRow({ filed: true, source: 'The composer', varies: 'funk_drums' })).how,
    ).toBe('a variation of funk_drums');
    expect(cameOf(libraryRow({ filed: true, muse: true, source: 'Ada', colour: 2 }))).toMatchObject(
      {
        how: 'via the Muse',
        who: 'Ada',
        colour: 2,
      },
    );
  });

  it('reads what a section’s written parts came from off the band’s carried plans', () => {
    const [first] = solo('Funk', 1);
    expect(first!.derived.section).toBe(0);
    for (const part of ['drums', 'bass', 'lead', 'harm'] as const)
      expect(first!.derived[part], part).not.toBeUndefined();
    // (before the first section is planned, nothing)
    expect(derivationOf(band.initial.plans)).toBeNull();
  });

  describe.each(['Funk', 'Swing jazz', 'Bossa nova'])('at %s, seed 1, solo', (name) => {
    const sections = solo(name, 2);
    const rowsOf = (i: number) => {
      const s = sections[i]!;
      return playingRows(s.text, s.outline, 'ground', s.workbench, {
        library: s.library,
        derived: { ...s.derived, drums: s.fragments.rhythm },
      });
    };

    it.each([0, 1])(
      'in section %i, every row the Library knows says who made it and how it came',
      (i) => {
        const s = sections[i]!;
        const rows = rowsOf(i);
        for (const row of rows) {
          // (a row taken from a fragment, and a written row derived from one: the Library's row of either)
          const id = row.id ?? row.derived?.id ?? null;
          const came = row.id === null ? (row.derived?.came ?? null) : row.came;
          if (id === null || !s.library.has(id)) {
            expect(came, row.label).toBeNull();
            continue;
          }
          expect(came, row.label).not.toBeNull();
          expect(came!.row.key, row.label).toBe(id);
          expect(came!.row.source, row.label).not.toBe('');
          expect(came!.how, row.label).not.toBe('');
        }
        // (written rows carry no `came` of their own: what they came from is their derivation's)
        for (const row of rows.filter((r) => r.id === null)) expect(row.came, row.label).toBeNull();
      },
    );

    it.each([0, 1])(
      'in section %i, the drums name their rhythm, and the bass, lead and harmony theirs or the band’s own',
      (i) => {
        const s = sections[i]!;
        const rows = rowsOf(i);
        const row = (label: string) => rows.find((r) => r.label === label)!;
        const drums = row('drums');
        expect(drums.id).toBeNull();
        expect(drums.derived).not.toBeNull();
        expect(drums.derived!.id).toBe(s.fragments.rhythm);
        expect(drums.derived!.why).toMatch(/thins/);
        // (every one of these sections finds a rhythm, which the Library logs as retrieved)
        expect(drums.derived!.came?.row.retrieved).toBe(true);
        for (const label of ['bass', 'lead', 'harm'] as const) {
          const r = row(label);
          expect(r, label).toBeDefined();
          expect(r.id, label).toBeNull();
          expect(r.derived, label).not.toBeNull();
          expect(r.derived!.id, label).toBe(s.derived[label]);
          if (r.derived!.id !== null && s.library.has(r.derived!.id))
            expect(r.derived!.came, label).not.toBeNull();
        }
      },
    );
  });

  it('on a client, names the drums’ rhythm off its bar and derives nothing else', () => {
    const [s] = solo('Funk', 1);
    // (a client keeps no layer and no workbench, and has no carried plans: its Library is its log of sections heard)
    const library = fragmentRows({
      layer: null,
      log: [{ index: 0, section: 'Intro', ...s!.fragments }],
      memory: [],
      players: {},
    });
    const rows = playingRows(s!.text, s!.outline, 'ground', null, {
      library: new Map(library.map((r) => [r.key, r])),
      derived: { section: 0, drums: s!.fragments.rhythm },
    });
    const row = (label: string) => rows.find((r) => r.label === label)!;
    expect(row('drums').derived?.id).toBe(s!.fragments.rhythm);
    for (const label of ['bass', 'lead', 'harm']) expect(row(label).derived, label).toBeNull();
    expect(row('clave').came?.how).toBe('a seed');
  });

  it('says a row’s fragment, what a written one came from, and how either came, on its line', () => {
    const row = (over: Partial<PlayingRow>): PlayingRow => ({
      key: 'k',
      depth: 0,
      label: 'bass',
      id: null,
      args: null,
      on: [],
      weight: null,
      lines: [],
      came: null,
      derived: null,
      ...over,
    });
    const seed = cameOf(libraryRow());
    const found = cameOf(libraryRow({ filed: true, source: 'The bass' }));
    expect(fragmentLine(row({ id: 'meter', args: 'swing=16n:.6' }))).toBe('meter (swing=16n:.6)');
    expect(fragmentLine(row({ id: 'diatonic' }))).toBe('diatonic');
    expect(fragmentLine(row({}))).toBe('written');
    expect(fragmentLine(row({ derived: { id: null, came: null, why: null } }))).toBe(
      'written, the band’s own',
    );
    expect(fragmentLine(row({ derived: { id: 'funk_bass', came: seed, why: null } }))).toBe(
      'written from funk_bass',
    );
    expect(cameOfRow(row({ id: 'funk_bass', came: found }))).toBe(found);
    expect(cameOfRow(row({ derived: { id: 'funk_bass', came: seed, why: null } }))).toBe(seed);
    expect(cameOfRow(row({ derived: { id: null, came: null, why: null } }))).toBeNull();
    expect(cameLine(seed)).toBe('a seed');
    expect(cameLine(found)).toBe('found · The bass');
  });

  it('derives nothing where it is given nothing, as before', () => {
    const [s] = solo('Funk', 1);
    for (const row of playingRows(s!.text, s!.outline, 'ground')) {
      expect(row.came).toBeNull();
      expect(row.derived).toBeNull();
    }
  });
});
