<script lang="ts">
  import Drawer from './components/Drawer.svelte';
  import DrumPads from './components/DrumPads.svelte';
  import Keyboard from './components/Keyboard.svelte';
  import KeyPicker from './components/KeyPicker.svelte';
  import Level from './components/Level.svelte';
  import MetronomePanel from './components/MetronomePanel.svelte';
  import MidiPanel from './components/MidiPanel.svelte';
  import MusePanel from './components/MusePanel.svelte';
  import Performers from './components/Performers.svelte';
  import SessionPanel from './components/SessionPanel.svelte';
  import Stage from './components/Stage.svelte';
  import TempoNudge from './components/TempoNudge.svelte';
  import StylePanel from './components/StylePanel.svelte';
  import TimingPanel from './components/TimingPanel.svelte';
  import Transport from './components/Transport.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { KEY_REACH } from '@jambot/engine';
  import { tempoView } from './conductor.ts';
  import { bandOutput } from './audio/band-output.ts';
  import { type ClockOffset, clockOffset } from './audio/clock-offset.ts';
  import { type Output, webAudioOutput } from './audio/output.ts';
  import { MidiAccess, type NoteHandler } from './midi/access.ts';
  import { connectMidi as connect, routeNote } from './midi/routing.ts';
  import { COMPUTER_KEY_MAP, DRUM_KEY_MAP, ignoreKeyEvent, partOf } from './midi/surfaces.ts';
  import { MidiSettings } from './midi/settings.svelte.ts';
  import { Metronome } from './metronome.svelte.ts';
  import { performersOf } from './performers.ts';
  import { type AlongPart, Player, browserSurroundings } from './player.svelte.ts';
  import { broadcastLobby } from './session/broadcast.ts';
  import { websocketLobby } from './session/websocket.ts';
  import { ClientSession } from './session/client.svelte.ts';
  import { HostSession } from './session/host.svelte.ts';
  import { type TimingReport, timingFile, timingReport } from './timing.ts';

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
          drumNotes: () => midiSettings.drumNotes,
          clock: () => midiSettings.clock,
        },
        base,
        offset,
      );
    }),
  );

  /** The device's clocks, as a session reads them: one output pair, shared with the band's output. */
  const clocks = {
    page: () => performance.now() / 1000,
    heardOffset: () => {
      const { offset } = clockOf();
      offset.update();
      return offset.heardOffset();
    },
  };
  const tabs = broadcastLobby();
  /** A lobby server by its address, or with none given, the tabs of this browser. */
  const lobbyAt = (url: string) => (url.trim() === '' ? tabs : websocketLobby(url.trim()));
  const hostSession = new HostSession(player, clocks);
  const clientSession = new ClientSession(player, clocks);

  /**
   * The metronome: client-only, so it runs on its own next to the band
   * rather than through it, at whatever tempo the band is set to now — a
   * client keeps this even while its own controls rest.
   */
  const metronome = new Metronome(() => player.track.bpm.to);

  /** The timing counters, read now: shown with `?timing` in the address (#27). */
  const timingShown = new URLSearchParams(location.search).has('timing');
  const takeTiming = (): TimingReport =>
    timingReport(
      {
        mode: player.mode,
        transport: player.timing,
        output: sharedOffset?.estimate ?? null,
        network: clientSession.timing,
        lacked: player.lacked,
      },
      { taken: new Date().toISOString(), userAgent: navigator.userAgent },
    );
  let timing: TimingReport = $state.raw(takeTiming());
  $effect(() => {
    if (!timingShown) return;
    const id = setInterval(() => (timing = takeTiming()), 500);
    return () => clearInterval(id);
  });
  function exportTiming() {
    const { name, text } = timingFile(takeTiming());
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: name });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const prototypeUrl = `${import.meta.env.BASE_URL}prototype.html`;

  let midiAccess: MidiAccess | null = $state(null);
  let midiMessage = $state(
    'Without MIDI, the built-in synth and the keys below still run the whole loop.',
  );
  /** Notes currently held, from any source, so the keyboard and the pads light them too. */
  const heldLead = new SvelteSet<number>();
  const heldDrums = new SvelteSet<number>();

  /** Whether this device follows a host, whose song, style and key it plays. */
  const following = $derived(player.mode === 'client');

  /** The connection, in one line, for its folded drawer. */
  const connectionStatus = $derived(
    player.mode === 'host'
      ? `Host of ${hostSession.session}`
      : player.mode === 'client'
        ? `Guest in ${clientSession.session}`
        : 'Solo',
  );

  const performers = $derived(performersOf(player.hud, player.sounding, player.pattern));

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

  // A port chosen before is remembered (`MidiSettings`); reconnect to it without
  // waiting for a click, since a granted Web MIDI permission needs no gesture.
  if (midiSettings.outPortId !== 'none' || midiSettings.inPortId !== 'none') void connectMidi();

  $effect(() => {
    // A phone or a tab suspended mid-note can leave hardware sounding one
    // whose release a frozen clock never got to schedule; silence it on wake.
    const onVisible = () => {
      if (document.visibilityState === 'visible') player.panicMidi();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

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

  <!-- What isn't the music: how this device connects, folded until wanted. -->
  <div class="settings">
    <Drawer name="Connection" status={connectionStatus}>
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
    </Drawer>

    <Drawer name="MIDI and sound" status={midiAccess ? 'MIDI connected' : 'Built-in synth'}>
      <MidiPanel
        settings={midiSettings}
        access={midiAccess}
        message={midiMessage}
        onconnect={connectMidi}
        onpanic={() => player.panicMidi()}
      />
    </Drawer>

    {#if timingShown}
      <TimingPanel report={timing} onexport={exportTiming} />
    {/if}
  </div>

  <!--
    The music, in the order of the composition, from the whole song down to
    each note. A client plays its host's song, style and key, so those
    levels' controls rest; its metronome and instruments are its own.
  -->
  <Level name="Transport" resting={following}>
    <Transport
      playing={player.playing}
      ontoggle={() => (player.playing ? player.stop() : player.start())}
    />
  </Level>

  <Level name="Style" resting={following}>
    <StylePanel
      track={player.track}
      style={player.hud.style}
      onintent={(intent) => player.apply(intent)}
    />
  </Level>

  <Level name="Metrum">
    <TempoNudge
      tempo={tempoView(player.track, player.tempoNudge)}
      disabled={following}
      onintent={(intent) => player.apply(intent)}
    />
    <MetronomePanel {metronome} />
  </Level>

  <Level name="Key" resting={following}>
    <KeyPicker
      heading={player.hud.heading}
      reach={KEY_REACH}
      history={player.harmonicHistory}
      onintent={(intent) => player.apply(intent)}
    />
  </Level>

  <Level name="Plan and chords">
    <Stage hud={player.hud} playing={player.playing} />
  </Level>

  <Level name="Tracks">
    <Performers {performers} />

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
  </Level>

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
    gap: 22px;
  }
  main > * {
    min-width: 0;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .settings {
    display: grid;
    gap: 8px;
    min-width: 0;
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
