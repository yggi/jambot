<!--
  The cue strip: the nearest cue (`cues.ts`), in the title bar's own row
  under the transport (`Shell`'s `cue`), so it covers no view and moves
  nothing as it comes and goes. Its
  glyph is live on the beat (`CueGlyph`); its countdown is in bars while the
  moment is a bar or more off, and in beats, as dots, in its last bar; "+n"
  says how many more are coming. The bar at its left is whose it is: the
  band's amber, or a player's colour. It leaves when its moment arrives, and is
  read out politely as it changes.
-->
<script lang="ts">
  import type { Cue } from '../cues.ts';
  import CueGlyph from './CueGlyph.svelte';

  interface Props {
    cues: readonly Cue[];
    beat: number | null;
    axes: readonly number[];
  }

  let { cues, beat, axes }: Props = $props();

  const cue = $derived(cues[0] ?? null);
  const more = $derived(cues.length - 1);
</script>

<div class="cues" role="status" aria-live="polite" aria-label="Cue">
  {#if cue}
    <div
      class="cue"
      data-kind={cue.kind}
      style:--who={cue.who === null ? 'var(--amber)' : `var(--source-${cue.who})`}
    >
      <CueGlyph {cue} {beat} {axes} />
      <span class="what">
        <b>{cue.what}</b>
        <small>{cue.sub}</small>
      </span>
      <span class="left">
        {#if cue.beatsLeft !== null}
          <span
            class="dots"
            aria-label="in {cue.beatsLeft} {cue.beatsLeft === 1 ? 'beat' : 'beats'}"
          >
            {#each { length: cue.beats }, i (i)}<i class:gone={i < cue.beats - cue.beatsLeft}
              ></i>{/each}
          </span>
        {:else}
          <b>{cue.bars} {cue.bars === 1 ? 'bar' : 'bars'}</b>
        {/if}
        {#if more > 0}<small class="more">+{more}</small>{/if}
      </span>
    </div>
  {/if}
</div>

<style>
  .cues {
    height: 100%;
  }
  .cue {
    height: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 0 12px 0 9px;
    border-left: 3px solid var(--who);
    background: color-mix(in srgb, var(--who) 7%, var(--surface));
  }
  .what {
    display: grid;
    min-width: 0;
    line-height: 1.2;
  }
  .what b,
  .what small {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .what b {
    font-size: 14px;
  }
  .what small {
    font-size: 11.5px;
    color: var(--muted);
  }
  .left {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
  .dots {
    display: flex;
    gap: 3px;
  }
  .dots i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 1.5px solid var(--who);
  }
  .dots i.gone {
    background: var(--who);
  }
  .more {
    padding: 1px 5px;
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--muted);
    font-size: 11px;
  }
</style>
