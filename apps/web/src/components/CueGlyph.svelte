<!--
  A cue's glyph, live on the beat (`cues.ts`): the glyph the cue's source
  draws, small. The count-in and the ending are the transport's cells, the
  beat heard lit (and the ending's draining); a new key is its wheel, the
  scale's notes in their colours and the tonic ringed, breathing on each
  beat; a new meter is its pulses round, the beat heard lit; the lead is its
  chevron, in whose colour it plays, flashing on each beat; the radio is the
  style's radar, as it moves.
-->
<script lang="ts">
  import { fifthsIndex } from '@jambot/theory';
  import type { Cue } from '../cues.ts';
  import { pitchColour } from '../pitch.ts';
  import Radar from './glyphs/Radar.svelte';

  interface Props {
    cue: Cue;
    /** The beat heard in its bar, from 0, or null before any. */
    beat: number | null;
    /** The style's axes, for the radio's radar. */
    axes: readonly number[];
  }

  let { cue, beat, axes }: Props = $props();

  const C = 13;
  const at = (r: number, turn: number) => ({
    x: C + r * Math.sin(turn * 2 * Math.PI),
    y: C - r * Math.cos(turn * 2 * Math.PI),
  });
  /** The beat the countdown is on, from 0. */
  const lit = $derived(cue.beatsLeft === null ? (beat ?? 0) : cue.beats - cue.beatsLeft);
  const colour = $derived(cue.who === null ? 'var(--amber)' : `var(--source-${cue.who})`);
  const pulses = $derived(cue.meter ? cue.meter.heights.length : cue.beats);
</script>

<span class="glyph" aria-hidden="true">
  {#if cue.glyph === 'radio'}
    <Radar values={axes} />
  {:else}
    <svg viewBox="0 0 26 26">
      {#if cue.glyph === 'cells'}
        {@const w = 24 / cue.beats}
        {#each { length: cue.beats }, i (i)}
          <rect
            class="cell"
            class:on={i === lit}
            class:gone={i < lit}
            class:drain={cue.kind === 'ending'}
            x={1 + i * w + 0.5}
            y="7"
            width={w - 1}
            height="12"
            rx="1.5"
          />
        {/each}
      {:else if cue.glyph === 'key'}
        {#each { length: 12 }, pc (pc)}
          {@const p = at(10, fifthsIndex(pc) / 12)}
          {@const inScale = cue.scale?.includes(pc) ?? false}
          <circle
            cx={p.x}
            cy={p.y}
            r={inScale ? 2.2 : 1.1}
            class:off={!inScale}
            style:fill={inScale ? pitchColour(pc) : null}
          />
        {/each}
        {#if cue.tonic !== undefined}
          {@const t = at(10, fifthsIndex(cue.tonic) / 12)}
          {#key beat}<circle class="tonic" cx={t.x} cy={t.y} r="3.6" />{/key}
        {/if}
      {:else if cue.glyph === 'meter'}
        {#each { length: pulses }, i (i)}
          {@const p = at(10, i / pulses)}
          <circle
            class="pulse"
            class:on={i === (beat ?? 0) % pulses}
            cx={p.x}
            cy={p.y}
            r={i === 0 ? 2.8 : 1.8}
          />
        {/each}
      {:else}
        {#key beat}
          <path class="lead" d="M3 8H15L22 13L15 18H3L6 13Z" style:stroke={colour} />
        {/key}
      {/if}
    </svg>
  {/if}
</span>

<style>
  .glyph {
    display: inline-grid;
    width: 28px;
    height: 28px;
    flex: none;
  }
  svg {
    width: 100%;
    height: 100%;
  }
  .cell {
    fill: none;
    stroke: var(--amber);
    stroke-width: 1;
    stroke-dasharray: 2 1.5;
  }
  .cell.gone {
    fill: color-mix(in srgb, var(--amber) 30%, transparent);
    stroke-dasharray: none;
  }
  .cell.on {
    fill: var(--amber);
    stroke-dasharray: none;
  }
  .cell.drain.gone {
    fill: none;
    stroke-opacity: 0.35;
  }
  .off {
    fill: var(--line);
  }
  .tonic {
    fill: none;
    stroke: var(--teal);
    stroke-width: 1.4;
    animation: breathe 0.5s ease-out;
  }
  .pulse {
    fill: color-mix(in srgb, var(--amber) 35%, transparent);
  }
  .pulse.on {
    fill: var(--amber);
  }
  .lead {
    fill: none;
    stroke-width: 2.2;
    stroke-linejoin: round;
    animation: flash 0.5s ease-out;
  }
  @keyframes breathe {
    from {
      r: 5.5;
    }
  }
  @keyframes flash {
    from {
      fill: color-mix(in srgb, currentColor 0%, var(--amber));
      fill-opacity: 0.6;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tonic,
    .lead {
      animation: none;
    }
  }
</style>
