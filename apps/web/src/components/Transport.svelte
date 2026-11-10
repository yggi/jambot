<!--
  The transport, the band screen's header: Start or Stop, the section and
  bar heard over the tempo, the meter and the key, and the bar itself as its
  background, a cell per pulse as long as the pulse is in eighths, the cell
  heard lit and its eighths as dots, so the beat is seen at a glance. In the
  count-in the beats still to come are hatched, one stripe across them all,
  and the line counts them down; while the band ends the button is an
  outline, the last bar's beats still to come are hatched the same way, and
  a second Stop stops it now. A device that doesn't set the band, a client
  (`Can`), has neither button: its host starts and stops the band. The loop
  button plays a section again (#628, `looper.ts`): a tap repeats the section
  heard once, a second locks it, a third lets it go at the end of its lap; it
  says which. Beside it the looper (#629): 1, 2 or 4 bars, a tap plays the
  last bars again from the next bar, locked, while the song runs on beneath;
  a second lets it go at the end of its lap, another window halves or doubles
  it. One plays at a time, and the other rests meanwhile. It stays one height
  whatever it says, so nothing under it moves.
  It is the transport of whatever a screen plays: the lobby's metronome,
  timing test and tuner use it too, with their own labels, their bar's cells
  or none, and no loop.
-->
<script lang="ts">
  import type { Meter } from '@jambot/theory';
  import type { Phase } from '../sessionState.ts';
  import { BAR_LOOPS } from '@jambot/engine';
  import type { LoopState } from '../looper.ts';
  import { transportCells, transportHeard } from '../transportView.ts';

  interface Props {
    /** The line, large, and the one under it (`transportLine`). */
    main: string;
    sub: string;
    /** The meter of the bar heard, or of the count-in's; none for what has no bar. */
    meter: Meter | null;
    /** The step heard, or of the count-in's bar while it counts; null before either. */
    step: number | null;
    phase: Phase | null;
    /** Whether the bar heard is the band's last, while it ends: its beats still to come are hatched. */
    last?: boolean;
    /** Whether the band is playing or about to: the button reads Stop. */
    playing: boolean;
    /** Whether this device starts and stops the band (`Can`'s `set`): a client's host does. */
    sets?: boolean;
    ontoggle: () => void;
    /** What the button says to a screen reader, stopped and playing. */
    labels?: { start: string; stop: string };
    /** Whether Stop asks the band to end on a cadence, as the band's does, and a second stops it now. */
    cadence?: boolean;
    /** What the loop button says, where there is one: the band's has (#628). */
    looping?: LoopState;
    /** A tap on the loop button. */
    onloop?: () => void;
    /** How many bars the looper plays, or null for none (#629). */
    looped?: number | null;
    /** A tap on the looper's window of `bars`; none draws no looper. */
    onbars?: (bars: number) => void;
    /** Whether the button rests for a moment, as while a microphone is asked for. */
    busy?: boolean;
  }

  let {
    main,
    sub,
    meter,
    step,
    phase,
    last = false,
    playing,
    sets = true,
    ontoggle,
    labels = { start: 'Start the band', stop: 'Stop' },
    cadence = true,
    looping,
    onloop,
    looped = null,
    onbars,
    busy = false,
  }: Props = $props();

  /** What the loop button says and what a tap on it will do, by its state. */
  const LOOP_WORDS: Record<LoopState, { word: string; title: string }> = {
    off: { word: 'loop', title: 'Repeat this section once' },
    repeat: { word: 'repeat', title: 'Repeating this section once: tap to lock it' },
    locked: { word: 'locked', title: 'Section locked: tap to let it go at the end of the lap' },
  };

  const cells = $derived(meter ? transportCells(meter) : []);
  const lit = $derived(meter ? transportHeard(meter, step) : null);
  /** The first cell still to come, where its beats are hatched: the count-in's, or the last bar's while the band ends. */
  const hatchFrom = $derived(
    lit !== null &&
      (phase === 'counting' || (phase === 'ending' && last)) &&
      lit.cell + 1 < cells.length
      ? lit.cell + 1
      : null,
  );
</script>

<section class="transport" aria-label="Transport">
  <div
    class="cells"
    aria-hidden="true"
    style:grid-template-columns={cells.map((c) => `${c}fr`).join(' ')}
  >
    {#if hatchFrom !== null}
      <div class="hatch" style:grid-column="{hatchFrom + 1} / -1"></div>
    {/if}
    {#each cells as eighths, i (i)}
      <div
        class="cell"
        class:on={lit?.cell === i}
        class:down={lit?.cell === i && i === 0}
        class:ahead={hatchFrom !== null && i >= hatchFrom}
      >
        <span class="dots">
          {#each { length: eighths }, j (j)}
            <i class:on={lit?.cell === i && j <= lit.within}></i>
          {/each}
        </span>
      </div>
    {/each}
  </div>
  {#if sets}
    <button
      type="button"
      class="play"
      class:ending={phase === 'ending'}
      disabled={busy}
      title={!cadence
        ? undefined
        : phase === 'ending'
          ? 'Stop again to stop now'
          : playing
            ? 'Stops on a cadence: the band plays to the end of its next bar'
            : undefined}
      aria-label={playing ? labels.stop : labels.start}
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
  {/if}
  <div class="what">
    <b title={main}>{main}</b>
    <span title={sub}>{sub}</span>
  </div>
  {#if onbars && sets}
    <div class="bars" role="group" aria-label="Looper">
      {#each BAR_LOOPS as bars (bars)}
        <button
          type="button"
          aria-label={`Loop the last ${bars === 1 ? 'bar' : `${bars} bars`}`}
          aria-pressed={looped === bars}
          title={looped === bars
            ? 'Looping: tap to let it go at the end of its lap'
            : looped !== null
              ? `Loop ${bars === 1 ? 'one bar' : `${bars} bars`} instead, from where the loop ends`
              : `Play the last ${bars === 1 ? 'bar' : `${bars} bars`} again until tapped`}
          disabled={!playing || (looping !== undefined && looping !== 'off')}
          onclick={() => onbars(bars)}>{bars}</button
        >
      {/each}
    </div>
  {/if}
  {#if looping !== undefined && onloop && sets}
    <button
      type="button"
      class="loop"
      aria-label="Loop"
      aria-pressed={looping !== 'off'}
      data-looping={looping}
      title={LOOP_WORDS[looping].title}
      disabled={!playing || looped !== null}
      onclick={onloop}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 8 a4 4 0 0 1 4-4 h3 M15 12 a4 4 0 0 1-4 4 h-3" />
        <path d="M11 1.5 l2 2.5 -2 2.5 M9 13.5 l-2 2.5 2 2.5" />
      </svg>
      <span>{LOOP_WORDS[looping].word}</span>
    </button>
  {/if}
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
    grid-row: 1;
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
  /* One stripe across every cell still to come, so it runs on unbroken over their borders. */
  .hatch {
    grid-row: 1;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      color-mix(in srgb, var(--amber) 16%, transparent) 0 6px,
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
  .bars {
    flex: none;
    display: flex;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
  }
  .bars button {
    width: 28px;
    border: 0;
    background: var(--surface);
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .bars button + button {
    border-left: 1px solid var(--line);
  }
  .bars button[aria-pressed='true'],
  .loop[aria-pressed='true'] {
    border-color: var(--teal);
    background: var(--teal-bg);
    color: var(--teal);
  }
</style>
