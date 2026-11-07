<!--
  The details of the sound card: how this device sounds, in two sections.
  The built-in synth is one switch (its level is the card's volume). MIDI is
  webmidi's patchbay (`@yggi/webmidi/ui`): the connection (`MidiStatus`),
  what went wrong lately, the setups (`SetupPicker`), the patch
  (`PatchMatrix`: the clock, the five parts with the drum sounds' notes on
  each output, the keys, then the inputs with what each plays and the preset
  that assigns them, down; the setup's outputs across), the whole width of
  the sheet, and an output's device settings (`DeviceInspector`) in a dialog
  over it, opened from the output's head or its button under the patch. A
  change is a new book (`MidiSettings.book`), applied at once:
  `band-output.ts` silences what an old route held before adopting the new.

  MIDI sits in a boundary: whatever throws there (a setup kept by an older
  version, a port the browser lists oddly) is shown with its error and a way
  back (try again, or reset the MIDI settings), and the rest of the page
  goes on, where an error in a keyed list would have stopped it redrawing.
-->
<script lang="ts">
  import {
    DEFAULT_PRESET,
    type PortOption,
    type SetupBook,
    chooseDevice,
    forgetDevice,
    profileOf,
    removeOutput,
  } from '@yggi/webmidi/core';
  import { DeviceInspector, MidiStatus, PatchMatrix, SetupPicker } from '@yggi/webmidi/ui';
  import {
    BAND,
    BAND_ROWS,
    channelsTo,
    drumsTo,
    missingOutputs,
    withOutputProfile,
  } from '../midi/patch.ts';
  import type { MidiSettings } from '../midi/settings.svelte.ts';
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
  }: Props = $props();

  const setup = $derived(settings.setup);
  const missing = $derived(missingOutputs(setup, ports.outputs));

  /** The output whose device settings are open, by key, or null. */
  let inspecting: string | null = $state(null);
  const index = $derived(setup.outputs.findIndex((o) => o.key === inspecting));
  const output = $derived(index < 0 ? null : setup.outputs[index]!);

  let dialog: HTMLDialogElement | undefined = $state();
  // The dialog follows what is inspected: shown modal (over everything, Escape closes it), or closed.
  $effect(() => {
    if (!dialog) return;
    if (output && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!output && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  });
  const close = () => (inspecting = null);

  /** A change of the book, kept; an output it no longer has closes the dialog (`output` is then null). */
  const change = (book: SetupBook) => (settings.book = book);

  /** An output removed (the last is left with no device, its routes kept: webmidi's `removeOutput`), and its dialog closed. */
  function remove(key: string) {
    change(removeOutput(settings.book, key));
    inspecting = null;
  }

  const outLabel = (o: { id: string; name: string }) =>
    o.id === 'none' ? 'No device' : o.name || o.id;

  let confirmingReset = $state(false);
  function resetMidi() {
    confirmingReset = false;
    inspecting = null;
    settings.reset();
  }
</script>

<div class="sound wm-theme">
  <Group title="Built-in synth">
    <label class="check">
      <input
        type="checkbox"
        checked={settings.internal}
        onchange={(e) => (settings.internal = e.currentTarget.checked)}
      />
      Play the built-in synth
    </label>
  </Group>

  <Group title="MIDI">
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
          {...inspecting ? { selected: inspecting } : {}}
          onchange={change}
          onselect={(key) => (inspecting = key)}
        />
      </div>
      <div class="devices" role="group" aria-label="Device settings">
        <span class="hint">Device settings</span>
        {#each setup.outputs as o, i (o.key)}
          <button type="button" class="device" onclick={() => (inspecting = o.key)}>
            <span class="slot">OUT {i + 1}</span>
            {outLabel(o)}
          </button>
        {/each}
      </div>
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
        aria-label={output ? `OUT ${index + 1}: ${outLabel(output)}` : 'Device settings'}
        bind:this={dialog}
        onclose={close}
        onclick={(e) => e.target === dialog && close()}
      >
        {#if output}
          {@const used = channelsTo(setup, output.key)}
          <div class="frame">
            <button type="button" class="close" aria-label="Close" onclick={close}>×</button>
            <DeviceInspector
              {output}
              slot={index + 1}
              ports={ports.outputs}
              profile={profileOf(settings.book, output.name)}
              {used}
              drums={drumsTo(setup, output.key)}
              canRemove={setup.outputs.length > 1 || output.id !== 'none'}
              onport={(port) => change(chooseDevice(settings.book, output.key, port))}
              onprofile={(c) => change(withOutputProfile(settings.book, output, c))}
              onremove={() => remove(output.key)}
              {...Object.hasOwn(settings.book.devices, output.name)
                ? { onforget: () => change(forgetDevice(settings.book, output.name)) }
                : {}}
              {...ontest && connected ? { ontest: () => ontest(output.key, used[0] ?? 1) } : {}}
            />
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
  label {
    display: grid;
    gap: 2px;
    font-size: 14px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
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
