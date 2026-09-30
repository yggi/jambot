<!--
  The page: the container. It holds what belongs to the person and the
  device whichever screen is showing (their name, how it sounds,
  the player, the sessions) and picks the screen: the lobby, the
  door, or the band that stands behind it (`screenOf`). The screens take
  props and send intents, and know nothing of the sessions or the device.
-->
<script lang="ts">
  import Card from './components/Card.svelte';
  import TitleCard from './components/TitleCard.svelte';
  import Fader from './components/Fader.svelte';
  import SoundPanel from './components/SoundPanel.svelte';
  import Equalizer from './components/glyphs/Equalizer.svelte';
  import TimingPanel from './components/TimingPanel.svelte';
  import Band from './screens/Band.svelte';
  import Lobby from './screens/Lobby.svelte';
  import MeterScreen from './screens/Meter.svelte';
  import TuneScreen from './screens/Tune.svelte';
  import TimingTestScreen from './screens/TimingTest.svelte';
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
  import { websocketLobby } from './session/websocket.ts';
  import { MeterPlayer } from './meter/meter-player.svelte.ts';
  import { WorkerAnalysis } from './tune/analysis.ts';
  import AnalysisWorker from './tune/analysis.worker.ts?worker';
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
  const player = new Player(device.surroundings, metronome);
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
  const tuner = new Tuner({
    mic: browserMic(),
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
  const exportRuns = (kind: 'json' | 'csv') =>
    kind === 'json'
      ? download(runsFile(testing.saved))
      : download(runsCsv(testing.saved), 'text/csv');

  /**
   * MIDI notes in play along with the band, on the instruments, or, at the
   * timing test, taps timed by the message's own timestamp.
   */
  const connectMidi = () =>
    device.connect((note, source, timeStamp) =>
      screen === 'timing'
        ? testing.midi(note, source, timeStamp)
        : instruments.onMidiNote(note, source),
    );

  // A port chosen before is remembered (`MidiSettings`); reconnect to it without
  // waiting for a click, since a granted Web MIDI permission needs no gesture.
  if (device.remembersPorts) void connectMidi();

  /** Whether the person chose to play alone: not kept, so a reload lands on the door. */
  let soloChosen = $state(false);

  /** Whether the person chose the timing test: not kept, so a reload lands on the door. */
  let timingChosen = $state(false);

  /** Whether the person chose the metronome: not kept either. */
  let meterChosen = $state(false);

  /** Whether the person chose the tuner: not kept either. */
  let tuneChosen = $state(false);

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
          timingChosen,
          meterChosen,
          tuneChosen,
        }),
  );

  // A session takes the place of the choice to play alone, or to take the test.
  $effect(() => {
    if (player.mode !== 'solo') {
      soloChosen = false;
      timingChosen = false;
      meterChosen = false;
      tuneChosen = false;
    }
  });

  // The test runs only on its own screen, and takes the computer's keys there.
  $effect(() => {
    if (screen !== 'timing') testing.stop();
  });
  $effect(() => {
    if (screen === 'timing') return testing.listen();
  });

  // The metronome plays on its own screen only.
  $effect(() => {
    if (screen !== 'meter') meterPlayer.stop();
  });

  // The tuner listens on its own screen only: the microphone is let go of on leaving it, and a note held on it is released.
  $effect(() => {
    if (screen !== 'tune') {
      tuner.stop();
      sender.release();
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

  const host = (where: Where, session: string) => sessions.host(where, session, named());
  const join = (where: Where, session: string) => {
    device.mute();
    comingIn = true;
    void sessions.join(where, session, named());
  };
  const solo = () => {
    sessions.dismiss();
    soloChosen = true;
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

<main>
  <TitleCard
    theme={theme.name}
    ontheme={(name) => (theme.name = name)}
    address={sessions.address}
    onaddress={(url) => (sessions.address = url)}
  />

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

  {#if screen === 'band'}
    <Band
      {player}
      {metronome}
      {instruments}
      session={{
        hosting: { session: hostSession.session, guests: hostSession.guests },
        following: {
          status: clientSession.status,
          session: clientSession.session,
          name: clientSession.name,
          hostPlaying: clientSession.hostPlaying,
          hostAway: clientSession.hostAway,
          trip: clientSession.trip,
          lacked: player.lacked,
        },
      }}
      onend={() => void leave()}
    />
  {:else if screen === 'timing'}
    <TimingTestScreen test={testing} onback={() => (timingChosen = false)} onexport={exportRuns} />
  {:else if screen === 'meter'}
    <MeterScreen player={meterPlayer} onback={() => (meterChosen = false)} />
  {:else if screen === 'tune'}
    <TuneScreen {tuner} {sender} onback={() => (tuneChosen = false)} />
  {:else if screen === 'restoring'}
    <p class="message" role="status">Taking up your session again…</p>
  {:else}
    <Lobby
      name={profile.name}
      onname={(name) => (profile.name = name)}
      onsettle={() => profile.settle()}
      onregenerate={() => profile.regenerate()}
      suggest={randomSessionName}
      {found}
      joining={clientSession.status === 'joining'}
      notice={sessions.ended}
      onsolo={solo}
      ontiming={() => (timingChosen = true)}
      onmeter={() => (meterChosen = true)}
      ontune={() => (tuneChosen = true)}
      onhost={host}
      onjoin={join}
    />
  {/if}

  {#if timingShown}
    <div class="settings">
      <TimingPanel report={timing} onexport={exportTiming} />
    </div>
  {/if}
  <footer>
    <span>all rites reversed</span>
    <svg class="pentagon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <polygon points="10,2 18,8 15,17.5 5,17.5 2,8" />
    </svg>
    <span>kallisti collective, 3192 YOLD</span>
  </footer>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    /* The footer stays at the window's bottom where the content doesn't fill it. */
    min-height: 100dvh;
  }
  /* A phone on its side: tighter, so more of the cards show at once. */
  @media (max-height: 500px) {
    main {
      padding: 8px 14px;
    }
  }
  main > * {
    min-width: 0;
  }
  footer {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--muted);
    font-size: 13px;
  }
  .pentagon {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
  .settings {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .message {
    color: var(--muted);
    font-size: 14px;
  }
</style>
