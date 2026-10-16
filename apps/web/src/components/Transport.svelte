<!--
  The transport, the band screen's header: Start or Stop, the section and
  bar heard over the tempo, the meter and the key, and the bar itself as its
  background, a cell per pulse as long as the pulse is in eighths, the cell
  heard lit and its eighths as dots, so the beat is seen at a glance. In the
  count-in the beats still to come are hatched and the line counts them
  down; while the band ends the button is an outline, and a second Stop
  stops it now. A client's button rests, since its host starts and stops the
  band. The loop toggle is the place for holding a section and is not wired
  yet (#327). It stays one height whatever it says, so nothing under it moves.
-->
<script lang="ts">
  import type { Meter } from '@jambot/theory';
  import type { Phase } from '../sessionState.ts';
  import { transportCells, transportHeard } from '../transportView.ts';

  interface Props {
    /** The line, large, and the one under it (`transportLine`). */
    main: string;
    sub: string;
    /** The meter of the bar heard, or of the count-in's. */
    meter: Meter;
    /** The step heard, or of the count-in's bar while it counts; null before either. */
    step: number | null;
    phase: Phase | null;
    /** Whether the band is playing or about to: the button reads Stop. */
    playing: boolean;
    /** Whether this device follows a host, whose band it doesn't start or stop. */
    following?: boolean;
    ontoggle: () => void;
  }

  let { main, sub, meter, step, phase, playing, following = false, ontoggle }: Props = $props();

  let looping = $state(false);

  const cells = $derived(transportCells(meter));
  const lit = $derived(transportHeard(meter, step));
</script>

<section class="transport" aria-label="Transport">
  <div
    class="cells"
    aria-hidden="true"
    style:grid-template-columns={cells.map((c) => `${c}fr`).join(' ')}
  >
    {#each cells as eighths, i (i)}
      <div
        class="cell"
        class:on={lit?.cell === i}
        class:down={lit?.cell === i && i === 0}
        class:ahead={phase === 'counting' && lit !== null && i > lit.cell}
      >
        <span class="dots">
          {#each { length: eighths }, j (j)}
            <i class:on={lit?.cell === i && j <= lit.within}></i>
          {/each}
        </span>
      </div>
    {/each}
  </div>
  <button
    type="button"
    class="play"
    class:ending={phase === 'ending'}
    disabled={following}
    title={following
      ? 'The host starts and stops the band'
      : phase === 'ending'
        ? 'Stop again to stop now'
        : playing
          ? 'Stops on a cadence: the band plays to the end of its next bar'
          : undefined}
    aria-label={playing ? 'Stop' : 'Start the band'}
    onclick={ontoggle}
  >
    <svg viewBox="0 0 20 20" aria-hidden="true">
      {#if playing}
        <rect x="5" y="5" width="10" height="10" rx="1.5" />
      {:else}
        <path d="M6.5 4.5 L16 10 L6.5 15.5 Z" />
      {/if}
    </svg>
  </button>
  <div class="what">
    <b title={main}>{main}</b>
    <span title={sub}>{sub}</span>
  </div>
  <button
    type="button"
    class="loop"
    aria-pressed={looping}
    title="Loop this section (not wired yet)"
    onclick={() => (looping = !looping)}
  >
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 8 a4 4 0 0 1 4-4 h3 M15 12 a4 4 0 0 1-4 4 h-3" />
      <path d="M11 1.5 l2 2.5 -2 2.5 M9 13.5 l-2 2.5 2 2.5" />
    </svg>
    <span>loop</span>
  </button>
</section>

<style>
  .transport {
    position: relative;
    height: 64px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--surface);
    overflow: hidden;
  }
  .transport > :not(.cells) {
    position: relative;
  }
  .cells {
    position: absolute;
    inset: 0;
    display: grid;
  }
  .cell {
    position: relative;
    border-right: 1px solid var(--line);
  }
  .cell:last-child {
    border-right: 0;
  }
  .cell.on {
    background: color-mix(in srgb, var(--amber) 16%, var(--surface));
  }
  .cell.on.down {
    background: color-mix(in srgb, var(--amber) 32%, var(--surface));
  }
  .cell.ahead {
    background: repeating-linear-gradient(
      135deg,
      color-mix(in srgb, var(--amber) 16%, var(--surface)) 0 6px,
      transparent 6px 12px
    );
  }
  .dots {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 5px;
    display: flex;
    justify-content: space-around;
  }
  .dots i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--line);
  }
  .dots i.on {
    background: var(--amber);
  }
  .play {
    flex: none;
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: var(--amber);
    color: var(--on-amber);
  }
  .play.ending {
    background: var(--surface);
    color: var(--amber);
    box-shadow: inset 0 0 0 3px var(--amber);
  }
  .play:disabled {
    opacity: 0.5;
  }
  .play svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
  .what {
    flex: 1;
    min-width: 0;
    line-height: 1.15;
  }
  .what b,
  .what span {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .what b {
    font-size: 20px;
    font-variant-numeric: tabular-nums;
  }
  .what span {
    font-size: 12.5px;
    color: var(--muted);
  }
  .loop {
    flex: none;
    height: 44px;
    min-width: 52px;
    padding: 0 8px;
    display: grid;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    line-height: 1.1;
  }
  .loop svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .loop[aria-pressed='true'] {
    border-color: var(--teal);
    background: var(--teal-bg);
    color: var(--teal);
  }
</style>
