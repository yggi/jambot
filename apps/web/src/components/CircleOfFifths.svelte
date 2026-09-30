<!--
  The circle of fifths: the twelve pitch classes around a wheel, the current
  scale's notes lit and joined along the rim as an open arc, the tonic ringed.
  Only where a scale isn't contiguous in fifths does a dashed chord cross the
  wheel. With `onintent` and `mode`, a dot is also a button that wishes for
  its pitch class as the new tonic, in the mode already playing. `history`, a
  filled radar underneath, shows every pitch class's weight: the harmonic
  history of what the band has actually played. `compact` draws it small, as
  a glyph: the figure, the tonic and the history's radar, cropped to the
  wheel, with no names and no buttons.
-->
<script lang="ts">
  import type { ComposerMode } from '@jambot/engine';
  import { fifthsIndex, mod } from '@jambot/theory';
  import type { Intent } from '../conductor.ts';
  import { figureArc, wheelDistance, wheelOrder, wheelPoint } from '../circleLayout.ts';
  import { TONIC_NAMES } from '../noteNames.ts';

  interface Props {
    /** The current key's tonic, as a pitch class 0–11, C = 0. */
    tonic: number;
    /** The current key's notes, as pitch classes 0–11, C = 0. */
    scale: readonly number[];
    /** The current key's mode, kept when a dot wishes for a new tonic. Omit for a read-only wheel. */
    mode?: ComposerMode;
    onintent?: ((intent: Intent) => void) | undefined;
    /** One weight per pitch class, 0–11, for the harmonic-history radar. Omit or undefined to leave it off. */
    history?: readonly number[] | undefined;
    /** The pitch classes a nudge can't reach as tonic: dimmed, and not buttons. */
    beyond?: readonly number[];
    /** Draw it small, as a glyph: no note names, no history, no buttons. */
    compact?: boolean;
  }

  let { tonic, scale, mode, onintent, history, beyond = [], compact = false }: Props = $props();

  const VIEW = 200;
  const CENTER = 100;
  const R_DOT = 62;
  const R_LABEL = 82;
  const R_BUTTON = 72;

  const interactive = $derived(!compact && onintent !== undefined && mode !== undefined);
  /** A compact wheel is cropped to the rim and its dots, which are drawn larger. */
  const box = $derived(compact ? `${CENTER - 80} ${CENTER - 80} 160 160` : `0 0 ${VIEW} ${VIEW}`);

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
        isBeyond: beyond.includes(pitchClass),
      };
    }),
  );

  const tonicDot = $derived(dots.find((d) => d.isTonic));

  /** The scale's arc along the rim, and the chords over its holes. */
  const figure = $derived.by(() => {
    const points = figureArc(scale).map((pitchClass) =>
      dots.find((d) => d.pitchClass === pitchClass)!,
    );
    let rim = '';
    let chords = '';
    points.forEach((p, i) => {
      const last = points[i - 1];
      if (!last) return;
      const move = `M${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
      const to = `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      if (wheelDistance(last.pitchClass, p.pitchClass) === 1) {
        // The clockwise short way along the rim, or counter-clockwise when the pair runs against the wheel.
        const clockwise = mod(fifthsIndex(p.pitchClass) - fifthsIndex(last.pitchClass), 12) === 1;
        rim += `${move} A${R_DOT} ${R_DOT} 0 0 ${clockwise ? 1 : 0} ${to} `;
      } else chords += `${move} L${to} `;
    });
    return { rim, chords };
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
  <svg viewBox={box} class:compact aria-hidden="true">
    {#if historyPath}
      <path class="history" d={historyPath} />
    {/if}
    <circle class="rim" cx={CENTER} cy={CENTER} r={R_DOT} />
    {#if figure.chords}
      <path class="chords" d={figure.chords} />
    {/if}
    {#if figure.rim}
      <path class="figure" d={figure.rim} />
    {/if}
    {#if tonicDot}
      <circle class="tonic-ring" cx={tonicDot.x} cy={tonicDot.y} r={compact ? 13 : 10} />
    {/if}
    {#each dots as dot (dot.pitchClass)}
      <circle class="dot" class:in-scale={dot.inScale} cx={dot.x} cy={dot.y} r={compact ? 8 : 5} />
      {#if !compact}
        <text
          class="label"
          class:in-scale={dot.inScale}
          class:beyond={dot.isBeyond}
          x={dot.labelX}
          y={dot.labelY}
        >
          {dot.name}
        </text>
      {/if}
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
        disabled={dot.isBeyond}
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
  svg.compact .rim {
    stroke-width: 2;
  }
  svg.compact .figure {
    stroke-width: 5;
  }
  svg.compact .tonic-ring {
    stroke-width: 3;
  }
  svg.compact .history {
    stroke-width: 3;
    fill-opacity: 0.35;
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
  .rim {
    fill: none;
    stroke: var(--line);
    stroke-width: 1;
  }
  .figure {
    fill: none;
    stroke: var(--teal);
    stroke-width: 2;
    stroke-linecap: round;
  }
  .chords {
    fill: none;
    stroke: var(--teal);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.7;
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
  .label.beyond {
    opacity: 0.35;
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
  .pick:disabled {
    cursor: default;
  }
  .pick:not(:disabled):hover,
  .pick:focus-visible {
    background: var(--teal-bg);
  }
</style>
