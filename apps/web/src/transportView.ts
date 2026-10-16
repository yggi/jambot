/**
 * What the transport header says and lights: the bar's pulses as cells, as
 * long as each pulse is in eighths, so 7/8 reads 3+2+2 at a glance; which
 * cell the step heard is in, and the eighth in it; and its two lines, the
 * section and bar heard over the tempo, the meter and the key, or the
 * count-in and the ending where the song begins and ends.
 */

import { SECTION_BARS } from '@jambot/engine';
import { type Meter, STEPS_PER_EIGHTH, stepsOf } from '@jambot/theory';
import type { Phase } from './sessionState.ts';

/** Each pulse of the meter's bar, as its length in eighths, the downbeat's first. */
export function transportCells(meter: Meter): number[] {
  const { heights, cycle } = meter;
  return heights.map((height, i) => (heights[i + 1] ?? cycle) - height);
}

/** The cell the step heard is in, and the eighth in that cell, from 0; null before anything is heard. */
export function transportHeard(
  meter: Meter,
  step: number | null,
): { cell: number; within: number } | null {
  if (step === null) return null;
  const steps = stepsOf(meter);
  const eighth = Math.floor((((step % steps) + steps) % steps) / STEPS_PER_EIGHTH);
  let cell = meter.heights.length - 1;
  while (meter.heights[cell]! > eighth) cell--;
  return { cell, within: eighth - meter.heights[cell]! };
}

export interface TransportState {
  /** The tempo the band plays at. */
  bpm: number;
  /** The bar heard, or the one the song opens on before anything is. */
  bar: { section: string; barInSection: number; key: string; meterName: string } | null;
  phase: Phase | null;
  /** Whether the band is playing or about to. */
  playing: boolean;
  /** Whether a step of the song is heard yet. */
  heard: boolean;
  /** The beats of the count-in still to come, the one heard among them. */
  beatsLeft: number | null;
}

/** The transport's two lines: the main one, large, and the one under it. */
export function transportLine({ bpm, bar, phase, playing, heard, beatsLeft }: TransportState): {
  main: string;
  sub: string;
} {
  const time = [`${Math.round(bpm)} BPM`, ...(bar ? [bar.meterName, bar.key] : [])].join(' · ');
  if (phase === 'counting') return { main: `Count-in · ${beatsLeft ?? ''}`.trim(), sub: time };
  if (heard && bar) {
    const main = `${bar.section} ${bar.barInSection + 1}/${SECTION_BARS}`;
    return { main, sub: phase === 'ending' ? 'Ending · stop again to stop now' : time };
  }
  if (playing) return { main: '…', sub: time };
  return { main: 'Ready', sub: bar ? `Opens on ${bar.section} · ${time}` : time };
}
