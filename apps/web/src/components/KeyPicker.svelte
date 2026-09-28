<!--
  The key picker: the mode, and the circle of fifths as the tonic picker,
  showing the key the band is heading for. A key picked is a wish, heard
  from the next section the band plans. A toggle bares an experiment on the
  same wheel: a live radar of the harmonic history, every pitch class
  actually played lately, weighted and fading, not just the current scale.
-->
<script lang="ts">
  import {
    COMPOSER_MODES,
    type ComposerMode,
    INITIAL_KEY,
    type Key,
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
    onintent: (intent: Intent) => void;
  }

  let { heading, history, onintent }: Props = $props();

  const key = $derived(heading ?? INITIAL_KEY);
  const scale = $derived(positions(keyHelix(key)));

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
          : 'Click a pitch class to wish for it as the tonic. Toggle to see what the band has actually played.'}
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
    flex: 1;
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
