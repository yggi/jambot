import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { transportCells, transportHeard, transportLine } from './transportView.ts';

describe('transportCells', () => {
  it('gives a cell to each pulse of every named meter, as long as the pulse is in eighths', () => {
    expect(transportCells(METERS['3/4'])).toEqual([2, 2, 2]);
    expect(transportCells(METERS['4/4'])).toEqual([2, 2, 2, 2]);
    expect(transportCells(METERS['5/4'])).toEqual([2, 2, 2, 2, 2]);
    expect(transportCells(METERS['5/8'])).toEqual([3, 2]);
    expect(transportCells(METERS['6/8'])).toEqual([3, 3]);
    expect(transportCells(METERS['7/8'])).toEqual([3, 2, 2]);
    expect(transportCells(METERS['9/8'])).toEqual([3, 3, 3]);
    expect(transportCells(METERS['10/8'])).toEqual([3, 3, 2, 2]);
    expect(transportCells(METERS['12/8'])).toEqual([3, 3, 3, 3]);
  });

  it('fills the bar: the cells of every meter add up to its eighths', () => {
    for (const meter of Object.values(METERS))
      expect(transportCells(meter).reduce((a, b) => a + b, 0)).toBe(meter.cycle);
  });
});

describe('transportHeard', () => {
  it('lights the pulse a step is in, and the eighth in it, at every step of every meter', () => {
    for (const meter of Object.values(METERS)) {
      const cells = transportCells(meter);
      for (let step = 0; step < meter.cycle * 2; step++) {
        const eighth = Math.floor(step / 2);
        const { cell, within } = transportHeard(meter, step)!;
        const before = cells.slice(0, cell).reduce((a, b) => a + b, 0);
        expect(before + within).toBe(eighth);
        expect(within).toBeLessThan(cells[cell]!);
      }
    }
  });

  it('lights nothing before a step is heard, and reads a step of a later bar in its own', () => {
    expect(transportHeard(METERS['4/4'], null)).toBe(null);
    expect(transportHeard(METERS['4/4'], 16 + 5)).toEqual({ cell: 1, within: 0 });
    expect(transportHeard(METERS['7/8'], 14 + 13)).toEqual({ cell: 2, within: 1 });
  });
});

describe('transportLine', () => {
  const bar = { section: 'Groove', barInSection: 2, key: 'A minor', meterName: '4/4' };
  const base = { bpm: 108, bar, phase: null, playing: true, heard: true, beatsLeft: null };

  it('names the section and the bar heard, over the tempo, the meter and the key', () => {
    expect(transportLine(base)).toEqual({ main: 'Groove 3/8', sub: '108 BPM · 4/4 · A minor' });
  });

  it('counts the beats left of the count-in', () => {
    expect(transportLine({ ...base, phase: 'counting', heard: false, beatsLeft: 3 })).toEqual({
      main: 'Count-in · 3',
      sub: '108 BPM · 4/4 · A minor',
    });
  });

  it('says the band is ending, and that a second stop stops it now', () => {
    expect(transportLine({ ...base, phase: 'ending' })).toEqual({
      main: 'Groove 3/8',
      sub: 'Ending · stop again to stop now',
    });
  });

  it('is ready before anything is heard, and says what the band opens on', () => {
    expect(transportLine({ ...base, playing: false, heard: false })).toEqual({
      main: 'Ready',
      sub: 'Opens on Groove · 108 BPM · 4/4 · A minor',
    });
    expect(transportLine({ ...base, heard: false })).toEqual({
      main: '…',
      sub: '108 BPM · 4/4 · A minor',
    });
    expect(transportLine({ ...base, bar: null, playing: false, heard: false })).toEqual({
      main: 'Ready',
      sub: '108 BPM',
    });
  });

  it('rounds the tempo to a whole beat a minute', () => {
    expect(transportLine({ ...base, bpm: 107.6 }).sub).toBe('108 BPM · 4/4 · A minor');
  });
});
