<!--
  The page: it holds the player and hands each component its props; components take props and send intents.
  The music runs top to bottom in the order of the composition, one `Level` each, and the settings sit in `Drawer`s above it.
-->
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
  import { KEY_REACH } from '@jambot/engine';
  import { tempoView } from './conductor.ts';
  import { Device } from './device.svelte.ts';
  import { Instruments } from './instruments.svelte.ts';
  import { Metronome } from './metronome.svelte.ts';
  import { performersOf } from './performers.ts';
  import { Player } from './player.svelte.ts';
  import { broadcastLobby } from './session/broadcast.ts';
  import { websocketLobby } from './session/websocket.ts';
  import { Sessions } from './session/sessions.svelte.ts';
  import { browserKept } from './session/storage.ts';
  import { type TimingReport, timingFile, timingReport } from './timing.ts';

  const device = new Device();
  const player = new Player(device.surroundings);
  const instruments = new Instruments(player, device);
  const { clocks } = device;
  const sessions = new Sessions(player, clocks, {
    tabs: broadcastLobby(),
    server: websocketLobby,
    address: import.meta.env.VITE_LOBBY_URL ?? '',
    kept: browserKept,
  });
  const hostSession = sessions.asHost;
  const clientSession = sessions.asClient;

  // A page that was reloaded, or an app a phone closed in the background, takes
  // its session up again.
  void sessions.restore(Date.now() / 1000);

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
        output: device.offsetEstimate,
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

  /** MIDI notes in play along with the band, on the instruments. */
  const connectMidi = () => device.connect(instruments.onMidiNote);

  // A port chosen before is remembered (`MidiSettings`); reconnect to it without
  // waiting for a click, since a granted Web MIDI permission needs no gesture.
  if (device.remembersPorts) void connectMidi();

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

  const performers = $derived(
    performersOf(player.hud, player.sounding, player.pattern, player.players),
  );

  $effect(() => {
    // A phone or a tab suspended mid-note can leave hardware sounding one
    // whose release a frozen clock never got to schedule; silence it on wake.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        player.panicMidi();
        // Its sockets may have been closed, or left open and dead, meanwhile.
        clientSession.wake();
      } else hostSession.persist();
    };
    const onWake = () => clientSession.wake();
    const onGone = () => hostSession.persist();
    document.addEventListener('visibilitychange', onVisible);
    addEventListener('pageshow', onWake);
    addEventListener('online', onWake);
    addEventListener('pagehide', onGone);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      removeEventListener('pageshow', onWake);
      removeEventListener('online', onWake);
      removeEventListener('pagehide', onGone);
    };
  });

  $effect(() => instruments.listen());
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
          hostAway: clientSession.hostAway,
          trip: clientSession.trip,
          ended: clientSession.ended,
          lacked: player.lacked,
        }}
        lobby={sessions.address}
        onhost={(session, name, url) => {
          sessions.address = url;
          return sessions.host(url.trim() === '' ? 'local' : 'global', session, name);
        }}
        onjoin={(session, name, url) => {
          sessions.address = url;
          return sessions.join(url.trim() === '' ? 'local' : 'global', session, name);
        }}
        onlist={async (url) => {
          sessions.address = url;
          return (await sessions.list()).sessions;
        }}
        onclose={() => sessions.end()}
        onleave={() => sessions.end()}
      />
    </Drawer>

    <Drawer name="MIDI and sound" status={device.access ? 'MIDI connected' : 'Built-in synth'}>
      <MidiPanel
        settings={device.settings}
        access={device.access}
        message={device.message}
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

  <Level name="Key">
    <KeyPicker
      {following}
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
      down={instruments.heldLead}
      scale={player.hud.bar?.scale ?? []}
      sounding={player.sounding.lead}
      onnote={(note, velocity, on) => instruments.toLead(note, velocity, on, 'the on-screen keys')}
    />

    <DrumPads
      down={instruments.heldDrums}
      sounding={player.sounding.drums}
      onnote={(note, velocity, on) => instruments.toDrums(note, velocity, on, 'the drum pads')}
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
