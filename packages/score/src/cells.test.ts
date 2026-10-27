/**
 * The shared base against the language (#309, phase 1): Jambot depends on
 * yggi/cells, compiles a cells text and takes its events. The language is a
 * dev dependency here only; the band writes cells text and plays it through
 * the cells engine at the seam (phase 3, #63 step 5).
 * `even` and cells' Euclid relate by the hub's euclid contract, which
 * `packages/theory/src/contracts.test.ts` runs (#504).
 */

import { describe, expect, it } from 'vitest';
import { planOf, windowAt } from '@yggi/cells';

const RIFF = `&bar scan(1 1 1 1) step=120bpm
&tune over=scale("C:minor:pentatonic") step=8n 0 2 4 2 [3 4] ~ 4 _
&lead sound=saw loop=C4 cutoff=1200
&mix [&tune * &lead]`;

describe('a cells text, compiled by the language Jambot depends on', () => {
  // (which notes it plays, and how it loops, are cells' own tests: the seam is that the pinned language compiles and
  // plays a text, yggi/music-commons#37)
  it('compiles with no diagnostics and plays it', () => {
    const plan = planOf(RIFF);
    expect(plan.result.diagnostics).toEqual([]);
    expect(windowAt(plan, 0, 2).events.length).toBeGreaterThan(0);
  });
});
