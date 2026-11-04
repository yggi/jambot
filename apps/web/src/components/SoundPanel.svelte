<!--
  The details of the sound card: how this device sounds, in two sections.
  The built-in synth is one switch (its level is the card's volume). MIDI is
  webmidi's patchbay (`@yggi/webmidi/ui`): the connection (`MidiStatus`),
  the setups (`SetupPicker`), the patch (`PatchMatrix`: the five parts and
  the keys, then the inputs with their Heard switches and the clock, down;
  the setup's outputs across) and the output selected (`DeviceInspector`),
  with Jambot's drum notes by sound under it where the drums go there. A
  change is a new book (`MidiSettings.book`), applied at once:
  `band-output.ts` silences what an old route held before adopting the new.
-->
<script lang="ts">
  import { type DrumSound } from '@jambot/engine';
  import { type PortOption, chooseDevice, profileOf, removeOutput } from '@yggi/webmidi/core';
  import { DeviceInspector, MidiStatus, PatchMatrix, SetupPicker } from '@yggi/webmidi/ui';
  import { DRUM_SOUNDS, drumMapOf, drumNotesOf } from '../midi/drums.ts';
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
    onconnect,
    onrefresh,
    onpanic,
    ontest,
  }: Props = $props();

  const LABELS: Record<DrumSound, string> = {
    kick: 'Kick',
    rim: 'Rim',
    snare: 'Snare',
    clap: 'Clap',
    closedHat: 'Closed hat',
    pedalHat: 'Pedal hat',
    openHat: 'Open hat',
    ride: 'Ride',
  };

  const setup = $derived(settings.setup);
  /** The output the inspector shows, by key: the one chosen, else the first. */
  let chosen: string | undefined = $state();
  const index = $derived(
    Math.max(
      0,
      setup.outputs.findIndex((o) => o.key === chosen),
    ),
  );
  const output = $derived(setup.outputs[index]!);
  const profile = $derived(profileOf(settings.book, output.name));
  const drums = $derived(drumsTo(setup, output.key));
  const used = $derived(channelsTo(setup, output.key));
  const notes = $derived(drumNotesOf(profile.drums));
  const missing = $derived(missingOutputs(setup, ports.outputs));

  const clampNote = (value: string) => Math.max(0, Math.min(127, Math.round(+value) || 0));

  function setDrumNote(sound: DrumSound, value: string) {
    const map = drumMapOf({ ...notes, [sound]: clampNote(value) }, profile.drums);
    settings.book = withOutputProfile(settings.book, output, { drums: map });
  }
</script>

<div class="sound">
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
    <MidiStatus
      {message}
      {connected}
      {connecting}
      {missing}
      {onconnect}
      {...onrefresh ? { onrefresh } : {}}
      {...onpanic ? { onpanic } : {}}
    />
    <SetupPicker
      book={settings.book}
      plugged={ports.outputs}
      onchange={(book) => (settings.book = book)}
    />
    <div class="rack">
      <div class="patch">
        <PatchMatrix
          book={settings.book}
          context={BAND}
          rows={BAND_ROWS}
          inputs={ports.inputs}
          outputs={ports.outputs}
          heardBy="the Muse"
          selected={output.key}
          onchange={(book) => (settings.book = book)}
          onselect={(key) => (chosen = key)}
        />
      </div>
      <div class="inspector">
        <DeviceInspector
          {output}
          slot={index + 1}
          ports={ports.outputs}
          {profile}
          {used}
          {drums}
          canRemove={setup.outputs.length > 1}
          onport={(port) => (settings.book = chooseDevice(settings.book, output.key, port))}
          onprofile={(change) => (settings.book = withOutputProfile(settings.book, output, change))}
          onremove={() => (settings.book = removeOutput(settings.book, output.key))}
          {...ontest && connected ? { ontest: () => ontest(output.key, used[0] ?? 1) } : {}}
        />
        {#if drums && output.id !== 'none'}
          <details class="notes">
            <summary>Drum notes by sound</summary>
            <div class="chs">
              {#each DRUM_SOUNDS as sound (sound)}
                <label>
                  {LABELS[sound]}
                  <input
                    type="number"
                    min="0"
                    max="127"
                    value={notes[sound]}
                    onchange={(e) => setDrumNote(sound, e.currentTarget.value)}
                  />
                </label>
              {/each}
            </div>
          </details>
        {/if}
      </div>
    </div>
  </Group>
</div>

<style>
  .sound {
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
    display: grid;
    gap: 14px;
    min-width: 0;
    container-type: inline-size;
  }
  .rack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    min-width: 0;
  }
  /* Where there is room, the inspector sits beside the patch, as in the mockup. */
  @container (min-width: 760px) {
    .rack {
      grid-template-columns: minmax(0, 1fr) 300px;
      align-items: start;
    }
  }
  .patch,
  .inspector {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .patch {
    padding: 8px 4px 4px;
  }
  .notes {
    padding: 0 14px 12px;
  }
  .notes summary {
    min-height: 34px;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
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
  input[type='number'] {
    font: inherit;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    min-height: 34px;
    width: 64px;
    padding: 0 8px;
  }
  .chs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 6px 10px;
  }
</style>
