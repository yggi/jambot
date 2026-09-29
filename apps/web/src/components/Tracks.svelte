<!--
  The tracks, a card: one phrase on one grid, a lane per band performer and,
  under the performer whose part it plays, a lane per player's source
  (`tracksOf`), the bars numbered over it and the playhead on the step
  heard. Folded, the track selected and what it plays. Unfolded, the grid
  and, under it, the selected track: how much it sounds here and the
  instrument to play it on, which the page gives (`instrument`), so the
  card reads nothing but what it is given.

  A band performer's lane can be muted or soloed on this device (`Mix`),
  and selected, one at a time, the lead first; the selection is this
  card's own and goes nowhere else. The lead's bars that played a motif are
  tinted in its player's colour and, under its lane, above the player's,
  say whose: "from", never "plays exactly", since the lead realises the cell
  its own way. The card starts unfolded:
  it is where a person plays.
-->
<script lang="ts">
  import { BAR_STEPS } from '@jambot/engine';
  import type { Snippet } from 'svelte';
  import type { Credit } from '../attribution.ts';
  import type { Mix } from '../mix.ts';
  import { PATTERN_BARS } from '../pattern.ts';
  import type { Performer } from '../sounding.ts';
  import type { PerformerView, TracksView } from '../tracks.ts';
  import Fold from './Fold.svelte';
  import Lane from './Lane.svelte';

  interface Props {
    tracks: TracksView;
    /** Turn a band performer's mute or solo over, on this device. */
    ontoggle: (which: keyof Mix, performer: Performer) => void;
    /** The instrument the selected performer's part is played on, if a person can play it. */
    instrument: Snippet<[Performer]>;
  }

  let { tracks, ontoggle, instrument }: Props = $props();

  let selected = $state<Performer>('lead');

  const span = PATTERN_BARS * BAR_STEPS;
  const chosen = $derived(
    tracks.performers.find((p) => p.performer === selected) ?? tracks.performers.at(-1)!,
  );
  const bars = $derived(Array.from({ length: PATTERN_BARS }, (_, i) => tracks.first + i + 1));
  const shown = $derived(`bars ${bars[0]} to ${bars.at(-1)}`);
  const now = $derived(
    !chosen.sounds
      ? 'Muted here'
      : chosen.sounding.length === 0
        ? 'Silent'
        : `${chosen.sounding.length} note${chosen.sounding.length === 1 ? '' : 's'}`,
  );

  /** Each motif a performer's lane is credited with, once. */
  const credits = (p: PerformerView): Credit[] => [
    ...new Map(p.motifs.map((m) => [`${m.credit.source} ${m.credit.bar}`, m.credit])).values(),
  ];
</script>

<Fold heading="Tracks" name={chosen.label} sub={chosen.status} open>
  <div class="grid" role="group" aria-label="Tracks grid">
    <ol class="bars" aria-hidden="true">
      {#each bars as bar (bar)}<li>{bar}</li>{/each}
    </ol>
    {#each tracks.performers as p (p.performer)}
      <div class="track">
        <div class="head">
          <button
            type="button"
            class="name"
            aria-pressed={p.performer === selected}
            onclick={() => (selected = p.performer)}>{p.label}</button
          >
          <button
            type="button"
            class="mix"
            aria-label="Mute {p.label}"
            aria-pressed={p.muted}
            onclick={() => ontoggle('muted', p.performer)}>M</button
          >
          <button
            type="button"
            class="mix"
            aria-label="Solo {p.label}"
            aria-pressed={p.soloed}
            onclick={() => ontoggle('soloed', p.performer)}>S</button
          >
        </div>
        <Lane
          label="{p.label}, {shown}"
          notes={p.notes}
          {span}
          credited={p.motifs.map((m) => ({ at: m.at, colour: m.credit.colour }))}
          playhead={tracks.playhead}
          sounds={p.sounds}
        />
        {#each credits(p) as c (`${c.source} ${c.bar}`)}
          <p class="credit" style:color="var(--source-{c.colour})">
            from {c.name}, bar {c.bar + 1}
          </p>
        {/each}
      </div>
      {#each tracks.players.filter((lane) => lane.part === p.performer) as lane (lane.source)}
        <div class="track player">
          <div class="head">
            <span class="name" style:color="var(--source-{lane.colour})">{lane.name}</span>
          </div>
          <Lane
            label="{lane.name}, {shown}"
            notes={lane.notes}
            {span}
            colour={lane.colour}
            taken={lane.taken === null ? null : { at: lane.taken, colour: lane.colour }}
            playhead={tracks.playhead}
          />
        </div>
      {/each}
    {/each}
  </div>
  <div class="selected">
    <div class="reading"><span>{chosen.label} now</span><b>{now}</b></div>
    {#key selected}{@render instrument(selected)}{/key}
  </div>
</Fold>

<style>
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  .bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    font-size: 12px;
    color: var(--muted);
  }
  .bars li {
    padding-left: 3px;
    border-left: 1px solid var(--line);
  }
  .track {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 3px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
  }
  .name {
    flex: none;
    font-size: 14px;
    font-weight: 600;
  }
  button.name {
    min-height: 28px;
    padding: 0 10px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--surface);
  }
  button.name[aria-pressed='true'] {
    background: var(--ink);
    color: var(--surface);
    border-color: var(--ink);
  }
  .player .name {
    font-size: 13px;
    padding-left: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .credit {
    font-size: 13px;
    font-weight: 600;
  }
  .name + .mix {
    margin-left: auto;
  }
  .mix {
    flex: none;
    width: 30px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--line);
    background: var(--surface);
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
  }
  .mix[aria-pressed='true'] {
    background: var(--amber);
    border-color: var(--amber);
    color: var(--on-amber);
  }
  .selected {
    display: grid;
    gap: 10px;
  }
  .reading {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
</style>
