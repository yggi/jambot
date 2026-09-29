<!--
  The session: play alone, host a session under a name, or join one with
  a name of your own, through a lobby server or, with none given, across
  the tabs of this browser. The sessions open can be found and picked. A
  host sees who joined; a client sees how far away its host is, and
  whether it is playing. What was typed is kept for next time.
-->
<script lang="ts">
  import type { Mode } from '../player.svelte.ts';
  import type { ClientStatus } from '../session/client.svelte.ts';
  import type { Guest } from '../session/host.svelte.ts';
  import type { OpenSession } from '@jambot/session';

  interface Props {
    mode: Mode;
    hosting: { session: string | null; guests: readonly Guest[]; ended: string | null };
    following: {
      status: ClientStatus;
      session: string | null;
      name: string | null;
      hostPlaying: boolean;
      hostAway: boolean;
      trip: number | null;
      ended: string | null;
      lacked: number;
    };
    /** The lobby server to offer when none was typed before. */
    lobby?: string;
    /** Open a session; the host's own notes go by the name, if one is given. */
    onhost: (session: string, name: string, lobby: string) => Promise<void>;
    onjoin: (session: string, name: string, lobby: string) => Promise<void>;
    onlist: (lobby: string) => Promise<readonly OpenSession[]>;
    onclose: () => void;
    onleave: () => void;
  }

  let {
    mode,
    hosting,
    following,
    lobby: offered = '',
    onhost,
    onjoin,
    onlist,
    onclose,
    onleave,
  }: Props = $props();

  const remembered = (key: string) => {
    try {
      return localStorage.getItem(`jambot:${key}`) ?? '';
    } catch {
      return '';
    }
  };
  const remember = (key: string, value: string) => {
    try {
      localStorage.setItem(`jambot:${key}`, value);
    } catch {
      // Nothing is lost but a name to retype.
    }
  };

  let session = $state(remembered('session'));
  let name = $state(remembered('name'));
  // svelte-ignore state_referenced_locally
  let lobby = $state(remembered('lobby') || offered);
  let error: string | null = $state(null);
  let open: readonly OpenSession[] | null = $state.raw(null);

  const why = (e: unknown) => (e instanceof Error ? e.message : String(e));

  async function host() {
    error = null;
    remember('session', session);
    remember('name', name);
    remember('lobby', lobby);
    try {
      await onhost(session, name, lobby);
    } catch (e) {
      error = why(e);
    }
  }

  async function join() {
    error = null;
    remember('session', session);
    remember('name', name);
    remember('lobby', lobby);
    await onjoin(session, name, lobby);
  }

  async function find() {
    error = null;
    open = null;
    try {
      open = await onlist(lobby);
    } catch (e) {
      error = why(e);
    }
  }

  const players = (guests: readonly Guest[]) =>
    guests.length === 0
      ? 'Nobody has joined yet.'
      : `${guests.length} joined: ${guests.map((g) => g.name).join(', ')}.`;
</script>

<section class="session" aria-label="Session">
  {#if mode === 'host'}
    <p>Hosting <strong>{hosting.session}</strong>. {players(hosting.guests)}</p>
    <p class="message">
      Everyone who joins plays this band's song on their own synth and MIDI, and the Muse hears them
      all.
    </p>
    <button type="button" onclick={onclose}>Close the session</button>
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
    <button type="button" onclick={onleave}>Leave the session</button>
  {:else}
    <div class="fields">
      <label>
        Lobby server
        <input
          type="text"
          bind:value={lobby}
          placeholder="none: this browser only"
          autocomplete="off"
          spellcheck="false"
        />
      </label>
      <label>
        Session name
        <input type="text" bind:value={session} autocomplete="off" />
      </label>
      <label>
        Your name
        <input type="text" bind:value={name} autocomplete="nickname" />
      </label>
    </div>
    <div class="actions">
      <button type="button" disabled={session.trim() === ''} onclick={host}>Host a session</button>
      <button type="button" disabled={session.trim() === '' || name.trim() === ''} onclick={join}>
        Join
      </button>
      <button type="button" onclick={find}>Find sessions</button>
    </div>
    {#if open}
      <div class="open" aria-label="Open sessions">
        {#if open.length === 0}
          <p class="message">No session is open.</p>
        {:else}
          {#each open as found (found.name)}
            <button type="button" class="found" onclick={() => (session = found.name)}
              >{found.name} ({found.players})</button
            >
          {/each}
        {/if}
      </div>
    {/if}
    <p class="message">
      {lobby.trim() === ''
        ? 'With no lobby server, sessions reach the other tabs and windows of this browser.'
        : 'Every player gives the same lobby server: ws:// on a local network, wss:// when hosted.'}
    </p>
  {/if}
  {#if error ?? following.ended ?? hosting.ended}
    <p class="message" role="status">{error ?? following.ended ?? hosting.ended}</p>
  {/if}
</section>

<style>
  .session {
    display: grid;
    gap: 10px;
  }
  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }
  label {
    display: grid;
    gap: 2px;
    min-width: 0;
    font-size: 14px;
  }
  input {
    width: 100%;
    min-width: 0;
    font: inherit;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--ink);
  }
  .open {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .found {
    min-height: 30px;
    padding: 0 12px;
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
  button:disabled {
    cursor: default;
    opacity: 0.5;
  }
  .message {
    font-size: 13px;
    color: var(--muted);
  }
</style>
