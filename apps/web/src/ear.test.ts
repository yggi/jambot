// @vitest-environment node
import {
  presetMode,
  type BandBar,
  type BandCarried,
  BASS_REPOSITORY,
  HARMONY_REPOSITORY,
  LEAD_REPOSITORY,
  METER_REPOSITORY,
  NOTHING_LATELY,
  PRESETS,
  RHYTHM_REPOSITORY,
  SECTION_BARS,
  band,
  createRecogniser,
  heardTexts,
  playedInto,
  presetSwing,
  recognisedBar,
} from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  type EarAnswer,
  type EarAsk,
  type EarWorker,
  type HearAsk,
  type Heard,
  WorkerEar,
  earWorker,
  hearBar,
  inlineEar,
} from './ear.ts';

/** A preset's first section as the page's band composes it, every member from its repository, at entropy 0.3, seed 1. */
function composedBars(name: string, bars = SECTION_BARS): BandBar[] {
  const preset = PRESETS.find((p) => p.name === name)!;
  let carried: BandCarried = band.initial;
  return Array.from({ length: bars }, (_, bar) => {
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

/** Each bar's ask, what was played lately carried from the bar before, as the page asks them. */
function asksOf(bars: readonly BandBar[]): HearAsk[] {
  let lately = NOTHING_LATELY;
  return bars.map((bar) => {
    const texts = heardTexts(bar);
    const ask = {
      bar: bar.bar,
      texts,
      bench: { meter: bar.plan.meter, meterFragment: bar.plan.meterFragment },
      layer: null,
      lately,
    };
    lately = playedInto(lately, texts);
    return ask;
  });
}

const funk = asksOf(composedBars('Funk'));

/** A worker that answers on a later turn, as a real one does, from a copy of what it was asked, as a real one gets. */
function fakeWorker() {
  const answer = earWorker();
  const worker: EarWorker & {
    received: EarAsk[];
    terminated: boolean;
    listeners: ((event: { data: EarAnswer }) => void)[];
    failing: (() => void)[];
  } = {
    received: [],
    terminated: false,
    listeners: [],
    failing: [],
    addEventListener(type: 'message' | 'error', listener: (event: { data: EarAnswer }) => void) {
      (type === 'message' ? worker.listeners : worker.failing).push(listener as never);
    },
    postMessage(message) {
      worker.received.push(message);
      const reply = structuredClone(answer(structuredClone(message)));
      queueMicrotask(() => {
        if (!worker.terminated) worker.listeners.forEach((listener) => listener({ data: reply }));
      });
    },
    terminate() {
      worker.terminated = true;
    },
  };
  return worker;
}

const recognitions = (heard: readonly Heard[]) => heard.map((h) => [h.bar, h.recognition]);

describe('a bar heard, as a job (#495)', () => {
  it('recognises each member as `recognisedBar` does against what was played lately, and times it', () => {
    const recogniser = createRecogniser();
    let t = 0;
    for (const ask of funk) {
      const heard = hearBar(recogniser, ask, () => (t += 3));
      expect(heard.recognition).toEqual(
        recognisedBar(createRecogniser(), ask.texts, ask.bench, undefined, 0, ask.lately),
      );
      expect([heard.bar, heard.cost]).toEqual([ask.bar, 3]);
    }
  });

  it('hears a section’s bars repeated as recognised: what was played lately is what is known', () => {
    const heard = funk.map((ask) => hearBar(createRecogniser(), ask));
    const all = heard.flatMap((h) => Object.values(h.recognition));
    expect(all.filter(Boolean).length / all.length).toBeGreaterThan(0.5);
  });

  it('answers on the thread that asks before `hear` returns, inline', () => {
    const answers: Heard[] = [];
    inlineEar().hear(funk[0]!, (h) => answers.push(h));
    expect(answers).toHaveLength(1);
  });

  it('warms up on every member’s seeds and answers nothing, then hears as a cold recogniser does: the cache changes no answer', () => {
    const answer = earWorker();
    expect(answer({ id: 1, warm: true })).toEqual({ id: 1, heard: null });
    const warm = funk.map((ask, i) => answer({ id: i + 2, hear: ask }).heard!);
    const cold = funk.map((ask) => hearBar(createRecogniser(), ask));
    expect(recognitions(warm)).toEqual(recognitions(cold));
  });
});

describe('WorkerEar', () => {
  it('makes its worker as a song starts and warms it, once, and hears each bar there on a later turn', async () => {
    const made: ReturnType<typeof fakeWorker>[] = [];
    const ear = new WorkerEar(() => {
      made.push(fakeWorker());
      return made.at(-1)!;
    });
    expect(made).toHaveLength(0);
    ear.begin();
    ear.begin();
    expect(made).toHaveLength(1);
    expect(made[0]!.received).toEqual([{ id: 1, warm: true }]);
    const answers: Heard[] = [];
    for (const ask of funk.slice(0, 2)) ear.hear(ask, (h) => answers.push(h));
    expect(answers).toEqual([]);
    await Promise.resolve();
    expect(recognitions(answers)).toEqual(
      recognitions(funk.slice(0, 2).map((ask) => hearBar(createRecogniser(), ask))),
    );
  });

  it('ends its worker with the song: nothing asked is answered', async () => {
    const worker = fakeWorker();
    const ear = new WorkerEar(() => worker);
    ear.begin();
    let answered = 0;
    ear.hear(funk[0]!, () => answered++);
    ear.end();
    await Promise.resolve();
    expect([answered, worker.terminated]).toEqual([0, true]);
  });

  it('hears on this thread where no worker starts, and once its worker fails: the bars waiting on it, and every one after', () => {
    const none = new WorkerEar(() => {
      throw new Error('no workers here');
    });
    let answered = 0;
    none.hear(funk[0]!, () => answered++);
    expect(answered).toBe(1);
    const worker = fakeWorker();
    worker.postMessage = (message) => void worker.received.push(message);
    const ear = new WorkerEar(() => worker);
    ear.begin();
    ear.hear(funk[0]!, () => answered++);
    expect(answered).toBe(1);
    worker.failing.forEach((fail) => fail());
    expect([answered, worker.terminated]).toEqual([2, true]);
    ear.hear(funk[1]!, () => answered++);
    expect(answered).toBe(3);
  });
});
