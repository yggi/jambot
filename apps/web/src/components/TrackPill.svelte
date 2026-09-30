<!--
  A track's pill: label, content, toggle, one row of a fixed height. The
  content is the track (its lane, given as the children), and the toggle at
  the right is the volume glyph (`Speaker`), which shows the track's level,
  crossed out while it is muted and marked while it is soloed; pressed, the
  pill shows the faders in the track's place: mute (the speaker), the volume,
  solo, and a toggle back to the track. So every track sits in one stack, the
  faders not cutting it. What a fader shows is the level the track sounds at,
  none while it is muted or left out of a solo, and its setpoint comes back
  when they end (`shown`, `raised`, in `mix.ts`). Without `fader` it is a
  label and a lane alone: another player's, which has no fader.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Speaker from './Speaker.svelte';

  interface Props {
    /** The track's name: the group's, and what its buttons and slider are called. */
    label: string;
    /** Whether the faders are shown in place of the track; leave out for a pill with no faders. */
    fader?: boolean;
    /** The level shown, 0 to 1: none while muted or left out of a solo. */
    level?: number;
    muted?: boolean;
    soloed?: boolean;
    /** The label's colour, a player's; the band's own is the ink. */
    colour?: string;
    onview?: () => void;
    onlevel?: (level: number) => void;
    onmute?: () => void;
    onsolo?: () => void;
    /** The track itself. */
    children: Snippet;
  }

  let {
    label,
    fader,
    level = 1,
    muted = false,
    soloed = false,
    colour,
    onview,
    onlevel,
    onmute,
    onsolo,
    children,
  }: Props = $props();

  const percent = $derived(Math.round(level * 100));
</script>

<div class="pill" role="group" aria-label={label}>
  <span class="label" style:color={colour} title={label}>{label}</span>
  <div class="middle" class:faders={fader}>
    {#if fader}
      <button
        type="button"
        class="side"
        aria-label="Mute {label}"
        aria-pressed={muted}
        onclick={onmute}
      >
        <Speaker {level} {muted} />
      </button>
      <span class="between">
        <input
          type="range"
          min="0"
          max="100"
          aria-label="{label} volume"
          value={percent}
          style:--fill="{percent}%"
          oninput={(e) => onlevel?.(+e.currentTarget.value / 100)}
        />
      </span>
      <button
        type="button"
        class="side solo"
        aria-label="Solo {label}"
        aria-pressed={soloed}
        onclick={onsolo}>S</button
      >
    {:else}
      {@render children()}
    {/if}
  </div>
  <span class="end">
    {#if fader !== undefined}
      <button
        type="button"
        class="side"
        aria-label={fader ? `Show ${label} track` : `Show ${label} faders`}
        aria-expanded={fader}
        onclick={onview}
      >
        {#if fader}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 8h9M4 12h16M4 16h11" />
          </svg>
        {:else}
          <Speaker {level} {muted} {soloed} />
        {/if}
      </button>
    {/if}
  </span>
</div>

<style>
  .pill {
    display: grid;
    grid-template-columns: var(--pill-label, 4.6em) minmax(0, 1fr) var(--pill-end, 46px);
    align-items: stretch;
    height: 44px;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 22px;
    overflow: hidden;
    background: var(--surface);
  }
  .label {
    display: flex;
    align-items: center;
    padding-left: 14px;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 600;
  }
  .middle {
    display: grid;
    align-items: center;
    min-width: 0;
    padding-block: 6px;
    border-inline: 1px solid var(--line);
  }
  .middle.faders {
    grid-template-columns: 46px minmax(0, 1fr) 46px;
    padding-block: 0;
    border-inline: 1px solid var(--line);
  }
  .end {
    display: grid;
  }
  .side {
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
  .end .side[aria-expanded] {
    height: 100%;
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
  .between {
    display: grid;
    align-items: center;
    min-width: 0;
    padding-inline: 14px;
    border-inline: 1px solid var(--line);
    height: 100%;
  }
  input {
    width: 100%;
    margin: 0;
    height: 24px;
    accent-color: var(--amber);
    background: none;
  }
</style>
