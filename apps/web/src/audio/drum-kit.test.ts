import { describe, expect, it } from 'vitest';
import { DRUM_NOTES, TOM_NOTES } from '@jambot/engine';
import { fakeAudioContext } from './fake-context.ts';
import { drumKit } from './drums.ts';

/** The built-in kit on a fake context, a note struck at 1 s: the oscillators and the filters it made. */
function struck(note: number, velocity = 100) {
  const fake = fakeAudioContext();
  const out = fake.context.destination;
  drumKit(fake.context as unknown as BaseAudioContext, out as unknown as AudioNode).play(
    note,
    velocity,
    1,
  );
  return fake;
}

/** An oscillator's pitch: where its frequency starts, and where it falls to. */
const pitch = (o: { frequency: { events: [string, ...number[]][] } }) =>
  o.frequency.events.map(([, hz]) => hz);

describe('the built-in drum kit', () => {
  it('strikes each tom as a drum, a pitch that falls, lower to higher from the low tom to the high, not as a hat (#651)', () => {
    const { lowTom, midTom, highTom } = TOM_NOTES;
    const tops = [lowTom, midTom, highTom].map((note) => {
      const { oscillators, filters } = struck(note);
      expect(filters, String(note)).toEqual([]);
      expect(oscillators, String(note)).toHaveLength(1);
      const [from, to] = pitch(oscillators[0]!);
      expect(to!, String(note)).toBeLessThan(from!);
      expect(oscillators[0]!.started).toBe(1);
      return to!;
    });
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(new Set(tops).size).toBe(3);
    // (the kick's pitch is lower still)
    const [, kick] = pitch(struck(DRUM_NOTES.kick).oscillators[0]!);
    expect(kick!).toBeLessThan(tops[0]!);
  });

  it('strikes a hat as filtered noise, as before', () => {
    const { oscillators, filters } = struck(DRUM_NOTES.closedHat);
    expect(oscillators).toEqual([]);
    expect(filters.map((f) => f.type)).toEqual(['highpass']);
  });
});
