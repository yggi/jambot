<script lang="ts">
  import Keyboard from './components/Keyboard.svelte';
  import KeyPicker from './components/KeyPicker.svelte';
  import MidiPanel from './components/MidiPanel.svelte';
  import Stage from './components/Stage.svelte';
  import StylePanel from './components/StylePanel.svelte';
  import Transport from './components/Transport.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { bandOutput } from './audio/band-output.ts';
  import { type ClockOffset, clockOffset } from './audio/clock-offset.ts';
  import { type Output, webAudioOutput } from './audio/output.ts';
  import { MidiAccess } from './midi/access.ts';
  import { COMPUTER_KEY_MAP, ignoreKeyEvent } from './midi/surfaces.ts';
  import { MidiSettings } from './midi/settings.svelte.ts';
  import { Player, browserSurroundings } from './player.svelte.ts';

  const midiSettings = new MidiSettings();

  /**
   * The audio clock and the offset it maps to MIDI's, made only once
   * something needs them: a browser starts audio only after a gesture, and
   * a test that never presses play or a key should never need one either.
   */
  let sharedBase: Output | null = null;
  let sharedOffset: ClockOffset | null = null;
  function clockOf(): { base: Output; offset: ClockOffset } {
    const base = (sharedBase ??= webAudioOutput());
    const offset = (sharedOffset ??= clockOffset(base));
    return { base, offset };
  }

  const player = new Player(
    browserSurroundings(() => {
      const { base, offset } = clockOf();
      return bandOutput(
        {
          internal: () => midiSettings.internal,
          port: () => midiSettings.outPort,
          channels: () => midiSettings.channels,
          clock: () => midiSettings.clock,
        },
        base,
        offset,
      );
    }),
  );

  const prototypeUrl = `${import.meta.env.BASE_URL}prototype.html`;

  let midiAccess: MidiAccess | null = $state(null);
  let midiMessage = $state(
    'Without MIDI, the built-in synth and the keys below still run the whole loop.',
  );
  /** Notes currently held, from any source, so the on-screen keyboard lights them too. */
  const held = new SvelteSet<number>();

  /** What every input source funnels through: the Muse (#2) reads `humanNotes` once it exists. */
  function onHumanNote(note: number, velocity: number, on: boolean, source: string) {
    if (on) held.add(note);
    else held.delete(note);
    if (on && player.playing)
      player.humanNoteOn(note, velocity, source, clockOf().offset.fromDeviceMs(performance.now()));
    if (midiSettings.thru) {
      const port = midiAccess?.outputPort(midiSettings.outPortId);
      const channel = (midiSettings.thruChannel - 1) & 15;
      port?.send(on ? [0x90 | channel, note, velocity] : [0x80 | channel, note, 0]);
    }
  }

  async function connectMidi() {
    const result = await MidiAccess.connect((note, source) =>
      onHumanNote(note.note, note.velocity, note.on, source),
    );
    if (typeof result === 'string') {
      midiMessage = result;
      return;
    }
    midiAccess = result;
    midiSettings.outPort =
      midiSettings.outPortId === 'none' ? null : midiAccess.outputPort(midiSettings.outPortId);
    midiAccess.listen(midiSettings.inPortId);
    const { inputs, outputs } = midiAccess;
    midiMessage = `MIDI connected: ${inputs.length} input${inputs.length === 1 ? '' : 's'}, ${outputs.length} output${outputs.length === 1 ? '' : 's'}.`;
  }

  $effect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (ignoreKeyEvent(e.target, e.repeat, e.metaKey || e.ctrlKey || e.altKey)) return;
      const note = COMPUTER_KEY_MAP[e.key.toLowerCase()];
      if (note !== undefined) onHumanNote(note, 100, true, 'the computer keys');
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const note = COMPUTER_KEY_MAP[e.key.toLowerCase()];
      if (note !== undefined) onHumanNote(note, 0, false, 'the computer keys');
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });
</script>

<main>
  <header>
    <h1>Jambot</h1>
    <p>You play, the Muse listens, the band answers.</p>
  </header>

  <Transport
    playing={player.playing}
    bpm={Math.round(player.track.bpm.to)}
    ontoggle={() => (player.playing ? player.stop() : player.start())}
    onintent={(intent) => player.apply(intent)}
  />

  <StylePanel
    track={player.track}
    style={player.hud.style}
    onintent={(intent) => player.apply(intent)}
  />

  <KeyPicker heading={player.hud.heading} onintent={(intent) => player.apply(intent)} />

  <Stage hud={player.hud} playing={player.playing} />

  <Keyboard
    down={held}
    onnote={(note, velocity, on) => onHumanNote(note, velocity, on, 'the on-screen keys')}
  />

  <MidiPanel
    settings={midiSettings}
    access={midiAccess}
    message={midiMessage}
    onconnect={connectMidi}
  />

  <p class="note">
    The band plays drums, bass, chords and lead, over MIDI or the built-in synth. The score, and the
    Muse's judgement of what you play, are still in the <a href={prototypeUrl}>prototype</a>.
  </p>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 14px;
    display: grid;
    gap: 14px;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  header p,
  .note {
    color: var(--muted);
    font-size: 14px;
  }
  a {
    color: var(--amber);
  }
</style>
