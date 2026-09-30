<!--
  A track slider: one pill, as the nudge is, for what a mixing desk gives a
  track. At its left a mute, drawn as a speaker that is crossed out while the
  track is muted; in the middle its volume, kept inside the pill so its
  thumb never runs over the buttons; at its right a solo. A mute and a solo
  are pressed (amber), the level is shown while muted too.
-->
<script lang="ts">
  interface Props {
    /** The track's name: the group's, and what its buttons and slider are called. */
    label: string;
    /** Its level, 0 to 1. */
    level: number;
    muted: boolean;
    soloed: boolean;
    onlevel: (level: number) => void;
    onmute: () => void;
    onsolo: () => void;
  }

  let { label, level, muted, soloed, onlevel, onmute, onsolo }: Props = $props();

  const percent = $derived(Math.round(level * 100));
</script>

<div class="slider" role="group" aria-label={label}>
  <button
    type="button"
    class="side"
    aria-label="Mute {label}"
    aria-pressed={muted}
    onclick={onmute}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path class="cone" d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
      {#if muted}
        <line class="cross" x1="15" y1="9" x2="21" y2="15" />
        <line class="cross" x1="21" y1="9" x2="15" y2="15" />
      {:else}
        <path class="wave" d="M15 9.5a4 4 0 0 1 0 5" />
        <path class="wave" d="M17.5 7a7.5 7.5 0 0 1 0 10" />
      {/if}
    </svg>
  </button>
  <span class="between">
    <input
      type="range"
      min="0"
      max="100"
      aria-label="{label} volume"
      value={percent}
      style:--fill="{percent}%"
      oninput={(e) => onlevel(+e.currentTarget.value / 100)}
    />
  </span>
  <button
    type="button"
    class="side"
    aria-label="Solo {label}"
    aria-pressed={soloed}
    onclick={onsolo}>S</button
  >
</div>

<style>
  .slider {
    display: flex;
    align-items: stretch;
    height: 40px;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 20px;
    overflow: hidden;
    background: var(--surface);
  }
  .side {
    flex: none;
    width: 46px;
    display: grid;
    place-items: center;
    border: 0;
    background: none;
    font-size: 14px;
    font-weight: 700;
    color: var(--muted);
  }
  .side:hover {
    background: var(--teal-bg);
  }
  .side[aria-pressed='true'] {
    background: var(--amber);
    color: var(--on-amber);
  }
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
  .between {
    flex: 1;
    min-width: 0;
    display: grid;
    align-items: center;
    padding-inline: 14px;
    border-inline: 1px solid var(--line);
  }
  input {
    width: 100%;
    margin: 0;
    height: 24px;
    accent-color: var(--amber);
    background: none;
  }
</style>
