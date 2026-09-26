<!--
  The next four bars: each bar's chords as symbols over numerals, drawn
  smaller where a bar has two. A cue names the section where it changes,
  and the key where that changes, as the prototype does.
-->
<script lang="ts">
  import type { BarView } from '../hud.ts';

  interface Props {
    /** The bar before the first shown: the one heard. */
    before: BarView;
    bars: readonly BarView[];
  }

  let { before, bars }: Props = $props();

  const cue = (bar: BarView, prev: BarView) => {
    const key = bar.key !== prev.key ? bar.key : null;
    if (bar.section !== prev.section) return key ? `${bar.section}, ${key}` : bar.section;
    return key ?? '';
  };
  const shown = $derived(
    bars.map((bar, i) => ({
      bar,
      cue: cue(bar, i === 0 ? before : bars[i - 1]!),
      symbols: bar.chords.map((c) => c.symbol).join(' '),
      numerals: bar.chords.map((c) => c.numeral).join(' '),
    })),
  );
</script>

<ol class="ribbon">
  {#each shown as { bar, cue, symbols, numerals } (bar.bar)}
    <li class:cue={cue !== ''} class:two={bar.chords.length > 1}>
      <span class="cue-label">{cue}</span>
      <b>{symbols}</b>
      <small>{numerals}</small>
    </li>
  {/each}
</ol>

<style>
  ol {
    list-style: none;
    padding: 0;
    margin: 6px 0 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  li {
    border-top: 3px solid var(--line);
    padding-top: 4px;
    min-width: 0;
  }
  li.cue {
    border-top-color: var(--amber);
  }
  .cue-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--amber);
    min-height: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  b {
    display: block;
    font-weight: 800;
    font-size: clamp(20px, 6vw, 30px);
    line-height: 1.05;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  li.two b {
    font-size: clamp(14px, 4vw, 20px);
    line-height: 1.5;
  }
  small {
    display: block;
    color: var(--muted);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
