<!--
  The style, a card. Folded: the preset it matches (`presetOf`; energy and
  entropy don't make a style custom), or for a custom style the preset nearest,
  as the session's "Now playing" names it, over what the band is doing
  (playing it, gliding to it, or for a custom style "Custom" and the preset it
  drifts toward, else its most telling axes); the glyph is a radar of the six axes drawn from the
  style the band is at (`hud.style.axes`), so a glide moves it. Unfolded, the
  genre presets as a segmented choice, four to a row (the same component as the key's scale), and each axis as a gauge with a drag and
  a nudge. The gauge shows where the axis is going, not the glide, and the
  preset checked is the one the style is at or heading for, none for a custom
  style. The drag is a transparent range input laid over the gauge, so the
  gauge is what is seen and the input what a keyboard and a finger reach. A
  nudge is a tenth of the axis. The host, or a band playing alone, drags and
  nudges and picks presets. A device that doesn't set the style, a client
  (`Can`), has none of them: it reads each axis as a gauge over its ends, and
  the header says the host sets it. A client's nudge, which asks the host
  rather than sets, comes with the brief's step 2 (#217,
  docs/briefs/session-roles.md). Swing is not an axis: the Metrum
  card holds it, as the meter's (#360), and a preset sets it there too.
  Each preset glows as near as the style heard is to it (`presetGlow`), so a
  style halfway between two lights both. Under them the radio (#313), a
  switch: on the air, the band drifts through style space by itself a section
  at a time, until a preset or an axis it walks takes it back. A client,
  which follows its host's radio, has no switch: its header says the radio.
-->
<script lang="ts">
  import {
    NUDGED,
    type Nudged,
    PRESETS,
    STYLE_AXIS_NAMES,
    STYLE_AXIS_WORDS,
    type StyleTrack,
  } from '@jambot/engine';
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
    /** Whether this device sets the style (`Can`'s `set`): a client's host does, and it draws no control. */
    sets?: boolean;
    /** Whether the radio is on the air (#313). */
    radio?: boolean;
    /** Put the radio on the air or take it off; none where nothing tunes it. */
    ontune?: ((on: boolean) => void) | undefined;
    onintent: (intent: Intent) => void;
    /** A player's, who doesn't set the style: nudge an axis a step, a bias the band leans by from the next section. */
    onnudge?: ((axis: Nudged, by: 1 | -1) => void) | undefined;
  }

  let { track, style, sets = true, radio = false, ontune, onintent, onnudge }: Props = $props();

  /** The axis and way this player nudged last, said under the axes until it nudges again. */
  let nudgedLast: { label: string; by: 1 | -1 } | null = $state(null);
  const nudge = (axis: Nudged, label: string, by: 1 | -1) => {
    onnudge?.(axis, by);
    nudgedLast = { label, by };
  };
  const nudges = (axis: StyleAxis): axis is Nudged & StyleAxis =>
    (NUDGED as readonly string[]).includes(axis);

  const glow = $derived(presetGlow(style.axes));

  /** How far a nudge moves an axis. */
  const STEP = 0.1;

  // (the style axes' words are cells', #596; energy's and entropy's are the track's own)
  const AXES: { axis: StyleAxis; label: string; ends: readonly [string, string] }[] = [
    ...STYLE_AXIS_NAMES.map((axis) => ({ axis, ...STYLE_AXIS_WORDS[axis] })),
    { axis: 'energy', label: 'Energy', ends: ['sparse', 'dense'] },
    { axis: 'entropy', label: 'Entropy', ends: ['predictable', 'surprising'] },
  ];

  const percent = (value: number) => Math.round(value * 100);
  /** An axis a step up or down, kept on the grid of tenths and in its range. */
  const stepped = (value: number, by: -1 | 1) =>
    Math.min(1, Math.max(0, Math.round((value + by * STEP) * 100) / 100));
</script>

<Card title="Style" main={styleName(style)} sub={styleSub(style, !sets, radio)} live>
  {#snippet glyph()}<Radar values={AXES.map(({ axis }) => style.axes[axis])} />{/snippet}
  {#if sets}
    <Segmented
      label="Genre presets"
      value={style.preset ?? ''}
      options={PRESETS.map((p, i) => ({ value: p.name, text: p.name, glow: glow[i] ?? 0 }))}
      columns={4}
      onselect={(name) => {
        const preset = PRESETS.find((p) => p.name === name);
        if (preset) onintent({ kind: 'preset', preset });
      }}
    />
  {/if}
  {#if ontune && sets}
    <label class="radio">
      <input
        type="checkbox"
        role="switch"
        aria-label="Radio"
        checked={radio}
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
          {#if sets}
            <input
              type="range"
              min="0"
              max="100"
              aria-label={a.label}
              value={percent(value)}
              oninput={(e) =>
                onintent({ kind: 'axis', axis: a.axis, value: +e.currentTarget.value / 100 })}
            />
          {/if}
        </div>
        {#if sets}
          <Nudge
            label="Nudge {a.label.toLowerCase()}"
            down={{
              name: `${a.label} down`,
              glyph: '−',
              title: `${a.label} down a tenth`,
              disabled: value <= 0,
            }}
            up={{
              name: `${a.label} up`,
              glyph: '+',
              title: `${a.label} up a tenth`,
              disabled: value >= 1,
            }}
            onnudge={(by) => onintent({ kind: 'axis', axis: a.axis, value: stepped(value, by) })}
          >
            {a.ends[0]} – {a.ends[1]}
          </Nudge>
        {:else if onnudge && nudges(a.axis)}
          {@const axis = a.axis}
          <Nudge
            label="Nudge {a.label.toLowerCase()}"
            down={{
              name: `${a.label} down`,
              glyph: '−',
              title: `Lean the band toward ${a.ends[0]}`,
              disabled: value <= 0,
            }}
            up={{
              name: `${a.label} up`,
              glyph: '+',
              title: `Lean the band toward ${a.ends[1]}`,
              disabled: value >= 1,
            }}
            onnudge={(by) => nudge(axis, a.label.toLowerCase(), by)}
          >
            {a.ends[0]} – {a.ends[1]}
          </Nudge>
        {:else}
          <p class="ends">{a.ends[0]} – {a.ends[1]}</p>
        {/if}
      </div>
    {/each}
  </div>
  {#if nudgedLast}
    <p class="nudged" role="status">
      You nudged {nudgedLast.label}
      {nudgedLast.by > 0 ? 'up' : 'down'}: the band leans that way from the next section, more the
      fewer play.
    </p>
  {/if}
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
  .nudged {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
  .ends {
    margin: 0;
    font-size: 12.5px;
    color: var(--muted);
    text-align: center;
  }
  .drag:has(input:focus-visible) {
    outline: 2px solid var(--amber);
    outline-offset: 2px;
    border-radius: 6px;
  }
</style>
