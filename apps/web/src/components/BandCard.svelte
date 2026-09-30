<!--
  The band, a card: its performers, drums, bass, chords and lead, one phrase on
  one grid (`tracksOf`), the bars numbered over it and the playhead on the step
  heard. Folded, how many of the four sound on this device over the lead's
  status, and as its glyph a small roll of the phrase. Unfolded, a tall lane
  for each performer with, on its head, its volume and its mute and solo on
  this device (`Mix`), never sent to a session. There is nothing to select
  here: choosing a track to play and its instrument are the play card's, and
  so is the player's own lane. Another player's lane in a session, and the cell
  the Muse took from them, stand under the performer whose part they play. The
  lead's bars that played a motif are tinted in its player's colour and, under
  its lane, say whose: "from", never "plays exactly", since the lead realises
  the cell its own way.
-->
<script lang="ts">
  import { BAR_STEPS } from '@jambot/engine';
  import type { Credit } from '../attribution.ts';
  import type { Mix } from '../mix.ts';
  import { PATTERN_BARS } from '../pattern.ts';
  import type { Performer } from '../sounding.ts';
  import type { PerformerView, TracksView } from '../tracks.ts';
  import Card from './Card.svelte';
  import Lane from './Lane.svelte';
  import Roll from './glyphs/Roll.svelte';

  interface Props {
    tracks: TracksView;
    /** Turn a band performer's mute or solo over, on this device. */
    ontoggle: (which: keyof Pick<Mix, 'muted' | 'soloed'>, performer: Performer) => void;
    /** Set a band performer's volume on this device, 0 to 1. */
    onlevel: (performer: Performer, level: number) => void;
  }

  let { tracks, ontoggle, onlevel }: Props = $props();

  const span = PATTERN_BARS * BAR_STEPS;
  const bars = $derived(Array.from({ length: PATTERN_BARS }, (_, i) => tracks.first + i + 1));
  const shown = $derived(`bars ${bars[0]} to ${bars.at(-1)}`);
  const sounding = $derived(tracks.performers.filter((p) => p.sounds).length);
  const lead = $derived(tracks.performers.find((p) => p.performer === 'lead'));

  /** Each motif a performer's lane is credited with, once. */
  const credits = (p: PerformerView): Credit[] => [
    ...new Map(p.motifs.map((m) => [`${m.credit.source} ${m.credit.bar}`, m.credit])).values(),
  ];
</script>

{#snippet roll()}
  <Roll
    rows={tracks.performers.map((p) => ({ notes: p.notes, sounds: p.sounds }))}
    {span}
    playhead={tracks.playhead}
  />
{/snippet}

<Card
  title="Band"
  main="{sounding} of {tracks.performers.length} sound"
  sub={lead?.status ?? ''}
  glyph={roll}
  open
>
  <div class="grid" role="group" aria-label="Band grid">
    <ol class="bars" aria-hidden="true">
      {#each bars as bar (bar)}<li>{bar}</li>{/each}
    </ol>
    {#each tracks.performers as p (p.performer)}
      <div class="track">
        <div class="head">
          <span class="name">{p.label}</span>
          <input
            class="level"
            type="range"
            min="0"
            max="100"
            aria-label="{p.label} volume"
            value={Math.round(p.level * 100)}
            oninput={(e) => onlevel(p.performer, +e.currentTarget.value / 100)}
          />
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
          tall
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
      {#each tracks.players.filter((lane) => lane.part === p.performer && !lane.local) as lane (lane.source)}
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
</Card>

<style>
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
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
    gap: 4px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
  }
  .name {
    flex: none;
    width: 4.6em;
    font-size: 14px;
    font-weight: 600;
  }
  .level {
    flex: 1;
    min-width: 0;
    margin: 0;
    accent-color: var(--amber);
  }
  .player .name {
    width: auto;
    flex: 1;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .credit {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
  .mix {
    flex: none;
    width: 32px;
    height: 30px;
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
</style>
