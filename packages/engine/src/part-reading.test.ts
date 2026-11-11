import { METERS, type Meter, stepsOf } from '@jambot/theory';
import { readVoice as readCellsVoice } from '@yggi/cells/engine/reading/voice';
import { describe, expect, it } from 'vitest';
import type { Part } from './events.ts';
import { VOICES, readVoice } from './part-reading.ts';

const at = (part: Part, step: number, length = 1, note = 60) => ({ part, step, note, length });

describe('reading one voice of the band alone: cells’ reader on Jambot’s meters', () => {
  const bar = [
    at('drums', 0),
    at('drums', 3),
    at('bass', 0, 2, 36),
    ...[60, 64, 67].map((n) => at('pad', 0, 8, n)),
    ...[62, 65, 69].map((n) => at('stab', 8, 2, n)),
    at('lead', 5, 1, 72),
  ];

  it('reads the song’s 4/4 where no meter is given, as cells reads its own bar', () => {
    for (const voice of VOICES) expect(readVoice(voice, bar)).toEqual(readCellsVoice(voice, bar));
  });

  it('reads a voice’s density over its meter’s steps (finite: every meter)', () => {
    for (const [name, meter] of Object.entries(METERS) as [string, Meter][]) {
      const steps = stepsOf(meter);
      const full = Array.from({ length: steps }, (_, s) => at('drums', s));
      expect([name, readVoice('drums', full, meter).density]).toEqual([name, 1]);
    }
  });
});
