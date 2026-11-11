<!--
  The loop menu (#628, #629): one trigger in the transport that opens a
  panel of what can play again, so the header carries one button whatever
  loops. The trigger says what plays (`loop`, `repeat`, `locked`, `2 bars`)
  and is lit while anything does. The panel holds the section's two
  choices, Repeat once and Lock, and the looper's windows of 1, 2 and 4
  bars, each with a line saying what it does now; one plays at a time, and
  the other's choices rest meanwhile, saying why. It opens under the
  trigger, fixed, since the transport clips what overflows it, and closes on
  a choice, a tap outside, or Escape, giving the focus back to the trigger.
-->
<script lang="ts">
  import { BAR_LOOPS } from '@jambot/engine';
  import type { LoopView, SectionAsk } from '../looper.ts';

  interface Props {
    view: LoopView;
    /** Whether the band plays: the trigger rests while it doesn't. */
    playing: boolean;
    onsection: (ask: SectionAsk) => void;
    onbars: (bars: number) => void;
  }

  let { view, playing, onsection, onbars }: Props = $props();

  let open = $state(false);
  let trigger: HTMLButtonElement | undefined = $state();
  let panel: HTMLDivElement | undefined = $state();
  let place = $state({ top: 0, right: 0 });

  const lit = $derived(view.state !== 'off' || view.bars !== null);
  const looperOn = $derived(view.bars !== null);
  const sectionOn = $derived(view.state !== 'off');

  const bars = (n: number) => (n === 1 ? '1 bar' : `${n} bars`);

  const sectionLine = $derived(
    looperOn
      ? 'Let the looper go to loop a section.'
      : view.state === 'repeat'
        ? 'The section plays to the end of its lap once more, then the song goes on.'
        : view.state === 'locked'
          ? 'Locked. Tap Lock again to let it go at the end of the lap.'
          : 'The section you hear plays again when it ends.',
  );
  const looperLine = $derived(
    sectionOn
      ? 'Let the section go to use the looper.'
      : looperOn
        ? `Looping the last ${bars(view.bars!)}. Tap it to let go at the end of the lap, or another to change it.`
        : 'The last bars play again from the next bar until you tap again. The song runs on beneath.',
  );

  function toggle() {
    if (!open && trigger) {
      const box = trigger.getBoundingClientRect();
      place = { top: box.bottom + 12, right: Math.max(16, innerWidth - box.right) };
    }
    open = !open;
  }

  function close(focus = false) {
    open = false;
    if (focus) trigger?.focus();
  }

  function chose(act: () => void) {
    act();
    close(true);
  }

  function outside(event: PointerEvent) {
    const target = event.target as Node | null;
    if (!open || !target) return;
    if (panel?.contains(target) || trigger?.contains(target)) return;
    close();
  }

  function key(event: KeyboardEvent) {
    if (open && event.key === 'Escape') close(true);
  }

  // A band that stops while the panel is open leaves nothing to choose.
  $effect(() => {
    if (!playing) open = false;
  });
</script>

<svelte:window onpointerdown={outside} onkeydown={key} />

<button
  bind:this={trigger}
  type="button"
  class="trigger"
  class:lit
  aria-label="Loop"
  aria-expanded={open}
  aria-controls="loop-menu"
  data-looping={view.state}
  title={playing
    ? 'Loop: repeat or lock the section, or loop the last bars'
    : 'Loops while the band plays'}
  disabled={!playing}
  onclick={toggle}
>
  <span class="glyph">
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 8 a4 4 0 0 1 4-4 h3 M15 12 a4 4 0 0 1-4 4 h-3" />
      <path d="M11 1.5 l2 2.5 -2 2.5 M9 13.5 l-2 2.5 2 2.5" />
    </svg>
    <svg class="caret" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 4 L5 6.5 L7.5 4" /></svg
    >
  </span>
  <span class="word">{view.word}</span>
</button>

{#if open}
  <div
    bind:this={panel}
    id="loop-menu"
    class="panel"
    role="group"
    aria-label="Loop menu"
    style:top="{place.top}px"
    style:right="{place.right}px"
  >
    <section aria-labelledby="loop-section">
      <h3 id="loop-section">Section <span>the one you hear</span></h3>
      <div class="pair">
        <button
          type="button"
          aria-pressed={view.state === 'repeat'}
          disabled={looperOn}
          onclick={() => chose(() => onsection('repeat'))}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path class="bold" d="M17.5 4 v16" />
            <path d="M20.5 4 v16" />
            <circle cx="12.5" cy="9" r="1.6" class="dot" />
            <circle cx="12.5" cy="15" r="1.6" class="dot" />
          </svg>
          Repeat once
        </button>
        <button
          type="button"
          aria-pressed={view.state === 'locked'}
          disabled={looperOn}
          onclick={() => chose(() => onsection('lock'))}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
            <path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 v2.5" />
          </svg>
          Lock
        </button>
      </div>
      <p>{sectionLine}</p>
    </section>
    <section aria-labelledby="loop-looper">
      <h3 id="loop-looper">Looper <span>the last bars</span></h3>
      <div class="windows">
        {#each BAR_LOOPS as n (n)}
          <button
            type="button"
            aria-label={`Loop the last ${n === 1 ? 'bar' : `${n} bars`}`}
            aria-pressed={view.bars === n}
            disabled={sectionOn}
            onclick={() => chose(() => onbars(n))}
            ><span class="count">{n}<small>{n === 1 ? 'bar' : 'bars'}</small></span></button
          >
        {/each}
      </div>
      <p>{looperLine}</p>
    </section>
    <footer>The radio holds while anything loops.</footer>
  </div>
{/if}

<style>
  .trigger {
    /* Over the transport's bar cells, which lie beneath everything in it. */
    position: relative;
    flex: none;
    height: 44px;
    min-width: 60px;
    padding: 0 8px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 1px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    line-height: 1.1;
  }
  .trigger:disabled {
    opacity: 0.55;
  }
  .trigger.lit {
    border-color: var(--teal);
    background: var(--teal-bg);
    color: var(--teal);
  }
  .trigger[aria-expanded='true'] {
    box-shadow: 0 0 0 2px var(--teal);
  }
  .glyph {
    display: flex;
    align-items: center;
    gap: 1px;
  }
  .word {
    white-space: nowrap;
  }
  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .glyph svg {
    width: 18px;
    height: 18px;
  }
  .glyph .caret {
    width: 9px;
    height: 9px;
    stroke-width: 1.6;
  }

  .panel {
    position: fixed;
    z-index: 20;
    width: min(320px, calc(100vw - 32px));
    display: grid;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 16px 34px rgb(0 0 0 / 0.25);
  }
  section {
    display: grid;
    gap: 8px;
  }
  h3 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  h3 {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  h3 span {
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }
  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.35;
    color: var(--muted);
  }
  .pair,
  .windows {
    display: grid;
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
  }
  .pair {
    grid-template-columns: 1fr 1fr;
  }
  .windows {
    grid-template-columns: repeat(3, 1fr);
  }
  .pair button,
  .windows button {
    min-height: 44px;
    border: 0;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
  }
  .pair button + button,
  .windows button + button {
    border-left: 1px solid var(--line);
  }
  .pair button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .pair svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.8;
  }
  .pair .bold {
    stroke-width: 3;
  }
  .pair .dot {
    fill: currentColor;
    stroke: none;
  }
  .windows button {
    display: grid;
    place-items: center;
    font-size: 17px;
    font-variant-numeric: tabular-nums;
  }
  .count {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .windows small {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
  }
  .pair button[aria-pressed='true'],
  .windows button[aria-pressed='true'] {
    background: var(--teal-bg);
    color: var(--teal);
    box-shadow: inset 0 0 0 1px var(--teal);
  }
  .windows button[aria-pressed='true'] small {
    color: var(--teal);
  }
  .pair button:disabled,
  .windows button:disabled {
    color: var(--muted);
    opacity: 0.5;
  }
  footer {
    padding-top: 10px;
    border-top: 1px solid var(--line);
    font-size: 12px;
    color: var(--muted);
  }
</style>
