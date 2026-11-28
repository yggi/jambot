import { describe, expect, it } from 'vitest';
import { MEMBERS, type Member, offerCount } from './offer.ts';
import { PRESETS } from '../src/style.ts';

// E48 (#540): the numbers are literals, to be moved by the change that moves them. Where every member took the nearest,
// each opened every seed on one fragment at every preset: 24 a member.
const COUNTS = PRESETS.map(offerCount);
const opened = (member: Member) => COUNTS.reduce((n, c) => n + c.opened[member], 0);
const played = (member: Member) => COUNTS.reduce((n, c) => n + c.played[member], 0);
const wider = (member: Member) => COUNTS.filter((c) => c.opened[member] > 1).map((c) => c.preset);

describe('the offer in every facet, 8 seeds of 32 sections at each preset (E48, #540)', () => {
  it('opens 21 of the 24 presets on more than one fragment of some member across the seeds', () => {
    expect(COUNTS).toHaveLength(24);
    expect(COUNTS.filter((c) => MEMBERS.some((m) => c.opened[m] > 1))).toHaveLength(21);
  });

  it('opens the lead most widely, cells placing a style’s lead lines nearest together: 44 openings, up to 5 at Acid', () => {
    expect(MEMBERS.map(opened)).toEqual([27, 27, 44, 41]);
    expect(wider('lead')).toHaveLength(13);
    expect(Math.max(...COUNTS.map((c) => c.opened.lead))).toBe(5);
    expect(COUNTS.find((c) => c.opened.lead === 5)!.preset).toBe('Acid');
  });

  it('opens the drums and the bass on one alone where a preset’s own lies a tenth clear of the next, as most do', () => {
    expect(wider('rhythm')).toEqual(['Spooky', 'Happy hardcore', 'Elektro']);
    expect(wider('bass')).toEqual(['Spooky', 'Sea shanty', 'March']);
  });

  it('plays as many fragments over the sections as the ladder moves on to', () => {
    expect(MEMBERS.map(played)).toEqual([437, 422, 494, 67]);
  });
});
