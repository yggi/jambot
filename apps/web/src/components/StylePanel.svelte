<!--
  The style: the genre presets and the six sliders. The sliders show where
  each axis is going, not the glide, and the preset pressed is the one the
  style is at or heading for (`presetOf`), none for a custom style.
-->
<script lang="ts">
  import { type Axis, PRESETS, type StyleTrack } from '@jambot/engine';
  import type { Intent } from '../conductor.ts';

  interface Props {
    track: StyleTrack;
    /** The preset the style is at or heading for, or null for a custom style. */
    preset: string | null;
    onintent: (intent: Intent) => void;
  }

  let { track, preset, onintent }: Props = $props();

  const SLIDERS: { axis: Axis; label: string; ends: string[] }[] = [
    { axis: 'swing', label: 'Swing', ends: ['straight', 'shuffled', 'swung'] },
    { axis: 'sync', label: 'Syncopation', ends: ['on the beat', 'off the beat'] },
    { axis: 'harm', label: 'Harmony', ends: ['static vamp', 'moving, rich'] },
    { axis: 'artic', label: 'Articulation', ends: ['legato', 'staccato'] },
    { axis: 'energy', label: 'Energy', ends: ['sparse', 'dense'] },
    { axis: 'entropy', label: 'Entropy', ends: ['predictable', 'surprising'] },
  ];
</script>

<section class="style" aria-label="Style">
  <div class="presets" role="group" aria-label="Genre presets">
    {#each PRESETS as p (p.name)}
      <button
        type="button"
        aria-pressed={preset === p.name}
        onclick={() => onintent({ kind: 'preset', preset: p })}
      >
        {p.name}
      </button>
    {/each}
  </div>
  <div class="sliders">
    {#each SLIDERS as s (s.axis)}
      <label>
        {s.label}
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(track[s.axis].to * 100)}
          oninput={(e) =>
            onintent({ kind: 'axis', axis: s.axis, value: +e.currentTarget.value / 100 })}
        />
        <span class="ends">
          {#each s.ends as end (end)}<span>{end}</span>{/each}
        </span>
      </label>
    {/each}
  </div>
</section>

<style>
  .style {
    display: grid;
    gap: 10px;
  }
  .presets {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 2px 6px;
  }
  .presets button {
    flex: none;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 19px;
    border: 1px solid var(--line);
    background: var(--surface);
    font-size: 14px;
    font-weight: 500;
  }
  .presets button[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--bg);
  }
  .sliders {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 18px;
  }
  .sliders label {
    display: grid;
    font-size: 14px;
  }
  .ends {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--muted);
    margin-top: -4px;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--amber);
    min-height: 32px;
    margin: 0;
  }
  @media (max-width: 420px) {
    .sliders {
      gap: 4px 12px;
    }
  }
</style>
