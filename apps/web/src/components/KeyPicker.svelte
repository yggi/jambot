<!--
  The key picker, folded to a header: the key the band is heading for, in
  common terms ("C major"). Unfolded, two views of the one key that complement
  each other. The circle of fifths selects and nudges the tonic and shows the
  scale's shape on it, over the harmonic history: every pitch class actually
  played lately, weighted and fading. The scale view selects the shape, the
  mode, and lays the scale out in a line, its notes and the steps between them
  from the tonic. Changing the shape keeps the tonic, and nudging the tonic
  keeps the shape. The host, or a band playing alone, sets the key; a client
  only nudges the tonic a fifth up or down. Either way it is a wish, heard
  from the next section the band plans, and held within the style's licence of
  the song's home key (`licence.ts`), so the tonics beyond it are dimmed.
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
  import { MODE_NAMES, TONIC_NAMES, keyName, scaleNoteNames, scaleSteps } from '../noteNames.ts';
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

  let view = $state<'circle' | 'scale'>('circle');

  const notes = $derived(scaleNoteNames(scale, key.tonic));
  const steps = $derived(scaleSteps(scale, key.tonic));

  const wish = (tonic: number, mode: ComposerMode) =>
    onintent({ kind: 'key', wish: { tonic, mode } });
</script>

<details class="key" aria-label="Key">
  <summary>
    <span class="name">{keyName(key)}</span>
    <span class="sub">the key the band is heading for</span>
  </summary>

  <div class="views" role="group" aria-label="View">
    <button type="button" aria-pressed={view === 'circle'} onclick={() => (view = 'circle')}>
      Circle
    </button>
    <button type="button" aria-pressed={view === 'scale'} onclick={() => (view = 'scale')}>
      Scale
    </button>
  </div>

  {#if view === 'circle'}
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
  {:else}
    <div class="shapes" role="radiogroup" aria-label="Scale">
      {#each COMPOSER_MODES as mode (mode)}
        <button
          type="button"
          role="radio"
          aria-checked={mode === key.mode}
          disabled={following}
          onclick={() => wish(key.tonic, mode)}>{MODE_NAMES[mode]}</button
        >
      {/each}
    </div>
    <ol class="line" aria-label="Notes and steps from the tonic">
      {#each notes as note, i (note)}
        <li class:tonic={i === 0}>
          <b>{note}</b>
          <i>{steps[i] === 1 ? 'H' : 'W'}</i>
        </li>
      {/each}
      <li class="tonic octave"><b>{TONIC_NAMES[key.tonic]}</b></li>
    </ol>
    <p class="caption">
      Whole and half steps from the tonic. Another scale keeps the tonic, {TONIC_NAMES[key.tonic]}.
    </p>
  {/if}
</details>

<style>
  .key {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px 16px;
    min-width: 0;
  }
  .key > :not(summary) {
    margin-top: 14px;
  }
  summary {
    display: grid;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .name {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
  }
  .name::after {
    content: '▸';
    margin-left: 10px;
    font-size: 16px;
    color: var(--muted);
    display: inline-block;
    transition: transform 0.15s;
  }
  .key[open] .name::after {
    transform: rotate(90deg);
  }
  .sub {
    font-size: 13px;
    color: var(--muted);
  }
  button {
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    min-height: 44px;
    padding: 0 16px;
    border-radius: 22px;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  button[aria-pressed='true'],
  button[aria-checked='true'] {
    background: var(--teal-bg);
    border-color: var(--teal);
  }
  .views,
  .shapes,
  .nudge {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .shapes {
    gap: 6px;
  }
  .shapes button {
    padding: 0 12px;
  }
  .wheel {
    width: min(360px, 100%);
    margin-inline: auto;
  }
  .line {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    gap: 2px;
  }
  .line li {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 0;
    flex: 1 1 0;
    max-width: 56px;
    padding: 8px 0;
    border-radius: 8px;
  }
  .line b {
    font-size: 16px;
  }
  .line i {
    font-size: 12px;
    font-style: normal;
    color: var(--muted);
  }
  .line li.tonic b {
    color: var(--teal);
  }
  .line li.tonic {
    background: var(--teal-bg);
  }
  .caption {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    text-align: center;
  }
</style>
