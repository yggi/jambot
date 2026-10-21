// @vitest-environment node
import {
  type BandBar,
  type BandCarried,
  PRESETS,
  SECTION_BARS,
  band,
  presetSwing,
} from '@jambot/engine';
import { playSection } from '@jambot/score';
import type { SectionText } from '@jambot/session';
import { describe, expect, it } from 'vitest';
import {
  type Answer,
  type Ask,
  type SectionStated,
  type TextWorker,
  WorkerTexts,
  answerAsk,
  digest,
  foreseenOf,
  inlineTexts,
  playText,
  stateSection,
  warmSection,
} from './section-texts.ts';

/** A preset's first section, or the one `from` on, as the band composes it at entropy 0.3, seed 1. */
function section(name: string, from = 0): BandBar[] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  return Array.from({ length: from + SECTION_BARS }, (_, bar) => {
    const made = band.advance(
      {
        seed: 1,
        bar,
        style: { ...preset.style, entropy: 0.3 },
        wish: { tonic: null, mode: preset.mode, melodic: null },
        swing: presetSwing(preset)!,
        offer: null,
      },
      carried,
      null,
    );
    carried = made.carried;
    return made.output;
  }).slice(from);
}

/** A section's text as a host tells it (`Shadow`'s `#tell`), from what the bars state: what goes on the wire, as JSON. */
const toldOf = (bars: readonly BandBar[], stated: SectionStated): SectionText => ({
  bar: bars[0]!.bar,
  step: bars[0]!.bar * 16,
  text: stated.source,
  unstated: stated.unstated,
  frame: stated.frame,
  foreseen: stated.foreseen,
  cut: stated.cut,
});

/** What a job states, its timing aside. */
const timeless = (stated: SectionStated) => ({ ...stated, cost: null });

/** A worker that answers on a later turn, as a real one does, from a copy of what it was asked, as a real one gets. */
function fakeWorker() {
  const worker: TextWorker & {
    received: Ask[];
    terminated: boolean;
    listeners: ((event: { data: Answer }) => void)[];
    failing: (() => void)[];
  } = {
    received: [],
    terminated: false,
    listeners: [],
    failing: [],
    addEventListener(type: 'message' | 'error', listener: (event: { data: Answer }) => void) {
      (type === 'message' ? worker.listeners : worker.failing).push(listener as never);
    },
    postMessage(message) {
      worker.received.push(message);
      const answer = structuredClone(answerAsk(structuredClone(message)));
      queueMicrotask(() => {
        if (!worker.terminated) worker.listeners.forEach((listener) => listener({ data: answer }));
      });
    },
    terminate() {
      worker.terminated = true;
    },
  };
  return worker;
}

describe('a section’s text, as a job (#406)', () => {
  it.each(PRESETS.map((p) => p.name))(
    'states %s’s first section from a copy of its bars as from the bars, as a worker gets them: the same text, the same notes played, and what each bar is checked by',
    (name) => {
      const bars = section(name);
      const here = stateSection(bars);
      expect(here.unstated).toBeNull();
      expect(here.error).toBeNull();
      expect(here.played!.bars).toHaveLength(SECTION_BARS);
      expect(here.foreseen).toEqual(bars.map(foreseenOf));
      expect(timeless(structuredClone(stateSection(structuredClone(bars))))).toEqual(
        timeless(here),
      );
    },
  );

  it('says why no text states a section whose key moves between its bars, and plays nothing', () => {
    const bars = section('Funk');
    const moved = bars.map((b, i) =>
      i < 4
        ? b
        : { ...b, plan: { ...b.plan, key: { ...b.plan.key, tonic: (b.plan.key.tonic + 1) % 12 } } },
    );
    const stated = stateSection(moved);
    expect(stated.unstated).toBe("the section's key moves between its bars: one text states one");
    expect(stated.played).toBeNull();
    expect(stated.foreseen).toHaveLength(SECTION_BARS);
  });

  it('plays the text as a test edits it, and says what cells threw', () => {
    const bars = section('Funk');
    const edited = stateSection(bars, (text) => `${text}\n// edited`);
    expect(edited.source.endsWith('// edited')).toBe(true);
    const broken = stateSection(bars, () => '&bar meter(');
    expect(broken.played === null || broken.played.diagnostics.length > 0).toBe(true);
  });

  it('answers on the thread that asks before `ask` returns, inline', () => {
    let answered: SectionStated | null = null;
    inlineTexts().ask(section('Funk'), (stated) => (answered = stated));
    expect(answered).not.toBeNull();
  });

  it('warms up on a text of its own, which cells compiles clean, answering nothing', () => {
    expect(warmSection()).toEqual([]);
    expect(answerAsk({ id: 3, warm: true })).toEqual({ id: 3, stated: null });
  });
});

describe('a section’s text on the wire, host to client (#446)', () => {
  it.each(PRESETS.map((p) => p.name))(
    'plays %s’s second section from the text and its frame alone, through JSON, as cells plays it from each of the bars',
    (name) => {
      const bars = section(name, SECTION_BARS);
      const host = stateSection(bars);
      const given: SectionText = JSON.parse(JSON.stringify(toldOf(bars, host)));
      const client = playText(given);
      expect(client.error).toBeNull();
      expect(client.played!.diagnostics).toEqual([]);
      expect(timeless(client)).toEqual(timeless(host));
      // One frame stands for every bar of a text: each bar's own reads the same.
      expect(client.played).toEqual(playSection(host.source, bars));
    },
  );

  it('sends the text, 2.6 to 6.3 KB a section as JSON, under 8 KB, where what cells plays from it is 4 to 12 times that', () => {
    const sizes = PRESETS.map((p) => {
      const bars = section(p.name, SECTION_BARS);
      const stated = stateSection(bars);
      return {
        text: JSON.stringify({ kind: 'section', ...toldOf(bars, stated) }).length,
        events: JSON.stringify({ kind: 'section', played: stated.played }).length,
      };
    });
    for (const { text, events } of sizes) {
      expect(text).toBeLessThan(8 * 1024);
      expect(events / text).toBeGreaterThan(4);
    }
    expect(Math.min(...sizes.map((s) => s.text))).toBeGreaterThan(2 * 1024);
    expect(Math.max(...sizes.map((s) => s.events / s.text))).toBeGreaterThan(10);
  });

  it('says where no text states the bars, and a client given that plays nothing, for the same reason', () => {
    const bars = section('Funk');
    const moved = bars.map((b, i) =>
      i < 4
        ? b
        : { ...b, plan: { ...b.plan, key: { ...b.plan.key, tonic: (b.plan.key.tonic + 1) % 12 } } },
    );
    const host = stateSection(moved);
    const client = playText(JSON.parse(JSON.stringify(toldOf(moved, host))));
    expect(client.played).toBeNull();
    expect(client.unstated).toBe(host.unstated);
    expect(client.foreseen).toEqual(host.foreseen);
  });

  it('checks a bar by a digest of what it was built from: the same bar sent through JSON reads the same, a note moved another', () => {
    const bars = section('Funk');
    const sent: BandBar[] = JSON.parse(JSON.stringify(bars));
    expect(sent.map(foreseenOf)).toEqual(bars.map(foreseenOf));
    const [first] = bars;
    const moved = {
      ...first!,
      written: first!.written.map((w, i) => (i === 0 ? { ...w, step: w.step + 1 } : w)),
    };
    expect(foreseenOf(moved)).not.toBe(foreseenOf(first!));
    expect(digest('a')).not.toBe(digest('b'));
    expect(digest('a')).toMatch(/^[0-9a-f]{1,14}$/);
  });
});

describe('WorkerTexts', () => {
  it('makes its worker as a song starts and warms it, once, and not before', () => {
    const made: ReturnType<typeof fakeWorker>[] = [];
    const texts = new WorkerTexts(() => {
      made.push(fakeWorker());
      return made.at(-1)!;
    });
    expect(made).toHaveLength(0);
    texts.begin();
    texts.begin();
    expect(made).toHaveLength(1);
    expect(made[0]!.received).toEqual([{ id: 1, warm: true }]);
  });

  it('gives each ask its own answer, on a later turn', async () => {
    const worker = fakeWorker();
    const texts = new WorkerTexts(() => worker);
    texts.begin();
    const [funk, bossa] = [section('Funk'), section('Bossa nova')];
    const answers: string[] = [];
    texts.ask(funk, (s) => answers.push(`funk ${s.source.length}`));
    texts.ask(bossa, (s) => answers.push(`bossa ${s.source.length}`));
    expect(answers).toEqual([]);
    await Promise.resolve();
    expect(answers).toEqual([
      `funk ${stateSection(funk).source.length}`,
      `bossa ${stateSection(bossa).source.length}`,
    ]);
  });

  it('ends its worker with the song: nothing asked is answered, and the next song makes another', async () => {
    const made: ReturnType<typeof fakeWorker>[] = [];
    const texts = new WorkerTexts(() => {
      made.push(fakeWorker());
      return made.at(-1)!;
    });
    texts.begin();
    let answered = 0;
    texts.ask(section('Funk'), () => answered++);
    texts.end();
    await Promise.resolve();
    expect(answered).toBe(0);
    expect(made[0]!.terminated).toBe(true);
    texts.begin();
    texts.ask(section('Funk'), () => answered++);
    await Promise.resolve();
    expect([made.length, answered]).toEqual([2, 1]);
  });

  it('plays a text a host gave in its worker, and on this thread where none starts', async () => {
    const worker = fakeWorker();
    const texts = new WorkerTexts(() => worker);
    texts.begin();
    const bars = section('Funk');
    const given = toldOf(bars, stateSection(bars));
    const answers: SectionStated[] = [];
    texts.play(given, (s) => answers.push(s));
    expect(answers).toEqual([]);
    await Promise.resolve();
    expect(worker.received.at(-1)).toEqual({ id: 2, given });
    expect(answers.map(timeless)).toEqual([timeless(playText(given))]);
    const none = new WorkerTexts(() => {
      throw new Error('no workers here');
    });
    none.play(given, (s) => answers.push(s));
    expect(answers).toHaveLength(2);
  });

  it('states on this thread where no worker starts, as the ticker falls back', () => {
    const texts = new WorkerTexts(() => {
      throw new Error('no workers here');
    });
    texts.begin();
    let answered = 0;
    texts.ask(section('Funk'), () => answered++);
    expect(answered).toBe(1);
  });

  it('states on this thread once its worker fails: the asks waiting on it, and every one after', () => {
    const worker = fakeWorker();
    worker.postMessage = (message) => void worker.received.push(message);
    const texts = new WorkerTexts(() => worker);
    texts.begin();
    let answered = 0;
    texts.ask(section('Funk'), () => answered++);
    expect(answered).toBe(0);
    worker.failing.forEach((fail) => fail());
    expect([answered, worker.terminated]).toEqual([1, true]);
    texts.ask(section('Funk'), () => answered++);
    expect(answered).toBe(2);
  });
});
