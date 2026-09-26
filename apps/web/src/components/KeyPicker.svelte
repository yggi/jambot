<!--
  The key picker: a tonic and a mode, showing the key the band is heading
  for. A key picked is a wish, heard from the next section the band plans.
  The tonics are named as the prototype names them.
-->
<script lang="ts">
  import { COMPOSER_MODES, type ComposerMode, INITIAL_KEY, type Key } from '@jambot/engine';
  import type { Intent } from '../conductor.ts';

  interface Props {
    /** The key the band is heading for. */
    heading: Key | null;
    onintent: (intent: Intent) => void;
  }

  let { heading, onintent }: Props = $props();

  const TONICS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const key = $derived(heading ?? INITIAL_KEY);

  const wish = (tonic: number, mode: ComposerMode) =>
    onintent({ kind: 'key', wish: { tonic, mode } });
</script>

<div class="key" role="group" aria-label="Key">
  <label>
    Key
    <select value={key.tonic} onchange={(e) => wish(+e.currentTarget.value, key.mode)}>
      {#each TONICS as name, tonic (tonic)}
        <option value={tonic}>{name}</option>
      {/each}
    </select>
  </label>
  <label>
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
</div>

<style>
  .key {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 18px;
  }
  label {
    display: grid;
    gap: 2px;
    font-size: 14px;
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
</style>
