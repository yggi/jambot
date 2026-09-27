import { describe, expect, it } from 'vitest';
import { Sounding } from './sounding.ts';

describe('what is heard sounding', () => {
  it('shows nothing before any hit', () => {
    expect(new Sounding().at(0)).toEqual({ lead: [], drums: [] });
  });

  it('shows a hit from its scheduled time for its duration, then drops it', () => {
    const sounding = new Sounding();
    sounding.push({ part: 'lead', note: 64, seconds: 1, duration: 0.5 });
    expect(sounding.at(0.9)).toEqual({ lead: [], drums: [] });
    expect(sounding.at(1)).toEqual({ lead: [64], drums: [] });
    expect(sounding.at(1.4)).toEqual({ lead: [64], drums: [] });
    expect(sounding.at(1.5)).toEqual({ lead: [], drums: [] });
  });

  it('keeps the lead and the drums apart, several notes at once', () => {
    const sounding = new Sounding();
    sounding.push({ part: 'lead', note: 60, seconds: 0, duration: 1 });
    sounding.push({ part: 'lead', note: 64, seconds: 0.2, duration: 1 });
    sounding.push({ part: 'drums', note: 36, seconds: 0, duration: 0.1 });
    expect(sounding.at(0.3)).toEqual({ lead: [60, 64], drums: [] });
  });

  it('never shows a note twice, however often it was struck while still sounding', () => {
    const sounding = new Sounding();
    sounding.push({ part: 'drums', note: 38, seconds: 0, duration: 0.2 });
    sounding.push({ part: 'drums', note: 38, seconds: 0.1, duration: 0.2 });
    expect(sounding.at(0.15)).toEqual({ lead: [], drums: [38] });
  });

  it('forgets everything once cleared', () => {
    const sounding = new Sounding();
    sounding.push({ part: 'lead', note: 60, seconds: 0, duration: 10 });
    sounding.clear();
    expect(sounding.at(0)).toEqual({ lead: [], drums: [] });
  });
});
