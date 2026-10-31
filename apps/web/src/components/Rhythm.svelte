<!--
  The Rhythm view (#327): the bar heard as a grid over the pads, a row for
  each sound of the kit and a column for each step of the bar, in its own
  meter. The band's hits are amber dots; a pattern of the person's own is
  teal squares, ringed amber where the band hits too; the step heard is
  lit. Watch shows it; Edit lets a tap on the grid put a hit in or take it
  out; Rec writes what the pads play into the pattern at the step heard.
  Mine plays the pattern on this device with the band, every bar, logged as
  the person's drums as a pad struck is.
-->
<script lang="ts">
  import { type Rhythm, KIT, barHits, hasHit } from '../rhythmGrid.ts';
  import type { TracksView } from '../tracks.ts';
  import DrumPads from './DrumPads.svelte';
  import Segmented from './Segmented.svelte';

  interface Props {
    tracks: TracksView;
    /** The person's own pattern, and whether it plays here. */
    rhythm: Rhythm;
    plays: boolean;
    /** Pads held now, from any source. */
    down: ReadonlySet<number>;
    /** The band's drum hits sounding now. */
    sounding: readonly number[];
    onnote: (note: number, velocity: number, on: boolean) => void;
    ontoggle: (note: number, step: number) => void;
    onrecord: (note: number) => void;
    onplays: (plays: boolean) => void;
    onclear: () => void;
  }

  let {
    tracks,
    rhythm,
    plays,
    down,
    sounding,
    onnote,
    ontoggle,
    onrecord,
    onplays,
    onclear,
  }: Props = $props();

  type Mode = 'watch' | 'edit' | 'rec';
  const MODES = [
    { value: 'watch', text: 'Watch' },
    { value: 'edit', text: 'Edit' },
    { value: 'rec', text: '● Rec' },
  ] as const;

  let mode = $state<Mode>('watch');

  /** The bar heard, or before anything is, the middle one shown. */
  const frame = $derived(
    tracks.frame.find(
      (f) =>
        tracks.playhead !== null &&
        tracks.playhead >= f.start &&
        tracks.playhead < f.start + f.steps,
    ) ?? tracks.frame[Math.floor(tracks.frame.length / 2)],
  );
  const steps = $derived(frame?.steps ?? 16);
  const heard = $derived(frame && tracks.playhead !== null ? tracks.playhead - frame.start : null);
  const pulses = $derived(new Set((frame?.pulses ?? []).map((p) => p - (frame?.start ?? 0))));
  const drums = $derived(tracks.performers.find((p) => p.performer === 'drums'));
  const band = $derived(frame ? barHits(drums?.notes ?? [], frame.start, frame.steps) : []);

  const pad = (note: number, velocity: number, on: boolean) => {
    onnote(note, velocity, on);
    if (on && mode === 'rec') onrecord(note);
  };
  const doing = $derived(
    mode === 'edit'
      ? 'Tap a step to set it'
      : mode === 'rec'
        ? 'Recording: the pads write into the bar'
        : `${steps} steps`,
  );
</script>

<div class="rhythm">
  <div class="top">
    <span class="doing">{doing}</span>
    <div class="modes">
      <Segmented label="The grid" value={mode} options={MODES} onselect={(m: Mode) => (mode = m)} />
    </div>
    <button
      type="button"
      class="chip"
      aria-pressed={plays}
      title="Play my pattern here, with the band"
      onclick={() => onplays(!plays)}>▶ Mine</button
    >
    <button type="button" class="chip" disabled={rhythm.length === 0} onclick={onclear}
      >Clear</button
    >
  </div>

  <div class="grid" role="group" aria-label="The bar, a row for each sound" style:--steps={steps}>
    {#each KIT as sound (sound.note)}
      <div class="row" role="group" aria-label={sound.label}>
        <span class="sound" aria-hidden="true">{sound.label}</span>
        {#each { length: steps }, step (step)}
          {@const mine = hasHit(rhythm, sound.note, step)}
          {@const theirs = hasHit(band, sound.note, step)}
          <button
            type="button"
            class="cell"
            class:mine
            class:theirs
            class:pulse={pulses.has(step)}
            class:heard={step === heard}
            aria-label="{sound.label}, step {step + 1}"
            aria-pressed={mine}
            disabled={mode !== 'edit'}
            onclick={() => ontoggle(sound.note, step)}><i></i></button
          >
        {/each}
      </div>
    {/each}
  </div>

  <div class="pads">
    <DrumPads {down} {sounding} onnote={pad} />
  </div>
</div>

<style>
  .rhythm {
    display: grid;
    grid-template-rows: auto minmax(160px, 1fr) auto;
    gap: 8px;
    height: 100%;
    min-height: 0;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
  }
  .doing {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .modes {
    flex: none;
  }
  .modes :global(button) {
    min-height: 34px;
    padding: 0 8px;
    font-size: 12px;
  }
  .chip {
    flex: none;
    height: 34px;
    padding: 0 9px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--teal);
    background: var(--teal-bg);
    color: var(--teal);
  }
  .chip:disabled {
    opacity: 0.4;
  }
  .grid {
    display: grid;
    grid-template-rows: repeat(7, minmax(0, 1fr));
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    overflow: hidden;
  }
  .row {
    display: grid;
    grid-template-columns: 62px repeat(var(--steps), minmax(0, 1fr));
    align-items: stretch;
  }
  .row + .row {
    border-top: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
  }
  .sound {
    align-self: center;
    padding-left: 8px;
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cell {
    display: grid;
    place-items: center;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
  }
  .cell:disabled {
    cursor: default;
    color: inherit;
  }
  .cell.pulse {
    background: color-mix(in srgb, var(--line) 30%, transparent);
  }
  .cell.heard {
    background: color-mix(in srgb, var(--amber) 22%, transparent);
  }
  .cell i {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
    opacity: 0.5;
  }
  .cell.theirs i {
    width: 60%;
    max-width: 14px;
    height: auto;
    aspect-ratio: 1;
    border-radius: 3px;
    background: var(--amber);
    opacity: 0.75;
  }
  .cell.mine i {
    width: 64%;
    max-width: 15px;
    height: auto;
    aspect-ratio: 1;
    border-radius: 3px;
    background: var(--source-0);
    opacity: 1;
  }
  .cell.mine.theirs i {
    box-shadow: 0 0 0 2px var(--amber);
  }
  .pads :global(.pads) {
    grid-template-columns: repeat(4, 1fr);
  }
  .pads :global(.pad) {
    min-height: 64px;
  }
  @media (max-height: 500px) and (orientation: landscape),
    (pointer: coarse) and (orientation: landscape) {
    .rhythm {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }
    .top {
      grid-column: span 2;
    }
    .pads :global(.pad) {
      min-height: 0;
      height: 100%;
    }
    .pads :global(.pads) {
      height: 100%;
    }
  }
</style>
