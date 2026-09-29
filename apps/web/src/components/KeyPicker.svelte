<!--
  The key picker: the mode, and the circle of fifths, showing the key the
  band is heading for over the harmonic history: every pitch class actually
  played lately, weighted and fading. The host, or a band playing alone, sets
  the key: a dot wishes for its tonic, the mode select for its mode. A client
  only nudges it a fifth up or down. Either way it is a wish, heard from the
  next section the band plans, and held within the style's licence of the
  song's home key (`licence.ts`), so the tonics beyond it are dimmed.
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
  import { mod, positions } from '@jambot/theory';
  import type { Intent } from '../conductor.ts';
  import CircleOfFifths from './CircleOfFifths.svelte';

  interface Props {
    /** The key the band is heading for. */
    heading: Key | null;
    /** One weight per pitch class, 0–11, for the harmonic-history radar. */
    history: readonly number[];
    /** How many fifths from the home key the licence lets the key go (`KEY_REACH`). */
    reach: number;
    /** Whether a client follows its host: it may nudge the key, not set it. */
    following?: boolean;
    onintent: (intent: Intent) => void;
  }

  let { heading, history, reach, following = false, onintent }: Props = $props();

  const key = $derived(heading ?? INITIAL_KEY);
  const scale = $derived(positions(keyHelix(key)));
  /** The tonics the licence doesn't reach, in the mode playing. */
  const beyond = $derived(
    [...Array(12).keys()].filter(
      (tonic) => intoReach({ tonic, mode: key.mode }, INITIAL_KEY, reach).tonic !== tonic,
    ),
  );

  /** A fifth up the wheel (clockwise) or down (counter-clockwise) from the key heard, in its mode. */
  const nudged = (by: 1 | -1) => mod(key.tonic + 7 * by, 12);
  const nudge = (by: 1 | -1) =>
    onintent({ kind: 'key', wish: { tonic: nudged(by), mode: key.mode } });

  const wish = (tonic: number, mode: ComposerMode) =>
    onintent({ kind: 'key', wish: { tonic, mode } });
</script>

<div class="key" role="group" aria-label="Key">
  <label class="mode">
    Mode
    <select
      disabled={following}
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
        onintent={following ? undefined : onintent}
        {history}
      />
    </div>
    <div class="side">
      <div class="nudge" role="group" aria-label="Nudge the key">
        <button
          type="button"
          title="A fifth down"
          disabled={beyond.includes(nudged(-1))}
          onclick={() => nudge(-1)}>↺ Nudge down</button
        >
        <button
          type="button"
          title="A fifth up"
          disabled={beyond.includes(nudged(1))}
          onclick={() => nudge(1)}>Nudge up ↻</button
        >
      </div>
      <p class="caption">
        {following
          ? 'The host sets the key. Nudge it a fifth either way, within the style’s licence.'
          : 'Pick a pitch class, or nudge a fifth either way, within the style’s licence.'}
        The shaded shape is what the band has actually played lately, weighted and fading.
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
  .nudge {
    display: flex;
    gap: 8px;
  }
  .nudge button {
    min-height: 44px;
    padding: 0 16px;
    border-radius: 22px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .nudge button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .caption {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
