<!--
  The session, a card: who the band plays with. The summary is the session
  by name (or "Solo"); the transport that starts and stops the band is the
  screen's header (`Transport`). The line under the name says the state ("Hosting · 2 joined", "Following · host
  playing"), and the glyph is the players as a network in their colours,
  pinging with each bar. The details are the players of a host, or the link
  of a client (its name, round trip, bars that came too late), and the way
  out: Close session for a host, Leave session for a client, Back to the
  lobby from solo. Ending a session that others are in asks first, in place,
  so a stray tap can't end a jam for everyone: a host is told how many are
  playing in its session. Solo shares nothing, so it goes back at once.
-->
<script lang="ts">
  import type { Mode } from '../player.svelte.ts';
  import {
    type Following,
    type Hosting,
    type Phase,
    networkColours,
    sessionMain,
    sessionSub,
  } from '../sessionState.ts';
  import Card from './Card.svelte';
  import Group from './Group.svelte';
  import Network from './glyphs/Network.svelte';
  import Reading from './Reading.svelte';

  interface Props {
    mode: Mode;
    hosting: Hosting;
    following: Following;
    /** A session's players' names, by id, in the order they joined. */
    players: Readonly<Record<string, string>>;
    /** This device's own player id, or null outside a session. */
    playerId: string | null;
    /** Whether the song is being counted in, or ending on its last bar. */
    phase?: Phase | null;
    /** The bar heard, or null before any: the glyph pings on each. */
    bar: number | null;
    /** End the session, or leave the band for the lobby, whichever this is. */
    onend: () => void;
  }

  let { mode, hosting, following, players, playerId, phase = null, bar, onend }: Props = $props();

  let asking = $state(false);

  const colours = $derived(networkColours(mode, hosting, players, playerId));

  const others = (n: number) => (n === 1 ? '1 other is' : `${n} others are`);

  const closing = $derived(
    hosting.guests.length === 0
      ? `Close ${hosting.session}? Nobody else is in it.`
      : `Close ${hosting.session} for everyone? ${others(hosting.guests.length)} playing in it.`,
  );

  const end = () => {
    asking = false;
    onend();
  };
</script>

{#snippet network()}
  <Network {colours} {bar} />
{/snippet}

<Card
  title="Session"
  main={sessionMain(mode, hosting, following)}
  sub={sessionSub(mode, hosting, following, phase)}
  glyph={network}
  live
>
  {#if mode === 'host'}
    <Group title="Players">
      <ul aria-label="Players">
        <li><i style:background="var(--source-0)"></i>You (host)</li>
        {#each hosting.guests as guest, i (guest.id)}
          <li><i style:background="var(--source-{colours[i + 1] ?? 0})"></i>{guest.name}</li>
        {/each}
      </ul>
    </Group>
  {:else if mode === 'client'}
    <Group title="Link">
      <Reading label="Playing as" value={following.name ?? '…'} />
      {#if following.trip !== null}<Reading label="Round trip" value="{following.trip} ms" />{/if}
      {#if following.lacked > 0}
        <Reading
          label="Came too late to play"
          value="{following.lacked} {following.lacked === 1 ? 'bar' : 'bars'}"
        />
      {/if}
      {#if following.status === 'reconnecting'}
        <p class="note">The link was lost. This band plays on what it has, and joins again.</p>
      {:else if following.hostAway}
        <p class="note">The host lost its link and may be back in a moment.</p>
      {/if}
    </Group>
  {/if}

  {#if asking}
    <div
      class="ask"
      role="alertdialog"
      aria-label={mode === 'host' ? 'Close the session?' : 'Leave the session?'}
    >
      {#if mode === 'host'}
        <p>{closing}</p>
      {:else}
        <p>Leave {following.session}?</p>
      {/if}
      <div class="actions">
        <button type="button" class="danger" onclick={end}>
          {mode === 'host' ? 'Yes, close it' : 'Yes, leave'}
        </button>
        <button type="button" onclick={() => (asking = false)}>
          {mode === 'host' ? 'Keep playing' : 'Stay'}
        </button>
      </div>
    </div>
  {:else if mode === 'solo'}
    <button type="button" class="out" onclick={end}>Back to the lobby</button>
  {:else}
    <button type="button" class="out" onclick={() => (asking = true)}>
      {mode === 'host' ? 'Close session' : 'Leave session'}
    </button>
  {/if}
</Card>

<style>
  ul {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 14px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  li i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .note {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
  .ask {
    display: grid;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--amber);
    border-radius: 8px;
  }
  .ask p {
    margin: 0;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ask button,
  .out {
    justify-self: start;
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: var(--surface);
    font-weight: 500;
  }
  .ask .danger {
    border-color: var(--amber);
    background: var(--amber);
    color: var(--on-amber);
  }
</style>
