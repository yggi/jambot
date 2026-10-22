<!--
  The session, a card: who the band plays with. The summary is the session
  by name (or "Solo"); the transport that starts and stops the band is the
  screen's header (`Transport`). The line under the name says the state ("Hosting · 2 joined", "Following · host
  playing"), and the glyph is the players as a network in their colours,
  pinging with each bar. The details are the players of a host, or the link
  of a client (its name, round trip, bars that came too late), and the way
  out: Close session for a host, Leave session for a client, Back to the
  lobby from solo. A band that leads itself, a host or solo, can be left on
  the radio (#313): it wanders the style alone, as a station does, until a
  person sets a preset or an axis it walks. Where the band is in style
  space, and where it heads, reads under "Now playing" for all of them, as
  the nearest presets. A host's session is open to anyone who finds it until
  the host asks for a code (#461): the code then shows here, for the host to
  read out, and another can be drawn. What the band learned (#398), a host's or solo's,
  reads as how many meters it kept and what the layer weighs, and the
  grooves the Muse filed (#401), each with who played it and its tags; it can be
  exported as JSON (with its filed fragments as fragment files, where it
  has any) and imported from one while the band is stopped. Ending a session that others are in asks first, in place,
  so a stray tap can't end a jam for everyone: a host is told how many are
  playing in its session. Solo shares nothing, so it goes back at once.
-->
<script lang="ts">
  import { COMPOSER, DRUMMER, type LearnedLayer, layerBytes } from '@jambot/engine';
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
    /** Whether the radio is on the air, here, where the band leads itself (#313). */
    radio?: boolean;
    /** Where the band is in style space, and where it heads, in words (`stationLine`), or null before it plays. */
    nowPlaying?: string | null;
    /** Put the radio on the air, or take it off. */
    ontune?: (on: boolean) => void;
    /** What the band learned, where this device keeps it (a host's, solo's; never a client's), and how to carry it (#398). */
    learned?: Learned | null;
    /** A host's: admit players by a code from now on, a fresh one each time, or by none (#461). */
    onadmit?: ((byCode: boolean) => void) | undefined;
  }

  interface Learned {
    layer: LearnedLayer;
    /** Whether the band plays: an import waits until it stops. */
    playing: boolean;
    /** Save the layer as a JSON file. */
    onexport: () => void;
    /** Save its filed fragments as fragment files. */
    onexportfiles: () => void;
    /** Take a layer from a file's text: null where it took, else why not. */
    onimport: (text: string) => string | null;
  }

  let {
    mode,
    hosting,
    following,
    players,
    playerId,
    phase = null,
    bar,
    onend,
    radio = false,
    nowPlaying = null,
    ontune,
    learned = null,
    onadmit,
  }: Props = $props();

  let asking = $state(false);

  /** What the last import said: that it took, or why not. */
  let imported: string | null = $state(null);

  /** The meters the layer kept (its uses of the facet `meter`), and what it weighs, in words; nothing yet where it learned nothing. */
  const learnedLine = (layer: LearnedLayer): string => {
    if (layer.points.length + layer.together.length + layer.filed.length === 0)
      return 'Nothing yet';
    const meters = new Set(layer.points.filter((p) => p.facet === 'meter').map((p) => p.id)).size;
    const kb = (layerBytes(layer) / 1000).toFixed(1);
    return `${meters} ${meters === 1 ? 'meter' : 'meters'} · ${kb} KB`;
  };

  /** A groove filed: who played it, its tags, and the groove it varies, where the composer varied one (#411). */
  interface Groove {
    id: string;
    source: string;
    tags: string[];
    varies: string | null;
  }

  /** Who played a groove, as a person reads it: the band's own by their part, a player by name. */
  const BAND_SOURCES: Readonly<Record<string, string>> = {
    [DRUMMER]: 'The drummer',
    [COMPOSER]: 'The composer',
  };

  /** The grooves the layer filed (its fragments of the facet `rhythm`, the composer's variations too), oldest first. */
  const groovesOf = (layer: LearnedLayer): Groove[] =>
    layer.filed
      .filter((f) => f.fragment.association.some((p) => p.facet === 'rhythm'))
      .map(({ fragment, meta }) => {
        const source = typeof meta.source === 'string' ? meta.source : '';
        return {
          id: fragment.id,
          source: BAND_SOURCES[source] ?? source,
          tags: Array.isArray(meta.tags)
            ? meta.tags.filter((t): t is string => typeof t === 'string')
            : [],
          varies: typeof meta.varies === 'string' ? meta.varies : null,
        };
      });

  async function take(input: HTMLInputElement, carry: Learned) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    imported = carry.onimport(await file.text()) ?? 'Imported: the next song starts from it.';
  }

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
    {#if onadmit}
      {@const code = hosting.code ?? null}
      <Group title="Admission">
        <label class="check">
          <input
            type="checkbox"
            checked={code !== null}
            onchange={(e) => onadmit(e.currentTarget.checked)}
          />
          Admit players by a code
        </label>
        {#if code !== null}
          <div class="actions">
            <output class="code" aria-label="Code">{code}</output>
            <button type="button" onclick={() => onadmit(true)}>Draw another code</button>
          </div>
          <p class="note">
            A player joins with this code, and anyone without it is turned away. Who is in already
            stays.
          </p>
        {:else}
          <p class="note">Anyone who finds the session can join it, under any free name.</p>
        {/if}
      </Group>
    {/if}
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

  {#if mode !== 'client' && ontune}
    <Group title="Radio">
      <label class="check">
        <input type="checkbox" checked={radio} onchange={(e) => ontune(e.currentTarget.checked)} />
        Leave the band on the radio
      </label>
      <p class="note">
        {radio
          ? 'It wanders the style by itself, a section at a time. Energy leans its tempo, entropy its variance. A preset or another axis takes it back.'
          : 'The band keeps the style you set.'}
      </p>
    </Group>
  {/if}
  {#if nowPlaying !== null}<Reading label="Now playing" value={nowPlaying} />{/if}

  {#if mode !== 'client' && learned}
    <Group title="Learned">
      <Reading label="Meters kept" value={learnedLine(learned.layer)} />
      {@const grooves = groovesOf(learned.layer)}
      {#if grooves.length > 0}
        <Reading label="Grooves filed" value={String(grooves.length)} />
        <ul aria-label="Grooves filed" class="grooves">
          {#each grooves as groove (groove.id)}
            <li>
              <b>{groove.source}</b>
              <ul class="tags" aria-label="Tags">
                {#each groove.tags as tag (tag)}<li class="tag">{tag}</li>{/each}
              </ul>
              {#if groove.varies !== null}<span class="varies">varies {groove.varies}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
      <div class="actions">
        <button type="button" onclick={learned.onexport}>Export</button>
        {#if learned.layer.filed.length > 0}
          <button type="button" onclick={learned.onexportfiles}>
            Export fragments ({learned.layer.filed.length})
          </button>
        {/if}
        <label class="file" class:disabled={learned.playing}>
          Import
          <input
            type="file"
            accept="application/json,.json"
            disabled={learned.playing}
            onchange={(e) => void take(e.currentTarget, learned!)}
          />
        </label>
      </div>
      <p class="note">
        {imported ??
          (learned.playing
            ? 'The band learns each meter and rhythm it keeps, and each groove it files, a section at a time. Stop it to import.'
            : 'The band learns each meter and rhythm it keeps, and each groove it files, a section at a time, and this browser keeps it.')}
      </p>
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
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  .grooves > li {
    flex-wrap: wrap;
    gap: 6px;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .grooves b {
    font-weight: 500;
  }
  .varies {
    font-size: 12px;
    color: var(--muted);
  }
  .tag {
    padding: 1px 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    font-size: 12px;
    color: var(--muted);
  }
  .code {
    font-size: 28px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.1em;
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
  .actions button,
  .file,
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
  .file {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }
  .file input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .file.disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ask .danger {
    border-color: var(--amber);
    background: var(--amber);
    color: var(--on-amber);
  }
</style>
