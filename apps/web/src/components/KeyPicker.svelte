<!--
  The key picker: the mode, and the circle of fifths, showing the key the
  band is heading for. A dot nudges the key there: a wish, heard from the
  next section the band plans, and held within the style's licence of the
  song's home key (`licence.ts`), so the dots beyond it are dimmed. A toggle bares an experiment on the
  same wheel: a live radar of the harmonic history, every pitch class
  actually played lately, weighted and fading, not just the current scale.
-->
<script lang="ts">
  import {
    COMPOSER_MODES,
    type ComposerMode,
    INITIAL_KEY,
    type Key,
    intoReach,
    keyHelix,
  } from '@jambot/engine';
  import { positions } from '@jambot/theory';
  import type { Intent } from '../conductor.ts';
  import CircleOfFifths from './CircleOfFifths.svelte';

  interface Props {
    /** The key the band is heading for. */
    heading: Key | null;
    /** One weight per pitch class, 0–11, for the harmonic-history radar. */
    history: readonly number[];
    /** How many fifths from the home key the licence lets the key go (`KEY_REACH`). */
    reach: number;
    onintent: (intent: Intent) => void;
  }

  let { heading, history, reach, onintent }: Props = $props();

  const key = $derived(heading ?? INITIAL_KEY);
  const scale = $derived(positions(keyHelix(key)));
  /** The tonics the licence doesn't reach, in the mode playing. */
  const beyond = $derived(
    [...Array(12).keys()].filter(
      (tonic) => intoReach({ tonic, mode: key.mode }, INITIAL_KEY, reach).tonic !== tonic,
    ),
  );

  let showHistory = $state(false);

  const wish = (tonic: number, mode: ComposerMode) =>
    onintent({ kind: 'key', wish: { tonic, mode } });
</script>

<div class="key" role="group" aria-label="Key">
  <label class="mode">
    Mode
    <select
      value={key.mode}
      onchange={(e) => wish(key.tonic, e.currentTarget.value as ComposerMode)}
    >
      {#each COMPOSER_MODES as mode (mode)}
        <option value={mode}>{mode}</option>
      {/each}
    </select>
  </label>
  <div class="wheel-row">
    <div class="wheel">
      <CircleOfFifths
        tonic={key.tonic}
        {scale}
        mode={key.mode}
        {beyond}
        {onintent}
        history={showHistory ? history : undefined}
      />
    </div>
    <div class="side">
      <label class="toggle">
        <input type="checkbox" bind:checked={showHistory} />
        Harmonic history
      </label>
      <p class="caption">
        {showHistory
          ? 'Every pitch class the band has actually played lately, weighted and fading — not just the current scale.'
          : 'Click a pitch class to nudge the key there, within the style’s licence. Toggle to see what the band has actually played.'}
      </p>
    </div>
  </div>
</div>

<style>
  .key {
    display: grid;
    gap: 14px;
  }
  .mode {
    display: grid;
    gap: 2px;
    font-size: 14px;
    max-width: 200px;
  }
  select {
    font: inherit;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    min-height: 38px;
    padding: 0 8px;
  }
  .wheel-row {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  .wheel {
    width: min(320px, 100%);
    flex-shrink: 0;
  }
  .side {
    display: grid;
    gap: 6px;
    min-width: 0;
    flex: 1 1 200px;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;
  }
  .caption {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
