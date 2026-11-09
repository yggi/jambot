import { METERS, type MeterName, alteredHeight, stepsOf, wrap } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { describe, expect, it } from 'vitest';
import { keyHelix } from './key.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { MOTIF_FRAGMENTS, INSTRUMENT_FRAGMENTS } from './library.ts';
import { bodyOf } from '@yggi/cells/engine/use';
import {
  LEAD_FORM,
  LEAD_REPOSITORY,
  MOTIF_LEADS,
  RETIRED_LEAD_VOICE,
  keyedLine,
  leadAlone,
  leadRepository,
  leadText,
  leadsAlone,
  phraseOf,
  readLead,
} from './lead-lines.ts';
import { type LeadFiling, type LeadNote, leadMotif, leadPhrase } from './lead-query.ts';
import { takenOn } from './taken.ts';
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

/** Cells' lead instrument (`&leadV`) and a card on Jambot's lead channel: what a line alone plays on (#580). */
const LEAD_INSTRUMENT = [
  bodyOf(INSTRUMENT_FRAGMENTS.find((f) => f.id === 'lead')!.text),
  '&leadOut map=midi(1) [&lead * &leadV]',
].join('\n');

/** What cells plays of a lead line in a key, on cells' lead instrument, over a bar: each note's step and pitch class. */
function cellsPlays(text: string, name: MeterName, key: string): string[] {
  const meter = METERS[name];
  const bench = `&bar meter("${name}") step=120bpm\n&key scale(${key})\n${LEAD_INSTRUMENT}`;
  const taken = takenOn(text, bench, { head: '&lead', main: '&key' });
  const plan = planOf(taken.text, undefined, { resolve: taken.resolve });
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

  it('writes the line alone, on the coarsest grid its notes fall on, an accidental as cells spells one: no voice, no card (#580)', () => {
    expect(leadText(BENT, 16)).toBe('&lead over=&key step=16n 0 ~ ~ 2 ~ ~ -1 ~ 4b ~ ~ ~ ~ ~ ~ ~');
    expect(leadText(PLAIN.filter((n) => n.step % 4 === 0 || n.step === 6).slice(0, 1), 16)).toBe(
      '&lead over=&key step=1m 0',
    );
  });

  it('writes a phrase of two bars as one line of two bars, which reads back as its notes (#580, rung 3)', () => {
    const two = [
      ...PLAIN,
      ...PLAIN.map((n) => ({ ...n, step: n.step + 16, degree: n.degree - 1 })),
    ];
    const text = leadText(two, 16);
    expect(text).toBe(
      '&lead over=&key step=16n 0 ~ ~ 2 ~ ~ -1 ~ 4 ~ ~ ~ ~ ~ ~ ~ -1 ~ ~ 1 ~ ~ -2 ~ 3 ~ ~ ~ ~ ~ ~ ~',
    );
    expect(readLead(text, METERS['4/4'])).toEqual({ bars: 2, notes: two });
  });

  it('reads a line filed with the voice and card it carried before #580 as the line alone', () => {
    const line = leadText(BENT, 16);
    const before = [line, ...RETIRED_LEAD_VOICE].join('\n');
    expect(leadAlone(before)).toBe(line);
    expect(leadAlone(line)).toBe(line);
    expect(readLead(before, METERS['4/4'])).toEqual(readLead(line, METERS['4/4']));
  });

  it('plays in cells, on cells’ lead instrument, what the lead plays of it: each note the key’s degree from the tonic, altered', () => {
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
  bench: { meter: METERS['4/4'], meterFragment: 'meter' },
  point: { sync: 0.5, harm: 0.5, bite: 0.5, mood: 0.5 },
  source: 'Ada',
  created: 'song 1, bar 0',
  tags: ['lead line'],
};

/** Motifs that share another's point, and the one found first there. */
const SHARED: Readonly<Record<string, string>> = { wail: 'lament', weinet: 'haenschen' };

describe('the lead’s repository (#424)', () => {
  it('holds cells’ motifs as its seeds, each found first at its own point in every meter it fits, a rest after it; the presets’ ten in 4/4 and 5/4, and 3/4 its own (#520, yggi/cells#370)', () => {
    expect(MOTIF_LEADS.map((f) => f.id)).toEqual(MOTIF_FRAGMENTS.map((f) => f.id));
    const at = (name: keyof typeof METERS) => ({ meter: METERS[name], meterFragment: name });
    const fits = new Map<string, string[]>();
    for (const motif of MOTIF_LEADS) {
      const { point } = motif.association[0]!;
      for (const name of Object.keys(METERS) as (keyof typeof METERS)[]) {
        const found = LEAD_REPOSITORY.query(point, at(name), EMPTY_LAYER);
        if (!found.some((f) => f.id === motif.id)) continue;
        // (two pairs share one point since cells v0.23.0: wail's bite is lament's, .25, and haenschen's weinet's, .7,
        // where their articulations were .3 and .25, .6 and .7; each is found at distance 0 there, the one found first
        // named in `SHARED`)
        const first = SHARED[motif.id] ?? motif.id;
        expect(found[0], `${motif.id} in ${name}`).toEqual({ id: first, distance: 0, score: 0 });
        expect(found.find((f) => f.id === motif.id)?.distance, `${motif.id} in ${name}`).toBe(0);
        fits.set(motif.id, [...(fits.get(motif.id) ?? []), name]);
      }
      expect(fits.get(motif.id)?.length, motif.id).toBeGreaterThan(0);
    }
    for (const id of [
      'hook',
      'octaves',
      'sigh',
      'rising',
      'lazy',
      'riff',
      'tresillo',
      'bebop',
      'gypsy',
      'diesIrae',
    ])
      expect(fits.get(id), id).toEqual(expect.arrayContaining(['4/4', '5/4']));
    // (3/4 had none until cells' waltz and music box)
    expect([...fits].filter(([, names]) => names.includes('3/4')).map(([id]) => id)).toEqual(
      expect.arrayContaining(['waltz', 'musicBox']),
    );
  });

  it('reads a motif as a lead line on its own degrees of the key: the Dies irae from the third, a step down, back, a third down, a step up, a third down and a step up, held; in 5/4 a rest after it (#520, #529)', () => {
    const lead = MOTIF_LEADS.find((f) => f.id === 'diesIrae')!;
    expect(lead.text).toBe('&lead over=&key step=8n 2 1 2 0 1 -1 0@2');
    expect(lead.association.map((p) => p.facet)).toEqual(['lead']);
    const line = [
      [0, 2],
      [2, 1],
      [4, 2],
      [6, 0],
      [8, 1],
      [10, -1],
      [12, 0],
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

  it('files a line again as the one a layer kept before #580 holds with the lead’s voice, once the layer is read alone (`leadsAlone`)', () => {
    const repository = leadRepository();
    const once = repository.file!(EMPTY_LAYER, FILING);
    const file = once.layer.filed[0]!;
    const kept: LearnedLayer = {
      ...once.layer,
      filed: [
        {
          ...file,
          fragment: {
            ...file.fragment,
            text: [file.fragment.text, ...RETIRED_LEAD_VOICE].join('\n'),
          },
        },
      ],
    };
    const alone = leadsAlone(kept);
    expect(alone.filed[0]!.fragment.text).toBe(file.fragment.text);
    expect(repository.file!(alone, { ...FILING, source: 'Bo' })).toMatchObject({
      id: once.id,
      held: true,
    });
    // (a layer with nothing to drop is the same layer)
    expect(leadsAlone(once.layer)).toBe(once.layer);
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
    expect(LEAD_FORM.id).toBe('call_and_answer');
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
      [2, 1, 2, 0, 1, -1, 0],
      [0, -1, 0, -2, -1, -3, -2],
    ]);
  });

  it('keeps the degrees as written of cells’ motifs and of the composer’s variations of them, not of a line the Muse filed or its variations (#529)', () => {
    const repository = leadRepository();
    expect(MOTIF_LEADS.every((f) => repository.keyed!(f.id, EMPTY_LAYER))).toBe(true);
    const filed = repository.file!(EMPTY_LAYER, FILING);
    expect(repository.keyed!(filed.id, filed.layer)).toBe(false);
    // (a variation is filed with the line it varies, as the ladder files one)
    const of = (layer: LearnedLayer, varies: string, degree: number) =>
      repository.file!(layer, {
        ...FILING,
        notes: [{ step: 0, degree, alter: 0 }],
        varies,
        by: `transpose &lead ${degree}`,
      });
    const seedVaried = of(filed.layer, 'diesIrae', 4);
    const twice = of(seedVaried.layer, seedVaried.id, 6);
    const heardVaried = of(twice.layer, filed.id, 5);
    expect(repository.keyed!(seedVaried.id, heardVaried.layer)).toBe(true);
    expect(repository.keyed!(twice.id, heardVaried.layer)).toBe(true);
    expect(repository.keyed!(heardVaried.id, heardVaried.layer)).toBe(false);
    expect(keyedLine(MOTIF_LEADS, 'nowhere', heardVaried.layer)).toBe(false);
  });
});
