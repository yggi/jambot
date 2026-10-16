<!--
  The shell's icons: a small still picture for each section of its drawer
  and each of its views, the band's and the lobby's, drawn on the glyph's frame in the glyphs' colour
  roles. They name a place to go, so unlike a card's glyph they don't move;
  the live picture is the card's own, in its summary once it is open.
-->
<script lang="ts" module>
  export type IconName =
    | 'sound'
    | 'session'
    | 'style'
    | 'time'
    | 'key'
    | 'muse'
    | 'timing'
    | 'song'
    | 'melody'
    | 'rhythm'
    | 'mix'
    | 'you'
    | 'settings'
    | 'about'
    | 'play'
    | 'tune'
    | 'meter';
</script>

<script lang="ts">
  import Glyph from '../Glyph.svelte';

  let { name }: { name: IconName } = $props();

  /** A point on a circle round the centre, `i` of `n`, from the top, clockwise. */
  const at = (i: number, n: number, r: number) => {
    const turn = (2 * Math.PI * i) / n;
    return { x: 20 + r * Math.sin(turn), y: 20 - r * Math.cos(turn) };
  };
  const HEX = Array.from({ length: 6 }, (_, i) => at(i, 6, 15));
  const SHAPE = [6, 10, 11, 12, 12, 8].map((r, i) => at(i, 6, r));
  const PENTAGON = Array.from({ length: 5 }, (_, i) => at(i, 5, 15));
  const points = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x},${p.y}`).join(' ');
</script>

<Glyph>
  {#if name === 'sound'}
    {#each [10, 16, 24, 14] as h, i (i)}
      <rect class="lit" x={6 + i * 8} y={32 - h} width="5" height={h} rx="1.5" />
    {/each}
  {:else if name === 'session'}
    <path class="line" d="M20 20 L8 10 M20 20 L33 12 M20 20 L22 34" />
    <circle class="accent" cx="20" cy="20" r="6" />
    <circle class="lit" cx="8" cy="10" r="4" />
    <circle class="dim" cx="33" cy="12" r="4" />
    <circle class="dim" cx="22" cy="34" r="4" />
  {:else if name === 'style'}
    <polygon class="line" points={points(HEX)} />
    <polygon class="lit soft" points={points(SHAPE)} />
  {:else if name === 'time'}
    {#each { length: 8 }, i (i)}
      {@const p = at(i, 8, 14)}
      <circle class={i === 0 ? 'accent' : 'dim'} cx={p.x} cy={p.y} r={i === 0 ? 4.5 : 3} />
    {/each}
  {:else if name === 'key'}
    <circle class="line" cx="20" cy="20" r="15" />
    {#each { length: 12 }, i (i)}
      {@const p = at(i, 12, 15)}
      {@const inScale = [0, 1, 2, 3, 4, 5, 11].includes(i)}
      <circle
        class={i === 3 ? 'accent' : inScale ? 'lit' : 'dim'}
        cx={p.x}
        cy={p.y}
        r={inScale ? 3 : 2}
      />
    {/each}
  {:else if name === 'muse'}
    <circle class="ring" cx="20" cy="20" r="15" />
    <path class="motif" d="M11 23 L16 17 L21 21 L26 13 L30 18" />
  {:else if name === 'timing'}
    <circle class="line" cx="20" cy="20" r="15" />
    <circle class="line" cx="20" cy="20" r="8" />
    <circle class="lit" cx="20" cy="20" r="3" />
  {:else if name === 'song'}
    {#each { length: 5 }, i (i)}
      <rect class={i === 1 ? 'lit' : 'dim'} x={3 + i * 7} y="13" width="5.5" height="14" rx="1.5" />
    {/each}
    <circle class="accent" cx="17" cy="8" r="2.5" />
  {:else if name === 'melody'}
    <rect class="line" x="4" y="18" width="32" height="17" rx="3" />
    {#each { length: 4 }, i (i)}
      <rect class="dim" x={10 + i * 7} y="19" width="4" height="9" />
    {/each}
    <rect class="lit" x="9" y="4" width="4" height="9" rx="1.5" />
    <rect class="accent" x="23" y="7" width="4" height="7" rx="1.5" />
  {:else if name === 'rhythm'}
    {#each { length: 4 }, i (i)}
      <rect
        class={i === 0 ? 'lit' : 'dim'}
        x={5 + (i % 2) * 16}
        y={5 + Math.floor(i / 2) * 16}
        width="13"
        height="13"
        rx="3"
      />
    {/each}
  {:else if name === 'mix'}
    {#each [24, 12, 18, 28] as y, i (i)}
      <path class="line" d="M{8 + i * 8} 6 V34" />
      <rect class="lit" x={4.5 + i * 8} y={y - 2.5} width="7" height="5" rx="1.5" />
    {/each}
  {:else if name === 'you'}
    <circle class="accent" cx="20" cy="13" r="6" />
    <path class="line" d="M8 34 C8 24 32 24 32 34" />
  {:else if name === 'settings'}
    <circle class="line" cx="20" cy="20" r="8" />
    {#each { length: 8 }, i (i)}
      {@const p = at(i, 8, 14)}
      <circle class="dim" cx={p.x} cy={p.y} r="2.5" />
    {/each}
    <circle class="lit" cx="20" cy="20" r="3" />
  {:else if name === 'about'}
    <polygon class="line" points={points(PENTAGON)} />
    <circle class="accent" cx="20" cy="21" r="3" />
  {:else if name === 'play'}
    <circle class="line" cx="20" cy="20" r="15" />
    <circle class="accent" cx="20" cy="20" r="7" />
  {:else if name === 'tune'}
    <path class="line" d="M6 28 A15 15 0 0 1 34 28" />
    <path class="needle" d="M20 32 L25 13" />
    <circle class="accent" cx="20" cy="32" r="3" />
  {:else if name === 'meter'}
    {#each { length: 7 }, i (i)}
      {@const p = at(i, 7, 14)}
      <circle
        class={[0, 2, 4].includes(i) ? 'accent' : 'dim'}
        cx={p.x}
        cy={p.y}
        r={[0, 2, 4].includes(i) ? 4 : 2.5}
      />
    {/each}
  {/if}
</Glyph>

<style>
  .lit {
    fill: var(--glyph-lit);
  }
  .soft {
    fill-opacity: 0.7;
  }
  .dim {
    fill: var(--glyph-dim);
  }
  .accent {
    fill: var(--glyph-accent);
  }
  .line {
    fill: none;
    stroke: var(--glyph-dim);
    stroke-width: 2;
  }
  .ring {
    fill: none;
    stroke: var(--glyph-accent);
    stroke-width: 2.5;
  }
  .needle {
    fill: none;
    stroke: var(--glyph-lit);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .motif {
    fill: none;
    stroke: var(--glyph-lit);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
