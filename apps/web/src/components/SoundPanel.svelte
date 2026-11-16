<!--
  The details of the sound card: how this device sounds, and where the band
  goes, as webmidi's patchbay (`@yggi/webmidi/ui`): the connection
  (`MidiStatus`), what went wrong lately, the setups (`SetupPicker`), the
  patch (`PatchMatrix`: the clock, the five parts, the keys, then the inputs with what each plays and the
  preset that assigns them, down; the built-in synth first, then the setup's
  MIDI outputs, across; with the control panels (below) as rows and columns
  too), the whole width of the sheet, and a column's
  settings in a dialog over it, opened from its head: an output's device (the
  matrix's own `DeviceDialog`, webmidi v0.5.0, which we feed `ontest` and
  `onpanic` by output key), or the synth's own (Jambot's: its volume, the
  card's, and the parts it plays; also a button under the patch). The synth is a column of the
  setup (webmidi's `BUILT_IN`, decision 004), so a setup can be MIDI only;
  it plays a part where the part's row crosses it (`synthPlays`). A change is
  a new book (`MidiSettings.book`), applied at once: `band-output.ts`
  silences what an old route held before adopting the new.

  Control panels (`PanelDeck`, `midi/panels.svelte.ts`; webmidi decisions 005
  and 007): the library's panels are chips over the patch that add them to the
  setup; an active panel is a row (what it sends, routed to outputs like an
  input's) and a column (what an input's or another panel's row sends it). It
  is played, edited, made and deleted under the patch (`PanelView`,
  `PanelEditor`). The band's own rows are no panel's to cross. A panel's row
  has the Plays choice an input's has: what it plays, the keys and the Muse
  hear as an input's notes (`Device`), none by default.

  MIDI sits in a boundary: whatever throws there (a setup kept by an older
  version, a port the browser lists oddly) is shown with its error and a way
  back (try again, or reset the MIDI settings), and the rest of the page
  goes on, where an error in a keyed list would have stopped it redrawing.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    BUILT_IN,
    DEFAULT_PRESET,
    HEARD,
    type LinkReport,
    type PortOption,
    type SetupBook,
    isBuiltIn,
    removeOutput,
    withCrossing,
  } from '@yggi/webmidi/core';
  import { MidiStatus, PatchMatrix, SetupPicker } from '@yggi/webmidi/ui';
  import { PanelEditor, PanelView } from '@yggi/webmidi/ui/panels';
  import { panelOf } from '@yggi/webmidi/panels';
  import type { PanelDeck } from '../midi/panels.svelte.ts';
  import {
    BAND,
    BAND_PARTS,
    BAND_ROWS,
    channelsTo,
    missingOutputs,
    synthPlays,
  } from '../midi/patch.ts';
  import type { MidiSettings } from '../midi/settings.svelte.ts';
  import Fader from './Fader.svelte';
  import Group from './Group.svelte';

  interface Props {
    settings: MidiSettings;
    /** Whether Web MIDI is connected. */
    connected: boolean;
    /** Asking for Web MIDI: Connect waits. */
    connecting?: boolean;
    /** The ports plugged in, as of the last look. */
    ports?: { inputs: readonly PortOption[]; outputs: readonly PortOption[] };
    message: string;
    /** What went wrong with MIDI lately, in words, the latest last. */
    problems?: readonly string[];
    /** The problems read: clear them. */
    ondismiss?: () => void;
    onconnect: () => void;
    /** Look at the ports again. */
    onrefresh?: () => void;
    /** All notes off, for hardware left sounding by a suspended tab or a dropped connection. */
    onpanic?: () => void;
    /** A test note on an output, by its key, on a channel 1–16. */
    ontest?: (key: string, channel: number) => void;
    /** Measure the link to an output, by its key, over the input of its loop (`Device.measureLink`): offered in the output's details. */
    onmeasure?: (
      key: string,
      run: Parameters<NonNullable<ComponentProps<typeof PatchMatrix>['onmeasure']>>[1],
    ) => Promise<LinkReport>;
    /** All notes off on one output, by its key. */
    onpanicoutput?: (key: string) => void;
    /** The synth's volume, a fader position 0–1: the Sound card's. */
    volume?: number;
    onvolume?: (volume: number) => void;
    /** The control panels: the library and the ones playing. None: no panels here. */
    deck?: PanelDeck;
  }

  let {
    settings,
    connected,
    connecting = false,
    ports = { inputs: [], outputs: [] },
    message,
    problems = [],
    ondismiss,
    onconnect,
    onrefresh,
    onpanic,
    ontest,
    onpanicoutput,
    onmeasure,
    volume = 1,
    onvolume,
    deck,
  }: Props = $props();

  const setup = $derived(settings.setup);
  const missing = $derived(missingOutputs(setup, ports.outputs));

  /** The synth's settings open: its own dialog, since the synth has no device (the matrix opens the devices' itself). */
  let inspecting = $state(false);
  const output = $derived(setup.outputs.find(isBuiltIn) ?? null);
  const SYNTH = 'Synth';
  /** The synth's part labels, as the matrix's rows name them. */
  const partLabel = (part: string) => BAND_ROWS.find((r) => r.id === part)?.label ?? part;
  /** The synth playing a part, or not: its crossing of the part's row. */
  const toggleSynth = (part: (typeof BAND_PARTS)[number]) =>
    change(
      withCrossing(
        settings.book,
        BAND,
        part,
        BUILT_IN.key,
        synthPlays(settings.book, part) ? undefined : HEARD,
      ),
    );
  /** Every part on the synth, or none. */
  const synthAll = (on: boolean) => {
    let book = settings.book;
    for (const part of BAND_PARTS)
      book = withCrossing(book, BAND, part, BUILT_IN.key, on ? HEARD : undefined);
    change(book);
  };

  /** Whether the panel shown is being edited, not played. */
  let editing = $state(false);
  const shown = $derived(deck?.shown ?? null);
  const runtime = $derived(deck?.runtimeOf(shown));
  const shownPanel = $derived(deck && shown !== null ? panelOf(deck.library, shown) : undefined);
  const activePanels = $derived(deck?.active ?? []);

  let dialog: HTMLDialogElement | undefined = $state();
  // The dialog follows what is inspected: shown modal (over everything, Escape closes it), or closed.
  $effect(() => {
    if (!dialog) return;
    if (inspecting && output && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!(inspecting && output) && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  });
  const close = () => (inspecting = false);

  /** A change of the book, kept; an output it no longer has closes the dialog (`output` is then null). */
  const change = (book: SetupBook) => (settings.book = book);

  /** The synth taken out of the setup, and its dialog closed. */
  function remove(key: string) {
    change(removeOutput(settings.book, key));
    inspecting = false;
  }

  /** A test note, on the first channel routed to the output (else 1). */
  const testOn = (key: string) => ontest?.(key, channelsTo(setup, key)[0] ?? 1);

  let confirmingReset = $state(false);
  function resetMidi() {
    confirmingReset = false;
    inspecting = false;
    settings.reset();
  }
</script>

<div class="sound wm-theme">
  <Group title="Patch">
    <svelte:boundary onerror={(error) => console.error('The MIDI settings stopped:', error)}>
      <MidiStatus
        {message}
        {connected}
        {connecting}
        {missing}
        {onconnect}
        {...onrefresh ? { onrefresh } : {}}
        {...onpanic ? { onpanic } : {}}
      />
      {#if problems.length}
        <div class="notes">
          <ul class="problems" role="alert" aria-label="MIDI problems">
            {#each problems as problem (problem)}<li>{problem}</li>{/each}
          </ul>
          {#if ondismiss}<button type="button" class="quiet" onclick={ondismiss}>Dismiss</button
            >{/if}
        </div>
      {/if}
      <SetupPicker book={settings.book} plugged={ports.outputs} onchange={change} />
      <div class="patch">
        <PatchMatrix
          book={settings.book}
          context={BAND}
          rows={BAND_ROWS}
          inputs={ports.inputs}
          outputs={ports.outputs}
          heardBy="the Muse"
          preset={DEFAULT_PRESET}
          builtIn={{ label: SYNTH }}
          {...deck ? { panels: deck.library.panels } : {}}
          onpanel={(id) => deck && (deck.shown = id)}
          onchange={change}
          {...ontest && connected ? { ontest: testOn } : {}}
          {...onpanicoutput && connected ? { onpanic: onpanicoutput } : {}}
          {...onmeasure && connected ? { onmeasure } : {}}
          onbuiltin={() => (inspecting = true)}
        />
      </div>
      {#if deck}
        <section class="panels" aria-label="Control panels">
          <div class="bar">
            <span class="hint">Panels</span>
            <div class="tabs" role="tablist" aria-label="The panels in this setup">
              {#each activePanels as p (p.id)}
                <button
                  type="button"
                  class="device"
                  role="tab"
                  aria-selected={shown === p.id}
                  onclick={() => (deck.shown = p.id)}>{p.name}</button
                >
              {/each}
            </div>
            <button
              type="button"
              class="device"
              aria-pressed={editing}
              disabled={!shownPanel}
              onclick={() => (editing = !editing)}>{editing ? 'Done editing' : 'Edit'}</button
            >
            <button
              type="button"
              class="device"
              onclick={() => {
                deck.create();
                editing = true;
              }}>New panel</button
            >
          </div>
          {#if editing && shownPanel}
            <PanelEditor panel={shownPanel} onchange={(edited) => deck.edit(edited)} />
            <div class="bar">
              <button
                type="button"
                class="device danger"
                onclick={() => {
                  deck.remove(shownPanel.id);
                  editing = false;
                }}>Delete this panel</button
              >
            </div>
          {:else if runtime && shown !== null}
            {@const id = shown}
            {#key runtime}
              <PanelView {runtime} onsend={(data) => deck.played(id, data)} />
            {/key}
          {:else}
            <p class="hint">
              No panel in this setup yet: add one from the chips over the patch, then route its row
              to an output. A panel plays on MIDI outputs, not on the built-in synth.
            </p>
          {/if}
        </section>
      {/if}
      {#if output}
        <div class="devices" role="group" aria-label="Device settings">
          <span class="hint">Device settings</span>
          <button type="button" class="device" onclick={() => (inspecting = true)}>
            <span class="slot">BUILT-IN</span>
            {SYNTH}
          </button>
        </div>
      {/if}
      <div class="reset">
        {#if confirmingReset}
          <span>Forget every MIDI setup and device setting on this device?</span>
          <button type="button" class="danger" onclick={resetMidi}>Reset MIDI settings</button>
          <button type="button" class="quiet" onclick={() => (confirmingReset = false)}>Keep</button
          >
        {:else}
          <button type="button" class="quiet" onclick={() => (confirmingReset = true)}
            >Reset MIDI settings…</button
          >
        {/if}
      </div>

      <dialog
        class="inspect"
        aria-label={`BUILT-IN: ${SYNTH}`}
        bind:this={dialog}
        onclose={close}
        onclick={(e) => e.target === dialog && close()}
      >
        {#if output && inspecting}
          <div class="frame">
            <button type="button" class="close" aria-label="Close" onclick={close}>×</button>
            <section class="synth" aria-labelledby="synth-title">
              <div class="block">
                <p class="eyebrow">
                  <span class="led" aria-hidden="true"></span>Built-in · this device
                </p>
                <h3 id="synth-title">{SYNTH}</h3>
                <p class="hint">
                  Plays the parts patched to it here, on this device's speakers. No port, no
                  channels.
                </p>
              </div>
              <div class="block">
                <Fader label="Volume" value={volume} onchange={(v) => onvolume?.(v)} />
                <p class="hint">The Sound card's volume: one fader, two places.</p>
              </div>
              <div class="block">
                <p class="eyebrow">Plays here</p>
                <div class="parts" role="group" aria-label="Parts the synth plays">
                  {#each BAND_PARTS as part (part)}
                    {@const on = synthPlays(settings.book, part)}
                    <button
                      type="button"
                      class="part"
                      aria-pressed={on}
                      onclick={() => toggleSynth(part)}>{partLabel(part)}</button
                    >
                  {/each}
                </div>
                <div class="row">
                  <button type="button" class="device" onclick={() => synthAll(true)}
                    >All parts</button
                  >
                  <button type="button" class="device" onclick={() => synthAll(false)}>None</button>
                </div>
                <p class="hint">
                  The keys you play sound with their part. The click always plays here.
                </p>
              </div>
              <div class="block">
                <button type="button" class="quiet" onclick={() => remove(output.key)}
                  >Remove from this setup</button
                >
                <p class="hint">
                  Removed, this setup plays MIDI only. + {SYNTH} under the patch's outputs brings it back.
                </p>
              </div>
            </section>
          </div>
        {/if}
      </dialog>

      {#snippet failed(error, reset)}
        <div class="failed" role="alert">
          <p>
            The MIDI settings hit a problem and were stopped, so the rest of Jambot keeps working.
          </p>
          <p class="error">
            <code>{error instanceof Error ? `${error.name}: ${error.message}` : String(error)}</code
            >
          </p>
          <div class="actions">
            <button type="button" onclick={reset}>Try again</button>
            <button
              type="button"
              class="danger"
              onclick={() => {
                resetMidi();
                reset();
              }}>Reset MIDI settings</button
            >
          </div>
        </div>
      {/snippet}
    </svelte:boundary>
  </Group>
</div>

<style>
  .wm-theme {
    /* webmidi's components in Jambot's colours (`app.css`), so they follow its theme */
    --wm-text: var(--ink);
    --wm-muted: var(--muted);
    --wm-faint: color-mix(in oklab, var(--muted) 65%, var(--surface));
    --wm-off: var(--line);
    --wm-line: var(--line);
    --wm-panel: var(--surface);
    --wm-panel-2: var(--bg);
    --wm-accent: var(--teal);
    /* the synth's ON chips: the ground's colour on the accent, legible in either theme */
    --wm-chip-on-ink: var(--surface);
    --wm-live: var(--teal);
    --wm-warn: var(--amber);
    --wm-surface: var(--surface);
    --wm-font: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --wm-font-num: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --wm-radius: 8px;
  }
  .sound {
    display: grid;
    gap: 14px;
    min-width: 0;
  }
  .patch {
    min-width: 0;
    padding: 8px 4px 4px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .notes {
    display: grid;
    gap: 6px;
    justify-items: start;
  }
  .problems {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 8px 12px 8px 28px;
    border: 1px solid var(--amber);
    border-radius: 8px;
    color: var(--ink);
    font-size: 14px;
  }
  .devices {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
  }
  .panels {
    display: grid;
    gap: 10px;
    min-width: 0;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .bar,
  .tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
  }
  .tabs [aria-selected='true'],
  .device[aria-pressed='true'] {
    border-color: var(--teal);
    background: var(--teal-bg);
  }
  .hint {
    color: var(--muted);
    font-size: 13px;
  }
  .device,
  .failed button,
  .reset button {
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--bg);
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .slot {
    margin-right: 4px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
  }
  .reset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  .quiet {
    border: 0 !important;
    background: none !important;
    color: var(--muted) !important;
    padding: 0 4px !important;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .danger {
    border-color: var(--amber) !important;
    color: var(--amber) !important;
  }
  .failed {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--amber);
    border-radius: 10px;
    font-size: 14px;
  }
  .failed p {
    margin: 0;
  }
  .error {
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  /* The device settings: a dialog over the page, a sheet from the bottom on a phone, centred where there is room. */
  .inspect {
    width: min(440px, 100vw);
    max-width: 100vw;
    max-height: 88svh;
    margin: auto auto 0;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 18px 18px 0 0;
    background: var(--surface);
    color: var(--ink);
    overflow: auto;
  }
  @media (min-width: 640px) and (min-height: 560px) {
    .inspect {
      margin: auto;
      border-radius: 18px;
    }
  }
  .inspect::backdrop {
    background: rgb(5 7 13 / 0.5);
  }
  .frame {
    position: relative;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  /* the synth's settings, in the dialog: laid out as webmidi's inspector is */
  .synth {
    display: grid;
  }
  .block {
    display: grid;
    gap: 10px;
    padding: 12px 14px;
  }
  .block + .block {
    border-top: 1px solid var(--line);
  }
  .synth h3 {
    margin: 0;
    font-size: 20px;
  }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--teal);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  .led {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--teal);
  }
  .synth .hint {
    margin: 0;
    font-size: 13px;
  }
  .parts,
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .part {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .part[aria-pressed='true'] {
    border-color: var(--teal);
    background: var(--teal-bg);
    color: var(--ink);
  }
  .close {
    position: absolute;
    top: 6px;
    right: 8px;
    z-index: 1;
    width: 40px;
    height: 40px;
    border: 0;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
  }
</style>
