<!--
  The page: the container. It holds what belongs to the person and the
  device whichever screen is showing (their name, how it sounds,
  the player, the sessions) and picks the screen: the door, with the
  lobby and its extras, or the band that stands behind it (`screenOf`). The screens take
  props and send intents, and know nothing of the sessions or the device.
-->
<script lang="ts">
  import Card from './components/Card.svelte';
  import UpdateToast from './components/UpdateToast.svelte';
  import Fader from './components/Fader.svelte';
  import SoundPanel from './components/SoundPanel.svelte';
  import Equalizer from './components/glyphs/Equalizer.svelte';
  import TimingPanel from './components/TimingPanel.svelte';
  import Band from './screens/Band.svelte';
  import Door from './screens/Door.svelte';
  import { Awake } from './awake.ts';
  import { Device } from './device.svelte.ts';
  import { Instruments } from './instruments.svelte.ts';
  import { Metronome } from './metronome.svelte.ts';
  import { Player } from './player.svelte.ts';
  import { Profile, randomSessionName } from './profile.svelte.ts';
  import { Theme } from './theme.svelte.ts';
  import { equalizerLevels, soundSummary } from './sound.ts';
  import { screenOf } from './screen.ts';
  import { broadcastLobby } from './session/broadcast.ts';
  import { type Found, Sessions, type Where } from './session/sessions.svelte.ts';
  import { browserKept } from './session/storage.ts';
  import { filedFiles } from '@jambot/engine';
  import { layerText, readLayerText } from '@jambot/session';
  import { websocketLobby } from './session/websocket.ts';
  import { MeterPlayer } from './meter/meter-player.svelte.ts';
  import { WorkerAnalysis } from './tune/analysis.ts';
  import AnalysisWorker from './tune/analysis.worker.ts?worker';
  import { LiveCorrection } from './tune/live-correction.svelte.ts';
  import correctWorkletUrl from './tune/correct.worklet.ts?worker&url';
  import { withCorrected, withSynth } from './tune/loopback.ts';
  import { browserMic } from './tune/mic.ts';
  import { ToneSender } from './tune/sender.svelte.ts';
  import { Tuner } from './tune/tuner.svelte.ts';
  import { type TimingReport, timingFile, timingReport } from './timing.ts';
  import { runsCsv, runsFile } from './timing-test/run.ts';
  import { TimingRuns } from './timing-test/runs.ts';
  import { TimingTest } from './timing-test/session.svelte.ts';

  /** How often, in milliseconds, the lobby looks again for open sessions. */
  const LIST_EVERY = 3000;

  const device = new Device();
  /**
   * The click: the band's own steps sounded on this device's synth, so it is
   * client-only and a client keeps it while its other controls rest.
   */
  const metronome = new Metronome();
  /** The band, playing through cells (#399, #469). */
  const player = new Player(device.surroundings, metronome);
  // The radio is on the air by default: left alone, the band drifts through style space (#313).
  player.tuneRadio(true);
  /** The screen stays awake while the band plays or counts in, so a tablet on a stand doesn't lock mid-jam. */
  const awake = new Awake(navigator.wakeLock, document);
  $effect(() => awake.hold(player.playing));
  /**
   * The dev readout: how the band played through cells since the page opened (`window.jambot.shadow`), and
   * what the outputs played, event by event, from the one numbered `from` on, and the
   * transport's counters, the steps it laid and those the clock passed (#446), and a client's
   * network pair: its round trips, the reading trusted and the skew played by (#509);
   * and the homeostat's song, its leans and its cost (`homeostat`, #495), none where it is off.
   */
  window.jambot = {
    get shadow() {
      return player.shadow.readout;
    },
    get homeostat() {
      return player.hearing?.readout ?? null;
    },
    get timing() {
      return player.timing;
    },
    played: (from) => player.played.since(from),
    get network() {
      return sessions.asClient.timing;
    },
  };
  const instruments = new Instruments(player, device);
  const profile = new Profile();
  const theme = new Theme();
  const sessions = new Sessions(player, device.clocks, {
    tabs: broadcastLobby(),
    server: websocketLobby,
    address: import.meta.env.VITE_LOBBY_URL ?? '',
    kept: browserKept,
  });
  /** The timing test (#204, H7): plays a pattern on this device's synth and keeps every run. */
  const testing = new TimingTest({
    audio: () => device.clockOf(),
    now: () => performance.now(),
    taken: () => new Date().toISOString(),
    runs: new TimingRuns(),
    environment: (info) => ({
      userAgent: navigator.userAgent,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      sampleRate: info?.sampleRate ?? null,
      baseLatency: info?.baseLatency ?? null,
      outputLatency: info?.outputLatency ?? null,
      midiInputs: device.access?.inputs.map((input) => input.name) ?? [],
      timeOrigin: performance.timeOrigin,
    }),
  });
  /** The metronome (#259): a bar of any meter on this device's synth. */
  const meterPlayer = new MeterPlayer({ audio: () => device.clockOf() });
  /** The tuner (#269): listens to an input, and looks at its sound in a worker made at the first look. */
  const inputs = withSynth(browserMic(), () => device.clockOf().base.tap?.());
  /** The live correction (#298): takes the sound from an input and corrects it toward a scale in a worklet. */
  const correction = new LiveCorrection({ mic: inputs, moduleUrl: correctWorkletUrl });
  const tuner = new Tuner({
    mic: withCorrected(inputs, () => correction.outputTap()),
    analyse: new WorkerAnalysis(() => new AnalysisWorker()).analyse,
  });
  /** The note the tuner's screen holds, on this device's synth or a MIDI port, to tune an instrument by. */
  const sender = new ToneSender({
    ports: () => device.ports.outputs,
    port: (id) => device.access?.outputPort(id) ?? null,
    synth: () => device.clockOf().base,
  });
  const hostSession = sessions.asHost;
  const clientSession = sessions.asClient;

  // A page that was reloaded, or an app a phone closed in the background, takes
  // its session up again.
  void sessions.restore(Date.now() / 1000);

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
  /** Hand a file to the person: what they asked to download. */
  function download({ name, text }: { name: string; text: string }, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = Object.assign(document.createElement('a'), { href: url, download: name });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const exportTiming = () => download(timingFile(takeTiming()));
  /** What the band learned, carried to and from files from the Cells view (#398). */
  const layers = {
    onexport: () =>
      download({
        name: `jambot-layer-${new Date().toISOString().slice(0, 10)}.json`,
        text: layerText(player.layer),
      }),
    onexportfiles: () => {
      for (const file of filedFiles(player.layer)) download(file, 'text/markdown');
    },
    onimport: (text: string) => {
      const { layer, problem } = readLayerText(text);
      if (problem !== null) return `Not imported: ${problem}.`;
      return player.useLayer(layer) ? null : 'Stop the band to import.';
    },
  };
  const exportRuns = (kind: 'json' | 'csv') =>
    kind === 'json'
      ? download(runsFile(testing.saved))
      : download(runsCsv(testing.saved), 'text/csv');

  /**
   * MIDI notes in play along with the band, on the instruments, or, at the
   * timing test, taps timed by the message's own timestamp.
   */
  const connectMidi = () =>
    device.connect((note, source) =>
      extra === 'timing'
        ? testing.midi(note, source, note.timeStamp)
        : instruments.onMidiNote(note, source),
    );

  // A port chosen before is remembered (`MidiSettings`); reconnect to it without
  // waiting for a click, since a granted Web MIDI permission needs no gesture.
  if (device.remembersPorts) void connectMidi();

  /** Whether the person chose to play alone: not kept, so a reload lands on the door. */
  let soloChosen = $state(false);

  /** The door's view: Play (the lobby) or an extra. Not kept, so a reload lands on Play. */
  let doorView = $state('play');

  /** The band is fading out on its way to the door: it stays on screen until it has. */
  let leaving = $state(false);

  const screen = $derived(
    leaving
      ? 'band'
      : screenOf({
          mode: player.mode,
          clientStatus: clientSession.status,
          restoring: sessions.restoring,
          soloChosen,
        }),
  );

  /** The extra showing at the door, if one is: it runs only while its view shows. */
  const extra = $derived(screen === 'band' ? null : doorView);

  // A session takes the place of the choice to play alone, and of an extra.
  $effect(() => {
    if (player.mode !== 'solo') {
      soloChosen = false;
      doorView = 'play';
    }
  });

  // The test runs only on its own view, and takes the computer's keys there.
  $effect(() => {
    if (extra !== 'timing') testing.stop();
  });
  $effect(() => {
    if (extra === 'timing') return testing.listen();
  });

  // The metronome plays on its own view only.
  $effect(() => {
    if (extra !== 'meter') meterPlayer.stop();
  });

  // The tuner listens on its own view only: the microphone is let go of on leaving it, and a note held on it is released.
  $effect(() => {
    if (extra !== 'tune') {
      tuner.stop();
      sender.release();
      correction.stop();
    }
  });

  // Back at the door nothing plays on: a session that ended on its own, or
  // the way out, leaves the band as it was.
  $effect(() => {
    if (screen !== 'door') return;
    player.halt();
  });

  // The sessions open, while the door shows, and again when the lobby server changes.
  let found: Found | null = $state.raw(null);
  $effect(() => {
    if (screen !== 'door') return;
    let live = true;
    const look = async () => {
      const seen = await sessions.list();
      if (live) found = seen;
    };
    void look();
    const id = setInterval(() => void look(), LIST_EVERY);
    return () => {
      live = false;
      clearInterval(id);
    };
  });

  /** The name the person goes by, made up again if they left it empty. */
  const named = () => {
    profile.settle();
    return profile.name.trim();
  };

  /**
   * A session was joined and the band isn't heard yet: the master stays down
   * until it plays, then rises, so it doesn't come in at full volume. The
   * click that joins is what lets the browser play audio at all.
   */
  let comingIn = $state(false);
  $effect(() => {
    if (comingIn && player.status === 'playing') {
      comingIn = false;
      device.fadeIn();
    }
  });

  const host = (where: Where, session: string, byCode: boolean) =>
    sessions.host(where, session, named(), byCode);
  const join = (where: Where, session: string, code: string) => {
    device.mute();
    comingIn = true;
    void sessions.join(where, session, named(), code);
  };
  const solo = () => {
    sessions.dismiss();
    soloChosen = true;
    doorView = 'play';
  };
  /**
   * Close the session, leave it, or go back from solo to the lobby. What a
   * reload would come back to is forgotten at once, and a host's clients are
   * told; the band fades out, and the volume is back for what plays next.
   */
  async function leave() {
    if (leaving) return;
    leaving = true;
    comingIn = false;
    sessions.forget();
    if (hostSession.session !== null) sessions.end();
    if (player.playing) await device.fadeOut();
    sessions.end();
    player.halt();
    device.restore();
    soloChosen = false;
    leaving = false;
  }

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

  // The computer's keys play along with the band, behind the door only.
  $effect(() => {
    if (screen === 'band') return instruments.listen();
  });
</script>

<!-- How this device sounds: the container's, so it is here whichever screen shows. -->
{#snippet volume()}
  <Fader label="Volume" value={device.volume} onchange={(volume) => (device.volume = volume)} />
{/snippet}

{#snippet equalizer()}
  <Equalizer levels={equalizerLevels(player.sounding, device.volume)} />
{/snippet}

{#snippet soundCard()}
  <Card
    title="Sound"
    main={volume}
    sub={soundSummary(device.settings, device.ports, device.access !== null)}
    glyph={equalizer}
  >
    <SoundPanel
      settings={device.settings}
      access={device.access}
      ports={device.ports}
      message={device.message}
      onconnect={connectMidi}
      onrefresh={() => device.refresh()}
      onpanic={() => player.panicMidi()}
    />
  </Card>
{/snippet}

{#snippet timingPanel()}
  <TimingPanel report={timing} onexport={exportTiming} />
{/snippet}

{#if screen === 'band'}
  <Band
    {player}
    {metronome}
    {instruments}
    session={{
      hosting: {
        session: hostSession.session,
        guests: hostSession.guests,
        code: hostSession.code,
      },
      onadmit: (byCode: boolean) => hostSession.admitByCode(byCode),
      following: {
        status: clientSession.status,
        session: clientSession.session,
        name: clientSession.name,
        hostPlaying: clientSession.hostPlaying,
        hostAway: clientSession.hostAway,
        listening: clientSession.listening,
        trip: clientSession.trip,
        lacked: player.lacked,
      },
    }}
    onend={() => void leave()}
    {layers}
    sound={soundCard}
    timing={timingShown ? timingPanel : undefined}
  />
{:else}
  <Door
    bind:view={doorView}
    lobby={{
      suggest: randomSessionName,
      found,
      joining: clientSession.status === 'joining',
      notice: sessions.ended,
      onsolo: solo,
      onhost: host,
      onjoin: join,
    }}
    you={{
      name: profile.name,
      onname: (name) => (profile.name = name),
      onsettle: () => profile.settle(),
      onregenerate: () => profile.regenerate(),
    }}
    settings={{
      theme: theme.name,
      ontheme: (name) => (theme.name = name),
      address: sessions.address,
      onaddress: (url) => (sessions.address = url),
    }}
    restoring={screen === 'restoring'}
    ondrop={() => sessions.drop()}
    {tuner}
    {sender}
    {correction}
    metronome={meterPlayer}
    test={testing}
    onexport={exportRuns}
    sound={soundCard}
    counters={timingShown ? timingPanel : undefined}
  />
{/if}

<UpdateToast />
