<!--
  The lobby, the door to the band: what a person meets on a cold start, laid
  out in the band's own cards. Under the hero icon: their name, made up
  already; playing alone (Solo); joining a session that is open, with the
  players in it; hosting one of their own, in this browser or through the
  lobby server; and the extras, folded at the bottom. It holds no session and knows
  no player: it takes props and sends what the person chose.
-->
<script lang="ts">
  import Card from '../components/Card.svelte';
  import Equalizer from '../components/glyphs/Equalizer.svelte';
  import LobbyGlyph from '../components/glyphs/Lobby.svelte';
  import Network from '../components/glyphs/Network.svelte';
  import type { Found, Listed, Where } from '../session/sessions.svelte.ts';

  interface Props {
    name: string;
    onname: (name: string) => void;
    /** The name field was left. */
    onsettle: () => void;
    /** The lobby server's address, empty for none. */
    address: string;
    onaddress: (url: string) => void;
    /** The sessions open and why some couldn't be listed, or null before the first look. */
    found: Found | null;
    /** A join is under way. */
    joining: boolean;
    /** Why the last session ended, or a join failed. */
    notice: string | null;
    onsolo: () => void;
    /** The timing test (#204, H7). */
    ontiming: () => void;
    onhost: (where: Where, session: string) => Promise<void>;
    onjoin: (where: Where, session: string) => void;
  }

  let {
    name,
    onname,
    onsettle,
    address,
    onaddress,
    found,
    joining,
    notice,
    onsolo,
    ontiming,
    onhost,
    onjoin,
  }: Props = $props();

  let session = $state('');
  let error: string | null = $state(null);
  // The address as typed; it is given once the person is done (`change`).
  // svelte-ignore state_referenced_locally
  let typed = $state(address);
  $effect(() => void (typed = address));

  const WHERE_TITLE: Record<Where, string> = {
    local: 'In this browser: between its tabs and windows.',
    global: 'Through the lobby server: anyone who gives its address can join.',
  };

  const count = (open: Listed) => `${open.players}`;

  async function host(where: Where) {
    error = null;
    try {
      await onhost(where, session);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
</script>

{#snippet nameField()}
  <input
    type="text"
    aria-label="Your name"
    value={name}
    oninput={(e) => onname(e.currentTarget.value)}
    onblur={onsettle}
    autocomplete="nickname"
  />
{/snippet}

{#snippet solo()}
  <button type="button" class="primary" disabled={joining} onclick={onsolo}>Solo</button>
{/snippet}

{#snippet sessionField()}
  <input
    type="text"
    aria-label="Session name"
    bind:value={session}
    autocomplete="off"
    placeholder="Friday jam"
  />
{/snippet}

{#snippet nameGlyph()}<LobbyGlyph kind="name" />{/snippet}
{#snippet soloGlyph()}<Equalizer levels={[0.35, 0.7, 0.5, 0.9]} />{/snippet}
{#snippet joinGlyph()}<Network colours={[1, 0, 2]} bar={null} />{/snippet}
{#snippet hostGlyph()}<LobbyGlyph kind="host" />{/snippet}
{#snippet extrasGlyph()}<LobbyGlyph kind="extras" />{/snippet}

{#snippet openSessions()}
  {#if joining}
    <p class="message">Joining…</p>
  {/if}
  {#if found !== null && found.sessions.length > 0}
    <div class="open">
      {#each found.sessions as open (`${open.where}:${open.name}`)}
        <button
          type="button"
          class="found {open.where}"
          title={WHERE_TITLE[open.where]}
          disabled={joining}
          onclick={() => onjoin(open.where, open.name)}
        >
          {open.name}
          <span class="count">{count(open)}</span>
        </button>
      {/each}
    </div>
  {/if}
  {#if found?.problem}
    <p class="message">{found.problem}</p>
  {/if}
{/snippet}

<div class="lobby">
  <div class="hero">
    <img src="{import.meta.env.BASE_URL}icon.svg" alt="" width="96" height="96" />
  </div>

  <Card title="Name" main={nameField} glyph={nameGlyph} />

  <Card title="Play with the band" main={solo} sub="on this device" glyph={soloGlyph} />

  {#if found !== null && (found.sessions.length > 0 || found.problem || joining)}
    <Card
      title="Join a session"
      main="{found.sessions.length} open"
      glyph={joinGlyph}
      open
      children={openSessions}
    />
  {:else}
    <Card
      title="Join a session"
      main={found === null ? 'Looking…' : 'None open yet'}
      glyph={joinGlyph}
    />
  {/if}

  <Card title="Host a session" main={sessionField} glyph={hostGlyph} open>
    <div class="actions">
      <button
        type="button"
        class="local"
        title={WHERE_TITLE.local}
        disabled={joining || session.trim() === ''}
        onclick={() => host('local')}>Local</button
      >
      <button
        type="button"
        class="global"
        title={WHERE_TITLE.global}
        disabled={joining || session.trim() === ''}
        onclick={() => host('global')}>Global</button
      >
    </div>
    <details class="advanced">
      <summary>Advanced</summary>
      <label>
        Lobby server
        <input
          type="text"
          bind:value={typed}
          onchange={() => onaddress(typed)}
          placeholder="none: this browser only"
          autocomplete="off"
          spellcheck="false"
        />
      </label>
      <p class="message">
        Every player gives the same lobby server: ws:// on a local network, wss:// when hosted.
      </p>
    </details>
  </Card>

  {#if error ?? notice}
    <p class="notice" role="status">{error ?? notice}</p>
  {/if}

  <Card title="Extras" main="Timing test" glyph={extrasGlyph}>
    <p class="message">
      A drum pattern plays and you follow it for eight bars, seeing at once how early or late each
      hit was. The runs are kept in this browser, to download and analyse.
    </p>
    <button type="button" disabled={joining} onclick={ontiming}>Timing test</button>
  </Card>
</div>

<style>
  .lobby {
    display: grid;
    gap: 10px;
  }
  .hero {
    display: grid;
    justify-items: center;
    padding: 4px 0 8px;
  }
  .hero img {
    border-radius: 22px;
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.18);
  }
  /* The lobby's cards are in a column, their details set out the same way. */
  .open,
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
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
  label {
    display: grid;
    gap: 2px;
    min-width: 0;
    font-size: 14px;
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
  .primary {
    min-height: 44px;
    padding: 0 22px;
    border: 0;
    border-radius: 22px;
    background: var(--amber);
    color: var(--on-amber);
    font-weight: 600;
    font-size: 16px;
  }
  /* A session in this browser is teal, one through the lobby server amber. */
  .local {
    border-color: var(--teal);
    background: var(--teal-bg);
  }
  .global {
    border-color: var(--amber);
  }
  .count {
    margin-left: 6px;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  summary {
    cursor: pointer;
    font-size: 14px;
    color: var(--muted);
  }
  .advanced {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }
  .message {
    font-size: 13px;
    color: var(--muted);
  }
  .notice {
    font-size: 14px;
    color: var(--amber);
  }
</style>
