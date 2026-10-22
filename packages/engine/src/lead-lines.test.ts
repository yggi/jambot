import { METERS, type MeterName, alteredHeight, stepsOf, wrap } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { unionOf } from '@yggi/cells/repository/fit';
import { describe, expect, it } from 'vitest';
import { keyHelix } from './key.ts';
import { EMPTY_LAYER } from './layer.ts';
import { LEAD_REPOSITORY, LEAD_VOICE, leadRepository, leadText, readLead } from './lead-lines.ts';
import { type LeadFiling, type LeadNote, leadMotif } from './lead-query.ts';
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
      ['&lead over=key step=16n 0 ~ ~ 2 ~ ~ -1 ~ 4b ~ ~ ~ ~ ~ ~ ~', ...LEAD_VOICE].join('\n'),
    );
    expect(leadText(PLAIN.filter((n) => n.step % 4 === 0 || n.step === 6).slice(0, 1), 16)).toBe(
      ['&lead over=key step=1m 0', ...LEAD_VOICE].join('\n'),
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
    expect(readLead('&lead over=key step=16n', METERS['4/4'])).toBeNull();
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
  it('holds no seed line, so a query with nothing filed finds none', () => {
    expect(LEAD_REPOSITORY.query(FILING.point, FILING.bench, EMPTY_LAYER)).toEqual([]);
  });

  it('files a line at its point, as the facet `lead`, and finds it there with what it read back', () => {
    const repository = leadRepository();
    const filed = repository.file!(EMPTY_LAYER, FILING);
    expect(filed.held).toBe(false);
    expect(repository.query(FILING.point, FILING.bench, filed.layer)).toEqual([
      { id: filed.id, distance: 0 },
    ]);
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

  it('varies a line by lift and turn over, and a bent one not at all', () => {
    const repository = leadRepository();
    const plain = repository.file!(EMPTY_LAYER, FILING);
    const ways = [0.25, 0.75].map((d) => repository.vary!(plain.id, FILING.bench, d, plain.layer));
    expect(ways).toEqual([
      { by: 'transpose &lead 2', notes: PLAIN.map((n) => ({ ...n, degree: n.degree + 2 })) },
      { by: 'invert &lead', notes: PLAIN.map((n) => ({ ...n, degree: 0 - n.degree })) },
    ]);
    const bent = repository.file!(EMPTY_LAYER, { ...FILING, notes: BENT });
    expect(repository.read(bent.id, METERS['4/4'], bent.layer)!.notes).toEqual(BENT);
    expect(repository.vary!(bent.id, FILING.bench, 0.25, bent.layer)).toBeNull();
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
