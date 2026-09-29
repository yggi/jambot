<!--
  The key picker, folded to a header: the key the band is heading for, in
  common terms ("C major"). Unfolded, two views of the one key, both shown,
  that complement each other. The circle of fifths selects and nudges the
  tonic and shows the scale's shape on it, over the harmonic history: every
  pitch class actually played lately, weighted and fading. Under it the scale
  selects the shape, the mode, from all seven, of which the band plays four
  (the others are dimmed), and lays it out as 8 marks on the 12 steps of the
  octave, with the notes and the whole or half steps between them. Changing the shape keeps the tonic, and nudging the tonic
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
  import { DIATONIC_MODE_NAMES } from '@jambot/theory';
  import { MODE_NAMES, keyName, scaleMarks, scaleNoteNames, scaleSteps } from '../noteNames.ts';
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

  const notes = $derived(scaleNoteNames(scale, key.tonic));
  const steps = $derived(scaleSteps(scale, key.tonic));
  const marks = $derived(scaleMarks(scale, key.tonic));
  const playable = (mode: string): mode is ComposerMode =>
    (COMPOSER_MODES as readonly string[]).includes(mode);

  /** The ruler's geometry: 12 steps across, a mark on each note. */
  const RULER = { pad: 14, step: 22 };
  const at = (semitones: number) => RULER.pad + semitones * RULER.step;

  const wish = (tonic: number, mode: ComposerMode) =>
    onintent({ kind: 'key', wish: { tonic, mode } });
</script>

<details class="key" aria-label="Key">
  <summary>
    <span class="name">{keyName(key)}</span>
    <span class="sub">the key the band is heading for</span>
  </summary>

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
  <div class="shapes" role="radiogroup" aria-label="Scale">
    {#each DIATONIC_MODE_NAMES as mode (mode)}
      <button
        type="button"
        role="radio"
        aria-checked={mode === key.mode}
        disabled={following || !playable(mode)}
        onclick={() => playable(mode) && wish(key.tonic, mode)}>{MODE_NAMES[mode]}</button
      >
    {/each}
  </div>
  <svg
    class="ruler"
    viewBox="0 0 {2 * RULER.pad + 12 * RULER.step} 72"
    role="img"
    aria-label="{keyName(key)}: {notes.join(' ')}, steps {steps
      .map((n) => (n === 1 ? 'half' : 'whole'))
      .join(' ')}"
  >
    <line class="axis" x1={at(0)} x2={at(12)} y1="36" y2="36" />
    {#each { length: 13 }, semitone (semitone)}
      <line class="tick" x1={at(semitone)} x2={at(semitone)} y1="31" y2="41" />
    {/each}
    {#each marks as semitone, i (i)}
      <circle class="mark" class:tonic={i === 0 || i === 7} cx={at(semitone)} cy="36" r="7" />
      <text class="note" class:tonic={i === 0 || i === 7} x={at(semitone)} y="62">
        {notes[i % 7]}
      </text>
      {#if i < 7}
        <text class="step" x={(at(semitone) + at(marks[i + 1]!)) / 2} y="20">
          {steps[i] === 1 ? 'H' : 'W'}
        </text>
      {/if}
    {/each}
  </svg>
  <p class="caption">
    Whole and half steps from the tonic. Another scale keeps the tonic, {notes[0]}.
  </p>
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
  button[aria-checked='true'] {
    background: var(--teal-bg);
    border-color: var(--teal);
  }
  .nudge {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .shapes {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    background: var(--line);
    border: 1px solid var(--line);
    border-radius: 22px;
    overflow: hidden;
  }
  .shapes button {
    flex: 1 1 auto;
    padding: 0 12px;
    border: 0;
    border-radius: 0;
  }
  .wheel {
    width: min(360px, 100%);
    margin-inline: auto;
  }
  .ruler {
    display: block;
    width: 100%;
    max-width: 420px;
    margin-inline: auto;
  }
  .axis,
  .tick {
    stroke: var(--line);
    stroke-width: 1;
  }
  .mark {
    fill: var(--amber);
  }
  .mark.tonic {
    fill: var(--teal);
  }
  .note,
  .step {
    text-anchor: middle;
    font-size: 12px;
    fill: var(--ink);
  }
  .note.tonic {
    fill: var(--teal);
    font-weight: 700;
  }
  .step {
    fill: var(--muted);
    font-size: 11px;
  }
  .caption {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    text-align: center;
  }
</style>
