import { describe, expect, it } from 'vitest';
import { Sounding, memberOf } from './sounding.ts';

const none = { drums: [], bass: [], comp: [], lead: [] };

describe('what is heard sounding', () => {
  it('shows nothing before any hit', () => {
    expect(new Sounding().at(0)).toEqual(none);
  });

  it('shows a hit from its scheduled time for its duration, then drops it', () => {
    const sounding = new Sounding();
    sounding.push({ member: 'lead', note: 64, seconds: 1, duration: 0.5 });
    expect(sounding.at(0.9)).toEqual(none);
    expect(sounding.at(1)).toEqual({ ...none, lead: [64] });
    expect(sounding.at(1.4)).toEqual({ ...none, lead: [64] });
    expect(sounding.at(1.5)).toEqual(none);
  });

  it('keeps every member apart, several notes at once', () => {
    const sounding = new Sounding();
    sounding.push({ member: 'lead', note: 60, seconds: 0, duration: 1 });
    sounding.push({ member: 'lead', note: 64, seconds: 0.2, duration: 1 });
    sounding.push({ member: 'drums', note: 36, seconds: 0, duration: 0.1 });
    sounding.push({ member: 'bass', note: 33, seconds: 0, duration: 1 });
    sounding.push({ member: 'comp', note: 48, seconds: 0, duration: 1 });
    expect(sounding.at(0.3)).toEqual({ drums: [], bass: [33], comp: [48], lead: [60, 64] });
  });

  it('never shows a note twice, however often it was struck while still sounding', () => {
    const sounding = new Sounding();
    sounding.push({ member: 'drums', note: 38, seconds: 0, duration: 0.2 });
    sounding.push({ member: 'drums', note: 38, seconds: 0.1, duration: 0.2 });
    expect(sounding.at(0.15)).toEqual({ ...none, drums: [38] });
  });

  it('forgets everything once cleared', () => {
    const sounding = new Sounding();
    sounding.push({ member: 'lead', note: 60, seconds: 0, duration: 10 });
    sounding.clear();
    expect(sounding.at(0)).toEqual(none);
  });
});

describe('the member a written part sounds on', () => {
  it('maps the comp’s pad and stab to the one chords member, and leaves every other part as it is', () => {
    expect(memberOf('pad')).toBe('comp');
    expect(memberOf('stab')).toBe('comp');
    expect(memberOf('drums')).toBe('drums');
    expect(memberOf('bass')).toBe('bass');
    expect(memberOf('lead')).toBe('lead');
  });
});
