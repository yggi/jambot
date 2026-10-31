import { METERS } from '@jambot/theory';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { Cue } from '../cues.ts';
import CueStrip from './CueStrip.svelte';

const cue = (over: Partial<Cue> = {}): Cue => ({
  kind: 'section',
  what: 'Bridge · D minor',
  sub: 'next section, in a new key',
  who: null,
  bars: 3,
  beatsLeft: null,
  beats: 4,
  glyph: 'key',
  tonic: 2,
  scale: [0, 2, 4, 5, 7, 9, 10],
  ...over,
});
const axes = [0.5, 0.5, 0.5, 0.5, 0.5];

describe('the cue strip', () => {
  it('shows the nearest cue, what it is and when, and how many more are coming', () => {
    render(CueStrip, {
      cues: [cue(), cue({ kind: 'voice', what: 'Lead drops out' })],
      beat: 1,
      axes,
    });
    const strip = screen.getByRole('status', { name: 'Cue' });
    expect(strip).toHaveTextContent('Bridge · D minor');
    expect(strip).toHaveTextContent('3 bars');
    expect(strip).toHaveTextContent('+1');
    expect(strip).not.toHaveTextContent('Lead drops out');
  });

  it('counts its last bar down in beats, as dots, and a bar alone as one', async () => {
    const { container, rerender } = render(CueStrip, {
      cues: [cue({ bars: 1, beatsLeft: 3 })],
      beat: 1,
      axes,
    });
    expect(screen.getByLabelText('in 3 beats')).toBeInTheDocument();
    expect(container.querySelectorAll('.dots i')).toHaveLength(4);
    expect(container.querySelectorAll('.dots i.gone')).toHaveLength(1);
    await rerender({ cues: [cue({ bars: 1 })], beat: 1, axes });
    expect(screen.getByRole('status', { name: 'Cue' })).toHaveTextContent('1 bar');
  });

  it('borders a cue in whose it is: the band’s amber, a player’s colour', async () => {
    const { container, rerender } = render(CueStrip, { cues: [cue()], beat: 0, axes });
    const border = () =>
      (container.querySelector('.cue') as HTMLElement).style.getPropertyValue('--who');
    expect(border()).toBe('var(--amber)');
    await rerender({ cues: [cue({ who: 2, kind: 'motif', glyph: 'lead' })], beat: 0, axes });
    expect(border()).toBe('var(--source-2)');
    expect((container.querySelector('path.lead') as SVGElement).style.stroke).toBe(
      'var(--source-2)',
    );
  });

  it('draws each kind of glyph live: the key in its colours, the meter’s pulses with the beat lit, the cells, the lead, the radar', () => {
    const glyph = (c: Cue, beat = 1) => {
      const { container, unmount } = render(CueStrip, { cues: [c], beat, axes });
      const svg = container.querySelector('.glyph svg');
      const out = {
        coloured: [...container.querySelectorAll<SVGElement>('.glyph circle')].filter((e) =>
          e.style.fill.startsWith('hsl('),
        ).length,
        lit: container.querySelectorAll('.glyph .on').length,
        lead: container.querySelectorAll('.glyph path.lead').length,
        radar: container.querySelector('.glyph polygon') !== null && svg !== null,
      };
      unmount();
      return out;
    };
    expect(glyph(cue()).coloured).toBe(7);
    expect(glyph(cue({ glyph: 'meter', meter: METERS['7/8'] }), 2).lit).toBe(1);
    expect(glyph(cue({ glyph: 'cells', kind: 'count-in', bars: 0, beatsLeft: 3 })).lit).toBe(1);
    expect(glyph(cue({ glyph: 'lead' })).lead).toBe(1);
    expect(glyph(cue({ glyph: 'radio' })).radar).toBe(true);
  });

  it('shows nothing where nothing is coming, and takes no tap', () => {
    const { container } = render(CueStrip, { cues: [], beat: null, axes });
    expect(container.querySelector('.cue')).toBeNull();
  });
});
