<!--
  The session: play alone, host a session under a name, or join one with
  a name of your own. A host sees who joined; a client sees how far away
  its host is, and whether it is playing. The names typed are kept for
  next time.
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
      trip: number | null;
      ended: string | null;
      lacked: number;
    };
    /** Open a session; the host's own notes go by the name, if one is given. */
    onhost: (session: string, name: string) => Promise<void>;
    onjoin: (session: string, name: string) => Promise<void>;
    onclose: () => void;
    onleave: () => void;
  }

  let { mode, hosting, following, onhost, onjoin, onclose, onleave }: Props = $props();

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
  let error: string | null = $state(null);

  async function host() {
    error = null;
    remember('session', session);
    remember('name', name);
    try {
      await onhost(session, name);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  async function join() {
    error = null;
    remember('session', session);
    remember('name', name);
    await onjoin(session, name);
  }

  const players = (guests: readonly Guest[]) =>
    guests.length === 0
      ? 'Nobody has joined yet.'
      : `${guests.length} joined: ${guests.map((g) => g.name).join(', ')}.`;
</script>

<section class="card" aria-label="Session">
  <h2>Session</h2>
  {#if mode === 'host'}
    <p>Hosting <strong>{hosting.session}</strong>. {players(hosting.guests)}</p>
    <p class="message">
      Everyone who joins plays this band's song on their own synth and MIDI, and the Muse hears them
      all.
    </p>
    <button type="button" onclick={onclose}>Close the session</button>
  {:else if mode === 'client'}
    <p>
      {following.status === 'joined' ? 'Playing in' : 'Joining'}
      <strong>{following.session}</strong> as <strong>{following.name}</strong>.
    </p>
    {#if following.status === 'joined'}
      <p class="message">
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
    </div>
    <p class="message">
      Sessions reach the other tabs and windows of this browser; across machines comes next.
    </p>
  {/if}
  {#if error ?? following.ended}
    <p class="message" role="status">{error ?? following.ended}</p>
  {/if}
</section>

<style>
  .card {
    display: grid;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 14px;
  }
  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }
  label {
    display: grid;
    gap: 2px;
    font-size: 14px;
  }
  input {
    font: inherit;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--ink);
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
