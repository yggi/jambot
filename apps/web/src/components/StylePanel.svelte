<!--
  The style, a card. Folded: the preset it matches (`presetOf`; energy and
  entropy don't make a style custom), or for a custom style the preset nearest,
  as the session's "Now playing" names it, over what the band is doing
  (playing it, gliding to it, or for a custom style "Custom" and the preset it
  drifts toward, else its most telling axes); the glyph is a radar of the five axes drawn from the
  style the band is at (`hud.style.axes`), so a glide moves it. Unfolded, the
  genre presets as a segmented choice, four to a row (the same component as the key's scale), and each axis as a gauge with a drag and
  a nudge. The gauge shows where the axis is going, not the glide, and the
  preset checked is the one the style is at or heading for, none for a custom
  style. The drag is a transparent range input laid over the gauge, so the
  gauge is what is seen and the input what a keyboard and a finger reach. A
  nudge is a tenth of the axis. The host, or a band playing alone, drags and
  nudges and picks presets. A client's drag and presets rest and its nudges
  are disabled and say so, since its style intents don't reach the host yet
  (`Player.apply` drops them): the buttons are the seam, and what a client's
  nudge of an axis means is open (#217). Swing is not an axis: the Metrum
  card holds it, as the meter's (#360), and a preset sets it there too.
  Each preset glows as near as the style heard is to it (`presetGlow`), so a
  style halfway between two lights both. Under them the radio (#313), a
  switch: on the air, the band drifts through style space by itself a section
  at a time, until a preset or an axis it walks takes it back. It rests on a
  client, whose host's radio it follows.
-->
<script lang="ts">
  import { PRESETS, type StyleTrack } from '@jambot/engine';
  import type { Intent } from '../conductor.ts';
  import { type StyleAxis, type StyleView, presetGlow, styleName, styleSub } from '../hud.ts';
  import Card from './Card.svelte';
  import Gauge from './Gauge.svelte';
  import Radar from './glyphs/Radar.svelte';
  import Nudge from './Nudge.svelte';
  import Reading from './Reading.svelte';
  import Segmented from './Segmented.svelte';

  interface Props {
    track: StyleTrack;
    style: StyleView;
    /** Whether a client follows its host: it can't drag or pick a preset, and its nudges wait. */
    following?: boolean;
    /** Whether the radio is on the air (#313). */
    radio?: boolean;
    /** Put the radio on the air or take it off; none where nothing tunes it. */
    ontune?: ((on: boolean) => void) | undefined;
    onintent: (intent: Intent) => void;
  }

  let { track, style, following = false, radio = false, ontune, onintent }: Props = $props();

  const glow = $derived(presetGlow(style.axes));

  /** Why a client's nudges are disabled: its style intents don't reach the host yet. */
  const HOST_SETS = 'The host sets the style';

  /** How far a nudge moves an axis. */
  const STEP = 0.1;

  const AXES: { axis: StyleAxis; label: string; ends: [string, string] }[] = [
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

<Card title="Style" main={styleName(style)} sub={styleSub(style, following, radio)} live>
  {#snippet glyph()}<Radar values={AXES.map(({ axis }) => style.axes[axis])} />{/snippet}
  <Segmented
    label="Genre presets"
    value={style.preset ?? ''}
    options={PRESETS.map((p, i) => ({ value: p.name, text: p.name, glow: glow[i] ?? 0 }))}
    columns={4}
    disabled={following}
    onselect={(name) => {
      const preset = PRESETS.find((p) => p.name === name);
      if (preset) onintent({ kind: 'preset', preset });
    }}
  />
  {#if ontune}
    <label class="radio">
      <input
        type="checkbox"
        role="switch"
        aria-label="Radio"
        checked={radio}
        disabled={following}
        title={following ? HOST_SETS : undefined}
        onchange={(e) => ontune(e.currentTarget.checked)}
      />
      <span class="name">Radio</span>
      <span class="note"
        >{radio
          ? 'Drifting through style space, a section at a time. A preset or an axis takes it back.'
          : 'Holding the style you set.'}</span
      >
    </label>
  {/if}
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
  .radio {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    align-items: center;
    gap: 4px 10px;
    font-size: 14px;
  }
  .radio input {
    width: 36px;
    height: 20px;
    margin: 0;
    accent-color: var(--teal);
  }
  .radio .name {
    font-weight: 700;
  }
  .radio .note {
    font-size: 12.5px;
    color: var(--muted);
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
