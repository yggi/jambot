<!--
  The circle of fifths: the twelve pitch classes around a wheel, the current
  scale's notes lit and threaded as a figure from the tonic, the tonic ringed.
  With `onintent` and `mode`, a dot is also a button that wishes for its
  pitch class as the new tonic, in the mode already playing. With `history`,
  a filled radar underneath the wheel shows every pitch class's weight, for
  the harmonic history of what the band has actually played.
-->
<script lang="ts">
  import type { ComposerMode } from '@jambot/engine';
  import { fifthsIndex } from '@jambot/theory';
  import type { Intent } from '../conductor.ts';
  import { figureOrder, wheelOrder, wheelPoint } from '../circleLayout.ts';
  import { TONIC_NAMES } from '../noteNames.ts';

  interface Props {
    /** The current key's tonic, as a pitch class 0–11, C = 0. */
    tonic: number;
    /** The current key's notes, as pitch classes 0–11, C = 0. */
    scale: readonly number[];
    /** The current key's mode, kept when a dot wishes for a new tonic. Omit for a read-only wheel. */
    mode?: ComposerMode;
    onintent?: (intent: Intent) => void;
    /** One weight per pitch class, 0–11, for the harmonic-history radar. Omit or undefined to leave it off. */
    history?: readonly number[] | undefined;
  }

  let { tonic, scale, mode, onintent, history }: Props = $props();

  const VIEW = 200;
  const CENTER = 100;
  const R_DOT = 62;
  const R_LABEL = 82;
  const R_BUTTON = 72;

  const interactive = $derived(onintent !== undefined && mode !== undefined);

  const dots = $derived(
    TONIC_NAMES.map((name, pitchClass) => {
      const at = wheelPoint(fifthsIndex(pitchClass), R_DOT);
      const label = wheelPoint(fifthsIndex(pitchClass), R_LABEL);
      const button = wheelPoint(fifthsIndex(pitchClass), R_BUTTON);
      return {
        pitchClass,
        name,
        x: CENTER + at.x,
        y: CENTER + at.y,
        labelX: CENTER + label.x,
        labelY: CENTER + label.y,
        buttonLeft: ((CENTER + button.x) / VIEW) * 100,
        buttonTop: ((CENTER + button.y) / VIEW) * 100,
        inScale: scale.includes(pitchClass),
        isTonic: pitchClass === tonic,
      };
    }),
  );

  const tonicDot = $derived(dots.find((d) => d.isTonic));

  const figurePath = $derived.by(() => {
    const points = figureOrder(scale, tonic).map((pitchClass) =>
      dots.find((d) => d.pitchClass === pitchClass)!,
    );
    if (points.length === 0) return '';
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    return points.length > 2 ? `${d} Z` : d;
  });

  const pick = (pitchClass: number) => {
    if (onintent && mode) onintent({ kind: 'key', wish: { tonic: pitchClass, mode } });
  };

  const historyPath = $derived.by(() => {
    if (!history) return '';
    const max = Math.max(...history);
    if (max <= 0) return '';
    const points = wheelOrder().map((pitchClass) => {
      const weight = history[pitchClass] ?? 0;
      const at = wheelPoint(fifthsIndex(pitchClass), R_DOT * (weight / max));
      return { x: CENTER + at.x, y: CENTER + at.y };
    });
    return `${points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} Z`;
  });
</script>

<div class="wheel" role="group" aria-label="Circle of fifths">
  <svg viewBox="0 0 {VIEW} {VIEW}" aria-hidden="true">
    {#if historyPath}
      <path class="history" d={historyPath} />
    {/if}
    {#if figurePath}
      <path class="figure" d={figurePath} />
    {/if}
    {#if tonicDot}
      <circle class="tonic-ring" cx={tonicDot.x} cy={tonicDot.y} r="10" />
    {/if}
    {#each dots as dot (dot.pitchClass)}
      <circle class="dot" class:in-scale={dot.inScale} cx={dot.x} cy={dot.y} r="5" />
      <text class="label" class:in-scale={dot.inScale} x={dot.labelX} y={dot.labelY}>
        {dot.name}
      </text>
    {/each}
  </svg>
  {#if interactive}
    {#each dots as dot (dot.pitchClass)}
      <button
        type="button"
        class="pick"
        style="left: {dot.buttonLeft}%; top: {dot.buttonTop}%"
        aria-label={dot.name}
        aria-pressed={dot.isTonic}
        onclick={() => pick(dot.pitchClass)}
      ></button>
    {/each}
  {/if}
</div>

<style>
  .wheel {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .history {
    fill: var(--amber);
    fill-opacity: 0.25;
    stroke: var(--amber);
    stroke-opacity: 0.7;
    stroke-width: 1;
    stroke-linejoin: round;
  }
  .dot {
    fill: var(--line);
  }
  .dot.in-scale {
    fill: var(--amber);
  }
  .tonic-ring {
    fill: none;
    stroke: var(--teal);
    stroke-width: 2;
  }
  .figure {
    fill: none;
    stroke: var(--teal);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
  .label {
    font-size: 11px;
    fill: var(--muted);
    text-anchor: middle;
    dominant-baseline: middle;
  }
  .label.in-scale {
    fill: var(--ink);
  }
  .pick {
    position: absolute;
    width: 26px;
    height: 26px;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    transform: translate(-50%, -50%);
    cursor: pointer;
  }
  .pick:hover,
  .pick:focus-visible {
    background: var(--teal-bg);
  }
</style>
