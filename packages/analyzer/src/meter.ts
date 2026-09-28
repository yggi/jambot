/**
 * A file's time-signature events, turned into spans. Only a 4/4 span is
 * quantised (`swing.ts`); every other one is reported, never forced onto
 * the grid or silently dropped (analyzer brief step 1; #116 question (l)).
 */

/** A time-signature change, at the tick it takes effect. */
export interface TimeSignatureEvent {
  readonly ticks: number;
  readonly numerator: number;
  readonly denominator: number;
}

/** A span of one meter, from its own start tick to the next change or the file's end. */
export interface MeterSpan {
  readonly startTicks: number;
  readonly endTicks: number;
  readonly numerator: number;
  readonly denominator: number;
  readonly isFourFour: boolean;
}

const DEFAULT_METER = { numerator: 4, denominator: 4 };

/** The file's meter, as spans; a file that states none is 4/4 throughout. */
export function meterSpans(events: readonly TimeSignatureEvent[], endTicks: number): MeterSpan[] {
  const byTick = new Map<number, { numerator: number; denominator: number }>();
  for (const event of events) byTick.set(event.ticks, event);
  if (!byTick.has(0)) byTick.set(0, DEFAULT_METER);
  const sorted = [...byTick.entries()].sort(([a], [b]) => a - b);
  return sorted.map(([startTicks, meter], index) => {
    const next = sorted[index + 1];
    const spanEnd = next ? next[0] : Math.max(endTicks, startTicks);
    return {
      startTicks,
      endTicks: spanEnd,
      numerator: meter.numerator,
      denominator: meter.denominator,
      isFourFour: meter.numerator === 4 && meter.denominator === 4,
    };
  });
}
