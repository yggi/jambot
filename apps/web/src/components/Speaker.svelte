<!--
  The volume glyph: a speaker that reads out what a track's volume is. Its
  waves are the level in a glance (none at none, then one, two or three), it
  is crossed out while the track is muted, and an "S" is laid over it while
  the track is soloed. Decoration on a button that names it in words.
-->
<script module lang="ts">
  /** How many waves a level is drawn with: none only at none, three from three quarters. */
  export function wavesOf(level: number): 0 | 1 | 2 | 3 {
    if (!(level > 0)) return 0;
    if (level < 0.4) return 1;
    return level < 0.75 ? 2 : 3;
  }
</script>

<script lang="ts">
  interface Props {
    /** The level shown, 0 to 1: none where the track is muted or left out of a solo. */
    level: number;
    muted?: boolean;
    soloed?: boolean;
  }

  let { level, muted = false, soloed = false }: Props = $props();

  const waves = $derived(muted ? 0 : wavesOf(level));
</script>

<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path class="cone" d="M3 9.5h3.5L11 6v12l-4.5-3.5H3z" />
  {#if waves >= 1}<path class="wave" d="M14 9.7a3.4 3.4 0 0 1 0 4.6" />{/if}
  {#if waves >= 2}<path class="wave" d="M16.4 7.6a6.6 6.6 0 0 1 0 8.8" />{/if}
  {#if waves >= 3}<path class="wave" d="M18.8 5.5a9.6 9.6 0 0 1 0 13" />{/if}
  {#if muted}
    <line class="cross" x1="14.5" y1="9" x2="20.5" y2="15" />
    <line class="cross" x1="20.5" y1="9" x2="14.5" y2="15" />
  {/if}
  {#if soloed}
    <circle class="solo" cx="18" cy="17" r="5.5" />
    <text class="solo-s" x="18" y="19.9" text-anchor="middle">S</text>
  {/if}
</svg>

<style>
  svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .cone {
    fill: currentColor;
    fill-opacity: 0.25;
  }
  .solo {
    fill: var(--amber);
    stroke: var(--surface);
    stroke-width: 1.2;
  }
  .solo-s {
    fill: var(--on-amber);
    stroke: none;
    font-size: 8.5px;
    font-weight: 800;
  }
</style>
