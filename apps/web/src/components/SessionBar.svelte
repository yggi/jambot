<!--
  The way out of a session, in the band's screen: who the band is playing
  with, and a button back to the lobby. Ending a session that others are in
  asks first, in place, so a stray tap can't end a jam for everyone: a host
  is told how many are playing in its session. Solo shares nothing, so it
  goes back at once.
-->
<script lang="ts">
  import type { Mode } from '../player.svelte.ts';
  import type { ClientStatus } from '../session/client.svelte.ts';
  import type { Guest } from '../session/host.svelte.ts';

  interface Props {
    mode: Mode;
    hosting: { session: string | null; guests: readonly Guest[] };
    following: {
      status: ClientStatus;
      session: string | null;
      name: string | null;
      hostPlaying: boolean;
      hostAway: boolean;
      trip: number | null;
      lacked: number;
    };
    /** End the session, or leave the band for the lobby, whichever this is. */
    onend: () => void;
  }

  let { mode, hosting, following, onend }: Props = $props();

  let asking = $state(false);

  const players = (guests: readonly Guest[]) =>
    guests.length === 0
      ? 'Nobody has joined yet.'
      : `${guests.length} joined: ${guests.map((g) => g.name).join(', ')}.`;

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

<section class="bar" aria-label="Session">
  {#if mode === 'host'}
    <p>Hosting <strong>{hosting.session}</strong>. {players(hosting.guests)}</p>
    <p class="message">
      Everyone who joins plays this band's song on their own synth and MIDI, and the Muse hears them
      all.
    </p>
    {#if asking}
      <div class="ask" role="alertdialog" aria-label="Close the session?">
        <p>{closing}</p>
        <div class="actions">
          <button type="button" class="danger" onclick={end}>Yes, close it</button>
          <button type="button" onclick={() => (asking = false)}>Keep playing</button>
        </div>
      </div>
    {:else}
      <button type="button" onclick={() => (asking = true)}>Close session</button>
    {/if}
  {:else if mode === 'client'}
    <p>
      {following.status === 'joined'
        ? 'Playing in'
        : following.status === 'reconnecting'
          ? 'Reconnecting to'
          : 'Joining'}
      <strong>{following.session}</strong> as <strong>{following.name}</strong>.
    </p>
    {#if following.status === 'reconnecting'}
      <p class="message">The link was lost. This band plays on what it has, and joins again.</p>
    {:else if following.status === 'joined'}
      <p class="message">
        {#if following.hostAway}The host lost its link and may be back in a moment.{/if}
        {following.hostPlaying ? 'The host is playing.' : 'The host is stopped.'}
        {#if following.trip !== null}Round trip {following.trip} ms.{/if}
        {#if following.lacked > 0}{following.lacked} bars came too late to play.{/if}
        The host leads the style and the key.
      </p>
    {/if}
    {#if asking}
      <div class="ask" role="alertdialog" aria-label="Leave the session?">
        <p>Leave {following.session}?</p>
        <div class="actions">
          <button type="button" class="danger" onclick={end}>Yes, leave</button>
          <button type="button" onclick={() => (asking = false)}>Stay</button>
        </div>
      </div>
    {:else}
      <button type="button" onclick={() => (asking = true)}>Leave session</button>
    {/if}
  {:else}
    <p>Playing with the band on this device.</p>
    <button type="button" onclick={end}>Back to the lobby</button>
  {/if}
</section>

<style>
  .bar {
    display: grid;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 14px;
  }
  .ask {
    display: grid;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--amber);
    border-radius: 8px;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  button {
    justify-self: start;
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: var(--surface);
    font-weight: 500;
  }
  .danger {
    border-color: var(--amber);
    background: var(--amber);
    color: var(--on-amber);
  }
  .message {
    font-size: 13px;
    color: var(--muted);
  }
</style>
