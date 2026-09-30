<!--
  The play card: where a person plays along. The track is chosen in its
  summary, lead or drums, and the glyph is that track's instrument, lit while
  a note is held. Unfolded, a row for each track in play, the lead first and
  the drums second: the track selected, and any other the player has played
  on in the phrase shown, so input over MIDI on both, the lead on any channel
  but 10 and the drums on 10, shows both, the room split between them. A row
  is the track over its instrument (which the page gives), and the track is
  one lane: the band's part dim under, the player's own notes bright in the
  player's colour, on one scale. The card starts unfolded, since it is where a
  person plays.
-->
<script lang="ts">
  import { BAR_STEPS } from '@jambot/engine';
  import type { Snippet } from 'svelte';
  import { PATTERN_BARS } from '../pattern.ts';
  import type { AlongPart } from '../player.svelte.ts';
  import type { PerformerView, TracksView } from '../tracks.ts';
  import Card from './Card.svelte';
  import Lane from './Lane.svelte';
  import Segmented from './Segmented.svelte';
  import Instrument from './glyphs/Instrument.svelte';

  interface Props {
    tracks: TracksView;
    /** The instrument a track is played on, if a person can play it. */
    instrument: Snippet<[AlongPart]>;
    /** Whether a note is held on each instrument now. */
    held: Readonly<Record<AlongPart, boolean>>;
  }

  let { tracks, instrument, held }: Props = $props();

  /** The tracks a person can play, in the order their rows stand. */
  const PARTS: readonly AlongPart[] = ['lead', 'drums'];
  const OPTIONS = [
    { value: 'lead', text: 'Lead' },
    { value: 'drums', text: 'Drums' },
  ] as const;

  let selected = $state<AlongPart>('lead');
  /** Whether the details show: choosing a track unfolds them, since it is their rows a person plays on. */
  let unfolded = $state(true);

  const span = PATTERN_BARS * BAR_STEPS;
  const shown = $derived(`bars ${tracks.first + 1} to ${tracks.first + PATTERN_BARS}`);
  const performerOf = (part: AlongPart): PerformerView | undefined =>
    tracks.performers.find((p) => p.performer === part);
  /** What this device's player played on a part in the phrase shown. */
  const playedOn = (part: AlongPart) =>
    tracks.players.filter((lane) => lane.part === part && lane.local);
  const rows = $derived(PARTS.filter((part) => part === selected || playedOn(part).length > 0));

  const chosen = $derived(performerOf(selected));
  const sub = $derived(
    !chosen
      ? ''
      : `${chosen.label}: ${
          !chosen.sounds
            ? 'muted here'
            : chosen.sounding.length === 0
              ? 'silent'
              : `${chosen.sounding.length} note${chosen.sounding.length === 1 ? '' : 's'}`
        }`,
  );
</script>

{#snippet track()}
  <Segmented
    label="Track"
    value={selected}
    options={OPTIONS}
    onselect={(part) => {
      selected = part;
      unfolded = true;
    }}
  />
{/snippet}

{#snippet picture()}
  <Instrument part={selected} lit={held[selected]} />
{/snippet}

<Card title="Play" main={track} {sub} glyph={picture} bind:open={unfolded}>
  <div class="rows">
    {#each rows as part (part)}
      {@const band = performerOf(part)}
      {@const own = playedOn(part)}
      <div class="row">
        <div class="head"><span class="name">{band?.label ?? part}</span></div>
        <Lane
          label="{band?.label ?? part} track, {shown}"
          under={band?.notes ?? []}
          notes={own.flatMap((lane) => lane.notes)}
          colour={own[0]?.colour ?? null}
          {span}
          tall
          playhead={tracks.playhead}
        />
        {@render instrument(part)}
      </div>
    {/each}
  </div>
</Card>

<style>
  .rows {
    display: grid;
    gap: 18px;
  }
  .row {
    display: grid;
    gap: 8px;
  }
  .head {
    display: flex;
    align-items: center;
    min-height: 24px;
  }
  .name {
    font-size: 14px;
    font-weight: 600;
  }
</style>
