import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { barMarks } from '../../metrum.ts';
import Blinker from './Blinker.svelte';

const lamps = (container: HTMLElement) => [...container.querySelectorAll('circle.lamp')];
/** How far round the circle a lamp is from the top, clockwise, in turns. */
const turn = (lamp: Element) => {
  const dx = Number(lamp.getAttribute('cx')) - 20;
  const dy = 20 - Number(lamp.getAttribute('cy'));
  return (Math.atan2(dx, dy) / (2 * Math.PI) + 1) % 1;
};

describe('the blinker', () => {
  it('lays the bar clockwise from the top, the eighths evenly round when there is no swing', () => {
    const { container } = render(Blinker, { marks: barMarks(0, null), span: 16 });
    expect(lamps(container).map((lamp) => Math.round(turn(lamp) * 8) % 8)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it('has a lamp for each eighth, and none for the faint sixteenths between', () => {
    const { container } = render(Blinker, { marks: barMarks(0, null), span: 16 });
    expect(lamps(container)).toHaveLength(8);
  });

  it('lights nothing before anything is heard, and the one eighth heard after', () => {
    const still = render(Blinker, { marks: barMarks(0, null), span: 16 });
    expect(still.container.querySelectorAll('circle.lit')).toHaveLength(0);
    still.unmount();
    const { container } = render(Blinker, { marks: barMarks(0, 3), span: 16 });
    const lit = lamps(container).flatMap((lamp, i) => (lamp.classList.contains('lit') ? [i] : []));
    expect(lit).toEqual([3]);
  });

  it('shows three weights: the downbeat largest, a pulse, and an eighth between smallest', () => {
    const { container } = render(Blinker, { marks: barMarks(0, null), span: 16 });
    const radius = lamps(container).map((lamp) => Number(lamp.getAttribute('r')));
    expect(radius[0]).toBeGreaterThan(radius[2]!);
    expect(radius[2]).toBeGreaterThan(radius[1]!);
    expect(new Set(radius)).toHaveProperty('size', 3);
    expect(lamps(container)[0]).toHaveClass('accent');
  });

  it('moves the eighths between the pulses with the swing, and never a pulse', () => {
    const straight = lamps(render(Blinker, { marks: barMarks(0, null), span: 16 }).container);
    const swung = lamps(render(Blinker, { marks: barMarks(1, null), span: 16 }).container);
    for (const i of [0, 2, 4, 6]) expect(turn(swung[i]!)).toBeCloseTo(turn(straight[i]!), 6);
    for (const i of [1, 3, 5, 7]) expect(turn(swung[i]!)).toBeGreaterThan(turn(straight[i]!));
  });
});
