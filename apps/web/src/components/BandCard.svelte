<!--
  The band, a card: every voice on one roll (`BandRoll`, `bandRoll.ts`), the
  bars numbered over it and the playhead on the step heard. The fill of a
  note is its pitch, its shape its role and its outline who plays it. Folded,
  how many of the four performers sound on this device over the lead's
  status, and as its glyph a small roll of the phrase. Unfolded, a chip for
  each performer, its shape in its voice's colour, its name and its level
  (`Speaker`), the mixer: pressed, it shows that performer's faders, mute,
  volume and solo, on this device (`Mix`), never sent to a session. A player
  in the session has a chip in their colour and the shape of the part they
  play, with no faders. There is nothing to select here: choosing a track to
  play is the play card's. The lead's bars that played a motif are outlined
  in its player's colour and, under the roll, say whose: "from", never "plays
  exactly", since the lead realises the cell its own way.
-->
<script lang="ts">
  import type { Credit } from '../attribution.ts';
  import { SHAPES, type Shape } from '../bandRoll.ts';
  import type { Mix } from '../mix.ts';
  import { PATTERN_BARS } from '../pattern.ts';
  import type { Performer } from '../sounding.ts';
  import type { PerformerView, TracksView } from '../tracks.ts';
  import BandRoll from './BandRoll.svelte';
  import Card from './Card.svelte';
  import Roll from './glyphs/Roll.svelte';
  import Speaker from './Speaker.svelte';
  import TrackPill from './TrackPill.svelte';

  interface Props {
    tracks: TracksView;
    /** Turn a band performer's mute or solo over, on this device. */
    ontoggle: (which: keyof Pick<Mix, 'muted' | 'soloed'>, performer: Performer) => void;
    /** Set a band performer's volume on this device, 0 to 1. */
    onlevel: (performer: Performer, level: number) => void;
  }

  let { tracks, ontoggle, onlevel }: Props = $props();

  const frame = $derived(tracks.frame);
  /** The performer whose faders are shown, or none. */
  let open = $state<Performer | null>(null);
  const opened = $derived(tracks.performers.find((p) => p.performer === open) ?? null);
  const bars = $derived(Array.from({ length: PATTERN_BARS }, (_, i) => tracks.first + i + 1));
  const shown = $derived(`bars ${bars[0]} to ${bars.at(-1)}`);
  const sounding = $derived(tracks.performers.filter((p) => p.sounds).length);
  const lead = $derived(tracks.performers.find((p) => p.performer === 'lead'));
  const players = $derived(tracks.players.filter((lane) => !lane.heardAs));

  /** Each motif the performers are credited with, once. */
  const credits = (performers: readonly PerformerView[]): Credit[] => [
    ...new Map(
      performers.flatMap((p) =>
        p.motifs.map((m) => [`${m.credit.source} ${m.credit.bar}`, m.credit] as const),
      ),
    ).values(),
  ];
</script>

{#snippet shape(kind: Shape, colour: string)}
  <svg class="shape" viewBox="0 0 22 14" aria-hidden="true" style:stroke={colour}>
    {#if kind === 'chevron'}<path d="M2 2H14L20 7L14 12H2L5 7Z" />
    {:else if kind === 'pill'}<rect x="2" y="3" width="18" height="8" rx="4" />
    {:else if kind === 'square'}<rect x="3" y="3" width="7" height="7" /><rect
        x="12"
        y="3"
        width="7"
        height="7"
      />
    {:else}<rect x="2" y="3" width="18" height="8" class="block" />{/if}
  </svg>
{/snippet}

{#snippet glyph()}
  <Roll
    rows={tracks.performers.map((p) => ({ notes: p.notes, sounds: p.sounds }))}
    span={tracks.span}
    playhead={tracks.playhead}
  />
{/snippet}

{#snippet nothing()}{/snippet}

<Card
  title="Band"
  main="{sounding} of {tracks.performers.length} sound"
  sub={lead?.status ?? ''}
  {glyph}
  open
>
  <div class="grid" role="group" aria-label="Band grid">
    <div class="mixer" role="group" aria-label="Voices">
      {#each tracks.performers as p (p.performer)}
        <button
          type="button"
          class="chip"
          class:quiet={!p.sounds}
          aria-label="Show {p.label} faders"
          aria-expanded={open === p.performer}
          onclick={() => (open = open === p.performer ? null : p.performer)}
        >
          {@render shape(SHAPES[p.performer], `var(--voice-${p.performer})`)}
          <span class="name">{p.label}</span>
          <Speaker level={p.sounds ? p.level : 0} muted={p.muted} soloed={p.soloed} />
        </button>
      {/each}
      {#each players as lane (`${lane.part} ${lane.source}`)}
        <span class="chip player" style:color="var(--source-{lane.colour})">
          {@render shape(SHAPES[lane.part], `var(--source-${lane.colour})`)}
          <span class="name">{lane.name}</span>
        </span>
      {/each}
    </div>
    {#if opened}
      <TrackPill
        label={opened.label}
        fader
        level={opened.sounds ? opened.level : 0}
        muted={opened.muted}
        soloed={opened.soloed}
        onview={() => (open = null)}
        onlevel={(level) => onlevel(opened.performer, level)}
        onmute={() => ontoggle('muted', opened.performer)}
        onsolo={() => ontoggle('soloed', opened.performer)}
        children={nothing}
      />
    {/if}
    <ol
      class="bars"
      aria-hidden="true"
      style:grid-template-columns={frame.map((bar) => `${bar.steps}fr`).join(' ')}
    >
      {#each bars as bar (bar)}<li>{bar}</li>{/each}
    </ol>
    <div class="room">
      <BandRoll {tracks} label="The band, {shown}" />
    </div>
    {#each credits(tracks.performers) as c (`${c.source} ${c.bar}`)}
      <p class="credit" style:color="var(--source-{c.colour})">
        from {c.name}, bar {c.bar + 1}
      </p>
    {/each}
  </div>
</Card>

<style>
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    --pill-label: 4.6em;
    --pill-end: 46px;
  }
  .mixer {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 6px 0 8px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--surface);
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
  }
  .chip[aria-expanded='true'] {
    border-color: var(--amber);
    background: color-mix(in srgb, var(--amber) 12%, var(--surface));
  }
  .chip.quiet {
    color: var(--muted);
  }
  .chip.player {
    padding-right: 12px;
  }
  .chip :global(svg:not(.shape)) {
    width: 22px;
    height: 22px;
  }
  .shape {
    width: 22px;
    height: 14px;
    flex: none;
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .shape .block {
    stroke-width: 2.6;
  }
  .bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    font-size: 12px;
    color: var(--muted);
  }
  .bars li {
    padding-left: 3px;
    border-left: 1px solid var(--line);
  }
  /* The roll takes the height the view has left, two hundred pixels at least. */
  .room {
    height: clamp(220px, calc(100dvh - 330px), 900px);
  }
  /* A phone on its side has the rail and the transport beside each other: the roll takes what is left. */
  @media (max-height: 500px) and (orientation: landscape) {
    .room {
      height: max(160px, calc(100dvh - 210px));
    }
  }
  .credit {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
</style>
