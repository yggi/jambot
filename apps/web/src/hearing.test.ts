// @vitest-environment node
import {
  presetMode,
  type BandBar,
  type BandCarried,
  BASS_REPOSITORY,
  HARMONY_REPOSITORY,
  LEAD_REPOSITORY,
  LEAN_AHEAD,
  LEAN_STEP,
  METER_REPOSITORY,
  NO_LEAN,
  PRESETS,
  RHYTHM_REPOSITORY,
  SECTION_BARS,
  band,
  bandOf,
  leanAt,
  leanedEntropy,
  presetSwing,
  restlessOf,
  shareOf,
  SHARE_BARS,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { type Ear, type HearAsk, type Heard, inlineEar } from './ear.ts';
import { Hearing, type HearingReadout, hearingSummary } from './hearing.ts';

const ENTROPY = 0.3;

/**
 * A preset played for `bars` bars as the page's band plays it, each bar at the players' entropy leaned as the
 * hearing leans it, restless where the lean passes entropy 1, and each told to the hearing as composed, then `after` it.
 */
function play(hearing: Hearing, name: string, bars: number, after = () => {}): BandBar[] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  const out: BandBar[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const restless = restlessOf(ENTROPY, leanAt(hearing.leans, bar));
    const made = band.advance(
      {
        ...(restless > 0 ? { restless } : {}),
        seed: 1,
        bar,
        style: { ...preset.style, entropy: leanedEntropy(ENTROPY, leanAt(hearing.leans, bar)) },
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
    out.push(made.output);
    hearing.composed([made.output], null, () => ENTROPY);
    after();
  }
  return out;
}

/** An ear that answers only when told to, in order, as a worker answers a while later. */
function laterEar(): Ear & { flush(): void } {
  const inline = inlineEar();
  const waiting: [HearAsk, (heard: Heard) => void][] = [];
  return {
    begin() {},
    end() {},
    hear: (ask, answer) => void waiting.push([ask, answer]),
    flush() {
      for (const [ask, answer] of waiting.splice(0)) inline.hear(ask, answer);
    },
  };
}

describe('the homeostat on the page (#495)', () => {
  it('reads each section at its last bar, and leans from two sections on, Funk bored at entropy 0.3', () => {
    const hearing = new Hearing(inlineEar());
    hearing.begin();
    const leaned: number[] = [];
    hearing.leaned = () => leaned.push(hearing.leans.length);
    play(hearing, 'Funk', 6 * SECTION_BARS);
    const { sections, leans, homeostat, late } = hearing.readout;
    expect(sections.map((s) => s.section)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(sections.map((s) => s.from)).toEqual(
      sections.map((s) => (s.section + LEAN_AHEAD) * SECTION_BARS),
    );
    expect(sections.map((s) => s.entropy)).toEqual(Array(6).fill(ENTROPY));
    // (bored, above the band at sections 0, 3, 4 and 5, each a step up two sections on, past entropy 1 into restlessness from 6, to the top from 7)
    const { high } = bandOf(ENTROPY);
    expect(sections.map((s) => s.share! > high)).toEqual([true, false, false, true, true, true]);
    expect(leans).toEqual([
      { bar: 2 * SECTION_BARS, lean: LEAN_STEP },
      { bar: 5 * SECTION_BARS, lean: 2 * LEAN_STEP },
      { bar: 6 * SECTION_BARS, lean: 3 * LEAN_STEP },
      { bar: 7 * SECTION_BARS, lean: 2 - ENTROPY },
    ]);
    expect(leaned.length).toBe(leans.length);
    expect(homeostat.reversals).toBe(0);
    expect(late).toBe(0);
  });

  it('reads a section’s share over the last sixteen bars, its own and the section’s before (#536)', () => {
    const heard: Heard[] = [];
    const inline = inlineEar();
    const hearing = new Hearing({
      begin() {},
      end() {},
      hear: (ask, answer) =>
        inline.hear(ask, (h) => {
          heard.push(h);
          answer(h);
        }),
    });
    hearing.begin();
    play(hearing, 'Funk', 4 * SECTION_BARS);
    expect(SHARE_BARS).toBe(2 * SECTION_BARS);
    const over = (last: number) =>
      shareOf(
        heard.filter((h) => h.bar > last - SHARE_BARS && h.bar <= last).map((h) => h.recognition),
      );
    expect(hearing.readout.sections.map((s) => s.share)).toEqual(
      [0, 1, 2, 3].map((section) => over((section + 1) * SECTION_BARS - 1)),
    );
    // (and not the section's own eight alone, which reads otherwise here)
    const own = (section: number) =>
      shareOf(
        heard.filter((h) => Math.floor(h.bar / SECTION_BARS) === section).map((h) => h.recognition),
      );
    expect(hearing.readout.sections.map((s) => s.share).slice(1)).not.toEqual([1, 2, 3].map(own));
  });

  it('keeps every bar’s cost, on the page’s thread and the ear’s', () => {
    const hearing = new Hearing(inlineEar());
    hearing.begin();
    play(hearing, 'Funk', 2 * SECTION_BARS);
    const { costs } = hearing.readout;
    expect(costs.map((c) => c.bar)).toEqual([...Array(2 * SECTION_BARS).keys()]);
    for (const c of costs) {
      expect(c.main).toBeGreaterThanOrEqual(c.ear);
      expect(c.ear).toBeGreaterThan(0);
    }
  });

  it('hears alike whether the ear answers at once or after the bar is composed, in time', () => {
    const at = new Hearing(inlineEar());
    at.begin();
    play(at, 'Funk', 3 * SECTION_BARS);
    const ear = laterEar();
    const later = new Hearing(ear);
    later.begin();
    let bars = 0;
    play(later, 'Funk', 3 * SECTION_BARS, () => {
      expect(later.readout.costs).toHaveLength(bars++);
      ear.flush();
    });
    const of = (h: Hearing) => h.readout.sections.map(({ share, from }) => ({ share, from }));
    expect(of(later)).toEqual(of(at));
  });

  it('leans the first section whose text is still to be asked where a reading comes late, and counts it', () => {
    const ear = laterEar();
    const hearing = new Hearing(ear);
    hearing.begin();
    // (section 0's reading comes once section 1's middle bar is composed, and section 2's text with it asked for)
    play(hearing, 'Funk', 2 * SECTION_BARS);
    ear.flush();
    const { sections, late } = hearing.readout;
    expect(sections.map((s) => s.from)).toEqual([3 * SECTION_BARS, 3 * SECTION_BARS]);
    expect(late).toBe(1);
  });

  it('starts each song unleaned, and plays the next one unleaned once a song ends, its readout kept', () => {
    const hearing = new Hearing(inlineEar());
    hearing.begin();
    play(hearing, 'Funk', 4 * SECTION_BARS);
    expect(hearing.leans.length).toBeGreaterThan(0);
    hearing.end();
    expect(hearing.leans).toEqual([]);
    expect(hearing.readout.sections).toHaveLength(4);
    hearing.begin();
    expect(hearing.readout).toEqual({
      homeostat: NO_LEAN,
      leans: [],
      sections: [],
      late: 0,
      costs: [],
    });
  });
});

describe('a song’s homeostat summed up for a soak (hearingSummary)', () => {
  it('spreads the costs, the ear’s over the first bars and the last apart, and counts the sections inside the band and the reversals per four', () => {
    const { low, high } = bandOf(ENTROPY);
    const readout: HearingReadout = {
      homeostat: { ...NO_LEAN, reversals: 1 },
      leans: [{ bar: 32, lean: 0.5 }],
      sections: [high + 0.1, low, null, (low + high) / 2, low - 0.1, high, high + 0.2, 0.5].map(
        (share, section) => ({ section, share, entropy: ENTROPY, lean: 0, from: section * 8 + 16 }),
      ),
      late: 2,
      costs: [...Array(40).keys()].map((bar) => ({ bar, main: bar / 10, ear: bar < 10 ? 4 : 5 })),
    };
    const summary = hearingSummary(readout, 9, 29);
    expect(summary.main).toEqual({ count: 40, p50: 1.9, p95: 3.7, max: 3.9 });
    expect(summary.ear.first).toEqual({ count: 10, p50: 4, p95: 4, max: 4 });
    expect(summary.ear.last).toEqual({ count: 10, p50: 5, p95: 5, max: 5 });
    // (inside: low, the middle, high and 0.5, of the seven read)
    expect(summary.inside).toBeCloseTo(4 / 7, 12);
    expect([summary.sections, summary.reversals, summary.late]).toEqual([8, 0.5, 2]);
    expect(summary.leans).toBe(readout.leans);
  });
});
