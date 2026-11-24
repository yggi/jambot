import { describe, expect, it } from 'vitest';
import { PROTOTYPE_LANDMARKS, calibrate, readLandmarks } from './genre-calibration.ts';

const points = calibrate(PROTOTYPE_LANDMARKS);
const read = calibrate(readLandmarks());
const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const bar = (rows: typeof points, name: string) => rows.find((r) => r.preset === name)!.bar;

describe('does Techno land where techno lands? (E24)', () => {
  it('lands well above chance overall against where the presets read, and better there than against their points (E24)', () => {
    const chance = 1 / read.length;
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(4 * chance);
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(mean(points.map((r) => r.bar)));
    // 0.69 since swing left the style (#360), 0.81 when it was read; 0.641 in songs (#655), whose kinds move a bar's
    // energy farther from its style's than the chain's did; 0.673 since cells v0.30.0, whose jazz solos play hotter and
    // without the pad.
    expect(mean(read.map((r) => r.bar))).toBeGreaterThan(0.6);
    // Against the presets' placed points the mean is recorded, not bounded: placements are the composer's intent,
    // readings the critic's, two scales (the owner's ruling on yggi/cells#681, cells decision 094 in yggi/cells#752, 2026-11-13).
    // On 2026-11-13, per bar, it is 0.655 with no `sync`, 0.528 with the old reading and 0.483 with cells'.
    // Against the placed points no reading beats leaving `sync` out, because the composer barely expresses the axis (#673).
  });

  it('lands Ambient nearly always from either set of landmarks, and Swing jazz, without its swing read, in about 0.7 (E24, #360)', () => {
    expect(bar(points, 'Ambient')).toBeGreaterThan(0.85);
    expect(bar(read, 'Ambient')).toBeGreaterThan(0.85);
    expect(bar(points, 'Swing jazz')).toBeGreaterThan(0.6);
    expect(bar(read, 'Swing jazz')).toBeGreaterThan(0.6);
  });

  it('lands every preset in at least 0.2 of its bars against where the presets read, and all but one in 0.4 (E24, #655)', () => {
    // Every preset reached 0.4 before #655's song forms (Synth-pop 0.400 with cells' `sync`); in songs Deep house reads
    // 0.237 and Lo-fi hip hop 0.394, Synth-pop 0.463; since cells v0.30.0, whose jazz solos play hotter and without the
    // pad, so the presets' readings move, Lo-fi hip hop 0.400 and Synth-pop 0.456.
    for (const r of read) expect(r.bar, r.preset).toBeGreaterThanOrEqual(0.2);
    expect(read.filter((r) => r.bar < 0.4).map((r) => r.preset)).toEqual(['Deep house']);
  });

  it('lands Funk and Bossa nova against where the presets read, and not against their points: the reading is compressed short of their extremes (E23, E24)', () => {
    expect(bar(read, 'Funk')).toBeGreaterThan(0.75);
    expect(bar(read, 'Bossa nova')).toBeGreaterThan(0.5);
    for (const name of ['Funk', 'Bossa nova']) expect(bar(points, name), name).toBeLessThan(0.1);
  });

  it('reads a section about as well as a bar, but where a song’s kinds pull its bars apart (E24, #655)', () => {
    // The mean of eight bars added little anywhere before #655's song forms (under 0.15); in songs it adds 0.244 at
    // Synth-pop against where the presets read, whose verses and choruses move each bar's energy one way and the
    // section's mean back; and at Swing jazz, whose solos since cells v0.30.0 play hotter and without the pad, it takes
    // 0.225 against its point (where it added 0.269 against where the presets read before, and 0.237 at Synth-pop).
    const pulled = (rows: typeof points) => (rows === points ? 'Swing jazz' : 'Synth-pop');
    for (const rows of [points, read])
      for (const r of rows)
        if (r.preset !== pulled(rows))
          expect(Math.abs(r.section - r.bar), r.preset).toBeLessThan(0.15);
    expect(
      read.find((r) => r.preset === 'Synth-pop')!.section - bar(read, 'Synth-pop'),
    ).toBeGreaterThan(0.2);
    expect(
      points.find((r) => r.preset === 'Swing jazz')!.section - bar(points, 'Swing jazz'),
    ).toBeLessThan(-0.2);
  });
});
