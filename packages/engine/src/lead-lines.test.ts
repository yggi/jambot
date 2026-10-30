import { METERS, type MeterName, alteredHeight, stepsOf, wrap } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { unionOf } from '@yggi/cells/repository/fit';
import { describe, expect, it } from 'vitest';
import { keyHelix } from './key.ts';
import { EMPTY_LAYER } from './layer.ts';
import { MOTIF_FRAGMENTS } from '@yggi/cells/repository/motifs';
import {
  LEAD_FORM,
  LEAD_REPOSITORY,
  LEAD_VOICE,
  MOTIF_LEADS,
  leadRepository,
  leadText,
  phraseOf,
  readLead,
} from './lead-lines.ts';
import { type LeadFiling, type LeadNote, leadMotif, leadPhrase } from './lead-query.ts';
import { stepSeconds } from './tempo.ts';

const NAMES = Object.keys(METERS) as MeterName[];

/** A motif as the Muse hears one: degrees from the first, below it and above, one note bent off the key. */
const BENT: LeadNote[] = [
  { step: 0, degree: 0, alter: 0 },
  { step: 3, degree: 2, alter: 0 },
  { step: 6, degree: -1, alter: 0 },
  { step: 8, degree: 4, alter: -1 },
];
const PLAIN = BENT.map((n) => ({ ...n, alter: 0 }));

/** The notes, each on a step of `steps`, at most one a step: over the bar every other step from `first`. */
const spread = (steps: number, first: number): LeadNote[] =>
  Array.from({ length: Math.ceil((steps - first) / 2) }, (_, i) => ({
    step: first + 2 * i,
    degree: (i % 5) - 1,
    alter: i % 3 === 2 ? 1 : 0,
  }));

/** What cells plays of a lead line in a key, over a bar: each note's step and pitch class. */
function cellsPlays(text: string, name: MeterName, key: string): string[] {
  const meter = METERS[name];
  const source = unionOf(text, `&bar meter("${name}") step=120bpm\n&key scale(${key})`).text;
  const plan = planOf(source);
  const route = router(plan.result, channelTable(plan.result));
  const step = stepSeconds(120, meter);
  const out: string[] = [];
  for (const e of windowAt(plan, 0, stepsOf(meter) * step).events)
    for (const r of routesOf(route(e))) {
      const note = midiNote(e, r);
      if (note) out.push(`${Math.round(note.at / step)}:${wrap(note.note, 12)}`);
    }
  return out.sort();
}

describe('a lead line as cells text, and read back (#424)', () => {
  it('reads back as the notes it was stated from, in every named meter: the round trip', () => {
    for (const name of NAMES) {
      const steps = stepsOf(METERS[name]);
      for (const notes of [spread(steps, 0), spread(steps, 1), PLAIN.filter((n) => n.step < steps)])
        expect(readLead(leadText(notes, steps), METERS[name]), name).toEqual({ bars: 1, notes });
    }
  });

  it('writes the coarsest grid its notes fall on, an accidental as cells spells one, and the lead’s voice', () => {
    expect(leadText(BENT, 16)).toBe(
      ['&lead over=&key step=16n 0 ~ ~ 2 ~ ~ -1 ~ 4b ~ ~ ~ ~ ~ ~ ~', ...LEAD_VOICE].join('\n'),
    );
    expect(leadText(PLAIN.filter((n) => n.step % 4 === 0 || n.step === 6).slice(0, 1), 16)).toBe(
      ['&lead over=&key step=1m 0', ...LEAD_VOICE].join('\n'),
    );
  });

  it('plays in cells what the lead plays of it: each note the key’s degree from the tonic, altered', () => {
    const key = { tonic: 2, mode: 'dorian' as const };
    for (const name of ['4/4', '6/8', '7/8'] as MeterName[]) {
      const steps = stepsOf(METERS[name]);
      const notes = spread(steps, 1);
      const band = notes
        .map((n) => `${n.step}:${wrap(alteredHeight(keyHelix(key), n.degree, n.alter), 12)}`)
        .sort();
      expect(cellsPlays(leadText(notes, steps), name, 'dorian, D'), name).toEqual(band);
    }
  });

  it('reads no text that isn’t a line over the key', () => {
    expect(readLead('&lead over=&key 0 2 4', METERS['4/4'])).toBeNull();
    expect(readLead('&lead step=16n 0 2 4', METERS['4/4'])).toBeNull();
    expect(readLead('not cells', METERS['4/4'])).toBeNull();
  });
});

const FILING: LeadFiling = {
  notes: PLAIN,
  bench: { meter: METERS['4/4'], meterFragment: '4/4' },
  point: { sync: 0.5, harm: 0.5, artic: 0.5, energy: 0.5 },
  source: 'Ada',
  created: 'song 1, bar 0',
  tags: ['lead line'],
};

describe('the lead’s repository (#424)', () => {
  it('holds cells’ motifs as its seeds, each found first at its own point in 4/4 and in 5/4, a rest after it, and none in 3/4, which none fits (#520)', () => {
    expect(MOTIF_LEADS.map((f) => f.id)).toEqual(MOTIF_FRAGMENTS.map((f) => f.id));
    for (const motif of MOTIF_LEADS) {
      const { point } = motif.association[0]!;
      const found = LEAD_REPOSITORY.query(point, FILING.bench, EMPTY_LAYER);
      expect(found[0], motif.id).toEqual({ id: motif.id, distance: 0, score: 0 });
      const five = { meter: METERS['5/4'], meterFragment: '5/4' };
      expect(LEAD_REPOSITORY.query(point, five, EMPTY_LAYER)[0], motif.id).toEqual(found[0]);
      const three = { meter: METERS['3/4'], meterFragment: '3/4' };
      expect(LEAD_REPOSITORY.query(point, three, EMPTY_LAYER), motif.id).toEqual([]);
    }
  });

  it('reads a motif as a lead line from its first note: the Dies irae’s step down, back, a third down, a step up, a third down and a step up, held; in 5/4 a rest after it (#520)', () => {
    const lead = MOTIF_LEADS.find((f) => f.id === 'diesIrae')!;
    expect(lead.text.split('\n')).toEqual([
      '&lead over=&key step=8n 0 -1 0 -2 -1 -3 -2@2',
      ...LEAD_VOICE,
    ]);
    expect(lead.association.map((p) => p.facet)).toEqual(['lead']);
    const line = [
      [0, 0],
      [2, -1],
      [4, 0],
      [6, -2],
      [8, -1],
      [10, -3],
      [12, -2],
    ];
    for (const name of ['4/4', '5/4'] as const) {
      const read = LEAD_REPOSITORY.read('diesIrae', METERS[name], EMPTY_LAYER)!;
      expect(read.bars, name).toBe(1);
      expect(
        read.notes.map((n) => [n.step, n.degree]),
        name,
      ).toEqual(line);
    }
    // (two quarters in 7/8's three and a half: no whole number of quarters fills the bar)
    expect(readLead('&lead over=&key step=4n 0 2', METERS['7/8'])).toBeNull();
    expect(readLead('&lead over=&key step=8n 0 2', METERS['7/8'])?.notes.length).toBe(2);
  });

  it('files a line at its point, as the facet `lead`, and finds it there with what it read back', () => {
    const repository = leadRepository();
    const filed = repository.file!(EMPTY_LAYER, FILING);
    expect(filed.held).toBe(false);
    expect(repository.query(FILING.point, FILING.bench, filed.layer)[0]).toEqual({
      id: filed.id,
      distance: 0,
      score: 0,
    });
    const fragment = filed.layer.filed[0]!.fragment;
    expect(fragment.association.map((p) => p.facet)).toEqual(['lead']);
    expect(repository.read(filed.id, METERS['4/4'], filed.layer)).toEqual({
      bars: 1,
      notes: PLAIN,
    });
    expect(leadMotif(repository, filed.id, METERS['4/4'], 16, filed.layer)).toEqual({
      cycle: 16,
      onsets: [0, 3, 6, 8],
      degrees: [0, 2, -1, 4],
      accidentals: [0, 0, 0, 0],
    });
  });

  it('files the same line again as a use of the one held (identity)', () => {
    const repository = leadRepository();
    const once = repository.file!(EMPTY_LAYER, FILING);
    const twice = repository.file!(once.layer, { ...FILING, source: 'Bo' });
    expect(twice).toMatchObject({ id: once.id, held: true });
    expect(twice.layer.filed.length).toBe(1);
  });

  it('varies a line by lift, turn over, a bend of its last note and its drop, and a bent one too, its accidental mirrored with its note', () => {
    const repository = leadRepository();
    const plain = repository.file!(EMPTY_LAYER, FILING);
    const ways = new Map<string, readonly LeadNote[]>();
    for (let k = 0; k < 64; k++) {
      const v = repository.vary!(plain.id, FILING.bench, k / 64, plain.layer)!;
      if (!ways.has(v.by)) ways.set(v.by, v.notes);
    }
    // (in cells' order: lift, turn over, the bends by −2, −1, 1 and 2 degrees from the note before the last, the drop)
    expect([...ways.keys()]).toEqual([
      'transpose &lead 2',
      'invert &lead',
      'bend &lead -2',
      'bend &lead -1',
      'bend &lead 1',
      'bend &lead 2',
      'trim &lead 8',
    ]);
    expect(ways.get('transpose &lead 2')).toEqual(
      PLAIN.map((n) => ({ ...n, degree: n.degree + 2 })),
    );
    expect(ways.get('invert &lead')).toEqual(PLAIN.map((n) => ({ ...n, degree: 0 - n.degree })));
    // (the last note, 4, bent to the note before it, −1, moved by n degrees)
    for (const n of [-2, -1, 1, 2])
      expect(ways.get(`bend &lead ${n}`)).toEqual([
        ...PLAIN.slice(0, -1),
        { ...PLAIN[3]!, degree: -1 + n },
      ]);
    expect(ways.get('trim &lead 8')).toEqual(PLAIN.slice(0, -1));
    const bent = repository.file!(EMPTY_LAYER, { ...FILING, notes: BENT });
    expect(repository.read(bent.id, METERS['4/4'], bent.layer)!.notes).toEqual(BENT);
    // (cells v0.11 reads a line with an accidental, yggi/cells#272: turned over, the flat on 4 is a sharp on −4)
    expect(repository.vary!(bent.id, FILING.bench, 0.25, bent.layer)).toEqual({
      notes: BENT.map((n) => ({ ...n, degree: 0 - n.degree, alter: 0 - n.alter })),
      by: 'invert &lead',
    });
  });

  it('starts a motif with a rest where its line starts after the downbeat', () => {
    const repository = leadRepository();
    const late = repository.file!(EMPTY_LAYER, {
      ...FILING,
      notes: PLAIN.map((n) => ({ ...n, step: n.step + 2 })),
    });
    expect(leadMotif(repository, late.id, METERS['4/4'], 16, late.layer)).toMatchObject({
      onsets: [0, 2, 5, 8, 10],
      degrees: [null, 0, 2, -1, 4],
    });
    expect(leadMotif(repository, undefined, METERS['4/4'], 16)).toBeNull();
  });
});

describe('a line the layer’s cap dropped (#424)', () => {
  it('learns no use of a line the layer no longer holds, where cells would refuse it', () => {
    const repository = leadRepository();
    const filed = repository.file!(EMPTY_LAYER, FILING);
    const dropped = { ...filed.layer, filed: [] };
    expect(repository.used!(dropped, [filed.id], FILING.point, ['4/4'])).toEqual(
      repository.used!(dropped, [], FILING.point, ['4/4']),
    );
    // (and one it holds is learned as used)
    expect(repository.used!(filed.layer, [filed.id], FILING.point)).not.toEqual(filed.layer);
  });
});

describe('a lead line in cells’ call and answer (#520, rung 2)', () => {
  const dies = (name: MeterName) =>
    LEAD_REPOSITORY.read('diesIrae', METERS[name], EMPTY_LAYER)!.notes;

  it('names cells’ call and answer as the lead’s form', () => {
    expect(LEAD_FORM.id).toBe('call and answer');
  });

  it('reads the call, then its answer two degrees down, over two bars of 4/4 and of 5/4', () => {
    for (const name of ['4/4', '5/4'] as const) {
      const steps = stepsOf(METERS[name]);
      const call = dies(name);
      const phrase = phraseOf(call, METERS[name], LEAD_FORM)!;
      expect(phrase.bars, name).toBe(2);
      expect(phrase.notes, name).toEqual([
        ...call,
        ...call.map((n) => ({ ...n, step: n.step + steps, degree: n.degree - 2 })),
      ]);
      expect(LEAD_REPOSITORY.phrase!(call, METERS[name]), name).toEqual(phrase);
    }
  });

  it('plays no line on sixteenths in a form, which taps eighths, and splits the phrase into its bars', () => {
    expect(phraseOf(PLAIN, METERS['4/4'], LEAD_FORM)).toBeNull();
    const repository = leadRepository();
    const filed = repository.file!(EMPTY_LAYER, FILING);
    expect(leadPhrase(repository, filed.id, METERS['4/4'], 16, filed.layer)).toHaveLength(1);
    const bars = leadPhrase(LEAD_REPOSITORY, 'diesIrae', METERS['4/4'], 16, EMPTY_LAYER)!;
    expect(bars.map((b) => b.degrees)).toEqual([
      [0, -1, 0, -2, -1, -3, -2],
      [-2, -3, -2, -4, -3, -5, -4],
    ]);
  });
});
