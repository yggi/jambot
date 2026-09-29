import { describe, expect, it } from 'vitest';
import { BAR_STEPS, type HeardNote, type Key } from '../src/index.ts';
import {
  AS_HEARD,
  AS_PHRASES,
  BAR,
  BASELINE,
  type Hearing,
  type PhraseRate,
  type Segment,
  beatPattern,
  PATTERNS,
  TRIALS,
  humanise,
  pattern,
  phraseRate as measure,
  played,
  readingRate,
  stepMs,
} from './humanise.ts';

const KEY: Key = { tonic: 9, mode: 'aeolian' };

/** `phraseRate`, measured once for each hearing, sloppiness and kind of pattern: the same numbers are read by several tests. */
const measured = new Map<Hearing, Map<string, PhraseRate>>();
function phraseRate(
  hearing: Hearing,
  sloppiness: number,
  key: Key,
  seed = 1,
  source: (index: number) => Segment[] = pattern,
): PhraseRate {
  const cache = measured.get(hearing) ?? new Map<string, PhraseRate>();
  measured.set(hearing, cache);
  const id = `${sloppiness}/${seed}/${source === pattern ? 'unit' : 'beats'}`;
  if (!cache.has(id)) cache.set(id, measure(hearing, sloppiness, key, seed, source));
  return cache.get(id)!;
}
const range = (n: number) => [...Array(n).keys()];
const sd = (xs: number[]) => {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
};

describe('the humaniser', () => {
  const exact = played(pattern(3), BAR, 3);

  it('plays a bar exactly as written at no sloppiness', () => {
    expect(humanise(exact, 0, 1, 0)).toEqual(exact);
  });

  it('is keyed: the same seed and trial give the same hand, another trial another', () => {
    expect(humanise(exact, 40, 1, 7)).toEqual(humanise(exact, 40, 1, 7));
    expect(humanise(exact, 40, 1, 7)).not.toEqual(humanise(exact, 40, 1, 8));
  });

  it('moves the same notes the same way, further as the sloppiness grows', () => {
    const at = (s: number) =>
      humanise(exact, s, 1, 4).map((n, i) => n.position - exact[i]!.position);
    at(20).forEach((shift, i) => expect(at(40)[i]).toBeCloseTo(2 * shift, 9));
  });

  it('puts the first note off by about sloppiness √2 (offset and jitter), measured in ms', () => {
    const shifts = range(4000).map(
      (trial) => (humanise(exact, 40, 1, trial)[0]!.position - exact[0]!.position) * stepMs(),
    );
    expect(sd(shifts)).toBeGreaterThan(40 * Math.SQRT2 * 0.93);
    expect(sd(shifts)).toBeLessThan(40 * Math.SQRT2 * 1.07);
  });

  it('holds a note shorter as the player gets sloppier, and leaves a held note held', () => {
    const held = (s: number) =>
      range(2000).reduce((sum, trial) => {
        const n = humanise(exact, s, 1, trial)[0]!;
        return sum + (n.end! - n.position);
      }, 0) /
      2000 /
      (exact[0]!.end! - exact[0]!.position);
    expect(held(20)).toBeGreaterThan(held(100));
    expect(held(100)).toBeLessThan(0.85);
    const open: HeardNote[] = exact.map((n) => ({ ...n, end: null }));
    expect(humanise(open, 40, 1, 0).every((n) => n.end === null)).toBe(true);
  });
});

describe('the patterns', () => {
  it('fill exactly one bar, in every one of them', () => {
    for (let index = 0; index < PATTERNS; index++)
      expect(
        pattern(index)
          .map((s) => s.length)
          .reduce((a, b) => a + b, 0),
      ).toBe(BAR_STEPS);
  });

  it('use every dominant unit and have both rests and mixed lengths', () => {
    const all = range(PATTERNS).map(pattern);
    for (const unit of [1, 2, 4])
      expect(all.some((p) => p.filter((s) => s.length === unit).length > p.length / 2)).toBe(true);
    expect(all.some((p) => p.some((s) => s.rest))).toBe(true);
    expect(all.some((p) => new Set(p.map((s) => s.length)).size >= 3)).toBe(true);
  });
});

describe('the yardstick, before a reader is measured with it', () => {
  it('gives 0% to a reader that hears nothing, and counts why', () => {
    const rate = readingRate(() => [], 40, KEY);
    expect(rate.right).toBe(0);
    expect(rate.causes.noMotif).toBe(rate.bars);
  });

  it('takes bars from the patterns whose exact playing the Muse takes as a motif', () => {
    const rate = readingRate(BASELINE, 0, KEY);
    expect(rate.bars).toBeGreaterThan(800);
    expect(rate.bars).toBeLessThanOrEqual(PATTERNS * TRIALS);
  });
});

/**
 * The baseline: the reading that exists (`judgeBar`, each note on the nearest
 * step), recorded as literals to ±3 points (E17). A better reading raises
 * them, and when a step does, its test here becomes a floor the reading must
 * stay above: the pawl (ratchet W3). Until then they say how bad it is.
 */
describe('the Muse’s baseline reading of a sloppy hand (E17)', () => {
  const rate = (sloppiness: number) => readingRate(BASELINE, sloppiness, KEY);

  it('reads an exact hand right every time, and 10 ms off nearly every time', () => {
    const exact = rate(0);
    expect(exact.right).toBe(exact.bars);
    const near = rate(10);
    expect(near.right / near.bars).toBeGreaterThan(0.97);
  });

  it.each([
    [20, 0.69],
    [30, 0.27],
    [60, 0.01],
  ])('reads %i ms of sloppiness right about %f of the time', (sloppiness, expected) => {
    const r = rate(sloppiness);
    expect(Math.abs(r.right / r.bars - expected)).toBeLessThan(0.03);
  });

  it('loses more the sloppier the hand', () => {
    const shares = [0, 10, 20, 30, 40, 60, 100].map((s) => {
      const r = readingRate(BASELINE, s, KEY);
      return r.right / r.bars;
    });
    shares.forEach((share, i) => i > 0 && expect(share).toBeLessThan(shares[i - 1]!));
  });

  it('mostly loses to rests that were never meant, and a note strayed into the bar before', () => {
    const r = readingRate(BASELINE, 30, KEY);
    expect(r.causes.rests / r.bars).toBeGreaterThan(0.5);
    expect(r.causes.strayed / r.bars).toBeGreaterThan(0.05);
  });
});

/**
 * Phrases (#204's step 1): two phrases of one to three bars with an empty bar between,
 * each humanised alone. The nearest-step reading is the baseline, and
 * reading each phrase as one span, with its rests as a player's articulation
 * or a plausible rest (`readHeard`), must never do worse than it and does
 * better from 20 ms: recorded as literals to ±3 points (E17).
 */
describe('reading phrases of a sloppy hand (E17)', () => {
  const share = (r: { bars: number }, n: number) => n / r.bars;

  it('reads an exact hand right both ways, and a hearing of nothing not at all', () => {
    for (const hearing of [AS_HEARD, AS_PHRASES]) {
      const r = phraseRate(hearing, 0, KEY);
      expect(r.bars).toBeGreaterThan(3000);
      expect(r.right).toBe(r.bars);
      expect(r.onsets).toBe(r.bars);
      expect(r.strayed).toBe(0);
    }
    const nothing = phraseRate(() => [], 20, KEY);
    expect(nothing.right).toBe(0);
    expect(nothing.onsets).toBe(0);
  });

  it.each([
    [20, 0.691, 0.829, 0.704],
    [30, 0.273, 0.465, 0.302],
  ])(
    'the nearest step, at %i ms, reads %f of the bars, puts %f of their onsets and %f of their rests right',
    (s, right, onsets, rests) => {
      const r = phraseRate(AS_HEARD, s, KEY);
      expect(Math.abs(share(r, r.right) - right)).toBeLessThan(0.03);
      expect(Math.abs(share(r, r.onsets) - onsets)).toBeLessThan(0.03);
      expect(Math.abs(share(r, r.rests) - rests)).toBeLessThan(0.03);
    },
  );

  it.each([
    [10, 0.999, 1, 0.999],
    [20, 0.848, 0.932, 0.877],
    [30, 0.46, 0.566, 0.638],
    [40, 0.231, 0.3, 0.447],
  ])(
    'a phrase read whole, at %i ms, reads %f of the bars, puts %f of their onsets and %f of their rests right',
    (s, right, onsets, rests) => {
      const r = phraseRate(AS_PHRASES, s, KEY);
      expect(Math.abs(share(r, r.right) - right)).toBeLessThan(0.03);
      expect(Math.abs(share(r, r.onsets) - onsets)).toBeLessThan(0.03);
      expect(Math.abs(share(r, r.rests) - rests)).toBeLessThan(0.03);
    },
    60_000,
  );

  it('is never worse than the nearest step up to 50 ms, in right bars, onsets, rests or notes strayed', () => {
    for (const s of [10, 20, 30, 40, 50]) {
      const heard = phraseRate(AS_HEARD, s, KEY);
      const read = phraseRate(AS_PHRASES, s, KEY);
      expect(read.right).toBeGreaterThanOrEqual(heard.right);
      expect(read.onsets).toBeGreaterThanOrEqual(heard.onsets);
      expect(read.rests).toBeGreaterThanOrEqual(heard.rests);
      expect(read.strayed).toBeLessThanOrEqual(heard.strayed);
    }
  }, 60_000);

  it('is no worse than the nearest step from 60 ms, by a point, in onsets, and better in rests', () => {
    for (const s of [60, 100]) {
      const heard = phraseRate(AS_HEARD, s, KEY);
      const read = phraseRate(AS_PHRASES, s, KEY);
      expect(read.right / read.bars).toBeGreaterThan(heard.right / heard.bars - 0.01);
      expect(read.onsets / read.bars).toBeGreaterThan(heard.onsets / heard.bars - 0.01);
      expect(read.rests).toBeGreaterThan(heard.rests);
    }
  }, 60_000);
});

/**
 * Bars whose beats divide by themselves (a quarter, eighths, sixteenths, a
 * mix): where one note value for a whole phrase can't hold. Recorded as
 * literals to ±3 points, and the reading must stay no worse than the
 * nearest step up to 40 ms (E17).
 */
describe('reading phrases whose beats divide by themselves (E17)', () => {
  const rate = (hearing: Hearing, s: number) => phraseRate(hearing, s, KEY, 1, beatPattern);

  it('reads an exact hand right both ways', () => {
    for (const hearing of [AS_HEARD, AS_PHRASES]) {
      const r = rate(hearing, 0);
      expect(r.bars).toBeGreaterThan(3000);
      expect(r.right).toBe(r.bars);
    }
  });

  it.each([
    [20, AS_HEARD, 0.7, 0.789, 0.713],
    [30, AS_HEARD, 0.253, 0.37, 0.275],
    [20, AS_PHRASES, 0.816, 0.917, 0.855],
    [30, AS_PHRASES, 0.344, 0.446, 0.537],
  ])(
    'at %i ms, reads %f of the bars, %f of their onsets and %f of their rests right',
    (s, hearing, right, onsets, rests) => {
      const r = rate(hearing, s);
      expect(Math.abs(r.right / r.bars - right)).toBeLessThan(0.03);
      expect(Math.abs(r.onsets / r.bars - onsets)).toBeLessThan(0.03);
      expect(Math.abs(r.rests / r.bars - rests)).toBeLessThan(0.03);
    },
    60_000,
  );

  it('is never worse than the nearest step up to 40 ms', () => {
    for (const s of [10, 20, 30, 40]) {
      const heard = rate(AS_HEARD, s);
      const read = rate(AS_PHRASES, s);
      expect(read.right).toBeGreaterThanOrEqual(heard.right);
      expect(read.onsets).toBeGreaterThanOrEqual(heard.onsets);
      expect(read.strayed).toBeLessThanOrEqual(heard.strayed);
    }
  }, 60_000);
});
