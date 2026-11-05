import { describe, expect, it } from 'vitest';
import { NUDGED, NUDGE_STEP, leaned, leans } from './lean.ts';
import { TEMPO_STEP } from './licence.ts';
import { AXES, INITIAL_STYLE, PRESETS, type Style } from './style.ts';

/** Each preset as a whole style: its point, at the opening entropy. */
const STYLES: readonly { name: string; style: Style }[] = PRESETS.map((p) => ({
  name: p.name,
  style: { ...INITIAL_STYLE, ...p.style },
}));

describe("the players' lean", () => {
  it('moves each axis a player may nudge by its steps, a tenth a step, and nothing else', () => {
    for (const { name, style } of STYLES)
      for (const axis of NUDGED.filter((a) => a !== 'bpm'))
        for (const steps of [-2, -1, 1, 2]) {
          const next = leaned(style, { [axis]: steps });
          const { min, max } = AXES[axis];
          expect(next[axis], `${name} ${axis} ${steps}`).toBeCloseTo(
            Math.min(max, Math.max(min, style[axis] + steps * 0.1)),
            12,
          );
          for (const other of Object.keys(style) as (keyof typeof style)[])
            if (other !== axis) expect(next[other], `${name} ${axis}: ${other}`).toBe(style[other]);
        }
  });

  it('moves the tempo by the Metrum’s step of an octave, within 60 to 180 bpm', () => {
    const style = INITIAL_STYLE;
    expect(NUDGE_STEP.bpm).toBe(TEMPO_STEP);
    expect(leaned({ ...style, bpm: 120 }, { bpm: 1 }).bpm).toBeCloseTo(120 * 2 ** (1 / 24), 4);
    expect(leaned({ ...style, bpm: 120 }, { bpm: -24 }).bpm).toBeCloseTo(60, 4);
    expect(leaned({ ...style, bpm: 178 }, { bpm: 3 }).bpm).toBe(180);
    expect(leaned({ ...style, bpm: 61 }, { bpm: -3 }).bpm).toBe(60);
  });

  it('stops an axis at its end, never reflecting it as the radio does', () => {
    const style = { ...INITIAL_STYLE, energy: 0.95, sync: 0.02 };
    const next = leaned(style, { energy: 1, sync: -1 });
    expect([next.energy, next.sync]).toEqual([1, 0]);
  });

  it('takes no step on entropy, and leans nothing with no steps', () => {
    expect(NUDGED).not.toContain('entropy');
    const style = INITIAL_STYLE;
    expect(leaned(style, {})).toEqual(style);
    expect(leaned(style, { sync: 0 })).toEqual(style);
    expect(leans({})).toBe(false);
    expect(leans({ sync: 0, bpm: 0 })).toBe(false);
    expect(leans({ harm: -0.25 })).toBe(true);
  });
});
