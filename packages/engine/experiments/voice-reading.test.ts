import { describe, expect, it } from 'vitest';
import { voiceResults } from './voice-reading.ts';

const { voices, fill } = voiceResults();
const of = (voice: string) => voices.find((v) => v.voice === voice)!;

describe('one voice of the band read alone (E26)', () => {
  it('lets every voice say something of the style by itself: each recognises its preset well above chance (E26)', () => {
    for (const v of voices) expect(v.recognised, v.voice).toBeGreaterThan(2 * (1 / 8));
  });

  it('lets the bass say most and the drums least of the style, by the axes each voice has (E26)', () => {
    const order = [...voices].sort((a, b) => b.recognised - a.recognised).map((v) => v.voice);
    expect(order).toEqual(['bass', 'comp', 'lead', 'drums']);
  });

  it('keeps a voice near its own landmark: within 0.2 on average, the comp nearest (E26)', () => {
    for (const v of voices) expect(v.distance, v.voice).toBeLessThan(0.2);
    expect(of('comp').distance).toBeLessThan(of('bass').distance);
  });

  it('reads a bar with a drum fill slightly farther from the drums’ landmark, and not by enough to tell it alone (E26)', () => {
    expect(fill.withFill).toBeGreaterThan(fill.without);
    expect(fill.farther).toBeGreaterThan(0.5);
    expect(fill.farther).toBeLessThan(0.7);
  });
});
