<script lang="ts">
  import DrumPads from './components/DrumPads.svelte';
  import Keyboard from './components/Keyboard.svelte';
  import KeyPicker from './components/KeyPicker.svelte';
  import Members from './components/Members.svelte';
  import MetronomePanel from './components/MetronomePanel.svelte';
  import MidiPanel from './components/MidiPanel.svelte';
  import MusePanel from './components/MusePanel.svelte';
  import SessionPanel from './components/SessionPanel.svelte';
  import Stage from './components/Stage.svelte';
  import StylePanel from './components/StylePanel.svelte';
  import Transport from './components/Transport.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { bandOutput } from './audio/band-output.ts';
  import { type ClockOffset, clockOffset, heardNow as heardOn } from './audio/clock-offset.ts';
  import { type Output, webAudioOutput } from './audio/output.ts';
  import { MidiAccess, type NoteHandler } from './midi/access.ts';
  import { connectMidi as connect, routeNote } from './midi/routing.ts';
  import { COMPUTER_KEY_MAP, DRUM_KEY_MAP, ignoreKeyEvent, partOf } from './midi/surfaces.ts';
  import { MidiSettings } from './midi/settings.svelte.ts';
  import { membersOf } from './members.ts';
  import { Metronome } from './metronome.svelte.ts';
  import { type AlongPart, Player, browserSurroundings } from './player.svelte.ts';
  import { broadcastLobby } from './session/broadcast.ts';
  import { websocketLobby } from './session/websocket.ts';
  import { ClientSession } from './session/client.svelte.ts';
  import { HostSession } from './session/host.svelte.ts';

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

  const heardNow = () => heardOn(clockOf().base);
  const tabs = broadcastLobby();
  /** A lobby server by its address, or with none given, the tabs of this browser. */
  const lobbyAt = (url: string) => (url.trim() === '' ? tabs : websocketLobby(url.trim()));
  const hostSession = new HostSession(player, heardNow);
  const clientSession = new ClientSession(player, heardNow);

  /**
   * The metronome: client-only, so it runs on its own next to the band
   * rather than through it, at whatever tempo the band is set to now — a
   * client keeps this even while its own controls rest.
   */
  const metronome = new Metronome(() => player.track.bpm.to);

  const prototypeUrl = `${import.meta.env.BASE_URL}prototype.html`;

  let midiAccess: MidiAccess | null = $state(null);
  let midiMessage = $state(
    'Without MIDI, the built-in synth and the keys below still run the whole loop.',
  );
  /** Notes currently held, from any source, so the keyboard and the pads light them too. */
  const heldLead = new SvelteSet<number>();
  const heldDrums = new SvelteSet<number>();

  const members = $derived(membersOf(player.hud, player.sounding));

  /**
   * A note source for one instrument: `routeNote` holds it, captures it for
   * the Muse (#79) and passes it thru, and it plays at once, along with the
   * band, on the part it belongs to.
   */
  function routerFor(part: AlongPart, held: SvelteSet<number>) {
    return (note: number, velocity: number, on: boolean, source: string) =>
      routeNote(note, velocity, on, source, {
        held,
        humanNoteOn: (n, v, s, seconds) => player.humanNoteOn(part, n, v, s, seconds),
        humanNoteOff: (n, s, seconds) => player.humanNoteOff(part, n, s, seconds),
        playing: () => player.playing,
        toOutputSeconds: (ms) => clockOf().offset.fromDeviceMs(ms),
        thru: () => midiSettings.thru,
        thruPort: () => midiAccess?.outputPort(midiSettings.outPortId) ?? null,
        thruChannel: () => midiSettings.thruChannel,
        playAlong: (n, v) => void player.playAlong(part, n, v),
      });
  }
  const routeToLead = routerFor('lead', heldLead);
  const routeToDrums = routerFor('drums', heldDrums);

  async function connectMidi() {
    /** Channel 10 plays the pads, every other channel the keyboard (`partOf`). */
    const onNote: NoteHandler = (note, source) =>
      (partOf(note.channel) === 'drums' ? routeToDrums : routeToLead)(
        note.note,
        note.velocity,
        note.on,
        source,
      );
    const result = await connect((handler) => MidiAccess.connect(handler), onNote, midiSettings);
    midiAccess = result.access;
    midiMessage = result.message;
  }

  $effect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (ignoreKeyEvent(e.target, e.repeat, e.metaKey || e.ctrlKey || e.altKey)) return;
      const lead = COMPUTER_KEY_MAP[e.key.toLowerCase()];
      if (lead !== undefined) return routeToLead(lead, 100, true, 'the computer keys');
      const drum = DRUM_KEY_MAP[e.key];
      if (drum !== undefined) routeToDrums(drum, 100, true, 'the computer keys');
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const lead = COMPUTER_KEY_MAP[e.key.toLowerCase()];
      if (lead !== undefined) return routeToLead(lead, 0, false, 'the computer keys');
      const drum = DRUM_KEY_MAP[e.key];
      if (drum !== undefined) routeToDrums(drum, 0, false, 'the computer keys');
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

  <SessionPanel
    mode={player.mode}
    hosting={{
      session: hostSession.session,
      guests: hostSession.guests,
      ended: hostSession.ended,
    }}
    following={{
      status: clientSession.status,
      session: clientSession.session,
      name: clientSession.name,
      hostPlaying: clientSession.hostPlaying,
      trip: clientSession.trip,
      ended: clientSession.ended,
      lacked: player.lacked,
    }}
    lobby={import.meta.env.VITE_LOBBY_URL ?? ''}
    onhost={(session, name, url) => hostSession.open(lobbyAt(url), session, name)}
    onjoin={(session, name, url) => clientSession.join(lobbyAt(url), session, name)}
    onlist={(url) => lobbyAt(url).sessions()}
    onclose={() => hostSession.close()}
    onleave={() => clientSession.leave()}
  />

  <!-- A client plays its host's song, style and key: its controls rest. -->
  <fieldset class="controls" disabled={player.mode === 'client'}>
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
  </fieldset>

  <Stage hud={player.hud} playing={player.playing} />

  <Members {members} />

  <MetronomePanel {metronome} />

  <Keyboard
    down={heldLead}
    scale={player.hud.bar?.scale ?? []}
    sounding={player.sounding.lead}
    onnote={(note, velocity, on) => routeToLead(note, velocity, on, 'the on-screen keys')}
  />

  <DrumPads
    down={heldDrums}
    sounding={player.sounding.drums}
    onnote={(note, velocity, on) => routeToDrums(note, velocity, on, 'the drum pads')}
  />

  <MusePanel muse={player.hud.muse} onforget={() => player.forgetMotif()} />

  <MidiPanel
    settings={midiSettings}
    access={midiAccess}
    message={midiMessage}
    onconnect={connectMidi}
  />

  <p class="note">
    The band plays drums, bass, chords and lead, over MIDI or the built-in synth. Join in on the
    keyboard or the pads above: a dot marks the current scale, and amber shows what the band's own
    lead and drums are playing. Play a few notes within a bar on the keyboard, and the Muse takes
    them as a motif the lead plays back from the bar after next. The score is still in the
    <a href={prototypeUrl}>prototype</a>.
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
  .controls {
    display: grid;
    gap: 14px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
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
