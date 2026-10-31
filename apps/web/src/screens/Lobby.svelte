<!--
  The lobby, the door to the band: the door's Play view, what a person meets
  on a cold start, laid out in the band's own cards. Playing alone (Solo);
  joining a session that is open, with the players in it, and with the code
  its host admits by where the person was given one (#461), but not one whose
  host is away, which the lobby would refuse (#496); hosting one of
  their own, named as they like or by a made-up name, in this browser or
  through the lobby server. Their name and the extras are the door's own
  (`Door.svelte`). It holds no session and knows no player: it takes props
  and sends what the person chose. Its glyphs are live: Solo's network pings
  for each note the person strikes, and Join's has a node for each session
  open round the person, pinging at each look at the list.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import Card from '../components/Card.svelte';
  import Regenerate from '../components/Regenerate.svelte';
  import Segmented from '../components/Segmented.svelte';
  import Lobby from '../components/glyphs/Lobby.svelte';
  import Network from '../components/glyphs/Network.svelte';
  import type { Found, Listed, Where } from '../session/sessions.svelte.ts';

  interface Props {
    /** A name to host a session under, made up: another each time it is asked. */
    suggest: () => string;
    /** The sessions open and why some couldn't be listed, or null before the first look. */
    found: Found | null;
    /** A join is under way. */
    joining: boolean;
    /** Why the last session ended, or a join failed. */
    notice: string | null;
    onsolo: () => void;
    /** Open a session, admitting players by a code from the start where `byCode` (#461). */
    onhost: (where: Where, session: string, byCode: boolean) => Promise<void>;
    /** Join an open session, with the code typed, or an empty one for none. */
    onjoin: (where: Where, session: string, code: string) => void;
    /** How many notes the person has struck, on any instrument: the solo band's glyph pings for each. */
    struck?: number;
  }

  let { suggest, found, joining, notice, onsolo, onhost, onjoin, struck = 0 }: Props = $props();

  /** How many looks at the sessions open have come back: the join glyph pings at each. */
  let looks = $state(0);
  $effect.pre(() => {
    if (found) untrack(() => looks++);
  });
  /** The join glyph: you in the middle, a node round you for each session open (five at most). */
  const joinColours = $derived([
    0,
    ...(found?.sessions ?? []).slice(0, 5).map((_, i) => (i % 5) + 1),
  ]);

  // svelte-ignore state_referenced_locally
  let session = $state(suggest());
  let where = $state<Where>('local');
  let code = $state('');
  let byCode = $state(false);
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

  const count = (open: Listed) => `${open.players}${open.away ? ' · away' : ''}`;
  const AWAY_TITLE =
    'Its host has lost its link and may be back in a moment: it takes no join till then.';

  async function host() {
    error = null;
    try {
      await onhost(where, session, byCode);
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
    <label class="check">
      <input type="checkbox" bind:checked={byCode} />
      By code: players need it to play; without it they listen
    </label>
  </div>
{/snippet}

{#snippet soloGlyph()}<Network colours={[0]} bar={struck > 0 ? struck : null} />{/snippet}
{#snippet joinGlyph()}<Network colours={joinColours} bar={looks > 0 ? looks : null} />{/snippet}
{#snippet hostGlyph()}<Lobby kind="host" />{/snippet}

{#snippet openSessions()}
  {#if joining}
    <p class="message">Joining…</p>
  {/if}
  {#if found !== null && found.sessions.length > 0}
    <input
      type="text"
      class="code"
      aria-label="Code"
      inputmode="numeric"
      autocomplete="off"
      placeholder="Code, if the host gave you one"
      bind:value={code}
    />
    <div class="open">
      {#each found.sessions as open (`${open.where}:${open.name}`)}
        <button
          type="button"
          class="found {open.where}"
          title={open.away ? AWAY_TITLE : WHERE_TITLE[open.where]}
          disabled={joining || open.away === true}
          onclick={() => onjoin(open.where, open.name, code.trim())}
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
  .code {
    margin-bottom: 8px;
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
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  /* A checkbox keeps its own size beside its words: the text inputs' stretch is not for it. */
  .check input {
    flex: none;
    width: auto;
  }
  .notice {
    font-size: 14px;
    color: var(--amber);
  }
</style>
