<!--
  The lobby, the door to the band: what a person meets on a cold start, laid
  out in the band's own cards, under the page's title card. Their name, made
  up already, with a button for another; playing alone (Solo); joining a
  session that is open, with the players in it; hosting one of their own,
  named as they like or by a made-up name, in this browser or through the
  lobby server; and the extras, folded at the bottom. It holds no session and knows
  no player: it takes props and sends what the person chose.
-->
<script lang="ts">
  import Card from '../components/Card.svelte';
  import Regenerate from '../components/Regenerate.svelte';
  import Segmented from '../components/Segmented.svelte';
  import Lobby from '../components/glyphs/Lobby.svelte';
  import Network from '../components/glyphs/Network.svelte';
  import type { Found, Listed, Where } from '../session/sessions.svelte.ts';

  interface Props {
    name: string;
    onname: (name: string) => void;
    /** The name field was left. */
    onsettle: () => void;
    /** Make up another name. */
    onregenerate: () => void;
    /** A name to host a session under, made up: another each time it is asked. */
    suggest: () => string;
    /** The sessions open and why some couldn't be listed, or null before the first look. */
    found: Found | null;
    /** A join is under way. */
    joining: boolean;
    /** Why the last session ended, or a join failed. */
    notice: string | null;
    onsolo: () => void;
    /** The timing test (#204, H7). */
    ontiming: () => void;
    /** The metronome (#259). */
    onmeter: () => void;
    onhost: (where: Where, session: string) => Promise<void>;
    onjoin: (where: Where, session: string) => void;
  }

  let {
    name,
    onname,
    onsettle,
    onregenerate,
    suggest,
    found,
    joining,
    notice,
    onsolo,
    ontiming,
    onmeter,
    onhost,
    onjoin,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let session = $state(suggest());
  let where = $state<Where>('local');
  let error: string | null = $state(null);

  const WHERE_TITLE: Record<Where, string> = {
    local: 'In this browser: between its tabs and windows.',
    global: 'Through the lobby server: anyone who gives its address can join.',
  };
  const WHERE_NOTE: Record<Where, string> = {
    local: 'In this browser: its tabs and windows can join.',
    global: 'Through the lobby server: others can join.',
  };
  const WHERE_OPTIONS = [
    { value: 'local', text: 'Local', name: 'Local: in this browser', icon: local },
    { value: 'global', text: 'Global', name: 'Global: others can join', icon: globe },
  ] as const;

  const count = (open: Listed) => `${open.players}`;

  async function host() {
    error = null;
    try {
      await onhost(where, session);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
</script>

{#snippet local()}
  <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
    <rect x="1.5" y="3" width="13" height="10" rx="2" />
    <path d="M1.5 6.5 H14.5" />
  </svg>
{/snippet}

{#snippet globe()}
  <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
    <circle cx="8" cy="8" r="6.5" />
    <ellipse cx="8" cy="8" rx="2.7" ry="6.5" />
    <path d="M1.5 8 H14.5" />
  </svg>
{/snippet}

{#snippet nameField()}
  <div class="row">
    <input
      type="text"
      aria-label="Your name"
      value={name}
      oninput={(e) => onname(e.currentTarget.value)}
      onblur={onsettle}
      autocomplete="nickname"
    />
    <Regenerate label="Regenerate name" onclick={onregenerate} />
  </div>
{/snippet}

{#snippet solo()}
  <span class="play">
    Play
    <button type="button" class="primary" disabled={joining} onclick={onsolo}>Solo</button>
  </span>
{/snippet}

{#snippet hosting()}
  <div class="host">
    <div class="row">
      <input
        type="text"
        aria-label="Session name"
        bind:value={session}
        autocomplete="off"
        placeholder="Friday jam"
      />
      <Regenerate label="Regenerate session name" onclick={() => (session = suggest())} />
    </div>
    <div class="row">
      <Segmented
        label="Where"
        value={where}
        options={WHERE_OPTIONS}
        onselect={(chosen) => (where = chosen)}
      />
      <button
        type="button"
        class="primary"
        disabled={joining || session.trim() === ''}
        onclick={host}>Host</button
      >
    </div>
    <p class="message" title={WHERE_TITLE[where]}>{WHERE_NOTE[where]}</p>
  </div>
{/snippet}

{#snippet nameGlyph()}<Lobby kind="name" />{/snippet}
{#snippet soloGlyph()}<Network colours={[0]} bar={null} />{/snippet}
{#snippet joinGlyph()}<Network colours={[1, 0, 2]} bar={null} />{/snippet}
{#snippet hostGlyph()}<Lobby kind="host" />{/snippet}
{#snippet extrasGlyph()}<Lobby kind="gear" />{/snippet}

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
  <Card title="Name" main={nameField} glyph={nameGlyph} />

  <Card title="Play with the band" untitled main={solo} sub="with the band" glyph={soloGlyph} />

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

  <Card title="Host a session" main={hosting} glyph={hostGlyph} />

  {#if error ?? notice}
    <p class="notice" role="status">{error ?? notice}</p>
  {/if}

  <Card title="Extras" untitled main="Extras" glyph={extrasGlyph}>
    <p class="message">
      A drum pattern plays and you follow it for eight bars, seeing at once how early or late each
      hit was. The runs are kept in this browser, to download and analyse.
    </p>
    <button type="button" disabled={joining} onclick={ontiming}>Timing test</button>
    <p class="message">
      A bar of any meter, 3/4 to 12/8, played over and over, with its swing and its accents, to hear
      what a meter is.
    </p>
    <button type="button" disabled={joining} onclick={onmeter}>Metronome</button>
  </Card>
</div>

<style>
  .lobby {
    display: grid;
    gap: 10px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .host {
    display: grid;
    gap: 8px;
  }
  .row > :global(.segmented) {
    flex: 1 1 auto;
  }
  .play {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.1;
  }
  .open {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  input {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    font: inherit;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--ink);
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
    flex: none;
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
  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
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
