<!--
  The style, a card. Folded: the closest named style (`presetOf`; Custom where
  no preset matches, and energy and entropy don't make a style custom) over
  what the band is doing (playing it, gliding to it, or for a custom style
  its most telling axes); the glyph is a radar of the six axes drawn from the
  style the band is at (`hud.style.axes`), so a glide moves it. Unfolded, the
  genre presets as chips that wrap, and each axis as a gauge with a drag and
  a nudge. The gauge shows where the axis is going, not the glide, and the
  preset pressed is the one the style is at or heading for, none for a custom
  style. The drag is a transparent range input laid over the gauge, so the
  gauge is what is seen and the input what a keyboard and a finger reach. A
  nudge is a tenth of the axis. The host, or a band playing alone, drags and
  nudges and picks presets. A client's drag and presets rest and its nudges
  are disabled and say so, since its style intents don't reach the host yet
  (`Player.apply` drops them): the buttons are the seam, and what a client's
  nudge of an axis means is open (#217).
-->
<script lang="ts">
  import { PRESETS, type StyleTrack } from '@jambot/engine';
  import type { Intent } from '../conductor.ts';
  import { type StyleAxis, type StyleView, styleName, styleSub } from '../hud.ts';
  import Card from './Card.svelte';
  import Gauge from './Gauge.svelte';
  import Radar from './glyphs/Radar.svelte';
  import Nudge from './Nudge.svelte';
  import Reading from './Reading.svelte';

  interface Props {
    track: StyleTrack;
    style: StyleView;
    /** Whether a client follows its host: it can't drag or pick a preset, and its nudges wait. */
    following?: boolean;
    onintent: (intent: Intent) => void;
  }

  let { track, style, following = false, onintent }: Props = $props();

  /** Why a client's nudges are disabled: its style intents don't reach the host yet. */
  const HOST_SETS = 'The host sets the style';

  /** How far a nudge moves an axis. */
  const STEP = 0.1;

  const AXES: { axis: StyleAxis; label: string; ends: [string, string] }[] = [
    { axis: 'swing', label: 'Swing', ends: ['straight', 'swung'] },
    { axis: 'sync', label: 'Syncopation', ends: ['on the beat', 'off the beat'] },
    { axis: 'harm', label: 'Harmony', ends: ['static vamp', 'moving, rich'] },
    { axis: 'artic', label: 'Articulation', ends: ['legato', 'staccato'] },
    { axis: 'energy', label: 'Energy', ends: ['sparse', 'dense'] },
    { axis: 'entropy', label: 'Entropy', ends: ['predictable', 'surprising'] },
  ];

  const percent = (value: number) => Math.round(value * 100);
  /** An axis a step up or down, kept on the grid of tenths and in its range. */
  const stepped = (value: number, by: -1 | 1) =>
    Math.min(1, Math.max(0, Math.round((value + by * STEP) * 100) / 100));
</script>

<Card title="Style" main={styleName(style)} sub={styleSub(style, following)} live>
  {#snippet glyph()}<Radar values={AXES.map(({ axis }) => style.axes[axis])} />{/snippet}
  <div class="presets" role="group" aria-label="Genre presets">
    {#each PRESETS as p (p.name)}
      <button
        type="button"
        aria-pressed={style.preset === p.name}
        disabled={following}
        onclick={() => onintent({ kind: 'preset', preset: p })}
      >
        {p.name}
      </button>
    {/each}
  </div>
  <div class="axes">
    {#each AXES as a (a.axis)}
      {@const value = track[a.axis].to}
      <div class="axis">
        <Reading label={a.label} value="{percent(value)} %" />
        <div class="drag">
          <Gauge label="{a.label} {percent(value)} %" from={0} to={1} centre={0} {value} fill />
          <input
            type="range"
            min="0"
            max="100"
            aria-label={a.label}
            value={percent(value)}
            disabled={following}
            oninput={(e) =>
              onintent({ kind: 'axis', axis: a.axis, value: +e.currentTarget.value / 100 })}
          />
        </div>
        <Nudge
          label="Nudge {a.label.toLowerCase()}"
          down={{
            name: `${a.label} down`,
            glyph: '−',
            title: following ? HOST_SETS : `${a.label} down a tenth`,
            disabled: following || value <= 0,
          }}
          up={{
            name: `${a.label} up`,
            glyph: '+',
            title: following ? HOST_SETS : `${a.label} up a tenth`,
            disabled: following || value >= 1,
          }}
          onnudge={(by) => onintent({ kind: 'axis', axis: a.axis, value: stepped(value, by) })}
        >
          {a.ends[0]} – {a.ends[1]}
        </Nudge>
      </div>
    {/each}
  </div>
</Card>

<style>
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .presets button {
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
  .presets button:disabled {
    opacity: 0.6;
  }
  .presets button[aria-pressed='true']:disabled {
    opacity: 1;
  }
  .axes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 18px 24px;
  }
  .axis {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .drag {
    position: relative;
    display: grid;
    align-items: center;
    padding-block: 8px;
  }
  /* The range input lies over the gauge, unseen: it takes the finger and the keyboard. */
  input[type='range'] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  input[type='range']:disabled {
    cursor: default;
  }
  .drag:has(input:focus-visible) {
    outline: 2px solid var(--amber);
    outline-offset: 2px;
    border-radius: 6px;
  }
</style>
