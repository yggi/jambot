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
  WHY_WRITTEN,
  cameLine,
  cameOf,
  cameOfRow,
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
      // (the meter from cells' `bar` since cells v0.30.0, `meter` before: decision 103)
      'bar bar',
      '  drums -',
      '    clave rumba_clave_3_2',
      // (the lead's row starts at the motif it takes, `* from riff &key`, before the pad's line)
      '  lead -',
      '  pad -',
      'key diatonic',
      // (the progression the band plays whole, taken by its `from` line: #731)
      '  harm vamp_to_the_seventh',
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
    // (the swing on the bar's head since cells v0.30.0, `&bar swing=16n:.6 from bar 104bpm`, where it was an argument)
    expect(row('bar').args).toBe('tempo=104bpm');
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
      '        harm vamp_to_the_seventh',
      '          bar bar',
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
      sub: '5 from fragments · 7 written',
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
 * what its bars took (`BandBar.derivedFrom`, which the score writes as `from` lines), the Library's rows as of it, and
 * the fragments its bars name (`BarView.fragments`).
 */
function solo(name: string, sections: number) {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  const bars: BandBar[] = [];
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
        kind: plan.theme.kind,
        text,
        outline: sectionOutline(compileSection(text)),
        fragments,
        derivedFrom: section[0]!.derivedFrom!,
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

  it('reads what a section’s written parts came from off its score: the take each part’s lines override (#731)', () => {
    const [first] = solo('Funk', 1);
    const rows = playingRows(first!.text, first!.outline, 'ground');
    const row = (label: string) => rows.find((r) => r.label === label)!;
    expect(row('drums').derived).toMatchObject({
      id: first!.fragments.rhythm,
      why: WHY_WRITTEN.drums,
    });
    expect(row('bass').derived).toMatchObject({
      id: first!.derivedFrom.bass,
      why: WHY_WRITTEN.bass,
    });
    expect(row('lead').derived).toMatchObject({
      id: first!.derivedFrom.lead,
      why: WHY_WRITTEN.lead,
    });
    // (a progression the band plays whole is taken whole: its row is the fragment's, derived from nothing)
    expect(row('harm')).toMatchObject({ id: first!.derivedFrom.harmony, derived: null });
    // (each take is in the row of the lines that override it, its line among the row's)
    const lines = first!.text.split('\n');
    expect(row('bass').lines.map((n) => lines[n - 1])).toContain(
      `* from ${first!.derivedFrom.bass} &harm`,
    );
  });

  it.each([
    ['Techno', 'tonic_vamp'],
    ['Acid', null],
  ])(
    'says what a build’s harmony came from at %s’s third section, seed 1: %s, or nothing where the tables wrote it (#735)',
    (name, id) => {
      const s = solo(name, 3)[2]!;
      expect(s.kind).toBe('build');
      expect(s.derivedFrom.harmony).toBe(id);
      const rows = playingRows(s.text, s.outline, 'ground', s.workbench, { library: s.library });
      const harm = rows.find((r) => r.label === 'harm')!;
      expect(harm.id ?? harm.derived?.id ?? null).toBe(id);
    },
  );

  describe.each(['Funk', 'Swing jazz', 'Bossa nova'])('at %s, seed 1, solo', (name) => {
    const sections = solo(name, 2);
    const rowsOf = (i: number) => {
      const s = sections[i]!;
      return playingRows(s.text, s.outline, 'ground', s.workbench, {
        library: s.library,
        rhythm: s.fragments.rhythm,
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
      'in section %i, the drums, the bass, the lead and the harmony each name the fragment the score takes them from',
      (i) => {
        const s = sections[i]!;
        const rows = rowsOf(i);
        const row = (label: string) => rows.find((r) => r.label === label)!;
        const drums = row('drums');
        expect(drums.id).toBeNull();
        expect(drums.derived!.id).toBe(s.fragments.rhythm);
        expect(drums.derived!.why).toMatch(/thins/);
        // (every one of these sections finds a rhythm, which the Library logs as retrieved)
        expect(drums.derived!.came?.row.retrieved).toBe(true);
        for (const [label, part] of [
          ['bass', 'bass'],
          ['lead', 'lead'],
          ['harm', 'harmony'],
        ] as const) {
          const r = row(label);
          expect(r, label).toBeDefined();
          // (taken whole, the row is the fragment's; with the band's own lines over it, they are derived from it)
          expect(r.id ?? r.derived?.id ?? null, label).toBe(s.derivedFrom[part]);
          const id = r.derived?.id;
          if (id && s.library.has(id)) expect(r.derived!.came, label).not.toBeNull();
        }
      },
    );
  });

  it('on a client, derives every written part as the host does, off the score alone', () => {
    const [s] = solo('Funk', 1);
    // (a client keeps no layer and no workbench, and has no carried plans: its Library is its log of sections heard)
    const library = fragmentRows({
      layer: null,
      log: [{ index: 0, section: 'Intro', ...s!.fragments }],
      memory: [],
      players: {},
    });
    const client = playingRows(s!.text, s!.outline, 'ground', null, {
      library: new Map(library.map((r) => [r.key, r])),
      rhythm: s!.fragments.rhythm,
    });
    const host = playingRows(s!.text, s!.outline, 'ground', s!.workbench, {
      library: s!.library,
      rhythm: s!.fragments.rhythm,
    });
    const derivations = (rows: readonly PlayingRow[]) =>
      rows.map((r) => [r.label, r.id, r.derived?.id, r.derived?.why]);
    expect(derivations(client)).toEqual(derivations(host));
    for (const label of ['bass', 'lead', 'drums'])
      expect(client.find((r) => r.label === label)!.derived?.id, label).toBeTruthy();
    expect(client.find((r) => r.label === 'clave')!.came?.how).toBe('a seed');
  });

  it('derives the drums the score writes out from the rhythm their bar names, or as the band’s own', () => {
    const [s] = solo('Funk', 1);
    const text = s!.text.replace(/^\* from \S+\n/m, '');
    expect(text).not.toBe(s!.text);
    const outline = sectionOutline(compileSection(text));
    const drums = (rhythm?: string | null) =>
      playingRows(text, outline, 'ground', null, rhythm === undefined ? {} : { rhythm }).find(
        (r) => r.label === 'drums',
      )!.derived;
    expect(drums('funk_drums~2')).toMatchObject({ id: 'funk_drums~2', why: WHY_WRITTEN.drums });
    expect(drums(null)).toMatchObject({ id: null, why: null });
    expect(drums()).toBeNull();
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

  it('joins nothing where it is given nothing: what a written part came from is the score’s, how it came the Library’s', () => {
    const [s] = solo('Funk', 1);
    const rows = playingRows(s!.text, s!.outline, 'ground');
    for (const row of rows) {
      expect(row.came).toBeNull();
      expect(row.derived?.came ?? null).toBeNull();
    }
    expect(rows.find((r) => r.label === 'bass')!.derived?.id).toBe(s!.derivedFrom.bass);
  });
});
