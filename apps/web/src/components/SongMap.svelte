<!--
  The song map: the section playing and the sections after it. Each shows
  its eight bars, as tall as their energy, and a chord loop of its first
  four bars' first chords. The section playing is highlighted, its past
  bars filled and the bar heard ringed. A new key is named on the section
  where it comes. The prototype's layout.
-->
<script lang="ts">
  import type { SectionView } from '../hud.ts';

  interface Props {
    sections: readonly SectionView[];
    /** The bar heard, or null before anything is. */
    bar: number | null;
  }

  let { sections, bar }: Props = $props();

  const loop = (section: SectionView) =>
    section.bars
      .slice(0, 4)
      .map((b) => b.chords[0]?.symbol ?? '')
      .join(' ');
</script>

<ol class="songmap" aria-label="Song plan: the sections ahead, with bar heights showing energy">
  {#each sections as section, k (section.index)}
    <li class="sec" class:now={k === 0}>
      <span class="name">
        {section.newKey ? `${section.section}, ${section.key}` : section.section}
      </span>
      <span class="bars" aria-hidden="true">
        {#each section.bars as b (b.bar)}
          <i
            class:past={k === 0 && bar !== null && b.bar < bar}
            class:cur={k === 0 && b.bar === bar}
            style:height="{Math.round(8 + b.energy * 92)}%"
          ></i>
        {/each}
      </span>
      <span class="loop">{loop(section)}</span>
    </li>
  {/each}
</ol>

<style>
  .songmap {
    list-style: none;
    padding: 0;
    margin: 6px 0 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .sec {
    min-width: 0;
  }
  .name,
  .loop {
    display: block;
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .name {
    font-weight: 600;
    margin-bottom: 3px;
  }
  .sec.now .name {
    color: var(--amber);
  }
  .loop {
    margin-top: 4px;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 40px;
  }
  .bars i {
    flex: 1;
    min-height: 3px;
    border-radius: 2px 2px 0 0;
    background: var(--muted);
    opacity: 0.3;
  }
  .sec.now .bars i {
    background: var(--amber);
    opacity: 0.35;
  }
  .sec.now .bars i.past {
    opacity: 0.85;
  }
  .sec.now .bars i.cur {
    opacity: 1;
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 3px var(--amber);
  }
</style>
